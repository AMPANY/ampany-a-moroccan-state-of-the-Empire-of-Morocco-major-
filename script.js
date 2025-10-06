// Simple client-side storage and UI switching
const panels = document.querySelectorAll('.panel');
const navBtns = document.querySelectorAll('.nav-btn');

function show(id){
  panels.forEach(p=>p.id===id?p.classList.add('active'):p.classList.remove('active'));
  window.scrollTo({top:0,behavior:'smooth'});
}

navBtns.forEach(b=>b.addEventListener('click', ()=> show(b.dataset.section)));
document.getElementById('open-file').addEventListener('click', ()=> show('file'));
document.getElementById('view-docket').addEventListener('click', ()=> show('docket'));
document.getElementById('view-docket-from-form').addEventListener('click', ()=> show('docket'));

// Docket storage
const STORAGE_KEY = 'ampany_docket_v1';
function readDocket(){ return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); }
function writeDocket(arr){ localStorage.setItem(STORAGE_KEY, JSON.stringify(arr)); renderDocket(); }

function renderDocket(){
  const tbody = document.querySelector('#docket-table tbody');
  tbody.innerHTML = '';
  const items = readDocket();
  if(!items.length){
    const tr = document.createElement('tr');
    tr.innerHTML = `<td colspan="7" style="opacity:.7">No cases in docket.</td>`;
    tbody.appendChild(tr);
    return;
  }
  items.forEach((c, i)=>{
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${c.case_id}</td>
      <td>${escapeHtml(c.title||'')}</td>
      <td>${escapeHtml(c.party||'')}</td>
      <td>${escapeHtml(c.type||'')}</td>
      <td>${escapeHtml(c.status||'Pending')}</td>
      <td>${c.created||''}</td>
      <td>
        <button data-i="${i}" class="view-btn">View</button>
        <button data-i="${i}" class="del-btn">Delete</button>
      </td>`;
    tbody.appendChild(tr);
  });
}

// helper
function escapeHtml(s){ return String(s||'').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }

document.querySelector('#docket-table').addEventListener('click', (ev)=>{
  const v = ev.target;
  if(v.classList.contains('del-btn')){
    const i = Number(v.dataset.i);
    const arr = readDocket(); arr.splice(i,1); writeDocket(arr);
  } else if(v.classList.contains('view-btn')){
    const i = Number(v.dataset.i);
    const arr = readDocket();
    alert('Case: ' + (arr[i]?.title || '—'));
  }
});

// file form
document.getElementById('file-form').addEventListener('submit', (e)=>{
  e.preventDefault();
  const fd = new FormData(e.target);
  const item = {
    case_id: 'AMPANY-' + Date.now().toString(36).toUpperCase().slice(-8),
    party: fd.get('party'),
    role: fd.get('role'),
    respondent: fd.get('respondent'),
    title: fd.get('title'),
    type: fd.get('type'),
    amount: fd.get('amount'),
    incident_date: fd.get('incident_date'),
    created: new Date().toLocaleString(),
    status: 'Filed'
  };
  const arr = readDocket(); arr.unshift(item); writeDocket(arr);
  e.target.reset();
  show('docket');
});

// export / import / clear
document.getElementById('export-json').addEventListener('click', ()=>{
  const data = JSON.stringify(readDocket(),null,2);
  const blob = new Blob([data],{type:'application/json'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href=url; a.download='ampany-docket.json'; a.click();
  URL.revokeObjectURL(url);
});
document.getElementById('import-json').addEventListener('change', async (ev)=>{
  const f = ev.target.files[0]; if(!f) return;
  const text = await f.text();
  try{
    const parsed = JSON.parse(text);
    if(Array.isArray(parsed)){
      writeDocket(parsed);
      alert('Imported ' + parsed.length + ' cases.');
    } else alert('Invalid JSON format. Expecting an array.');
  }catch(err){ alert('Invalid JSON file'); }
});
document.getElementById('clear-all').addEventListener('click', ()=>{
  if(confirm('Clear all local docket data? This cannot be undone in localStorage.')){ localStorage.removeItem(STORAGE_KEY); renderDocket(); }
});
document.getElementById('clear-data').addEventListener('click', ()=> {
  if(confirm('Clear all local data?')){ localStorage.clear(); renderDocket(); }
});

// verify (demo)
document.getElementById('verify-btn').addEventListener('click', ()=>{
  const code = document.getElementById('verify-code').value.trim();
  const out = document.getElementById('verify-result');
  if(!code) return out.textContent = 'Enter a verification code to check.';
  // demo behaviour: check if any case_id matches
  const found = readDocket().find(c=>c.case_id === code);
  out.textContent = found ? `Verified: ${found.title} (filed ${found.created})` : 'No matching record found in local registry.';
});

// contacts (simple)
const contactsList = document.getElementById('contacts-list');
document.getElementById('add-contact').addEventListener('click', ()=>{
  const name = prompt('Contact name');
  if(!name) return;
  const li = document.createElement('li'); li.textContent = name; contactsList.appendChild(li);
});

// small utility
renderDocket();

// Accessibility: allow switching with hash
window.addEventListener('hashchange', ()=> {
  const hash = location.hash.replace('#','');
  if(hash) show(hash);
});
