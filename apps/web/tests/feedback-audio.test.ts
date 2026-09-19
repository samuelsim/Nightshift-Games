import { strict as assert } from 'node:assert';
import { it } from 'node:test';
import { FeedbackService } from '../src/app/services/feedback.service';
import { soundPalette } from '../src/app/services/sound-palette';

it('gives each game a distinct sound palette with bounded gains and a safe fallback', () => {
  const ids=['estimate','estimate-earth','estimate-wildlife','estimate-facts','pick-number','restricted-clues','human-exe','majority-rules','one-of-us','human-infiltrator'];
  const palettes=ids.map(soundPalette);
  assert.equal(new Set(palettes.map(p=>JSON.stringify(p))).size,ids.length);
  for(const p of palettes) {
    assert.ok(p.level>0 && p.level<=1);
    assert.ok(p.duration>.045 && p.duration<.5);
    assert.ok(p.victory.every(f=>f>100 && f<2000));
  }
  assert.deepEqual(soundPalette('unknown'),soundPalette(null));
});

it('audio is opt-in, gesture-created, muted immediately and suppressed in hidden tabs', async () => {
  const saved = new Map<string,string>();
  let hidden=false; let voices=0; let contexts=0;
  let latestContext: FakeAudioContext;
  const gains: {gain:{value:number;setValueAtTime:()=>void;linearRampToValueAtTime:()=>void;exponentialRampToValueAtTime:()=>void}}[]=[];
  class FakeAudioContext {
    state='running'; currentTime=0; destination={};
    constructor() { contexts++; latestContext=this; }
    async resume() { this.state='running'; }
    createGain() { const gain={gain:{value:0,setValueAtTime(){},linearRampToValueAtTime(){},exponentialRampToValueAtTime(){}},connect(){},disconnect(){}}; gains.push(gain); return gain; }
    createOscillator() { voices++; return {type:'sine',frequency:{value:0},connect(){},disconnect(){},start(){},stop(){},onended:null}; }
  }
  const properties = ['localStorage','document','AudioContext'] as const;
  const descriptors = properties.map(key=>Object.getOwnPropertyDescriptor(globalThis,key));
  try {
    Object.defineProperty(globalThis,'localStorage',{configurable:true,value:{getItem:(key:string)=>saved.get(key)??null,setItem:(key:string,value:string)=>saved.set(key,value)}});
    Object.defineProperty(globalThis,'document',{configurable:true,value:{get hidden(){return hidden;}}});
    Object.defineProperty(globalThis,'AudioContext',{configurable:true,value:FakeAudioContext});
    const feedback=new FeedbackService();
    feedback.unlock(); feedback.play('score');
    assert.equal(contexts,0); assert.equal(voices,0); assert.equal(feedback.soundOn(),false);
    feedback.toggleSound(); await Promise.resolve();
    assert.equal(contexts,1); assert.equal(voices,2); assert.equal(saved.get('nightshift.sound'),'on');
    feedback.play('score'); assert.equal(voices,5);
    feedback.play('hurry'); assert.equal(voices,7);
    feedback.play('tick'); assert.equal(voices,8);
    feedback.play('urgent'); assert.equal(voices,10);
    feedback.play('timeup'); assert.equal(voices,13);
    feedback.play('correct'); assert.equal(voices,17);
    feedback.play('close'); assert.equal(voices,20);
    feedback.play('incorrect'); assert.equal(voices,22);
    latestContext!.state='suspended';
    feedback.play('correct'); await Promise.resolve(); assert.equal(voices,26);
    await feedback.testSound(); assert.equal(voices,30);
    assert.match(feedback.audioStatus(),/Test tone sent/);
    hidden=true; feedback.play('finish'); feedback.play('urgent'); feedback.play('correct'); assert.equal(voices,30);
    hidden=false; feedback.toggleSound(); feedback.play('score');
    feedback.play('incorrect');
    assert.equal(gains[0]?.gain.value,0); assert.equal(voices,30); assert.equal(saved.get('nightshift.sound'),'off');
    Object.defineProperty(globalThis,'AudioContext',{configurable:true,value:class {constructor(){throw new Error('Unavailable');}}});
    const unavailable=new FeedbackService();
    assert.doesNotThrow(()=>unavailable.toggleSound());
  } finally {
    properties.forEach((key,i)=>{ const descriptor=descriptors[i]; if(descriptor) Object.defineProperty(globalThis,key,descriptor); else Reflect.deleteProperty(globalThis,key); });
  }
});
