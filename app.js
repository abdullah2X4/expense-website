// ===== Masarefy V6 - app.js كامل =====

// 1. استيراد Firebase v9
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-app.js";
import { 
    getAuth, 
    signInWithEmailAndPassword, 
    GoogleAuthProvider, 
    signInWithPopup, 
    onAuthStateChanged, 
    signOut 
} from "https://www.gstatic.com/firebasejs/9.22.1/firebase-auth.js";
import { 
    getFirestore, 
    collection, 
    addDoc, 
    onSnapshot, 
    query, 
    where, 
    orderBy, 
    doc, 
    deleteDoc 
} from "https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js";

// 2. الكونفج بتاعك
const firebaseConfig = {
  apiKey: "AIzaSyBS3FCovS0LmOGgWSIOxoL3kiKe5mjkl1k",
  authDomain: "masarefy-v6.firebaseapp.com",
  projectId: "masarefy-v6",
  storageBucket: "masarefy-v6.firebasestorage.app",
  messagingSenderId: "362855388821",
  appId: "1:362855388821:web:6bc34c415c520f60102d9c"
};

// 3. تهيئة Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// 4. دوال مساعدة
function showError(msg) {
    const errorDiv = document.getElementById('error');
    if (errorDiv) {
        errorDiv.textContent = msg;
        errorDiv.classList.remove('hidden');
        setTimeout(() => errorDiv.classList.add('hidden'), 5000);
    }
}

function getFirebaseError(code) {
    const errors = {
        'auth/user-not-found': 'الحساب غير موجود',
        'auth/wrong-password': 'كلمة المرور خاطئة',
        'auth/invalid-email': 'الإيميل غير صحيح',
        'auth/user-disabled': 'الحساب موقوف',
        'auth/popup-closed-by-user': 'أغلقت نافذة جوجل',
        'auth/unauthorized-domain': 'الدومين غير مصرح - ضيفه في Firebase',
        'auth/network-request-failed': 'مشكلة في الإنترنت'
    };
    return errors[code] || 'حدث خطأ: ' + code;
}

// 5. صفحة اللوجن
if (window.location.pathname.includes('login')) {
    document.addEventListener('DOMContentLoaded', () => {
        const loginBtn = document.getElementById('loginBtn');
        const googleBtn = document.getElementById('googleBtn');
        const emailInput = document.getElementById('email');
        const passwordInput = document.getElementById('password');

        if (loginBtn) {
            loginBtn.addEventListener('click', async () => {
                const email = emailInput.value.trim();
                const password = passwordInput.value;
                
                if (!email ||!password) {
                    showError('املأ كل الحقول');
                    return;
                }

                loginBtn.disabled = true;
                loginBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري التحقق...';

                try {
                    await signInWithEmailAndPassword(auth, email, password);
                    window.location.href = 'index.html';
                } catch (error) {
                    showError(getFirebaseError(error.code));
                    loginBtn.disabled = false;
                    loginBtn.innerHTML = '<i class="fas fa-sign-in-alt"></i><span>تسجيل الدخول</span>';
                }
            });
        }

        if (googleBtn) {
            googleBtn.addEventListener('click', async () => {
                const provider = new GoogleAuthProvider();
                googleBtn.disabled = true;
                googleBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري التحقق...';
                
                try {
                    await signInWithPopup(auth, provider);
                    window.location.href = 'index.html';
                } catch (error) {
                    showError(getFirebaseError(error.code));
                    googleBtn.disabled = false;
                    googleBtn.innerHTML = '<img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" class="w-5 h-5"><span>تسجيل الدخول بـ Google</span>';
                }
            });
        }

        if (passwordInput) {
            passwordInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') loginBtn.click();
            });
        }
    });

    onAuthStateChanged(auth, (user) => {
        if (user) window.location.href = 'index.html';
    });
}

// 6. الصفحة الرئيسية + الداشبورد
if (window.location.pathname.includes('index') || window.location.pathname === '/' || window.location.pathname.endsWith('/expense-website/')) {
    
    document.addEventListener('DOMContentLoaded', () => {
        const logoutBtn = document.getElementById('logoutBtn');
        const userEmail = document.getElementById('userEmail');
        
        if (logoutBtn) {
            logoutBtn.addEventListener('click', async () => {
                await signOut(auth);
                window.location.href = 'login.html';
            });
        }

        onAuthStateChanged(auth, (user) => {
            if (!user) {
                window.location.href = 'login.html';
            } else {
                if (userEmail) userEmail.textContent = user.email;
                initDashboard(user);
            }
        });
    });

    function initDashboard(user) {
        const addBtn = document.getElementById("addBtn");
        const typeSelect = document.getElementById("type");
        const amountInput = document.getElementById("amount");
        const categorySelect = document.getElementById("category");
        const noteInput = document.getElementById("note");
        const transactionsList = document.getElementById("transactionsList");
        
        let transactions = [];
        let expenseChart = null;

        if (addBtn) {
            addBtn.addEventListener("click", async () => {
                const type = typeSelect.value;
                const amount = parseFloat(amountInput.value);
                const category = categorySelect.value;
                const note = noteInput.value.trim();

                if (!amount || amount <= 0) {
                    alert("اكتب مبلغ صحيح");
                    return;
                }

                addBtn.disabled = true;
                addBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري الإضافة...';

                try {
                    await addDoc(collection(db, "transactions"), {
                        userId: user.uid,
                        type,
                        amount,
                        category,
                        note,
                        createdAt: new Date()
                    });
                    
                    amountInput.value = "";
                    noteInput.value = "";
                } catch (error) {
                    console.error(error);
                    alert("خطأ في الإضافة");
                } finally {
                    addBtn.disabled = false;
                    addBtn.innerHTML = '<i class="fas fa-plus"></i><span>إضافة</span>';
                }
            });
        }

        const q = query(
            collection(db, "transactions"),
            where("userId", "==", user.uid),
            orderBy("createdAt", "desc")
        );

        onSnapshot(q, (snapshot) => {
            transactions = [];
            snapshot.forEach((doc) => {
                transactions.push({ id: doc.id,...doc.data() });
            });
            updateUI();
        });

        function updateUI() {
            let totalIncome = 0;
            let totalExpenses = 0;
            const categoryData = {};

            transactions.forEach(t => {
                if (t.type === "income") {
                    totalIncome += t.amount;
                } else {
                    totalExpenses += t.amount;
                    categoryData[t.category] = (categoryData[t.category] || 0) + t.amount;
                }
            });

            const balance = totalIncome - totalExpenses;

            document.getElementById("totalIncome").textContent = totalIncome.toFixed(2) + " ج.م";
            document.getElementById("totalExpenses").textContent = totalExpenses.toFixed(2) + " ج.م";
            document.getElementById("balance").textContent = balance.toFixed(2) + " ج.م";

            if (transactions.length === 0) {
                transactionsList.innerHTML = '<div class="text-center text-gray-500 py-8"><i class="fas fa-inbox text-4xl mb-2"></i><p>لا توجد معاملات بعد</p></div>';
            } else {
                transactionsList.innerHTML = transactions.slice(0, 10).map(t => `
                    <div class="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition">
                        <div class="flex items-center gap-3">
                            <div class="w-10 h-10 ${t.type === "income"? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"} rounded-full flex items-center justify-center">
                                <i class="fas ${t.type === "income"? "fa-arrow-up" : "fa-arrow-down"}"></i>
                            </div>
                            <div>
                                <p class="font-semibold">${t.category}</p>
                                <p class="text-sm text-gray-500">${t.note || "بدون ملاحظة"}</p>
                            </div>
                        </div>
                        <div class="text-left">
                            <p class="font-bold ${t.type === "income"? "text-green-600" : "text-red-600"}">
                                ${t.type === "income"? "+" : "-"}${t.amount.toFixed(2)} ج.م
                            </p>
                            <button onclick="deleteTransaction('${t.id}')" class="text-xs text-red-500 hover:text-red-700">
                                <i class="fas fa-trash"></i> حذف
                            </button>
                        </div>
                    </div>
                `).join("");
            }

            updateChart(categoryData);
        }

        window.deleteTransaction = async (id) => {
            if (confirm("متأكد من الحذف؟")) {
                try {
                    await deleteDoc(doc(db, "transactions", id));
                } catch (error) {
                    alert("خطأ في الحذف");
                }
            }
        };

        function updateChart(data) {
            const ctx = document.getElementById("expenseChart");
            if (!ctx) return;

            if (expenseChart) expenseChart.destroy();

            expenseChart = new Chart(ctx, {
                type: "doughnut",
                data: {
                    labels: Object.keys(data),
                    datasets: [{
                        data: Object.values(data),
                        backgroundColor: ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4", "#ec4899"]
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: true,
                    plugins: { legend: { position: "bottom" } }
                }
            });
        }
    }
}
