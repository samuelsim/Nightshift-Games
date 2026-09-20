import { randomIntInclusive } from '@nightshift/game-core';
import type { EstimatePrompt } from './estimate.types';
export function extraPrompts(random:()=>number,tier:'easy'|'standard'|'hard'):EstimatePrompt[] {
  const a=randomIntInclusive(random,3,12), b=randomIntInclusive(random,15,45);
  const card=(question:string,unit:string,answer:number,explanation:string):EstimatePrompt=>({question,unit,answer,explanation});
  if(tier==='easy') return [
    card(`A monster has ${a} hats and buys 3 more. How many hats?`,'hats',a+3,`${a} + 3.`),
    card(`${a} treasure chests each hold 20 coins. How many coins?`,'coins',a*20,`${a} × 20.`),
    card(`A train has ${a} carriages with 10 windows each. How many windows?`,'windows',a*10,`${a} × 10.`),
    card(`You plant ${a} rows of 5 sunflowers. How many sunflowers?`,'sunflowers',a*5,`${a} × 5.`),
    card(`A bakery sells ${b} rolls in the morning and ${a} in the afternoon. Total sold?`,'rolls',a+b,`${b} + ${a}.`),
    card(`A robot charges for ${a} half-hour sessions. Total charging time?`,'minutes',a*30,`${a} × 30.`),
    card(`${a} bicycles each need two tyres. How many tyres?`,'tyres',a*2,`${a} × 2.`),
    card(`A game awards 100 points per star. You collect ${a} stars. How many points?`,'points',a*100,`${a} × 100.`),
    card(`${a} spiders each wear a sock on every leg. How many socks?`,'socks',a*8,`${a} × 8 legs.`),
    card(`A robot walks ${b} steps forward, then ${a} back. How far ahead is it?`,'steps',b-a,`${b} − ${a}.`),
    card(`A baker has ${a} dozen doughnuts. How many doughnuts?`,'doughnuts',a*12,`${a} × 12.`),
    card(`You split ${b*5} marbles evenly among five jars. How many per jar?`,'marbles',b,`${b*5} ÷ 5.`),
    card(`A balloon rises ${a} metres every second for ten seconds. How high does it rise?`,'metres',a*10,`${a} × 10.`),
    card(`A puzzle has ${b*10} pieces. Half are placed. How many are left?`,'pieces',b*5,`${b*10} ÷ 2.`)
  ];
  if(tier==='standard') return [
    card(`A spaceship uses ${a} litres of fuel per kilometre over ${b} kilometres. It starts with ${a*b+100} litres. How much remains?`,'litres',100,`${a*b+100} − ${a} × ${b}.`),
    card(`A recipe for 4 people uses ${b*4} grams of rice. How much for ${a} people?`,'grams',a*b,`${b*4} ÷ 4 × ${a}.`),
    card(`A game has ${a} levels, each with ${b} coins. You find exactly 60% of all coins. How many?`,'coins',a*b*.6,`${a} × ${b} × 0.6.`),
    card(`A wheel travels 2 metres per turn. How many turns over ${a} kilometres?`,'turns',a*500,`${a} × 1,000 ÷ 2.`),
    card(`${a} teams play every other team once. How many matches?`,'matches',a*(a-1)/2,`${a} × ${a-1} ÷ 2.`),
    card(`A warehouse stacks ${a} layers, each ${b} boxes wide and 3 boxes deep. How many boxes?`,'boxes',a*b*3,`${a} × ${b} × 3.`),
    card(`A ferry departs every ${a} minutes. From the first to the ${b}th departure, how many minutes pass?`,'minutes',a*(b-1),`${b-1} gaps × ${a} minutes.`),
    card(`A photo is ${a} cm wide and ${b} cm tall. Both dimensions triple. What is its new area?`,'square centimetres',9*a*b,`${a*3} × ${b*3}.`),
    card(`A sleepy dragon sleeps ${a} hours every day for ${b} days. How many hours awake in that time?`,'hours',(24-a)*b,`(24 − ${a}) × ${b}.`),
    card(`A garden is ${a} metres by ${b} metres. A fence surrounds it except for a 2-metre gate. How much fence?`,'metres',2*(a+b)-2,`2 × (${a} + ${b}) − 2.`),
    card(`A cinema sells ${b*10} tickets. Exactly 20% are children. How many adult tickets?`,'tickets',b*8,`${b*10} × 0.8.`),
    card(`A train travels ${b*2} km/h for ${a*15} minutes. How far does it travel?`,'kilometres',b*a/2,`${b*2} × ${a*15} ÷ 60.`),
    card(`${a} paint cans cover ${b} square metres each. How much area can two coats cover?`,'square metres',a*b/2,`${a} × ${b} ÷ 2.`),
    card(`A festival sells ${b} cups an hour for ${a} hours. Each cup holds 250 ml. How many litres?`,'litres',a*b/4,`${b} × ${a} × 250 ÷ 1,000.`)
  ];
  return [
    card(`A tournament starts with ${b*4} players. Each match eliminates one player. How many matches produce one champion?`,'matches',b*4-1,`All but one of the ${b*4} players must be eliminated.`),
    card(`A circular pond has radius ${a} metres. Using pi = 3.14, what is its area?`,'square metres',3.14*a*a,`3.14 × ${a} × ${a}.`),
    card(`A map scale is 1:25,000. Two places are ${a} cm apart on it. How far apart in metres?`,'metres',a*250,`${a} × 25,000 centimetres ÷ 100.`),
    card(`A box holds ${a} red and ${a*3} blue marbles. What percentage are red?`,'percent',25,`${a} ÷ ${a*4} × 100.`),
    card(`A cube built from small cubes is ${a} cubes along each edge. All outside faces are painted. How many small cubes have no paint?`,'cubes',(a-2)**3,`The interior is (${a} − 2) cubed.`),
    card(`A telescope magnifies length ${a} times. How many times larger does a flat object's area appear?`,'times',a*a,`Both dimensions multiply by ${a}: ${a} squared.`),
    card(`A download of ${b*60} MB runs at ${a} MB per second. How many minutes does it take?`,'minutes',b/a,`${b*60} ÷ ${a} ÷ 60.`),
    card(`A shop buys ${b} badges for ${a} coins each and sells all at a 50% markup on cost. What is the total profit?`,'coins',a*b*.5,`${b} × ${a} × 0.5.`),
    card(`A price of ${b*100} coins rises by 20%, then falls by 20%. What is the final price?`,'coins',b*96,`${b*100} × 1.2 × 0.8.`),
    card(`A snail climbs ${a+2} metres each day and slips 2 metres each night. How many days to escape a ${a*5+2}-metre well?`,'days',5,`After four nights it has climbed ${a*4} m. The fifth climb reaches the top; no final slide.`),
    card(`A cube is ${a} cm on each edge. Its edges double. What is the new volume?`,'cubic centimetres',8*a*a*a,`(${a} × 2) cubed.`),
    card(`Two taps fill a tank in ${a*2} minutes and ${a*3} minutes separately. Together, how long?`,'minutes',a*6/5,`1 ÷ (1/${a*2} + 1/${a*3}).`),
    card(`A robot travels ${b} km out at 30 km/h and back at 60 km/h. What is its average speed for the whole trip?`,'km/h',40,`Total distance divided by total time: ${b*2} ÷ (${b}/30 + ${b}/60).`),
    card(`A machine makes ${b*100} bolts. Exactly 4% fail inspection; 75% of those are repaired. How many remain faulty?`,'bolts',b,`${b*100} × 0.04 × 0.25.`)
  ];
}
