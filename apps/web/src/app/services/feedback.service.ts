import { Injectable, signal } from '@angular/core';
import type { Cue, FeedbackEvent } from './feedback-event';
import { soundPalette } from './sound-palette';

const notes: Record<Cue, readonly number[]> = {
  tap: [520], lock: [440, 660], start: [330, 440, 660], reveal: [330, 494],
  score: [523, 659, 784], finish: [392, 523, 659, 784], error: [220, 185], tick: [880],
  hurry: [660, 880], urgent: [1047, 1047], timeup: [880, 660, 440],
  correct: [523, 659, 784, 1047], close: [440, 554, 659], incorrect: [330, 262],
  assign:[659,988], higher:[392,523,659], lower:[659,523,392]
};

@Injectable({ providedIn: 'root' })
export class FeedbackService {
  gameId: string | null = null;
  readonly audioStatus = signal('');
  readonly soundOn = signal(this.readPreference());
  readonly notice = signal<(FeedbackEvent & { id: number }) | null>(null);
  private context: AudioContext | null = null;
  private master: GainNode | null = null;
  private expiry: ReturnType<typeof setTimeout> | undefined;
  private serial = 0;
  private lastPlayed = 0;

  toggleSound(): void {
    this.soundOn.update(value => !value);
    try { localStorage.setItem('nightshift.sound', this.soundOn() ? 'on' : 'off'); } catch { /* Preference remains session-local. */ }
    if (this.master) this.master.gain.value = this.soundOn() ? .18 : 0;
    if (this.soundOn()) {
      this.unlock();
      if (this.context) void this.context.resume().then(() => this.play('lock')).catch(() => undefined);
    }
  }

  // Called synchronously from a user gesture. Never request autoplay permission or queue old cues.
  unlock(): void {
    if (!this.soundOn()) return;
    try {
      if (!this.context) {
        this.context = new AudioContext();
        this.master = this.context.createGain();
        this.master.gain.value = .18;
        this.master.connect(this.context.destination);
      }
      if (this.context.state === 'suspended') void this.context.resume().catch(() => this.audioStatus.set('Audio is blocked. Try Test sound again or open this page in your browser.'));
    } catch { this.audioStatus.set('Audio is unavailable in this browser.'); }
  }

  async testSound(): Promise<void> {
    if (!this.soundOn()) this.toggleSound();
    this.unlock();
    this.audioStatus.set('Starting audio…');
    if (!this.context) { this.audioStatus.set('Audio is unavailable in this browser.'); return; }
    try {
      await this.context.resume();
      if (this.context.state !== 'running') { this.audioStatus.set('Audio is blocked. Open this page in your browser and try again.'); return; }
      this.play('correct');
      this.audioStatus.set('Test tone sent to the browser. If silent, check the tab mute and your audio output.');
    } catch { this.audioStatus.set('Audio could not start. Open this page in your browser and try again.'); }
  }

  show(event: FeedbackEvent): void {
    this.notice.set({ ...event, id: ++this.serial });
    clearTimeout(this.expiry);
    this.expiry = setTimeout(() => this.notice.set(null), 2800);
    this.play(event.cue);
  }

  play(cue: Cue): void {
    const ctx = this.context;
    if (!this.soundOn() || !ctx || !this.master || document.hidden) return;
    if (ctx.state === 'suspended') {
      const requestedAt = performance.now();
      void ctx.resume().then(() => {
        if (ctx.state === 'running' && performance.now() - requestedAt < 500) this.play(cue);
      }).catch(() => this.audioStatus.set('Audio is blocked. Try Test sound.'));
      return;
    }
    if (ctx.state !== 'running') return;
    // Suppress overlapping taps; important game cues can still replace a recent tap.
    if (cue === 'tap' && performance.now() - this.lastPlayed < 100) return;
    this.lastPlayed = performance.now();
    const palette = soundPalette(this.gameId);
    const alarm = cue === 'hurry' || cue === 'urgent' || cue === 'timeup' || cue === 'tick';
    const melody = cue === 'correct' || cue === 'finish' ? palette.victory : notes[cue];
    melody.forEach((frequency, index) => {
      const oscillator = ctx.createOscillator();
      const gain = ctx.createGain();
      const start = ctx.currentTime + index * (alarm ? .085 : palette.spacing);
      const duration = cue === 'tick' || cue === 'tap' ? .12 : cue === 'timeup' ? .3 : palette.duration;
      const level = alarm ? 1.8 : palette.level;
      oscillator.type = alarm ? 'triangle' : palette.wave; oscillator.frequency.value = frequency * (alarm || cue === 'correct' || cue === 'finish' ? 1 : palette.pitch);
      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(level, start + .008);
      gain.gain.setValueAtTime(level, start + .045);
      gain.gain.exponentialRampToValueAtTime(.001, start + duration);
      oscillator.connect(gain); gain.connect(this.master!);
      oscillator.start(start); oscillator.stop(start + duration + .01);
      oscillator.onended = () => { oscillator.disconnect(); gain.disconnect(); };
    });
  }

  private readPreference(): boolean {
    try { return localStorage.getItem('nightshift.sound') === 'on'; } catch { return false; }
  }
}
