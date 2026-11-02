// @ts-nocheck
// Sistem desain 'jurnal premium' (port dari docs/desain/sumber/lib.js) + parameter animasi.
// Sobat Ambis — "Jurnal Premium" design system (SVG string builders)
// Shared by stills now and by the Remotion template later.
const P = {
  paper:'#F7EEDC', paper2:'#F1E5CD', line:'#CFDBEC', margin:'#E3A79C',
  ink:'#1E3A8A', ink2:'#2C4A9A', red:'#C2412D', yel:'#FBC531', yelSh:'#E3A514',
  skin:'#F1C9A5', skinSh:'#E2AE86', hair:'#24325E', hairHi:'#3A4C82',
  shirt:'#FFFCF5', shirtSh:'#E8DCC6', skirt:'#8C93A4', skirtSh:'#757C8E',
  hijab:'#D59A8B', hijabSh:'#BF8174', batik:'#3E7C6E', batikSh:'#33685C', batikDot:'#F3D9A4',
  jacket:'#2B3F73', jacketSh:'#21325D', pants:'#3A3F4F', shoe:'#2A2A2A', blush:'#EE9A86',
};

const defs = (seed = 5) => `
<defs>
  <filter id="grain" x="0" y="0" width="100%" height="100%">
    <feTurbulence type="fractalNoise" baseFrequency=".85" numOctaves="3" seed="3" result="n"/>
    <feColorMatrix in="n" type="matrix" values="0 0 0 0 .5  0 0 0 0 .4  0 0 0 0 .28  0 0 0 .085 0"/>
  </filter>
  <filter id="ink" x="-5%" y="-5%" width="110%" height="110%"><feTurbulence type="fractalNoise" baseFrequency=".045" numOctaves="1" seed="${seed}"/><feDisplacementMap in="SourceGraphic" scale="1.8"/></filter>
  <filter id="wc" x="-5%" y="-5%" width="110%" height="110%"><feTurbulence type="fractalNoise" baseFrequency=".035" numOctaves="2" seed="11"/><feDisplacementMap in="SourceGraphic" scale="2.6"/></filter>
  <filter id="hl" x="-5%" y="-30%" width="110%" height="160%"><feTurbulence type="fractalNoise" baseFrequency=".015 .35" numOctaves="1" seed="9"/><feDisplacementMap in="SourceGraphic" scale="7"/></filter>
  <filter id="soft" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="10" stdDeviation="12" flood-color="#5a3b1c" flood-opacity=".18"/></filter>
  <radialGradient id="vig" cx=".5" cy=".46" r=".78"><stop offset=".58" stop-color="#4a2f14" stop-opacity="0"/><stop offset="1" stop-color="#4a2f14" stop-opacity=".30"/></radialGradient>
  <radialGradient id="lampWarm" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#FFD98A" stop-opacity=".62"/><stop offset=".55" stop-color="#FFC861" stop-opacity=".2"/><stop offset="1" stop-color="#FFC861" stop-opacity="0"/></radialGradient>
  <linearGradient id="night" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1C2550" stop-opacity=".16"/><stop offset="1" stop-color="#1C2550" stop-opacity=".04"/></linearGradient>
  <pattern id="ruled" width="720" height="52" patternUnits="userSpaceOnUse"><line x1="0" y1="51" x2="720" y2="51" stroke="${P.line}" stroke-width="1.6"/></pattern>
  <pattern id="batik" width="34" height="34" patternUnits="userSpaceOnUse"><path d="M17 7 l7 10 l-7 10 l-7 -10z" fill="none" stroke="${P.batikDot}" stroke-width="2"/><circle cx="17" cy="17" r="2.2" fill="${P.batikDot}"/><circle cx="0" cy="0" r="2" fill="${P.batikDot}"/><circle cx="34" cy="34" r="2" fill="${P.batikDot}"/></pattern>
</defs>`;

// ---------- page / paper ----------
const paper = ({night=false, lamp=null}={}) => `
<rect width="720" height="1280" fill="${P.paper}"/>
<rect width="720" height="1280" fill="url(#ruled)"/>
<line x1="88" y1="0" x2="88" y2="1280" stroke="${P.margin}" stroke-width="2"/>
<g fill="${P.paper2}" stroke="#CDBFA4" stroke-width="1.5"><circle cx="38" cy="210" r="12"/><circle cx="38" cy="640" r="12"/><circle cx="38" cy="1070" r="12"/></g>
${night?'<rect width="720" height="1280" fill="url(#night)"/>':''}
<rect width="720" height="1280" filter="url(#grain)"/>
${lamp?`<ellipse cx="${lamp[0]}" cy="${lamp[1]}" rx="${lamp[2]}" ry="${lamp[2]}" fill="url(#lampWarm)"/>`:''}`;
const vignette = () => `<rect width="720" height="1280" fill="url(#vig)"/>`;

// ink group helper
const ink = (inner, w=3.2, c=P.ink) => `<g filter="url(#ink)" fill="none" stroke="${c}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round">${inner}</g>`;
const wc = (inner) => `<g filter="url(#wc)">${inner}</g>`;
const hand = (x,y,t,{size=34,color=P.ink,rot=0,anchor='start',weight=700}={}) => `<text x="${x}" y="${y}" font-family="Caveat" font-weight="${weight}" font-size="${size}" fill="${color}" text-anchor="${anchor}" ${rot?`transform="rotate(${rot} ${x} ${y})"`:''}>${t}</text>`;
const highlight = (x,y,w,h=26,op=.75) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${P.yel}" opacity="${op}" filter="url(#hl)" style="mix-blend-mode:multiply"/>`;

// ---------- faces ----------
function eyes(expr, s=1, kedip=0){
  const inner = eyesInner(expr, s);
  if (!kedip || expr==='senyum') return inner;
  const k = Math.max(0.08, 1 - kedip);
  return `<g transform="translate(0 ${12*s}) scale(1 ${k}) translate(0 ${-12*s})">${inner}</g>`;
}
function eyesInner(expr, s=1){
  const L=-34*s, R=34*s, Y=12*s, rx=26*s, ry=17*s;
  const lid = (x,ang=0)=>`<path d="M${x-rx-2} ${Y-ry*0.15} h${2*rx+4}" stroke="${P.ink}" stroke-width="${4.2*s}" stroke-linecap="round" transform="rotate(${ang} ${x} ${Y})"/>`;
  const white=(x,ryy=ry)=>`<ellipse cx="${x}" cy="${Y}" rx="${rx}" ry="${ryy}" fill="#fff" stroke="${P.ink}" stroke-width="${3.2*s}"/>`;
  const pup=(x,dx=4,dy=6,r=5.5)=>`<circle cx="${x+dx*s}" cy="${Y+dy*s}" r="${r*s}" fill="${P.ink}"/>`;
  switch(expr){
    case 'datar': return white(L)+white(R)+lid(L)+lid(R)+pup(L)+pup(R)
      +`<path d="M${L-22*s} ${Y+26*s} q${22*s} ${7*s} ${40*s} 0 M${R-18*s} ${Y+26*s} q${20*s} ${7*s} ${40*s} 0" stroke="#9C6B8E" stroke-width="${2.4*s}" fill="none" opacity=".75"/>`;
    case 'ambis': return white(L,ry*1.1)+white(R,ry*1.1)+pup(L,3,0,7)+pup(R,3,0,7)
      +`<circle cx="${L+6*s}" cy="${Y-5*s}" r="${2.6*s}" fill="#fff"/><circle cx="${R+6*s}" cy="${Y-5*s}" r="${2.6*s}" fill="#fff"/>`
      +`<path d="M${L-24*s} ${Y-30*s} l${40*s} ${10*s} M${R+24*s} ${Y-30*s} l${-40*s} ${10*s}" stroke="${P.hair}" stroke-width="${7*s}" stroke-linecap="round"/>`;
    case 'kaget': return `<circle cx="${L}" cy="${Y}" r="${21*s}" fill="#fff" stroke="${P.ink}" stroke-width="${3.2*s}"/><circle cx="${R}" cy="${Y}" r="${21*s}" fill="#fff" stroke="${P.ink}" stroke-width="${3.2*s}"/>`+pup(L,0,0,5)+pup(R,0,0,5)
      +`<path d="M${L-18*s} ${Y-36*s} q${18*s} ${-10*s} ${36*s} 0 M${R-18*s} ${Y-36*s} q${18*s} ${-10*s} ${36*s} 0" stroke="${P.hair}" stroke-width="${6*s}" fill="none" stroke-linecap="round"/>`;
    case 'senyum': return `<path d="M${L-18*s} ${Y+4*s} q${18*s} ${-16*s} ${36*s} 0 M${R-18*s} ${Y+4*s} q${18*s} ${-16*s} ${36*s} 0" stroke="${P.ink}" stroke-width="${5*s}" fill="none" stroke-linecap="round"/>`;
    case 'lirik': return white(L)+white(R)+lid(L,-4)+lid(R,4)+pup(L,14,6)+pup(R,14,6);
    case 'marah': return white(L,ry*.9)+white(R,ry*.9)+pup(L,2,4,6.5)+pup(R,-2,4,6.5)
      +`<path d="M${L-30*s} ${Y-34*s} l${50*s} ${22*s} M${R+30*s} ${Y-34*s} l${-50*s} ${22*s}" stroke="${P.hair}" stroke-width="${9*s}" stroke-linecap="round"/>`
      +`<path d="M${L-24*s} ${Y-6*s} l${48*s} ${10*s} M${R+24*s} ${Y-6*s} l${-48*s} ${10*s}" stroke="${P.ink}" stroke-width="${4*s}" stroke-linecap="round"/>`;
    case 'hancur': return white(L)+white(R)+pup(L,0,8,6)+pup(R,0,8,6)
      +`<path d="M${L-20*s} ${Y-30*s} l${36*s} ${-8*s} M${R+20*s} ${Y-30*s} l${-36*s} ${-8*s}" stroke="${P.hair}" stroke-width="${6*s}" stroke-linecap="round"/>`
      +`<path d="M${L-24*s} ${Y+14*s} q${24*s} ${10*s} ${48*s} 0 M${R-24*s} ${Y+14*s} q${24*s} ${10*s} ${48*s} 0" stroke="#7FB3E8" stroke-width="${5*s}" fill="none" opacity=".9"/>`
      +`<path d="M${R+20*s} ${Y+22*s} q${6*s} ${16*s} 0 ${26*s} q${-6*s} ${-10*s} 0 ${-26*s}z" fill="#9CCBF2"/>`;
  }
  return '';
}
function mouth(expr, s=1, buka=0){
  if (buka > 0.08 && ['datar','senyum','lirik','hancur'].includes(expr)) {
    const Y=62*s; return `<ellipse cx="0" cy="${Y}" rx="${(9+6*buka)*s}" ry="${(3+11*buka)*s}" fill="#8A3A33" stroke="${P.ink}" stroke-width="${3*s}"/>`;
  }
  if (buka > 0.08 && ['ambis','marah','kaget'].includes(expr)) {
    return `<g transform="translate(0 ${62*s}) scale(${1+0.15*buka} ${0.8+0.5*buka}) translate(0 ${-62*s})">${mouthDiam(expr,s)}</g>`;
  }
  return mouthDiam(expr, s);
}
function mouthDiam(expr, s=1){
  const Y=62*s;
  return {
    datar:`<path d="M${-13*s} ${Y} h${26*s}" stroke="${P.ink}" stroke-width="${4*s}" stroke-linecap="round"/>`,
    ambis:`<path d="M${-22*s} ${Y-6*s} q${22*s} ${26*s} ${44*s} 0 z" fill="#8A3A33" stroke="${P.ink}" stroke-width="${3*s}"/><path d="M${-14*s} ${Y-3*s} h${28*s}" stroke="#fff" stroke-width="${5*s}"/>`,
    kaget:`<ellipse cx="0" cy="${Y}" rx="${11*s}" ry="${14*s}" fill="#8A3A33" stroke="${P.ink}" stroke-width="${3*s}"/>`,
    senyum:`<path d="M${-18*s} ${Y-6*s} q${18*s} ${18*s} ${36*s} 0" stroke="${P.ink}" stroke-width="${4*s}" fill="none" stroke-linecap="round"/>`,
    lirik:`<path d="M${-12*s} ${Y} q${14*s} ${-6*s} ${26*s} ${2*s}" stroke="${P.ink}" stroke-width="${4*s}" fill="none" stroke-linecap="round"/>`,
    marah:`<path d="M${-30*s} ${Y-12*s} q${30*s} ${-8*s} ${60*s} 0 q${-4*s} ${34*s} ${-30*s} ${34*s} q${-26*s} 0 ${-30*s} ${-34*s}z" fill="#8A3A33" stroke="${P.ink}" stroke-width="${3*s}"/><path d="M${-22*s} ${Y-9*s} h${44*s}" stroke="#fff" stroke-width="${6*s}"/>`,
    hancur:`<path d="M${-16*s} ${Y+4*s} q${16*s} ${-14*s} ${32*s} 0" stroke="${P.ink}" stroke-width="${4*s}" fill="none" stroke-linecap="round"/>`,
  }[expr]||'';
}

// ---------- ARTA ----------
// pose: 'pinggang' | 'tunjuk' | 'lemas' ; view: 'full' | 'bust'
function artaHead(expr='datar', o={}){
  const {kedip=0, buka=0, miring=0} = o;
  return `
  <!-- rambut belakang panjang -->
  ${wc(`<path d="M-92 -8 q-26 118 -12 176 q34 -14 52 -4 q-30 -84 -10 -158z M92 -8 q26 118 12 176 q-34 -14 -52 -4 q30 -84 10 -158z" fill="${P.hair}"/>`)}
  <!-- pensil di cepol -->
  <g transform="rotate(${miring} 40 -108)">
  <path d="M40 -140 l76 -100" stroke="${P.ink}" stroke-width="15" stroke-linecap="round"/>
  <path d="M40 -140 l76 -100" stroke="${P.yel}" stroke-width="9" stroke-linecap="round"/>
  <path d="M43 -144 l70 -92" stroke="${P.yelSh}" stroke-width="2.5" stroke-linecap="round"/>
  <path d="M116 -240 l12 -20 l-1 24z" fill="${P.ink}"/><path d="M108 -229 l12 -15" stroke="#F4D7AE" stroke-width="6"/>
  </g>
  ${wc(`<circle cx="40" cy="-108" r="38" fill="${P.hair}"/>`)}
  ${ink(`<circle cx="40" cy="-108" r="38"/><path d="M22 -120 q18 -14 36 2 M18 -98 q22 12 42 -2" stroke="${P.hairHi}" stroke-width="3"/>`,3.2)}
  <!-- kepala -->
  ${wc(`<ellipse cx="0" cy="4" rx="94" ry="92" fill="${P.skin}"/>`)}
  <ellipse cx="0" cy="66" rx="64" ry="22" fill="${P.skinSh}" opacity=".35"/>
  ${wc(`<ellipse cx="-92" cy="18" rx="13" ry="19" fill="${P.skinSh}"/><ellipse cx="92" cy="18" rx="13" ry="19" fill="${P.skinSh}"/>`)}
  ${wc(`<path d="M-96 2 q6 -100 96 -100 q94 0 98 96 q-28 -42 -78 -40 q-22 26 -58 26 q14 -12 16 -26 q-46 4 -74 44z" fill="${P.hair}"/>`)}
  <path d="M-30 -80 q30 -12 58 -4" stroke="${P.hairHi}" stroke-width="5" fill="none" stroke-linecap="round" opacity=".8"/>
  ${ink(`<ellipse cx="0" cy="4" rx="94" ry="92"/><path d="M-96 2 q6 -100 96 -100 q94 0 98 96 q-28 -42 -78 -40 q-22 26 -58 26 q14 -12 16 -26 q-46 4 -74 44z"/><path d="M-92 -8 q-26 118 -12 176 q34 -14 52 -4 M92 -8 q26 118 12 176 q-34 -14 -52 -4"/>`)}
  <ellipse cx="-58" cy="46" rx="15" ry="9" fill="${P.blush}" opacity=".45"/><ellipse cx="58" cy="46" rx="15" ry="9" fill="${P.blush}" opacity=".45"/>
  ${eyes(expr,1,kedip)}${mouth(expr,1,buka)}`;
}
function artaFull(expr='datar', pose='pinggang', o={}){
  const arms = {
    pinggang:`<path d="M-66 132 q-46 40 -18 92" /><path d="M66 132 q46 40 18 92"/>`,
    tunjuk:`<path d="M-66 132 q-40 50 -26 118"/><path d="M66 132 q74 -4 92 -150"/>`,
    lemas:`<path d="M-66 132 q-24 60 -22 140"/><path d="M66 132 q24 60 22 140"/>`,
  }[pose];
  const hands = {
    pinggang:`<circle cx="-82" cy="226" r="13"/><circle cx="82" cy="226" r="13"/>`,
    tunjuk:`<circle cx="-92" cy="252" r="13"/><circle cx="158" cy="-22" r="14"/><path d="M162 -34 l10 -26" stroke-width="9" stroke-linecap="round"/>`,
    lemas:`<circle cx="-88" cy="274" r="13"/><circle cx="88" cy="274" r="13"/>`,
  }[pose];
  return `
  <ellipse cx="0" cy="452" rx="104" ry="14" fill="#4a2f14" opacity=".14"/>
  <!-- kaki -->
  ${wc(`<rect x="-44" y="300" width="28" height="122" rx="12" fill="${P.skin}"/><rect x="16" y="300" width="28" height="122" rx="12" fill="${P.skin}"/>`)}
  <rect x="-46" y="392" width="32" height="30" fill="#fff"/><rect x="14" y="392" width="32" height="30" fill="#fff"/>
  ${wc(`<path d="M-50 420 h40 v18 h-50 q0 -18 10 -18z" fill="${P.shoe}"/><path d="M10 420 h40 q10 0 10 18 h-50z" fill="${P.shoe}"/>`)}
  <!-- rok -->
  ${wc(`<path d="M-74 232 l-16 104 h180 l-16 -104z" fill="${P.skirt}"/>`)}
  <path d="M-40 240 l-8 92 M0 240 v94 M40 240 l8 92" stroke="${P.skirtSh}" stroke-width="3"/>
  <!-- kemeja -->
  ${wc(`<path d="M-74 112 q74 -32 148 0 l8 128 h-164z" fill="${P.shirt}"/>`)}
  <path d="M-74 112 q74 -32 148 0 l2 26 q-76 -24 -152 0z" fill="${P.shirtSh}" opacity=".8"/>
  <!-- lengan -->
  <g stroke="${P.ink}" stroke-width="34" fill="none" stroke-linecap="round" filter="url(#ink)">${arms}</g>
  <g stroke="${P.shirt}" stroke-width="27" fill="none" stroke-linecap="round">${arms}</g>
  <g fill="${P.skin}">${hands}</g>
  ${ink(`<path d="M-74 112 q74 -32 148 0 l8 128 h-164z"/><path d="M-74 232 l-16 104 h180 l-16 -104"/>
    <path d="M-24 100 l24 28 l24 -28"/><rect x="26" y="148" width="28" height="22"/>
    <rect x="-44" y="300" width="28" height="122" rx="12"/><rect x="16" y="300" width="28" height="122" rx="12"/>`)}
  <g fill="none" stroke="${P.ink}" stroke-width="2.6">${hands}</g>
  <circle cx="40" cy="160" r="5" fill="${P.red}"/>
  <g transform="translate(0 -6)">${artaHead(expr,o)}</g>`;
}
function artaBust(expr='datar', o={}){ // for desk scenes: torso only
  return `
  ${wc(`<path d="M-80 112 q80 -34 160 0 l12 150 h-184z" fill="${P.shirt}"/>`)}
  <path d="M-80 112 q80 -34 160 0 l2 28 q-82 -24 -164 0z" fill="${P.shirtSh}" opacity=".8"/>
  ${ink(`<path d="M-80 112 q80 -34 160 0 l12 150 h-184z"/><path d="M-24 100 l24 28 l24 -28"/><rect x="28" y="150" width="28" height="22"/>`)}
  <circle cx="42" cy="162" r="5" fill="${P.red}"/>
  <g transform="translate(0 -6)">${artaHead(expr,o)}</g>`;
}

// ---------- MBIS (kucing stabilo) ----------
function mbis(expr='senang', s=1, o={}){
  const {kedip=0} = o;
  const face = {
    senang:`<ellipse cx="-22" cy="0" rx="15" ry="18" fill="#fff" stroke="${P.ink}" stroke-width="3"/><ellipse cx="22" cy="0" rx="15" ry="18" fill="#fff" stroke="${P.ink}" stroke-width="3"/><circle cx="-18" cy="4" r="6.5" fill="${P.ink}"/><circle cx="26" cy="4" r="6.5" fill="${P.ink}"/><circle cx="-16" cy="1" r="2" fill="#fff"/><circle cx="28" cy="1" r="2" fill="#fff"/>`,
    intip:`<ellipse cx="-22" cy="2" rx="15" ry="13" fill="#fff" stroke="${P.ink}" stroke-width="3"/><ellipse cx="22" cy="2" rx="15" ry="13" fill="#fff" stroke="${P.ink}" stroke-width="3"/><path d="M-38 -4 h32 M6 -4 h32" stroke="${P.ink}" stroke-width="4" stroke-linecap="round"/><circle cx="-12" cy="6" r="5.5" fill="${P.ink}"/><circle cx="32" cy="6" r="5.5" fill="${P.ink}"/>`,
  }[expr];
  return `<g transform="scale(${s})">
    <ellipse cx="0" cy="104" rx="58" ry="8" fill="#4a2f14" opacity=".14"/>
    <path d="M52 60 q60 -6 52 -70 q-4 -22 -18 -24" stroke="${P.yel}" stroke-width="15" fill="none" stroke-linecap="round"/>
    <path d="M86 -34 q12 2 16 14" stroke="${P.ink}" stroke-width="15" fill="none" stroke-linecap="round"/>
    ${ink(`<path d="M52 60 q60 -6 52 -70 q-4 -22 -18 -24"/>`,2.6)}
    ${wc(`<path d="M-58 50 q-10 -96 58 -98 q68 2 58 98 q-4 46 -58 48 q-54 -2 -58 -48z" fill="${P.yel}"/><path d="M-50 -30 l-6 -46 l36 22z" fill="${P.yel}"/>`)}
    <path d="M-58 50 q-4 44 58 48 q50 -2 58 -48 q-30 30 -58 30 q-34 0 -58 -30z" fill="${P.yelSh}" opacity=".5"/>
    <path d="M24 -54 l30 -26 l8 44z" fill="${P.ink}"/><path d="M30 -56 l20 -16" stroke="#fff" stroke-width="3" opacity=".5"/>
    ${ink(`<path d="M-58 50 q-10 -96 58 -98 q68 2 58 98 q-4 46 -58 48 q-54 -2 -58 -48z"/><path d="M-50 -30 l-6 -46 l36 22"/><path d="M-56 30 q-22 8 -28 -8 M56 30 q14 10 22 0 M-26 94 v10 M26 94 v10"/><path d="M-40 18 h-28 M-40 28 l-26 8 M40 18 h28 M40 28 l26 8" stroke-width="2.2"/>`,3.2)}
    <g transform="translate(0 2) scale(1 ${Math.max(0.1,1-kedip)}) translate(0 -2)">${face}</g>
    <path d="M-5 24 l5 5 l5 -5z" fill="#E77F6E"/><path d="M0 29 q-8 8 -14 2 M0 29 q8 8 14 2" stroke="${P.ink}" stroke-width="2.8" fill="none" stroke-linecap="round"/>
    <ellipse cx="-40" cy="22" rx="9" ry="5" fill="${P.blush}" opacity=".55"/><ellipse cx="40" cy="22" rx="9" ry="5" fill="${P.blush}" opacity=".55"/>
  </g>`;
}

// ---------- BU RATNA (bust, with phone) ----------
function ratnaBust(expr='lirik', o={}){
  const {kedip=0, buka=0} = o;
  return `
  ${wc(`<path d="M-92 116 q92 -38 184 0 l12 160 h-208z" fill="${P.batik}"/>`)}
  <path d="M-92 116 q92 -38 184 0 l12 160 h-208z" fill="url(#batik)" opacity=".85"/>
  ${ink(`<path d="M-92 116 q92 -38 184 0 l12 160 h-208z"/>`)}
  <!-- tangan pegang HP -->
  <path d="M84 150 q40 20 30 80" stroke="${P.batik}" stroke-width="34" fill="none" stroke-linecap="round"/>
  ${ink(`<path d="M70 140 q60 20 50 92" />`,3)}
  <rect x="96" y="168" width="40" height="70" rx="7" fill="#20232B" stroke="${P.ink}" stroke-width="3"/><rect x="101" y="176" width="30" height="50" rx="3" fill="#7FB0E8"/>
  <path d="M104 186 h22 M104 196 h16 M104 206 h20" stroke="#fff" stroke-width="3"/>
  <circle cx="114" cy="230" r="16" fill="${P.skin}" stroke="${P.ink}" stroke-width="2.6"/>
  <!-- hijab -->
  ${wc(`<path d="M-110 24 q0 -124 110 -124 q110 0 110 124 q0 74 -40 112 q-70 26 -140 0 q-40 -38 -40 -112z" fill="${P.hijab}"/>`)}
  <path d="M-70 120 q70 40 140 0 l20 30 q-90 40 -180 0z" fill="${P.hijabSh}"/>
  ${wc(`<ellipse cx="0" cy="14" rx="78" ry="80" fill="${P.skin}"/>`)}
  ${wc(`<path d="M-84 -6 q0 -86 84 -86 q84 0 84 86 q-22 -52 -84 -56 q-62 4 -84 56z" fill="${P.hijab}"/>`)}
  ${ink(`<path d="M-110 24 q0 -124 110 -124 q110 0 110 124 q0 74 -40 112 q-70 26 -140 0 q-40 -38 -40 -112z"/><ellipse cx="0" cy="14" rx="78" ry="80"/>`)}
  <ellipse cx="-48" cy="52" rx="13" ry="8" fill="${P.blush}" opacity=".45"/><ellipse cx="48" cy="52" rx="13" ry="8" fill="${P.blush}" opacity=".45"/>
  <g transform="translate(0 6) scale(.84)">${eyes(expr,1,kedip)}${mouth(expr,1,buka)}</g>`;
}

// ---------- caption & UI ----------
const caption = (words, hiIdx=[], y=1090) => {
  // words: array; hiIdx: indexes highlighted in stabilo
  const txt = words.map((w,i)=> hiIdx.includes(i)?`<tspan fill="${P.ink}">${w}</tspan>`:w).join(' ');
  return `<g filter="url(#soft)"><rect x="70" y="${y-56}" width="580" height="${words.length>4?150:86}" rx="18" fill="#FFFCF5" opacity=".96"/></g>
  <text x="360" y="${y}" text-anchor="middle" font-family="Bricolage Grotesque" font-weight="800" font-size="44" fill="${P.ink}">${txt}</text>`;
};
const capLines = (lines, y=1080, hi=null) => {
  const h = 26 + lines.length*56;
  let s = `<g filter="url(#soft)"><rect x="64" y="${y-50}" width="592" height="${h}" rx="18" fill="#FFFCF5" opacity=".96"/></g>`;
  lines.forEach((l,i)=>{ s += `<text x="360" y="${y+i*56}" text-anchor="middle" font-family="Bricolage Grotesque" font-weight="800" font-size="38" fill="${P.ink}">${l}</text>`; });
  if(hi) s += highlight(hi[0], hi[1], hi[2], 18, .7);
  return s;
};
const epBadge = (ep, title) => `
<g filter="url(#soft)"><rect x="110" y="70" width="${200+title.length*13}" height="54" rx="27" fill="${P.ink}"/></g>
<text x="138" y="106" font-family="Plus Jakarta Sans" font-weight="800" font-size="22" fill="${P.yel}" letter-spacing="1">EP.${ep}</text>
<text x="202" y="106" font-family="Plus Jakarta Sans" font-weight="700" font-size="22" fill="#FFFCF5">${title}</text>`;
const handle = () => `<text x="610" y="1236" text-anchor="end" font-family="Plus Jakarta Sans" font-weight="700" font-size="18" fill="${P.ink}" opacity=".55">@mentoringsobatambis</text>`;
const bubble = (x,y,w,h,lines,{tail='bl',size=32}={}) => {
  const t = tail==='bl'?`l-26 34 l8 -40`:tail==='br'?`l26 34 l-8 -40`:'';
  const tx = tail==='bl'?x+w*0.22:x+w*0.78;
  let s = `<g filter="url(#soft)"><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${h/2.2}" fill="#FFFCF5"/><path d="M${tx} ${y+h-4} ${t}z" fill="#FFFCF5"/></g>`;
  s += ink(`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${h/2.2}"/><path d="M${tx-10} ${y+h-2} ${t}"/>`,2.8);
  lines.forEach((l,i)=>{ s += hand(x+w/2, y+h/2+10+(i-(lines.length-1)/2)*36, l, {size, anchor:'middle'}); });
  return s;
};

export {P, defs, paper, vignette, ink, wc, hand, highlight, artaFull, artaBust, artaHead, mbis, ratnaBust, capLines, epBadge, handle, bubble};
