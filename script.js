const app = document.getElementById('app');
const lockScreen = document.getElementById('lockScreen');
const passwordInput = document.getElementById('passwordInput');
const unlockBtn = document.getElementById('unlockBtn');
const lockBtn = document.getElementById('lockBtn');
const lockMsg = document.getElementById('lockMsg');
const installBtn = document.getElementById('installBtn');
const nameInput = document.getElementById('name');
const priceInput = document.getElementById('price');
const categoryInput = document.getElementById('category');
const addBtn = document.getElementById('addBtn');
const list = document.getElementById('list');
const totalEl = document.getElementById('total');
const countEl = document.getElementById('count');
const exportBtn = document.getElementById('exportBtn');
const clearBtn = document.getElementById('clearBtn');
const form = document.getElementById('expense-form');
const searchInput = document.getElementById('searchInput');
const themeBtn = document.getElementById('themeBtn');
const monthFilter = document.getElementById('monthFilter');
const budgetInput = document.getElementById('budgetInput');
const progressFill = document.getElementById('progressFill');
const budgetText = document.getElementById('budgetText');
const doughnutChart = document.getElementById('doughnutChart');
const lineChart = document.getElementById('lineChart');

let expenses = JSON.parse(localStorage.getItem('expenses')) || [];
let doughnut = null, line = null, editIndex = -1, deferredPrompt = null;

window.addEventListener('beforeinstallprompt', e => {
    e.preventDefault();
    deferredPrompt = e;
    installBtn.style.display = 'inline-block';
});

installBtn.addEventListener('click', () => {
    deferredPrompt.prompt();
});

if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js');
}

function checkLock() {
    const pass = localStorage.getItem('appPassword');
    if (!pass) {
        const newPass = prompt('🔐 عيّن كلمة سر للتطبيق لأول مرة:');
        if (newPass) {
            localStorage.setItem('appPassword', btoa(newPass));
            showApp();
        }
    } else if (sessionStorage.getItem('unlocked') === 'true') {
        showApp();
    } else {
        lockScreen.style.display = 'flex';
    }
}

function showApp() {
    lockScreen.style.display = 'none';
    app.style.display = 'block';
    sessionStorage.setItem('unlocked', 'true');
}

unlockBtn.addEventListener('click', () => {
    const pass = btoa(passwordInput.value);
    if (pass === localStorage.getItem('appPassword')) {
        showApp();
    } else {
        lockMsg.textContent = '❌ كلمة السر غلط';
    }
});

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
    progressFill.style.background = percent > 90? '#EF4444' : percent > 70? '#F59E0B' : '#10B981';
    budgetText.textContent = `${monthTotal.toLocaleString()} / ${budget.toLocaleString()} جنيه`;
}

function updateUI() {
    const filtered = getFilteredExpenses();
    const total = filtered.reduce((sum, item) => sum + item.price, 0);
    totalEl.textContent = `${total.toLocaleString()} جنيه`;
    countEl.textContent = filtered.length.toLocaleString();
    renderExpenses(filtered);
    updateCharts(filtered);
    updateBudget();
}

function renderExpenses(items) {
    list.innerHTML = '';
    items.forEach(item => {
        const realIndex = expenses.indexOf(item);
        const li = document.createElement('li');
        li.innerHTML = `
            <div class="expense-info">
                <span class="expense-name">${sanitize(item.name)}</span>
                <span class="expense-meta">${item.category} | 📅 ${item.date}</span>
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
                backgroundColor: ['#6366F1', '#8B5CF6', '#EC4899', '#F59E0B', '#10B981', '#06B6D4'],
                borderWidth: 0
            }]
        },
        options: {
            plugins: {
                legend: {
                    labels: { color: getComputedStyle(document.body).color, font: { family: 'Cairo' } }
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
                backgroundColor: 'rgba(99, 102, 241, 0.1)',
                tension: 0.4,
                fill: true
            }]
        },
        options: {
            plugins: {
                legend: { labels: { color: getComputedStyle(document.body).color, font: { family: 'Cairo' } } }
            },
            scales: {
                y: { ticks: { color: getComputedStyle(document.body).color }, grid: { color: 'rgba(148, 163, 184, 0.1)' } },
                x: { ticks: { color: getComputedStyle(document.body).color }, grid: { color: 'rgba(148, 163, 184, 0.1)' } }
            }
        }
    });
}

form.addEventListener('submit', e => {
    e.preventDefault();
    const name = nameInput.value.trim();
    const price = parseFloat(priceInput.value);
    const category = categoryInput.value;
    if (!name || isNaN(price) || price <= 0 || price > 999999) return alert('⚠️ السعر لازم رقم موجب وأقل من مليون');
    const date = new Date().toISOString().slice(0, 10);
    if (editIndex >= 0) {
        expenses[editIndex] = {...expenses[editIndex], name, price, category };
        editIndex = -1;
        addBtn.textContent = '✨ إضافة المصروف';
    } else {
        if (expenses.length >= 1000) return alert('⚠️ وصلت للحد الأقصى 1000 مصروف');
        expenses.push({ name, price, category, date });
    }
    saveData();
    updateUI();
    form.reset();
});

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

exportBtn.addEventListener('click', () => {
    const blob = new Blob([JSON.stringify(expenses, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `masareefy-${new Date().toISOString().slice(0, 10)}.json`;
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
