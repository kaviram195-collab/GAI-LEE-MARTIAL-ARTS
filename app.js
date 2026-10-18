(() => {
'use strict';

// ========================================
// GAI LEE MARTIAL ARTS
// FIREBASE LOGIN + LIVE DATA SYNC
// ========================================

const CLASSES = [
 {id:'association',name:'FIRST BATCH',logo:'FIRST.jpg'},
 {id:'silambam',name:'SECOND BATCH',logo:'SECOND.jpg'},
 {id:'sports',name:'MORNING BATCH',logo:'MORNING.jpg'},
 {id:'boxing',name:'SAT & SUN BATCH',logo:'SAT%26SUN.jpg'},
 {id:'archery',name:'PARANIPUTHUR CLASS',logo:'PARANIPUTHUR.jpg'}
];

const $ = id => document.getElementById(id);

const today = new Date();

const dateString = d =>
 `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;

const monthString = d => dateString(d).slice(0,7);

const load = (key,fallback) => {
 try {
  const v = localStorage.getItem(key);
  return v ? JSON.parse(v) : fallback;
 } catch {
  return fallback;
 }
};

let students = load('gaiLeeStudents',[]);
let attendance = load('gaiLeeAttendance',{});
let fees = load('gaiLeeFees',{});

let activeClass = null;
let isAdmin = false;

let firebaseApp = null;
let firebaseAuth = null;
let firebaseDB = null;
let firebaseUser = null;
let databaseReady = false;
let stopListening = null;

// ========================================
// FIREBASE CONFIGURATION
// ========================================

const firebaseConfig = {
 apiKey: "AIzaSyD93NOni3Xt-1NC8ZtNZKCDhk3utmb_Vug",
 authDomain: "gai-lee-martial-arts.firebaseapp.com",
 databaseURL: "https://gai-lee-martial-arts-default-rtdb.firebaseio.com",
 projectId: "gai-lee-martial-arts",
 storageBucket: "gai-lee-martial-arts.firebasestorage.app",
 messagingSenderId: "330382905848",
 appId: "1:330382905848:web:847781d9c75a436517060d",
 measurementId: "G-V37J2X2QND"
};

// ========================================
// INITIALIZE FIREBASE
// ========================================

async function connectFirebase() {
 if (firebaseApp) return;

 const [
  appModule,
  authModule,
  databaseModule
 ] = await Promise.all([
  import('https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js'),
  import('https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js'),
  import('https://www.gstatic.com/firebasejs/11.10.0/firebase-database.js')
 ]);

 firebaseApp = appModule.initializeApp(firebaseConfig);

 firebaseAuth = authModule.getAuth(firebaseApp);

 firebaseDB = databaseModule.getDatabase(firebaseApp);
}

// ========================================
// LOCAL STORAGE + FIREBASE SYNC
// ========================================

function saveLocalData() {
 localStorage.setItem('gaiLeeStudents',JSON.stringify(students));
 localStorage.setItem('gaiLeeAttendance',JSON.stringify(attendance));
 localStorage.setItem('gaiLeeFees',JSON.stringify(fees));
}

function saveAll() {
 saveLocalData();

 if (!firebaseUser || !databaseReady || !firebaseDB) return;

 import('https://www.gstatic.com/firebasejs/11.10.0/firebase-database.js')
 .then(({ref,set}) => {
  return set(ref(firebaseDB,'/'),{
   students: students,
   attendance: attendance,
   fees: fees
  });
 })
 .catch(error => {
  console.error('Firebase save error:',error);
  toast('Sync failed. Check your internet connection.');
 });
}

// ========================================
// LISTEN FOR CHANGES FROM OTHER DEVICES
// ========================================

async function startDataSync() {
 const {ref,onValue} =
  await import('https://www.gstatic.com/firebasejs/11.10.0/firebase-database.js');

 if (stopListening) stopListening();

 databaseReady = false;

 stopListening = onValue(
  ref(firebaseDB,'/'),
  snapshot => {
   const data = snapshot.val() || {};

   students = Array.isArray(data.students)
    ? data.students
    : [];

   attendance =
    data.attendance &&
    typeof data.attendance === 'object'
     ? data.attendance
     : {};

   fees =
    data.fees &&
    typeof data.fees === 'object'
     ? data.fees
     : {};

   saveLocalData();

   databaseReady = true;

   renderAll();

   if (isAdmin) {
    renderManage();
    renderFeesAdmin();
   }
  },
  error => {
   console.error('Firebase read error:',error);
   toast('Unable to load Firebase data.');
  }
 );
}

// ========================================
// HELPERS
// ========================================

const esc = s =>
 String(s).replace(/[&<>"']/g,c=>({
  '&':'&amp;',
  '<':'&lt;',
  '>':'&gt;',
  '"':'&quot;',
  "'":'&#39;'
 }[c]));

function toast(msg) {
 $('toast').textContent = msg;
 $('toast').hidden = false;

 setTimeout(()=>$('toast').hidden=true,2400);
}

function feeKey(studentId,month) {
 return `${month}:${studentId}`;
}

function feeStatus(studentId,month) {
 return fees[feeKey(studentId,month)] || 'unpaid';
}

function attendanceStatus(studentId,date) {
 return attendance[date]?.[studentId] || '';
}

function monthStringFromDate(date) {
 return (date || dateString(today)).slice(0,7);
}

// ========================================
// INITIALIZE WEBSITE
// ========================================

function init() {
 $('attendanceDate').value = dateString(today);
 $('reportMonth').value = monthString(today);
 $('feeMonth').value = monthString(today);

 renderClasses();
 renderStats();
 renderReports();
 populateBatchOptions();

 // Change existing PIN login to email/password.
 const pinInput = $('adminPin');

 if (pinInput) {
  const oldLabel = document.querySelector('label[for="adminPin"]');

  if (oldLabel) oldLabel.textContent = 'ADMIN EMAIL';

  pinInput.id = 'adminEmail';
  pinInput.type = 'email';
  pinInput.placeholder = 'Enter admin email';
  pinInput.autocomplete = 'username';
  pinInput.required = true;

  const password = document.createElement('input');

  password.id = 'adminPassword';
  password.type = 'password';
  password.placeholder = 'Enter password';
  password.autocomplete = 'current-password';
  password.required = true;
  password.className = pinInput.className;

  const label = document.createElement('label');
  label.htmlFor = 'adminPassword';
  label.textContent = 'PASSWORD';

  pinInput.insertAdjacentElement('afterend',label);
  label.insertAdjacentElement('afterend',password);
 }
}

// ========================================
// BATCHES
// ========================================

function renderClasses() {
 $('classGrid').innerHTML = CLASSES.map(c=>`
  <article class="class-card" data-class="${c.id}" tabindex="0">
   <img src="${c.logo}" alt="">
   <div>
    <h3>${c.name}</h3>
    <p>${students.filter(s=>s.classId===c.id).length} students · Open class →</p>
   </div>
  </article>
 `).join('');

 $('classGrid').querySelectorAll('[data-class]').forEach(el=>{
  const open = ()=>openClass(el.dataset.class);

  el.addEventListener('click',open);

  el.addEventListener('keydown',e=>{
   if(e.key==='Enter'||e.key===' ') {
    e.preventDefault();
    open();
   }
  });
 });
}

function populateBatchOptions() {
 $('newBatch').innerHTML = CLASSES.map(c=>
  `<option value="${c.id}">${c.name}</option>`
 ).join('');
}

function openClass(classId) {
 activeClass = classId;

 $('attendancePanel').hidden = false;

 const c = CLASSES.find(x=>x.id===classId);

 $('selectedTitle').textContent = c.name;
 $('studentSearch').value = '';

 renderStudentRoll();

 $('attendancePanel').scrollIntoView({
  behavior:'smooth',
  block:'start'
 });
}

// ========================================
// ATTENDANCE
// ========================================

function renderStudentRoll() {
 if (!activeClass) return;

 const date = $('attendanceDate').value || dateString(today);

 const search = $('studentSearch').value.trim().toLowerCase();

 const list = students.filter(s=>
  s.classId===activeClass &&
  s.name.toLowerCase().includes(search)
 );

 $('emptyBatch').hidden = list.length!==0;

 $('studentList').innerHTML = list.map(s=>{
  const status = attendanceStatus(s.id,date);

  const paid = feeStatus(
   s.id,
   monthStringFromDate(date)
  )==='paid';

  return `
   <div class="student-row">
    <div>
     <strong>${esc(s.name)}</strong>
     <small>Monthly fee:
      <span class="${paid?'green':'red'}">
       ${paid?'PAID':'UNPAID'}
      </span>
     </small>
    </div>
    <div class="attendance-buttons">
     <button data-att="present" data-id="${s.id}"
      class="${status==='present'?'selected-present':''}">
      PRESENT
     </button>
     <button data-att="absent" data-id="${s.id}"
      class="${status==='absent'?'selected-absent':''}">
      ABSENT
     </button>
    </div>
   </div>
  `;
 }).join('');

 $('studentList').querySelectorAll('[data-att]').forEach(btn=>{
  btn.addEventListener('click',()=>{
   const d = $('attendanceDate').value || dateString(today);

   attendance[d] = attendance[d] || {};
   attendance[d][btn.dataset.id] = btn.dataset.att;

   saveAll();
   renderStudentRoll();
   renderStats();
   renderReports();
  });
 });

 const batch = students.filter(s=>s.classId===activeClass);

 $('batchCount').textContent = batch.length;

 $('batchPresent').textContent =
  batch.filter(s=>attendanceStatus(s.id,date)==='present').length;

 $('batchAbsent').textContent =
  batch.filter(s=>attendanceStatus(s.id,date)==='absent').length;
}

// ========================================
// DASHBOARD STATISTICS
// ========================================

function renderStats() {
 const date = $('attendanceDate').value || dateString(today);

 let marked = 0;
 let present = 0;

 students.forEach(s=>{
  const a = attendanceStatus(s.id,date);

  if (a) {
   marked++;

   if (a==='present') present++;
  }
 });

 $('totalStudents').textContent = students.length;
 $('todayPresent').textContent = present;

 $('todayRate').textContent =
  marked ? Math.round(present/marked*100)+'%' : '—%';

 const m = $('reportMonth').value || monthString(today);

 $('feesPaidCount').textContent =
  students.filter(s=>feeStatus(s.id,m)==='paid').length;
}

// ========================================
// REPORTS
// ========================================

function renderReports() {
 const month = $('reportMonth').value || monthString(today);

 const rows = students.map(s=>{
  const records = Object.entries(attendance).filter(([d,vals])=>
   d.startsWith(month) && vals[s.id]
  );

  const p = records.filter(([,vals])=>vals[s.id]==='present').length;
  const a = records.filter(([,vals])=>vals[s.id]==='absent').length;

  const total = p+a;
  const rate = total ? Math.round(p/total*100) : 0;

  const c = CLASSES.find(x=>x.id===s.classId);

  return {
   s,c,p,a,total,rate,
   fee:feeStatus(s.id,month)
  };
 });

 $('reportBody').innerHTML = rows.length
  ? rows.map(r=>`
    <tr>
     <td>${esc(r.s.name)}</td>
     <td>${esc(r.c?.name||'')}</td>
     <td>${r.p}</td>
     <td>${r.a}</td>
     <td>${r.total?`${r.rate}%`:'—'}</td>
     <td>
      <span class="fee-badge ${r.fee==='paid'?'paid':'unpaid'}">
       ${r.fee.toUpperCase()}
      </span>
     </td>
    </tr>
   `).join('')
  : '<tr><td colspan="6">No students yet. Add students from the Admin panel.</td></tr>';

 $('reportSummary').textContent =
  `${rows.length} student(s) · ${rows.filter(r=>r.fee==='paid').length} paid · ${rows.filter(r=>r.fee!=='paid').length} unpaid for ${month}.`;

 renderStats();
}

// ========================================
// ADMIN LOGIN
// ========================================

function showAdmin() {
 $('adminModal').hidden = false;
 $('loginView').hidden = isAdmin;
 $('adminView').hidden = !isAdmin;

 if (isAdmin) {
  renderManage();
  renderFeesAdmin();
  populateBatchOptions();
 }
}

$('adminOpen').addEventListener('click',showAdmin);

$('adminClose').addEventListener('click',()=>
 $('adminModal').hidden = true
);

$('adminModal').addEventListener('click',e=>{
 if (e.target===$('adminModal')) {
  $('adminModal').hidden = true;
 }
});

$('loginForm').addEventListener('submit',async e=>{
 e.preventDefault();

 const email = $('adminEmail').value.trim();
 const password = $('adminPassword').value;

 $('loginError').hidden = true;

 try {
  await connectFirebase();

  const {signInWithEmailAndPassword} =
   await import('https://www.gstatic.com/firebase
