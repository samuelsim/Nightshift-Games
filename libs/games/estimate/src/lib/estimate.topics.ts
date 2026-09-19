import type { EstimatePrompt } from './estimate.types';
import { extraEarth, extraWildlife } from './estimate.extra-facts';
type Tier = 'easy' | 'standard' | 'hard';
type Card = EstimatePrompt & { readonly id:string; readonly difficulty:Tier };
function card(id:string,difficulty:Tier,question:string,unit:string,answer:number,explanation:string,url:string,title:string):Card {
  return {id,difficulty,question,unit,answer,explanation,source:{url,title,reviewedAt:'2026-09-16'},convention:'Use the displayed units. Approximate reference values are scored by percentage error; decimals are welcome.'};
}
const noaa=(page:string)=>`https://oceanservice.noaa.gov/facts/${page}.html`;
const earth='https://science.nasa.gov/earth/facts/';
const ocean=(id:string,t:Tier,q:string,u:string,a:number,e:string,page:string)=>card(id,t,q,u,a,e,noaa(page),'NOAA · Ocean facts');
export const earthDeck:readonly Card[]=[
  ...extraEarth,
  ocean('water-share','easy','About what percentage of Earth’s water is in the ocean?','%',97,'Ocean water accounts for about 97%.','oceanwater'),
  ocean('named-oceans','easy','Including the Southern Ocean, how many named oceans does NOAA describe?','oceans',5,'Five named regions share one connected global ocean.','howmanyoceans'),
  ocean('salt','easy','Average seawater contains about how many parts of salt per thousand parts of seawater?','parts per thousand',35,'Average salinity is about 35 parts per thousand.','whysalty'),
  ocean('sunlight-zone','easy','The ocean’s sunlight zone extends down roughly how many metres?','metres',200,'The euphotic zone occupies roughly the upper 200 metres.','light_travel'),
  card('nitrogen','easy','Near the surface, about what percentage of Earth’s atmosphere is nitrogen?','%',78,'Nitrogen accounts for about 78%.',earth,'NASA · Earth facts'),
  ocean('fresh-freeze','easy','Freshwater freezes at how many degrees Fahrenheit?','°F',32,'At ordinary pressure, 0 °C corresponds to 32 °F.','oceanfreeze'),
  ocean('mean-depth','standard','NOAA’s reference estimate puts average ocean depth at about how many metres?','metres',3682,'The cited average is 3,682 metres.','oceandepth'),
  ocean('pressure-step','standard','About how many metres deeper in seawater adds one atmosphere of pressure?','metres',10.06,'NOAA gives 33 feet, or about 10.06 metres, per extra atmosphere.','pressure'),
  ocean('twilight-bottom','standard','At roughly what depth does the ocean’s twilight zone end?','metres',1000,'The dysphotic zone ends at about 1,000 metres.','light_travel'),
  ocean('challenger','standard','About how deep is Challenger Deep, using NOAA’s cited estimate?','metres',10935,'The reference depth is approximately 10,935 metres.','oceandepth'),
  card('axial-tilt','standard','Earth’s axial tilt is approximately how many degrees?','degrees',23.4,'NASA rounds the tilt to 23.4 degrees.',earth,'NASA · Earth facts'),
  ocean('ocean-volume','standard','Roughly how much water is in the ocean, in MILLIONS of cubic kilometres?','million km³',1335,'1.335 billion km³ equals 1,335 million km³.','oceanwater'),
  ocean('salt-freeze','hard','Typical seawater freezes roughly how many Celsius degrees BELOW zero? Enter a positive difference.','degrees below 0 °C',1.9,'The reference freezing temperature is about −1.9 °C.','oceanfreeze'),
  ocean('hadal','hard','At approximately what depth does the ocean’s hadal zone begin?','metres',6000,'Hadal waters begin about 6,000 metres down.','light_travel'),
  card('mantle','hard','Earth’s mantle is about how many kilometres thick?','kilometres',2900,'NASA gives roughly 2,900 kilometres.',earth,'NASA · Earth facts'),
  ocean('ion-share','hard','Sodium and chloride together account for about what percentage of dissolved ions in seawater?','%',85,'Together they make up roughly 85% of dissolved ions.','whysalty'),
  ocean('fresh-dense','hard','Freshwater is most dense at about what temperature in degrees Celsius?','°C',4,'Freshwater reaches its density maximum around 4 °C.','oceanfreeze'),
  ocean('southern-boundary','hard','NOAA describes the U.S. northern boundary of the Southern Ocean at how many degrees south?','degrees south',60,'This named boundary is 60° south; conventions differ internationally.','howmanyoceans')
];
const animal=(id:string,t:Tier,q:string,u:string,a:number,e:string,species:string)=>card(id,t,q,u,a,e,`https://nationalzoo.si.edu/animals/${species}`,`Smithsonian National Zoo · ${species.replaceAll('-',' ')}`);
export const wildlifeDeck:readonly Card[]=[
  ...extraWildlife,
  animal('cheetah-strides','easy','At top speed, a cheetah completes roughly how many strides per second?','strides/second',4,'The Smithsonian describes four strides per second.','cheetah'),
  animal('komodo-meal','easy','A Komodo dragon can eat up to about what percentage of its body weight in one meal?','%',80,'Its expandable stomach can accommodate about 80%.','komodo-dragon'),
  animal('panda-hours','easy','At the upper end of the Smithsonian’s range, giant pandas spend how many hours a day eating and foraging?','hours',16,'The reported daily range is 10–16 hours.','giant-panda'),
  animal('red-litter','easy','A typical red panda litter contains how many cubs?','cubs',2,'The Smithsonian describes a typical litter of two.','red-panda'),
  animal('sloth-sleep','easy','Linnaeus’s two-toed sloths sleep for approximately how many hours during the day?','hours',15,'The reference describes about 15 hours of daytime sleep.','two-toed-sloth'),
  animal('bear-teeth','easy','How many upper front incisors are missing in an adult sloth bear?','teeth',2,'The gap left by two incisors helps with sucking up insects.','sloth-bear'),
  animal('cheetah-stride-length','standard','A sprinting cheetah can cover about how many metres in one stride?','metres',7,'At top speed, one stride spans about 7 metres.','cheetah'),
  animal('komodo-leftovers','standard','Komodo dragons leave behind about what percentage of a prey animal?','%',12,'The Smithsonian estimates leftovers at about 12%.','komodo-dragon'),
  animal('panda-bamboo','standard','At the upper end of the Smithsonian’s range, how many POUNDS of bamboo might a giant panda eat daily?','pounds',100,'The cited daily range is 70–100 pounds.','giant-panda'),
  animal('red-bamboo','standard','Bamboo makes up about what percentage of a red panda’s diet?','%',95,'Bamboo supplies roughly 95% of the diet.','red-panda'),
  animal('sloth-gestation','standard','Pregnancy in Linnaeus’s two-toed sloths lasts approximately how many months?','months',6,'The reference describes a six-month gestation.','two-toed-sloth'),
  animal('bear-insects','standard','Outside fruiting season, insects make up about what percentage of a sloth bear’s diet?','%',95,'The seasonal diet can be about 95% insects.','sloth-bear'),
  animal('cheetah-acceleration','hard','A cheetah can accelerate from rest to 72 km/h in about how many seconds?','seconds',2.5,'The Smithsonian gives approximately 2.5 seconds.','cheetah'),
  animal('komodo-eggs','hard','A female Komodo dragon lays approximately how many eggs in a clutch?','eggs',30,'The reference describes about 30 eggs.','komodo-dragon'),
  animal('panda-nap','hard','A giant panda rest lasting under two hours may leave up to how many droppings, in the Smithsonian’s range?','droppings',10,'The short-rest range given is five to ten.','giant-panda'),
  animal('red-awake','hard','Red pandas in human care spend roughly what percentage of their day awake?','%',45,'The reported average is about 45%.','red-panda'),
  animal('sloth-lifespan','hard','What is the approximate MEDIAN lifespan of two-toed sloths in human care, in the Smithsonian reference?','years',16,'The median is about 16 years; exceptional individuals live longer.','two-toed-sloth'),
  animal('bear-mass','hard','What is the upper end, in kilograms, of the Smithsonian’s average adult sloth bear weight range?','kilograms',140,'The stated average range is 90–140 kg.','sloth-bear')
];
