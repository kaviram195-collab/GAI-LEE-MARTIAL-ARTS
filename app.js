(() => {
'use strict';
const CLASSES = [
 {id:'association',name:'FIRST BATCH',logo:'FIRST.jpg'},
 {id:'silambam',name:'SECOND BATCH',logo:'SECOND.jpg'},
 {id:'sports',name:'MORNING BATCH',logo:'MORNING.jpg'},
 {id:'boxing',name:'SAT & SUN BATCH',logo:'SAT%26SUN.jpg'},
 {id:'archery',name:'PARANIPUTHUR CLASS',logo:'PARANIPUTHUR.jpg'},
];
const $ = id => document.getElementById(id);
const today = new Date();
const dateString = d => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
const monthString = d => dateString(d).slice(0,7);
const load = (key, fallback) => { try { const v=localStorage.getItem(key); return v ? JSON.parse(v) : fallback; } catch { return fallback; } };
let students = load('gaiLeeStudents', []), attendance = load('gaiLeeAttendance', {}), fees = load('gaiLeeFees', {});
let pin = localStorage.getItem('gaiLeePin') || '1234', activeClass = null, isAdmin = false;
const saveAll = () => { localStorage.setItem('gaiLeeStudents',JSON.stringify(students));localStorage.setItem('gaiLeeAttendance',JSON.stringify(attendance));localStorage.setItem('gaiLeeFees',JSON.stringify(fees)); };
const esc = s => String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function toast(msg){$('toast').textContent=msg;$('toast').hidden=false;setTimeout(()=>$('toast').hidden=true,2400)}
function feeKey(studentId,month){return `${month}:${studentId}`}
function feeStatus(studentId,month){return fees[feeKey(studentId,month)] || 'unpaid'}
function attendanceStatus(studentId,date){return attendance[date]?.[studentId] || ''}
function init(){ $('attendanceDate').value=dateString(today);$('reportMonth').value=monthString(today);$('feeMonth').value=monthString(today);renderClasses();renderStats();renderReports();populateBatchOptions(); }
function renderClasses(){ $('classGrid').innerHTML=CLASSES.map(c=>`<article class="class-card" data-class="${c.id}" tabindex="0"><img src="${c.logo}" alt=""><div><h3>${c.name}</h3><p>${students.filter(s=>s.classId===c.id).length} students · Open class →</p></div></article>`).join('');$('classGrid').querySelectorAll('[data-class]').forEach(el=>{const open=()=>openClass(el.dataset.class);el.addEventListener('click',open);el.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();open()}})}); }
function renderStats(){const date=$('attendanceDate').value||dateString(today);let marked=0,present=0;students.forEach(s=>{const a=attendanceStatus(s.id,date);if(a){marked++;if(a==='present')present++}});$('totalStudents').textContent=students.length;$('todayPresent').textContent=present;$('todayRate').textContent=marked?Math.round(present/marked*100)+'%':'—%';const m=$('reportMonth').value||monthString(today);$('feesPaidCount').textContent=students.filter(s=>feeStatus(s.id,m)==='paid').length;}
function populateBatchOptions(){ $('newBatch').innerHTML=CLASSES.map(c=>`<option value="${c.id}">${c.name}</option>`).join(''); }
function openClass(classId){activeClass=classId;$('attendancePanel').hidden=false;const c=CLASSES.find(x=>x.id===classId);$('selectedTitle').textContent=c.name;$('studentSearch').value='';renderStudentRoll();$('attendancePanel').scrollIntoView({behavior:'smooth',block:'start'});}
function renderStudentRoll(){if(!activeClass)return;const date=$('attendanceDate').value||dateString(today),search=$('studentSearch').value.trim().toLowerCase();const list=students.filter(s=>s.classId===activeClass&&s.name.toLowerCase().includes(search));$('emptyBatch').hidden=list.length!==0;$('studentList').innerHTML=list.map(s=>{const status=attendanceStatus(s.id,date);return `<div class="student-row"><div><strong>${esc(s.name)}</strong><small>Monthly fee: <span class="${feeStatus(s.id,monthStringFromDate(date))==='paid'?'green':'red'}">${feeStatus(s.id,monthStringFromDate(date))==='paid'?'PAID':'UNPAID'}</span></small></div><div class="attendance-buttons"><button data-att="present" data-id="${s.id}" class="${status==='present'?'selected-present':''}">PRESENT</button><button data-att="absent" data-id="${s.id}" class="${status==='absent'?'selected-absent':''}">ABSENT</button></div></div>`}).join('');$('studentList').querySelectorAll('[data-att]').forEach(btn=>btn.addEventListener('click',()=>{const d=$('attendanceDate').value||dateString(today);attendance[d]=attendance[d]||{};attendance[d][btn.dataset.id]=btn.dataset.att;saveAll();renderStudentRoll();renderStats();renderReports()}));const batch=students.filter(s=>s.classId===activeClass);const p=batch.filter(s=>attendanceStatus(s.id,date)==='present').length,a=batch.filter(s=>attendanceStatus(s.id,date)==='absent').length;$('batchCount').textContent=batch.length;$('batchPresent').textContent=p;$('batchAbsent').textContent=a;}
function monthStringFromDate(date){return (date||dateString(today)).slice(0,7)}
function renderReports(){const month=$('reportMonth').value||monthString(today);const rows=students.map(s=>{const records=Object.entries(attendance).filter(([d,vals])=>d.startsWith(month)&&vals[s.id]);const p=records.filter(([,vals])=>vals[s.id]==='present').length,a=records.filter(([,vals])=>vals[s.id]==='absent').length,total=p+a,rate=total?Math.round(p/total*100):0;const c=CLASSES.find(x=>x.id===s.classId);return {s,c,p,a,total,rate,fee:feeStatus(s.id,month)}});$('reportBody').innerHTML=rows.length?rows.map(r=>`<tr><td>${esc(r.s.name)}</td><td>${esc(r.c?.name||'')}</td><td>${r.p}</td><td>${r.a}</td><td>${r.total?`${r.rate}%`:'—'}</td><td><span class="fee-badge ${r.fee==='paid'?'paid':'unpaid'}">${r.fee.toUpperCase()}</span></td></tr>`).join(''):'<tr><td colspan="6">No students yet. Add students from the Admin panel.</td></tr>';$('reportSummary').textContent=`${rows.length} student(s) · ${rows.filter(r=>r.fee==='paid').length} paid · ${rows.filter(r=>r.fee!=='paid').length} unpaid for ${month}.`;renderStats();}
function renderManage(){const list=$('manageList');list.innerHTML=students.length?students.map(s=>`<div class="manage-item"><span>${esc(s.name)}<br><small>${esc(CLASSES.find(c=>c.id===s.classId)?.name||'')}</small></span><button class="danger" data-delete="${s.id}">DELETE</button></div>`).join(''):'<p class="muted">No students added yet.</p>';list.querySelectorAll('[data-delete]').forEach(btn=>btn.addEventListener('click',()=>{const s=students.find(x=>x.id===btn.dataset.delete);if(!s||!confirm(`Delete ${s.name}? This also removes their attendance and fee history.`))return;students=students.filter(x=>x.id!==s.id);Object.keys(attendance).forEach(d=>{delete attendance[d][s.id];if(!Object.keys(attendance[d]).length)delete attendance[d]});Object.keys(fees).forEach(k=>{if(k.endsWith(':'+s.id))delete fees[k]});saveAll();renderAll();renderManage();toast('Student deleted.')}));}
function renderFeesAdmin(){const month=$('feeMonth').value||monthString(today);$('feeAdminList').innerHTML=students.length?students.map(s=>{const paid=feeStatus(s.id,month)==='paid';return `<div class="fee-admin-row"><div><b>${esc(s.name)}</b><small>${esc(CLASSES.find(c=>c.id===s.classId)?.name||'')}</small></div><div class="fee-toggle"><button data-fee="paid" data-id="${s.id}" class="${paid?'paid':''}">PAID</button><button data-fee="unpaid" data-id="${s.id}" class="${!paid?'unpaid':''}">UNPAID</button></div></div>`}).join(''):'<p class="muted">Add students first to manage fees.</p>'; $('feeAdminList').querySelectorAll('[data-fee]').forEach(btn=>btn.addEventListener('click',()=>{fees[feeKey(btn.dataset.id,month)]=btn.dataset.fee;saveAll();renderFeesAdmin();renderReports();if(activeClass)renderStudentRoll();toast('Monthly fee status saved.')}));}
function renderAll(){renderClasses();renderStats();renderReports();if(activeClass)renderStudentRoll();}
function showAdmin(){ $('adminModal').hidden=false;$('loginView').hidden=isAdmin;$('adminView').hidden=!isAdmin;if(isAdmin){renderManage();renderFeesAdmin();populateBatchOptions()}}
$('adminOpen').addEventListener('click',showAdmin);$('adminClose').addEventListener('click',()=>$('adminModal').hidden=true);$('adminModal').addEventListener('click',e=>{if(e.target===$('adminModal'))$('adminModal').hidden=true});
$('loginForm').addEventListener('submit',e=>{e.preventDefault();if($('adminPin').value===pin){isAdmin=true;$('loginError').hidden=true;showAdmin();$('adminPin').value=''}else $('loginError').hidden=false});
document.querySelectorAll('[data-tab]').forEach(btn=>btn.addEventListener('click',()=>{document.querySelectorAll('[data-tab]').forEach(b=>b.classList.toggle('active',b===btn));document.querySelectorAll('.pane').forEach(p=>p.hidden=p.id!==btn.dataset.tab);if(btn.dataset.tab==='managePane')renderManage();if(btn.dataset.tab==='feesPane')renderFeesAdmin()}));
$('addForm').addEventListener('submit',e=>{e.preventDefault();const name=$('newName').value.trim(),classId=$('newBatch').value;if(!name)return;if(students.some(s=>s.name.toLowerCase()===name.toLowerCase()&&s.classId===classId)){toast('That student already exists in this class.');return}students.push({id:crypto.randomUUID?crypto.randomUUID():String(Date.now())+Math.random().toString(16).slice(2),name,classId});saveAll();$('newName').value='';$('addSuccess').hidden=false;renderAll();renderFeesAdmin();toast('Student added successfully.')});
$('saveSettings').addEventListener('click',()=>{const next=$('newPin').value.trim();if(next){if(next.length<4||next.length>12){toast('PIN must be 4–12 characters.');return}pin=next;localStorage.setItem('gaiLeePin',pin);$('newPin').value=''}toast('Settings saved.')});$('logout').addEventListener('click',()=>{isAdmin=false;showAdmin();toast('Admin panel locked.')});
$('attendanceDate').addEventListener('change',()=>{renderStats();if(activeClass)renderStudentRoll()});$('studentSearch').addEventListener('input',renderStudentRoll);$('saveAttendance').addEventListener('click',()=>{saveAll();toast('Attendance saved for '+($('attendanceDate').value||dateString(today))+'.');renderStats();renderReports()});$('backClasses').addEventListener('click',()=>{$('attendancePanel').hidden=true;activeClass=null;$('classes').scrollIntoView({behavior:'smooth'})});$('reportMonth').addEventListener('change',renderReports);$('feeMonth').addEventListener('change',renderFeesAdmin);$('refreshReport').addEventListener('click',()=>{renderReports();toast('Reports refreshed.')});
$('exportCsv').addEventListener('click',()=>{const month=$('reportMonth').value||monthString(today);const rows=[['Student','Class / Batch','Month','Present','Absent','Recorded days','Attendance %','Monthly fee status']];students.forEach(s=>{const rec=Object.entries(attendance).filter(([d,v])=>d.startsWith(month)&&v[s.id]);const p=rec.filter(([,v])=>v[s.id]==='present').length,a=rec.filter(([,v])=>v[s.id]==='absent').length,total=p+a;rows.push([s.name,CLASSES.find(c=>c.id===s.classId)?.name||'',month,p,a,total,total?Math.round(p/total*100):0,feeStatus(s.id,month).toUpperCase()])});const csv=rows.map(row=>row.map(v=>'"'+String(v).replace(/"/g,'""')+'"').join(',')).join('\r\n');const blob=new Blob(['\ufeff'+csv],{type:'text/csv;charset=utf-8;'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=`gai-lee-report-${month}.csv`;a.click();URL.revokeObjectURL(url)});
// TEMPORARY BACKUP BUTTON
  const backupButton = document.createElement('button');
  backupButton.textContent = 'BACKUP MY DATA';
  backupButton.style.cssText =
    'position:fixed;bottom:20px;right:15px;z-index:99999;' +
    'padding:14px;background:#d4af37;color:#000;' +
    'font-weight:bold;border:2px solid #000;border-radius:10px;';

  backupButton.onclick = function () {
    const backup = {
  students: JSON.parse(localStorage.getItem('gaiLeeStudents') || '[]'),
  attendance: JSON.parse(localStorage.getItem('gaiLeeAttendance') || '{}'),
  fees: JSON.parse(localStorage.getItem('gaiLeeFees') || '{}')
};

    const file = new Blob(
      [JSON.stringify(backup, null, 2)],
      { type: 'application/json' }
    );

    const link = document.createElement('a');
    link.href = URL.createObjectURL(file);
    link.download = 'GAI-LEE-BACKUP.json';
    link.click();

    setTimeout(() => URL.revokeObjectURL(link.href), 1000);
    alert('Backup downloaded. Keep this file safe!');
  };

  document.body.appendChild(backupButton);
 
 init();
})();
