const L=require('./lib.js');const {P}=L;const fs=require('fs');const {chromium}=require('playwright');
const svg=(b)=>`<svg xmlns="http://www.w3.org/2000/svg" width="720" height="1280" viewBox="0 0 720 1280">${L.defs()}
<defs><radialGradient id="redEdge" cx=".5" cy=".5" r=".72"><stop offset=".55" stop-color="#C2412D" stop-opacity="0"/><stop offset="1" stop-color="#C2412D" stop-opacity=".38"/></radialGradient>
<radialGradient id="darkEdge" cx=".5" cy=".55" r=".7"><stop offset=".35" stop-color="#0d1430" stop-opacity="0"/><stop offset="1" stop-color="#0d1430" stop-opacity=".72"/></radialGradient></defs>${b}</svg>`;
const sticky=(x,y,w,h,t,rot,c='#FFE58A',sz=34)=>`<g transform="rotate(${rot} ${x+w/2} ${y+h/2})"><g filter="url(#soft)">${L.wc(`<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${c}"/>`)}</g>${L.hand(x+w/2,y+h/2+12,t,{size:sz,anchor:'middle'})}</g>`;
// ---- MARAH
const marah=svg(`${L.paper()}
 <g transform="translate(-6 4) rotate(-1.2 360 640)">
  ${sticky(130,190,170,150,'04.00',-8)}${sticky(420,170,170,150,'5 jam',6,'#FFFCF5')}
  ${sticky(90,620,150,130,'0 HP',-28)}${sticky(520,700,150,130,'TO',34,'#FFFCF5')}
  <g transform="rotate(-6 360 330)"><g filter="url(#soft)">${L.wc(`<rect x="240" y="250" width="240" height="200" fill="#FFE58A"/>`)}</g>
   ${L.hand(360,368,'7 JAM',{size:84,anchor:'middle',color:P.red})}</g>
  <g stroke="${P.ink}" stroke-width="5" stroke-linecap="round"><path d="M200 300 l-50 -20 M200 350 l-60 4 M520 300 l50 -24 M520 350 l60 0 M360 210 v-50"/></g>
  <g transform="translate(360 640)">${L.artaBust('marah')}</g>
  <g stroke="${P.red}" stroke-width="6" stroke-linecap="round"><path d="M470 470 l22 -26 M500 492 l30 -12 M482 520 l34 6"/></g>
 </g>
 <rect width="720" height="1280" fill="url(#redEdge)"/>
 ${L.epBadge(1,'Rencana Sempurna')}
 <g filter="url(#soft)"><rect x="64" y="1004" width="592" height="170" rx="18" fill="#FFFCF5" opacity=".97"/></g>
 <text x="360" y="1066" text-anchor="middle" font-family="Bricolage Grotesque" font-weight="800" font-size="40" fill="${P.ink}">OKE. Aku belajar</text>
 <g transform="rotate(-3 360 1140)"><text x="360" y="1150" text-anchor="middle" font-family="Bricolage Grotesque" font-weight="800" font-size="86" fill="${P.red}" letter-spacing="2">TUJUH JAM!</text></g>
 <text x="360" y="1150" text-anchor="middle" font-family="Bricolage Grotesque" font-weight="800" font-size="86" fill="${P.red}" opacity=".18" transform="translate(6 -3) rotate(-3 360 1140)">TUJUH JAM!</text>
 ${L.handle()}${L.vignette()}`);
// ---- HANCUR
const hancur=svg(`${L.paper({night:true,lamp:[360,780,300]})}
 <g transform="translate(360 600)">${L.artaBust('hancur').replace('l76 -100','l96 -46').replace('l76 -100','l96 -46').replace('l70 -92','l90 -42').replace('M116 -240 l12 -20 l-1 24z','M136 -186 l24 -4 l-14 18z').replace('M108 -229 l12 -15','M124 -180 l15 -6')}</g>
 ${L.wc(`<rect x="70" y="820" width="580" height="22" rx="4" fill="#E2C8A2"/><rect x="92" y="842" width="536" height="200" fill="#EAD5B4"/>`)}
 ${L.ink(`<path d="M70 820 h580 M70 842 h580"/><rect x="92" y="842" width="536" height="200"/>`,3)}
 <g transform="rotate(-4 360 790)"><g filter="url(#soft)"><rect x="250" y="740" width="220" height="104" fill="#FFFCF5"/></g>
  ${L.ink(`<rect x="250" y="740" width="220" height="104"/>`,2.6)}
  ${L.hand(360,820,'58',{size:92,color:P.red,anchor:'middle'})}${L.ink(`<ellipse cx="360" cy="792" rx="88" ry="58"/>`,4,P.red)}</g>
 <rect width="720" height="1280" fill="url(#darkEdge)"/>
 <text x="360" y="1120" text-anchor="middle" font-family="Bricolage Grotesque" font-weight="800" font-size="64" fill="#FFFCF5" opacity=".95">58</text>
 <text x="360" y="1168" text-anchor="middle" font-family="Caveat" font-weight="700" font-size="34" fill="#E7DCC8" opacity=".8">lima puluh... delapan.</text>
 ${L.handle()}`);
const head=`<!doctype html><html><head><meta charset="utf-8"><link href="https://fonts.googleapis.com/css2?family=Caveat:wght@600;700&family=Plus+Jakarta+Sans:wght@700;800&family=Bricolage+Grotesque:opsz,wght@12..96,800&display=swap" rel="stylesheet"><style>body{margin:0}</style></head><body>`;
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:720,height:1280}});
for(const [k,v] of Object.entries({marah,hancur})){fs.writeFileSync(`out/emo-${k}.html`,head+v+'</body></html>');await p.goto('file://'+__dirname+`/out/emo-${k}.html`,{waitUntil:'networkidle'});await p.evaluate(()=>document.fonts.ready);await p.waitForTimeout(300);await p.screenshot({path:`out/emo-${k}.png`});}
await b.close();})();
