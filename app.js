// ===== Masarefy V6 - app.js =====
// نسخة محصنة ضد كل المشاكل

// 1. استيراد Firebase v9 من الـ CDN - بدون Analytics عشان المشاكل
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
    deleteDoc, 
    updateDoc 
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

// 3. تهيئة Firebase مع معالجة الأخطاء
let app, auth, db;
try {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    console.log('Firebase شغال تمام ✅');
} catch (error) {
    console.error('خطأ في تهيئة Firebase:', error);
    document.body.innerHTML = '<div style="padding:20px;text-align:center;font-family:Cairo">خطأ في الاتصال بقاعدة البيانات. تأكد من الإنترنت.</div>';
}

// 4. دالة عرض الأخطاء
function showError(msg) {
    const errorDiv = document.getElementById('error');
    if (errorDiv) {
        errorDiv.textContent = msg;
        errorDiv.classList.remove('hidden');
        setTimeout(() => errorDiv.classList.add('hidden'), 5000);
    } else {
        alert(msg);
    }
}

// 5. ترجمة أخطاء Firebase
function getFirebaseError(code) {
    const errors = {
        'auth/user-not-found': 'الحساب غير موجود',
        'auth/wrong-password': 'كلمة المرور خاطئة',
        'auth/invalid-email': 'الإيميل غير صحيح',
        'auth/user-disabled': 'الحساب موقوف',
        'auth/email-already-in-use': 'الإيميل مستخدم بالفعل',
        'auth/operation-not-allowed': 'طريقة التسجيل غير مفعلة',
        'auth/weak-password': 'كلمة المرور ضعيفة',
        'auth/popup-closed-by-user': 'أغلقت نافذة جوجل',
        'auth/unauthorized-domain': 'الدومين غير مصرح - ضيفه في Firebase',
        'auth/network-request-failed': 'مشكلة في الإنترنت'
    };
    return errors[code] || 'حدث خطأ: ' + code;
}

// 6. كود صفحة اللوجن
if (window.location.pathname.includes('login')) {
    
    // استنى لما الصفحة تحمل
    document.addEventListener('DOMContentLoaded', () => {
        const loginBtn = document.getElementById('loginBtn');
        const googleBtn = document.getElementById('googleBtn');
        const emailInput = document.getElementById('email');
        const passwordInput = document.getElementById('password');

        // تسجيل بالإيميل
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
                    console.error(error);
                    showError(getFirebaseError(error.code));
                    loginBtn.disabled = false;
                    loginBtn.innerHTML = '<i class="fas fa-sign-in-alt"></i><span>تسجيل الدخول</span>';
                }
            });
        }

        // تسجيل بجوجل
        if (googleBtn) {
            googleBtn.addEventListener('click', async () => {
                const provider = new GoogleAuthProvider();
                googleBtn.disabled = true;
                googleBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري التحقق...';
                
                try {
                    await signInWithPopup(auth, provider);
                    window.location.href = 'index.html';
                } catch (error) {
                    console.error(error);
                    showError(getFirebaseError(error.code));
                    googleBtn.disabled = false;
                    googleBtn.innerHTML = '<img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" class="w-5 h-5"><span>تسجيل الدخول بـ Google</span>';
                }
            });
        }

        // Enter يسجل دخول
        if (passwordInput) {
            passwordInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') loginBtn.click();
            });
        }
    });

    // لو مسجل دخول بالفعل روح للرئيسية
    onAuthStateChanged(auth, (user) => {
        if (user) {
            console.log('مسجل بالفعل:', user.email);
            window.location.href = 'index.html';
        }
    });
}

// 7. كود الصفحة الرئيسية index.html
if (window.location.pathname.includes('index') || window.location.pathname === '/' || window.location.pathname.endsWith('/expense-website/')) {
    
    document.addEventListener('DOMContentLoaded', () => {
        const logoutBtn = document.getElementById('logoutBtn');
        const userEmail = document.getElementById('userEmail');
        
        // زرار تسجيل الخروج
        if (logoutBtn) {
            logoutBtn.addEventListener('click', async () => {
                try {
                    await signOut(auth);
                    window.location.href = 'login.html';
                } catch (error) {
                    console.error(error);
                    alert('خطأ في تسجيل الخروج');
                }
            });
        }

        // حماية الصفحة + عرض الإيميل
        onAuthStateChanged(auth, (user) => {
            if (!user) {
                console.log('مش مسجل - رجوع للوجن');
                window.location.href = 'login.html';
            } else {
                console.log('مسجل دخول:', user.email);
                if (userEmail) userEmail.textContent = user.email;
                // هنا تحط باقي كود index.html بتاع المصاريف
            }
        });
    });
}
