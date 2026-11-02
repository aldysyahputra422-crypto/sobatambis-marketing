const L = require('./lib.js'); const {P} = L; const fs=require('fs');
const logo = 'data:image/png;base64,' + fs.readFileSync(__dirname+'/logo-sobat-ambis.png').toString('base64');
const svg = (body) => `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="720" height="1280" viewBox="0 0 720 1280">${L.defs()}${body}</svg>`;

// ---- props
const window_ = (night) => `
  ${L.wc(`<rect x="470" y="180" width="170" height="200" rx="6" fill="${night?'#3B4C86':'#BFD9F0'}" opacity="${night?.55:.7}"/>`)}
  ${night?`<path d="M612 214 a20 20 0 1 0 7 27 a16 16 0 1 1 -7 -27z" fill="#FFF3C4"/>`:`<circle cx="602" cy="226" r="20" fill="#FFE7A0"/>`}
  ${L.ink(`<rect x="470" y="180" width="170" height="200" rx="6"/><line x1="555" y1="180" x2="555" y2="380"/><line x1="470" y1="280" x2="640" y2="280"/><path d="M458 380 h194"/>`,3)}`;
const board = () => `
  <g transform="rotate(-3 300 330)">
    <g filter="url(#soft)">${L.wc(`<rect x="150" y="196" width="320" height="270" fill="#FFFCF5"/>`)}</g>
    ${L.ink(`<rect x="150" y="196" width="320" height="270"/>`,3)}
    <circle cx="310" cy="206" r="7" fill="${P.red}"/>
    ${L.hand(310,270,'100 HARI',{size:58,anchor:'middle'})}
    ${L.hand(310,330,'MENUJU',{size:40,anchor:'middle'})}
    ${L.highlight(222,348,176,40,.8)}
    ${L.hand(310,388,'ITS!!',{size:64,anchor:'middle',color:P.ink})}
    ${L.hand(310,440,'Teknik Informatika',{size:30,anchor:'middle',color:P.red})}
  </g>`;
const desk = (y=820) => `
  ${L.wc(`<rect x="70" y="${y}" width="580" height="22" rx="4" fill="#E2C8A2"/><rect x="92" y="${y+22}" width="536" height="200" fill="#EAD5B4"/>`)}
  <rect x="92" y="${y+22}" width="536" height="26" fill="#C9AC84" opacity=".45"/>
  ${L.ink(`<path d="M70 ${y} h580 M70 ${y+22} h580"/><rect x="92" y="${y+22}" width="536" height="200"/><rect x="380" y="${y+70}" width="200" height="70" rx="6"/><path d="M455 ${y+105} h50"/>`,3)}`;
const lampDesk = () => `
  ${L.ink(`<path d="M590 820 v-110 l-50 -66"/><path d="M500 630 l64 -30 l16 36 z"/>`,3)}
  ${L.wc(`<path d="M500 630 l64 -30 l16 36 z" fill="#E8A13A"/>`)}`;
const scorePaper = (x,y,rot=-7) => `
  <g transform="rotate(${rot} ${x+60} ${y+30})">
    <g filter="url(#soft)"><rect x="${x}" y="${y}" width="122" height="62" fill="#FFFCF5"/></g>
    ${L.ink(`<rect x="${x}" y="${y}" width="122" height="62"/>`,2.6)}
    ${L.hand(x+61,y+47,'58',{size:50,color:P.red,anchor:'middle'})}
    ${L.ink(`<ellipse cx="${x+61}" cy="${y+31}" rx="50" ry="34"/>`,3,P.red)}
  </g>`;
const clock = (x,y,t) => `${L.wc(`<circle cx="${x}" cy="${y}" r="44" fill="#FFFCF5"/>`)}${L.ink(`<circle cx="${x}" cy="${y}" r="44"/><path d="M${x} ${y} v-30 M${x} ${y} l20 8"/>`,3)}${L.hand(x,y+80,t,{size:30,anchor:'middle'})}`;
const sticky = (x,y,w,h,txt,rot,color='#FFE58A',size=30) => `
  <g transform="rotate(${rot} ${x+w/2} ${y+h/2})"><g filter="url(#soft)">${L.wc(`<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${color}"/>`)}</g>
  <rect x="${x+w/2-22}" y="${y-8}" width="44" height="16" fill="#EDE3CF" opacity=".85"/>
  ${txt.map((t,i)=>L.hand(x+w/2,y+44+i*34,t,{size,anchor:'middle'})).join('')}</g>`;

// ================= FRAME 1 · HOOK =================
const f1 = svg(`${L.paper()}
  ${window_(false)}
  ${board()}
  <g transform="translate(250 690) scale(.92)">${L.artaFull('ambis','tunjuk')}</g>
  ${L.hand(470,560,'semangat',{size:34,color:P.red,rot:-6})}${L.hand(486,596,'level dewa',{size:34,color:P.red,rot:-6})}
  ${L.ink(`<path d="M520 610 q-10 34 -64 60"/>`,2.6,P.red)}<path d="M458 674 l-12 -2 l9 -10z" fill="${P.red}"/>
  ${L.epBadge(1,'Rencana Sempurna')}
  ${L.capLines(['Hari ke-1.','Aku punya rencana sempurna.'],1110)}
  ${L.handle()}${L.vignette()}`);

// ================= FRAME 2 · JADWAL =================
const f2 = svg(`${L.paper()}
  ${sticky(130,170,190,170,['04.00','bangun!'],-6)}
  ${sticky(350,150,210,170,['belajar','5 jam/hari'],4,'#FFFCF5')}
  ${sticky(150,380,200,160,['0 main HP'],3,'#FFFCF5')}
  ${sticky(380,370,200,170,['Tryout','tiap hari'],-4)}
  ${L.ink(`<ellipse cx="470" cy="455" rx="130" ry="92"/>`,3,P.red)}
  ${L.hand(560,620,'realistis??',{size:40,color:P.red,rot:-8})}
  <g transform="translate(360 820)">${L.artaBust('ambis')}</g>
  ${L.epBadge(1,'Rencana Sempurna')}
  ${L.capLines(['Belajar 5 jam sehari.','Nggak ada main HP.'],1110)}
  ${L.handle()}${L.vignette()}`);

// ================= FRAME 3 · BU RATNA =================
const wa = `
  <g transform="rotate(2 400 300)">
  <g filter="url(#soft)"><rect x="190" y="170" width="430" height="230" rx="22" fill="#FFFCF5"/></g>
  ${L.ink(`<rect x="190" y="170" width="430" height="230" rx="22"/>`,2.8)}
  <rect x="190" y="170" width="430" height="58" rx="22" fill="${P.batik}" opacity=".95"/><rect x="190" y="200" width="430" height="28" fill="${P.batik}" opacity=".95"/>
  <text x="216" y="208" font-family="Plus Jakarta Sans" font-weight="800" font-size="21" fill="#fff">Grup Wali Murid XI-3</text>
  <text x="594" y="208" text-anchor="end" font-family="Plus Jakarta Sans" font-weight="700" font-size="17" fill="#d6efe9">127 anggota</text>
  <rect x="214" y="246" width="380" height="128" rx="16" fill="#E8F4EC"/>
  <text x="232" y="276" font-family="Plus Jakarta Sans" font-weight="800" font-size="18" fill="${P.batik}">Bu Sinta</text>
  ${L.hand(232,316,'Alhamdulillah anak saya',{size:31})}
  ${L.hand(232,352,'sekarang les di 3 tempat :)',{size:31})}
  </g>`;
const f3 = svg(`${L.paper()}
  ${wa}
  <g transform="translate(330 760)">${L.ratnaBust('lirik')}</g>
  ${L.hand(530,610,'aduh...',{size:42,color:P.red,rot:-6})}
  ${L.epBadge(1,'Rencana Sempurna')}
  ${L.capLines(['"Anaknya Bu Sinta les','di tiga tempat lho, Ta."'],1110)}
  ${L.handle()}${L.vignette()}`);

// ================= FRAME 4 · MALAM, NILAI 58, MBIS MENGINTIP =================
const f4 = svg(`${L.paper({night:true, lamp:[560,700,420]})}
  ${window_(true)}
  ${clock(250,260,'00.47')}
  ${lampDesk()}
  <g transform="translate(320 650)">${L.artaBust('datar')}</g>
  <g transform="translate(612 808) rotate(-8)">${L.mbis('intip',.78)}</g>
  ${desk(820)}
  ${scorePaper(400,752,-7)}
  ${L.hand(440,520,'Hari ke-12',{size:38,color:P.red,rot:-4})}
  <!-- pojok halaman terlipat + Mbis mengintip -->

  ${L.epBadge(1,'Rencana Sempurna')}
  ${L.capLines(['Rencananya sempurna.','Nilainya... nggak.'],1110)}
  ${L.handle()}${L.vignette()}`);

// ================= COVER (aman untuk grid 3:4) =================
const cover = (ep, line1, line2, art, sub='Musim 1 · Menuju ITS', hi=[0,0,0]) => svg(`${L.paper()}
  <text x="360" y="250" text-anchor="middle" font-family="Plus Jakarta Sans" font-weight="800" font-size="26" fill="${P.red}" letter-spacing="3">${sub.toUpperCase()}</text>
  <g filter="url(#soft)"><rect x="${360-(String(ep).length*9+46)}" y="276" width="${(String(ep).length*9+46)*2}" height="56" rx="28" fill="${P.ink}"/></g>
  <text x="360" y="314" text-anchor="middle" font-family="Plus Jakarta Sans" font-weight="800" font-size="26" fill="${P.yel}">${String(ep).startsWith("MBIS")?ep:"EP."+ep}</text>
  ${hi[2]?L.highlight(hi[0],hi[1],hi[2],34,.85):''}
  <text x="360" y="418" text-anchor="middle" font-family="Bricolage Grotesque" font-weight="800" font-size="78" fill="${P.ink}">${line1}</text>
  <text x="360" y="500" text-anchor="middle" font-family="Bricolage Grotesque" font-weight="800" font-size="78" fill="${P.ink}">${line2}</text>
  ${art}
  <image href="${logo}" x="290" y="1100" width="140" height="140" preserveAspectRatio="xMidYMid slice" clip-path="inset(46px 0 46px 0 round 10px)"/>
  ${L.vignette()}`);
const c1 = cover(1,'Rencana','Sempurna', `<g transform="translate(360 745) scale(.8)">${L.artaFull('ambis','pinggang')}</g>`,'Musim 1 · Menuju ITS',[210,470,300]);
const c2 = cover(2,'Kenapa Rencanaku','Gagal?', `<g transform="translate(360 745) scale(.8)">${L.artaFull('kaget','lemas')}</g>`,'Musim 1 · Menuju ITS',[160,470,400]);
const c3 = cover(3,'Kucing Siapa','Ini??', `<g transform="translate(360 760) scale(2)">${L.mbis('senang')}</g>`,'Musim 1 · Menuju ITS',[210,470,300]);
const c4 = cover('MBIS #1','Mbis Jawab:','SNBT 2027', `<g transform="translate(360 760) scale(2)">${L.mbis('intip')}</g>`,'Mbis Bereaksi',[150,470,420]);
const c5 = cover(4,'Ibu vs','Grup WA', `<g transform="translate(360 760)">${L.ratnaBust('lirik')}</g>`,'Musim 1 · Menuju ITS',[260,470,200]);
const c6 = cover(5,'Tidur Itu','Strategi', `<g transform="translate(360 745) scale(.8)">${L.artaFull('senyum','pinggang')}</g>`,'Musim 1 · Menuju ITS',[220,470,280]);

// ================= END CARD =================
const end = svg(`${L.paper({lamp:[360,640,520]})}
  ${L.hand(360,330,'Bersambung...',{size:84,anchor:'middle'})}
  ${L.highlight(170,350,380,20,.75)}
  ${L.hand(360,450,'Ep.2: Kenapa rencana yang sempurna',{size:36,anchor:'middle',color:P.red})}
  ${L.hand(360,494,'justru bikin nilai turun?',{size:36,anchor:'middle',color:P.red})}
  <g transform="translate(360 690) scale(1.25)">${L.mbis('senang')}</g>
  <g filter="url(#soft)"><rect x="110" y="900" width="500" height="170" rx="24" fill="#FFFCF5"/></g>
  <text x="360" y="958" text-anchor="middle" font-family="Bricolage Grotesque" font-weight="800" font-size="36" fill="${P.ink}">Anakmu juga begini?</text>
  <text x="360" y="1010" text-anchor="middle" font-family="Plus Jakarta Sans" font-weight="800" font-size="27" fill="${P.ink}">Komen <tspan fill="${P.red}">INFO</tspan> untuk konsultasi gratis</text>
  <text x="360" y="1046" text-anchor="middle" font-family="Plus Jakarta Sans" font-weight="700" font-size="20" fill="#6b5a45">Les privat 1-on-1 · mentor mahasiswa PTN · Surabaya</text>
  <image href="${logo}" x="270" y="1080" width="180" height="180" preserveAspectRatio="xMidYMid slice" clip-path="inset(58px 0 58px 0 round 10px)"/>
  ${L.vignette()}`);

module.exports = {f1,f2,f3,f4,c1,c2,c3,c4,c5,c6,end};
