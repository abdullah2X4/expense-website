// ===== Masarefy V7.0 Pro - Full Working Version =====
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-auth.js";
import { getFirestore, collection, addDoc, onSnapshot, query, where, orderBy, doc, deleteDoc, updateDoc, getDoc, setDoc, getDocs, Timestamp } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js";
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

// ===== Global State =====
let currentUser = null;
let userPlan = 'free';
let userPlanExpiry = null;
let currentLang = localStorage.getItem('lang') || 'ar';
let currentCurrency = localStorage.getItem('currency') || 'EGP';
let transactions = [];
let expenseChart = null;
let monthlyChart = null;
let editingId = null;
let selectedMonth = new Date().toISOString().slice(0, 7);
let monthlyBudget = 0;
const ADMIN_PASSWORD = 'Masarefy@V6_Admin#2026';
let adminClicks = 0;
let aiUsageToday = 0;

const currencyRates = { EGP: 1, USD: 0.020, EUR: 0.019, SAR: 0.076, AED: 0.074 };
const currencySymbols = { EGP: 'ج.م', USD: '$', EUR: '€', SAR: 'ر.س', AED: 'د.إ' };

const translations = {
  ar: {
    app_name: "Masarefy", settings: "الإعدادات", language: "اللغة", currency: "العملة", theme: "المظهر", light: "فاتح", dark: "داكن",
    monthly_budget: "الميزانية الشهرية", save: "حفظ", logout: "خروج", upgrade: "ترقية", upgrade_to_pro: "ترقية لـ Pro", upgrade_to_max: "ترقية لـ Max",
    total_expenses: "إجمالي المصروفات", total_income: "إجمالي الدخل", balance: "الرصيد", month_total: "مصاريف الشهر",
    add_transaction: "إضافة معاملة", expense: "مصروف", income: "دخل", add: "إضافة", recent: "آخر المعاملات",
    distribution: "توزيع المصروفات", monthly: "المصروفات الشهرية", reset: "إعادة", invoice: "فاتورة",
    ai_assistant: "المساعد الذكي", ai_welcome: "اسألني أي حاجة عن مصاريفك!", ai_limit: "المتبقي اليوم:",
    plans: "خطط الاشتراك", free: "مجاني", popular: "الأكثر شعبية", current_plan: "خطتك الحالية", subscribe: "اشترك",
    transactions_limit: "معاملة", ai_3: "3 أسئلة AI/يوم", ai_5: "5 أسئلة AI/يوم", ai_unlimited: "AI غير محدود",
    no_export: "بدون تصدير", unlimited: "غير محدود", export: "تصدير Excel", invoices: "رفع فواتير",
    all_pro: "كل Pro", predictive: "تحليل تنبؤي", priority: "دعم أولوية", currency_symbol: "ج.م"
  },
  en: {
    app_name: "Masarefy", settings: "Settings", language: "Language", currency: "Currency", theme: "Theme", light: "Light", dark: "Dark",
    monthly_budget: "Monthly Budget", save: "Save", logout: "Logout", upgrade: "Upgrade", upgrade_to_pro: "Upgrade to Pro", upgrade_to_max: "Upgrade to Max",
    total_expenses: "Total Expenses", total_income: "Total Income", balance: "Balance", month_total: "Month Total",
    add_transaction: "Add Transaction", expense: "Expense", income: "Income", add: "Add", recent: "Recent",
    distribution: "Distribution", monthly: "Monthly", reset: "Reset", invoice: "Invoice",
    ai_assistant: "AI Assistant", ai_welcome: "Ask me anything about your expenses!", ai_limit: "Left today:",
    plans: "Subscription Plans", free: "Free", popular: "Most Popular", current_plan: "Current Plan", subscribe: "Subscribe",
    transactions_limit: "transactions", ai_3: "3 AI questions/day", ai_5: "5 AI questions/day", ai_unlimited: "Unlimited AI",
    no_export: "No export", unlimited: "Unlimited", export: "Export Excel", invoices: "Upload invoices",
    all_pro: "All Pro", predictive: "Predictive analysis", priority: "Priority support", currency_symbol: "EGP"
  },
  fr: {
    app_name: "Masarefy", settings: "Paramètres", language: "Langue", currency: "Devise", theme: "Thème", light: "Clair", dark: "Sombre",
    monthly_budget: "Budget Mensuel", save: "Enregistrer", logout: "Déconnexion", upgrade: "Mettre à niveau", upgrade_to_pro: "Passer à Pro", upgrade_to_max: "Passer à Max",
    total_expenses: "Dépenses Totales", total_income: "Revenus Totaux", balance: "Solde", month_total: "Total du Mois",
    add_transaction: "Ajouter Transaction", expense: "Dépense", income: "Revenu", add: "Ajouter", recent: "Récent",
    distribution: "Distribution", monthly: "Mensuel", reset: "Réinitialiser", invoice: "Facture",
    ai_assistant: "Assistant IA", ai_welcome: "Demandez-moi n'importe quoi!", ai_limit: "Restant:",
    currency_symbol: "€"
  },
  de: {
    app_name: "Masarefy", settings: "Einstellungen", language: "Sprache", currency: "Währung", theme: "Thema", light: "Hell", dark: "Dunkel",
    monthly_budget: "Monatliches Budget", save: "Speichern", logout: "Abmelden", upgrade: "Upgrade", upgrade_to_pro: "Auf Pro upgraden", upgrade_to_max: "Auf Max upgraden",
    total_expenses: "Gesamtausgaben", total_income: "Gesamteinkommen", balance: "Saldo", month_total: "Monatssumme",
    add_transaction: "Transaktion hinzufügen", expense: "Ausgabe", income: "Einkommen", add: "Hinzufügen", recent: "Neueste",
    distribution: "Verteilung", monthly: "Monatlich", reset: "Zurücksetzen", invoice: "Rechnung",
    ai_assistant: "KI-Assistent", ai_welcome: "Frag mich alles!", ai_limit: "Übrig:",
    currency_symbol: "€"
  },
  es: {
    app_name: "Masarefy", settings: "Configuración", language: "Idioma", currency: "Moneda", theme: "Tema", light: "Claro", dark: "Oscuro",
    monthly_budget: "Presupuesto Mensual", save: "Guardar", logout: "Cerrar sesión", upgrade: "Actualizar", upgrade_to_pro: "Actualizar a Pro", upgrade_to_max: "Actualizar a Max",
    total_expenses: "Gastos Totales", total_income: "Ingresos Totales", balance: "Saldo", month_total: "Total del Mes",
    add_transaction: "Agregar Transacción", expense: "Gasto", income: "Ingreso", add: "Agregar", recent: "Reciente",
    distribution: "Distribución", monthly: "Mensual", reset: "Restablecer", invoice: "Factura",
    ai_assistant: "Asistente IA", ai_welcome: "¡Pregúntame lo que sea!", ai_limit: "Restante:",
    currency_symbol: "€"
  }
};

function t(key) {
  return translations[currentLang]?.[key] || translations['ar'][key] || key;
}

function applyTranslations() {
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    el.textContent = t(key);
  });
  document.getElementById('htmlRoot').lang = currentLang;
  document.getElementById('htmlRoot').dir = currentLang === 'ar'? 'rtl' : 'ltr';
}

// ===== Helpers =====
function formatCurrency(amount) {
  const converted = amount * currencyRates[currentCurrency];
  return converted.toFixed(2) + ' ' + currencySymbols[currentCurrency];
}

function showModal(id) {
  document.getElementById(id).classList.remove('hidden');
}

function hideModal(id) {
  document.getElementById(id).classList.add('hidden');
}

function setTheme(theme) {
  if (theme === 'dark') document.documentElement.classList.add('dark');
  else document.documentElement.classList.remove('dark');
  localStorage.setItem('theme', theme);
}

// ===== Login Page =====
if (window.location.pathname.includes('login')) {
  document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('loginBtn')?.addEventListener('click', async () => {
      try {
        await signInWithEmailAndPassword(auth, document.getElementById('email').value, document.getElementById('password').value);
        window.location.href = 'index.html';
      } catch (error) {
        alert('خطأ: ' + error.code);
      }
    });

    document.getElementById('googleBtn')?.addEventListener('click', async () => {
      try {
        await signInWithPopup(auth, new GoogleAuthProvider());
        window.location.href = 'index.html';
      } catch (error) {
        alert('خطأ: ' + error.code);
      }
    });
  });

  onAuthStateChanged(auth, user => {
    if (user) window.location.href = 'index.html';
  });
}

// ===== Main Dashboard =====
if (window.location.pathname.includes('index') || window.location.pathname === '/' || window.location.pathname.endsWith('/expense-website/') || window.location.pathname.endsWith('/expense-website/index.html')) {

  document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM Loaded - Setting up event listeners');
    applyTranslations();

    // Initialize
    document.getElementById('monthFilter').value = selectedMonth;
    if (localStorage.getItem('theme') === 'dark') document.documentElement.classList.add('dark');

    // All Event Listeners
    document.getElementById('langSelect').value = currentLang;
    document.getElementById('currencySelect').value = currentCurrency;

    document.getElementById('langSelect').addEventListener('change', e => {
      currentLang = e.target.value;
      localStorage.setItem('lang', currentLang);
      applyTranslations();
      updateUI();
    });

    document.getElementById('currencySelect').addEventListener('change', e => {
      currentCurrency = e.target.value;
      localStorage.setItem('currency', currentCurrency);
      updateUI();
    });

    document.getElementById('monthFilter').addEventListener('change', e => {
      selectedMonth = e.target.value;
      updateUI();
    });

    document.getElementById('clearFilterBtn').addEventListener('click', () => {
      selectedMonth = new Date().toISOString().slice(0, 7);
      document.getElementById('monthFilter').value = selectedMonth;
      updateUI();
    });

    document.getElementById('logoutBtn').addEventListener('click', () => signOut(auth).then(() => window.location.href = 'login.html'));
    document.getElementById('settingsBtn').addEventListener('click', () => showModal('settingsModal'));
    document.getElementById('closeSettingsBtn').addEventListener('click', () => hideModal('settingsModal'));
    document.getElementById('budgetBtn').addEventListener('click', () => showModal('budgetModal'));
    document.getElementById('closeBudgetBtn').addEventListener('click', () => hideModal('budgetModal'));
    document.getElementById('aiBtn').addEventListener('click', openAI);
    document.getElementById('closeAiBtn').addEventListener('click', () => hideModal('aiModal'));
    document.getElementById('sendAiBtn').addEventListener('click', askAI);
    document.getElementById('saveBudgetBtn').addEventListener('click', saveBudget);
    document.getElementById('lightThemeBtn').addEventListener('click', () => setTheme('light'));
    document.getElementById('darkThemeBtn').addEventListener('click', () => setTheme('dark'));
    document.getElementById('adminTriggerBtn').addEventListener('click', handleAdminClick);

    document.getElementById('aiInput').addEventListener('keypress', e => {
      if (e.key === 'Enter') askAI();
    });
  });

  onAuthStateChanged(auth, async (user) => {
    if (!user) return window.location.href = 'login.html';
    currentUser = user;
    document.getElementById('userEmail').textContent = user.email;

    // Get user data
    const userDoc = await getDoc(doc(db, 'users', user.uid));
    if (userDoc.exists()) {
      const data = userDoc.data();
      userPlan = data.plan || 'free';
      userPlanExpiry = data.planExpiry?.toDate();
      monthlyBudget = data.monthlyBudget || 0;
      aiUsageToday = data.aiUsageToday || 0;
      document.getElementById('monthlyBudgetInput').value = monthlyBudget;

      // Check if plan expired
      if (userPlanExpiry && new Date() > userPlanExpiry) {
        await updateDoc(doc(db, 'users', user.uid), { plan: 'free', planExpiry: null });
        userPlan = 'free';
        alert('⚠️ انتهى اشتراكك! تم تحويلك للخطة المجانية');
      }

      // Reset AI usage if new day
      const today = new Date().toISOString().split('T')[0];
      if (data.aiUsageDate!== today) {
        await updateDoc(doc(db, 'users', user.uid), { aiUsageToday: 0, aiUsageDate: today });
        aiUsageToday = 0;
      }
    } else {
      await setDoc(doc(db, 'users', user.uid), {
        email: user.email,
        plan: 'free',
        monthlyBudget: 0,
        aiUsageToday: 0,
        aiUsageDate: new Date().toISOString().split('T')[0],
        createdAt: Timestamp.now()
      });
    }

    updatePlanBadge();
    updateUpgradeButton();
    updatePlanExpiryWarning();
    updateAiLimitDisplay();
    initDashboard(user);
  });

  function updatePlanBadge() {
    const badge = document.getElementById('planBadge');
    if (userPlan === 'pro') badge.innerHTML = '<span class="pro-gradient text-white px-2 py-0.5 rounded-full text-xs font-bold">PRO</span>';
    else if (userPlan === 'max') badge.innerHTML = '<span class="max-gradient text-white px-2 py-0.5 rounded-full text-xs font-bold">MAX</span>';
    else badge.innerHTML = '';
  }

  function updateUpgradeButton() {
    const upgradeBtn = document.getElementById("upgradeBtn");
    if (!upgradeBtn) return;

    if (userPlan === "free") {
      upgradeBtn.classList.remove("hidden");
      upgradeBtn.onclick = () => window.location.href = 'pricing.html';
      upgradeBtn.innerHTML = `<span class="emoji">👑</span> <span class="hidden md:inline">${t('upgrade_to_pro')}</span>`;
    } else if (userPlan === "pro") {
      upgradeBtn.classList.remove("hidden");
      upgradeBtn.innerHTML = `<span class="emoji">⭐</span> <span class="hidden md:inline">${t('upgrade_to_max')}</span>`;
      upgradeBtn.onclick = () => window.location.href = 'pricing.html';
    } else {
      upgradeBtn.classList.add("hidden");
    }
  }

  function updatePlanExpiryWarning() {
    const warning = document.getElementById('planExpiryWarning');
    if (!userPlanExpiry || userPlan === 'free') {
      warning.innerHTML = '';
      return;
    }

    const daysLeft = Math.ceil((userPlanExpiry - new Date()) / (1000 * 60 * 60 * 24));
    if (daysLeft <= 3) {
      warning.innerHTML = `<div class="bg-orange-100 dark:bg-orange-900/30 border-2 border-orange-500 text-orange-800 dark:text-orange-200 p-4 rounded-2xl animate-scale-in"><span class="emoji text-2xl">⏰</span> <strong>تنبيه:</strong> اشتراكك ينتهي خلال ${daysLeft} أيام</div>`;
    }
  }

  function updateAiLimitDisplay() {
    const limit = userPlan === 'free'? 3 : userPlan === 'pro'? 5 : '∞';
    const remaining = userPlan === 'max'? '∞' : limit - aiUsageToday;
    document.getElementById('aiLimitText').textContent = remaining;
  }

  function initDashboard(user) {
    const addBtn = document.getElementById("addBtn");

    addBtn?.addEventListener("click", async () => {
      console.log('Add button clicked');

      // Check limit for free plan
      if (userPlan === 'free' && transactions.length >= 50) {
        alert('وصلت للحد الأقصى 50 معاملة. رقي حسابك لـ Pro! 💎');
        window.location.href = 'pricing.html';
        return;
      }

      const amount = parseFloat(document.getElementById("amount").value);
      if (!amount || amount <= 0) {
        alert('اكتب مبلغ صحيح ❌');
        return;
      }

      addBtn.disabled = true;
      addBtn.innerHTML = '<span class="emoji">⏳</span> جاري الإضافة...';

      try {
        const file = document.getElementById('invoiceFile').files[0];
        let invoiceUrl = '';

        if (file && userPlan!== 'free') {
          const storageRef = ref(storage, `invoices/${user.uid}/${Date.now()}_${file.name}`);
          await uploadBytes(storageRef, file);
          invoiceUrl = await getDownloadURL(storageRef);
        }

        const categoryText = document.getElementById("category").value;
        const category = categoryText.replace(/🍔|🚗|📱|🎮|💊|💼|🛍️|📚|📌/g, '').trim();

        const data = {
          userId: user.uid,
          type: document.getElementById("type").value,
          amount: amount,
          category: category,
          note: document.getElementById("note").value.trim(),
          invoiceUrl,
          createdAt: Timestamp.now()
        };

        console.log('Adding transaction:', data);

        if (editingId) {
          await updateDoc(doc(db, "transactions", editingId), data);
          editingId = null;
        } else {
          await addDoc(collection(db, "transactions"), data);
        }

        // Clear form
        document.getElementById("amount").value = "";
        document.getElementById("note").value = "";
        document.getElementById("invoiceFile").value = "";

        addBtn.innerHTML = '<span class="emoji">✅</span> تم!';
        setTimeout(() => {
          addBtn.innerHTML = '<span class="emoji">✨</span> ' + t('add');
        }, 2000);

        console.log('Transaction added successfully');

      } catch (error) {
        console.error('Error adding transaction:', error);
        alert("خطأ: " + error.message);
        addBtn.innerHTML = '<span class="emoji">✨</span> ' + t('add');
      } finally {
        addBtn.disabled = false;
      }
    });

    // Load transactions with real-time sync
    const q = query(
      collection(db, "transactions"),
      where("userId", "==", user.uid),
      orderBy("createdAt", "desc")
    );

    onSnapshot(q, (snapshot) => {
      console.log('Transactions loaded:', snapshot.docs.length);
      transactions = snapshot.docs.map(doc => ({ id: doc.id,...doc.data() }));
      updateUI();
      checkBudgetWarning();
    }, (error) => {
      console.error('Error loading transactions:', error);
    });
  }

  function updateUI() {
    let totalIncome = 0, totalExpenses = 0, monthExpenses = 0;
    const categoryData = {};
    const monthlyData = {};

    transactions.forEach(t => {
      const date = t.createdAt.toDate();
      const monthKey = date.toLocaleDateString('ar-EG', { year: 'numeric', month: 'long' });

      if (t.type === "income") {
        totalIncome += t.amount;
      } else {
        totalExpenses += t.amount;
        categoryData[t.category] = (categoryData[t.category] || 0) + t.amount;

        if (date.toISOString().slice(0, 7) === selectedMonth) {
          monthExpenses += t.amount;
        }
      }

      monthlyData[monthKey] = (monthlyData[monthKey] || 0) + (t.type === "expense"? t.amount : -t.amount);
    });

    const balance = totalIncome - totalExpenses;

    document.getElementById("totalIncome").textContent = formatCurrency(totalIncome);
    document.getElementById("totalExpenses").textContent = formatCurrency(totalExpenses);
    document.getElementById("balance").textContent = formatCurrency(balance);
    document.getElementById("monthTotal").textContent = formatCurrency(monthExpenses);

    // Filter by month for list
    const monthTransactions = transactions.filter(t => {
      const date = t.createdAt.toDate();
      return date.toISOString().slice(0, 7) === selectedMonth;
    });

    document.getElementById("transactionsList").innerHTML = monthTransactions.length === 0
? '<div class="text-center text-gray-500 py-8"><span class="emoji text-6xl">📭</span><p class="mt-4">لا توجد معاملات في هذا الشهر</p></div>'
      : monthTransactions.map(t => `
        <div class="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-xl animate-slide-up">
          <div class="flex items-center gap-3">
            <div class="w-12 h-12 ${t.type === "income"? "bg-green-100 dark:bg-green-900/30 text-green-600" : "bg-red-100 dark:bg-red-900/30 text-red-600"} rounded-xl flex items-center justify-center">
              <i class="fas ${t.type === "income"? "fa-arrow-up" : "fa-arrow-down"} text-xl"></i>
            </div>
            <div>
              <p class="font-bold">${t.category}</p>
              <p class="text-sm text-gray-500">${t.note || "بدون ملاحظة"} • ${t.createdAt.toDate().toLocaleDateString('ar-EG')}</p>
              ${t.invoiceUrl? `<a href="${t.invoiceUrl}" target="_blank" class="text-xs text-blue-500"><span class="emoji">🧾</span> فاتورة</a>` : ''}
            </div>
          <div class="flex items-center gap-2">
            <p class="font-black text-lg ${t.type === "income"? "text-green-600" : "text-red-600"}">${t.type === "income"? "+" : "-"}${formatCurrency(t.amount)}</p>
            <button onclick="editTransaction('${t.id}')" class="text-blue-500 hover:text-blue-700 p-2"><i class="fas fa-edit"></i></button>
            <button onclick="deleteTransaction('${t.id}')" class="text-red-500 hover:text-red-700 p-2"><i class="fas fa-trash"></i></button>
          </div>
        </div>
      `).join("");

    updateChart(categoryData);
    updateMonthlyChart(monthlyData);
    updateCurrentPlanDisplay();
  }

  function updateCurrentPlanDisplay() {
    const planDiv = document.getElementById('currentPlan');
    const limits = {
      free: { trans: '50', ai: '3/يوم' },
      pro: { trans: 'غير محدود', ai: '5/يوم' },
      max: { trans: 'غير محدود', ai: 'غير محدود' }
    };

    const planNames = { free: 'مجاني', pro: 'Pro', max: 'Max' };
    const expiryText = userPlanExpiry? `<br><small>ينتهي: ${userPlanExpiry.toLocaleDateString('ar-EG')}</small>` : '';

    planDiv.innerHTML = `
      <strong>خطتك الحالية: ${planNames[userPlan]}</strong>${expiryText}<br>
      <small>المعاملات: ${limits[userPlan].trans} | AI: ${limits[userPlan].ai}</small>
    `;

    // Update plan buttons
    const freeBtn = document.getElementById('freePlanBtn');
    const proBtn = document.getElementById('proPlanBtn');
    const maxBtn = document.getElementById('maxPlanBtn');

    if (userPlan === 'free') {
      freeBtn.className = 'w-full bg-gray-300 text-gray-600 py-2 rounded-xl cursor-not-allowed';
      freeBtn.textContent = t('current_plan');
    } else if (userPlan === 'pro') {
      proBtn.className = 'w-full bg-gray-300 text-gray-600 py-2 rounded-xl cursor-not-allowed';
      proBtn.textContent = t('current_plan');
    } else if (userPlan === 'max') {
      maxBtn.className = 'w-full bg-gray-300 text-gray-600 py-2 rounded-xl cursor-not-allowed';
      maxBtn.textContent = t('current_plan');
    }
  }

  window.editTransaction = (id) => {
    const t = transactions.find(x => x.id === id);
    if (!t) return;
    editingId = id;
    document.getElementById("type").value = t.type;
    document.getElementById("amount").value = t.amount;
    document.getElementById("category").value = t.category;
    document.getElementById("note").value = t.note;
    document.getElementById("addBtn").innerHTML = '<span class="emoji">💾</span> تحديث';
    window.scrollTo({top: 0, behavior: 'smooth'});
  };

  window.deleteTransaction = async (id) => {
    if (confirm("متأكد من الحذف؟ 🗑️")) {
      await deleteDoc(doc(db, "transactions", id));
    }
  };

  function updateChart(data) {
    const ctx = document.getElementById("expenseChart");
    if (!ctx) return;
    if (expenseChart) expenseChart.destroy();
    expenseChart = new Chart(ctx, {
      type: "doughnut",
      data: {
        labels: Object.keys(data),
        datasets: [{
          data: Object.values(data),
          backgroundColor: ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4", "#ec4899", "#14b8a6"]
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { position: "bottom" }
        }
      }
    });
  }

  function updateMonthlyChart(data) {
    const ctx = document.getElementById("monthlyChart");
    if (!ctx) return;
    if (monthlyChart) monthlyChart.destroy();
    monthlyChart = new Chart(ctx, {
      type: "line",
      data: {
        labels: Object.keys(data).slice(-6),
        datasets: [{
          label: 'المصروفات',
          data: Object.values(data).slice(-6),
          borderColor: '#ef4444',
          backgroundColor: 'rgba(239, 68, 0.1)',
          tension: 0.4,
          fill: true
        }]
      },
      options: { responsive: true }
    });
  }

  function checkBudgetWarning() {
    const warning = document.getElementById('budgetWarning');
    if (!monthlyBudget || monthlyBudget === 0) {
      warning.innerHTML = '';
      return;
    }

    const monthExpenses = transactions
 .filter(t => t.type === 'expense' && t.createdAt.toDate().toISOString().slice(0, 7) === selectedMonth)
 .reduce((sum, t) => sum + t.amount, 0);

    const percent = (monthExpenses / monthlyBudget * 100).toFixed(0);

    if (percent >= 100) {
      warning.innerHTML = `<div class="bg-red-100 dark:bg-red-900/30 border-2 border-red-500 text-red-800 dark:text-red-200 p-4 rounded-2xl animate-scale-in"><span class="emoji text-2xl">🚨</span> <strong>تجاوزت الميزانية!</strong> صرفت ${percent}% من ميزانيتك</div>`;
    } else if (percent >= 80) {
      warning.innerHTML = `<div class="bg-yellow-100 dark:bg-yellow-900/30 border-2 border-yellow-500 text-yellow-800 dark:text-yellow-200 p-4 rounded-2xl animate-scale-in"><span class="emoji text-2xl">⚠️</span> <strong>تحذير:</strong> وصلت ${percent}% من الميزانية</div>`;
    } else {
      warning.innerHTML = '';
    }
  }

  // Budget Functions
  window.saveBudget = async () => {
    const budget = parseFloat(document.getElementById('monthlyBudgetInput').value);
    if (!budget || budget < 0) return alert('اكتب ميزانية صحيحة');

    await updateDoc(doc(db, 'users', currentUser.uid), { monthlyBudget: budget });
    monthlyBudget = budget;
    hideModal('budgetModal');
    checkBudgetWarning();
    alert('تم حفظ الميزانية ✅');
  };

  // AI Functions
  window.openAI = async () => {
    await updateAiLimit();
    if (userPlan === 'free' && aiUsageToday >= 3) {
      alert('وصلت للحد الأقصى 3 أسئلة اليوم. رقي حسابك لـ Pro! 💎');
      window.location.href = 'pricing.html';
      return;
    }
    if (userPlan === 'pro' && aiUsageToday >= 5) {
      alert('وصلت للحد الأقصى 5 أسئلة اليوم. رقي حسابك لـ Max! 💎');
      window.location.href = 'pricing.html';
      return;
    }
    showModal('aiModal');
    document.getElementById('aiBadge').textContent = userPlan === 'max'? 'GPT-4' : userPlan === 'pro'? 'Basic' : 'Free';
    document.getElementById('aiBadge').className = userPlan === 'max'? 'max-gradient px-3 py-1 rounded-full text-xs' : 'pro-gradient px-3 py-1 rounded-full text-xs';
  };

  async function updateAiLimit() {
    const today = new Date().toISOString().split('T')[0];
    const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
    const data = userDoc.data();

    if (data.aiUsageDate!== today) {
      await updateDoc(doc(db, 'users', currentUser.uid), { aiUsageToday: 0, aiUsageDate: today });
      aiUsageToday = 0;
    } else {
      aiUsageToday = data.aiUsageToday || 0;
    }

    const limit = userPlan === 'free'? 3 : userPlan === 'pro'? 5 : '∞';
    const remaining = userPlan === 'max'? '∞' : limit - aiUsageToday;
    document.getElementById('aiLimitText').textContent = remaining;
  }

  window.askAI = async () => {
    const input = document.getElementById('aiInput').value.trim();
    if (!input) return;

    // Check limit
    if (userPlan === 'free' && aiUsageToday >= 3) {
      alert('وصلت للحد الأقصى اليوم');
      return;
    }
    if (userPlan === 'pro' && aiUsageToday >= 5) {
      alert('وصلت للحد الأقصى اليوم');
      return;
    }

    const chat = document.getElementById('aiChat');
    chat.innerHTML += `<div class="text-right"><div class="inline-block bg-blue-500 text-white px-4 py-2 rounded-2xl">${input}</div></div>`;
    document.getElementById('aiInput').value = '';

    // Update usage
    aiUsageToday++;
    await updateDoc(doc(db, 'users', currentUser.uid), { aiUsageToday });
    updateAiLimitDisplay();

    // AI Response
    const totalExp = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
    const avgExp = totalExp / transactions.length || 0;
    const topCategory = Object.entries(transactions.reduce((acc, t) => {
      if(t.type==='expense') acc[t.category]=(acc[t.category]||0)+t.amount;
      return acc;
    }, {})).sort((a,b)=>b[1]-a[1])[0];

    let response = '';
    if (userPlan === 'max') {
      response = `<strong>تحليل GPT-4 المتقدم 🤖</strong><br><br>`;
      response += `📊 متوسط مصروفك اليومي: ${formatCurrency(avgExp)}<br>`;
      response += `🔥 أعلى فئة: ${topCategory? topCategory[0] : 'لا يوجد'} (${formatCurrency(topCategory? topCategory[1] : 0)})<br><br>`;
      response += `<strong>💡 نصائح ذكية:</strong><br>`;
      response += `1. لو قللت ${topCategory? topCategory[0] : 'المصاريف'} 20% هتوفر ${formatCurrency((topCategory? topCategory[1] : 0) * 0.2)} شهرياً<br>`;
      response += `2. حاول تحدد ميزانية ${formatCurrency(totalExp * 0.8)} للشهر الجاي<br>`;
      response += `3. أفضل يوم توفير: الأحد (حسب تحليل مصاريفك)`;
    } else {
      response = `<strong>تحليل أساسي 📊</strong><br><br>`;
      response += `إجمالي مصاريفك: ${formatCurrency(totalExp)}<br>`;
      response += `المتوسط: ${formatCurrency(avgExp)}<br><br>`;
      response += `💡 نصيحة: حدد ميزانية شهرية وتابع مصاريفك يومياً`;
    }

    setTimeout(() => {
      chat.innerHTML += `<div class="text-left"><div class="inline-block bg-gray-200 dark:bg-gray-700 px-4 py-3 rounded-2xl">${response}</div></div>`;
      chat.scrollTop = chat.scrollHeight;
    }, 1000);
  };

  // Admin Functions
  function handleAdminClick() {
    adminClicks++;
    if (adminClicks >= 5) {
      showModal('adminModal');
      adminClicks = 0;
    }
  }

  window.activatePlanBtn?.addEventListener('click', async () => {
    const pass = document.getElementById('adminPassInput').value;
    const transId = document.getElementById('transIdInput').value;
    const email = document.getElementById('customerEmailInput').value;
    const plan = document.getElementById('planTypeInput').value;

    if (pass!== ADMIN_PASSWORD) {
      alert('كلمة سر غلط ❌');
      return;
    }

    if (!transId ||!email ||!plan) {
      alert('املأ كل الحقول ❌');
      return;
    }

    try {
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('email', '==', email));
      const snapshot = await getDocs(q);

      if (!snapshot.empty) {
        const userDoc = snapshot.docs[0];
        const expiry = new Date();
        const isYearly = plan === 'max';
        if (isYearly) expiry.setFullYear(expiry.getFullYear() + 1);
        else expiry.setMonth(expiry.getMonth() + 1);

        await updateDoc(doc(db, 'users', userDoc.id), {
          plan,
          planExpiry: Timestamp.fromDate(expiry),
          transId,
          activatedBy: currentUser.email,
          activatedAt: Timestamp.now()
        });

        const activationLink = `${window.location.origin}/index.html?activated=${transId}`;
        alert(`✅ تم تفعيل ${plan.toUpperCase()} للعميل ${email}\n\nحتى ${expiry.toLocaleDateString('ar-EG')}\n\nلينك التفعيل:\n${activationLink}\n\nابعت اللينك للعميل`);
        hideModal('adminModal');
      } else {
        alert('❌ العميل غير موجود. خليه يسجل الأول');
      }
    } catch (error) {
      alert('خطأ: ' + error.message);
    }
  });
}
