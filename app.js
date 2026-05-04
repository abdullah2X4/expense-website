// ===== Masareefy V6 - Firebase v9 + Settings =====

// 1. Imports
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-analytics.js";
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js";
import { getFirestore, collection, addDoc, deleteDoc, doc, onSnapshot, query, orderBy, serverTimestamp, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";

// 2. Firebase Config
const firebaseConfig = {
  apiKey: "AIzaSyBS3FCovS0LmOGgWSIOxoL3kiKe5mjkl1k",
  authDomain: "masarefy-v6.firebaseapp.com",
  projectId: "masarefy-v6",
  storageBucket: "masarefy-v6.firebasestorage.app",
  messagingSenderId: "362855388821",
  appId: "1:362855388821:web:6bc34c415c520f60102d9c",
  measurementId: "G-LNXCG5P1BJ"
};

// 3. Initialize
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const db = getFirestore(app);

let expenses = [];
let currentUser = null;
let settings = {
  lang: 'ar',
  currency: 'EGP',
  theme: 'light'
};

// 4. Translations
const t = {
  ar: {
    thisMonth: 'إجمالي هذا الشهر',
    chart: 'الرسوم البيانية',
    search: 'بحث بالاسم',
    searchPlaceholder: 'اكتب اسم المصروف...',
    filterMonth: 'فلترة بالشهر',
    noExpenses: 'لا توجد مصاريف',
    settings: 'الإعدادات',
    language: 'اللغة',
    currency: 'العملة',
    appMode: 'وضع التطبيق',
    light: 'فاتح',
    dark: 'داكن',
    deleteConfirm: 'متأكد عايز تمسح المصروف؟'
  },
  en: {
    thisMonth: 'This Month',
    chart: 'Expense Chart',
    search: 'Search by name',
    searchPlaceholder: 'Type expense name...',
    filterMonth: 'Filter by month',
    noExpenses: 'No expenses found',
    settings: 'Settings',
    language: 'Language',
    currency: 'Currency',
    appMode: 'App Mode',
    light: 'Light',
    dark: 'Dark',
    deleteConfirm: 'Are you sure you want to delete?'
  }
};

const currencies = {
  EGP: { symbol: 'ج.م', name: 'جنيه مصري' },
  USD: { symbol: '$', name: 'US Dollar' },
  SAR: { symbol: 'ر.س', name: 'Saudi Riyal' },
  AED: { symbol: 'د.إ', name: 'UAE Dirham' }
};

// 5. Auth State
onAuthStateChanged(auth, async (user) => {
  if (user) {
    currentUser = user;
    await loadSettings();
    applyTheme();
    if (window.location.pathname.includes('login.html')) {
      window.location.href = 'index.html';
    } else {
      loadExpenses();
      renderSettingsModal();
    }
  } else {
    if (!window.location.pathname.includes('login.html')) {
      window.location.href = 'login.html';
    }
  }
});

// 6. Login
const loginBtn = document.getElementById('loginBtn');
if (loginBtn) {
  loginBtn.addEventListener('click', async () => {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      alert('خطأ في تسجيل الدخول: ' + error.message);
    }
  });
}

// 7. Logout
const logoutBtn = document.getElementById('logoutBtn');
if (logoutBtn) {
  logoutBtn.addEventListener('click', () => signOut(auth));
}

// 8. Settings - Load/Save
async function loadSettings() {
  const docRef = doc(db, 'users', currentUser.uid);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists() && docSnap.data().settings) {
    settings = {...settings,...docSnap.data().settings };
  }
  document.documentElement.lang = settings.lang;
}

async function saveSettings() {
  await setDoc(doc(db, 'users', currentUser.uid), { settings }, { merge: true });
  applyTheme();
  renderAll();
}

// 9. Theme
function applyTheme() {
  if (settings.theme === 'dark') {
    document.documentElement.classList.add('dark');
    document.body.classList.add('bg-gray-900', 'text-white');
  } else {
    document.documentElement.classList.remove('dark');
    document.body.classList.remove('bg-gray-900', 'text-white');
  }
}

// 10. Settings Modal
function renderSettingsModal() {
  const settingsBtn = document.getElementById('settingsBtn');
  if (!settingsBtn) return;

  // امسح المودال القديم
  const oldModal = document.getElementById('settingsModal');
  if (oldModal) oldModal.remove();

  const modal = document.createElement('div');
  modal.id = 'settingsModal';
  modal.className = 'hidden fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center';
  modal.innerHTML = `
    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-6 w-11/12 max-w-md">
      <div class="flex justify-between items-center mb-6">
        <h2 class="text-xl font-bold">${t[settings.lang].settings}</h2>
        <button id="closeSettings" class="text-2xl">&times;</button>
      </div>

      <div class="space-y-4">
        <div>
          <label class="block text-sm font-medium mb-2">${t[settings.lang].language}</label>
          <select id="langSelect" class="w-full border rounded-lg px-4 py-2 dark:bg-gray-700">
            <option value="ar" ${settings.lang === 'ar'? 'selected' : ''}>العربية</option>
            <option value="en" ${settings.lang === 'en'? 'selected' : ''}>English</option>
          </select>
        </div>

        <div>
          <label class="block text-sm font-medium mb-2">${t[settings.lang].currency}</label>
          <select id="currencySelect" class="w-full border rounded-lg px-4 py-2 dark:bg-gray-700">
            ${Object.keys(currencies).map(c => `
              <option value="${c}" ${settings.currency === c? 'selected' : ''}>${currencies[c].name} ${currencies[c].symbol}</option>
            `).join('')}
          </select>
        </div>

        <div>
          <label class="block text-sm font-medium mb-2">${t[settings.lang].appMode}</label>
          <div class="flex gap-2">
            <button id="lightMode" class="flex-1 py-2 rounded-lg border ${settings.theme === 'light'? 'bg-blue-500 text-white' : 'dark:border-gray-600'}">
              <i class="fas fa-sun"></i> ${t[settings.lang].light}
            </button>
            <button id="darkMode" class="flex-1 py-2 rounded-lg border ${settings.theme === 'dark'? 'bg-blue-500 text-white' : 'dark:border-gray-600'}">
              <i class="fas fa-moon"></i> ${t[settings.lang].dark}
            </button>
          </div>
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(modal);

  // Events
  settingsBtn.onclick = () => modal.classList.remove('hidden');
  document.getElementById('closeSettings').onclick = () => modal.classList.add('hidden');
  modal.onclick = (e) => { if (e.target === modal) modal.classList.add('hidden'); };

  document.getElementById('langSelect').onchange = async (e) => {
    settings.lang = e.target.value;
    await saveSettings();
    renderSettingsModal();
  };

  document.getElementById('currencySelect').onchange = async (e) => {
    settings.currency = e.target.value;
    await saveSettings();
  };

  document.getElementById('lightMode').onclick = async () => {
    settings.theme = 'light';
    await saveSettings();
    renderSettingsModal();
  };

  document.getElementById('darkMode').onclick = async () => {
    settings.theme = 'dark';
    await saveSettings();
    renderSettingsModal();
  };
}

// 11. Load Expenses
function loadExpenses() {
  const q = query(collection(db, 'users', currentUser.uid, 'expenses'), orderBy('date', 'desc'));
  onSnapshot(q, (snapshot) => {
    expenses = [];
    snapshot.forEach((doc) => {
      expenses.push({ id: doc.id,...doc.data() });
    });
    renderAll();
    setupFilters();
  });
}

// 12. Add Expense
const addExpenseBtn = document.getElementById('addExpenseBtn');
if (addExpenseBtn) {
  addExpenseBtn.addEventListener('click', async () => {
    const name = document.getElementById('expenseName').value;
    const amount = parseFloat(document.getElementById('expenseAmount').value);
    const date = document.getElementById('expenseDate').value;
    if (!name ||!amount ||!date) return alert('املأ كل الحقول');
    await addDoc(collection(db, 'users', currentUser.uid, 'expenses'), {
      name, amount, date, createdAt: serverTimestamp()
    });
    document.getElementById('expenseName').value = '';
    document.getElementById('expenseAmount').value = '';
  });
}

// 13. Render All
function renderAll() {
  renderMonthTotal();
  renderExpensesList();
  renderChart();
  updateLabels();
}

// 14. Update Labels with Translation
function updateLabels() {
  const lang = settings.lang;
  const ids = {
    monthTotalLabel: t[lang].thisMonth,
    chartTitle: t[lang].chart,
    searchLabel: t[lang].search,
    monthFilterLabel: t[lang].filterMonth
  };
  Object.keys(ids).forEach(id => {
    const el = document.getElementById(id);
    if (el) el.textContent = ids[id];
  });
  const searchInput = document.getElementById('searchInput');
  if (searchInput) searchInput.placeholder = t[lang].searchPlaceholder;
}

// 15. Month Total
function renderMonthTotal() {
  const now = new Date();
  const monthTotal = expenses
 .filter(e => {
      const d = new Date(e.date);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    })
 .reduce((sum, e) => sum + e.amount, 0);

  const totalEl = document.getElementById('monthTotal');
  if (totalEl) totalEl.textContent = monthTotal.toFixed(2) + ' ' + currencies[settings.currency].symbol;
}

// 16. Expenses List
function renderExpensesList(list = expenses) {
  const container = document.getElementById('expensesList');
  if (!container) return;
  container.innerHTML = list.length? '' : `<p class="text-center text-gray-500 py-8">${t[settings.lang].noExpenses}</p>`;

  list.forEach((expense) => {
    const div = document.createElement('div');
    div.className = 'bg-white dark:bg-gray-800 rounded-lg shadow p-4 mb-3 flex justify-between items-center';
    div.innerHTML = `
      <div>
        <p class="font-semibold">${expense.name}</p>
        <p class="text-sm text-gray-500 dark:text-gray-400">${expense.date}</p>
      </div>
      <div class="flex items-center gap-3">
        <span class="font-bold text-lg">${expense.amount.toFixed(2)} ${currencies[settings.currency].symbol}</span>
        <button onclick="window.deleteExpense('${expense.id}')" class="text-red-500 hover:text-red-700">
          <i class="fas fa-trash"></i>
        </button>
      </div>
    `;
    container.appendChild(div);
  });
}

// 17. Delete
window.deleteExpense = async (id) => {
  if (confirm(t[settings.lang].deleteConfirm)) {
    await deleteDoc(doc(db, 'users', currentUser.uid, 'expenses', id));
  }
}

// 18. Chart
function renderChart() {
  const ctx = document.getElementById('expenseChart');
  if (!ctx) return;
  if (window.expenseChart) window.expenseChart.destroy();

  const last7Days = [...Array(7)].map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - i);
    return d.toISOString().split('T')[0];
  }).reverse();

  const data = last7Days.map(date =>
    expenses.filter(e => e.date === date).reduce((sum, e) => sum + e.amount, 0)
  );

  window.expenseChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: last7Days.map(d => d.split('-')[2] + '/' + d.split('-')[1]),
      datasets: [{
        label: t[settings.lang].chart,
        data: data,
        borderColor: 'rgb(59, 130, 246)',
        tension: 0.3
      }]
    },
    options: {
      plugins: { legend: { labels: { color: settings.theme === 'dark'? '#fff' : '#000' } } },
      scales: {
        y: { ticks: { color: settings.theme === 'dark'? '#fff' : '#000' } },
        x: { ticks: { color: settings.theme === 'dark'? '#fff' : '#000' } }
      }
    }
  });
}

// 19. Search + Filter
function setupFilters() {
  const searchInput = document.getElementById('searchInput');
  const monthFilter = document.getElementById('monthFilter');
  if (searchInput &&!searchInput.dataset.listener) {
    searchInput.dataset.listener = 'true';
    searchInput.addEventListener('input', applyFilters);
  }
  if (monthFilter &&!monthFilter.dataset.listener) {
    monthFilter.dataset.listener = 'true';
    monthFilter.addEventListener('change', applyFilters);
  }
}

function applyFilters() {
  const searchTerm = document.getElementById('searchInput').value.toLowerCase();
  const monthValue = document.getElementById('monthFilter').value;
  let filtered = expenses;
  if (searchTerm) filtered = filtered.filter(e => e.name.toLowerCase().includes(searchTerm));
  if (monthValue) filtered = filtered.filter(e => e.date.startsWith(monthValue));
  renderExpensesList(filtered);
}
