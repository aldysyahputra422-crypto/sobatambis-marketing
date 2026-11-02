const F=require('./frames.js');const {chromium}=require('playwright');const fs=require('fs');
const head=`<!doctype html><html><head><meta charset="utf-8"><link href="https://fonts.googleapis.com/css2?family=Caveat:wght@600;700&family=Plus+Jakarta+Sans:wght@700;800&family=Bricolage+Grotesque:opsz,wght@12..96,800&display=swap" rel="stylesheet"><style>body{margin:0}</style></head><body>`;
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:720,height:1280}});
for(const [k,v] of Object.entries(F)){fs.writeFileSync(`out/${k}.html`,head+v+'</body></html>');await p.goto('file://'+__dirname+`/out/${k}.html`,{waitUntil:'networkidle'});await p.evaluate(()=>document.fonts.ready);await p.waitForTimeout(300);await p.screenshot({path:`out/${k}.png`});}
await b.close();})();
