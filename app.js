// ===== Masarefy V6 Pro - Full SaaS Version =====
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-auth.js";
import { getFirestore, collection, addDoc, onSnapshot, query, where, orderBy, doc, deleteDoc, updateDoc, getDoc, setDoc, Timestamp } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-storage.js";

const firebaseConfig = {
  apiKey: "AIzaSyBS3FCovS0LmOGgWSIOxoL3kiKe5mjkl1k",
  authDomain: "masarefy-v6.firebaseapp.com",
  projectId: "masarefy-v6",
  storageBucket: "masarefy-v6.firebasestorage.app",
  messagingSenderId: "362855388821",
  appId: "1:362855388821:web:6bc34c415c520f60102d9c"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// ===== i18n Translations =====
const translations = {
  ar: { settings: "الإعدادات", language: "اللغة", currency: "العملة", theme: "المظهر", light: "فاتح", dark: "داكن", auto: "تلقائي", plans: "خطط الاشتراك", free: "مجاني", popular: "الأكثر شعبية", subscribe: "اشترك", annual_offer: "🎉 عرض السنة: 550 ج.م فقط بدلاً من 600ج", subscribe_annual: "اشترك سنوياً", payment_info: "للدفع: حول المبلغ على فودافون/اتصالات/أورانج كاش: 01121898023", ai_assistant: "المساعد الذكي", currency_symbol: "ج.م", total_expenses: "إجمالي المصروفات", total_income: "إجمالي الدخل", balance: "الرصيد الحالي", add_transaction: "إضافة معاملة", expense: "مصروف", income: "دخل", add: "إضافة", recent: "آخر المعاملات", distribution: "توزيع المصروفات", monthly: "المصروفات الشهرية" },
  en: { settings: "Settings", language: "Language", currency: "Currency", theme: "Theme", light: "Light", dark: "Dark", auto: "Auto", plans: "Subscription Plans", free: "Free", popular: "Popular", subscribe: "Subscribe", annual_offer: "🎉 Annual Offer: 550 EGP instead of 600", subscribe_annual: "Subscribe Yearly", payment_info: "Payment: Transfer to Vodafone/Etisalat/Orange Cash: 01121898023", ai_assistant: "AI Assistant", currency_symbol: "EGP", total_expenses: "Total Expenses", total_income: "Total Income", balance: "Balance", add_transaction: "Add Transaction", expense: "Expense", income: "Income", add: "Add", recent: "Recent", distribution: "Distribution", monthly: "Monthly" }
};

// ===== Global State =====
let currentUser = null;
let userPlan = 'free';
let currentLang = localStorage.getItem('lang') || 'ar';
let currentCurrency = localStorage.getItem('currency') || 'EGP';
let transactions = [];
let expenseChart = null;
let editingId = null;
const ADMIN_PASSWORD = 'Masarefy@V6_Admin#2026';
const PAYMENT_NUMBER = '01121898023';

const currencyRates = { EGP: 1, USD: 0.020, EUR: 0.019, SAR: 0.076, AED: 0.074 };
const currencySymbols = { EGP: 'ج.م', USD: '$', EUR: '€', SAR: 'ر.س', AED: 'د.إ' };

// ===== Helper Functions =====
function t(key) { return translations[currentLang][key] || key; }
function formatCurrency(amount) {
  const converted = amount * currencyRates[currentCurrency];
  return converted.toFixed(2) + ' ' + currencySymbols[currentCurrency];
}
function setLang(lang) {
  currentLang = lang;
  localStorage.setItem('lang', lang);
  document.getElementById('htmlRoot').lang = lang;
  document.getElementById('htmlRoot').dir = lang === 'ar'? 'rtl' : 'ltr';
  document.querySelectorAll('[data-i18n]').forEach(el => {
    el.textContent = t(el.dataset.i18n);
  });
  updateUI();
}

// ===== Login Page =====
if (window.location.pathname.includes('login')) {
  document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('loginBtn')?.addEventListener('click', async () => {
      try {
        await signInWithEmailAndPassword(auth, document.getElementById('email').value, document.getElementById('password').value);
        window.location.href = 'index.html';
      } catch (error) { alert('Error: ' + error.code); }
    });
    document.getElementById('googleBtn')?.addEventListener('click', async () => {
      try {
        await signInWithPopup(auth, new GoogleAuthProvider());
        window.location.href = 'index.html';
      } catch (error) { alert('Error: ' + error.code); }
    });
  });
  onAuthStateChanged(auth, user => { if (user) window.location.href = 'index.html'; });
}

// ===== Main Dashboard =====
if (window.location.pathname.includes('index') || window.location.pathname === '/') {
  document.addEventListener('DOMContentLoaded', () => {
    setLang(currentLang);
    document.getElementById('langSelect').value = currentLang;
    document.getElementById('currencySelect').value = currentCurrency;
    
    document.getElementById('langSelect').addEventListener('change', e => setLang(e.target.value));
    document.getElementById('currencySelect').addEventListener('change', e => {
      currentCurrency = e.target.value;
      localStorage.setItem('currency', currentCurrency);
      updateUI();
    });
    
    document.getElementById('logoutBtn').addEventListener('click', () => signOut(auth).then(() => window.location.href = 'login.html'));
    document.getElementById('settingsBtn').addEventListener('click', () => document.getElementById('settingsModal').classList.remove('hidden'));
    document.getElementById('aiBtn').addEventListener('click', openAI);
    
    // Theme
    if (localStorage.getItem('theme') === 'dark') document.documentElement.classList.add('dark');
  });

  onAuthStateChanged(auth, async (user) => {
    if (!user) return window.location.href = 'login.html';
    currentUser = user;
    document.getElementById('userEmail').textContent = user.email;
    
    // Get user plan
    const userDoc = await getDoc(doc(db, 'users', user.uid));
    if (userDoc.exists()) {
      userPlan = userDoc.data().plan || 'free';
    } else {
      await setDoc(doc(db, 'users', user.uid), { plan: 'free', createdAt: Timestamp.now() });
    }
    updatePlanBadge();
    initDashboard(user);
  });

  function updatePlanBadge() {
    const badge = document.getElementById('planBadge');
    if (userPlan === 'pro') badge.innerHTML = '<span class="pro-badge text-white px-2 py-0.5 rounded-full">PRO</span>';
    else if (userPlan === 'max') badge.innerHTML = '<span class="max-badge text-white px-2 py-0.5 rounded-full">MAX</span>';
    else badge.innerHTML = '';
  }

  function initDashboard(user) {
    const addBtn = document.getElementById("addBtn");
    
    // Check transaction limit for free plan
    addBtn?.addEventListener("click", async () => {
      if (userPlan === 'free' && transactions.length >= 50) {
        return alert(t('free') + ' plan: 50 transactions/month limit. Upgrade to Pro!');
      }
      
      const file = document.getElementById('invoiceFile').files[0];
      let invoiceUrl = '';
      
      if (file && userPlan!== 'free') {
        const storageRef = ref(storage, `invoices/${user.uid}/${Date.now()}_${file.name}`);
        await uploadBytes(storageRef, file);
        invoiceUrl = await getDownloadURL(storageRef);
      }
      
      const data = {
        userId: user.uid,
        type: document.getElementById("type").value,
        amount: parseFloat(document.getElementById("amount").value),
        category: document.getElementById("category").value,
        note: document.getElementById("note").value.trim(),
        invoiceUrl,
        createdAt: Timestamp.now()
      };

      if (!data.amount || data.amount <= 0) return alert("Invalid amount");

      try {
        if (editingId) {
          await updateDoc(doc(db, "transactions", editingId), data);
          editingId = null;
        } else {
          await addDoc(collection(db, "transactions"), data);
        }
        document.getElementById("amount").value = "";
        document.getElementById("note").value = "";
        document.getElementById("invoiceFile").value = "";
      } catch (error) {
        alert("Error: " + error.message);
      }
    });

    const q = query(collection(db, "transactions"), where("userId", "==", user.uid), orderBy("createdAt", "desc"));
    onSnapshot(q, (snapshot) => {
      transactions = snapshot.docs.map(doc => ({ id: doc.id,...doc.data() }));
      updateUI();
    });
  }

  function updateUI() {
    let totalIncome = 0, totalExpenses = 0;
    const categoryData = {};

    transactions.forEach(t => {
      if (t.type === "income") totalIncome += t.amount;
      else {
        totalExpenses += t.amount;
        categoryData[t.category] = (categoryData[t.category] || 0) + t.amount;
      }
    });

    const balance = totalIncome - totalExpenses;
    document.getElementById("totalIncome").textContent = formatCurrency(totalIncome);
    document.getElementById("totalExpenses").textContent = formatCurrency(totalExpenses);
    document.getElementById("balance").textContent = formatCurrency(balance);

    document.getElementById("transactionsList").innerHTML = transactions.length === 0 
     ? '<div class="text-center text-gray-500 py-8"><i class="fas fa-inbox text-4xl mb-2"></i><p>No transactions</p></div>'
      : transactions.slice(0, 20).map(t => `
        <div class="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg animate-slide-up">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 ${t.type === "income"? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"} rounded-full flex items-center justify-center">
              <i class="fas ${t.type === "income"? "fa-arrow-up" : "fa-arrow-down"}"></i>
            </div>
            <div>
              <p class="font-semibold">${t.category}</p>
              <p class="text-sm text-gray-500">${t.note || ""} - ${t.createdAt.toDate().toLocaleDateString()}</p>
              ${t.invoiceUrl? `<a href="${t.invoiceUrl}" target="_blank" class="text-xs text-blue-500"><i class="fas fa-receipt"></i> Invoice</a>` : ''}
            </div>
          </div>
          <div class="flex items-center gap-2">
            <p class="font-bold ${t.type === "income"? "text-green-600" : "text-red-600"}">${t.type === "income"? "+" : "-"}${formatCurrency(t.amount)}</p>
            <button onclick="editTransaction('${t.id}')" class="text-blue-500"><i class="fas fa-edit"></i></button>
            <button onclick="deleteTransaction('${t.id}')" class="text-red-500"><i class="fas fa-trash"></i></button>
          </div>
        </div>
      `).join("");

    updateChart(categoryData);
  }

  window.editTransaction = (id) => {
    const t = transactions.find(x => x.id === id);
    if (!t) return;
    editingId = id;
    document.getElementById("type").value = t.type;
    document.getElementById("amount").value = t.amount;
    document.getElementById("category").value = t.category;
    document.getElementById("note").value = t.note;
    window.scrollTo({top: 0, behavior: 'smooth'});
  };

  window.deleteTransaction = async (id) => {
    if (confirm("Delete?")) await deleteDoc(doc(db, "transactions", id));
  };

  function updateChart(data) {
    const ctx = document.getElementById("expenseChart");
    if (!ctx) return;
    if (expenseChart) expenseChart.destroy();
    expenseChart = new Chart(ctx, {
      type: "doughnut",
      data: { labels: Object.keys(data), datasets: [{ data: Object.values(data), backgroundColor: ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4"] }] },
      options: { responsive: true, plugins: { legend: { position: "bottom" } } }
    });
  }
}

// ===== Settings Functions =====
window.closeSettings = () => document.getElementById('settingsModal').classList.add('hidden');
window.setTheme = (theme) => {
  if (theme === 'dark') document.documentElement.classList.add('dark');
  else if (theme === 'light') document.documentElement.classList.remove('dark');
  else document.documentElement.classList.toggle('dark', window.matchMedia('(prefers-color-scheme: dark)').matches);
  localStorage.setItem('theme', theme);
};

window.subscribePlan = (plan, duration) => {
  alert(`للاشتراك في ${plan} ${duration}: حول ${duration === 'yearly'? '550' : plan === 'pro'? '25' : '50'} ج.م على ${PAYMENT_NUMBER} وسيتم التفعيل خلال 24 ساعة`);
};

// ===== Admin Activation =====
let adminClicks = 0;
window.showAdminPanel = () => {
  adminClicks++;
  if (adminClicks >= 5) {
    const pass = prompt('Admin Password:');
    if (pass === ADMIN_PASSWORD) {
      const transId = prompt('رقم عملية الدفع:');
      const email = prompt('إيميل العميل:');
      const plan = prompt('الخطة (pro/max):');
      const duration = prompt('المدة (monthly/yearly):');
      if (transId && email && plan) {
        activateSubscription(email, plan, duration, transId);
      }
    }
    adminClicks = 0;
  }
};

async function activateSubscription(email, plan, duration, transId) {
  const usersRef = collection(db, 'users');
  const q = query(usersRef, where('email', '==', email));
  const snapshot = await getDocs(q);
  if (!snapshot.empty) {
    const userDoc = snapshot.docs[0];
    const expiry = new Date();
    if (duration === 'yearly') expiry.setFullYear(expiry.getFullYear() + 1);
    else expiry.setMonth(expiry.getMonth() + 1);
    
    await updateDoc(doc(db, 'users', userDoc.id), {
      plan,
      planExpiry: Timestamp.fromDate(expiry),
      transId,
      activatedBy: currentUser.email,
      activatedAt: Timestamp.now()
    });
    alert(`تم تفعيل ${plan} للعميل ${email} حتى ${expiry.toLocaleDateString()}`);
  } else {
    alert('العميل غير موجود');
  }
}

// ===== AI Assistant =====
window.openAI = () => {
  if (userPlan === 'free') return alert('AI متاح في Pro و Max فقط');
  document.getElementById('aiModal').classList.remove('hidden');
  document.getElementById('aiBadge').textContent = userPlan === 'max'? 'GPT-4' : 'Basic';
  document.getElementById('aiBadge').className = userPlan === 'max'? 'max-badge px-2 py-1' : 'pro-badge px-2 py-1';
};

window.closeAI = () => document.getElementById('aiModal').classList.add('hidden');

window.askAI = async () => {
  const input = document.getElementById('aiInput').value;
  if (!input) return;
  
  const chat = document.getElementById('aiChat');
  chat.innerHTML += `<div class="text-right"><div class="inline-block bg-blue-500 text-white px-4 py-2 rounded-lg">${input}</div></div>`;
  document.getElementById('aiInput').value = '';
  
  // Simulate AI response - في النسخة الحقيقية هتستخدم Gemini API
  const totalExp = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
  const avgExp = totalExp / transactions.length || 0;
  const response = userPlan === 'max' 
   ? `تحليل GPT-4: متوسط مصروفك ${formatCurrency(avgExp)}. أنصحك تقلل من فئة ${Object.entries(transactions.reduce((acc, t) => { if(t.type==='expense') acc[t.category]=(acc[t.category]||0)+t.amount; return acc; }, {})).sort((a,b)=>b[1]-a[1])[0]?.[0]} لتوفير 20%`
    : `تحليل أساسي: إجمالي مصاريفك ${formatCurrency(totalExp)}. حاول تحدد ميزانية شهرية.`;
  
  setTimeout(() => {
    chat.innerHTML += `<div class="text-left"><div class="inline-block bg-gray-200 dark:bg-gray-700 px-4 py-2 rounded-lg">${response}</div></div>`;
    chat.scrollTop = chat.scrollHeight;
  }, 1000);
};
