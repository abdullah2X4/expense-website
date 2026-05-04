// Firebase Config
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

let currentUser = null;
let userPlan = 'free';
let planExpiry = null;
let transactions = [];
let chart = null;
let logoClicks = 0;
let isAdmin = false;

const PAYMENT_INFO = {
    number: "01121898023",
    methods: "اتصالات كاش أو فودافون كاش أو أورانج كاش",
    plans: {
        pro_month: { price: 25, days: 30, name: 'Pro' },
        max_month: { price: 50, days: 30, name: 'Max' },
        max_year: { price: 550, days: 365, name: 'Max VIP السنوي' }
    }
};

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
                    planExpiry: null,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp()
                });
                window.location.href = 'pricing.html';
            } else if (!userDoc.data().plan) {
                window.location.href = 'pricing.html';
            } else {
                checkPlanExpiry(userDoc.data());
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

function checkPlanExpiry(userData) {
    const now = new Date();
    if (userData.planExpiry && userData.planExpiry.toDate() < now) {
        alert('انتهى اشتراكك! جدد عشان تكمل');
        window.location.href = 'pricing.html';
    } else {
        window.location.href = 'index.html';
    }
}

function initPricing() {
    auth.onAuthStateChanged(user => {
        if (!user) window.location.href = 'login.html';
    });
}

async function selectPlan(planType) {
    const user = auth.currentUser;
    if (!user) return;

    if (planType === 'free') {
        await db.collection('users').doc(user.uid).update({ plan: 'free', planExpiry: null });
        window.location.href = 'index.html';
    } else {
        const plan = PAYMENT_INFO.plans[planType];
        const confirmPay = confirm(`للاشتراك في ${plan.name}\nالسعر: ${plan.price} جنيه\nالمدة: ${plan.days} يوم\n\nحول على:\n${PAYMENT_INFO.methods}\nرقم: ${PAYMENT_INFO.number}\n\nوبعد التحويل ابعت سكرين + رقم العملية على واتس\n\nضغط OK لو حولت خلاص`);
        if (confirmPay) {
            await db.collection('users').doc(user.uid).update({
                plan: 'pending',
                pendingPayment: planType,
                requestedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            alert(`تم تسجيل طلبك ✅\nرقم العملية: ${user.uid.slice(0,8).toUpperCase()}\nابعت الرقم ده مع سكرين التحويل على واتس: ${PAYMENT_INFO.number}\nهنفعل الخطة خلال ساعة`);
            window.location.href = 'index.html';
        }
    }
}

function initApp() {
    auth.onAuthStateChanged(async (user) => {
        if (!user) { window.location.href = 'login.html'; return; }
        currentUser = user;
        const userDoc = await db.collection('users').doc(user.uid).get();
        if (!userDoc.exists ||!userDoc.data().plan) { window.location.href = 'pricing.html'; return; }

        const userData = userDoc.data();
        userPlan = userData.plan;
        planExpiry = userData.planExpiry;

        if (planExpiry && planExpiry.toDate() < new Date() && userPlan!== 'free') {
            await db.collection('users').doc(user.uid).update({ plan: 'free', planExpiry: null });
            alert('انتهى اشتراكك! تم تحويلك للخطة المجانية');
            window.location.href = 'pricing.html';
            return;
        }

        document.getElementById('userPhoto').src = user.photoURL;
        let badgeText = userPlan.toUpperCase();
        if (planExpiry) {
            const daysLeft = Math.ceil((planExpiry.toDate() - new Date()) / (1000 * 60 * 24));
            badgeText += ` - ${daysLeft} يوم`;
        }
        document.getElementById('planBadge').textContent = badgeText;
        document.getElementById('app').classList.remove('hidden');

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
    db.collection('transactions').where('userId', '==', currentUser.uid).onSnapshot(snapshot => {
        transactions = [];
        snapshot.forEach(doc => {
            transactions.push({ id: doc.id,...doc.data() });
        });
        transactions.sort((a, b) => {
            const dateA = a.createdAt?.toDate() || new Date(0);
            const dateB = b.createdAt?.toDate() || new Date(0);
            return dateB - dateA;
        });
        updateUI();
    });
}

async function addTransaction() {
    const amount = parseFloat(document.getElementById('amount').value);
    const category = document.getElementById('category').value.trim();
    const description = document.getElementById('description').value.trim();

    if (!amount ||!category) return alert('املأ المبلغ والتصنيف');
    if (userPlan === 'free' && transactions.length >= 50) return alert('وصلت للحد الأقصى في الخطة المجانية');

    try {
        await db.collection('transactions').add({
            userId: currentUser.uid,
            amount,
            category,
            description,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        document.getElementById('amount').value = '';
        document.getElementById('category').value = '';
        document.getElementById('description').value = '';
    } catch (error) {
        alert('خطأ في الإضافة: ' + error.message);
    }
}

async function deleteTransaction(id) {
    if (confirm('حذف المعاملة؟')) {
        await db.collection('transactions').doc(id).delete();
    }
}

function updateUI() {
    const total = transactions.reduce((sum, t) => sum + t.amount, 0);
    const monthTotal = transactions.filter(t => {
        const d = t.createdAt?.toDate();
        const now = new Date();
        return d && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }).reduce((sum, t) => sum + t.amount, 0);

    document.getElementById('totalExpense').textContent = `$${total.toFixed(2)}`;
    document.getElementById('totalCount').textContent = transactions.length;
    document.getElementById('monthTotal').textContent = `$${monthTotal.toFixed(2)}`;

    const categories = {};
    transactions.forEach(t => {
        categories[t.category] = (categories[t.category] || 0) + t.amount;
    });

    if (chart) chart.destroy();
    chart = new Chart(document.getElementById('chart'), {
        type: 'doughnut',
        data: {
            labels: Object.keys(categories),
            datasets: [{
                data: Object.values(categories),
                backgroundColor: ['#8b5cf6', '#6366f1', '#3b82f6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444']
            }]
        },
        options: { responsive: true, maintainAspectRatio: true }
    });

    document.getElementById('transactions').innerHTML = transactions.slice(0, 10).map(t => {
        const date = t.createdAt?.toDate().toLocaleDateString('ar-EG') || 'الآن';
        return `<div class="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
            <div>
                <div class="font-bold">${t.category}</div>
                <div class="text-sm text-gray-500">${t.description || 'بدون وصف'} - ${date}</div>
            </div>
            <div class="flex items-center gap-3">
                <div class="text-lg font-bold text-red-500">$${t.amount.toFixed(2)}</div>
                <button onclick="deleteTransaction('${t.id}')" class="text-red-500 hover:text-red-700">🗑️</button>
            </div>
        </div>`;
    }).join('');
}

function exportData() {
    if (userPlan === 'free') return alert('التصدير متاح في Pro و Max فقط');
    let csv = 'المبلغ,التصنيف,الوصف,التاريخ\n';
    transactions.forEach(t => {
        const date = t.createdAt?.toDate().toLocaleDateString('ar-EG') || '';
        csv += `${t.amount},${t.category},${t.description || ''},${date}\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'masarefy-export.csv';
    link.click();
}

function setupAdminClicks() {
    document.getElementById('logo').addEventListener('click', () => {
        logoClicks++;
        if (logoClicks >= 5) {
            logoClicks = 0;
            document.getElementById('adminModal').classList.add('active');
        }
        setTimeout(() => { logoClicks = 0; }, 2000);
    });
}

function checkAdmin() {
    const pass = document.getElementById('adminPass').value;
    if (pass === 'abdallah111$') {
        isAdmin = true;
        closeAdmin();
        showAdminPanel();
    } else {
        document.getElementById('adminError').textContent = 'كلمة سر خاطئة';
        document.getElementById('adminError').classList.remove('hidden');
    }
}

function showAdminPanel() {
    const userId = prompt('تم تفعيل وضع الأدمن 🔓\n\nاكتب رقم العملية/ID بتاع العميل:\n(أول 8 حروف من UID)');
    if (!userId) return;
    activateUserPlan(userId);
}

async function activateUserPlan(shortId) {
    const usersSnapshot = await db.collection('users').get();
    let targetUser = null;
    usersSnapshot.forEach(doc => {
        if (doc.id.startsWith(shortId.toLowerCase())) {
            targetUser = { id: doc.id,...doc.data() };
        }
    });

    if (!targetUser) {
        alert('المستخدم مش موجود! تأكد من رقم العملية');
        return;
    }

    const planType = prompt(`المستخدم: ${targetUser.displayName}\nالإيميل: ${targetUser.email}\n\nاختار الخطة:\n1 = Pro شهر (25 جنيه)\n2 = Max شهر (50 جنيه)\n3 = Max سنة (550 جنيه)\n\nاكتب رقم:`);

    let planKey, days;
    if (planType === '1') {
        planKey = 'pro';
        days = 30;
    } else if (planType === '2') {
        planKey = 'max';
        days = 30;
    } else if (planType === '3') {
        planKey = 'max';
        days = 365;
    } else {
        alert('اختيار خاطئ');
        return;
    }

    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + days);

    await db.collection('users').doc(targetUser.id).update({
        plan: planKey,
        planExpiry: expiryDate,
        pendingPayment: false,
        activatedBy: currentUser.uid,
        activatedAt: firebase.firestore.FieldValue.serverTimestamp()
    });

    alert(`✅ تم تفعيل ${planKey.toUpperCase()} للمستخدم\nينتهي: ${expiryDate.toLocaleDateString('ar-EG')}\n\nابعتله اللينك ده:\nhttps://abdullah2x4.github.io/expense-website/`);
}

function closeAdmin() {
    document.getElementById('adminModal').classList.remove('active');
    document.getElementById('adminPass').value = '';
    document.getElementById('adminError').classList.add('hidden');
}

function logout() { auth.signOut(); }

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
            response = `كـ VIP Max 💎\nفهمت سؤالك: "${msg}"\n\nبناءً على ${transactions.length} معاملة بإجمالي $${total.toFixed(2)}\nأعلى بند: ${topCategory} - $${categories[topCategory]?.toFixed(2)}\n\nتحب أحللك إيه تاني؟`;
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
