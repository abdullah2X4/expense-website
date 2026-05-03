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
const chartCanvas = document.getElementById('expenseChart');

let expenses = JSON.parse(localStorage.getItem('expenses')) || [];
let expenseChart = null;
let editIndex = -1;

function sanitize(text) {
    const temp = document.createElement('div');
    temp.textContent = text;
    return temp.innerHTML;
}

function saveData() {
    localStorage.setItem('expenses', JSON.stringify(expenses));
}

function getFilteredExpenses() {
    const searchTerm = searchInput.value.toLowerCase();
    const selectedMonth = monthFilter.value;
    
    return expenses.filter(item => {
        const matchSearch = item.name.toLowerCase().includes(searchTerm);
        const matchMonth = !selectedMonth || item.date.startsWith(selectedMonth);
        return matchSearch && matchMonth;
    });
}

function updateUI() {
    const filtered = getFilteredExpenses();
    const total = filtered.reduce((sum, item) => sum + item.price, 0);
    totalEl.textContent = `${total} جنيه`;
    countEl.textContent = filtered.length;
    renderExpenses(filtered);
    updateChart(filtered);
}

function renderExpenses(itemsToRender) {
    list.innerHTML = '';
    itemsToRender.forEach((item) => {
        const realIndex = expenses.indexOf(item);
        const li = document.createElement('li');
        li.innerHTML = `
            <div class="expense-info">
                <span class="expense-name">${sanitize(item.name)}</span>
                <span class="expense-meta">${item.category} | ${item.date}</span>
            </div>
            <span class="expense-price">${item.price} جنيه</span>
            <div class="expense-actions">
                <button onclick="editExpense(${realIndex})">تعديل</button>
                <button onclick="deleteExpense(${realIndex})">حذف</button>
            </div>
        `;
        list.appendChild(li);
    });
}

function updateChart(items) {
    const categories = {};
    items.forEach(item => {
        categories[item.category] = (categories[item.category] || 0) + item.price;
    });
    const labels = Object.keys(categories);
    const data = Object.values(categories);
    if (expenseChart) expenseChart.destroy();
    expenseChart = new Chart(chartCanvas, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: ['#00C9A7', '#4D96FF', '#FF6B6B', '#FFD93D', '#6BCB77', '#845EC2']
            }]
        },
        options: {
            plugins: { legend: { labels: { color: getComputedStyle(document.body).color } } }
        }
    });
}

form.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = nameInput.value.trim();
    const price = parseFloat(priceInput.value);
    const category = categoryInput.value;
    
    if (!name || isNaN(price) || price <= 0 || price > 999999) {
        alert('السعر لازم رقم موجب وأقل من مليون');
        return;
    }
    
    const date = new Date().toISOString().slice(0,10);
    
    if (editIndex >= 0) {
        expenses[editIndex] = { name, price, category, date: expenses[editIndex].date };
        editIndex = -1;
        addBtn.textContent = 'إضافة المصروف';
    } else {
        if (expenses.length >= 1000) {
            alert('وصلت للحد الأقصى 1000 مصروف');
            return;
        }
        expenses.push({ name, price, category, date });
    }
    
    saveData();
    updateUI();
    form.reset();
});

window.deleteExpense = (index) => {
    expenses.splice(index, 1);
    saveData();
    updateUI();
}

window.editExpense = (index) => {
    const item = expenses[index];
    nameInput.value = item.name;
    priceInput.value = item.price;
    categoryInput.value = item.category;
    editIndex = index;
    addBtn.textContent = 'تحديث المصروف';
    window.scrollTo(0, 0);
}

searchInput.addEventListener('input', updateUI);
monthFilter.addEventListener('input', updateUI);

function applyTheme() {
    const theme = localStorage.getItem('theme') || 'dark';
    document.body.classList.toggle('light-mode', theme === 'light');
    themeBtn.textContent = theme === 'light'? '🌙' : '☀️';
}

themeBtn.addEventListener('click', () => {
    const current = localStorage.getItem('theme') || 'dark';
    const newTheme = current === 'dark'? 'light' : 'dark';
    localStorage.setItem('theme', newTheme);
    applyTheme();
    updateChart(getFilteredExpenses());
});

exportBtn.addEventListener('click', () => {
    const dataStr = JSON.stringify(expenses, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `masareefy-V3-${new Date().toISOString().slice(0,10)}.json`;
    a.click();
});

clearBtn.addEventListener('click', () => {
    if (confirm('متأكد عايز تمسح كل المصاريف؟')) {
        expenses = [];
        saveData();
        updateUI();
    }
});

monthFilter.value = new Date().toISOString().slice(0,7);
applyTheme();
updateUI();
