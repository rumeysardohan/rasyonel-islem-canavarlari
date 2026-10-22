const $=id=>document.getElementById(id);
const assets='assets/';
const monsters=['monster-blue.webp','monster-red.webp','monster-green.webp','monster-purple.webp'];
const playerColors=['#2588ff','#f44f69','#25b975','#8961ef'];
const ops=[{key:'+',label:'Toplama',symbol:'+',cls:'op-add',color:'#2588ff',tint:'#e9f5ff'},{key:'−',label:'Çıkarma',symbol:'−',cls:'op-sub',color:'#f44f69',tint:'#fff0f1'},{key:'×',label:'Çarpma',symbol:'×',cls:'op-mul',color:'#25b975',tint:'#e9fff3'},{key:'÷',label:'Bölme',symbol:'÷',cls:'op-div',color:'#8961ef',tint:'#f4efff'}];
const specials={6:'bonus',13:'trap',20:'challenge',27:'karma',34:'bonus',41:'trap'};
const galleryItems=[
  ['Oyun parkuru','board-poster.webp'],['Kullanım kılavuzu','guide.webp'],['Kes-yapıştır piyonlar ve zar','pawns-die.webp'],
  ['Dört işlem kartlarının arka yüzleri','operation-backs.webp'],['Karma, bonus ve tuzak kartı arkaları','special-backs.webp'],['Meydan okuma kartı arkası','challenge-back.webp'],
  ['İşlem kartları · 1','operation-cards-1.webp'],['İşlem kartları · 2','operation-cards-2.webp'],['İşlem kartları · 3','operation-cards-3.webp'],['İşlem kartları · 4','operation-cards-4.webp'],['İşlem kartları · 5','operation-cards-5.webp'],
  ['Bonus kartları','bonus-cards.webp'],['Bonus kartları · alternatif','bonus-cards-alt.webp'],['Tuzak kartları','trap-cards.webp'],['Meydan okuma kartları','challenge-cards.webp']
];
let config={count:2,names:['Mavi Canavar','Kırmızı Canavar','Yeşil Canavar','Mor Canavar'],level:'medium',mode:'all'};
let game=null, busy=false, toastTimer=null;
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const gcd=(a,b)=>b?gcd(b,a%b):Math.abs(a);
function rat(n,d){if(!Number.isSafeInteger(n)||!Number.isSafeInteger(d)||d===0)throw Error('Pay ve payda tam sayı olmalı; payda sıfır olamaz.');let g=gcd(n,d)||1;if(d<0)g=-g;return {n:n/g,d:d/g};}
function calc(a,b,op){if(op==='+')return rat(a.n*b.d+b.n*a.d,a.d*b.d);if(op==='−')return rat(a.n*b.d-b.n*a.d,a.d*b.d);if(op==='×')return rat(a.n*b.n,a.d*b.d);if(op==='÷'){if(b.n===0)throw Error('Sıfıra bölme yapılamaz.');return rat(a.n*b.d,a.d*b.n);}throw Error('İşlem tanınmadı.');}
function equal(a,b){return a.n===b.n&&a.d===b.d;}
function fracHtml(a){a=rat(a.n,a.d);if(a.d===1)return '<span class="whole">'+a.n+'</span>';return '<span class="frac"><span class="num">'+a.n+'</span><span class="den">'+a.d+'</span></span>';}
function signedHtml(a){return a.n<0?'<span class="parens">(</span>'+fracHtml(a)+'<span class="parens">)</span>':fracHtml(a);}
function gcd2(a,b){return b?gcd2(b,a%b):Math.abs(a);}
function lcm(a,b){return Math.abs(a*b)/gcd2(a,b);}
function randomInt(min,max){return Math.floor(Math.random()*(max-min+1))+min;}
function randomOp(){return ops[randomInt(0,3)].key;}
function makeQ(tileOp,kind){
  const level=config.level, count=level==='hard'?3:2, terms=[], operations=[];
  const ds=level==='easy'?[2,3,4]:level==='medium'?[2,3,4,5,6,8]:[3,4,5,6,7,8,9,10,12];
  for(let i=0;i<count;i++){
    const d=ds[randomInt(0,ds.length-1)], min=level==='easy'?1:level==='medium'?-8:-12, max=level==='easy'?8:level==='medium'?9:12;
    terms.push(rat(randomInt(min,max),d));
  }
  for(let i=0;i<count-1;i++){
    let op=kind==='challenge'||kind==='karma'?randomOp():(config.mode==='all'?tileOp:config.mode);
    operations.push(op);
    if(op==='÷'&&terms[i+1].n===0)terms[i+1]=rat(randomInt(1,8),terms[i+1].d);
  }
  let answer=terms[0];for(let i=0;i<operations.length;i++)answer=calc(answer,terms[i+1],operations[i]);
  return {terms,ops:operations,answer};
}
function questionHtml(q){if(q.terms.length===3)return '<span class="parens">(</span>'+signedHtml(q.terms[0])+'<span class="q-op">'+q.ops[0]+'</span>'+signedHtml(q.terms[1])+'<span class="parens">)</span><span class="q-op">'+q.ops[1]+'</span>'+signedHtml(q.terms[2]);let h='';for(let i=0;i<q.terms.length;i++){if(i)h+='<span class="q-op">'+q.ops[i-1]+'</span>';h+=signedHtml(q.terms[i]);}return h;}
function explain(q){
  let acc=q.terms[0], out='';
  for(let i=0;i<q.ops.length;i++){
    const b=q.terms[i+1], op=q.ops[i], ans=calc(acc,b,op);
    let detail='';
    if(op==='+'||op==='−'){const d=lcm(acc.d,b.d),aN=acc.n*(d/acc.d),bN=b.n*(d/b.d);detail='Paydaları ortak paydada eşitle ('+d+'): ('+aN+') '+op+' ('+bN+') = '+(op==='+'?aN+bN:aN-bN)+'/'+d+'.';}
    else if(op==='×')detail='Payları ve paydaları çarp: ('+acc.n+'·'+b.n+') / ('+acc.d+'·'+b.d+').';
    else detail='İkinci kesrin çarpmaya göre tersini al: ('+acc.n+'/'+acc.d+') · ('+b.d+'/'+b.n+').';
    out+='<div><b>Adım '+(i+1)+':</b> '+detail+' Sonuç: <b>'+ans.n+'/'+ans.d+'</b>.</div>';
    acc=ans;
  }
  return out;
}
function tileAt(index){
  if(index===0)return {kind:'start',label:'BAŞLA',symbol:'🚩',cls:'start'};
  if(index===48)return {kind:'finish',label:'BİTİŞ',symbol:'🏁',cls:'finish'};
  if(specials[index]==='bonus')return {kind:'bonus',label:'BONUS',symbol:'★',cls:'special'};
  if(specials[index]==='trap')return {kind:'trap',label:'TUZAK',symbol:'!',cls:'special'};
  if(specials[index]==='challenge')return {kind:'challenge',label:'MEYDAN',symbol:'⚔',cls:'special'};
  if(specials[index]==='karma')return {kind:'karma',label:'KARMA',symbol:'?',cls:'special'};
  const op=ops[(index-1)%4];return {kind:'operation',label:op.label,symbol:op.symbol,cls:op.cls,op:op.key,color:op.color,tint:op.tint};
}
function gridPos(index){const row=Math.floor(index/7),offset=index%7;return {row:row+1,col:(row%2===0?offset:6-offset)+1};}
function buildBoard(){
  const board=$('board');board.innerHTML='';
  for(let i=0;i<49;i++){
    const t=tileAt(i),p=gridPos(i),cell=document.createElement('div');
    cell.className='cell '+t.cls+(i===0?' start':'')+(i===48?' finish':'');
    cell.style.gridRow=String(p.row);cell.style.gridColumn=String(p.col);cell.id='cell'+i;
    cell.innerHTML='<span class="cell-num">'+(i+1)+'</span><span class="cell-icon">'+t.symbol+'</span><span class="cell-name">'+t.label+'</span><span class="cell-type">'+(i<48?'KARE':'HEDEF')+'</span><div class="cell-tokens"></div>';
    board.append(cell);
  }
}
function avatar(i,large){return '<span class="avatar"><img src="'+assets+monsters[i]+'" alt=""></span>';}
function renderPlayers(){
  const n=game?game.players.length:config.count;
  const ps=game?game.players:Array.from({length:n},(_,i)=>({name:config.names[i],pos:0,points:0,correct:0}));
  $('playerBar').innerHTML=ps.map((p,i)=>'<div class="player-card '+(game&&game.current===i&&game.phase!=='finished'?'active':'')+'" style="--p:'+playerColors[i]+'">'+avatar(i)+'<div style="min-width:0"><div class="pname">'+esc(p.name)+'</div><div class="pstats">'+(game?(p.correct+' doğru · '+p.points+' puan'):'Canavarın hazır')+'</div></div><div class="pbadge">'+(game?('Kare '+(p.pos+1)):'OYUNCU '+(i+1))+'</div></div>').join('');
}
function renderBoard(){
  for(let i=0;i<49;i++){
    const el=$('cell'+i);if(!el)continue;
    el.classList.toggle('current-cell',!!game&&game.phase!=='finished'&&game.players[game.current].pos===i);
    const ps=game?game.players.filter(p=>p.pos===i):[];
    el.querySelector('.cell-tokens').innerHTML=ps.map(p=>'<span class="mini-token" style="--pc:'+playerColors[p.id]+'"><img src="'+assets+monsters[p.id]+'" alt="'+esc(p.name)+'"></span>').join('');
  }
}
function setTurnLabel(){
  if(!game){$('turnLabel').textContent='Oyuncuları ayarla';return;}
  if(game.phase==='finished'){$('turnLabel').textContent='Oyun tamamlandı';return;}
  const p=game.players[game.current];$('turnLabel').textContent='Sıra: '+p.name+' · '+(p.pos+1)+'/49';
}
function setupPanel(){
  const names=Array.from({length:config.count},(_,i)=>'<label class="name-field"><img src="'+assets+monsters[i]+'" alt=""><input id="playerName'+i+'" maxlength="20" value="'+esc(config.names[i])+'" aria-label="'+(i+1)+'. oyuncu adı"></label>').join('');
  return '<div class="panel-card"><span class="eyebrow">OYUN MASASI</span><h2>Canavarları seç!</h2><label class="field-label">Oyuncu sayısı</label><div class="segmented">'+[2,3,4].map(n=>'<button data-count="'+n+'" class="'+(config.count===n?'selected':'')+'">'+n+' oyuncu</button>').join('')+'</div><div class="name-grid">'+names+'</div><label class="field-label" for="difficulty">Zorluk</label><select id="difficulty" class="select"><option value="easy" '+(config.level==='easy'?'selected':'')+'>Kolay · küçük sayılar</option><option value="medium" '+(config.level==='medium'?'selected':'')+'>Orta · negatif sayılar</option><option value="hard" '+(config.level==='hard'?'selected':'')+'>Zor · ardışık işlemler</option></select><label class="field-label" for="opMode">İşlem destesi</label><select id="opMode" class="select"><option value="all">Dört işlem karışık</option><option value="+">Yalnızca toplama</option><option value="−">Yalnızca çıkarma</option><option value="×">Yalnızca çarpma</option><option value="÷">Yalnızca bölme</option></select><button id="startGame" class="primary full">Oyunu başlat <span>→</span></button><div class="setup-note"><span>🎲</span><span>Zar atışında gelen sayıya göre parkurda ilerle. İlk 49. kareye ulaşan oyunu kazanır.</span></div></div><div class="panel-card log-card"><h3>Oyuna hazır mısın?</h3><p style="margin:0">Kesir cevabını pay ve payda olarak gir. Eş değer kesirler kabul edilir.</p></div>';
}
function turnPanel(){
  const p=game.players[game.current];
  const head='<div class="panel-card dark"><span class="eyebrow">CANAVARIN SIRASI</span><div class="turn-head">'+avatar(game.current)+'<div><div class="turn-player">'+esc(p.name)+'</div><div class="turn-sub">Parkur karesi '+(p.pos+1)+' / 49</div></div></div><button id="rollBtn" class="die-button" '+(busy?'disabled':'')+'><span class="die-face" id="dieFace">⚄</span><span>'+(busy?'Zar dönüyor…':'Zar at ve ilerle')+'</span></button><p class="turn-hint">Geldiğin karedeki sembole göre desteden kart açılır.</p></div>';
  const logs='<div class="panel-card log-card"><h3>Son hamleler</h3>'+(game.log.length?game.log.slice(0,4).map(x=>'<div class="log-row">'+esc(x)+'</div>').join(''):'<div class="log-row">İlk hamleyi bekliyoruz.</div>')+'</div>';
  if(game.phase==='question'||game.phase==='feedback'){
    const isChallenge=game.cardKind==='challenge',isKarma=game.cardKind==='karma',t=tileAt(game.landing);
    const accent=isChallenge?'#ec4c9b':isKarma?'#edab22':(ops.find(o=>o.key===game.q.ops[0])||ops[0]).color;
    const tint=isChallenge?'#fff0f7':isKarma?'#fff8df':(ops.find(o=>o.key===game.q.ops[0])||ops[0]).tint;
    const label=isChallenge?'MEYDAN OKUMA':isKarma?'KARMA KARTI':(ops.find(o=>o.key===game.q.ops[0])||ops[0]).label.toLocaleUpperCase('tr-TR')+' KARTI';
    let card='<div class="question-card" style="--accent:'+accent+';--tint:'+tint+'"><div class="q-label"><span>'+t.symbol+'</span>'+label+'</div><div class="q-math">'+questionHtml(game.q)+' <span class="q-equals">= ?</span></div><div class="scoreline"><span>'+(isChallenge?'Doğru cevap: 2 kare ilerle':'Doğru cevap: +1 puan')+'</span><span>'+(config.level==='hard'?'ZOR':config.level==='easy'?'KOLAY':'ORTA')+'</span></div></div>';
    if(game.phase==='question')card+='<form id="answerForm"><label class="field-label">Cevabını kesir olarak yaz</label><div class="answer-row"><div class="frac-inputs"><input id="numInput" type="text" inputmode="numeric" placeholder="Pay" autocomplete="off" required><i class="frac-line"></i><input id="denInput" type="text" inputmode="numeric" placeholder="Payda" autocomplete="off" required></div><button class="primary" type="submit">Cevabı<br>kontrol et</button></div><p class="help-small">Tam sayının paydası 1’dir. Negatif cevap için paya eksi işareti ekle.</p><div id="answerError" class="error"></div></form>';
    else card+='<div class="feedback '+(game.feedback.correct?'':'wrong')+'"><b>'+(game.feedback.correct?'✦ Doğru cevap!':'Bir daha deneyince olacak!')+'</b><div>'+esc(game.feedback.message)+'</div></div><div class="solution">'+explain(game.q)+'</div><div class="solution"><b>Sonuç:</b> '+game.q.answer.n+'/'+game.q.answer.d+'</div><button id="nextTurn" class="primary full">Sırayı devret →</button>';
    return head+'<div class="panel-card"><span class="eyebrow">KART AÇILDI · KARE '+(game.landing+1)+'</span>'+card+'</div>'+logs;
  }
  if(game.phase==='special'){
    const s=game.specialResult,meta=s.type==='bonus'?{icon:'★',name:'BONUS',color:'#c38a00',tint:'#fff5ce'}:{icon:'!',name:'TUZAK',color:'#15a4af',tint:'#e4fbfc'};
    return head+'<div class="panel-card"><span class="eyebrow">ÖZEL KART ÇEKİLDİ</span><div class="special-card" style="--accent:'+meta.color+';--tint:'+meta.tint+'"><div class="special-icon">'+meta.icon+'</div><h3>'+meta.name+'</h3><p>'+esc(s.message)+'</p><div class="scoreline"><span>Yeni konum: kare '+(p.pos+1)+'</span><span>'+p.points+' puan</span></div></div><button id="nextTurn" class="primary small-cta">Sırayı devret →</button></div>'+logs;
  }
  return head+logs;
}
function render(){
  renderPlayers();renderBoard();setTurnLabel();
  $('panel').innerHTML=!game?setupPanel():game.phase==='finished'?turnPanel():turnPanel();
  if(!game){$('opMode').value=config.mode;}
}
function readSetup(){
  for(let i=0;i<config.count;i++){const el=$('playerName'+i);if(el)config.names[i]=el.value.trim()||('Oyuncu '+(i+1));}
  if($('difficulty'))config.level=$('difficulty').value;
  if($('opMode'))config.mode=$('opMode').value;
}
function startGame(){
  readSetup();game={players:Array.from({length:config.count},(_,i)=>({id:i,name:config.names[i],pos:0,points:0,correct:0,wrong:0,skip:0})),current:0,phase:'roll',q:null,cardKind:null,landing:0,feedback:null,log:['Canavarlar başlangıç çizgisinde!'],extraTurn:false,specialResult:null};
  render();showToast('Yarış başladı! İlk canavar zar atıyor.');$('rollBtn').focus();
}
function nextActive(){
  if(game.extraTurn){game.extraTurn=false;game.phase='roll';game.q=null;game.feedback=null;game.log.unshift(game.players[game.current].name+' bonus turunu kullanıyor!');game.log=game.log.slice(0,8);render();return;}
  let tries=0;
  do{game.current=(game.current+1)%game.players.length;const p=game.players[game.current];if(p.skip>0){p.skip--;game.log.unshift(p.name+' tuzak nedeniyle bu turu bekliyor.');game.log=game.log.slice(0,8);}else break;tries++;}while(tries<=game.players.length);
  game.phase='roll';game.q=null;game.feedback=null;game.specialResult=null;render();
}
function endGame(winnerId){
  game.phase='finished';render();
  const rows=game.players.slice().sort((a,b)=>b.points-a.points||b.pos-a.pos||b.correct-a.correct);
  $('finishContent').innerHTML='<div class="eyebrow">PARKUR TAMAMLANDI</div><h2>🏆 '+esc(game.players[winnerId].name)+' kazandı!</h2><p class="muted">Bütün canavarlar matematik parkurunu tamamladı. Tebrikler!</p>'+rows.map((p,i)=>'<div class="rank-row"><div class="rank-num">'+(i+1)+'</div><img src="'+assets+monsters[p.id]+'" alt=""><div><div class="rank-name">'+esc(p.name)+'</div><div class="muted" style="font-size:10px">'+p.correct+' doğru · '+p.wrong+' yanlış</div></div><div class="rank-detail">'+p.points+' puan<br>Kare '+(p.pos+1)+'</div></div>').join('')+'<button id="again" class="primary full">Yeni oyun kur</button>';
  $('finishDialog').showModal();confetti();
}
function movePlayer(p,amount){
  p.pos=Math.max(0,Math.min(48,p.pos+amount));
  if(p.pos===48){endGame(p.id);return true;}
  return false;
}
function randomBonus(){
  const p=game.players[game.current],n=randomInt(0,2);let msg='';
  if(n===0){if(movePlayer(p,2))return;msg='Yıldız gücü! 2 kare ilerle.';}
  else if(n===1){p.points++;msg='Bonus yıldız kazandın! +1 puan.';}
  else{game.extraTurn=true;msg='Süper bonus! Bir tur daha oynayacaksın.';}
  game.specialResult={type:'bonus',message:msg};game.phase='special';game.log.unshift(p.name+': Bonus kartı · '+msg);game.log=game.log.slice(0,8);
  if(p.pos===48){endGame(p.id);return;}
}
function randomTrap(){
  const p=game.players[game.current],n=randomInt(0,2);let msg='';
  if(n===0){movePlayer(p,-2);msg='Tuzak! 2 kare geri git.';}
  else if(n===1){movePlayer(p,-1);msg='Kaygan yol! 1 kare geri git.';}
  else{p.skip++;msg='Bekleme tuzağı! Sıradaki turunu kaçır.';}
  game.specialResult={type:'trap',message:msg};game.phase='special';game.log.unshift(p.name+': Tuzak kartı · '+msg);game.log=game.log.slice(0,8);
}
async function roll(){
  if(!game||game.phase!=='roll'||busy)return;
  busy=true;render();
  const die=randomInt(1,6);
  if(!matchMedia('(prefers-reduced-motion: reduce)').matches){
    for(let i=0;i<7;i++){const d=$('dieFace');if(d)d.textContent=['⚀','⚁','⚂','⚃','⚄','⚅'][randomInt(0,5)];await new Promise(r=>setTimeout(r,75));}
  }
  const p=game.players[game.current];p.pos=Math.min(48,p.pos+die);game.landing=p.pos;game.log.unshift(p.name+' '+die+' attı ve '+(p.pos+1)+'. kareye geldi.');game.log=game.log.slice(0,8);busy=false;
  if(p.pos===48){endGame(p.id);return;}
  const tile=tileAt(p.pos);
  if(tile.kind==='bonus'){randomBonus();}
  else if(tile.kind==='trap'){randomTrap();}
  else if(tile.kind==='operation'||tile.kind==='karma'||tile.kind==='challenge'){
    game.cardKind=tile.kind;game.q=makeQ(tile.op||null,tile.kind);game.phase='question';game.feedback=null;
  }else{game.cardKind='karma';game.q=makeQ(null,'karma');game.phase='question';}
  render();
  $('numInput')?.focus({preventScroll:true});
}
function submitAnswer(form){
  const nText=$('numInput').value.trim().replace('−','-'),dText=$('denInput').value.trim().replace('−','-');
  if(!/^[+-]?\d+$/.test(nText)||!/^[+-]?\d+$/.test(dText)){ $('answerError').textContent='Pay ve paydaya tam sayı yaz.';return; }
  let answer;try{answer=rat(Number(nText),Number(dText));}catch(e){$('answerError').textContent=e.message;return;}
  const p=game.players[game.current],correct=equal(answer,game.q.answer);p.correct+=Number(correct);p.wrong+=Number(!correct);if(correct)p.points++;
  let message='';
  if(correct){message=game.cardKind==='challenge'?'Meydan okumayı kazandın! 2 kare ilerle.':'İşlem doğru! 1 puan kazandın.';if(game.cardKind==='challenge'&&movePlayer(p,2)){game.feedback={correct:true,message:message};render();return;}}
  else{message='Cevap doğru değil. 1 kare geri git.';movePlayer(p,-1);}
  game.feedback={correct:correct,message:message,answer:answer};game.phase='feedback';
  game.log.unshift(p.name+': '+(correct?'doğru cevap':'yanlış cevap')+' · '+game.q.answer.n+'/'+game.q.answer.d);game.log=game.log.slice(0,8);
  render();if(correct)confettiSmall();$('nextTurn')?.focus({preventScroll:true});
}
function showToast(message){const t=$('toast');t.textContent=message;t.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>t.classList.remove('show'),2300);}
function confettiSmall(){if(matchMedia('(prefers-reduced-motion: reduce)').matches)return;for(let i=0;i<26;i++){const e=document.createElement('i');e.className='confetti-dot';e.style.left=randomInt(0,100)+'vw';e.style.background=['#ffcc42','#f44f69','#2588ff','#25b975','#8961ef'][i%5];e.style.animationDelay=(Math.random()*.35)+'s';document.body.append(e);setTimeout(()=>e.remove(),2200);}}
function confetti(){for(let i=0;i<55;i++){const e=document.createElement('i');e.className='confetti-dot';e.style.left=randomInt(0,100)+'vw';e.style.background=['#ffcc42','#f44f69','#2588ff','#25b975','#8961ef'][i%5];e.style.animationDelay=(Math.random()*.45)+'s';document.body.append(e);setTimeout(()=>e.remove(),2200);}}
function buildGallery(){
  $('gallery').innerHTML=galleryItems.map(([label,file])=>'<button class="gallery-item" data-image="'+assets+file+'" data-label="'+esc(label)+'"><img src="'+assets+file+'" alt="'+esc(label)+'" loading="lazy"><span>'+esc(label)+'</span></button>').join('');
}
document.addEventListener('click',async e=>{
  const b=e.target.closest('button');if(!b)return;
  if(b.dataset.close){$(b.dataset.close).close();return;}
  if(b.id==='galleryBtn'||b.id==='viewArt'){$('galleryDialog').showModal();return;}
  if(b.id==='rulesBtn'){$('rulesDialog').showModal();return;}
  if(b.dataset.count){readSetup();config.count=Number(b.dataset.count);render();return;}
  if(b.id==='startGame'){startGame();return;}
  if(b.id==='rollBtn'){await roll();return;}
  if(b.id==='nextTurn'){nextActive();return;}
  if(b.id==='again'){$('finishDialog').close();game=null;render();return;}
  if(b.dataset.image){$('largeImage').src=b.dataset.image;$('largeImage').alt=b.dataset.label;$('imageDialog').showModal();return;}
});
document.addEventListener('change',e=>{if(e.target.id==='difficulty')config.level=e.target.value;if(e.target.id==='opMode')config.mode=e.target.value;});
document.addEventListener('input',e=>{if(e.target.id&&e.target.id.startsWith('playerName')){const i=Number(e.target.id.slice(10));if(Number.isInteger(i))config.names[i]=e.target.value;}});
document.addEventListener('submit',e=>{if(e.target.id==='answerForm'){e.preventDefault();submitAnswer(e.target);}});
document.addEventListener('click',e=>{if(e.target=== $('imageDialog'))$('imageDialog').close();});
buildBoard();buildGallery();render();
