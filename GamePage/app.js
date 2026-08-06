/* =====================================================
   SHARED APP.JS
   Loaded by every page: index.html + all game/learn pages.
   Contains: audio engine, speech synthesis, shared datasets,
   utility functions, and common topbar wiring (home/replay).
===================================================== */

/* ================= AUDIO ================= */
var audioCtx = null;
function ctx(){ if(!audioCtx){ audioCtx = new (window.AudioContext||window.webkitAudioContext)(); } return audioCtx; }

function tone(freq,duration,type,when){
  type = type || 'sine'; when = when || 0;
  var c = ctx();
  var o = c.createOscillator();
  var g = c.createGain();
  o.type = type; o.frequency.value = freq;
  o.connect(g); g.connect(c.destination);
  var t0 = c.currentTime + when;
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(0.35, t0+0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, t0+duration);
  o.start(t0); o.stop(t0+duration+0.05);
}
function playPop(){ tone(650,0.10,'sine',0); tone(920,0.09,'sine',0.06); }
function playCheer(){ [523,659,784,1047].forEach(function(f,i){ tone(f,0.22,'triangle',i*0.13); }); }
function playBuzz(){ tone(220,0.18,'sawtooth',0); tone(180,0.16,'sawtooth',0.08); }

function unlockAudio(){
  ctx();
  if(audioCtx.state === 'suspended'){ audioCtx.resume(); }
}

/* ================= SPEECH ================= */
var thaiVoice = null;
function pickVoice(){
  if(!('speechSynthesis' in window)) return;
  var voices = speechSynthesis.getVoices();
  thaiVoice = voices.find(function(v){ return v.lang && v.lang.toLowerCase().indexOf('th') === 0; }) || null;
}
if('speechSynthesis' in window){
  pickVoice();
  speechSynthesis.onvoiceschanged = pickVoice;
}
var lastSentence = '';
function speak(text){
  lastSentence = text;
  if(!('speechSynthesis' in window)) return;
  speechSynthesis.cancel();
  var u = new SpeechSynthesisUtterance(text);
  u.lang = 'th-TH';
  if(thaiVoice) u.voice = thaiVoice;
  u.rate = 0.85; u.pitch = 1.25;
  speechSynthesis.speak(u);
}

/* Sets the speech-bubble text and speaks it a beat later */
function say(text){
  var el = document.getElementById('instructionText');
  if(el) el.textContent = text;
  setTimeout(function(){ speak(text); }, 200);
}

/* ================= SHARED DATASETS ================= */
var THAI_WORDS = ['','หนึ่ง','สอง','สาม','สี่','ห้า','หก','เจ็ด','แปด','เก้า','สิบ'];

var THAI_LETTERS = [
  {ch:'ก',read:'กอ ไก่'}, {ch:'ข',read:'ขอ ไข่'}, {ch:'ค',read:'คอ ควาย'}, {ch:'ฆ',read:'คอ ระฆัง'},
  {ch:'ง',read:'งอ งู'}, {ch:'จ',read:'จอ จาน'}, {ch:'ฉ',read:'ฉอ ฉิ่ง'}, {ch:'ช',read:'ชอ ช้าง'},
  {ch:'ซ',read:'ซอ โซ่'}, {ch:'ฌ',read:'ชอ เฌอ'}, {ch:'ญ',read:'ยอ หญิง'}, {ch:'ฎ',read:'ดอ ชฎา'},
  {ch:'ฏ',read:'ตอ ปฏัก'}, {ch:'ฐ',read:'ถอ ฐาน'}, {ch:'ฑ',read:'ทอ มณโฑ'}, {ch:'ฒ',read:'ทอ ผู้เฒ่า'},
  {ch:'ณ',read:'นอ เณร'}, {ch:'ด',read:'ดอ เด็ก'}, {ch:'ต',read:'ตอ เต่า'}, {ch:'ถ',read:'ถอ ถุง'},
  {ch:'ท',read:'ทอ ทหาร'}, {ch:'ธ',read:'ทอ ธง'}, {ch:'น',read:'นอ หนู'}, {ch:'บ',read:'บอ ใบไม้'},
  {ch:'ป',read:'ปอ ปลา'}, {ch:'ผ',read:'ผอ ผึ้ง'}, {ch:'ฝ',read:'ฝอ ฝา'}, {ch:'พ',read:'พอ พาน'},
  {ch:'ฟ',read:'ฟอ ฟัน'}, {ch:'ภ',read:'พอ สำเภา'}, {ch:'ม',read:'มอ ม้า'}, {ch:'ย',read:'ยอ ยักษ์'},
  {ch:'ร',read:'รอ เรือ'}, {ch:'ล',read:'ลอ ลิง'}, {ch:'ว',read:'วอ แหวน'}, {ch:'ศ',read:'สอ ศาลา'},
  {ch:'ษ',read:'สอ ฤๅษี'}, {ch:'ส',read:'สอ เสือ'}, {ch:'ห',read:'หอ หีบ'}, {ch:'ฬ',read:'ลอ จุฬา'},
  {ch:'อ',read:'ออ อ่าง'}, {ch:'ฮ',read:'ฮอ นกฮูก'}
];
var ENGLISH_LETTERS = [
  {ch:'A',read:'เอ'},{ch:'B',read:'บี'},{ch:'C',read:'ซี'},{ch:'D',read:'ดี'},{ch:'E',read:'อี'},
  {ch:'F',read:'เอฟ'},{ch:'G',read:'จี'},{ch:'H',read:'เอช'},{ch:'I',read:'ไอ'},{ch:'J',read:'เจ'},
  {ch:'K',read:'เค'},{ch:'L',read:'แอล'},{ch:'M',read:'เอ็ม'},{ch:'N',read:'เอ็น'},{ch:'O',read:'โอ'},
  {ch:'P',read:'พี'},{ch:'Q',read:'คิว'},{ch:'R',read:'อาร์'},{ch:'S',read:'เอส'},{ch:'T',read:'ที'},
  {ch:'U',read:'ยู'},{ch:'V',read:'วี'},{ch:'W',read:'ดับเบิลยู'},{ch:'X',read:'เอ็กซ์'},{ch:'Y',read:'วาย'},
  {ch:'Z',read:'แซด'}
];

var FOOD_SVG = {
  bone: '<svg viewBox="0 0 100 100"><path d="M24 40c-8 0-14 6-14 13 0 6 4 11 10 12-1 2-2 4-2 7 0 8 6 13 13 13 6 0 11-4 12-9h14c1 5 6 9 12 9 7 0 13-5 13-13 0-3-1-5-2-7 6-1 10-6 10-12 0-7-6-13-14-13-5 0-9 2-11 6H35c-2-4-6-6-11-6z" fill="#F7F6F2" stroke="#D9D5C9" stroke-width="3"/></svg>',
  apple: '<svg viewBox="0 0 100 100"><path d="M50 34c14-14 34-8 34 10 0 20-18 40-34 46-16-6-34-26-34-46 0-18 20-24 34-10z" fill="#FF6B6B" stroke="#E25353" stroke-width="3"/><path d="M48 34c0-8 3-14 10-18" fill="none" stroke="#7BAE4F" stroke-width="5" stroke-linecap="round"/><ellipse cx="60" cy="16" rx="10" ry="6" fill="#8FCB5A" transform="rotate(-25 60 16)"/></svg>'
};
var FOOD_LABEL = { bone:'กระดูก', apple:'แอปเปิ้ล' };

var ICONS = [
  { emoji:'⭐', label:'ดวง', name:'ดาว' },
  { emoji:'🐟', label:'ตัว', name:'ปลา' },
  { emoji:'🎈', label:'ลูก', name:'ลูกโป่ง' },
  { emoji:'🍎', label:'ผล', name:'แอปเปิ้ล' },
  { emoji:'🦋', label:'ตัว', name:'ผีเสื้อ' }
];

var COLORS = [
  {name:'แดง', hex:'#FF5A5A'}, {name:'เหลือง', hex:'#FFD93D'}, {name:'เขียว', hex:'#6BCB77'},
  {name:'น้ำเงิน', hex:'#4D96FF'}, {name:'ส้ม', hex:'#FF9F45'}, {name:'ม่วง', hex:'#B98CE0'},
  {name:'ชมพู', hex:'#FF8FB1'}, {name:'ฟ้า', hex:'#63D2FF'}, {name:'น้ำตาล', hex:'#B08463'}, {name:'ดำ', hex:'#4A4A4A'}
];

var WORDS = [
  { word:'ปลา', parts:['ปล','า'], emoji:'🐟' },
  { word:'หมา', parts:['หม','า'], emoji:'🐶' },
  { word:'หมู', parts:['หม','ู'], emoji:'🐷' },
  { word:'นก',  parts:['น','ก'],  emoji:'🐦' },
  { word:'มด',  parts:['ม','ด'],  emoji:'🐜' },
  { word:'ปู',  parts:['ป','ู'],  emoji:'🦀' },
  { word:'งู',  parts:['ง','ู'],  emoji:'🐍' },
  { word:'ตา',  parts:['ต','า'],  emoji:'👁️' },
  { word:'วัว', parts:['วั','ว'], emoji:'🐮' },
  { word:'ยุง', parts:['ยุ','ง'], emoji:'🦟' }
];

var SIMON_NOTES = [523.25, 659.25, 783.99, 987.77]; // C5 E5 G5 B5
var DRAW_COLORS = ['#3A3A3A','#FF5A5A','#FF9F45','#FFD93D','#6BCB77','#4D96FF','#B98CE0','#FF8FB1','#8B5E3C'];

/* Slot positions (percent left/top) for scattering up to 10 items without heavy overlap */
var SLOTS = [
  [10,18],[28,14],[46,22],[64,15],[82,20],
  [16,52],[34,58],[52,48],[70,60],[88,50]
];

/* ================= UTILITIES ================= */
function shuffle(arr){
  var a = arr.slice();
  for(var i=a.length-1;i>0;i--){
    var j = Math.floor(Math.random()*(i+1));
    var t = a[i]; a[i]=a[j]; a[j]=t;
  }
  return a;
}
function randInt(min,max){ return Math.floor(Math.random()*(max-min+1))+min; }
function dist(x1,y1,x2,y2){ return Math.hypot(x1-x2, y1-y2); }

/* ================= VISUAL FX ================= */
function starBurst(x,y){
  var symbols = ['⭐','✨','🌟'];
  for(var i=0;i<6;i++){
    var s = document.createElement('div');
    s.className = 'star-burst';
    s.textContent = symbols[Math.floor(Math.random()*symbols.length)];
    var angle = (Math.PI*2/6)*i + Math.random()*0.4;
    var d = 60 + Math.random()*40;
    s.style.setProperty('--tx', Math.cos(angle)*d + 'px');
    s.style.setProperty('--ty', Math.sin(angle)*d + 'px');
    s.style.left = x+'px'; s.style.top = y+'px';
    document.body.appendChild(s);
    (function(node){ setTimeout(function(){ if(node.parentNode) node.parentNode.removeChild(node); }, 650); })(s);
  }
}

var confettiColors = ['#FF9EBB','#8C7CF0','#FFC65C','#7BD389','#7FD6E8'];
function confettiBurst(){
  for(var i=0;i<40;i++){
    var c = document.createElement('div');
    c.className = 'confetti';
    var size = 8 + Math.random()*8;
    c.style.width = size+'px'; c.style.height = (size*0.6)+'px';
    c.style.left = (Math.random()*100)+'vw';
    c.style.background = confettiColors[Math.floor(Math.random()*confettiColors.length)];
    c.style.animationDuration = (2.2 + Math.random()*1.6)+'s';
    c.style.animationDelay = (Math.random()*0.4)+'s';
    document.body.appendChild(c);
    (function(node){ setTimeout(function(){ if(node.parentNode) node.parentNode.removeChild(node); }, 4200); })(c);
  }
}

/* Generic win celebration: shows #celebrate overlay if present on the page */
function winLevel(){
  playCheer();
  confettiBurst();
  speak('เก่งมาก! เก่งจังเลย');
  var el = document.getElementById('celebrate');
  if(el) el.classList.add('show');
}

/* Generic fail overlay: shows #failOverlay if present on the page */
function showFailOverlay(msg){
  var t = document.getElementById('failText');
  if(t) t.textContent = msg;
  speak(msg);
  playBuzz();
  var el = document.getElementById('failOverlay');
  if(el) el.classList.add('show');
}

/* ================= NAVIGATION ================= */
function goHome(){
  window.location.href = 'index.html';
}

/* ================= COMMON TOPBAR WIRING ================= */
document.addEventListener('DOMContentLoaded', function(){
  var homeBtn = document.getElementById('homeBtn');
  if(homeBtn) homeBtn.addEventListener('click', goHome);

  var replayBtn = document.getElementById('replayBtn');
  if(replayBtn) replayBtn.addEventListener('click', function(){
    if(lastSentence) speak(lastSentence);
  });
});

/* ================= PREVENT ZOOM / SCROLL GESTURES ================= */
document.addEventListener('touchmove', function(e){
  if(e.target.closest && e.target.closest('.overlay, .learn-grid')) return;
  e.preventDefault();
}, { passive:false });
document.addEventListener('gesturestart', function(e){ e.preventDefault(); });
document.addEventListener('dblclick', function(e){ e.preventDefault(); });
