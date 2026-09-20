import { strict as assert } from 'node:assert';
import { it } from 'node:test';
import { musicStep, musicTheme, musicThemes } from '../src/app/services/music-score';
import { MusicService } from '../src/app/services/music.service';

it('has eight distinct complete arrangements with bounded, finite notes',()=>{
  assert.equal(Object.keys(musicThemes).length,8);
  const signatures=new Set<string>();
  for(const theme of Object.values(musicThemes)) {
    const arrangement=Array.from({length:256},(_,i)=>musicStep(theme,i));
    signatures.add(JSON.stringify(arrangement));
    assert.ok(arrangement.flat().length>=128);
    for(const notes of arrangement) {
      assert.ok(notes.reduce((sum,n)=>sum+n.level,0)<1);
      for(const note of notes) {
        assert.ok(Number.isFinite(note.frequency) && note.frequency>25 && note.frequency<4000);
        assert.ok(note.duration>.012 && note.duration<4);
        assert.ok(note.level>0 && note.level<=.2);
      }
    }
  }
  assert.equal(signatures.size,8);assert.equal(musicTheme('missing'),musicTheme(null));
});

it('starts on interaction, changes theme, ducks, pauses hidden tabs, and persists independent controls',async()=>{
  const keys=['localStorage','document','AudioContext','setInterval','clearInterval'] as const;
  const descriptors=keys.map(key=>Object.getOwnPropertyDescriptor(globalThis,key));
  const saved=new Map<string,string>();let hidden=false,contexts=0,voices=0,stops=0,closed=0;
  const intervals=new Map<number,()=>void>();let serial=0;
  const ramps:number[]=[];let ctx:FakeContext;
  const param=()=>({value:0,setValueAtTime(value:number){this.value=value;},linearRampToValueAtTime(value:number){ramps.push(value);this.value=value;},exponentialRampToValueAtTime(){},cancelScheduledValues(){},setTargetAtTime(value:number){this.value=value;}});
  class FakeContext {
    state='running';currentTime=0;destination={};onstatechange:(()=>void)|null=null;
    constructor(){contexts++;ctx=this;}
    async resume(){this.state='running';}async close(){closed++;this.state='closed';}
    createGain(){return {gain:param(),connect(){},disconnect(){}};}
    createOscillator(){voices++;return {type:'sine',frequency:param(),connect(){},disconnect(){},start(){},stop(){stops++;},onended:null};}
  }
  let music:MusicService|undefined;
  try {
    Object.defineProperty(globalThis,'localStorage',{configurable:true,value:{getItem:(key:string)=>saved.get(key)??null,setItem:(key:string,value:string)=>saved.set(key,value)}});
    Object.defineProperty(globalThis,'document',{configurable:true,value:{get hidden(){return hidden;}}});
    Object.defineProperty(globalThis,'AudioContext',{configurable:true,value:FakeContext});
    Object.defineProperty(globalThis,'setInterval',{configurable:true,value:(fn:()=>void)=>{intervals.set(++serial,fn);return serial;}});
    Object.defineProperty(globalThis,'clearInterval',{configurable:true,value:(id:number)=>intervals.delete(id)});
    music=new MusicService();music.setScene('estimate');assert.equal(contexts,0);
    music.unlock();assert.equal(contexts,1);assert.ok(voices>0);assert.equal(intervals.size,1);
    const initial=voices;music.unlock();assert.equal(voices,initial);assert.equal(intervals.size,1);
    music.setScene('human-exe');assert.equal(music.title(),'Soft circuits');assert.ok(stops>0);assert.equal(intervals.size,1);
    music.duck();assert.ok(ramps.includes(music.volume()*.22*.2));
    music.setVolume(.7);assert.equal(saved.get('nightshift.music.volume'),'0.7');
    hidden=true;music.visibilityChanged();const paused=voices;assert.equal(intervals.size,0);music.unlock();assert.equal(voices,paused);
    hidden=false;ctx!.currentTime=1000;music.visibilityChanged();assert.equal(intervals.size,1);assert.ok(voices-paused<12,'must not schedule a backlog');
    music.toggle();assert.equal(intervals.size,0);assert.equal(saved.get('nightshift.music'),'off');
    assert.equal(saved.has('nightshift.sound'),false);
    const restored=new MusicService();assert.equal(restored.enabled(),false);assert.equal(restored.volume(),.7);restored.unlock();assert.equal(contexts,1);
    music.toggle();assert.equal(intervals.size,1);music.setScene(null);assert.equal(music.title(),'After-hours lounge');
    music.ngOnDestroy();music=undefined;assert.equal(intervals.size,0);assert.equal(closed,1);
  } finally {
    music?.ngOnDestroy();keys.forEach((key,i)=>{const descriptor=descriptors[i];if(descriptor)Object.defineProperty(globalThis,key,descriptor);else Reflect.deleteProperty(globalThis,key);});
  }
});
