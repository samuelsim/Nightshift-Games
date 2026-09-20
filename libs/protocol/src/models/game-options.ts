export type OptionValue = string | number | boolean;
export type GameOptions = Readonly<Record<string, OptionValue>>;
export interface GameOptionField {
  readonly key: string;
  readonly label: string;
  readonly defaultValue: OptionValue;
  readonly choices: readonly { label: string; value: OptionValue }[];
}
const rounds = (count: number): GameOptionField => ({ key:'rounds', label:'Rounds', defaultValue:count,
  choices:Array.from({length:10},(_,i)=>({label:String(i+1),value:i+1})) });
const choice = (value: string, label = value) => ({value,label});

// Browser-safe schema: one place for defaults, lobby controls and server validation.
export const gameOptionFields: Readonly<Record<string, readonly GameOptionField[]>> = {
  estimate: [rounds(5),
    {key:'daily',label:'Play style',defaultValue:false,choices:[{value:false,label:'Fresh shuffle'},{value:true,label:'Daily challenge'}]},
    {key:'deck',label:'Question deck',defaultValue:'generated',choices:[choice('generated','Quantities'),choice('mixed','Mixed Trivia'),choice('facts','Space Facts'),choice('earth','Earth & Ocean'),choice('wildlife','Wildlife')]},
    {key:'difficulty',label:'Difficulty',defaultValue:'standard',choices:[choice('easy','Easy'),choice('standard','Standard'),choice('hard','Hard')]}
  ],
  'human-exe':[rounds(5),{key:'difficulty',label:'Difficulty',defaultValue:'standard',choices:[choice('easy','Easy · no decoys'),choice('standard','Standard · with decoys')]}],
  'pick-number':[rounds(3)],
  'restricted-clues':[rounds(4)],
  'majority-rules':[rounds(5)],
  'one-of-us':[rounds(3)],
  'human-infiltrator':[rounds(3)]
};
export function defaultGameOptions(gameId: string): GameOptions {
  return Object.fromEntries((Object.hasOwn(gameOptionFields,gameId) ? gameOptionFields[gameId]! : []).map(field=>[field.key,field.defaultValue]));
}
export function validGameOptionsPatch(gameId: string, patch: GameOptions): boolean {
  if (!Object.hasOwn(gameOptionFields,gameId) || !Object.keys(patch).length) return false;
  return Object.entries(patch).every(([key,value])=>gameOptionFields[gameId]!.some(field=>field.key===key && field.choices.some(choice=>choice.value===value)));
}
export function effectiveGameOptions(gameId: string, options: GameOptions = {}): GameOptions {
  const result = {...defaultGameOptions(gameId),...options};
  if (gameId==='estimate' && result['daily']) result['rounds']=5;
  return result;
}
export function gameRounds(gameId: string, options: GameOptions = {}): number {
  return Number(effectiveGameOptions(gameId,options)['rounds']);
}
