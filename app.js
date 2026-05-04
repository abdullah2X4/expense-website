// Firebase Config - بتاعك الصح
const firebaseConfig = {
    apiKey: "AIzaSyBS3FCovS0LmOGgWSIOxoL3kiKe5mjkl1k",
    authDomain: "masarefy-v6.firebaseapp.com",
    projectId: "masarefy-v6",
    storageBucket: "masarefy-v6.appspot.com",
    messagingSenderId: "362855388821",
    appId: "1:362855388821:web:6bc34c415c520f60102d9c"
};
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// Global Vars
let currentUser = null;
let userPlan = 'free';
let transactions = [];
let chart = null;
let logoClicks = 0;
let isAdmin = false;

// بيانات الدفع الصح
const PAYMENT_INFO = {
    number: "01121898023",
    pro: 25,
    max: 50,
    methods: "اتصالات كاش أو فودافون كاش أو أورانج كاش"
};

// Login Page
function initLogin() {
    auth.onAuthStateChanged(async (user) => {
        if (user) {
            const userDoc = await db.collection('users').doc(user.uid).get();
            if (!userDoc.exists) {
                await db.collection('users').doc(user.uid).set({
                    email: user.email,
                    displayName: user.displayName,
                    photoURL: user.photoURL,
                    plan: null,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp()
                });
                window.location.href = 'pricing.html';
            } else if (!userDoc.data().plan) {
                window.location.href = 'pricing.html';
            } else {
                window.location.href = 'index.html';
            }
        }
    });
}

async function signInWithGoogle() {
    const provider = new firebase.auth.GoogleAuthProvider();
    try {
        await auth.signInWithPopup(provider);
    } catch (error) {
        document.getElementById('error').textContent = 'خطأ: ' + error.message;
        document.getElementById('error').classList.remove('hidden');
    }
}

// Pricing Page
function initPricing() {
    auth.onAuthStateChanged(user => {
        if (!user) window.location.href = 'login.html';
    });
}

async function selectPlan(plan) {
    const user = auth.currentUser;
    if (!user) return;

    if (plan === 'free') {
        await db.collection('users').doc(user.uid).update({ plan: 'free' });
        window.location.href = 'index.html';
    } else {
        const price = plan === 'pro'? PAYMENT_INFO.pro : PAYMENT_INFO.max;
        const confirmPay = confirm(`للاشتراك في خطة ${plan.toUpperCase()}\nالسعر: ${price} جنيه\n\nحول على:\n${PAYMENT_INFO.methods}\nرقم: ${PAYMENT_INFO.number}\n\nوبعد التحويل ابعت سكرين على نفس الرقم واتس\n\nضغط OK لو حولت خلاص`);
        if (confirmPay) {
            await db.collection('users').doc(user.uid).update({
                plan: plan,
                pendingPayment: true,
                requestedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            alert('تم تسجيل طلبك ✅\nهنفعل الخطة خلال 24 ساعة بعد التأكد من التحويل');
            window.location.href = 'index.html';
        }
    }
}

// Main App
function initApp() {
    auth.onAuthStateChanged(async (user) => {
        if (!user) { window.location.href = 'login.html'; return; }
        currentUser = user;
        const userDoc = await db.collection('users').doc(user.uid).get();
        if (!userDoc.exists ||!userDoc.data().plan) { window.location.href = 'pricing.html'; return; }
        userPlan = userDoc.data().plan;
        document.getElementById('userPhoto').src = user.photoURL;
        document.getElementById('planBadge').textContent = userPlan.toUpperCase();
        document.getElementById('app').classList.remove('hidden');

        // AI للـ Max بس
        if (userPlan === 'max') {
            document.getElementById('aiBtn').classList.remove('hidden');
            document.getElementById('aiAnalyzeBtn').classList.remove('hidden');
        }
        if (userPlan!== 'free') document.getElementById('exportBtn').classList.remove('hidden');

        loadTransactions();
        setupAdminClicks();
    });
}

function loadTransactions() {
    db.collection('transactions').where('userId', '==', currentUser.uid).orderBy('createdAt', 'desc').onSnapshot(snapshot => {
        transactions = [];
        snapshot.forEach(doc => { transactions.push({ id: doc.id,...doc.data() }); });
        updateUI();
    });
}

async function addTransaction() {
    const amount = parseFloat(document.getElementById('amount').value);
    const category = document.getElementById('category').value;
    const description = document.getElementById('description').value;
    if (!amount ||!category) return alert('املأ المبلغ والتصنيف');
    if (userPlan === 'free' && transactions.length >= 50) return alert('وصلت للحد الأقصى في الخطة المجانية');
    await db.collection('transactions').add({ userId: currentUser.uid, amount, category, description, createdAt: firebase.firestore.FieldValue.serverTimestamp() });
    document.getElementById('amount').value = '';
    document.getElementById('category').value = '';
    document.getElementById('description').value = '';
}

async function deleteTransaction(id) {
    if (confirm('حذف المعاملة؟')) { await db.collection('transactions').doc(id).delete(); }
}

function updateUI() {
    const total = transactions.reduce((sum, t) => sum + t.amount, 0);
    const monthTotal = transactions.filter(t => { const d = t.createdAt?.toDate(); const now = new Date(); return d && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear(); }).reduce((sum, t) => sum + t.amount, 0);
    document.getElementById('totalExpense').textContent = `$${total.toFixed(2)}`;
    document.getElementById('totalCount').textContent = transactions.length;
    document.getElementById('monthTotal').textContent = `$${monthTotal.toFixed(2)}`;
    const categories = {};
    transactions.forEach(t => { categories[t.category] = (categories[t.category] || 0) + t.amount; });
    if (chart) chart.destroy();
    chart = new Chart(document.getElementById('chart'), { type: 'doughnut', data: { labels: Object.keys(categories), datasets: [{ data: Object.values(categories), backgroundColor: ['#8b5cf6', '#6366f1', '#3b82f6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444'] }] }, options: { responsive: true, maintainAspectRatio: true } });
    document.getElementById('transactions').innerHTML = transactions.slice(0, 10).map(t => `<div class="flex justify-between items-center p-3 bg-gray-50 rounded-lg"><div><div class="font-bold">${t.category}</div><div class="text-sm text-gray-500">${t.description || 'بدون وصف'}</div></div><div class="flex items-center gap-3"><div class="text-lg font-bold text-red-500">$${t.amount.toFixed(2)}</div><button onclick="deleteTransaction('${t.id}')" class="text-red-500 hover:text-red-700">🗑️</button></div></div>`).join('');
}

function exportData() {
    if (userPlan === 'free') return alert('التصدير متاح في Pro و Max فقط');
    let csv = 'المبلغ,التصنيف,الوصف,التاريخ\n';
    transactions.forEach(t => { const date = t.createdAt?.toDate().toLocaleDateString('ar-EG') || ''; csv += `${t.amount},${t.category},${t.description || ''},${date}\n`; });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'masarefy-export.csv';
    link.click();
}

// Admin Mode
function setupAdminClicks() {
    document.getElementById('logo').addEventListener('click', () => {
        logoClicks++;
        if (logoClicks >= 5) { logoClicks = 0; document.getElementById('adminModal').classList.add('active'); }
        setTimeout(() => { logoClicks = 0; }, 2000);
    });
}

function checkAdmin() {
    const pass = document.getElementById('adminPass').value;
    if (pass === 'abdallah111$') {
        isAdmin = true;
        alert('تم تفعيل وضع الأدمن 🔓');
        closeAdmin();
    } else {
        document.getElementById('adminError').textContent = 'كلمة سر خاطئة';
        document.getElementById('adminError').classList.remove('hidden');
    }
}

function closeAdmin() {
    document.getElementById('adminModal').classList.remove('active');
    document.getElementById('adminPass').value = '';
    document.getElementById('adminError').classList.add('hidden');
}

function logout() { auth.signOut(); }

// AI Assistant - Max Plan Only
function toggleAI() {
    if (userPlan!== 'max') return alert('المساعد الذكي متاح في خطة Max فقط بـ 50 جنيه 🚀');
    document.getElementById('aiModal').classList.toggle('active');
    if (document.getElementById('aiChat').children.length === 0) {
        addAIMessage('أهلاً! أنا المساعد المالي الذكي VIP 🤖💎\nأقدر أحلل مصاريفك، أتوقع مصاريفك الجاية، وأديك خطة توفير مخصصة.\nاسألني أي حاجة!', 'ai');
    }
}

function addAIMessage(text, sender) {
    const chat = document.getElementById('aiChat');
    const div = document.createElement('div');
    div.className = sender === 'user'? 'text-right' : 'text-left';
    div.innerHTML = `<div class="inline-block px-4 py-2 rounded-lg ${sender === 'user'? 'bg-purple-600 text-white' : 'bg-gray-200 text-gray-800'}">${text}</div>`;
    chat.appendChild(div);
    chat.scrollTop = chat.scrollHeight;
}

async function sendAIMessage() {
    if (userPlan!== 'max') return alert('المساعد الذكي متاح في خطة Max فقط بـ 50 جنيه 🚀');
    const input = document.getElementById('aiInput');
    const msg = input.value.trim();
    if (!msg) return;
    addAIMessage(msg, 'user');
    input.value = '';

    addAIMessage('<span class="ai-typing">بفكر</span>', 'ai');

    // AI Logic المتقدم للـ Max
    setTimeout(() => {
        const total = transactions.reduce((sum, t) => sum + t.amount, 0);
        const categories = {};
        transactions.forEach(t => { categories[t.category] = (categories[t.category] || 0) + t.amount; });
        const topCategory = Object.keys(categories).reduce((a, b) => categories[a] > categories[b]? a : b, '');
        const avg = total / transactions.length || 0;
        const thisMonth = transactions.filter(t => { const d = t.createdAt?.toDate(); const now = new Date(); return d && d.getMonth() === now.getMonth(); });
        const monthTotal = thisMonth.reduce((sum, t) => sum + t.amount, 0);

        let response = '';
        if (msg.includes('توقع') || msg.includes('الشهر الجاي')) {
            response = `🔮 توقع AI للشهر الجاي:\nبناءً على معدل صرفك $${(monthTotal / new Date().getDate() * 30).toFixed(2)}\nهتصرف حوالي $${(monthTotal / new Date().getDate() * 30).toFixed(2)} لو كملت بنفس المعدل\n\nنصيحة: قلل ${topCategory} بنسبة 15% هتوفر $${(categories[topCategory] * 0.15).toFixed(2)}`;
        } else if (msg.includes('خطة') || msg.includes('توفير')) {
            response = `💰 خطة التوفير الذكية:\n1. قلل ${topCategory}: وفر $${(categories[topCategory] * 0.2).toFixed(2)}/شهر\n2. حدد ميزانية يومية: $${(monthTotal/30).toFixed(2)}\n3. راجع المعاملات فوق $${(avg*2).toFixed(2)}\n\nلو التزمت هتوفر $${(total*0.15).toFixed(2)} شهرياً = $${(total*0.15*12).toFixed(2)} سنوياً 🎯`;
        } else if (msg.includes('تحليل') || msg.includes('ملخص')) {
            response = `📊 تحليل VIP كامل:\n• إجمالي: $${total.toFixed(2)}\n• هذا الشهر: $${monthTotal.toFixed(2)}\n• أعلى تصنيف: ${topCategory} - $${categories[topCategory]?.toFixed(2)}\n• متوسط المعاملة: $${avg.toFixed(2)}\n• عدد المعاملات: ${transactions.length}\n\n⚠️ تنبيه: ${topCategory} واخد ${((categories[topCategory]/total)*100).toFixed(1)}% من مصاريفك`;
        } else {
            response = `كـ VIP Max 💎\nفهمت سؤالك: "${msg}"\n\nبناءً على ${transactions.length} معاملة بإجمالي $${total.toFixed(2)}\nأعلى بند: ${topCategory} - $${categories[topCategory]?.toFixed(2)}\n\nتحب أحللك إيه تاني؟ أقدر أتوقع، أعمل خطة توفير، أو أحلل أي تصنيف بالتفصيل`;
        }

        document.getElementById('aiChat').lastChild.remove();
        addAIMessage(response, 'ai');
    }, 1500);
}

function aiAnalyze() {
    if (userPlan!== 'max') return alert('التحليل الذكي VIP متاح في Max فقط بـ 50 جنيه 🚀');
    toggleAI();
    setTimeout(() => {
        document.getElementById('aiInput').value = 'اعملي تحليل كامل مع خطة توفير';
        sendAIMessage();
    }, 500);
}
