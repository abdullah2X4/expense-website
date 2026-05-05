// Smart Wallet v7.0 - Firebase CDN Version
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js';
import { getAuth, onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';
import { getFirestore, collection, addDoc, query, where, onSnapshot, deleteDoc, doc, serverTimestamp } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';

// بيانات مشروعك - حطيتها خلاص
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
const provider = new GoogleAuthProvider();

let currentUser = null;
let unsubscribeTransactions = null;
let expenseChart = null;

console.log('Firebase initialized');

// تشغيل حسب الصفحة
if (document.getElementById('googleLoginBtn')) {
  console.log('Login page detected');
  initLoginPage();
} else if (document.getElementById('logoutBtn')) {
  console.log('Dashboard detected');
  initDashboard();
}

// صفحة تسجيل الدخول
function initLoginPage() {
  const googleBtn = document.getElementById('googleLoginBtn');
  const emailBtn = document.getElementById('emailLoginBtn');
  const signupBtn = document.getElementById('emailSignupBtn');
  const emailInput = document.getElementById('emailInput');
  const passInput = document.getElementById('passwordInput');

  googleBtn?.addEventListener('click', async () => {
    console.log('Google button clicked');
    try {
      await signInWithPopup(auth, provider);
      window.location.href = 'index.html';
    } catch (err) {
      alert('خطأ جوجل: ' + err.message);
      console.error(err);
    }
  });

  emailBtn?.addEventListener('click', async () => {
    console.log('Email login clicked');
    try {
      await signInWithEmailAndPassword(auth, emailInput.value, passInput.value);
      window.location.href = 'index.html';
    } catch (err) {
      alert('خطأ تسجيل الدخول: ' + err.message);
    }
  });

  signupBtn?.addEventListener('click', async () => {
    console.log('Signup clicked');
    try {
      await createUserWithEmailAndPassword(auth, emailInput.value, passInput.value);
      window.location.href = 'index.html';
    } catch (err) {
      alert('خطأ إنشاء الحساب: ' + err.message);
    }
  });

  onAuthStateChanged(auth, (user) => {
    if (user) window.location.href = 'index.html';
  });
}

// الصفحة الرئيسية
function initDashboard() {
  onAuthStateChanged(auth, (user) => {
    if (!user) {
      window.location.href = 'login.html';
      return;
    }
    currentUser = user;
    document.getElementById('welcomeUser').textContent = `أهلاً ${user.displayName || user.email}`;
    loadTransactions();
  });

  document.getElementById('logoutBtn')?.addEventListener('click', () => signOut(auth));
  document.getElementById('addTransactionBtn')?.addEventListener('click', addTransaction);
}

async function addTransaction() {
  const amount = parseFloat(document.getElementById('amountInput').value);
  const type = document.getElementById('typeInput').value;
  const category = document.getElementById('categoryInput').value;
  const note = document.getElementById('noteInput').value;

  if (!amount || !category) {
    alert('اكتب المبلغ والفئة');
    return;
  }

  try {
    await addDoc(collection(db, 'transactions'), {
      userId: currentUser.uid,
      amount,
      type,
      category,
      note,
      createdAt: serverTimestamp()
    });
    
    document.getElementById('amountInput').value = '';
    document.getElementById('categoryInput').value = '';
    document.getElementById('noteInput').value = '';
  } catch (err) {
    alert('خطأ: ' + err.message);
  }
}

function loadTransactions() {
  if (unsubscribeTransactions) unsubscribeTransactions();
  
  const q = query(collection(db, 'transactions'), where('userId', '==', currentUser.uid));
  
  unsubscribeTransactions = onSnapshot(q, (snapshot) => {
    const transactions = [];
    snapshot.forEach((doc) => {
      transactions.push({ id: doc.id, ...doc.data() });
    });
    
    transactions.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
    updateUI(transactions);
    updateChart(transactions);
  });
}

function updateUI(transactions) {
  let income = 0, expenses = 0;
  const list = document.getElementById('transactionsList');
  list.innerHTML = '';

  transactions.forEach((t) => {
    if (t.type === 'income') income += t.amount;
    else expenses += t.amount;

    const div = document.createElement('div');
    div.className = 'flex justify-between items-center p-3 bg-slate-800 rounded-xl';
    div.innerHTML = `
      <div>
        <p class="font-bold">${t.category}</p>
        <p class="text-xs text-slate-400">${t.note || ''}</p>
      </div>
      <div class="text-left">
        <p class="font-bold ${t.type === 'income' ? 'text-emerald-400' : 'text-red-400'}">
          ${t.type === 'income' ? '+' : '-'}${t.amount} ج.م
        </p>
        <button onclick="deleteTransaction('${t.id}')" class="text-xs text-red-500 mt-1">حذف</button>
      </div>
    `;
    list.appendChild(div);
  });

  document.getElementById('totalIncome').textContent = `${income.toFixed(2)} ج.م`;
  document.getElementById('totalExpenses').textContent = `${expenses.toFixed(2)} ج.م`;
  document.getElementById('currentBalance').textContent = `${(income - expenses).toFixed(2)} ج.م`;
}

window.deleteTransaction = async (id) => {
  if (confirm('متأكد عايز تحذف؟')) {
    await deleteDoc(doc(db, 'transactions', id));
  }
};

function updateChart(transactions) {
  const expenses = transactions.filter(t => t.type === 'expense');
  const byCategory = {};
  
  expenses.forEach(t => {
    byCategory[t.category] = (byCategory[t.category] || 0) + t.amount;
  });

  const ctx = document.getElementById('expenseChart');
  if (!ctx) return;

  if (expenseChart) expenseChart.destroy();
  
  expenseChart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: Object.keys(byCategory),
      datasets: [{
        data: Object.values(byCategory),
        backgroundColor: ['#10b981', '#ef4444', '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899']
      }]
    },
    options: {
      plugins: { legend: { labels: { color: '#94a3b8' } } }
    }
  });
}
