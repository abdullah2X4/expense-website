const app = document.getElementById('app');
const lockScreen = document.getElementById('lockScreen');
const paywall = document.getElementById('paywall');
const payStep1 = document.getElementById('payStep1');
const payStep2 = document.getElementById('payStep2');
const passwordInput = document.getElementById('passwordInput');
const unlockBtn = document.getElementById('unlockBtn');
const lockBtn = document.getElementById('lockBtn');
const lockMsg = document.getElementById('lockMsg');
const paidBtn = document.getElementById('paidBtn');
const freeBtn = document.getElementById('freeBtn');
const submitTxBtn = document.getElementById('submitTxBtn');
const backBtn = document.getElementById('backBtn');
const txIdInput = document.getElementById('txIdInput');
const cloudBtn = document.getElementById('cloudBtn');
const nameInput = document.getElementById('name');
const priceInput = document.getElementById('price');
const categoryInput = document.getElementById('category');
const paymentInput = document.getElementById('payment');
const receiptInput = document.getElementById('receipt');
const addBtn = document.getElementById('addBtn');
const list = document.getElementById('list');
const totalEl = document.getElementById('total');
const countEl = document.getElementById('count');
const avgDailyEl = document.getElementById('avgDaily');
const exportExcelBtn = document.getElementById('exportExcelBtn');
const exportPdfBtn = document.getElementById('exportPdfBtn');
const exportJsonBtn = document.getElementById('exportJsonBtn');
const clearBtn = document.getElementById('clearBtn');
const form = document.getElementById('expense-form');
const searchInput = document.getElementById('searchInput');
const themeBtn = document.getElementById('themeBtn');
const monthFilter = document.getElementById('monthFilter');
const budgetInput = document.getElementById('budgetInput');
const progressFill = document.getElementById('progressFill');
const budgetText = document.getElementById('budgetText');
const budgetAlert = document.getElementById('budgetAlert');
const doughnutChart = document.getElementById('doughnutChart');
const paymentChart = document.getElementById('paymentChart');
const lineChart = document.getElementById('lineChart');
const themeDots = document.querySelectorAll('.theme-dot');

let expenses = JSON.parse(localStorage.getItem('expenses')) || [];
let doughnut = null, payment = null, line = null, editIndex = -1;

// ✅ رقمك بتاع اتصالات كاش
const YOUR_ETISALAT_NUMBER = "01121898023";
// ✅ كود الماستر الجديد بتاعك
const MASTER_ADMIN_CODE = "abdallah111$";

function encodePass(pass) {
    return btoa(encodeURIComponent(pass));
}

function decodePass(encoded) {
    return decodeURIComponent(atob(encoded));
}

function checkVIP() {
    const vipExpiry = localStorage.getItem('vipExpiry');
    const isVIP = vipExpiry && new Date(vipExpiry) > new Date();
    const pendingTx = localStorage.getItem('pendingTx');

    if (pendingTx) {
        alert(`⏳ طلبك قيد المراجعة\nرقم العملية: ${pendingTx}\nهيتم التفعيل خلال 24 ساعة\n\nللاستعجال ابعت سكرين على واتساب: ${YOUR_ETISALAT_NUMBER}`);
        return false;
    }

    if (!isVIP &&!localStorage.getItem('freeMode')) {
        paywall.style.display = 'flex';
        app.style.display = 'none';
        return false;
    }
    return true;
}

function activateVIP() {
    const expiry = new Date();
    expiry.setMonth(expiry.getMonth() + 1);
    localStorage.setItem('vipExpiry', expiry.toISOString());
    localStorage.setItem('isVIP', 'true');
    localStorage.removeItem('pendingTx');
    paywall.style.display = 'none';
    showApp();
}

paidBtn.addEventListener('click', () => {
    payStep1.style.display = 'none';
    payStep2.style.display = 'block';
});

backBtn.addEventListener('click', () => {
    payStep2.style.display = 'none';
    payStep1.style.display = 'block';
});

submitTxBtn.addEventListener('click', () => {
    const txId = txIdInput.value.trim();
    if (txId.length < 5) {
        alert('⚠️ اكتب رقم العملية صحيح');
        return;
    }

    localStorage.setItem('pendingTx', txId);
    localStorage.setItem('pendingDate', new Date().toISOString());

    alert(`✅ تم استلام طلبك\nرقم العملية: ${txId}\nهيتم مراجعة التحويل وتفعيل VIP خلال 24 ساعة\n\nلو مستعجل ابعت سكرين التحويل على واتساب: ${YOUR_ETISALAT_NUMBER}`);

    paywall.style.display = 'none';
    showApp();
});

freeBtn.addEventListener('click', () => {
    localStorage.setItem('freeMode', 'true');
    paywall.style.display = 'none';
    showApp();
    alert('⚠️ النسخة المجانية: 50 مصروف بس\n💎 تقدر ترقي لـ VIP أي وقت من الزرار الذهبي فوق');
});

// ========== لوحة تفعيل الأدمن السرية ==========
let adminClicks = 0;
document.querySelector('.vip-badge').addEventListener('click', () => {
    adminClicks++;
    if (adminClicks === 5) {
        adminClicks = 0;
        const adminCode = prompt('🔐 كود الأدمن:');
        if (adminCode === MASTER_ADMIN_CODE) {
            const txId = prompt('✅ دخل رقم عملية العميل:');
            if (txId && txId.length >= 5) {
                const expiry = new Date();
                expiry.setMonth(expiry.getMonth() + 1);
                const activationCode = btoa(`VIP-${txId}-${expiry.toISOString()}`);
                const activationLink = window.location.origin + window.location.pathname + '#activate=' + activationCode;
                prompt('📋 ابعت الرابط ده للعميل:', activationLink);
            }
        } else {
            alert('❌ كود غلط');
        }
    }
});

// العميل يفتح الرابط يتفعل أوتوماتيك
if (window.location.hash.startsWith('#activate=')) {
    try {
        const code = window.location.hash.replace('#activate=', '');
        const decoded = atob(code);
        if (decoded.startsWith('VIP-')) {
            const expiry = decoded.split('-').slice(2).join('-');
            localStorage.setItem('vipExpiry', expiry);
            localStorage.setItem('isVIP', 'true');
            localStorage.removeItem('pendingTx');
            localStorage.removeItem('freeMode');
            alert('👑 تم تفعيل VIP بنجاح لمدة شهر!');
            window.location.hash = '';
            location.reload();
        }
    } catch(e) {
        alert('❌ كود التفعيل غلط');
    }
}
// ========== نهاية لوحة الأدمن ==========

themeDots.forEach(dot => {
    dot.addEventListener('click', () => {
        if (!localStorage.getItem('isVIP')) {
            alert('🔒 الثيمات ميزة VIP بس بـ 50ج/شهر\n💎 رقي حسابك من الزرار الذهبي فوق');
            return;
        }
        const theme = dot.dataset.theme;
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('colorTheme', theme);
        themeDots.forEach(d => d.classList.remove('active'));
        dot.classList.add('active');
    });
});

const savedTheme = localStorage.getItem('colorTheme') || 'purple';
document.documentElement.setAttribute('data-theme', savedTheme);
document.querySelector(`[data-theme="${savedTheme}"]`)?.classList.add('active');

cloudBtn.addEventListener('click', () => {
    alert('☁️ ميزة Cloud Sync قريباً في V6.0!\n👑 هتقدر تزامن مصاريفك على كل أجهزتك');
});

// زرار الترقية للنسخة المجانية - يظهر أوتوماتيك
if (!localStorage.getItem('isVIP') && localStorage.getItem('freeMode')) {
    const upgradeBtn = document.createElement('button');
    upgradeBtn.id = 'upgradeBtn';
    upgradeBtn.className = 'icon-btn';
    upgradeBtn.innerHTML = '💎';
    upgradeBtn.title = 'ترقية لـ VIP';
    upgradeBtn.style.background = 'linear-gradient(135deg,#F59E0B,#EF4444)';
    upgradeBtn.style.animation = 'pulse 2s infinite';
    cloudBtn.parentNode.insertBefore(upgradeBtn, cloudBtn);

    upgradeBtn.addEventListener('click', () => {
        if (confirm('👑 عايز ترقي لـ VIP بـ 50ج/شهر؟\n\n✨ هتاخد:\n- تقارير Excel + PDF\n- 4 ثيمات ملونة\n- صور الفواتير\n- مصاريف غير محدودة')) {
            localStorage.removeItem('freeMode');
            location.reload();
        }
    });

    // إضافة انيميشن للزرار
    const style = document.createElement('style');
    style.textContent = '@keyframes pulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.1); } }';
    document.head.appendChild(style);
}

function checkLock() {
    const pass = localStorage.getItem('appPassword');
    if (!pass) {
        const newPass = prompt('👑 مرحباً بك في مصاريفي VIP!\n🔐 عيّن كلمة سر: استخدم أرقام وحروف إنجليزي فقط');
        if (newPass && newPass.length >= 4) {
            localStorage.setItem('appPassword', encodePass(newPass));
            showApp();
        } else {
            alert('⚠️ كلمة السر لازم 4 حروف على الأقل');
            location.reload();
        }
    } else if (sessionStorage.getItem('unlocked') === 'true') {
        showApp();
    } else {
        lockScreen.style.display = 'flex';
    }
}

function showApp() {
    if (!checkVIP()) return;
    lockScreen.style.display = 'none';
    app.style.display = 'block';
    sessionStorage.setItem('unlocked', 'true');

    if (!localStorage.getItem('isVIP')) {
        document.getElementById('exportExcelBtn').style.display = 'none';
        document.getElementById('exportPdfBtn').style.display = 'none';
        document.querySelector('.theme-picker').style.display = 'none';
    }
}

unlockBtn.addEventListener('click', tryUnlock);
passwordInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') tryUnlock();
});

function tryUnlock() {
    try {
        const inputPass = passwordInput.value;
        const storedPass = decodePass(localStorage.getItem('appPassword'));
        if (inputPass === storedPass) {
            showApp();
            lockMsg.textContent = '';
        } else {
            lockMsg.textContent = '❌ كلمة السر غلط يا باشا';
            passwordInput.value = '';
        }
    } catch(e) {
        lockMsg.textContent = '❌ في مشكلة. امسح بيانات الموقع وجرب تاني';
    }
}

lockBtn.addEventListener('click', () => {
    sessionStorage.removeItem('unlocked');
    location.reload();
});

function sanitize(text) {
    const temp = document.createElement('div');
    temp.textContent = text;
    return temp.innerHTML;
}

function saveData() {
    localStorage.setItem('expenses', JSON.stringify(expenses));
}

function getMonthExpenses(month) {
    return expenses.filter(e => e.date.startsWith(month));
}

function getFilteredExpenses() {
    const searchTerm = searchInput.value.toLowerCase();
    const selectedMonth = monthFilter.value;
    return expenses.filter(item => {
        const matchSearch = item.name.toLowerCase().includes(searchTerm);
        const matchMonth =!selectedMonth || item.date.startsWith(selectedMonth);
        return matchSearch && matchMonth;
    });
}

function updateBudget() {
    const budget = parseFloat(budgetInput.value) || 0;
    localStorage.setItem('budget', budget);
    const month = monthFilter.value;
    const monthTotal = getMonthExpenses(month).reduce((s, i) => s + i.price, 0);
    const percent = budget? Math.min((monthTotal / budget) * 100, 100) : 0;

    progressFill.style.width = `${percent}%`;

    if (percent >= 90) {
        budgetAlert.textContent = '⚠️ قربت تخلص الميزانية!';
        progressFill.style.background = '#EF4444';
    } else if (percent >= 80) {
        budgetAlert.textContent = '⚡ تنبيه: وصلت 80%';
        progressFill.style.background = '#F59E0B';
    } else {
        budgetAlert.textContent = '';
        progressFill.style.background = '#10B981';
    }

    budgetText.textContent = `${monthTotal.toLocaleString()} / ${budget.toLocaleString()} جنيه`;
}

function updateUI() {
    const filtered = getFilteredExpenses();
    const total = filtered.reduce((sum, item) => sum + item.price, 0);
    const month = monthFilter.value;
    const daysInMonth = new Date(month.split('-')[0], month.split('-')[1], 0).getDate();
    const avg = total / daysInMonth;

    totalEl.textContent = `${total.toLocaleString()} جنيه`;
    countEl.textContent = filtered.length.toLocaleString();
    avgDailyEl.textContent = `${Math.round(avg).toLocaleString()} جنيه`;

    renderExpenses(filtered);
    updateCharts(filtered);
    updateBudget();
}

function renderExpenses(items) {
    list.innerHTML = '';
    items.forEach(item => {
        const realIndex = expenses.indexOf(item);
        const li = document.createElement('li');
        const hasReceipt = item.receipt? '📸' : '';
        li.innerHTML = `
            <div class="expense-info">
                <span class="expense-name">${hasReceipt} ${sanitize(item.name)}</span>
                <span class="expense-meta">${item.category} | ${item.payment} | 📅 ${item.date}</span>
            </div>
            <span class="expense-price">${item.price.toLocaleString()} جنيه</span>
            <div class="expense-actions">
                <button onclick="editExpense(${realIndex})">✏️ تعديل</button>
                <button onclick="deleteExpense(${realIndex})">🗑️ حذف</button>
            </div>
        `;
        list.appendChild(li);
    });
}

function updateCharts(items) {
    const cats = {};
    items.forEach(i => {
        const cat = i.category.split(' ')[1] || i.category;
        cats[cat] = (cats[cat] || 0) + i.price;
    });

    if (doughnut) doughnut.destroy();
    doughnut = new Chart(doughnutChart, {
        type: 'doughnut',
        data: {
            labels: Object.keys(cats),
            datasets: [{
                data: Object.values(cats),
                backgroundColor: ['#6366F1', '#8B5CF6', '#EC4899', '#F59E0B', '#10B981', '#06B6D4', '#F97316'],
                borderWidth: 0
            }]
        },
        options: {
            plugins: {
                legend: {
                    labels: { color: getComputedStyle(document.body).color, font: { family: 'Cairo', weight: '700' } }
                }
            }
        }
    });

    const payments = {};
    items.forEach(i => {
        const pay = i.payment || '💵 كاش';
        payments[pay] = (payments[pay] || 0) + i.price;
    });

    if (payment) payment.destroy();
    payment = new Chart(paymentChart, {
        type: 'doughnut',
        data: {
            labels: Object.keys(payments),
            datasets: [{
                data: Object.values(payments),
                backgroundColor: ['#10B981', '#3B82F6', '#8B5CF6', '#F59E0B', '#6366F1'],
                borderWidth: 0
            }]
        },
        options: {
            plugins: {
                legend: {
                    labels: { color: getComputedStyle(document.body).color, font: { family: 'Cairo', weight: '700' } }
                }
            }
        }
    });

    const months = [];
    const data = [];
    for (let i = 5; i >= 0; i--) {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        const monthStr = d.toISOString().slice(0, 7);
        months.push(monthStr);
        data.push(getMonthExpenses(monthStr).reduce((s, e) => s + e.price, 0));
    }

    if (line) line.destroy();
    line = new Chart(lineChart, {
        type: 'line',
        data: {
            labels: months,
            datasets: [{
                label: 'المصروف الشهري',
                data: data,
                borderColor: '#6366F1',
                backgroundColor: 'rgba(99, 102, 241, 0.15)',
                tension: 0.4,
                fill: true,
                borderWidth: 3
            }]
        },
        options: {
            plugins: {
                legend: { labels: { color: getComputedStyle(document.body).color, font: { family: 'Cairo', weight: '700' } } }
            },
            scales: {
                y: { ticks: { color: getComputedStyle(document.body).color, font: { weight: '600' } }, grid: { color: 'rgba(148, 163, 184, 0.1)' } },
                x: { ticks: { color: getComputedStyle(document.body).color, font: { weight: '600' } }, grid: { color: 'rgba(148, 163, 184, 0.1)' } }
            }
        }
    });
}

addBtn.addEventListener('click', () => {
    if (!localStorage.getItem('isVIP') && expenses.length >= 50) {
        alert('🔒 وصلت للحد الأقصى 50 مصروف في النسخة المجانية\n💎 رقي لـ VIP بـ 50ج شهرياً من الزرار الذهبي فوق');
        return;
    }

    const name = nameInput.value.trim();
    const price = parseFloat(priceInput.value);
    const category = categoryInput.value;
    const payment = paymentInput.value;
    const receiptFile = receiptInput.files[0];

    if (!name || isNaN(price) || price <= 0 || price > 999999) {
        alert('⚠️ السعر لازم رقم موجب وأقل من مليون');
        return;
    }

    const date = new Date().toISOString().slice(0, 10);
    const expenseData = { name, price, category, payment, date };

    if (receiptFile) {
        const reader = new FileReader();
        reader.onload = (e) => {
            expenseData.receipt = e.target.result;
            saveExpense(expenseData);
        };
        reader.readAsDataURL(receiptFile);
    } else {
        saveExpense(expenseData);
    }
});

function saveExpense(data) {
    if (editIndex >= 0) {
        expenses[editIndex] = {...expenses[editIndex],...data };
        editIndex = -1;
        addBtn.textContent = '✨ إضافة المصروف';
    } else {
        if (!localStorage.getItem('isVIP') && expenses.length >= 1000) {
            alert('⚠️ وصلت للحد الأقصى 1000 مصروف VIP');
            return;
        }
        expenses.push(data);
    }
    saveData();
    updateUI();
    form.reset();
    receiptInput.value = '';
}

window.deleteExpense = i => {
    if (confirm('🗑️ متأكد عايز تحذف المصروف ده؟')) {
        expenses.splice(i, 1);
        saveData();
        updateUI();
    }
}

window.editExpense = i => {
    const item = expenses[i];
    nameInput.value = item.name;
    priceInput.value = item.price;
    categoryInput.value = item.category;
    paymentInput.value = item.payment;
    editIndex = i;
    addBtn.textContent = '✅ تحديث المصروف';
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

searchInput.addEventListener('input', updateUI);
monthFilter.addEventListener('input', updateUI);
budgetInput.addEventListener('input', updateBudget);

function applyTheme() {
    const theme = localStorage.getItem('theme') || 'dark';
    document.body.classList.toggle('light-mode', theme === 'light');
    themeBtn.textContent = theme === 'light'? '🌙' : '☀️';
}

themeBtn.addEventListener('click', () => {
    const newTheme = (localStorage.getItem('theme') || 'dark') === 'dark'? 'light' : 'dark';
    localStorage.setItem('theme', newTheme);
    applyTheme();
    updateCharts(getFilteredExpenses());
});

exportExcelBtn.addEventListener('click', () => {
    if (!localStorage.getItem('isVIP')) {
        alert('🔒 الميزة دي VIP بس بـ 50ج/شهر\n💎 رقي حسابك من الزرار الذهبي فوق');
        return;
    }
    const data = expenses.map(e => ({
        'التاريخ': e.date,
        'الاسم': e.name,
        'التصنيف': e.category,
        'طريقة الدفع': e.payment,
        'السعر': e.price
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'مصاريفي');
    XLSX.writeFile(wb, `مصاريفي-VIP-${new Date().toISOString().slice(0,10)}.xlsx`);
});

exportPdfBtn.addEventListener('click', () => {
    if (!localStorage.getItem('isVIP')) {
        alert('🔒 الميزة دي VIP بس بـ 50ج/شهر\n💎 رقي حسابك من الزرار الذهبي فوق');
        return;
    }
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    doc.setFont('helvetica');
    doc.text('Masareefy VIP Report', 105, 15, { align: 'center' });

    let y = 30;
    doc.setFontSize(10);
    expenses.forEach((e, i) => {
        if (y > 270) {
            doc.addPage();
            y = 20;
        }
        doc.text(`${e.date} - ${e.name} - ${e.category} - ${e.payment} - ${e.price} EGP`, 20, y);
        y += 8;
    });

    doc.save(`مصاريفي-VIP-${new Date().toISOString().slice(0,10)}.pdf`);
});

exportJsonBtn.addEventListener('click', () => {
    const blob = new Blob([JSON.stringify(expenses, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `masareefy-VIP-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
});

clearBtn.addEventListener('click', () => {
    if (confirm('⚠️ متأكد عايز تمسح كل المصاريف؟ لا يمكن التراجع!')) {
        expenses = [];
        saveData();
        updateUI();
    }
});

monthFilter.value = new Date().toISOString().slice(0, 7);
budgetInput.value = localStorage.getItem('budget') || '';
applyTheme();
checkLock();
updateUI();
