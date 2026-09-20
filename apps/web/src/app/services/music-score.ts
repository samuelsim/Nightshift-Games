export interface MusicTheme {
  name:string; bpm:number; root:number; chords:readonly number[]; melody:readonly number[];
  scale:readonly number[]; wave:OscillatorType; rhythm:number; drums:boolean;
}
const major=[0,2,4,7,9], minor=[0,3,5,7,10];
// Original sixteen-bar arrangements: melody, bass, pads and a light rhythm section.
export const musicThemes:Readonly<Record<string,MusicTheme>>={
  menu:{name:'After-hours lounge',bpm:84,root:48,chords:[0,5,9,7],melody:[0,2,4,2,1,3,2,0],scale:major,wave:'triangle',rhythm:2,drums:true},
  estimate:{name:'Curiosity cabinet',bpm:96,root:60,chords:[0,5,0,7],melody:[0,3,2,4,1,2,0,3],scale:major,wave:'sine',rhythm:2,drums:false},
  'pick-number':{name:'Lucky little shuffle',bpm:112,root:55,chords:[0,5,7,0],melody:[0,2,3,4,3,1,2,0],scale:major,wave:'triangle',rhythm:2,drums:true},
  'restricted-clues':{name:'Sneaky little clues',bpm:100,root:50,chords:[0,5,3,7],melody:[0,2,1,3,0,4,2,1],scale:minor,wave:'triangle',rhythm:4,drums:true},
  'human-exe':{name:'Soft circuits',bpm:108,root:48,chords:[0,3,7,5],melody:[0,3,1,4,2,3,1,0],scale:minor,wave:'triangle',rhythm:1,drums:true},
  'human-infiltrator':{name:'Undercover signal',bpm:76,root:45,chords:[0,0,5,3],melody:[0,2,0,3,1,0,4,2],scale:minor,wave:'sine',rhythm:4,drums:false},
  'majority-rules':{name:'Room full of opinions',bpm:104,root:53,chords:[0,7,5,0],melody:[2,0,3,2,4,3,1,0],scale:major,wave:'triangle',rhythm:2,drums:true},
  'one-of-us':{name:'A curious alibi',bpm:80,root:47,chords:[0,3,5,7],melody:[0,1,3,2,0,4,1,2],scale:minor,wave:'sine',rhythm:4,drums:true}
};
export interface MusicNote {frequency:number;duration:number;level:number;wave:OscillatorType;slide?:number;}
export const musicTheme=(id:string|null):MusicTheme=>musicThemes[id ?? 'menu'] ?? musicThemes['menu']!;
const hz=(midi:number)=>440*2**((midi-69)/12);
export function musicStep(theme:MusicTheme,step:number):MusicNote[] {
  const beat=60/theme.bpm, bar=Math.floor(step/16)%16, tick=step%16;
  const chord=theme.chords[bar%theme.chords.length]!;
  const root=theme.root+chord;
  const notes:MusicNote[]=[];
  const note=(midi:number,duration:number,level:number,wave:OscillatorType=theme.wave)=>notes.push({frequency:hz(midi),duration,level,wave});
  // Air between phrases; B section changes contour and register without random jumps.
  if(tick%theme.rhythm===0 && !(bar%4===3 && tick>=12)) {
    const index=(Math.floor(tick/theme.rhythm)+(bar>=8 && bar<12 ? 3 : bar%2))%theme.melody.length;
    const degree=theme.melody[index]!;
    note(theme.root+12+theme.scale[degree%theme.scale.length]!,beat*.55,theme.rhythm===1 ? .07 : .12);
  }
  if(tick===0 || tick===8) note(root-12+(tick===8?7:0),beat*1.4,.2,'sine');
  const third=theme.scale===major ? (chord===9 ? 3 : 4) : (chord===3 ? 4 : 3);
  if(tick===0) for(const interval of [0,third,7]) note(root+interval,beat*3.5,.045,'sine');
  if(theme.drums) {
    if(tick===0 || tick===8) notes.push({frequency:110,slide:42,duration:.16,level:.18,wave:'sine'});
    if(tick===4 || tick===12) notes.push({frequency:1250,duration:.035,level:.035,wave:'triangle'});
  }
  return notes;
}
