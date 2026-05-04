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
let currentLang = localStorage.getItem('lang') || 'ar';
let currentCurrency = localStorage.getItem('currency') || 'EGP';
let exchangeRate = 50;

const PAYMENT_INFO = {
    number: "01121898023",
    methods: "Etisalat Cash, Vodafone Cash, Orange Cash",
    methodsAr: "اتصالات كاش أو فودافون كاش أو أورانج كاش",
    plans: {
        pro_month: { priceEGP: 25, priceUSD: 0.5, days: 30, name: 'Pro' },
        max_month: { priceEGP: 50, priceUSD: 1, days: 30, name: 'Max' },
        max_year: { priceEGP: 550, priceUSD: 11, days: 365, name: 'Max VIP Yearly' }
    }
};

const LANG = {
    ar: {
        dir: 'rtl', lang: 'ar', currencySymbol: 'ج.م',
        appName: 'مصاريفي V6 🤖', loginTitle: 'مصاريفي V6',
        loginSubtitle: 'إدارة أموالك بالذكاء الاصطناعي',
        googleBtn: 'المتابعة باستخدام جوجل', choosePlan: 'اختر الخطة المناسبة لك',
        startFree: 'ابدأ مجاناً', mostPopular: 'الأكثر شيوعاً',
        subscribeNow: 'اشترك الآن', subscribeVIP: 'اشترك VIP',
        save50: 'وفر 50 جنيه', totalExpense: 'إجمالي المصاريف',
        totalCount: 'عدد المعاملات', thisMonth: 'هذا الشهر',
        addExpense: 'إضافة مصروف جديد', amount: 'المبلغ',
        category: 'التصنيف', description: 'الوصف', add: 'إضافة',
        analyzeAI: '🤖 حلل مصاريفي بالذكاء الاصطناعي VIP',
        chartTitle: 'الرسم البياني', exportCSV: 'تصدير CSV',
        lastTransactions: 'آخر المعاملات', noDesc: 'بدون وصف',
        logout: 'خروج', aiVIP: '💬 AI VIP',
        aiTitle: 'المساعد المالي الذكي VIP 🤖💎',
        askAI: 'اسأل عن مصاريفك...', send: 'إرسال',
        adminTitle: 'وضع الأدمن 🔐', password: 'كلمة السر',
        enter: 'دخول', cancel: 'إلغاء', wrongPass: 'كلمة سر خاطئة',
        fillFields: 'املأ المبلغ والتصنيف', maxReached: 'وصلت للحد الأقصى في الخطة المجانية',
        deleteConfirm: 'حذف المعاملة؟', exportOnly: 'التصدير متاح في Pro و Max فقط',
        aiOnly: 'المساعد الذكي متاح في خطة Max فقط بـ 50 جنيه 🚀',
        adminActivated: 'تم تفعيل وضع الأدمن 🔓',
        userId: 'اكتب رقم العملية/ID بتاع العميل:\n(أول 8 حروف من UID)',
        userNotFound: 'المستخدم مش موجود! تأكد من رقم العملية',
        choosePlanNum: 'اختار الخطة:\n1 = Pro شهر (25 جنيه)\n2 = Max شهر (50 جنيه)\n3 = Max سنة (550 جنيه)\n\nاكتب رقم:',
        wrongChoice: 'اختيار خاطئ', activated: '✅ تم تفعيل',
        expires: 'ينتهي:', sendLink: 'ابعتله اللينك ده:',
        planExpired: 'انتهى اشتراكك! جدد عشان تكمل',
        planExpiredFree: 'انتهى اشتراكك! تم تحويلك للخطة المجانية',
        subscribe: 'للاشتراك في', price: 'السعر:', duration: 'المدة:',
        day: 'يوم', sendTo: 'حول على:', sendScreen: 'وبعد التحويل ابعت سكرين + رقم العملية على واتس',
        clickOK: 'ضغط OK لو حولت خلاص',
        orderRegistered: 'تم تسجيل طلبك ✅\nرقم العملية:',
        sendWithScreen: 'ابعت الرقم ده مع سكرين التحويل على واتس:',
        willActivate: 'هنفعل الخطة خلال ساعة',
        perMonth: '/شهر', perYear: '/سنة', instead: 'بدل 600 جنيه',
        thinking: 'بفكر', payment: 'للدفع: اتصالات كاش أو فودافون كاش أو أورانج كاش',
        currency: 'العملة', language: 'اللغة', english: 'English', arabic: 'العربية',
        egyptian: 'جنيه مصري', dollar: 'دولار أمريكي',
        now: 'الآن', month: 'شهر', year: 'سنة',
        user: 'المستخدم', email: 'الإيميل', upgrade: 'ترقية 🚀',
        prediction: 'بناءً على مصاريفك الحالية، أتوقع الشهر الجاي هتصرف حوالي',
        willSpend: 'هتصرف', ifContinue: 'لو كملت بنفس المعدل. تقدر توفر لو قللت',
        save: 'وفر', savingPlan: 'خطة توفير مخصصة لك:\n• قلل',
        savePerMonth: ' شهرياً\n• راجع المعاملات اللي فوق',
        checkAbove: 'تحقق من المصاريف اللي فوق', ifCommit: 'لو التزمت بالخطة دي هتوفر',
        monthly: 'شهرياً و', yearly: 'سنوياً!',
        fullAnalysis: 'تحليل شامل لمصاريفك:\n• إجمالي المصاريف:',
        topCategory: 'أعلى بند صرف:', avgTransaction: 'متوسط المعاملة:',
        transactionCount: 'عدد المعاملات:', warning: '⚠️ تنبيه:',
        takes: 'واخد', ofExpenses: '% من مصاريفك',
        vipResponse: 'كمساعد مالي VIP، فهمت سؤالك عن',
        basedOn: 'بناءً على تحليل', transactions: 'معاملة، إجمالي مصاريفك',
        topItem: 'أعلى بند عندك هو', whatElse: 'عايز تفاصيل أكتر عن إيه؟',
        fullAnalysisPlan: 'اعملي تحليل شامل لمصاريفي وخطة توفير',
        aiWelcome: 'أهلاً بيك! أنا مساعدك المالي الذكي 🤖\nأقدر أحلل مصاريفك، أتوقع صرفك، وأعملك خطة توفير مخصصة.\nاسألني عن أي حاجة!'
    },
    en: {
        dir: 'ltr', lang: 'en', currencySymbol: '$',
        appName: 'Masarefy V6 🤖', loginTitle: 'Masarefy V6',
        loginSubtitle: 'Manage your money with AI',
        googleBtn: 'Continue with Google', choosePlan: 'Choose the right plan for you',
        startFree: 'Start Free', mostPopular: 'Most Popular',
        subscribeNow: 'Subscribe Now', subscribeVIP: 'Subscribe VIP',
        save50: 'Save 50 EGP', totalExpense: 'Total Expenses',
        totalCount: 'Transactions Count', thisMonth: 'This Month',
        addExpense: 'Add New Expense', amount: 'Amount',
        category: 'Category', description: 'Description', add: 'Add',
        analyzeAI: '🤖 Analyze My Expenses with AI VIP',
        chartTitle: 'Chart', exportCSV: 'Export CSV',
        lastTransactions: 'Latest Transactions', noDesc: 'No description',
        logout: 'Logout', aiVIP: '💬 AI VIP',
        aiTitle: 'Smart Financial Assistant VIP 🤖💎',
        askAI: 'Ask about your expenses...', send: 'Send',
        adminTitle: 'Admin Mode 🔐', password: 'Password',
        enter: 'Enter', cancel: 'Cancel', wrongPass: 'Wrong password',
        fillFields: 'Fill amount and category', maxReached: 'You reached the free plan limit',
        deleteConfirm: 'Delete transaction?', exportOnly: 'Export available in Pro & Max only',
        aiOnly: 'AI Assistant available in Max plan only for 50 EGP 🚀',
        adminActivated: 'Admin mode activated 🔓',
        userId: 'Enter customer transaction ID:\n(First 8 chars of UID)',
        userNotFound: 'User not found! Check transaction ID',
        choosePlanNum: 'Choose plan:\n1 = Pro Month (25 EGP)\n2 = Max Month (50 EGP)\n3 = Max Year (550 EGP)\n\nEnter number:',
        wrongChoice: 'Wrong choice', activated: '✅ Activated',
        expires: 'Expires:', sendLink: 'Send him this link:',
        planExpired: 'Your subscription expired! Renew to continue',
        planExpiredFree: 'Your subscription expired! Moved to free plan',
        subscribe: 'Subscribe to', price: 'Price:', duration: 'Duration:',
        day: 'day', sendTo: 'Send to:', sendScreen: 'After transfer, send screenshot + transaction ID on WhatsApp',
        clickOK: 'Click OK if you transferred',
        orderRegistered: 'Order registered ✅\nTransaction ID:',
        sendWithScreen: 'Send this ID with transfer screenshot on WhatsApp:',
        willActivate: 'We will activate within 1 hour',
        perMonth: '/month', perYear: '/year', instead: 'Instead of 600 EGP',
        thinking: 'Thinking', payment: 'Payment: Etisalat Cash, Vodafone Cash, or Orange Cash',
        currency: 'Currency', language: 'Language', english: 'English', arabic: 'العربية',
        egyptian: 'Egyptian Pound', dollar: 'US Dollar',
        now: 'Now', month: 'month', year: 'year',
        user: 'User', email: 'Email', upgrade: 'Upgrade 🚀',
        prediction: 'Based on your current expenses, I predict next month you will spend around',
        willSpend: 'You will spend', ifContinue: 'if you continue at the same rate. You can save if you reduce',
        save: 'Save', savingPlan: 'Custom saving plan for you:\n• Reduce',
        savePerMonth: ' monthly\n• Review transactions above',
        checkAbove: 'Check expenses above', ifCommit: 'If you commit to this plan you will save',
        monthly: 'monthly and', yearly: 'yearly!',
        fullAnalysis: 'Full analysis of your expenses:\n• Total expenses:',
        topCategory: 'Top category:', avgTransaction: 'Average transaction:',
        transactionCount: 'Transaction count:', warning: '⚠️ Warning:',
        takes: 'takes', ofExpenses: '% of your expenses',
        vipResponse: 'As your VIP financial assistant, I understood your question about',
        basedOn: 'Based on analysis of', transactions: 'transactions, your total expenses',
        topItem: 'Your top item is', whatElse: 'What else would you like to know?',
        fullAnalysisPlan: 'Do a full analysis of my expenses and saving plan',
        aiWelcome: 'Welcome! I am your smart financial assistant 🤖\nI can analyze your expenses, predict your spending, and create a custom saving plan.\nAsk me anything!'
    }
};

function t(key) { return LANG[currentLang][key] || key; }

function formatPrice(egpPrice) {
    if (currentCurrency === 'USD') {
        const usd = egpPrice / exchangeRate;
        return `${usd.toFixed(2)} ${t('currencySymbol')}`;
    }
    return `${egpPrice} ${t('currencySymbol')}`;
}

function formatAmount(amount) {
    if (currentCurrency === 'USD') {
        return `$${(amount / exchangeRate).toFixed(2)}`;
    }
    return `${amount.toFixed(2)} ${t('currencySymbol')}`;
}

function toggleLang() {
    currentLang = currentLang === 'ar'? 'en' : 'ar';
    localStorage.setItem('lang', currentLang);
    location.reload();
}

function toggleCurrency() {
    currentCurrency = currentCurrency === 'EGP'? 'USD' : 'EGP';
    localStorage.setItem('currency', currentCurrency);
    location.reload();
}

function applyLang() {
    document.documentElement.lang = t('lang');
    document.documentElement.dir = t('dir');
    const ids = ['appName', 'logo', 'totalExpenseLabel', 'totalCountLabel', 'monthTotalLabel', 'addExpenseTitle', 'addBtn', 'aiAnalyzeBtn', 'chartTitle', 'exportBtn', 'lastTransactionsTitle', 'logoutBtn', 'aiTitle', 'sendBtn', 'adminTitle', 'adminEnterBtn', 'adminCancelBtn', 'langBtn', 'currencyBtn', 'amount', 'category', 'description', 'aiInput', 'adminPass', 'upgradeBtn'];
    ids.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            if (id === 'langBtn') el.textContent = currentLang === 'ar'? 'EN' : 'ع';
            else if (id === 'currencyBtn') el.textContent = currentCurrency === 'EGP'? '$' : 'ج.م';
            else if (id === 'amount') el.placeholder = t('amount');
            else if (id === 'category') el.placeholder = t('category');
            else if (id === 'description') el.placeholder = t('description');
            else if (id === 'aiInput') el.placeholder = t('askAI');
            else if (id === 'adminPass') el.placeholder = t('password');
            else if (id === 'upgradeBtn') el.textContent = t('upgrade');
            else el.textContent = t(id.replace('Label', '').replace('Title', '').replace('Btn', ''));
        }
    });
}

function initLogin() {
    applyLang();
    document.getElementById('loginTitle').textContent = t('loginTitle');
    document.getElementById('loginSubtitle').textContent = t('loginSubtitle');
    document.getElementById('googleBtnText').textContent = t('googleBtn');
    document.getElementById('paymentText').textContent = t('payment');
    document.getElementById('paymentNumber').textContent = PAYMENT_INFO.number;
    auth.onAuthStateChanged(async (user) => {
        if (user) {
            const userDoc = await db.collection('users').doc(user.uid).get();
            if (!userDoc.exists) {
                await db.collection('users').doc(user.uid).set({
                    email: user.email, displayName: user.displayName, photoURL: user.photoURL,
                    plan: null, planExpiry: null, currency: currentCurrency,
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
        document.getElementById('error').textContent = 'Error: ' + error.message;
        document.getElementById('error').classList.remove('hidden');
    }
}

function checkPlanExpiry(userData) {
    const now = new Date();
    if (userData.planExpiry && userData.planExpiry.toDate() < now) {
        alert(t('planExpired'));
        window.location.href = 'pricing.html';
    } else {
        window.location.href = 'index.html';
    }
}

function initPricing() {
    applyLang();
    document.getElementById('choosePlanTitle').textContent = t('choosePlan');
    document.getElementById('paymentText').textContent = t('payment');
    document.getElementById('paymentNumber').textContent = PAYMENT_INFO.number;
    document.getElementById('startFreeSub').textContent = t('loginSubtitle');
    document.getElementById('freePerMonth').textContent = t('perMonth');
    document.getElementById('startFreeBtn').textContent = t('startFree');
    document.getElementById('mostPopular').textContent = t('mostPopular');
    document.getElementById('subscribeNowBtn').textContent = t('subscribeNow');
    document.getElementById('maxMonthlyTitle').textContent = t('appName') + ' Max';
    document.getElementById('subscribeVIPBtn').textContent = t('subscribeVIP');
    document.getElementById('save50').textContent = t('save50');
    document.getElementById('maxYearlyTitle').textContent = t('appName') + ' Max VIP';
    document.getElementById('subscribeYearlyBtn').textContent = t('subscribeVIP');
    updatePricingCards();
    auth.onAuthStateChanged(user => {
        if (!user) window.location.href = 'login.html';
    });
}

function updatePricingCards() {
    const plans = PAYMENT_INFO.plans;
    document.getElementById('proPrice').textContent = formatPrice(plans.pro_month.priceEGP) + t('perMonth');
    document.getElementById('maxMonthPrice').textContent = formatPrice(plans.max_month.priceEGP) + t('perMonth');
    document.getElementById('maxYearPrice').textContent = formatPrice(plans.max_year.priceEGP) + t('perYear');
    document.getElementById('maxYearInstead').textContent = `${t('instead')} ${formatPrice(600)}`;
}

async function selectPlan(planType) {
    const user = auth.currentUser;
    if (!user) return;

    if (planType === 'free') {
        await db.collection('users').doc(user.uid).update({ plan: 'free', planExpiry: null });
        window.location.href = 'index.html';
    } else {
        const plan = PAYMENT_INFO.plans[planType];
        const confirmPay = confirm(`${t('subscribe')} ${plan.name}\n${t('price')} ${formatPrice(plan.priceEGP)}\n${t('duration')} ${plan.days} ${t('day')}\n\n${t('sendTo')}\n${currentLang === 'ar'? PAYMENT_INFO.methodsAr : PAYMENT_INFO.methods}\n${PAYMENT_INFO.number}\n\n${t('sendScreen')}\n\n${t('clickOK')}`);
        if (confirmPay) {
            await db.collection('users').doc(user.uid).update({
                plan: 'pending', pendingPayment: planType,
                requestedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            alert(`${t('orderRegistered')} ${user.uid.slice(0,8).toUpperCase()}\n${t('sendWithScreen')} ${PAYMENT_INFO.number}\n${t('willActivate')}`);
            window.location.href = 'index.html';
        }
    }
}

function initApp() {
    applyLang();
    auth.onAuthStateChanged(async (user) => {
        if (!user) { window.location.href = 'login.html'; return; }
        currentUser = user;
        const userDoc = await db.collection('users').doc(user.uid).get();
        if (!userDoc.exists ||!userDoc.data().plan) { window.location.href = 'pricing.html'; return; }

        const userData = userDoc.data();
        userPlan = userData.plan;
        planExpiry = userData.planExpiry;
        if (userData.currency) currentCurrency = userData.currency;

        if (planExpiry && planExpiry.toDate() < new Date() && userPlan!== 'free') {
            await db.collection('users').doc(user.uid).update({ plan: 'free', planExpiry: null });
            alert(t('planExpiredFree'));
            window.location.href = 'pricing.html';
            return;
        }

        document.getElementById('userPhoto').src = user.photoURL;
        let badgeText = userPlan.toUpperCase();
        if (planExpiry) {
            const daysLeft = Math.ceil((planExpiry.toDate() - new Date()) / (1000 * 60 * 60 * 24));
            badgeText += ` - ${daysLeft} ${currentLang === 'ar'? 'يوم' : 'days'}`;
        }
        document.getElementById('planBadge').textContent = badgeText;
        document.getElementById('app').classList.remove('hidden');

        if (userPlan === 'free' || userPlan === 'pro') {
            document.getElementById('upgradeBtn').classList.remove('hidden');
        }
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

    if (!amount ||!category) return alert(t('fillFields'));
    if (userPlan === 'free' && transactions.length >= 50) return alert(t('maxReached'));

    try {
        await db.collection('transactions').add({
            userId: currentUser.uid, amount, category, description,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        document.getElementById('amount').value = '';
        document.getElementById('category').value = '';
        document.getElementById('description').value = '';
    } catch (error) {
        alert('Error: ' + error.message);
    }
}

async function deleteTransaction(id) {
    if (confirm(t('deleteConfirm'))) {
        await db.collection('transactions').doc(id).delete();
    }
}

function updateUI() {
    const total = transactions.reduce((sum, tr) => sum + tr.amount, 0);
    const monthTotal = transactions.filter(tr => {
        const d = tr.createdAt?.toDate();
        const now = new Date();
        return d && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }).reduce((sum, tr) => sum + tr.amount, 0);

    document.getElementById('totalExpense').textContent = formatAmount(total);
    document.getElementById('totalCount').textContent = transactions.length;
    document.getElementById('monthTotal').textContent = formatAmount(monthTotal);

    const categories = {};
    transactions.forEach(tr => {
        categories[tr.category] = (categories[tr.category] || 0) + tr.amount;
    });

    if (chart) chart.destroy();
    chart = new Chart(document.getElementById('chart'), {
        type: 'doughnut',
        data: {
            labels: Object.keys(categories),
            datasets: [{
                data: Object.values(categories).map(v => currentCurrency === 'USD'? v / exchangeRate : v),
                backgroundColor: ['#8b5cf6', '#6366f1', '#3b82f6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444']
            }]
        },
        options: { responsive: true, maintainAspectRatio: true, animation: { duration: 1000 } }
    });

    document.getElementById('transactions').innerHTML = transactions.slice(0, 10).map((tr, index) => {
        const date = tr.createdAt?.toDate().toLocaleDateString(currentLang === 'ar'? 'ar-EG' : 'en-US') || t('now');
        const isNew = index === 0 && Date.now() - (tr.createdAt?.toDate().getTime() || 0) < 2000;
        return `<div class="flex justify-between items-center p-3 bg-gray-50 rounded-lg ${isNew? 'transaction-new' : ''}">
            <div>
                <div class="font-bold">${tr.category}</div>
                <div class="text-sm text-gray-500">${tr.description || t('noDesc')} - ${date}</div>
            </div>
            <div class="flex items-center gap-3">
                <div class="text-lg font-bold text-red-500">${formatAmount(tr.amount)}</div>
                <button onclick="deleteTransaction('${tr.id}')" class="text-red-500 hover:text-red-700">🗑️</button>
            </div>
        </div>`;
    }).join('');
}

function exportData() {
    if (userPlan === 'free') return alert(t('exportOnly'));
    let csv = currentLang === 'ar'? 'المبلغ,التصنيف,الوصف,التاريخ\n' : 'Amount,Category,Description,Date\n';
    transactions.forEach(tr => {
        const date = tr.createdAt?.toDate().toLocaleDateString(currentLang === 'ar'? 'ar-EG' : 'en-US') || '';
        csv += `${tr.amount},${tr.category},${tr.description || ''},${date}\n`;
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
        document.getElementById('adminError').textContent = t('wrongPass');
        document.getElementById('adminError').classList.remove('hidden');
    }
}

function showAdminPanel() {
    const userId = prompt(`${t('adminActivated')}\n\n${t('userId')}`);
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
        alert(t('userNotFound'));
        return;
    }

    const planType = prompt(`${t('user')}: ${targetUser.displayName}\n${t('email')}: ${targetUser.email}\n\n${t('choosePlanNum')}`);

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
        alert(t('wrongChoice'));
        return;
    }

    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + days);

    await db.collection('users').doc(targetUser.id).update({
        plan: planKey, planExpiry: expiryDate, pendingPayment: false,
        activatedBy: currentUser.uid, activatedAt: firebase.firestore.FieldValue.serverTimestamp()
    });

    alert(`${t('activated')} ${planKey.toUpperCase()}\n${t('expires')} ${expiryDate.toLocaleDateString(currentLang === 'ar'? 'ar-EG' : 'en-US')}\n\n${t('sendLink')}\nhttps://abdullah2x4.github.io/expense-website/`);
}

function closeAdmin() {
    document.getElementById('adminModal').classList.remove('active');
    document.getElementById('adminPass').value = '';
    document.getElementById('adminError').classList.add('hidden');
}

function logout() { auth.signOut(); }

function toggleAI() {
    if (userPlan!== 'max') return alert(t('aiOnly'));
    document.getElementById('aiModal').classList.toggle('active');
    if (document.getElementById('aiChat').children.length === 0) {
        addAIMessage(t('aiWelcome'), 'ai');
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
    if (userPlan!== 'max') return alert(t('aiOnly'));
    const input = document.getElementById('aiInput');
    const msg = input.value.trim();
    if (!msg) return;
    addAIMessage(msg, 'user');
    input.value = '';

    addAIMessage(`<span class="ai-typing">${t('thinking')}</span>`, 'ai');

    setTimeout(() => {
        const total = transactions.reduce((sum, tr) => sum + tr.amount, 0);
        const categories = {};
        transactions.forEach(tr => { categories[tr.category] = (categories[tr.category] || 0) + tr.amount; });
        const topCategory = Object.keys(categories).reduce((a, b) => categories[a] > categories[b]? a : b, '');
        const avg = total / transactions.length || 0;
        const thisMonth = transactions.filter(tr => { const d = tr.createdAt?.toDate(); const now = new Date(); return d && d.getMonth() === now.getMonth(); });
        const monthTotal = thisMonth.reduce((sum, tr) => sum + tr.amount, 0);

        let response = '';
        if (msg.includes('توقع') || msg.toLowerCase().includes('predict') || msg.includes('الشهر الجاي') || msg.toLowerCase().includes('next month')) {
            const pred = monthTotal / new Date().getDate() * 30;
            response = `${t('prediction')} ${formatAmount(pred)}\n${t('willSpend')} ${formatAmount(pred)} ${t('ifContinue')} ${topCategory} ${currentLang === 'ar'? 'بنسبة 15%' : 'by 15%'} ${t('save')} ${formatAmount(categories[topCategory] * 0.15)}`;
        } else if (msg.includes('خطة') || msg.includes('توفير') || msg.toLowerCase().includes('plan') || msg.toLowerCase().includes('saving')) {
            response = `${t('savingPlan')} ${topCategory}: ${t('save')} ${formatAmount(categories[topCategory] * 0.2)}${t('savePerMonth')} ${formatAmount(monthTotal/30)}\n${t('checkAbove')} ${formatAmount(avg*2)}\n\n${t('ifCommit')} ${formatAmount(total*0.15)} ${t('monthly')} ${formatAmount(total*0.15*12)} ${t('yearly')}`;
        } else if (msg.includes('تحليل') || msg.includes('ملخص') || msg.toLowerCase().includes('analysis') || msg.toLowerCase().includes('summary')) {
            response = `${t('fullAnalysis')} ${formatAmount(total)}\n• ${t('thisMonth')}: ${formatAmount(monthTotal)}\n• ${t('topCategory')} ${topCategory} - ${formatAmount(categories[topCategory] || 0)}\n• ${t('avgTransaction')} ${formatAmount(avg)}\n• ${t('transactionCount')} ${transactions.length}\n\n${t('warning')} ${topCategory} ${t('takes')} ${((categories[topCategory]/total)*100).toFixed(1)}${t('ofExpenses')}`;
        } else {
            response = `${t('vipResponse')} "${msg}"\n\n${t('basedOn')} ${transactions.length} ${t('transactions')} ${formatAmount(total)}\n${t('topItem')} ${topCategory} - ${formatAmount(categories[topCategory] || 0)}\n\n${t('whatElse')}`;
        }

        document.getElementById('aiChat').lastChild.remove();
        addAIMessage(response, 'ai');
    }, 1500);
}

function aiAnalyze() {
    if (userPlan!== 'max') return alert(t('aiOnly'));
    toggleAI();
    setTimeout(() => {
        document.getElementById('aiInput').value = t('fullAnalysisPlan');
        sendAIMessage();
    }, 500);
}
