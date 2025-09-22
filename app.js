
// Shared app JS for demo multipage site (with simple mock authentication)
const STORAGE_KEY = 'madin_demo_v2';
const AUTH_KEY = 'madin_demo_auth';

// Mock users: username -> {password, role, idRef}
// Roles: Student, Parent, Teacher, Administrator, Judge, FestController
const MOCK_USERS = {
  "admin": {password: "admin123", role: "Administrator", idRef: "A1"},
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
  // ensure parents exist for each student and a users map exists
  const s = state();
  s.parents = s.parents || [];
  s.users = s.users || {};

  // Ensure one parent per student and create default student/parent credentials if missing
  s.students.forEach(st=>{
    const num = st.id.slice(1);
    const pid = 'P' + num;
    if(!s.parents.find(p=>p.studentId===st.id)){
      s.parents.push({ id: pid, name: 'Parent of ' + st.name, studentId: st.id });
    }
    const unameS = 's' + num;
    const unameP = 'p' + num;
    if(!s.users[unameS]) s.users[unameS] = { password: 'pass' + num, role:'Student', idRef: st.id };
    if(!s.users[unameP]){
      const parentObj = s.parents.find(p=>p.studentId===st.id);
      s.users[unameP] = { password: 'parent' + num, role:'Parent', idRef: parentObj.id };
    }
    // sync to in-memory MOCK_USERS for immediate session use
    MOCK_USERS[unameS] = s.users[unameS];
    MOCK_USERS[unameP] = s.users[unameP];
  });

  // Ensure teacher records and logins exist
  s.teachers = s.teachers || [];
  const teachers_needed = ["SHAFEEQUE RAHMAN MISBAHI","ABDULLA UVAIS SAQAFI","ABDUL KADER AHSANI","AHMAD SAQAFI","NOUFAL ADANY"];
  teachers_needed.forEach((tn, idx) => {
    if(!s.teachers.find(t => t.name === tn)){
      const tid = 'T' + (100 + idx + 1);
      s.teachers.push({ id: tid, name: tn });
    }
  });
  s.teachers.forEach((t, idx) => {
    const unameT = 'teacher' + (idx+1);
    if(!s.users[unameT]){
      s.users[unameT] = { password: 'teacher' + (idx+1) + 'pass', role: 'Teacher', idRef: t.id || ('T' + (200+idx)) };
      MOCK_USERS[unameT] = s.users[unameT];
    }
  });

  // Ensure judge records and logins exist
  s.judges = s.judges || [];
  const judges_needed = ["JUDGE 01","JUDGE 02","JUDGE 03"];
  judges_needed.forEach((jn, idx) => {
    if(!s.judges.find(j => j.name === jn)){
      const jid = 'J' + String(idx+1).padStart(2,'0');
      s.judges.push({ id: jid, name: jn });
    }
  });
  s.judges.forEach((j, idx) => {
    const uname = 'judge' + (idx+1);
    if(!s.users[uname]){
      s.users[uname] = { password: 'judge' + (idx+1) + 'pass', role: 'Judge', idRef: j.id || ('J' + (idx+1)) };
      MOCK_USERS[uname] = s.users[uname];
    }
  });

  setState(s);
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
function signIn(username, password, remember=false){
  let u = MOCK_USERS[username];
  const s = state(); if(!u && s.users && s.users[username]){ u = s.users[username]; }
  if(!u || u.password !== password) return { ok:false, error:'Invalid credentials' };
  const payload = { username, role: u.role, idRef: u.idRef, at: new Date().toISOString() };
  if(remember){ payload.remember = true; localStorage.setItem(AUTH_KEY, JSON.stringify(payload)); } else { localStorage.setItem(AUTH_KEY, JSON.stringify(payload)); }
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



// Returns the user object from MOCK_USERS augmented with username and role
function getCurrentUserObject(){
  const auth = currentAuth();
  if(!auth) return null;
  const u = MOCK_USERS[auth.username];
  if(!u) return { username: auth.username, role: auth.role, idRef: auth.idRef };
  return { username: auth.username, role: auth.role, idRef: u.idRef || auth.idRef };
}

// Highlight active nav link
document.addEventListener('DOMContentLoaded', ()=>{
  const path = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('nav a').forEach(a=>{
    if(a.getAttribute('href') === path) a.style.fontWeight = '800';
  });
  // If logged in and remember=false but user exists, keep them logged in (remember preserved in payload.remember)
  const auth = currentAuth();
  if(auth && !auth.remember){
    // nothing to change; but we could remove auto-logout behavior
  }
});


// Create a user entry in MOCK_USERS and persist to localStorage users map (for demo)
function createUser(username, password, role, idRef){
  // For demo we keep MOCK_USERS in memory; but also persist a 'users' map inside STORAGE to allow admin edits
  try {
    const s = state();
    s.users = s.users || {};
    s.users[username] = { password, role, idRef };
    setState(s);
    // Also update in-memory MOCK_USERS for current session
    MOCK_USERS[username] = { password, role, idRef };
    return true;
  } catch(e){
    console.error('createUser error', e);
    return false;
  }
}

// When admin adds a student, call this to create student + parent + creds
function createStudentWithParent(name, batch, grade){
  const s = state();
  // generate unique student id S{number}
  const base = 100 + Math.floor(Math.random()*900);
  let sid = 'S' + (Date.now()%100000 + Math.floor(Math.random()*1000));
  // ensure unique
  while(s.students.find(x=>x.id===sid)){
    sid = 'S' + (Date.now()%100000 + Math.floor(Math.random()*1000));
  }
  const pid = 'P' + sid.slice(1); // P followed by same numeric part
  const studentObj = { id: sid, name: name, batch: batch || 'Batch X', present:false, profile:{age:0,grade:grade||''}, leaves:[], competitions:[] };
  s.students.push(studentObj);
  // create parent object
  const parentObj = { id: pid, name: 'Parent of ' + name, studentId: sid };
  s.parents = s.parents || [];
  s.parents.push(parentObj);
  // create credentials: s{num}, p{num}
  const unameS = 's' + sid.slice(1);
  const passwdS = 'pass' + sid.slice(1);
  const unameP = 'p' + sid.slice(1);
  const passwdP = 'parent' + sid.slice(1);
  // persist in s.users map and in-memory MOCK_USERS
  s.users = s.users || {};
  s.users[unameS] = { password: passwdS, role: 'Student', idRef: sid };
  s.users[unameP] = { password: passwdP, role: 'Parent', idRef: pid };
  setState(s);
  MOCK_USERS[unameS] = { password: passwdS, role: 'Student', idRef: sid };
  MOCK_USERS[unameP] = { password: passwdP, role: 'Parent', idRef: pid };
  return { student: studentObj, parent: parentObj, creds: { student: unameS+'/'+passwdS, parent: unameP+'/'+passwdP } };
}


// Update a user's password in persistent state.users and in-memory MOCK_USERS
function updateUserPassword(username, newPassword){
  try{
    const s = state();
    s.users = s.users || {};
    if(!s.users[username]){
      return { ok:false, error: 'User not found' };
    }
    s.users[username].password = newPassword;
    setState(s);
    // sync to in-memory mock
    MOCK_USERS[username] = { password: newPassword, role: s.users[username].role, idRef: s.users[username].idRef };
    return { ok:true };
  } catch(e){
    console.error(e);
    return { ok:false, error: e.message };
  }
}

// Delete user (optional)
function deleteUser(username){
  try{
    const s = state();
    s.users = s.users || {};
    if(!s.users[username]) return { ok:false, error:'User not found' };
    delete s.users[username];
    setState(s);
    if(MOCK_USERS[username]) delete MOCK_USERS[username];
    return { ok:true };
  } catch(e){
    return { ok:false, error: e.message };
  }
}
