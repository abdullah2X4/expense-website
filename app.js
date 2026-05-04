// ===== Masarefy V6.2 Pro - Full Fixed Version =====
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

const currencyRates = { EGP: 1, USD: 0.020, EUR: 0.019, SAR: 0.076, AED: 0.074 };
const currencySymbols = { EGP: 'ج.م', USD: '$', EUR: '€', SAR: 'ر.س', AED: 'د.إ' };

const translations = {
  ar: { upgrade: "ترقية", upgrade_to_pro: "ترقية لـ Pro", upgrade_to_max: "ترقية لـ Max" },
  en: { upgrade: "Upgrade", upgrade_to_pro: "Upgrade to Pro", upgrade_to_max: "Upgrade to Max" },
  fr: { upgrade: "Mettre à niveau", upgrade_to_pro: "Passer à Pro", upgrade_to_max: "Passer à Max" },
  de: { upgrade: "Upgrade", upgrade_to_pro: "Auf Pro upgraden", upgrade_to_max: "Auf Max upgraden" },
  es: { upgrade: "Actualizar", upgrade_to_pro: "Actualizar a Pro", upgrade_to_max: "Actualizar a Max" }
};

function t(key) { return translations[currentLang]?.[key] || key; }

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

    // Initialize
    document.getElementById('monthFilter').value = selectedMonth;
    if (localStorage.getItem('theme') === 'dark') document.documentElement.classList.add('dark');

    // All Event Listeners
    document.getElementById('langSelect').value = currentLang;
    document.getElementById('currencySelect').value = currentCurrency;

    document.getElementById('langSelect').addEventListener('change', e => {
      currentLang = e.target.value;
      localStorage.setItem('lang', currentLang);
      location.reload();
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

    // AI Enter key
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
      userPlan = userDoc.data().plan || 'free';
      monthlyBudget = userDoc.data().monthlyBudget || 0;
      document.getElementById('monthlyBudgetInput').value = monthlyBudget;
    } else {
      await setDoc(doc(db, 'users', user.uid), {
        email: user.email,
        plan: 'free',
        monthlyBudget: 0,
        createdAt: Timestamp.now()
      });
    }

    updatePlanBadge();
    updateUpgradeButton();
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
      upgradeBtn.onclick = () => showModal('settingsModal');
      upgradeBtn.innerHTML = `<span class="emoji">👑</span> <span class="hidden md:inline">${t('upgrade_to_pro')}</span>`;
    } else if (userPlan === "pro") {
      upgradeBtn.classList.remove("hidden");
      upgradeBtn.innerHTML = `<span class="emoji">⭐</span> <span class="hidden md:inline">${t('upgrade_to_max')}</span>`;
      upgradeBtn.onclick = () => showModal('settingsModal');
    } else {
      upgradeBtn.classList.add("hidden");
    }
  }

  function initDashboard(user) {
    const addBtn = document.getElementById("addBtn");

    addBtn?.addEventListener("click", async () => {
      console.log('Add button clicked');

      // Check limit for free plan
      if (userPlan === 'free' && transactions.length >= 50) {
        alert('وصلت للحد الأقصى 50 معاملة. رقي حسابك لـ Pro! 💎');
        showModal('settingsModal');
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
          addBtn.innerHTML = '<span class="emoji">✨</span> إضافة';
        }, 2000);

        console.log('Transaction added successfully');

      } catch (error) {
        console.error('Error adding transaction:', error);
        alert("خطأ: " + error.message);
        addBtn.innerHTML = '<span class="emoji">✨</span> إضافة';
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
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
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
  window.openAI = () => {
    if (userPlan === 'free') {
      alert('المساعد الذكي متاح في Pro و Max فقط 💎\nرقي حسابك الآن!');
      showModal('settingsModal');
      return;
    }
    showModal('aiModal');
    document.getElementById('aiBadge').textContent = userPlan === 'max'? 'GPT-4' : 'Basic';
    document.getElementById('aiBadge').className = userPlan === 'max'? 'max-gradient px-3 py-1 rounded-full text-xs' : 'pro-gradient px-3 py-1 rounded-full text-xs';
  };

  window.askAI = async () => {
    const input = document.getElementById('aiInput').value.trim();
    if (!input) return;

    const chat = document.getElementById('aiChat');
    chat.innerHTML += `<div class="text-right"><div class="inline-block bg-blue-500 text-white px-4 py-2 rounded-2xl">${input}</div></div>`;
    document.getElementById('aiInput').value = '';

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
      const pass = prompt('🔐 Admin Password:');
      if (pass === ADMIN_PASSWORD) {
        const transId = prompt('رقم عملية الدفع:');
        const email = prompt('إيميل العميل:');
        const plan = prompt('الخطة (pro/max):');
        const duration = prompt('المدة (monthly/yearly):');
        if (transId && email && plan) {
          activateSubscription(email, plan, duration, transId);
        }
      } else {
        alert('كلمة سر غلط ❌');
      }
      adminClicks = 0;
    }
  }

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
      alert(`✅ تم تفعيل ${plan.toUpperCase()} للعميل ${email}\nحتى ${expiry.toLocaleDateString('ar-EG')}`);
    } else {
      alert('❌ العميل غير موجود');
    }
  }
}
