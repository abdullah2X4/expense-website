import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut as firebaseSignOut } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import { getFirestore, doc, setDoc, getDoc, updateDoc, collection, addDoc, getDocs, query, where, deleteDoc } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';
import { getAnalytics } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-analytics.js';

const firebaseConfig = {
  apiKey: "AIzaSyBS3FCovS0LmOGgWSIOxoL3kiKe5mjkl1k",
  authDomain: "masarefy-v6.firebaseapp.com",
  projectId: "masarefy-v6",
  storageBucket: "masarefy-v6.firebasestorage.app",
  messagingSenderId: "362855388821",
  appId: "1:362855388821:web:6bc34c415c520f60102d9c",
  measurementId: "G-LNXCG5P1BJ"
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();

const translations = {
  ar: { settings: "⚙️ الإعدادات", name: "الاسم", budget: "الميزانية الشهرية", language: "اللغة", currency: "العملة", theme: "المظهر", cancel: "إلغاء", save: "حفظ", balance: "رصيدك الحالي", budgetTitle: "ميزانية الشهر", spent: "صرفت", income: "+ دخل", expense: "- مصروف", askAI: "اسأل المساعد الذكي", transactions: "السجل", deleteAll: "مسح الكل", chartTitle: "تحليل المصاريف", week: "أسبوع", month: "شهر", year: "سنة", upgrade: "⭐️ رقي حسابك" },
  en: { settings: "⚙️ Settings", name: "Name", budget: "Monthly Budget", language: "Language", currency: "Currency", theme: "Theme", cancel: "Cancel", save: "Save", balance: "Current Balance", budgetTitle: "Monthly Budget", spent: "Spent", income: "+ Income", expense: "- Expense", askAI: "Ask Smart Assistant", transactions: "History", deleteAll: "Clear All", chartTitle: "Expense Analysis", week: "Week", month: "Month", year: "Year", upgrade: "⭐️ Upgrade" },
  fr: { settings: "⚙️ Paramètres", name: "Nom", budget: "Budget Mensuel", language: "Langue", currency: "Devise", theme: "Thème", cancel: "Annuler", save: "Enregistrer", balance: "Solde Actuel", budgetTitle: "Budget Mensuel", spent: "Dépensé", income: "+ Revenu", expense: "- Dépense", askAI: "Assistant IA", transactions: "Historique", deleteAll: "Tout Effacer", chartTitle: "Analyse des Dépenses", week: "Semaine", month: "Mois", year: "Année", upgrade: "⭐️ Mettre à niveau" },
  es: { settings: "⚙️ Ajustes", name: "Nombre", budget: "Presupuesto Mensual", language: "Idioma", currency: "Moneda", theme: "Tema", cancel: "Cancelar", save: "Guardar", balance: "Saldo Actual", budgetTitle: "Presupuesto Mensual", spent: "Gastado", income: "+ Ingreso", expense: "- Gasto", askAI: "Asistente IA", transactions: "Historial", deleteAll: "Borrar Todo", chartTitle: "Análisis de Gastos", week: "Semana", month: "Mes", year: "Año", upgrade: "⭐️ Mejorar" },
  de: { settings: "⚙️ Einstellungen", name: "Name", budget: "Monatsbudget", language: "Sprache", currency: "Währung", theme: "Thema", cancel: "Abbrechen", save: "Speichern", balance: "Aktueller Saldo", budgetTitle: "Monatsbudget", spent: "Ausgegeben", income: "+ Einnahme", expense: "- Ausgabe", askAI: "KI-Assistent", transactions: "Verlauf", deleteAll: "Alles Löschen", chartTitle: "Ausgabenanalyse", week: "Woche", month: "Monat", year: "Jahr", upgrade: "⭐️ Upgrade" }
};
const currencySymbols = { EGP: "ج.م", USD: "$", EUR: "€", SAR: "ر.س", AED: "د.إ" };
let currentUser = null;
let userData = null;
let currentTxType = 'مصروف';

const defaultCategories = [
  { name: 'أكل', icon: '🍔' },
  { name: 'مواصلات', icon: '🚗' },
  { name: 'فواتير', icon: '💡' },
  { name: 'ترفيه', icon: '🎮' },
  { name: 'صحة', icon: '💊' },
  { name: 'تسوق', icon: '🛍️' },
  { name: 'قهوة', icon: '☕️' },
  { name: 'أخرى', icon: '📦' }
];

// PWA Service Worker
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('data:text/javascript;base64,c2VsZi5hZGRFdmVudExpc3RlbmVyKCdpbnN0YWxsJywgZXZlbnQgPT4geyBldmVudC53YWl0VW50aWwoc2VsZi5za2lwV2FpdGluZygpKTsgfSk7IHNlbGYuYWRkRXZlbnRMaXN0ZW5lcignZmV0Y2gnLCBldmVudCA9PiB7IGV2ZW50LnJlc3BvbmRXaXRoKGZldGNoKGV2ZW50LnJlcXVlc3QpKTsgfSk7');
}

// تحويل الإيموجي لآيفون ستايل
function renderEmojis() {
  if (window.twemoji) {
    twemoji.parse(document.body, {
      folder: 'svg',
      ext: '.svg',
      base: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/'
    });
  }
}

// مراقبة حالة تسجيل الدخول
onAuthStateChanged(auth, async (user) => {
  const isLoginPage = window.location.pathname.includes('login.html');
  
  if (user) {
    currentUser = user;
    await loadUserData();
    if (isLoginPage) {
      window.location.href = 'index.html';
    } else {
      const userNameEl = document.getElementById('userName');
      if (userNameEl) userNameEl.innerText = userData.name || user.email;
      updateUI();
    }
  } else {
    if (!isLoginPage && !window.location.pathname.includes('pricing.html')) {
      window.location.href = 'login.html';
    }
  }
  setTimeout(renderEmojis, 100);
});

async function loadUserData() {
  const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
  if (userDoc.exists()) {
    userData = userDoc.data();
  } else {
    userData = {
      email: currentUser.email,
      name: currentUser.displayName || 'مستخدم جديد',
      plan: 'Free',
      expiry: null,
      budget: 5000,
      categories: defaultCategories,
      aiQuestionsToday: 0,
      lastQuestionDate: null,
      language: 'ar',
      currency: 'EGP',
      theme: 'dark',
    };
    await setDoc(doc(db, 'users', currentUser.uid), userData);
  }
  if (!userData.categories) userData.categories = defaultCategories;
 await loadTransactions();
 updateUI();
}

async function loadTransactions() {
  const q = query(collection(db, 'transactions'), where('userId', '==', currentUser.uid));
  const querySnapshot = await getDocs(q);
  userData.transactions = [];
  querySnapshot.forEach((doc) => {
    userData.transactions.push({ id: doc.id, ...doc.data() });
  });
}

// Auth Functions
window.signInEmail = async () => {
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  if (!email || !password) return alert('ادخل الإيميل وكلمة السر');
  try {
    await signInWithEmailAndPassword(auth, email, password);
  } catch (error) {
    alert('خطأ: ' + error.message);
  }
};

window.signUpEmail = async () => {
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  if (!email || !password) return alert('ادخل الإيميل وكلمة السر');
  if (password.length < 6) return alert('كلمة السر لازم 6 حروف على الأقل');
  try {
    await createUserWithEmailAndPassword(auth, email, password);
  } catch (error) {
    alert('خطأ: ' + error.message);
  }
};

window.signInGoogle = async () => {
  try {
    await signInWithPopup(auth, googleProvider);
  } catch (error) {
    alert('خطأ: ' + error.message);
  }
};

window.signOut = async () => {
  if (confirm('متأكد عايز تسجل خروج؟')) {
    await firebaseSignOut(auth);
  }
};

// باسورد الأدمن
let clickCount = 0;
document.getElementById('adminTrigger')?.addEventListener('click', () => {
  clickCount++;
  if (clickCount === 5) {
    let pass = prompt('ادخل كلمة سر الأدمن:');
    if (pass === 'Masarefy@V4_Admin#2026') {
      showAdminPanel();
    } else {
      alert('كلمة السر غلط');
    }
    clickCount = 0;
  }
  setTimeout(() => { clickCount = 0 }, 2000);
});

function showAdminPanel() {
  const email = prompt('إيميل العميل:');
  if (!email) return;
  const plan = prompt('الخطة (Pro/Max):', 'Pro');
  const duration = prompt('المدة (month/year):', 'month');
  if (!plan || !duration) return;
  
  const expiry = new Date();
  if (duration === 'month') expiry.setMonth(expiry.getMonth() + 1);
  else expiry.setFullYear(expiry.getFullYear() + 1);
  
  activateVipForEmail(email, plan, expiry.toISOString());
}

async function activateVipForEmail(email, plan, expiry) {
  const q = query(collection(db, 'users'), where('email', '==', email));
  const querySnapshot = await getDocs(q);
  if (querySnapshot.empty) return alert('الإيميل مش موجود');
  
  querySnapshot.forEach(async (docSnap) => {
    await updateDoc(doc(db, 'users', docSnap.id), {
      plan: plan,
      expiry: expiry
    });
  });
  alert(`تم تفعيل ${plan} للعميل ${email}`);
}

window.updateUI = async () => {
  if (!userData) return;
  
  applyLanguage(userData.language || 'ar');
  applyTheme(userData.theme || 'dark');
  
  const t = translations[userData.language] || translations.ar;
  
  let balance = userData.transactions.reduce((sum, tr) => sum + (tr.type === 'دخل' ? tr.amount : -tr.amount), 0);
  document.getElementById('balance').innerText = formatCurrency(balance);
  
  let totalExpense = userData.transactions.filter(tr => tr.type === 'مصروف').reduce((sum, tr) => sum + tr.amount, 0);
  let budgetPercent = userData.budget > 0 ? (totalExpense / userData.budget * 100) : 0;
  document.getElementById('budgetBar').style.width = Math.min(budgetPercent, 100) + '%';
  document.getElementById('budgetBar').className = `progress-bar h-2.5 rounded-full ${budgetPercent > 90 ? 'bg-red-500' : budgetPercent > 70 ? 'bg-amber-500' : 'bg-emerald-500'}`;
  
  document.getElementById('spentText').innerText = `${t.spent}: ${formatCurrency(totalExpense)}`;
  document.getElementById('budgetText').innerText = `${t.budget}: ${formatCurrency(userData.budget)}`;
  
  document.getElementById('history').innerHTML = userData.transactions.map((tr) => `
    <div class="glass p-4 rounded-2xl flex justify-between items-center animate-slide-right">
      <div class="flex items-center gap-3">
        <span class="text-3xl">${tr.icon || '💰'}</span>
        <div>
          <span class="font-bold">${tr.name || tr.type}</span>
          <span class="text-xs text-slate-400 block">${tr.category || ''} • ${tr.date}</span>
        </div>
      </div>
      <div class="flex items-center gap-3">
        <span class="${tr.type === 'دخل' ? 'text-emerald-400' : 'text-rose-400'} font-bold text-lg">${formatCurrency(tr.amount)}</span>
        <button onclick="deleteTransaction('${tr.id}')" class="bg-red-600 px-3 py-2 rounded-xl text-xs btn-active">🗑️</button>
      </div>
    </div>
  `).reverse().join('');

  const vipBtn = document.getElementById('vipBtn');
  const vipBadge = document.getElementById('vipBadge');
  if (userData.plan !== 'Free' && new Date(userData.expiry) > new Date()) {
    vipBtn.innerText = `⭐️ ${userData.plan}`;
    vipBtn.classList.add('vip-badge', 'text-black');
    vipBadge.classList.remove('hidden');
    vipBadge.innerText = `Plan: ${userData.plan} - Exp: ${new Date(userData.expiry).toLocaleDateString(userData.language)}`;
  } else {
    userData.plan = 'Free';
    vipBtn.innerText = t.upgrade;
    vipBtn.classList.remove('vip-badge', 'text-black');
    vipBadge.classList.add('hidden');
  }

  if (userData.plan === 'Free') {
    let expenseCount = userData.transactions.filter(tr => tr.type === 'مصروف').length;
    document.getElementById('limitText').innerText = `${t.spent}: ${expenseCount}/100`;
  } else {
    document.getElementById('limitText').innerText = '';
  }
  
  setTimeout(renderEmojis, 100);
  
  if (userData.transactions.filter(tr => tr.type === 'مصروف').length > 0) {
    setTimeout(() => updateChart('month'), 500);
  }
};

// Modals
window.showAddModal = (type) => {
  currentTxType = type;
  document.getElementById('modalTitle').innerText = `إضافة ${type}`;
  document.getElementById('txName').value = '';
  document.getElementById('txAmount').value = '';
  
  const select = document.getElementById('txCategory');
  select.innerHTML = '<option value="">اختر الفئة</option>';
  userData.categories.forEach(cat => {
    select.innerHTML += `<option value="${cat.name}">${cat.icon} ${cat.name}</option>`;
  });
  
  document.getElementById('addModal').classList.remove('hidden');
  setTimeout(() => document.getElementById('addModalSheet').classList.add('show'), 10);
};

window.closeAddModal = () => {
  document.getElementById('addModalSheet').classList.remove('show');
  setTimeout(() => document.getElementById('addModal').classList.add('hidden'), 400);
};

window.saveTransaction = async () => {
  if (currentTxType === 'مصروف' && userData.plan === 'Free') {
    let expenseCount = userData.transactions.filter(t => t.type === 'مصروف').length;
    if (expenseCount >= 100) {
      alert('وصلت للحد الأقصى 100 مصروف. رقي حسابك للـ Pro');
      closeAddModal();
      window.location.href = 'pricing.html';
      return;
    }
  }
  
  const name = document.getElementById('txName').value;
  const amount = parseFloat(document.getElementById('txAmount').value);
  const category = document.getElementById('txCategory').value;
  
  if (!name || !amount || amount <= 0) return alert('ادخل الاسم والمبلغ');
  if (currentTxType === 'مصروف' && !category) return alert('اختر الفئة');
  
  const icon = userData.categories.find(c => c.name === category)?.icon || '💰';
  
  const newTx = {
    userId: currentUser.uid,
    type: currentTxType,
    name,
    amount,
    category,
    icon,
    date: new Date().toLocaleDateString('ar-EG'),
    timestamp: new Date().toISOString()
  };
  
  const docRef = await addDoc(collection(db, 'transactions'), newTx);
  userData.transactions.push({ id: docRef.id, ...newTx });
  closeAddModal();
  updateUI();
};

window.showAddCategory = () => {
  document.getElementById('categoryModal').classList.remove('hidden');
  setTimeout(() => document.getElementById('categoryModalSheet').classList.add('show'), 10);
};

window.closeCategoryModal = () => {
  document.getElementById('categoryModalSheet').classList.remove('show');
  setTimeout(() => document.getElementById('categoryModal').classList.add('hidden'), 400);
};

window.saveCategory = async () => {
  const name = document.getElementById('newCategoryName').value;
  const icon = document.getElementById('newCategoryIcon').value;
  if (!name || !icon) return alert('ادخل الاسم والأيقونة');
  
  userData.categories.push({ name, icon });
  await updateDoc(doc(db, 'users', currentUser.uid), { categories: userData.categories });
  
  const select = document.getElementById('txCategory');
  select.innerHTML += `<option value="${name}">${icon} ${name}</option>`;
  select.value = name;
  
  closeCategoryModal();
  renderEmojis();
};

window.deleteTransaction = async (id) => {
  if (confirm('متأكد عايز تمسح المعاملة دي؟')) {
    await deleteDoc(doc(db, 'transactions', id));
    userData.transactions = userData.transactions.filter(t => t.id !== id);
    updateUI();
  }
};

window.clearAll = async () => {
  if (userData.transactions.length === 0) return;
  if (confirm('متأكد عايز تمسح كل السجل؟')) {
    for (let tx of userData.transactions) {
      await deleteDoc(doc(db, 'transactions', tx.id));
    }
    userData.transactions = [];
    updateUI();
  }
};

window.setBudget = async () => {
  let newBudget = parseFloat(prompt('ادخل الميزانية الشهرية:', userData.budget));
  if (!newBudget || newBudget <= 0) return;
  userData.budget = newBudget;
  await updateDoc(doc(db, 'users', currentUser.uid), { budget: newBudget });
  updateUI();
};

window.showSettings = () => {
  document.getElementById('settingsName').value = userData.name;
  document.getElementById('settingsBudget').value = userData.budget;
  document.getElementById('settingsModal').classList.remove('hidden');
  setTimeout(() => document.getElementById('settingsModalSheet').classList.add('show'), 10);
};

window.closeSettings = () => {
  document.getElementById('settingsModalSheet').classList.remove('show');
  setTimeout(() => document.getElementById('settingsModal').classList.add('hidden'), 400);
};

window.saveSettings = async () => {
  userData.name = document.getElementById('settingsName').value;
  userData.budget = parseFloat(document.getElementById('settingsBudget').value) || 0;
  await updateDoc(doc(db, 'users', currentUser.uid), { 
    name: userData.name, 
    budget: userData.budget 
  });
  document.getElementById('userName').innerText = userData.name;
  closeSettings();
  updateUI();
};

window.subscribe = (plan, duration, price) => {
  document.getElementById('planDetails').innerText = `${plan} - ${duration === 'month' ? 'شهر' : 'سنة'} - ${price} ج.م`;
  let msg = `مرحبا، حولت ${price}ج لاشتراك Masarefy ${plan} ${duration}. إيميلي: ${currentUser.email}`;
  document.getElementById('whatsappLink').href = `https://wa.me/201121898023?text=${encodeURIComponent(msg)}`;
  document.getElementById('paymentModal').classList.remove('hidden');
};

window.closePayment = () => document.getElementById('paymentModal').classList.add('hidden');

window.askAI = async () => {
  const today = new Date().toDateString();
  if (userData.lastQuestionDate !== today) {
    userData.aiQuestionsToday = 0;
    userData.lastQuestionDate = today;
    await updateDoc(doc(db, 'users', currentUser.uid), {
      aiQuestionsToday: 0,
      lastQuestionDate: today
    });
  }

  let limit = userData.plan === 'Free' ? 3 : userData.plan === 'Pro' ? 5 : 999;
  if (userData.aiQuestionsToday >= limit) {
    alert(`خلصت أسئلتك اليوم (${limit}). رقي حسابك للمزيد`);
    window.location.href = 'pricing.html';
    return;
  }

  let question = prompt('اسأل المساعد الذكي عن مصاريفك:');
  if (!question) return;
  
  userData.aiQuestionsToday++;
  await updateDoc(doc(db, 'users', currentUser.uid), {
    aiQuestionsToday: userData.aiQuestionsToday
  });
  
  let balance = userData.transactions.reduce((sum, t) => sum + (t.type === 'دخل' ? t.amount : -t.amount), 0);
  let expenses = userData.transactions.filter(t => t.type === 'مصروف');
  let totalExpense = expenses.reduce((sum, t) => sum + t.amount, 0);
  let avgExpense = expenses.length ? (totalExpense / expenses.length) : 0;
  
  let answer = `سؤالك: ${question}\n\n`;
  answer += `📊 تحليل سريع:\n`;
  answer += `رصيدك: ${balance.toFixed(2)} ج.م\n`;
  answer += `إجمالي المصروف: ${totalExpense.toFixed(2)} ج.م\n`;
  answer += `متوسط المصروف: ${avgExpense.toFixed(2)} ج.م\n`;
  answer += `الميزانية: ${userData.budget.toFixed(2)} ج.م | المتبقي: ${(userData.budget - totalExpense).toFixed(2)} ج.م\n\n`;
  
  if (userData.budget > 0 && totalExpense > userData.budget * 0.9) {
    answer += `⚠️ تحذير: قربت تخلص ميزانيتك!\n`;
  } else if (balance < 0) {
    answer += `⚠️ تحذير: رصيدك بالسالب! وقف صرف فوراً\n`;
  } else {
    answer += `✅ وضعك تمام! كمل كده\n`;
  }
  
  if (userData.plan !== 'Max') {
    answer += `\n⭐️ رقي لـ Max عشان تحليل أعمق + AI حقيقي`;
  }
  
  alert(answer);
  updateUI();
};

// تشغيل الإيموجي بعد تحميل الصفحة
document.addEventListener('DOMContentLoaded', renderEmojis);
let expenseChart = null;

window.updateChart = (period = 'month') => {
  const ctx = document.getElementById('expenseChart');
  if (!ctx || !userData) return;
  
  const now = new Date();
  let filtered = userData.transactions.filter(t => t.type === 'مصروف');
  
  if (period === 'week') {
    const weekAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);
    filtered = filtered.filter(t => new Date(t.timestamp) > weekAgo);
  } else if (period === 'month') {
    const monthAgo = new Date(now.getFullYear(), now.getMonth(), 1);
    filtered = filtered.filter(t => new Date(t.timestamp) > monthAgo);
  } else if (period === 'year') {
    const yearAgo = new Date(now.getFullYear(), 0, 1);
    filtered = filtered.filter(t => new Date(t.timestamp) > yearAgo);
  }
  
  const categoryData = {};
  filtered.forEach(t => {
    categoryData[t.category] = (categoryData[t.category] || 0) + t.amount;
  });
  
  const labels = Object.keys(categoryData);
  const data = Object.values(categoryData);
  const colors = ['#06b6d4', '#10b981', '#f59e0b', '#f43f5e', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];
  
  if (expenseChart) expenseChart.destroy();
  
  expenseChart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: labels,
      datasets: [{
        data: data,
        backgroundColor: colors,
        borderWidth: 0,
        hoverOffset: 8
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: { color: '#f1f5f9', font: { family: 'Cairo', size: 11 }, padding: 10 }
        }
      }
    }
  });
  
  document.getElementById('statsCard').classList.remove('hidden');
};

window.exportPDF = async () => {
  if (userData.plan === 'Free') {
    alert('تصدير PDF متاح في خطة Pro و Max فقط ⭐️');
    window.location.href = 'pricing.html';
    return;
  }
  
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  
  doc.setFontSize(20);
  doc.text('Masarefy - Financial Report', 105, 20, { align: 'center' });
  
  doc.setFontSize(12);
  doc.text(`Name: ${userData.name}`, 20, 35);
  doc.text(`Email: ${userData.email}`, 20, 42);
  doc.text(`Date: ${new Date().toLocaleDateString('ar-EG')}`, 20, 49);
  
  let balance = userData.transactions.reduce((sum, t) => sum + (t.type === 'دخل' ? t.amount : -t.amount), 0);
  let totalExpense = userData.transactions.filter(t => t.type === 'مصروف').reduce((sum, t) => sum + t.amount, 0);
  let totalIncome = userData.transactions.filter(t => t.type === 'دخل').reduce((sum, t) => sum + t.amount, 0);
  
  doc.text(`Balance: ${balance.toFixed(2)} EGP`, 20, 60);
  doc.text(`Total Income: ${totalIncome.toFixed(2)} EGP`, 20, 67);
  doc.text(`Total Expense: ${totalExpense.toFixed(2)} EGP`, 20, 74);
  doc.text(`Budget: ${userData.budget.toFixed(2)} EGP`, 20, 81);
  
  doc.save(`Masarefy-Report-${new Date().toISOString().split('T')[0]}.pdf`);
  alert('تم تصدير التقرير بنجاح ✅');
};

// شغل الـ Chart تلقائي لما يبقى فيه معاملات
const originalUpdateUI = window.updateUI;
window.updateUI = async () => {
  await originalUpdateUI();
  if (userData.transactions.filter(t => t.type === 'مصروف').length > 0) {
    setTimeout(() => updateChart('month'), 500);
  }
};
// v7: Settings Functions
window.showSettings = () => {
  document.getElementById('settingsName').value = userData.name;
  document.getElementById('settingsBudget').value = userData.budget;
  document.getElementById('settingsLang').value = userData.language || 'ar';
  document.getElementById('settingsCurrency').value = userData.currency || 'EGP';
  document.getElementById('settingsTheme').value = userData.theme || 'dark';
  document.getElementById('settingsModal').classList.remove('hidden');
  setTimeout(() => document.getElementById('settingsModalSheet').classList.add('show'), 10);
};

window.closeSettings = () => {
  document.getElementById('settingsModalSheet').classList.remove('show');
  setTimeout(() => document.getElementById('settingsModal').classList.add('hidden'), 400);
};

window.saveSettings = async () => {
  userData.name = document.getElementById('settingsName').value;
  userData.budget = parseFloat(document.getElementById('settingsBudget').value) || 0;
  userData.language = document.getElementById('settingsLang').value;
  userData.currency = document.getElementById('settingsCurrency').value;
  userData.theme = document.getElementById('settingsTheme').value;
  
  await updateDoc(doc(db, 'users', currentUser.uid), { 
    name: userData.name, 
    budget: userData.budget,
    language: userData.language,
    currency: userData.currency,
    theme: userData.theme
  });
  
  applyLanguage(userData.language);
  applyTheme(userData.theme);
  document.getElementById('userName').innerText = userData.name;
  closeSettings();
  updateUI();
};

function applyLanguage(lang) {
  const t = translations[lang] || translations.ar;
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (t[key]) el.innerText = t[key];
  });
  document.documentElement.lang = lang;
  document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
}

function applyTheme(theme) {
  if (theme === 'light') {
    document.body.classList.add('light');
  } else {
    document.body.classList.remove('light');
  }
}

function formatCurrency(amount) {
  const symbol = currencySymbols[userData.currency] || 'ج.م';
  return `${amount.toFixed(2)} ${symbol}`;
}

// عدّل userData الافتراضي
// ابحث عن userData = { و ضيف السطور دي جواه:
  language: 'ar',
  currency: 'EGP',
  theme: 'dark',
