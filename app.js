// 1. استيراد Firebase v9 من الـ CDN
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-auth.js";
import { getFirestore, collection, addDoc, onSnapshot, query, where, orderBy, doc, deleteDoc, updateDoc } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-analytics.js";

// 2. الكونفج بتاعك
const firebaseConfig = {
  apiKey: "AIzaSyBS3FCovS0LmOGgWSIOxoL3kiKe5mjkl1k",
  authDomain: "masarefy-v6.firebaseapp.com",
  projectId: "masarefy-v6",
  storageBucket: "masarefy-v6.firebasestorage.app",
  messagingSenderId: "362855388821",
  appId: "1:362855388821:web:6bc34c415c520f60102d9c",
  measurementId: "G-LNXCG5P1BJ"
};

// 3. تهيئة Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const analytics = getAnalytics(app);

// 4. كود صفحة اللوجن
if (window.location.pathname.includes('login')) {
    const loginBtn = document.getElementById('loginBtn');
    const googleBtn = document.getElementById('googleBtn');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const errorDiv = document.getElementById('error');

    // تسجيل بالإيميل
    if (loginBtn) {
        loginBtn.addEventListener('click', async () => {
            const email = emailInput.value;
            const password = passwordInput.value;
            
            if (!email || !password) {
                errorDiv.textContent = 'املأ كل الحقول';
                errorDiv.classList.remove('hidden');
                return;
            }

            try {
                await signInWithEmailAndPassword(auth, email, password);
                window.location.href = 'index.html';
            } catch (error) {
                console.error(error);
                errorDiv.textContent = 'خطأ: ' + error.code;
                errorDiv.classList.remove('hidden');
            }
        });
    }

    // تسجيل بجوجل
    if (googleBtn) {
        googleBtn.addEventListener('click', async () => {
            const provider = new GoogleAuthProvider();
            try {
                await signInWithPopup(auth, provider);
                window.location.href = 'index.html';
            } catch (error) {
                console.error(error);
                errorDiv.textContent = 'خطأ جوجل: ' + error.code;
                errorDiv.classList.remove('hidden');
            }
        });
    }

    // لو مسجل دخول بالفعل روح للرئيسية
    onAuthStateChanged(auth, (user) => {
        if (user) {
            window.location.href = 'index.html';
        }
    });
}

// 5. كود الصفحة الرئيسية index.html
if (window.location.pathname.includes('index') || window.location.pathname === '/' || window.location.pathname.endsWith('/expense-website/')) {
    const logoutBtn = document.getElementById('logoutBtn');
    
    // زرار تسجيل الخروج
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            await signOut(auth);
            window.location.href = 'login.html';
        });
    }

    // حماية الصفحة - لو مش مسجل دخول ارجع للوجن
    onAuthStateChanged(auth, (user) => {
        if (!user) {
            window.location.href = 'login.html';
        } else {
            console.log('مسجل دخول:', user.email);
            // هنا تحط باقي كود index.html بتاع المصاريف
        }
    });
}
