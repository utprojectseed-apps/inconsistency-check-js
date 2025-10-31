// Reproduce mapping logic locally to debug window comparisons
function pad(n){return n<10? '0'+n : ''+n}
const days = 14;
const dates = Array(days).fill(null).map((_,i)=>{const d=new Date(2025,9,5+i); return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`});
const submit = new Date(2025,9,6,1,27); // Oct6 01:27 local
console.log('submit local:', submit.toString());

let effectiveSubmissions = Array(days).fill(null).map(()=>({submitted:false,submitDate:null,localHour:null}));
// first pass
for(let k=0;k<days;++k){
  const sd = (k===1)? submit : null;
  if(sd instanceof Date && !isNaN(sd.getTime())){
    const sdDateStr = `${sd.getFullYear()}-${pad(sd.getMonth()+1)}-${pad(sd.getDate())}`;
    const participantDayStr = dates[k];
    if(participantDayStr && participantDayStr===sdDateStr){
      effectiveSubmissions[k]={submitted:true,submitDate:sd,localHour:sd.getHours()};
    }
  }
}
console.log('after first pass', effectiveSubmissions.slice(0,3));

const graceEndHour=8;
for(let i=0;i<days;++i){
  const participantDayStr = dates[i];
  if(!participantDayStr) continue;
  const parts = participantDayStr.split('-').map(Number);
  if(parts.length!==3) continue;
  const [y,m,d]=parts;
  const startWindow=new Date(y,m-1,d,20,0,0);
  const endWindow=new Date(y,m-1,d+1,graceEndHour,0,0);
  console.log(`day ${i} window: ${startWindow.toString()} -> ${endWindow.toString()}`);
  for(let j=0;j<days;++j){
    const sd = (j===1)? submit : null;
    if(!(sd instanceof Date) || isNaN(sd.getTime())) continue;
    console.log(' comparing sd', sd.toString(), 'with window for day', i);
    console.log(' sd>=start?', sd>=startWindow, ' sd<end?', sd<endWindow);
    if(sd>=startWindow && sd<endWindow){
      effectiveSubmissions[i]={submitted:true,submitDate:sd,localHour:20};
      if(!effectiveSubmissions[j]||!effectiveSubmissions[j].submitted){
        effectiveSubmissions[j]={submitted:true,submitDate:sd,localHour:sd.getHours()};
      }
      break;
    }
  }
}
console.log('after second pass', effectiveSubmissions.slice(0,3));
//test --- IGNORE ---