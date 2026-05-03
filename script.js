const nameInput = document.getElementById('name');
const priceInput = document.getElementById('price');
const addBtn = document.getElementById('addBtn');
const list = document.getElementById('list');
const totalEl = document.getElementById('total');
const countEl = document.getElementById('count');
const exportBtn = document.getElementById('exportBtn');
const clearBtn = document.getElementById('clearBtn');
const form = document.getElementById('expense-form');
const searchInput = document.getElementById('searchInput');
const themeBtn = document.getElementById('themeBtn');
const chartCanvas = document.getElementById('expenseChart');
let expenses = JSON.parse(localStorage.getItem('expenses')) || [];
let expenseChart = null;
function sanitize(text) {
    const temp = document.createElement('div');
    temp.textContent = text;
    return temp.innerHTML;
}
function saveData() {
    localStorage.setItem('expenses', JSON.stringify(expenses));
}
function updateUI(filteredExpenses = expenses) {
    const total = expenses.reduce((sum, item) => sum + item.price, 0);
    totalEl.textContent = `${total} جنيه`;
    countEl.textContent = expenses.length;
    renderExpenses(filteredExpenses);
    updateChart();
}
function renderExpenses(itemsToRender) {
    list.innerHTML = '';
    itemsToRender.forEach((item, index) => {
        const realIndex = expenses.indexOf(item);
        const li = document.createElement('li');
        li.innerHTML = `
            <span>${sanitize(item.name)}</span>
            <span>${item.price} جنيه</span>
            <button onclick="deleteExpense(${realIndex})">حذف</button>
        `;
        list.appendChild(li);
    });
}
function updateChart() {
    const categories = {};
    expenses.forEach(item => {
        const name = item.name.toLowerCase();
        categories[name] = (categories[name] || 0) + item.price;
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
    if (!name || isNaN(price) || price <= 0 || price > 999999) {
        alert('السعر لازم رقم موجب وأقل من مليون');
        return;
    }
    if (expenses.length >= 1000) {
        alert('وصلت للحد الأقصى 1000 مصروف');
        return;
    }
    expenses.push({ name, price });
    saveData();
    updateUI();
    nameInput.value = '';
    priceInput.value = '';
});
window.deleteExpense = (index) => {
    expenses.splice(index, 1);
    saveData();
    updateUI();
}
searchInput.addEventListener('input', (e) => {
    const searchTerm = e.target.value.toLowerCase();
    const filtered = expenses.filter(item =>
        item.name.toLowerCase().includes(searchTerm)
    );
    renderExpenses(filtered);
});
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
    updateChart();
});
exportBtn.addEventListener('click', () => {
    const dataStr = JSON.stringify(expenses, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `masareefy-V2-${new Date().toISOString().slice(0,10)}.json`;
    a.click();
});
clearBtn.addEventListener('click', () => {
    if (confirm('متأكد عايز تمسح كل المصاريف؟')) {
        expenses = [];
        saveData();
        updateUI();
    }
});
applyTheme();
updateUI();
