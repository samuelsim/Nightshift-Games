import { musicStep, musicTheme } from './music-score';

// Look-ahead scheduling avoids timer jitter; each voice owns and releases its nodes.
export class MusicEngine {
  private readonly output:GainNode;
  private voices=new Set<OscillatorNode>();
  private next=0; private step=0; private scene:string|null=null; private active=false;
  constructor(private readonly context:AudioContext) {
    this.output=context.createGain(); this.output.gain.value=0; this.output.connect(context.destination);
  }
  setScene(scene:string|null):void {
    if(scene===this.scene) return;
    this.scene=scene; this.stop();
  }
  start(volume:number):void {
    if(this.active) return;
    this.active=true; this.next=this.context.currentTime+.08; this.step=0;
    const gain=this.output.gain,now=this.context.currentTime;
    gain.cancelScheduledValues(now+.07); gain.setValueAtTime(0,now+.07); gain.linearRampToValueAtTime(volume,now+.52);
  }
  stop():void {
    this.active=false;
    const now=this.context.currentTime,gain=this.output.gain;
    gain.cancelScheduledValues(now); gain.setValueAtTime(gain.value,now); gain.linearRampToValueAtTime(0,now+.05);
    for(const voice of this.voices) {try{voice.stop(now+.06);}catch{/* Already ended. */}}
    this.voices.clear();
  }
  volume(value:number):void {
    if(!this.active) return;
    const now=this.context.currentTime; this.output.gain.cancelScheduledValues(now); this.output.gain.setTargetAtTime(value,now,.05);
  }
  duck(volume:number):void {
    if(!this.active) return;
    const now=this.context.currentTime,gain=this.output.gain;
    gain.cancelScheduledValues(now); gain.setValueAtTime(gain.value,now);
    gain.linearRampToValueAtTime(volume*.2,now+.025); gain.setValueAtTime(volume*.2,now+.28); gain.linearRampToValueAtTime(volume,now+.8);
  }
  tick():void {
    if(!this.active || this.context.state!=='running') return;
    const theme=musicTheme(this.scene),ctx=this.context;
    // Never play a backlog when a tab/device resumes after throttling.
    if(this.next<ctx.currentTime) this.next=ctx.currentTime+.03;
    while(this.next<ctx.currentTime+.15) {
      for(const note of musicStep(theme,this.step)) {
        const osc=ctx.createOscillator(),envelope=ctx.createGain(),start=this.next;
        osc.type=note.wave; osc.frequency.setValueAtTime(note.frequency,start);
        if(note.slide) osc.frequency.exponentialRampToValueAtTime(note.slide,start+note.duration);
        envelope.gain.setValueAtTime(0,start); envelope.gain.linearRampToValueAtTime(note.level,start+.012);
        envelope.gain.exponentialRampToValueAtTime(.0001,start+note.duration);
        osc.connect(envelope); envelope.connect(this.output); this.voices.add(osc);
        osc.onended=()=>{this.voices.delete(osc);osc.disconnect();envelope.disconnect();};
        osc.start(start);osc.stop(start+note.duration+.02);
      }
      this.step=(this.step+1)%256; this.next+=60/theme.bpm/4;
    }
  }
}
