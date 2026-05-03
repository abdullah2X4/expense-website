const nameInput = document.getElementById('name');
const priceInput = document.getElementById('price');
const addBtn = document.getElementById('addBtn');
const list = document.getElementById('list');
const totalEl = document.getElementById('total');
const countEl = document.getElementById('count');
const exportBtn = document.getElementById('exportBtn');
const clearBtn = document.getElementById('clearBtn');
const form = document.getElementById('expense-form');

let expenses = JSON.parse(localStorage.getItem('expenses')) || [];

function sanitize(text) {
    const temp = document.createElement('div');
    temp.textContent = text;
    return temp.innerHTML;
}

function saveData() {
    localStorage.setItem('expenses', JSON.stringify(expenses));
}

function updateUI() {
    const total = expenses.reduce((sum, item) => sum + item.price, 0);
    totalEl.textContent = `${total} جنيه`;
    countEl.textContent = expenses.length;
}

function renderExpenses() {
    list.innerHTML = '';
    expenses.forEach((item, index) => {
        const li = document.createElement('li');
        li.innerHTML = `
            <span>${sanitize(item.name)}</span>
            <span>${item.price} جنيه</span>
            <button onclick="deleteExpense(${index})">حذف</button>
        `;
        list.appendChild(li);
    });
    updateUI();
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
    renderExpenses();
    nameInput.value = '';
    priceInput.value = '';
});

window.deleteExpense = (index) => {
    expenses.splice(index, 1);
    saveData();
    renderExpenses();
}

exportBtn.addEventListener('click', () => {
    const dataStr = JSON.stringify(expenses, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `masareefy-${new Date().toISOString().slice(0,10)}.json`;
    a.click();
});

clearBtn.addEventListener('click', () => {
    if (confirm('متأكد عايز تمسح كل المصاريف؟')) {
        expenses = [];
        saveData();
        renderExpenses();
    }
});

renderExpenses();
