// ============================================================
// نظام راشد V31 - النسخة النهائية المستقرة
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
            return true;
        }
        return true;
    } catch(e) {
        console.error('❌ Firebase init error:', e);
        return false;
    }
}

// ============================================================
// 4. إدارة البيانات
// ============================================================
function loadLocal() {
    try {
        const raw = localStorage.getItem('RashedV31');
        if (raw) {
            appData = JSON.parse(raw);
            console.log('✅ Data loaded from localStorage');
        }
    } catch(e) {
        console.error('❌ Load error:', e);
    }
}

function saveLocal() {
    try {
        localStorage.setItem('RashedV31', JSON.stringify(appData));
        console.log('✅ Data saved to localStorage');
    } catch(e) {
        console.error('❌ Save error:', e);
    }
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
// 5. الدخول والخروج
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
    
    if (!initFirebase()) {
        showToast('❌ خطأ في الاتصال بالسحابة');
        return;
    }
    
    firebaseAuth.signInWithEmailAndPassword(email, pass)
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
            console.error('❌ Login error:', error);
            if (error.code === 'auth/user-not-found') {
                showToast('❌ اسم المستخدم غير موجود');
            } else if (error.code === 'auth/wrong-password') {
                showToast('❌ كلمة المرور خطأ');
            } else if (error.code === 'auth/too-many-requests') {
                showToast('❌ محاولات كثيرة جداً، حاول لاحقاً');
            } else {
                showToast('❌ ' + error.message);
            }
        });
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
        showToast('⚠️ اسم المستخدم 3 أحرف على الأقل');
        return;
    }
    if (pass.length < 6) {
        showToast('⚠️ كلمة المرور 6 أحرف على الأقل');
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
    
    if (!initFirebase()) {
        showToast('❌ خطأ في الاتصال بالسحابة');
        return;
    }
    
    firebaseAuth.createUserWithEmailAndPassword(email, pass)
        .then(result => {
            const user = result.user;
            return firebaseDb.ref('users/' + user.uid + '/data').set({
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
            console.error('❌ Register error:', error);
            if (error.code === 'auth/email-already-in-use') {
                showToast('⚠️ هذا الاسم مستخدم بالفعل');
            } else {
                showToast('❌ ' + error.message);
            }
        });
}

function sendResetPassword() {
    const username = document.getElementById('resetUser').value.trim();
    const email = username + '@rashed.com';
    if (!username) {
        showToast('⚠️ أدخل اسم المستخدم');
        return;
    }
    
    showToast('⏳ جاري الإرسال...');
    
    if (!initFirebase()) {
        showToast('❌ خطأ في الاتصال بالسحابة');
        return;
    }
    
    firebaseAuth.sendPasswordResetEmail(email)
        .then(() => {
            showToast('✅ تم إرسال رابط إعادة التعيين إلى بريدك');
            showLoginForm();
        })
        .catch(error => {
            console.error('❌ Reset error:', error);
            showToast('❌ ' + error.message);
        });
}

function logout() {
    if (confirm('تسجيل الخروج؟')) {
        if (!initFirebase()) {
            appData.currentUser = null;
            saveLocal();
            location.reload();
            return;
        }
        firebaseAuth.signOut().then(() => {
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
        if (!initFirebase()) {
            return false;
        }
        if (firebaseAuth.currentUser) {
            enterApp();
            return true;
        } else {
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
    if (target) {
        target.classList.add('active');
        console.log('✅ Switched to:', page);
    }
    if (page === 'dashboard') drawCharts();
}

// ============================================================
// 7. تحديث الواجهة
// ============================================================
function updateUI() {
    const data = getData();
    const treasuryDisplay = document.getElementById('treasuryDisplay');
    if (treasuryDisplay) {
        treasuryDisplay.textContent = data.treasury || 0;
    }
    console.log('✅ UI updated');
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
    
    try {
        // رسم بياني المبيعات
        const salesChart = document.getElementById('salesChart');
        if (salesChart) {
            if (chartInstances.sales) chartInstances.sales.destroy();
            chartInstances.sales = new Chart(salesChart, {
                type: 'bar',
                data: {
                    labels: ['مبيعات', 'مصروفات', 'تحصيل'],
                    datasets: [{
                        label: 'الحركة المالية',
                        data: [salesTotal, expensesTotal, collectionsTotal],
                        backgroundColor: ['#2E4057', '#E17055', '#FDCB6E']
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } }
                }
            });
        }
        
        // رسم بياني الخزنة
        const treasuryChart = document.getElementById('treasuryChart');
        if (treasuryChart) {
            if (chartInstances.treasury) chartInstances.treasury.destroy();
            chartInstances.treasury = new Chart(treasuryChart, {
                type: 'doughnut',
                data: {
                    labels: ['الخزنة', 'مصروفات'],
                    datasets: [{
                        data: [treasury, expensesTotal],
                        backgroundColor: ['#2E4057', '#E17055']
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false
                }
            });
        }
        console.log('✅ Charts drawn');
    } catch(e) {
        console.error('❌ Chart error:', e);
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
    const totalProducts = data.products ? data.products.length : 0;
    const totalClients = data.clients ? data.clients.length : 0;
    
    let report = '🤖 تحليل الذكاء الاصطناعي\n';
    report += '━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n';
    report += '📊 **إجمالي المبيعات:** ' + totalSales + ' ج.م\n';
    report += '📉 **إجمالي المشتريات:** ' + totalPurchases + ' ج.م\n';
    report += '💸 **إجمالي المصروفات:** ' + totalExpenses + ' ج.م\n';
    report += '💰 **صافي الربح:** ' + profit + ' ج.م\n\n';
    report += '📦 **عدد المنتجات:** ' + totalProducts + '\n';
    report += '👤 **عدد العملاء:** ' + totalClients + '\n\n';
    
    if (profit > 0) {
        report += '✅ ✅ ✅ عملك يحقق أرباحاً.\n';
        if (totalExpenses > (totalSales * 0.3)) {
            report += '⚠️ نصيحة: المصروفات تمثل ' + ((totalExpenses/totalSales)*100).toFixed(1) + '% من المبيعات. حاول تقليلها.\n';
        }
    } else {
        report += '⚠️ ⚠️ ⚠️ عملك يحقق خسائر.\n';
        report += '💡 نصيحة: راجع المصروفات واستراتيجية التسعير.\n';
    }
    
    if (totalProducts === 0) {
        report += '\n📦 تنبيه: لم تضف أي منتجات بعد. ابدأ بإضافة منتجات.\n';
    }
    
    alert(report);
}

// ============================================================
// 10. Toast
// ============================================================
function showToast(msg) {
    const t = document.getElementById('toast');
    if (!t) return;
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(t._timer);
    t._timer = setTimeout(() => t.classList.remove('show'), 3000);
}

// ============================================================
// 11. ربط الأزرار - الطريقة النهائية
// ============================================================
document.addEventListener('DOMContentLoaded', function() {
    console.log('✅ DOM ready - ربط الأزرار...');
    
    // ===== أزرار الدخول =====
    const loginBtn = document.getElementById('loginBtn');
    if (loginBtn) {
        loginBtn.addEventListener('click', handleLogin);
        console.log('✅ Login button');
    }
    
    const registerBtn = document.getElementById('registerBtn');
    if (registerBtn) {
        registerBtn.addEventListener('click', handleRegister);
        console.log('✅ Register button');
    }
    
    const showRegisterBtn = document.getElementById('showRegisterBtn');
    if (showRegisterBtn) {
        showRegisterBtn.addEventListener('click', toggleAuthMode);
        console.log('✅ Show register button');
    }
    
    const backToLoginBtn = document.getElementById('backToLoginBtn');
    if (backToLoginBtn) {
        backToLoginBtn.addEventListener('click', showLoginForm);
        console.log('✅ Back to login button');
    }
    
    const forgotLink = document.getElementById('forgotLink');
    if (forgotLink) {
        forgotLink.addEventListener('click', showForgotPassword);
        console.log('✅ Forgot password link');
    }
    
    const backFromForgotBtn = document.getElementById('backFromForgotBtn');
    if (backFromForgotBtn) {
        backFromForgotBtn.addEventListener('click', showLoginForm);
        console.log('✅ Back from forgot button');
    }
    
    const resetBtn = document.getElementById('resetBtn');
    if (resetBtn) {
        resetBtn.addEventListener('click', sendResetPassword);
        console.log('✅ Reset button');
    }
    
    // ===== أزرار الخروج =====
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', logout);
        console.log('✅ Logout button');
    }
    
    const logoutBtnBottom = document.getElementById('logoutBtnBottom');
    if (logoutBtnBottom) {
        logoutBtnBottom.addEventListener('click', logout);
        console.log('✅ Logout bottom button');
    }
    
    // ===== أزرار التنقل =====
    document.querySelectorAll('[data-page]').forEach(el => {
        el.addEventListener('click', function(e) {
            const page = this.getAttribute('data-page');
            if (page) {
                e.preventDefault();
                switchPage(page);
            }
        });
    });
    console.log('✅ Navigation buttons');
    
    // ===== زر الذكاء الاصطناعي =====
    const aiReportBtn = document.getElementById('aiReportBtn');
    if (aiReportBtn) {
        aiReportBtn.addEventListener('click', showAIReport);
        console.log('✅ AI Report button');
    }
    
    // ===== الضغط على Enter =====
    document.querySelectorAll('input').forEach(input => {
        input.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                const form = this.closest('div');
                if (form) {
                    const loginBtn = form.querySelector('#loginBtn');
                    const registerBtn = form.querySelector('#registerBtn');
                    const resetBtn = form.querySelector('#resetBtn');
                    if (loginBtn) loginBtn.click();
                    else if (registerBtn) registerBtn.click();
                    else if (resetBtn) resetBtn.click();
                }
            }
        });
    });
    
    console.log('✅ All buttons linked successfully');
});

// ============================================================
// 12. بدء التشغيل
// ============================================================
function startApp() {
    console.log('🚀 Starting application...');
    initFirebase();
    loadLocal();
    
    if (!autoLogin()) {
        document.getElementById('authContainer').style.display = 'flex';
        document.getElementById('appContainer').style.display = 'none';
        console.log('📱 Showing login screen');
    }
    
    console.log('✅ نظام راشد V31 جاهز للعمل');
}

// تشغيل التطبيق
startApp();
