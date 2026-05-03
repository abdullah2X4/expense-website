// ===== مصاريفي V1.0 SECURE - الكود الآمن كامل =====
// كل سطر هنا مكتوب عشان يحمي موقعك

const nameInput = document.getElementById('name');
const priceInput = document.getElementById('price');
const addBtn = document.getElementById('addBtn');
const list = document.getElementById('list');
const totalEl = document.getElementById('total');
const countEl = document.getElementById('count');
const exportBtn = document.getElementById('exportBtn');
const clearBtn = document.getElementById('clearBtn');

// بنجيب الداتا القديمة من المتصفح أو نبدأ فاضي
let expenses = JSON.parse(localStorage.getItem('expenses')) || [];

// 1. أهم دالة حماية: تنظيف النص من XSS
function sanitize(text) {
    const temp = document.createElement('div');
    temp.textContent = text; // دي بتحول <script> لنص عادي
    return temp.innerHTML;
}

// 2. دالة الحفظ الآمن عشان المتصفح ميضربش
function saveData() {
    try {
        localStorage.setItem('expenses', JSON.stringify(expenses));
    } catch (e) {
        alert('مساحة التخزين اتملت. امسح مصاريف قديمة عشان تضيف جديد');
    }
}

// 3. دالة الإضافة - فيها درع الحماية V1 كامل
function addExpense() {
    const name = nameInput.value.trim();
    const price = parseFloat(priceInput.value);

    // الدرع: Validation كامل ضد أي Input غلط
    if (name === "") return alert("اكتب اسم المصروف الأول");
    if (name.length > 50) return alert("الاسم طويل جداً. آخرك 50 حرف");
    if (isNaN(price) || price <= 0) return alert("السعر لازم رقم موجب أكبر من صفر");
    if (price > 1000000) return alert("مليون جنيه في مصروف؟ اهدى على نفسك 😂");
    if (expenses.length >= 1000) return alert("وصلت للحد الأقصى 1000 مصروف. امسح القديم");

    expenses.push({
        id: Date.now(), // ID فريد عشان الحذف
        name: sanitize(name), // بنظف الاسم قبل ما نحفظه
        price: price
    });

    saveData();
    render();
    nameInput.value = '';
    priceInput.value = '';
    nameInput.focus(); // يرجع الكيبورد لخانة الاسم
}

// 4. دالة العرض - آمنة 100% من XSS
function render() {
    list.innerHTML = '';
    let total = 0;

    expenses.forEach(item => {
        total += item.price;
        const li = document.createElement('li');

        // بنستخدم textContent مش innerHTML عشان الأمان
        const nameSpan = document.createElement('span');
        nameSpan.textContent = item.name; // آمن حتى لو الاسم فيه <script>
        
        const priceSpan = document.createElement('span');
        priceSpan.textContent = `${item.price} جنيه`;

        li.appendChild(nameSpan);
        li.appendChild(priceSpan);

        const delBtn = document.createElement('
