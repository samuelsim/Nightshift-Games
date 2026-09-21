import type { EstimatePrompt, EstimateArtSubject } from './estimate.types';
type Tier = 'easy'|'standard'|'hard';
type Card = EstimatePrompt & {readonly id:string; readonly difficulty:Tier};
const make=(id:string,difficulty:Tier,question:string,unit:string,answer:number,explanation:string,url:string,title:string):Card=>({
  id,difficulty,question,unit,answer,explanation,source:{url,title,reviewedAt:'2026-09-19'},
  convention:'Use the displayed units and the rounded reference value. Close estimates earn points.'
});
const planet=(id:string,t:Tier,q:string,u:string,a:number,e:string,body:EstimateArtSubject):Card=>({...make(id,t,q,u,a,e,`https://science.nasa.gov/${body}/${['venus','neptune'].includes(body)?body+'-facts':'facts'}/`,`NASA Science · ${body} facts`),art:body});
export const extraSpace:readonly Card[]=[
  planet('mercury-year','easy','About how many Earth days make a year on Mercury?','Earth days',88,'Mercury completes an orbit in about 88 days.','mercury'),
  planet('venus-heat','easy','About how hot is the surface of Venus in degrees Celsius?','°C',467,'NASA gives about 467 °C.','venus'),
  planet('neptune-day','easy','Roughly how many hours does Neptune take to rotate once?','hours',16,'One rotation takes about 16 hours.','neptune'),
  planet('uranus-day','easy','Roughly how many hours does Uranus take to rotate once?','hours',17,'One rotation takes about 17 hours.','uranus'),
  planet('mercury-heat','standard','Mercury’s daytime surface temperature can reach roughly how many degrees Celsius?','°C',430,'The cited daytime high is about 430 °C.','mercury'),
  planet('venus-pressure','standard','Surface pressure on Venus is about how many times Earth’s sea-level pressure?','times',93,'The comparison is approximately 93 times.','venus'),
  planet('neptune-year','standard','About how many Earth years does Neptune take to orbit the Sun?','Earth years',165,'An orbit takes about 165 Earth years.','neptune'),
  planet('uranus-year','standard','About how many Earth years make one year on Uranus?','Earth years',84,'Its orbit takes about 84 Earth years.','uranus'),
  planet('mercury-radius','hard','What is Mercury’s approximate radius in kilometres?','kilometres',2440,'NASA gives a radius of about 2,440 km.','mercury'),
  planet('venus-wind','hard','Winds at Venus’s cloud tops have been measured as high as about how many kilometres per hour?','km/h',360,'The cited cloud-top speed is about 360 km/h.','venus'),
  planet('neptune-diameter','hard','What is Neptune’s approximate equatorial diameter?','kilometres',49528,'NASA gives 49,528 km across the equator.','neptune'),
  planet('uranus-tilt','hard','Uranus rolls almost on its side. What is its axial tilt in degrees?','degrees',97.77,'NASA gives 97.77 degrees.','uranus')
];
const earth=(id:string,t:Tier,q:string,u:string,a:number,e:string)=>make(id,t,q,u,a,e,'https://science.nasa.gov/earth/facts/','NASA Science · Earth facts');
const ocean=(id:string,t:Tier,q:string,u:string,a:number,e:string,page:string)=>make(id,t,q,u,a,e,`https://oceanservice.noaa.gov/facts/${page}.html`,'NOAA · Ocean facts');
export const extraEarth:readonly Card[]=[
  earth('earth-layers','easy','Crust, mantle and the two cores: how many main layers make up Earth?','layers',4,'These are the four main layers.'),
  earth('other-gases','easy','Near the surface, gases other than nitrogen and oxygen make up roughly what percentage of the atmosphere?','%',1,'NASA rounds the remaining gases to 1%.'),
  ocean('water-boil','easy','At ordinary sea-level pressure, water boils at how many degrees Celsius?','°C',100,'The reference boiling point is 100 °C.','why_oceans'),
  ocean('ridge-submerged','easy','About what percentage of the mid-ocean ridge system is underwater?','%',90,'NOAA estimates about 90%.','midoceanridge'),
  earth('land-crust','standard','Using NASA’s rounded average, about how thick is Earth’s crust on land?','kilometres',30,'The land average given is about 30 km.'),
  earth('ocean-crust','standard','Using NASA’s rounded figure, about how thick is the crust beneath the seafloor?','kilometres',5,'The reference gives about 5 km.'),
  earth('earth-spin','standard','Relative to the stars, Earth rotates once in approximately how many hours?','hours',23.9,'NASA rounds this rotation period to 23.9 hours.'),
  earth('sunlight-earth','standard','Sunlight takes about how many minutes to reach Earth?','minutes',8,'NASA rounds the journey to eight minutes.'),
  earth('core-temperature','hard','Earth’s inner core can reach about how many degrees Celsius?','°C',5400,'The cited temperature is about 5,400 °C.'),
  earth('outer-core','hard','About how thick is Earth’s liquid outer core?','kilometres',2300,'NASA gives about 2,300 km.'),
  ocean('ridge-length','hard','About how long is the global mid-ocean ridge system?','kilometres',65000,'The system stretches about 65,000 km.','midoceanridge'),
  ocean('ocean-age','hard','In NOAA’s account, the early ocean formed approximately how many BILLION years ago?','billion years',3.8,'The rounded estimate is 3.8 billion years.','why_oceans')
];
const animal=(id:string,t:Tier,q:string,u:string,a:number,e:string,species:string)=>make(id,t,q,u,a,e,`https://nationalzoo.si.edu/animals/${species}`,`Smithsonian National Zoo · ${species.replaceAll('-',' ')}`);
export const extraWildlife:readonly Card[]=[
  animal('cheetah-pregnancy','easy','A cheetah’s pregnancy lasts approximately how many months?','months',3,'The reference gives about three months.','cheetah'),
  animal('panda-eyes','easy','At the upper end of the Smithsonian’s range, panda cubs first open their eyes at how many weeks old?','weeks',8,'The stated range is six to eight weeks.','giant-panda'),
  animal('elephant-finger','easy','How many finger-like projections are at the tip of an Asian elephant’s trunk?','projections',1,'Asian elephants have one such projection.','asian-elephant'),
  animal('tortoise-sleep','easy','According to the Aldabra fact sheet, giant tortoises average roughly how many hours of sleep per day?','hours',18,'The reference average is 18 hours, with wide individual variation.','aldabra-tortoise'),
  animal('cheetah-height','standard','An adult cheetah stands roughly how many centimetres tall at the shoulder?','centimetres',77,'The reference height is about 77 cm.','cheetah'),
  animal('panda-male-mass','standard','A wild male giant panda can weigh up to about how many kilograms in the Smithsonian reference?','kilograms',113,'The cited upper figure is 113 kg.','giant-panda'),
  animal('elephant-teeth','standard','How many successive sets of teeth does an Asian elephant have during its lifetime?','sets',6,'Six sets replace one another over its lifetime.','asian-elephant'),
  animal('tortoise-mass','standard','Male Aldabra tortoises can weigh up to about how many kilograms, excluding exceptional records?','kilograms',250,'The normal upper size figure given is 250 kg.','aldabra-tortoise'),
  animal('cheetah-mass','hard','What is the upper end of the Smithsonian’s adult cheetah weight range in kilograms?','kilograms',64,'The listed adult range is 34–64 kg.','cheetah'),
  animal('panda-newborn-ratio','hard','A newborn giant panda is roughly one over WHAT NUMBER of its mother’s size?','denominator',900,'The Smithsonian describes a ratio of about 1/900.','giant-panda'),
  animal('elephant-trunk-water','hard','An Asian elephant’s trunk can hold about how many litres of water?','litres',7.57,'The reference gives 7.57 litres.','asian-elephant'),
  animal('tortoise-shell','hard','A male Aldabra tortoise’s upper shell can reach roughly how many metres in length?','metres',1.22,'The reference gives 1.22 metres.','aldabra-tortoise')
];
