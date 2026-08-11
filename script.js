// ============================================================
// نظام راشد V31 - نسخة مبسطة شغالة 100%
// ============================================================

// ============================================================
// 1. إعدادات Firebase
// ============================================================
const firebaseConfig = {
    apiKey: "AIzaSyCQVcCAkZpeL9F9KADI5PtVanwTwO3SH5Y",
    authDomain: "smart-task-manager-d2a71.firebaseapp.com",
    databaseURL: "https://smart-task-manager-d2a71-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "smart-task-manager-d2a71",
    storageBucket: "smart-task-manager-d2a71.firebasestorage.app",
    messagingSenderId: "669004983540",
    appId: "1:669004983540:web:285edca38108f02f1e82a1"
};

// ============================================================
// 2. المتغيرات العامة
// ============================================================
let appData = { users: {}, currentUser: null };
let firebaseApp = null, firebaseAuth = null, firebaseDb = null;
let chartInstances = {};

// ============================================================
// 3. تهيئة Firebase
// ============================================================
function initFirebase() {
    try {
        if (!firebaseApp) {
            firebaseApp = firebase.initializeApp(firebaseConfig);
            firebaseAuth = firebase.auth(firebaseApp);
            firebaseDb = firebase.database(firebaseApp);
            console.log('✅ Firebase initialized');
        }
    } catch(e) {
        console.error('Firebase error:', e);
    }
    return { app: firebaseApp, auth: firebaseAuth, db: firebaseDb };
}

// ============================================================
// 4. البيانات
// ============================================================
function loadLocal() {
    try {
        const raw = localStorage.getItem('RashedV31');
        if (raw) {
            appData = JSON.parse(raw);
        }
    } catch(e) {}
}

function saveLocal() {
    try {
        localStorage.setItem('RashedV31', JSON.stringify(appData));
    } catch(e) {}
}

function getData() {
    if (!appData.currentUser || !appData.users[appData.currentUser]) {
        return {
            sales: [], purchases: [], products: [], clients: [],
            treasury: 0, treasuryLog: [], expenses: [],
            collections: [], supplierPayments: [],
            saleCounter: 0, purchaseCounter: 0
        };
    }
    return appData.users[appData.currentUser].data || {};
}

// ============================================================
// 5. الدخول
// ============================================================
function showLoginForm() {
    document.getElementById('loginForm').style.display = 'block';
    document.getElementById('registerForm').style.display = 'none';
    document.getElementById('forgotForm').style.display = 'none';
}

function toggleAuthMode() {
    const login = document.getElementById('loginForm');
    const register = document.getElementById('registerForm');
    if (login.style.display === 'none') {
        login.style.display = 'block';
        register.style.display = 'none';
        document.getElementById('forgotForm').style.display = 'none';
    } else {
        login.style.display = 'none';
        register.style.display = 'block';
        document.getElementById('forgotForm').style.display = 'none';
    }
}

function showForgotPassword() {
    document.getElementById('loginForm').style.display = 'none';
    document.getElementById('registerForm').style.display = 'none';
    document.getElementById('forgotForm').style.display = 'block';
}

function handleLogin() {
    const username = document.getElementById('loginUser').value.trim();
    const pass = document.getElementById('loginPass').value.trim();
    const email = username + '@rashed.com';
    
    if (!username || !pass) {
        showToast('⚠️ أدخل اسم المستخدم وكلمة المرور');
        return;
    }
    
    showToast('⏳ جاري الدخول...');
    
    try {
        const { auth } = initFirebase();
        auth.signInWithEmailAndPassword(email, pass)
            .then(result => {
                const user = result.user;
                appData.currentUser = user.uid;
                if (!appData.users[user.uid]) {
                    appData.users[user.uid] = {
                        displayName: username,
                        data: {
                            sales: [], purchases: [], products: [], clients: [],
                            treasury: 0, treasuryLog: [], expenses: [],
                            collections: [], supplierPayments: [],
                            saleCounter: 0, purchaseCounter: 0
                        }
                    };
                }
                saveLocal();
                enterApp();
                showToast('✅ مرحباً ' + username);
            })
            .catch(error => {
                console.error('Login error:', error);
                if (error.code === 'auth/user-not-found') {
                    showToast('❌ اسم المستخدم غير موجود');
                } else if (error.code === 'auth/wrong-password') {
                    showToast('❌ كلمة المرور خطأ');
                } else {
                    showToast('❌ ' + error.message);
                }
            });
    } catch(e) {
        showToast('❌ خطأ في الاتصال');
    }
}

function handleRegister() {
    const username = document.getElementById('regUser').value.trim();
    const fullName = document.getElementById('regFullName').value.trim();
    const phone = document.getElementById('regPhone').value.trim();
    const address = document.getElementById('regAddress').value.trim();
    const pass = document.getElementById('regPass').value.trim();
    const confirm = document.getElementById('regPassConfirm').value.trim();
    const email = username + '@rashed.com';
    
    if (!username || username.length < 3) {
        showToast('⚠️ 3 أحرف على الأقل');
        return;
    }
    if (pass.length < 6) {
        showToast('⚠️ 6 أحرف على الأقل');
        return;
    }
    if (pass !== confirm) {
        showToast('⚠️ كلمة المرور غير متطابقة');
        return;
    }
    if (!fullName) {
        showToast('⚠️ أدخل الاسم الكامل');
        return;
    }
    
    showToast('⏳ جاري إنشاء الحساب...');
    
    try {
        const { auth, db } = initFirebase();
        auth.createUserWithEmailAndPassword(email, pass)
            .then(result => {
                const user = result.user;
                return db.ref('users/' + user.uid + '/data').set({
                    sales: [], purchases: [], products: [], clients: [],
                    treasury: 0, treasuryLog: [], expenses: [],
                    collections: [], supplierPayments: [],
                    saleCounter: 0, purchaseCounter: 0
                }).then(() => user);
            })
            .then(user => {
                appData.currentUser = user.uid;
                appData.users[user.uid] = {
                    displayName: username,
                    fullName: fullName,
                    phone: phone,
                    address: address,
                    data: {
                        sales: [], purchases: [], products: [], clients: [],
                        treasury: 0, treasuryLog: [], expenses: [],
                        collections: [], supplierPayments: [],
                        saleCounter: 0, purchaseCounter: 0
                    }
                };
                saveLocal();
                enterApp();
                showToast('✅ تم إنشاء الحساب بنجاح');
            })
            .catch(error => {
                console.error('Register error:', error);
                if (error.code === 'auth/email-already-in-use') {
                    showToast('⚠️ هذا الاسم مستخدم بالفعل');
                } else {
                    showToast('❌ ' + error.message);
                }
            });
    } catch(e) {
        showToast('❌ خطأ في الاتصال');
    }
}

function sendResetPassword() {
    const username = document.getElementById('resetUser').value.trim();
    const email = username + '@rashed.com';
    if (!username) {
        showToast('⚠️ أدخل اسم المستخدم');
        return;
    }
    showToast('⏳ جاري الإرسال...');
    try {
        const { auth } = initFirebase();
        auth.sendPasswordResetEmail(email)
            .then(() => {
                showToast('✅ تم إرسال رابط إعادة التعيين');
                showLoginForm();
            })
            .catch(error => {
                showToast('❌ ' + error.message);
            });
    } catch(e) {
        showToast('❌ خطأ في الاتصال');
    }
}

function logout() {
    if (confirm('تسجيل الخروج؟')) {
        const { auth } = initFirebase();
        auth.signOut().then(() => {
            appData.currentUser = null;
            saveLocal();
            location.reload();
        });
    }
}

function enterApp() {
    document.getElementById('authContainer').style.display = 'none';
    document.getElementById('appContainer').style.display = 'block';
    const dn = appData.users[appData.currentUser]?.fullName || 
               appData.users[appData.currentUser]?.displayName || 'مستخدم';
    document.getElementById('userDisplay').textContent = dn;
    updateUI();
    switchPage('dashboard');
}

function autoLogin() {
    if (appData.currentUser && appData.users[appData.currentUser]) {
        // التحقق من Firebase Auth
        const { auth } = initFirebase();
        if (auth.currentUser) {
            enterApp();
            return true;
        } else {
            // لو المستخدم مش موجود في Firebase، نسحب الجلسة
            appData.currentUser = null;
            saveLocal();
            return false;
        }
    }
    return false;
}

// ============================================================
// 6. التنقل بين الصفحات
// ============================================================
function switchPage(page) {
    document.querySelectorAll('.page').forEach(el => el.classList.remove('active'));
    const target = document.getElementById('page-' + page);
    if (target) target.classList.add('active');
    if (page === 'dashboard') drawCharts();
}

// ============================================================
// 7. تحديث الواجهة
// ============================================================
function updateUI() {
    const data = getData();
    document.getElementById('treasuryDisplay').textContent = data.treasury || 0;
}

// ============================================================
// 8. الرسوم البيانية
// ============================================================
function drawCharts() {
    const data = getData();
    const sales = data.sales || [];
    const expenses = data.expenses || [];
    const collections = data.collections || [];
    const salesTotal = sales.reduce((s, i) => s + (i.total || 0), 0);
    const expensesTotal = expenses.reduce((s, i) => s + (i.amount || 0), 0);
    const collectionsTotal = collections.reduce((s, i) => s + (i.amount || 0), 0);
    const treasury = data.treasury || 0;
    
    const salesChart = document.getElementById('salesChart');
    if (salesChart) {
        if (chartInstances.sales) chartInstances.sales.destroy();
        chartInstances.sales = new Chart(salesChart, {
            type: 'bar',
            data: {
                labels: ['مبيعات', 'مصروفات', 'تحصيل'],
                datasets: [{ label: 'الحركة المالية', data: [salesTotal, expensesTotal, collectionsTotal], backgroundColor: ['#2E4057', '#E17055', '#FDCB6E'] }]
            },
            options: { plugins: { legend: { display: false } } }
        });
    }
    
    const treasuryChart = document.getElementById('treasuryChart');
    if (treasuryChart) {
        if (chartInstances.treasury) chartInstances.treasury.destroy();
        chartInstances.treasury = new Chart(treasuryChart, {
            type: 'doughnut',
            data: {
                labels: ['الخزنة', 'مصروفات'],
                datasets: [{ data: [treasury, expensesTotal], backgroundColor: ['#2E4057', '#E17055'] }]
            }
        });
    }
}

// ============================================================
// 9. الذكاء الاصطناعي
// ============================================================
function showAIReport() {
    const data = getData();
    const sales = data.sales || [];
    const purchases = data.purchases || [];
    const expenses = data.expenses || [];
    const totalSales = sales.reduce((s, i) => s + (i.total || 0), 0);
    const totalPurchases = purchases.reduce((s, i) => s + (i.total || 0), 0);
    const totalExpenses = expenses.reduce((s, i) => s + (i.amount || 0), 0);
    const profit = totalSales - totalPurchases - totalExpenses;
    let report = '🤖 تحليل الذكاء الاصطناعي\n\n';
    report += '📊 إجمالي المبيعات: ' + totalSales + ' ج.م\n';
    report += '📉 إجمالي المشتريات: ' + totalPurchases + ' ج.م\n';
    report += '💸 إجمالي المصروفات: ' + totalExpenses + ' ج.م\n';
    report += '💰 صافي الربح: ' + profit + ' ج.م\n\n';
    if (profit > 0) report += '✅ عملك يحقق أرباحاً.\n';
    else report += '⚠️ عملك يحقق خسائر.\n';
    alert(report);
}

// ============================================================
// 10. Toast
// ============================================================
function showToast(msg) {
    const t = document.getElementById('toast');
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(t._timer);
    t._timer = setTimeout(() => t.classList.remove('show'), 3000);
}

// ============================================================
// 11. ربط الأزرار - الطريقة الصحيحة
// ============================================================
document.addEventListener('DOMContentLoaded', function() {
    console.log('✅ DOM loaded - ربط الأزرار');
    
    // ===== أزرار الدخول =====
    const loginBtn = document.getElementById('loginBtn');
    if (loginBtn) {
        loginBtn.addEventListener('click', handleLogin);
        console.log('✅ Login button linked');
    }
    
    const registerBtn = document.getElementById('registerBtn');
    if (registerBtn) {
        registerBtn.addEventListener('click', handleRegister);
        console.log('✅ Register button linked');
    }
    
    const showRegisterBtn = document.getElementById('showRegisterBtn');
    if (showRegisterBtn) {
        showRegisterBtn.addEventListener('click', toggleAuthMode);
        console.log('✅ Show register button linked');
    }
    
    const backToLoginBtn = document.getElementById('backToLoginBtn');
    if (backToLoginBtn) {
        backToLoginBtn.addEventListener('click', showLoginForm);
        console.log('✅ Back to login button linked');
    }
    
    const forgotLink = document.getElementById('forgotLink');
    if (forgotLink) {
        forgotLink.addEventListener('click', showForgotPassword);
        console.log('✅ Forgot password link linked');
    }
    
    const backFromForgotBtn = document.getElementById('backFromForgotBtn');
    if (backFromForgotBtn) {
        backFromForgotBtn.addEventListener('click', showLoginForm);
        console.log('✅ Back from forgot button linked');
    }
    
    const resetBtn = document.getElementById('resetBtn');
    if (resetBtn) {
        resetBtn.addEventListener('click', sendResetPassword);
        console.log('✅ Reset button linked');
    }
    
    // ===== أزرار الخروج =====
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', logout);
        console.log('✅ Logout button linked');
    }
    
    const logoutBtnBottom = document.getElementById('logoutBtnBottom');
    if (logoutBtnBottom) {
        logoutBtnBottom.addEventListener('click', logout);
        console.log('✅ Logout bottom button linked');
    }
    
    // ===== أزرار التنقل =====
    document.querySelectorAll('[data-page]').forEach(el => {
        el.addEventListener('click', function() {
            const page = this.getAttribute('data-page');
            if (page) {
                switchPage(page);
                console.log('✅ Switched to:', page);
            }
        });
    });
    
    // ===== زر الذكاء الاصطناعي =====
    const aiReportBtn = document.getElementById('aiReportBtn');
    if (aiReportBtn) {
        aiReportBtn.addEventListener('click', showAIReport);
        console.log('✅ AI Report button linked');
    }
    
    // ===== الضغط على Enter في حقول الدخول =====
    const loginUser = document.getElementById('loginUser');
    const loginPass = document.getElementById('loginPass');
    if (loginUser) {
        loginUser.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') handleLogin();
        });
    }
    if (loginPass) {
        loginPass.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') handleLogin();
        });
    }
    
    // ===== الضغط على Enter في حقول التسجيل =====
    const regUser = document.getElementById('regUser');
    const regPass = document.getElementById('regPass');
    const regConfirm = document.getElementById('regPassConfirm');
    if (regUser) {
        regUser.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') handleRegister();
        });
    }
    if (regPass) {
        regPass.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') handleRegister();
        });
    }
    if (regConfirm) {
        regConfirm.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') handleRegister();
        });
    }
});

// ============================================================
// 12. بدء التشغيل
// ============================================================
initFirebase();
loadLocal();

if (!autoLogin()) {
    document.getElementById('authContainer').style.display = 'flex';
    document.getElementById('appContainer').style.display = 'none';
}

console.log('✅ نظام راشد V31 يعمل');
