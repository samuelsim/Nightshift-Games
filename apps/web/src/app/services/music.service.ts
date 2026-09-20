import { Injectable, signal } from '@angular/core';
import { MusicEngine } from './music-engine';
import { musicTheme } from './music-score';

@Injectable({providedIn:'root'})
export class MusicService {
  readonly enabled=signal(this.read('nightshift.music')!=='off');
  readonly volume=signal(this.savedVolume());
  readonly title=signal(musicTheme(null).name);
  readonly status=signal('Music starts after your first tap.');
  private context:AudioContext|null=null; private engine:MusicEngine|null=null;
  private interval:ReturnType<typeof setInterval>|undefined; private scene:string|null=null;
  private level():number {return this.volume()*.22;}
  setScene(scene:string|null):void {this.scene=scene;this.title.set(musicTheme(scene).name);this.engine?.setScene(scene);this.sync();}
  unlock():void {
    if(!this.enabled() || document.hidden) return;
    try {
      if(!this.context) {
        this.context=new AudioContext();this.engine=new MusicEngine(this.context);this.engine.setScene(this.scene);
        this.context.onstatechange=()=>this.sync();
      }
      if(this.context.state==='suspended') void this.context.resume().then(()=>this.sync()).catch(()=>this.status.set('Tap Music to retry audio.'));
      this.sync();
    } catch {this.status.set('Music is unavailable in this browser.');}
  }
  toggle():void {this.enabled.update(value=>!value);this.save('nightshift.music',this.enabled()?'on':'off');if(this.enabled())this.unlock();this.sync();}
  setVolume(value:number):void {if(!Number.isFinite(value))return;this.volume.set(Math.max(0,Math.min(1,value)));this.save('nightshift.music.volume',String(this.volume()));this.engine?.volume(this.level());}
  visibilityChanged():void {this.sync();}
  duck():void {this.engine?.duck(this.level());}
  ngOnDestroy():void {this.engine?.stop();if(this.interval)clearInterval(this.interval);this.interval=undefined;if(this.context){this.context.onstatechange=null;void this.context.close();}}
  private sync():void {
    if(!this.enabled() || document.hidden || this.context?.state!=='running') {
      this.engine?.stop();if(this.interval){clearInterval(this.interval);this.interval=undefined;}return;
    }
    this.status.set('');this.engine?.start(this.level());
    if(!this.interval) this.interval=setInterval(()=>this.engine?.tick(),25);
    this.engine?.tick();
  }
  private read(key:string):string|null {try{return localStorage.getItem(key);}catch{return null;}}
  private save(key:string,value:string):void {try{localStorage.setItem(key,value);}catch{/* Session preference remains. */}}
  private savedVolume():number {const raw=this.read('nightshift.music.volume'),value=raw===null ? .45 : Number(raw);return Number.isFinite(value)?Math.max(0,Math.min(1,value)):.45;}
}
