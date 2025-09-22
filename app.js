
// Shared app JS for demo multipage site (with simple mock authentication)
const STORAGE_KEY = 'madin_demo_v2';
const AUTH_KEY = 'madin_demo_auth';

// Mock users: username -> {password, role, idRef}
// Roles: Student, Parent, Teacher, Administrator, Judge, FestController
const MOCK_USERS = {
  "student": {password: "student123", role: "Student", idRef: "S101"},
  "parent": {password: "parent123", role: "Parent", idRef: "P1"},
  "teacher": {password: "teacher123", role: "Teacher", idRef: "T1"},
  "admin": {password: "admin123", role: "Administrator", idRef: "A1"},
  "judge": {password: "judge123", role: "Judge", idRef: "J1"},
  "festctrl": {password: "fest123", role: "FestController", idRef: "FC1"}
};

const SAMPLE = {
  students: [
    {id: 'S101', name: 'Aisha K', batch: 'Batch A', present: true, profile:{age:15,grade:9}, leaves:[] , competitions:[]},
    {id: 'S102', name: 'Muhammed R', batch: 'Batch B', present: false, profile:{age:14,grade:8}, leaves:[], competitions:[]},
    {id: 'S103', name: 'Sara P', batch: 'Batch A', present: true, profile:{age:13,grade:7}, leaves:[], competitions:[]}
  ],
  teachers: [ {id:'T1', name:'Umm Salma'}, {id:'T2', name:'Basith'} ],
  parents: [ {id:'P1', name:'Parent of Aisha', studentId:'S101'} ],
  admins: [ {id:'A1', name:'Principal'} ],
  judges: [ {id:'J1', name:'Judge Ahmed'} ],
  fest: { name: 'Excelentia', year: (new Date()).getFullYear(), competitions:[], stages:[], publishedResults: false },
  posts: []
};

function initStorage(){
  if(!localStorage.getItem(STORAGE_KEY)){
    localStorage.setItem(STORAGE_KEY, JSON.stringify(SAMPLE));
  }
}
function state(){ return JSON.parse(localStorage.getItem(STORAGE_KEY));}
function setState(s){ localStorage.setItem(STORAGE_KEY, JSON.stringify(s));}
function resetState(){ localStorage.removeItem(STORAGE_KEY); initStorage(); location.href = 'auth.html';}

function findStudent(id){ return state().students.find(s=>s.id===id); }
function formatDate(dt){ return new Date(dt).toLocaleString(); }

function q(id){ return document.getElementById(id); }

function currentAuth(){ return JSON.parse(localStorage.getItem(AUTH_KEY)); }
function isAuthenticated(){ return !!currentAuth(); }
function requireAuth(allowedRoles){
  const auth = currentAuth();
  if(!auth) { location.href = 'auth.html'; return false; }
  if(allowedRoles && !allowedRoles.includes(auth.role)){ // redirect based on role
    const role = auth.role;
    const map = { Student:'student.html', Parent:'parent.html', Teacher:'teacher.html', Administrator:'admin.html', Judge:'judge.html', FestController:'festcontroller.html' };
    location.href = map[role] || 'index.html';
    return false;
  }
  return true;
}
function signIn(username, password){
  const u = MOCK_USERS[username];
  if(!u || u.password !== password) return { ok:false, error:'Invalid credentials' };
  const payload = { username, role: u.role, idRef: u.idRef, at: new Date().toISOString() };
  localStorage.setItem(AUTH_KEY, JSON.stringify(payload));
  return { ok:true, payload };
}
function signOut(){
  localStorage.removeItem(AUTH_KEY);
  location.href = 'auth.html';
}

// Add a top-right user info / logout if header exists
document.addEventListener('DOMContentLoaded', ()=>{
  initStorage();
  // add user info block if header exists
  const header = document.querySelector('header');
  if(header){
    const div = document.createElement('div');
    div.className = 'flex';
    div.style.gap = '12px';
    const auth = currentAuth();
    if(auth){
      const info = document.createElement('div');
      info.className = 'card small';
      info.style.padding = '6px 10px';
      info.id = 'userInfo';
      info.textContent = auth.username + ' — ' + auth.role;
      const out = document.createElement('button');
      out.className = 'btn ghost';
      out.textContent = 'Logout';
      out.onclick = ()=>{ if(confirm('Logout?')) signOut(); };
      div.appendChild(info); div.appendChild(out);
    } else {
      const loginBtn = document.createElement('a');
      loginBtn.href = 'auth.html';
      loginBtn.className = 'btn';
      loginBtn.textContent = 'Login';
      div.appendChild(loginBtn);
    }
    header.appendChild(div);
  }
  const resetBtn = q('resetBtn');
  if(resetBtn) resetBtn.addEventListener('click', ()=>{
    if(confirm('Reset demo data?')) resetState();
  });
});
