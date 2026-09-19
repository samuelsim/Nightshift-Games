import { randomIntInclusive } from '@nightshift/game-core';
import type { EstimatePrompt } from './estimate.types';
export function extraPrompts(random:()=>number,tier:'easy'|'standard'|'hard'):EstimatePrompt[] {
  const a=randomIntInclusive(random,3,12), b=randomIntInclusive(random,15,45);
  const card=(question:string,unit:string,answer:number,explanation:string):EstimatePrompt=>({question,unit,answer,explanation});
  if(tier==='easy') return [
    card(`${a} spiders each wear a sock on every leg. How many socks?`,'socks',a*8,`${a} × 8 legs.`),
    card(`A robot walks ${b} steps forward, then ${a} back. How far ahead is it?`,'steps',b-a,`${b} − ${a}.`),
    card(`A baker has ${a} dozen doughnuts. How many doughnuts?`,'doughnuts',a*12,`${a} × 12.`),
    card(`You split ${b*5} marbles evenly among five jars. How many per jar?`,'marbles',b,`${b*5} ÷ 5.`),
    card(`A balloon rises ${a} metres every second for ten seconds. How high does it rise?`,'metres',a*10,`${a} × 10.`),
    card(`A puzzle has ${b*10} pieces. Half are placed. How many are left?`,'pieces',b*5,`${b*10} ÷ 2.`)
  ];
  if(tier==='standard') return [
    card(`A sleepy dragon sleeps ${a} hours every day for ${b} days. How many hours awake in that time?`,'hours',(24-a)*b,`(24 − ${a}) × ${b}.`),
    card(`A garden is ${a} metres by ${b} metres. A fence surrounds it except for a 2-metre gate. How much fence?`,'metres',2*(a+b)-2,`2 × (${a} + ${b}) − 2.`),
    card(`A cinema sells ${b*10} tickets. Exactly 20% are children. How many adult tickets?`,'tickets',b*8,`${b*10} × 0.8.`),
    card(`A train travels ${b*2} km/h for ${a*15} minutes. How far does it travel?`,'kilometres',b*a/2,`${b*2} × ${a*15} ÷ 60.`),
    card(`${a} paint cans cover ${b} square metres each. How much area can two coats cover?`,'square metres',a*b/2,`${a} × ${b} ÷ 2.`),
    card(`A festival sells ${b} cups an hour for ${a} hours. Each cup holds 250 ml. How many litres?`,'litres',a*b/4,`${b} × ${a} × 250 ÷ 1,000.`)
  ];
  return [
    card(`A price of ${b*100} coins rises by 20%, then falls by 20%. What is the final price?`,'coins',b*96,`${b*100} × 1.2 × 0.8.`),
    card(`A snail climbs ${a+2} metres each day and slips 2 metres each night. How many days to escape a ${a*5+2}-metre well?`,'days',5,`After four nights it has climbed ${a*4} m. The fifth climb reaches the top; no final slide.`),
    card(`A cube is ${a} cm on each edge. Its edges double. What is the new volume?`,'cubic centimetres',8*a*a*a,`(${a} × 2) cubed.`),
    card(`Two taps fill a tank in ${a*2} minutes and ${a*3} minutes separately. Together, how long?`,'minutes',a*6/5,`1 ÷ (1/${a*2} + 1/${a*3}).`),
    card(`A robot travels ${b} km out at 30 km/h and back at 60 km/h. What is its average speed for the whole trip?`,'km/h',40,`Total distance divided by total time: ${b*2} ÷ (${b}/30 + ${b}/60).`),
    card(`A machine makes ${b*100} bolts. Exactly 4% fail inspection; 75% of those are repaired. How many remain faulty?`,'bolts',b,`${b*100} × 0.04 × 0.25.`)
  ];
}
