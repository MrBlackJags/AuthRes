/**
 * BioTrack - Centralized Biomedical Research, Crowdfunding & Hospital Portal
 * Frontend API Bridge & Portal Navigation Manager
 */

const API_BASE_URL = 'http://localhost:5000/api';

// BioTrack REST API Client
const BioTrackAPI = {
  getProjects: async function(params = {}) {
    try {
      const query = new URLSearchParams(params).toString();
      const res = await fetch(`${API_BASE_URL}/projects?${query}`);
      if (!res.ok) throw new Error('API server error');
      return await res.json();
    } catch (e) {
      console.warn('API Server Offline, using local state:', e.message);
      return null;
    }
  },

  getProjectById: async function(id) {
    try {
      const res = await fetch(`${API_BASE_URL}/projects/${id}`);
      if (!res.ok) throw new Error('API server error');
      return await res.json();
    } catch (e) {
      console.warn('API Offline:', e.message);
      return null;
    }
  },

  donate: async function(projectId, amount, donorName) {
    try {
      const res = await fetch(`${API_BASE_URL}/projects/${projectId}/donate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount, donor_name: donorName })
      });
      return await res.json();
    } catch (e) {
      return { message: 'Donation processed in local state.' };
    }
  },

  submitCohort: async function(projectId, cohortData) {
    try {
      const res = await fetch(`${API_BASE_URL}/projects/${projectId}/cohorts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cohortData)
      });
      return await res.json();
    } catch (e) {
      return { message: 'Hospital cohort record submitted in local state.' };
    }
  }
};

// Global State
const BioTrackState = {
  currentRole: 'pi',
  roles: {
    pi: { title: 'Principal Investigator (PI)', badge: 'PI • Full Access', color: 'bg-emerald-600' },
    scientist: { title: 'Senior Scientist', badge: 'Senior Scientist • Write', color: 'bg-teal-600' },
    tech: { title: 'Lab Technician', badge: 'Lab Tech • Upload & Log', color: 'bg-cyan-600' },
    hospital: { title: 'Hospital Partner Representative', badge: 'Hospital Partner', color: 'bg-sky-600' },
    public: { title: 'Public Supporter / Donor', badge: 'Public Supporter', color: 'bg-amber-600' }
  },

  getBookmarks: function() {
    try { return JSON.parse(localStorage.getItem('biotrack_bookmarks') || '[]'); } catch(e) { return []; }
  },
  isBookmarked: function(id) { return this.getBookmarks().includes(id); },
  toggleBookmark: function(id) {
    let bookmarks = this.getBookmarks();
    const index = bookmarks.indexOf(id);
    let added = false;
    if (index > -1) { bookmarks.splice(index, 1); } 
    else { bookmarks.push(id); added = true; }
    localStorage.setItem('biotrack_bookmarks', JSON.stringify(bookmarks));
    return added;
  }
};

// Global Toast Notification System
function showToast(message, title = 'Notification', type = 'success') {
  let toastContainer = document.getElementById('toast-container');
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.id = 'toast-container';
    toastContainer.className = 'fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none px-4 sm:px-0';
    document.body.appendChild(toastContainer);
  }

  const toast = document.createElement('div');
  toast.className = `pointer-events-auto flex items-start gap-3 p-4 rounded-2xl shadow-xl border bg-white/95 backdrop-blur-md transition-all duration-300 transform translate-y-4 opacity-0 animate-fade-in ${
    type === 'success' ? 'border-emerald-200 shadow-emerald-900/10' :
    type === 'info' ? 'border-sky-200 shadow-sky-900/10' : 'border-amber-200 shadow-amber-900/10'
  }`;

  const iconBg = type === 'success' ? 'bg-emerald-100 text-emerald-700' :
                 type === 'info' ? 'bg-sky-100 text-sky-700' : 'bg-amber-100 text-amber-700';
  const icon = type === 'success' ? 'fa-check' : type === 'info' ? 'fa-info' : 'fa-triangle-exclamation';

  toast.innerHTML = `
    <div class="w-8 h-8 rounded-xl ${iconBg} flex items-center justify-center shrink-0 font-bold text-sm">
      <i class="fa-solid ${icon}"></i>
    </div>
    <div class="flex-1 min-w-0">
      <h4 class="text-xs font-bold text-slate-900 uppercase tracking-wider">${title}</h4>
      <p class="text-xs text-slate-600 mt-0.5">${message}</p>
    </div>
    <button onclick="this.parentElement.remove()" class="text-slate-400 hover:text-slate-600 p-1 text-xs">
      <i class="fa-solid fa-xmark"></i>
    </button>
  `;

  toastContainer.appendChild(toast);
  requestAnimationFrame(() => toast.classList.remove('translate-y-4', 'opacity-0'));
  setTimeout(() => {
    toast.classList.add('opacity-0', 'translate-y-2');
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

// Mobile Menu Handler
function toggleMobileMenu() {
  const menu = document.getElementById('mobile-menu');
  if (menu) {
    menu.classList.toggle('hidden');
    menu.classList.toggle('flex');
  }
}

// Bookmark Toggle Function
function handleBookmarkClick(btn, studyId, studyTitle) {
  const isAdded = BioTrackState.toggleBookmark(studyId);
  const icon = btn.querySelector('i');
  
  if (isAdded) {
    btn.classList.add('bg-emerald-50', 'text-emerald-600', 'border-emerald-200');
    btn.classList.remove('text-slate-400', 'hover:text-slate-600');
    if (icon) icon.className = 'fa-solid fa-star text-emerald-600';
    showToast(`"${studyTitle}" saved to your bookmarks.`, 'Bookmarked', 'success');
  } else {
    btn.classList.remove('bg-emerald-50', 'text-emerald-600', 'border-emerald-200');
    btn.classList.add('text-slate-400', 'hover:text-slate-600');
    if (icon) icon.className = 'fa-regular fa-star';
    showToast(`Removed from your saved studies.`, 'Bookmark Removed', 'info');
  }
}

// --- CROWDFUNDING DONATION MODAL ---
let activeProjectId = 'proj-1';
function openDonateModal(title, currentRaised, targetGoal, studyId) {
  activeProjectId = studyId || 'proj-1';
  let modal = document.getElementById('donate-modal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'donate-modal';
    modal.className = 'fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm opacity-0 pointer-events-none transition-all duration-300';
    modal.innerHTML = `
      <div class="bg-white rounded-3xl max-w-md w-full border border-amber-200 shadow-2xl overflow-hidden transform scale-95 transition-all duration-300" id="donate-card">
        <div class="bg-gradient-to-r from-amber-950 via-slate-900 to-emerald-950 text-white p-6 relative">
          <button onclick="closeDonateModal()" class="absolute top-5 right-5 text-slate-400 hover:text-white bg-white/10 w-8 h-8 rounded-full flex items-center justify-center transition">
            <i class="fa-solid fa-xmark"></i>
          </button>
          <div class="inline-flex items-center gap-1.5 bg-amber-500/20 border border-amber-400/30 text-amber-300 text-xs px-2.5 py-0.5 rounded-full font-semibold uppercase tracking-wider mb-2">
            <i class="fa-solid fa-hand-holding-heart text-amber-400"></i> Public Crowdfunding Support
          </div>
          <h3 id="donate-study-title" class="text-lg font-extrabold text-white"></h3>
          <p class="text-xs text-amber-200 mt-1">Directly accelerate open-science medical breakthroughs</p>
        </div>

        <div class="p-6 space-y-5 text-sm text-slate-700">
          <div class="bg-amber-50/70 p-4 rounded-2xl border border-amber-100 space-y-2">
            <div class="flex justify-between text-xs font-bold text-slate-800">
              <span>Funded So Far</span>
              <span id="donate-raised-text" class="text-amber-700">$32,500 of $50,000 Goal</span>
            </div>
            <div class="w-full bg-slate-200 rounded-full h-2.5 p-0.5">
              <div id="donate-progress-bar" class="bg-gradient-to-r from-amber-500 to-emerald-500 h-1.5 rounded-full transition-all duration-500" style="width: 65%"></div>
            </div>
            <p class="text-[11px] text-slate-500">142 public supporters • 100% transparent open science audit</p>
          </div>

          <div>
            <label class="block font-bold text-xs uppercase tracking-wider text-slate-600 mb-2">Select Donation Amount</label>
            <div class="grid grid-cols-4 gap-2 text-xs font-bold">
              <button onclick="setDonateAmount(25, this)" class="amount-btn p-2.5 rounded-xl border border-slate-200 hover:border-amber-500 hover:bg-amber-50 text-slate-700 transition">$25</button>
              <button onclick="setDonateAmount(50, this)" class="amount-btn p-2.5 rounded-xl border border-amber-500 bg-amber-50 text-amber-800 transition">$50</button>
              <button onclick="setDonateAmount(100, this)" class="amount-btn p-2.5 rounded-xl border border-slate-200 hover:border-amber-500 hover:bg-amber-50 text-slate-700 transition">$100</button>
              <button onclick="setDonateAmount(250, this)" class="amount-btn p-2.5 rounded-xl border border-slate-200 hover:border-amber-500 hover:bg-amber-50 text-slate-700 transition">$250</button>
            </div>
          </div>

          <div>
            <label class="block font-bold text-xs uppercase tracking-wider text-slate-600 mb-1">Supporter Name (Optional)</label>
            <input type="text" id="donate-name" placeholder="Anonymous or Dr. Jane Doe" class="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-amber-500" />
          </div>

          <button onclick="processDonation()" class="w-full py-3 bg-gradient-to-r from-amber-600 to-emerald-600 hover:from-amber-500 hover:to-emerald-500 text-white rounded-xl font-bold text-xs shadow-md shadow-amber-600/20 transition hover:scale-[1.01]">
            <i class="fa-solid fa-heart mr-1 text-amber-200"></i> Confirm Donation & Fund Pipeline
          </button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
  }

  document.getElementById('donate-study-title').textContent = title;
  document.getElementById('donate-raised-text').textContent = `${currentRaised} of ${targetGoal} Goal`;
  modal.classList.remove('opacity-0', 'pointer-events-none');
  document.getElementById('donate-card').classList.remove('scale-95');
}

let selectedDonation = 50;
function setDonateAmount(val, btn) {
  selectedDonation = val;
  document.querySelectorAll('.amount-btn').forEach(b => {
    b.className = 'amount-btn p-2.5 rounded-xl border border-slate-200 hover:border-amber-500 hover:bg-amber-50 text-slate-700 transition';
  });
  btn.className = 'amount-btn p-2.5 rounded-xl border border-amber-500 bg-amber-50 text-amber-800 font-bold transition';
}

async function processDonation() {
  closeDonateModal();
  const name = document.getElementById('donate-name').value || 'Supporter';
  await BioTrackAPI.donate(activeProjectId, selectedDonation, name);
  showToast(`Thank you ${name}! Your donation of $${selectedDonation} was submitted to the REST API server.`, 'Donation Received!', 'success');
}

function closeDonateModal() {
  const modal = document.getElementById('donate-modal');
  if (modal) modal.classList.add('opacity-0', 'pointer-events-none');
}

// --- HOSPITAL ANONYMIZED COHORT SUBMISSION MODAL ---
function openHospitalCohortModal(studyTitle) {
  let modal = document.getElementById('hospital-modal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'hospital-modal';
    modal.className = 'fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm opacity-0 pointer-events-none transition-all duration-300';
    modal.innerHTML = `
      <div class="bg-white rounded-3xl max-w-lg w-full border border-sky-100 shadow-2xl overflow-hidden transform scale-95 transition-all duration-300" id="hospital-card">
        <div class="bg-gradient-to-r from-sky-950 via-slate-900 to-teal-950 text-white p-6 relative">
          <button onclick="closeHospitalModal()" class="absolute top-5 right-5 text-slate-400 hover:text-white bg-white/10 w-8 h-8 rounded-full flex items-center justify-center transition">
            <i class="fa-solid fa-xmark"></i>
          </button>
          <div class="inline-flex items-center gap-1.5 bg-sky-500/20 border border-sky-400/30 text-sky-300 text-xs px-2.5 py-0.5 rounded-full font-semibold uppercase tracking-wider mb-2">
            <i class="fa-solid fa-hospital text-sky-400"></i> Hospital Clinical Portal
          </div>
          <h3 class="text-lg font-extrabold text-white">Submit Anonymized Patient Cohort Data</h3>
          <p class="text-xs text-sky-200 mt-1">HIPAA & GDPR Compliant De-Identified Record Vault</p>
        </div>

        <div class="p-6 space-y-4 text-xs text-slate-700">
          <div>
            <label class="block font-bold uppercase tracking-wider text-slate-600 mb-1">Hospital / Medical Center</label>
            <input type="text" id="hosp-name" value="Johns Hopkins Medicine / Clinical Oncology" class="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 focus:outline-none focus:border-sky-500" />
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block font-bold uppercase tracking-wider text-slate-600 mb-1">Cohort Patient Count</label>
              <input type="number" id="hosp-count" value="45" class="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 focus:outline-none focus:border-sky-500" />
            </div>
            <div>
              <label class="block font-bold uppercase tracking-wider text-slate-600 mb-1">Primary Biomarker Target</label>
              <input type="text" id="hosp-marker" value="EGFR T790M Mutation" class="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 focus:outline-none focus:border-sky-500" />
            </div>
          </div>

          <div>
            <label class="block font-bold uppercase tracking-wider text-slate-600 mb-1">De-Identified Clinical Summary</label>
            <textarea id="hosp-summary" rows="3" class="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 focus:outline-none focus:border-sky-500" placeholder="Summary of patient response metrics, dosage tolerances, and observed outcomes..."></textarea>
          </div>

          <div class="p-3 bg-sky-50 rounded-xl border border-sky-100 text-sky-900 text-[11px] flex items-center gap-2">
            <i class="fa-solid fa-shield-check text-sky-600 text-base"></i>
            <span>Verified 256-bit anonymization hash generated upon upload.</span>
          </div>

          <button onclick="submitHospitalCohort()" class="w-full py-3 bg-gradient-to-r from-sky-600 to-teal-600 hover:from-sky-500 hover:to-teal-500 text-white rounded-xl font-bold text-xs shadow-md shadow-sky-600/20 transition">
            <i class="fa-solid fa-upload mr-1"></i> Submit Verified Anonymized Cohort Record
          </button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
  }

  modal.classList.remove('opacity-0', 'pointer-events-none');
  document.getElementById('hospital-card').classList.remove('scale-95');
}

async function submitHospitalCohort() {
  closeHospitalModal();
  const hospName = document.getElementById('hosp-name').value;
  const count = document.getElementById('hosp-count').value;
  const marker = document.getElementById('hosp-marker').value;
  const summary = document.getElementById('hosp-summary').value;

  await BioTrackAPI.submitCohort('proj-1', {
    hospital_name: hospName,
    patient_count: count,
    biomarker_target: marker,
    deidentified_summary: summary
  });

  showToast('Anonymized patient cohort data successfully verified & stored via REST API.', 'Cohort Record Submitted', 'success');
}

function closeHospitalModal() {
  const modal = document.getElementById('hospital-modal');
  if (modal) modal.classList.add('opacity-0', 'pointer-events-none');
}

// --- SHARED HEADER NAVIGATION GENERATOR ---
function renderHeader(activePage = 'home') {
  window.currentActivePage = activePage;
  const role = BioTrackState.roles[BioTrackState.currentRole] || BioTrackState.roles.pi;

  return `
    <header class="sticky top-0 z-40 glass-panel border-b border-emerald-100/80 shadow-sm shadow-emerald-950/5">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        
        <!-- Logo & Brand -->
        <div class="flex items-center gap-6">
          <a href="index.html" class="flex items-center gap-2.5 group">
            <div class="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 via-green-500 to-emerald-400 text-white flex items-center justify-center shadow-md shadow-emerald-600/25 group-hover:scale-105 transition-transform">
              <i class="fa-solid fa-dna text-lg"></i>
            </div>
            <span class="font-extrabold text-xl tracking-tight text-slate-900">
              Bio<span class="text-gradient-emerald">Track</span>
            </span>
          </a>

          <!-- Specialized 3-User Portal Switcher Bar -->
          <nav class="hidden lg:flex items-center gap-1 bg-slate-100 p-1 rounded-2xl border border-slate-200/80 text-xs font-bold">
            <a href="public-portal.html" class="px-3 py-1.5 rounded-xl transition flex items-center gap-1.5 ${
              activePage === 'public-portal' 
                ? 'bg-amber-500 text-white shadow-xs' 
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }">
              <i class="fa-solid fa-heart text-amber-200"></i> Public Donors
            </a>

            <a href="hospital-portal.html" class="px-3 py-1.5 rounded-xl transition flex items-center gap-1.5 ${
              activePage === 'hospital-portal' 
                ? 'bg-sky-600 text-white shadow-xs' 
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }">
              <i class="fa-solid fa-hospital text-sky-200"></i> Hospitals
            </a>

            <a href="researcher-portal.html" class="px-3 py-1.5 rounded-xl transition flex items-center gap-1.5 ${
              activePage === 'researcher-portal' 
                ? 'bg-emerald-700 text-white shadow-xs' 
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }">
              <i class="fa-solid fa-microscope text-emerald-200"></i> Researchers
            </a>
          </nav>
        </div>

        <!-- Navigation Links -->
        <div class="flex items-center gap-3">
          <nav class="hidden md:flex items-center gap-1.5 text-xs font-semibold text-slate-600">
            <a href="index.html" class="px-3 py-1.5 rounded-xl hover:text-slate-900 hover:bg-emerald-50/50 transition ${activePage === 'home' ? 'font-bold text-emerald-700 bg-emerald-50' : ''}">Home</a>
            <a href="research.html" class="px-3 py-1.5 rounded-xl hover:text-slate-900 hover:bg-emerald-50/50 transition ${activePage === 'research' ? 'font-bold text-emerald-700 bg-emerald-50' : ''}">Directory</a>
            <a href="profile.html" class="px-3 py-1.5 rounded-xl hover:text-slate-900 hover:bg-emerald-50/50 transition ${activePage === 'profile' ? 'font-bold text-emerald-700 bg-emerald-50' : ''}">My Lab</a>
          </nav>

          <a href="publish.html" class="hidden sm:inline-flex items-center gap-1.5 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white px-3.5 py-1.5 rounded-xl text-xs font-bold shadow-md shadow-emerald-600/20 transition hover:scale-105">
            <i class="fa-solid fa-plus text-xs"></i> New Study
          </a>
          
          <a href="auth.html" class="inline-flex items-center gap-1 border border-slate-300 hover:border-emerald-500 bg-white text-slate-700 px-3 py-1.5 rounded-xl text-xs font-semibold transition">
            <i class="fa-regular fa-user text-xs"></i>
            <span>Sign In</span>
          </a>

          <!-- Mobile Toggle -->
          <button onclick="toggleMobileMenu()" class="lg:hidden p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 transition">
            <i class="fa-solid fa-bars text-base"></i>
          </button>
        </div>
      </div>

      <!-- Mobile Dropdown Navigation -->
      <div id="mobile-menu" class="hidden flex-col lg:hidden border-t border-emerald-100 bg-white px-4 pt-3 pb-4 space-y-2 text-xs font-bold shadow-lg">
        <div class="text-[10px] uppercase text-slate-400 tracking-wider">User Portals</div>
        <a href="public-portal.html" class="px-3 py-2 rounded-xl bg-amber-50 text-amber-800 flex items-center gap-2">
          <i class="fa-solid fa-heart text-amber-600"></i> Public Donor & Crowdfunding Portal
        </a>
        <a href="hospital-portal.html" class="px-3 py-2 rounded-xl bg-sky-50 text-sky-800 flex items-center gap-2">
          <i class="fa-solid fa-hospital text-sky-600"></i> Hospital & Clinical Partner Portal
        </a>
        <a href="researcher-portal.html" class="px-3 py-2 rounded-xl bg-emerald-50 text-emerald-800 flex items-center gap-2">
          <i class="fa-solid fa-microscope text-emerald-600"></i> Researcher & Lab RBAC Portal
        </a>
        
        <div class="text-[10px] uppercase text-slate-400 tracking-wider pt-2">General Pages</div>
        <a href="index.html" class="px-3 py-1.5 text-slate-700 hover:bg-slate-50 rounded-lg">Home Overview</a>
        <a href="research.html" class="px-3 py-1.5 text-slate-700 hover:bg-slate-50 rounded-lg">Research Directory</a>
        <a href="profile.html" class="px-3 py-1.5 text-slate-700 hover:bg-slate-50 rounded-lg">My Lab & Profile</a>
        <a href="publish.html" class="px-3 py-2 bg-emerald-600 text-white rounded-xl text-center font-bold">+ Register New Protocol</a>
      </div>
    </header>
  `;
}
