// ============================================================
// نظام راشد V31 - نسخة مبسطة شغالة
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
let appData = { users: {}, currentUser: null, adminPin: '1234' };
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
            const parsed = JSON.parse(raw);
            appData = parsed;
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
function toggleAuthMode() {
    const login = document.getElementById('loginForm');
    const register = document.getElementById('registerForm');
    const forgot = document.getElementById('forgotForm');
    if (login) login.style.display = login.style.display === 'none' ? 'block' : 'none';
    if (register) register.style.display = register.style.display === 'none' ? 'block' : 'none';
    if (forgot) forgot.style.display = 'none';
}

function showForgotPassword() {
    document.getElementById('loginForm').style.display = 'none';
    document.getElementById('registerForm').style.display = 'none';
    document.getElementById('forgotForm').style.display = 'block';
}

function showLoginForm() {
    document.getElementById('loginForm').style.display = 'block';
    document.getElementById('registerForm').style.display = 'none';
    document.getElementById('forgotForm').style.display = 'none';
}

async function handleLogin() {
    const username = document.getElementById('loginUser').value.trim();
    const pass = document.getElementById('loginPass').value.trim();
    const email = username + '@rashed.com';
    
    if (!username || !pass) {
        showToast('⚠️ أدخل اسم المستخدم وكلمة المرور');
        return;
    }
    
    try {
        const { auth } = initFirebase();
        const result = await auth.signInWithEmailAndPassword(email, pass);
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
    } catch(error) {
        if (error.code === 'auth/user-not-found') {
            showToast('❌ اسم المستخدم غير موجود');
        } else if (error.code === 'auth/wrong-password') {
            showToast('❌ كلمة المرور خطأ');
        } else {
            showToast('❌ ' + error.message);
        }
    }
}

async function handleRegister() {
    const username = document.getElementById('regUser').value.trim();
    const fullName = document.getElementById('regFullName').value.trim();
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
    
    try {
        const { auth, db } = initFirebase();
        const result = await auth.createUserWithEmailAndPassword(email, pass);
        const user = result.user;
        
        await db.ref('users/' + user.uid + '/data').set({
            sales: [], purchases: [], products: [], clients: [],
            treasury: 0, treasuryLog: [], expenses: [],
            collections: [], supplierPayments: [],
            saleCounter: 0, purchaseCounter: 0
        });
        
        appData.currentUser = user.uid;
        appData.users[user.uid] = {
            displayName: username,
            fullName: fullName,
            data: {
                sales: [], purchases: [], products: [], clients: [],
                treasury: 0, treasuryLog: [], expenses: [],
                collections: [], supplierPayments: [],
                saleCounter: 0, purchaseCounter: 0
            }
        };
        saveLocal();
        enterApp();
        showToast('✅ تم إنشاء الحساب');
    } catch(error) {
        if (error.code === 'auth/email-already-in-use') {
            showToast('⚠️ هذا الاسم مستخدم');
        } else {
            showToast('❌ ' + error.message);
        }
    }
}

async function sendResetPassword() {
    const username = document.getElementById('resetUser').value.trim();
    const email = username + '@rashed.com';
    if (!username) {
        showToast('⚠️ أدخل اسم المستخدم');
        return;
    }
    try {
        const { auth } = initFirebase();
        await auth.sendPasswordResetEmail(email);
        showToast('✅ تم إرسال رابط إعادة التعيين');
        showLoginForm();
    } catch(error) {
        showToast('❌ ' + error.message);
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
        enterApp();
        return true;
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
    
    document.getElementById('clientList').innerHTML = (data.clients || []).map(c => `
        <div class="list-item"><div><strong>${c.name}</strong></div></div>
    `).join('') || '<div style="text-align:center;color:#999;padding:10px;">لا توجد جهات اتصال</div>';
    
    document.getElementById('productList').innerHTML = (data.products || []).map(p => `
        <div class="list-item"><div><strong>${p.name}</strong></div></div>
    `).join('') || '<div style="text-align:center;color:#999;padding:10px;">لا توجد منتجات</div>';
}

// ============================================================
// 8. الرسوم البيانية
// ============================================================
function drawCharts() {
    const data = getData();
    const sales = data.sales || [];
    const expenses = data.expenses || [];
    const collections = data.collections || [];
    const salesTotal = sales.reduce((s, i) => s + i.total, 0);
    const expensesTotal = expenses.reduce((s, i) => s + i.amount, 0);
    const collectionsTotal = collections.reduce((s, i) => s + i.amount, 0);
    const treasury = data.treasury || 0;
    
    if (chartInstances.sales) chartInstances.sales.destroy();
    chartInstances.sales = new Chart(document.getElementById('salesChart'), {
        type: 'bar',
        data: {
            labels: ['مبيعات', 'مصروفات', 'تحصيل'],
            datasets: [{ label: 'الحركة المالية', data: [salesTotal, expensesTotal, collectionsTotal], backgroundColor: ['#2E4057', '#E17055', '#FDCB6E'] }]
        },
        options: { plugins: { legend: { display: false } } }
    });
    
    if (chartInstances.treasury) chartInstances.treasury.destroy();
    chartInstances.treasury = new Chart(document.getElementById('treasuryChart'), {
        type: 'doughnut',
        data: {
            labels: ['الخزنة', 'مصروفات'],
            datasets: [{ data: [treasury, expensesTotal], backgroundColor: ['#2E4057', '#E17055'] }]
        }
    });
}

// ============================================================
// 9. الذكاء الاصطناعي
// ============================================================
function showAIReport() {
    const data = getData();
    const sales = data.sales || [];
    const purchases = data.purchases || [];
    const expenses = data.expenses || [];
    const totalSales = sales.reduce((s, i) => s + i.total, 0);
    const totalPurchases = purchases.reduce((s, i) => s + i.total, 0);
    const totalExpenses = expenses.reduce((s, i) => s + i.amount, 0);
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
// 11. ربط الأزرار
// ============================================================
document.addEventListener('DOMContentLoaded', function() {
    console.log('✅ DOM loaded');
    
    // ربط أزرار الدخول
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
    }
    
    const backToLoginBtn = document.getElementById('backToLoginBtn');
    if (backToLoginBtn) {
        backToLoginBtn.addEventListener('click', toggleAuthMode);
    }
    
    const showForgotBtn = document.getElementById('showForgotBtn');
    if (showForgotBtn) {
        showForgotBtn.addEventListener('click', showForgotPassword);
    }
    
    const backFromForgotBtn = document.getElementById('backFromForgotBtn');
    if (backFromForgotBtn) {
        backFromForgotBtn.addEventListener('click', showLoginForm);
    }
    
    const resetBtn = document.getElementById('resetBtn');
    if (resetBtn) {
        resetBtn.addEventListener('click', sendResetPassword);
    }
    
    // الضغط على Enter في حقول الدخول
    const loginUser = document.getElementById('loginUser');
    const loginPass = document.getElementById('loginPass');
    if (loginUser && loginPass) {
        loginUser.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') handleLogin();
        });
        loginPass.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') handleLogin();
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
