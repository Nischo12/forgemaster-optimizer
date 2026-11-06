// Forge Master Optimizer — English Edition
// Browser JavaScript. Open the accompanying HTML page; this file requires the DOM.

'use strict';
const STAT_FIELDS = [
 ['leben','Total Health','abs'],['schaden','Total Damage','abs'],
 ['Health','Health','pct'],['Damage','Damage','pct'],['Melee Damage','Melee Damage','pct'],['Range Damage','Range Damage','pct'],['Attack Speed','Attack Speed','pct'],['Critical Chance','Critical Chance','pct'],['Critical Damage','Critical Damage','pct'],['Block Chance','Block Chance','pct'],['Lifesteal','Lifesteal','pct'],['Double Chance','Double Chance','pct'],['Skill Cooldown','Skill Cooldown','pct'],['Health Regen','Health Regen','pct'],['Skill Damage','Skill Damage','pct']
];
const ROLLS = {'Melee Damage':50,'Attack Speed':40,'Critical Damage':80,'Critical Chance':12,'Block Chance':5,'Health Regen':4,'Lifesteal':20,'Damage':15,'Double Chance':20,'Range Damage':15,'Skill Damage':30,'Skill Cooldown':-7,'Health':15};
const STATS=Object.keys(ROLLS);
const $=id=>document.getElementById(id);
const fmt=n=>Number(n).toLocaleString('en-US',{maximumFractionDigits:2});
const number=(s)=>{if(s===null||s===undefined||String(s).trim()==='')return null;let t=String(s).replace(/\s/g,'').replace(/%/g,'').replace(/[^\d.,+\-]/g,'');if(!t)return null;if(t.includes(',')&&t.includes('.'))t=t.lastIndexOf(',')>t.lastIndexOf('.')?t.replace(/\./g,'').replace(',','.'):t.replace(/,/g,'');else if(t.includes(','))t=t.replace(',','.');else if(/^\d{1,3}(\.\d{3})+$/.test(t))t=t.replace(/\./g,'');const n=Number(t);return Number.isFinite(n)?n:null};
function buildFields(prefix){let rows=STAT_FIELDS.map(([key,label,kind])=>`<tr><td>${label}${kind==='pct'?' (%)':''}</td><td><input data-field="${key}" data-kind="display" placeholder="${kind==='abs'?'e.g. 83.4M':'e.g. 34.5'}"></td><td>${kind==='abs'?'—':`<input data-field="${key}" data-kind="forge" placeholder="0">`}</td></tr>`).join('');$(prefix+'-fields').innerHTML=`<div style="overflow-x:auto"><table><thead><tr><th>Stat</th><th>Displayed value</th><th>From current Forge slots</th></tr></thead><tbody>${rows}</tbody></table></div>`}
function getField(prefix,key,kind){return $(prefix+'-fields').querySelector(`[data-field="${key}"][data-kind="${kind}"]`)}
function initialize(){buildFields('own');buildFields('enemy');for(const prefix of ['own','enemy']){for(const [key,,kind] of STAT_FIELDS){getField(prefix,key,'display').value='0';if(kind==='pct')getField(prefix,key,'forge').value='0'}}}
function value(prefix,key,kind){const elem=getField(prefix,key,kind);if(!elem)return null;const v=elem.value.trim();if(!v)return null;return kind==='display'&&(key==='leben'||key==='schaden')?parseAmount(v):number(v)}
function makeProfile(prefix){const own=prefix==='own',shown={},forge={},fixed={},unknown=[];for(const [key,,kind] of STAT_FIELDS){const d=value(prefix,key,'display');if(kind==='abs'){shown[key]=d;continue}shown[key]=d??0;const f=value(prefix,key,'forge');if(f===null){unknown.push(key);forge[key]=0}else forge[key]=f;fixed[key]=shown[key]-forge[key]}
 if(!(shown.leben>0)||!(shown.schaden>0))throw Error('Total Health and Total Damage must be greater than zero to simulate PvP. Upload a screenshot or enter them manually.');
 // Rückrechnung unter multiplikativer Damage/Melee- und additiver Bonus-Annahme pro Statgruppe.
 const hpFactor=1+shown.Health/100;const damageFactor=(1+shown.Damage/100)*(1+shown[$(own?'weapon':'enemy-weapon').value==='Range'?'Range Damage':'Melee Damage']/100);
 if(hpFactor<=0||damageFactor<=0)throw Error('Invalid Health or Damage bonus multiplier.');
 const level=Number($(own?'fairy-level':'enemy-fairy-level').value);if(!Number.isInteger(level)||level<1||level>20)throw Error('Fairy level must be between 1 and 20.');
 return {name:$(own?'own-name':'enemy-name').value||'Character',fairy:$(own?'fairy':'enemy-fairy').value,level,weapon:$(own?'weapon':'enemy-weapon').value,shown,forge,fixed,unknown,baseHP:shown.leben/hpFactor,baseDmg:shown.schaden/damageFactor};}
function showBases(){try{const p=makeProfile('own');$('own-bases').innerHTML=`<div class="metric"><small>Estimated base HP</small><strong>${fmt(p.baseHP)}</strong></div><div class="metric"><small>Estimated base hit (model)</small><strong>${fmt(p.baseDmg)}</strong></div>`;$('own-status').textContent=p.unknown.length?`${p.unknown.length} unverified Forge contributions; estimates only.`:'Character profile ready.'}catch(e){$('own-status').textContent=e.message}}
const aliases=[['Critical Chance',/critical\s*chance|crit\s*chance|krit(?:ische)?\s*chance/i],['Critical Damage',/critical\s*damage|crit\s*damage|krit(?:ischer)?\s*schaden/i],['Melee Damage',/melee\s*damage|nahkampf(?:schaden)?/i],['Range Damage',/range(?:d)?\s*damage|fernkampf(?:schaden)?/i],['Double Chance',/double\s*chance|doppel(?:treffer|chance)/i],['Attack Speed',/attack\s*speed|angriffsgeschwindigkeit/i],['Block Chance',/block\s*chance|blockchance/i],['Skill Cooldown',/skill\s*cooldown|abklingzeit/i],['Skill Damage',/skill\s*damage|fertigkeitsschaden/i],['Health Regen',/health\s*regen|lebensregeneration/i],['Lifesteal',/life\s*steal|lifesteal|lebensraub/i],['Health',/\bhealth\b|\bleben\s*%|\bhp\s*%/i],['Damage',/^(?:total\s*)?damage\b|^schaden\s*%/i]];
// Reads localized numbers, including 83,4 Mio., 83.4M, 83 400 000 and 34,5%.
function parseAmount(raw){
 const match=String(raw).replace(/\u00a0/g,' ').match(/[-+−]?\s*\d[\d.,\s]*\s*(?:milliarden|millionen|million|mio\.?|mrd\.?|mil\.?|[kKmMbB])?/i);
 if(!match)return null;
 let part=match[0].replace(/−/g,'-').trim();
 const u=part.match(/(milliarden|millionen|million|mio\.?|mrd\.?|mil\.?|[kKmMbB])\s*$/i);
 let unit=u?u[1].toLowerCase().replace(/\./g,''):'';
 if(u)part=part.slice(0,u.index);
 part=part.replace(/\s/g,'');
 if(part.includes(',')&&part.includes('.'))part=part.lastIndexOf(',')>part.lastIndexOf('.')?part.replace(/\./g,'').replace(',','.'):part.replace(/,/g,'');
 else if(part.includes(','))part=/^[-+]?\d{1,3}(,\d{3})+$/.test(part)?part.replace(/,/g,''):part.replace(',','.');
 else if(/^[-+]?\d{1,3}(\.\d{3})+$/.test(part))part=part.replace(/\./g,'');
 const n=Number(part);if(!Number.isFinite(n))return null;
 return n*(['m','mio','mil','million','millionen'].includes(unit)?1e6:['b','mrd','milliarden'].includes(unit)?1e9:unit==='k'?1e3:1);
}
const OCR_ALIASES=[
 ['Critical Chance',/\b(?:critical|crit)\s*chance\b|\bcrit\.?\s*rate\b|krit(?:ische)?\s*(?:chance|trefferchance)/i],
 ['Critical Damage',/\b(?:critical|crit)\s*(?:damage|dmg)\b|krit(?:ischer)?\s*schaden/i],
 ['Melee Damage',/\bmelee\s*(?:damage|dmg)\b|nahkampfschaden/i],
 ['Range Damage',/\brange(?:d)?\s*(?:damage|dmg)\b|fernkampfschaden/i],
 ['Double Chance',/\bdouble\s*chance\b|doppeltreffer(?:chance)?/i],
 ['Attack Speed',/\battack\s*speed\b|angriffsgeschwindigkeit/i],
 ['Block Chance',/\bblock\s*chance\b|blockchance/i],
 ['Skill Cooldown',/\bskill\s*cooldown\b|abklingzeit/i],
 ['Skill Damage',/\bskill\s*damage\b|fertigkeitsschaden/i],
 ['Health Regen',/\bhealth\s*regen(?:eration)?\b|lebensregeneration/i],
 ['Lifesteal',/\blife\s*steal\b|\blifesteal\b|lebensraub/i],
 ['Health',/\bhealth\b|\bgesundheit\b|\bleben\b/i],
 ['Damage',/\bdamage\b|\bschaden\b/i]
];
function detectStats(raw){
 const lines=String(raw).replace(/[−–]/g,'-').split(/\r?\n/).map(x=>x.trim()).filter(Boolean);
 const result={};
 const cleaned=lines.map(x=>x.replace(/[|¦]/g,' ').replace(/\s+/g,' ').trim());
 const findValue=(str,percent)=>{
   let matches=[...str.matchAll(/[-+]?\s*\d[\d.,\s]*\s*(?:milliarden|millionen|million|mio\.?|mrd\.?|mil\.?|[kKmMbB])?\s*%?/gi)];
   for(const m of matches){
     let token=m[0].trim();if(!token||!/\d/.test(token))continue;
     if(percent && !token.includes('%') && /mio|mil|mrd|million|milliard/i.test(token))continue;
     const val=parseAmount(token);
     if(val!==null && (!percent||Math.abs(val)<=10000))return val;
   }
   return null;
 };
 for(let i=0;i<cleaned.length;i++){
   const line=cleaned[i];
   // Total HP/damage are distinct from the Health/Damage percentage bonuses.
   for(const [key,re] of [['leben',/(?:\btotal\s*(?:health|hp)\b|\b(?:total|gesamt)[- ]?leben\b|\bgesamt\s*hp\b|\btotal\s*hp\b)/i],['schaden',/(?:\btotal\s*(?:damage|dmg)\b|\bgesamt[- ]?schaden\b)/i]]){
     const match=re.exec(line);if(!match)continue;
     const remainder=(line.slice(match.index+match[0].length)+' '+line.slice(0,match.index)).trim();
     let v=findValue(remainder,false);
     if(v===null && i+1<cleaned.length)v=findValue(cleaned[i+1],false);
     if(v!==null&&v>1000)result[key]=v;
   }
   // Some screenshots label totals only as "Health" and "Damage".
   for(const [key,re] of [['leben',/^\s*(?:health|leben|hp)\b/i],['schaden',/^\s*(?:damage|schaden|dmg)\b/i]]){
     if(result[key]!==undefined||!re.test(line))continue;
     const candidate=line.replace(re,'').trim();
     if(candidate.includes('%'))continue;
     let v=findValue(candidate,false);
     if(v===null&&i+1<cleaned.length&&!/%/.test(cleaned[i+1]))v=findValue(cleaned[i+1],false);
     if(v!==null&&v>1000)result[key]=v;
   }
   for(const [key,re] of OCR_ALIASES){
     if(key==='Damage' && /\b(?:melee|range|ranged|critical|crit|skill)\s*(?:damage|dmg)\b|\b(?:total|gesamt)\s*(?:damage|schaden)\b/i.test(line))continue;
     if(key==='Health' && /\b(?:total|gesamt)\s*(?:health|hp|leben)\b|\bhealth\s*regen/i.test(line))continue;
     const match=re.exec(line);if(!match)continue;
     const left=line.slice(0,match.index),right=line.slice(match.index+match[0].length);
     // Do not confuse raw totals with percentage bonuses.
     let segment=right+' '+left;
     let val=null;
     if(segment.includes('%'))val=findValue(segment,true);
     else if(i+1<cleaned.length&&/^[-+]?\s*\d[\d.,\s]*\s*%/.test(cleaned[i+1]))val=findValue(cleaned[i+1],true);
     else if(i>0&&/^[-+]?\s*\d[\d.,\s]*\s*%/.test(cleaned[i-1]))val=findValue(cleaned[i-1],true);
     if(val!==null)result[key]=val;
   }
 }
 return result;
}
// Dedicated extraction for TOTAL Health / Damage. Percentage bonuses must never be used as totals.
function extractTotalStats(raw){
 const lines=String(raw).replace(/[−–]/g,'-').split(/\r?\n/).map(x=>x.trim()).filter(Boolean);
 const result={},flags=[];
 const labels={
  leben: /\b(?:total\s*(?:health|hp)|(?:total|gesamt)\s*leben|gesamt\s*hp|health\s*total)\b/i,
  schaden: /\b(?:total\s*(?:damage|dmg)|gesamt\s*schaden|damage\s*total)\b/i
 };
 const isOtherStat=(t)=>/\b(?:chance|speed|critical|crit|melee|range|skill|block|lifesteal|double|regen|cooldown)\b/i.test(t);
 const nums=(t)=>[...t.matchAll(/[-+−]?\s*\d[\d., ]*\s*(?:milliarden|millionen|million|mio\.?|mrd\.?|mil\.?|[kKmMbB])?\s*%?/gi)].map(m=>m[0].trim()).filter(Boolean);
 const eligible=(token)=>{if(token.includes('%'))return null;const n=parseAmount(token);return Number.isFinite(n)&&n>=1000?n:null};
 for(const key of ['leben','schaden']){
  const found=[];
  for(let i=0;i<lines.length;i++){
   const match=labels[key].exec(lines[i]);
   if(!match)continue;
   const same=lines[i].slice(0,match.index)+' '+lines[i].slice(match.index+match[0].length);
   const candidates=[{text:same,score:3}];
   // Prefer the line immediately below the label. Only use the line above if below has no numeric value.
   const below=lines[i+1];const above=lines[i-1];
   const isStandaloneNumber=t=>t && /^[+\-−]?\s*\d[\d., ]*\s*(?:milliarden|millionen|million|mio\.?|mrd\.?|mil\.?|[kKmMbB])?\s*$/i.test(t);
   if(isStandaloneNumber(below))candidates.push({text:below,score:1});
   else if(isStandaloneNumber(above))candidates.push({text:above,score:1});
   for(const item of candidates){if(item.text.includes('%'))continue;for(const token of nums(item.text)){const n=eligible(token);if(n!==null)found.push({value:n,score:item.score,line:i+1})}}
  }
  found.sort((a,b)=>b.score-a.score);
  if(found.length){const top=found.filter(x=>x.score===found[0].score);if(top.some(x=>Math.abs(x.value-top[0].value)>Math.max(1,top[0].value*.02))){flags.push(`Conflicting ${key==='leben'?'Total Health':'Total Damage'} readings — enter manually.`)}else result[key]=top[0].value}
  else flags.push(`${key==='leben'?'Total Health':'Total Damage'} not confidently recognized — enter manually.`);
 }
 return {result,flags};
}
function detectStatsSafe(raw){
 const detected=detectStats(raw);
 // Never trust generic Health/Damage matching for total values.
 delete detected.leben;delete detected.schaden;
 const totals=extractTotalStats(raw);
 Object.assign(detected,totals.result);
 return {detected,warnings:totals.flags};
}
async function loadOcrLibrary(){
 if(window.Tesseract)return;
 const providers=['https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js','https://unpkg.com/tesseract.js@5/dist/tesseract.min.js'];
 for(const src of providers){
  try{
   await new Promise((resolve,reject)=>{const script=document.createElement('script');script.src=src;script.onload=resolve;script.onerror=()=>reject(new Error('CDN unavailable'));document.head.appendChild(script)});
   if(window.Tesseract)return;
  }catch(_error){}
 }
 throw Error('OCR could not load. Check your internet connection or browser extensions blocking the OCR library.');
}
async function prepareImage(file){
 // Normalize mobile uploads and enlarge small screenshots to aid OCR.
 try{
  const bitmap=await createImageBitmap(file);
  const scale=Math.min(3,Math.max(1,1800/bitmap.width));
  const c=document.createElement('canvas');c.width=Math.round(bitmap.width*scale);c.height=Math.round(bitmap.height*scale);
  const ctx=c.getContext('2d',{willReadFrequently:true});ctx.fillStyle='#fff';ctx.fillRect(0,0,c.width,c.height);ctx.drawImage(bitmap,0,0,c.width,c.height);
  bitmap.close();return c;
 }catch(_){return file}
}
async function doOcr(prefix){
 const input=$(prefix+'-file');if(!input.files?.length){alert('Please select a screenshot first.');return}
 const button=$(prefix+'-ocr');const status=$(prefix==='own'?'own-status':'pvp-status');
 button.disabled=true;button.textContent='Reading image…';
 const box=$(prefix+'-ocr-box'),pre=$(prefix+'-raw');box.classList.remove('hidden');pre.textContent='Starting OCR…';
 try{
  status.textContent='Loading OCR…';await loadOcrLibrary();
  status.textContent='Recognizing screenshot text…';
  const image=await prepareImage(input.files[0]);
  const recognized=await Tesseract.recognize(image,'eng');
  const raw=recognized?.data?.text||'';pre.textContent=raw||'(No text recognized)';
  const {detected,warnings}=detectStatsSafe(raw);
  for(const [key,val] of Object.entries(detected)){const field=getField(prefix,key,'display');if(field)field.value=String(Number(val.toFixed(4)))}
  const count=Object.keys(detected).length;
  status.textContent=count?`${count} values detected — review Total Health and Total Damage carefully.`:'Text read, but no stats confidently mapped. Check the OCR text below.';
  if(warnings.length)pre.textContent+='\n\n--- TOTAL STAT CHECK ---\n'+warnings.join('\n');
  if(!count)pre.textContent+='\n\nTip: If the values are visible above but not filled in, please enter them manually.';
 }catch(e){pre.textContent='OCR failed: '+e.message;status.textContent='OCR error — see recognized text box.';console.error(e)}
 finally{button.disabled=false;button.textContent='Recognize screenshot'}
}
const zeroBuild=()=>Object.fromEntries(STATS.map(s=>[s,0]));
function attackInterval(spd){for(const [min,val] of [[400.001,.4],[275.001,.5],[200.001,.6],[150.001,.7],[114.287,.8],[87.501,.9],[66.668,1],[50.001,1.1],[36.365,1.2],[25.001,1.3],[15.386,1.4],[7.144,1.5],[.001,1.6]])if(spd>=min)return val;return 1.7}
function values(profile,build){const bonus=(name)=>(profile.fixed[name]||0)+(build[name]||0)*ROLLS[name];const hp=profile.baseHP*(1+bonus('Health')/100);let hit=profile.baseDmg*(1+bonus('Damage')/100)*(1+bonus(profile.weapon==='Range'?'Range Damage':'Melee Damage')/100);if(profile.fairy==='Tira')hit*=1+(bonus('Health')/10)*(5+profile.level*.5)/100;const cooldown=Math.abs(bonus('Skill Cooldown'));return {hp,hit,crit:Math.max(0,Math.min(1,bonus('Critical Chance')/100)),critFactor:Math.max(1,1+bonus('Critical Damage')/100),block:Math.max(0,Math.min(1,bonus('Block Chance')/100)),steal:Math.max(0,bonus('Lifesteal')/100),dbl:Math.max(0,Math.min(1,bonus('Double Chance')/100)),interval:attackInterval(bonus('Attack Speed')),mira:profile.fairy==='Mira'?Math.min(.7,cooldown/4*(4+profile.level*.5)/100):0,fairy:profile.fairy,level:profile.level}}
function random(seed){let a=seed>>>0;return ()=>{a+=0x6D2B79F5;let t=a;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return((t^(t>>>14))>>>0)/4294967296}}
function oneAttack(a,d,n,rng){const count=1+(rng()<a.dbl?1:0);let amount=0;for(let i=0;i<count;i++){if(rng()<d.block)continue;let hit=a.hit;if(rng()<a.crit)hit*=a.critFactor*(1-d.mira);amount+=hit}if(a.fairy==='Lora'&&n%5===0)amount*=1+(20+a.level*10)/100;return {damage:amount,heal:amount*a.steal,doubled:count===2}}
function fight(p,e,seed){const rng=random(seed);let hpP=p.hp,hpE=e.hp,tP=p.interval,tE=e.interval,nP=0,nE=0;const limit=10;for(let step=0;step<160;step++){const t=Math.min(tP,tE);if(t>limit||hpP<=0||hpE<=0)break;if(tP<=tE){const a=oneAttack(p,e,++nP,rng);hpE-=a.damage;hpP=Math.min(p.hp,hpP+a.heal);tP+=p.interval+(a.doubled?.1:0)}else{const a=oneAttack(e,p,++nE,rng);hpP-=a.damage;hpE=Math.min(e.hp,hpE+a.heal);tE+=e.interval+(a.doubled?.1:0)}}if(hpP<=0&&hpE<=0)return'DRAW';if(hpE<=0)return'WIN';if(hpP<=0)return'LOSE';return'DRAW'}
function winrate(profile,build,enemy,enemyBuild,n=100,seed=71){const p=values(profile,build),e=values(enemy,enemyBuild);const outcomes={WIN:0,LOSE:0,DRAW:0};for(let i=0;i<n;i++)outcomes[fight(p,e,seed+i*7919)]++;return {win:outcomes.WIN/n*100,lose:outcomes.LOSE/n*100,draw:outcomes.DRAW/n*100,count:n}}
// Fairy-focused optimization never requires or uses the user's current equipped stats.
function makeOptimizationProfile(){
 const level=Number($('fairy-level').value);
 if(!Number.isInteger(level)||level<1||level>20)throw Error('Fairy level must be 1–20.');
 return {name:'Reference fighter',fairy:$('fairy').value,level,weapon:$('weapon').value,
  baseHP:100000000,baseDmg:10000000,shown:{},forge:{},fixed:{},unknown:[]};
}
function profilesForAllround(own){const base={...own,shown:{...own.shown},fixed:{...own.fixed},forge:{...own.forge},fairy:null,level:5};const make=(name,updates)=>({name,profile:{...base,fixed:{...base.fixed,...updates}}});return [make('Balanced',{}),make('Critical opponent',{'Critical Chance':80,'Critical Damage':180}),make('Tank/Block',{'Health':100,'Block Chance':25,'Lifesteal':30})]}
function estimatedScore(p,enemy){const avgHit=p.hit*(1+p.crit*(p.critFactor-1));const dps=avgHit*(1+p.dbl)/(p.interval+.1*p.dbl)*(p.fairy==='Lora'?(1+(20+p.level*10)/500):1);const enHit=enemy.hit*(1+enemy.crit*(enemy.critFactor*(1-p.mira)-1));const enDps=enHit*(1+enemy.dbl)/(enemy.interval+.1*enemy.dbl)*(1-p.block);const ownDps=dps*(1-enemy.block);const net=Math.max(0,enDps-Math.min(enDps,ownDps*p.steal));const stay=net?Math.min(10,p.hp/net):10;const ttl=enemy.hp/Math.max(1,ownDps);return Math.log(1+ownDps*stay/Math.max(1,enemy.hp))*2+Math.log(1+p.hp/Math.max(1,enDps*10))+Math.min(4,10/Math.max(.1,ttl))*.12}
function heuristic(own,build,enemyVals){const p=values(own,build);const scores=enemyVals.map(e=>estimatedScore(p,e));return scores.reduce((a,b)=>a+b,0)/scores.length*.7+Math.min(...scores)*.3}
function randBuild(){const b=zeroBuild();let n=0;while(n<24){const s=STATS[Math.floor(Math.random()*STATS.length)];if(b[s]<12){b[s]++;n++}}return b}
function mutate(b){const copy={...b};const from=STATS.filter(s=>copy[s]>0);const f=from[Math.floor(Math.random()*from.length)];const to=STATS.filter(s=>s!==f&&copy[s]<12);const t=to[Math.floor(Math.random()*to.length)];copy[f]--;copy[t]++;return copy}
function itemize(b){const slots=Object.entries(b).filter(x=>x[1]>0).sort((a,c)=>c[1]-a[1]);const items=Array.from({length:12},()=>[]);for(const [name,n] of slots){for(let i=0;i<n;i++){const candidate=items.filter(item=>item.length<2&&!item.includes(name)).sort((a,c)=>a.length-c.length)[0];if(!candidate)throw Error('Could not distribute substats across items');candidate.push(name)}}if(items.some(x=>x.length!==2))throw Error('Not every item has 2 substats');return items}
let optimal=null;
async function optimize(){const btn=$('optimize');btn.disabled=true;$('opt-status').textContent='Evaluating build candidates…';await new Promise(r=>setTimeout(r,25));try{const own=makeOptimizationProfile();const enemies=profilesForAllround(own);const enemyVals=enemies.map(e=>values(e.profile,zeroBuild()));const top=[];function store(b){const key=STATS.map(s=>b[s]).join(',');if(top.some(x=>x.key===key))return;const score=heuristic(own,b,enemyVals);top.push({build:{...b},score,key});top.sort((a,c)=>c.score-a.score);if(top.length>25)top.pop()}
 for(let i=0;i<3000;i++)store(randBuild());for(let start=0;start<12;start++){let b=start===0?{...top[0].build}:randBuild(),score=heuristic(own,b,enemyVals);for(let j=0;j<130;j++){const c=mutate(b),s=heuristic(own,c,enemyVals);if(s>score){b=c;score=s}store(c)}store(b)}
 $('opt-status').textContent='Simulating the strongest candidates…';await new Promise(r=>setTimeout(r,25));let best=null;for(const candidate of top.slice(0,16)){const results=enemies.map(e=>winrate(own,candidate.build,e.profile,zeroBuild(),90));const rates=results.map(r=>r.win+r.draw*.3);const average=rates.reduce((a,b)=>a+b,0)/rates.length;const robust=average*.7+Math.min(...rates)*.3;const rating=robust+candidate.score*.03;if(!best||rating>best.rating)best={...candidate,rating,results,average,robust}}
 optimal=best.build;const items=itemize(optimal);$('opt-result').innerHTML=`<h3>Dein Allround-Build für ${own.fairy} Level ${own.level}</h3><div class="grid"><div class="metric"><small>Estimated all-round score*</small><strong>${fmt(best.robust)} / 100</strong></div><div class="metric"><small>Allocated Forge slots</small><strong>24 / 24</strong></div></div><h3>Substat distribution</h3><div class="items">${Object.entries(optimal).filter(x=>x[1]>0).sort((a,b)=>b[1]-a[1]).map(([s,n])=>`<div><b>${s}</b><br>${n} Slots</div>`).join('')}</div><h3>Your 12 items</h3><div class="items">${items.map((i,n)=>`<div><b>Item ${n+1}</b><br>${i.join(' + ')}</div>`).join('')}</div><h3>Synthetic opponents (90 fights each)</h3><div class="items">${enemies.map((e,i)=>`<div><b>${e.name}</b><br>${fmt(best.results[i].win)} % WIN<br><small>${fmt(best.results[i].draw)} % DRAW</small></div>`).join('')}</div><p>*Not guaranteed in-game: synthetic opponents, simplified mechanics and assumed maximum rolls.</p>`;$('opt-status').textContent='Build generated. Review before farming.'}catch(e){$('opt-status').textContent=e.message;console.error(e)}finally{btn.disabled=false}}
function simulateReal(){try{if(!optimal)throw Error('Generate your fairy build first.');const own=makeProfile('own'),enemy=makeProfile('enemy');const ownVals=values(own,optimal),enemyVals=values(enemy,zeroBuild());const res=winrate(own,optimal,enemy,zeroBuild(),1000,91072);$('pvp-result').innerHTML=`<h3>${own.name} vs ${enemy.name}</h3><div class="grid"><div class="metric"><small>Estimated wins</small><strong>${fmt(res.win)} %</strong></div><div class="metric"><small>Losses / draws</small><strong>${fmt(res.lose)} % / ${fmt(res.draw)} %</strong></div><div class="metric"><small>Your build HP</small><strong>${fmt(ownVals.hp)}</strong></div><div class="metric"><small>Opponent HP (current)</small><strong>${fmt(enemyVals.hp)}</strong></div></div><p>Result: ${res.win>res.lose?'More wins than losses in this model':'Not more wins than losses in this model'}. ${res.draw>0?'Draws are counted separately.':''} Actual in-game outcomes may differ.</p>`;$('pvp-status').textContent='1,000 simulated fights completed.'}catch(e){$('pvp-status').textContent=e.message}}
initialize();$('save-own').onclick=showBases;$('own-ocr').onclick=()=>doOcr('own');$('enemy-ocr').onclick=()=>doOcr('enemy');$('optimize').onclick=optimize;$('pvp').onclick=simulateReal;
