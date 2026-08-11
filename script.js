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

    
    // ===== أزرار المبيعات =====
document.getElementById('addSaleBtn')?.addEventListener('click', addProductToSale);
document.getElementById('saveSaleBtn')?.addEventListener('click', saveSaleInvoice);
document.getElementById('clearSaleBtn')?.addEventListener('click', clearSaleInvoice);

// ===== أزرار المشتريات =====
document.getElementById('addPurchaseBtn')?.addEventListener('click', addProductToPurchase);
document.getElementById('savePurchaseBtn')?.addEventListener('click', savePurchaseInvoice);
document.getElementById('clearPurchaseBtn')?.addEventListener('click', clearPurchaseInvoice);

// ===== أزرار المنتجات =====
document.getElementById('addProductBtn')?.addEventListener('click', addProduct);

// ===== أزرار جهات الاتصال =====
document.getElementById('addContactBtn')?.addEventListener('click', addContact);

// ===== أزرار الخزنة =====
document.getElementById('collectDebtBtn')?.addEventListener('click', collectDebt);
document.getElementById('paySupplierBtn')?.addEventListener('click', paySupplier);
document.getElementById('addTreasuryBtn')?.addEventListener('click', addToTreasury);
document.getElementById('withdrawTreasuryBtn')?.addEventListener('click', withdrawTreasury);
document.getElementById('addExpenseBtn')?.addEventListener('click', addExpense);

// ===== أزرار التقارير =====
document.getElementById('reportIncomeBtn')?.addEventListener('click', function() { showReport('income'); });
document.getElementById('reportDailyBtn')?.addEventListener('click', function() { showReport('daily'); });
document.getElementById('reportTrialBtn')?.addEventListener('click', function() { showReport('trial'); });
document.getElementById('reportStatementBtn')?.addEventListener('click', function() { showReport('statement'); });

// ===== أزرار الإعدادات =====
document.getElementById('themeDefault')?.addEventListener('click', function() { changeTheme('default'); });
document.getElementById('themeDark')?.addEventListener('click', function() { changeTheme('dark'); });
document.getElementById('themeBlue')?.addEventListener('click', function() { changeTheme('blue'); });
document.getElementById('themeGreen')?.addEventListener('click', function() { changeTheme('green'); });
document.getElementById('fontSmall')?.addEventListener('click', function() { changeFontSize('small'); });
document.getElementById('fontMedium')?.addEventListener('click', function() { changeFontSize('medium'); });
document.getElementById('fontLarge')?.addEventListener('click', function() { changeFontSize('large'); });
document.getElementById('resetSettingsBtn')?.addEventListener('click', resetAppSettings);
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
// ============================================================
// 13. دوال المبيعات
// ============================================================
let saleItems = [];
let saleTotal = 0;

function initSaleInvoice() {
    const d = getData();
    const today = new Date().toLocaleDateString('ar-EG');
    document.getElementById('saleInvoiceDate').value = today;
    d.saleCounter = (d.saleCounter || 0) + 1;
    document.getElementById('saleInvoiceNumber').value = 'INV-' + String(d.saleCounter).padStart(4, '0');
    saleItems = [];
    saleTotal = 0;
    updateSaleUI();
    saveLocal();
}

function addProductToSale() {
    const name = document.getElementById('saleProductSearch').value.trim();
    const qty = parseInt(document.getElementById('saleQty').value) || 1;
    const price = parseFloat(document.getElementById('salePrice').value) || 0;
    if (!name || price <= 0 || qty <= 0) return showToast('⚠️ أدخل البيانات');
    const total = qty * price;
    saleItems.push({ name, qty, price, total });
    saleTotal += total;
    updateSaleUI();
    document.getElementById('saleProductSearch').value = '';
    document.getElementById('saleQty').value = 1;
    document.getElementById('salePrice').value = '';
    showToast('✅ تم إضافة ' + name);
}

function updateSaleUI() {
    const list = document.getElementById('saleItemsList');
    if (!list) return;
    if (saleItems.length === 0) {
        list.innerHTML = '<div style="text-align:center;padding:30px;color:#999;font-size:13px;">أضف منتجات</div>';
        document.getElementById('saleTotalDisplay').textContent = '0 ج.م';
        updateSaleBalance();
        return;
    }
    let html = '';
    saleItems.forEach((item, index) => {
        html += `<div style="display:grid;grid-template-columns:2fr 1fr 1fr 1fr 1fr;padding:6px 10px;border-bottom:1px solid #eee;font-size:13px;align-items:center;">
            <span>${item.name}</span>
            <span style="text-align:center;">${item.qty}</span>
            <span style="text-align:center;">${item.price} ج.م</span>
            <span style="text-align:center;font-weight:bold;">${item.total} ج.م</span>
            <span style="text-align:center;"><button onclick="removeSaleItem(${index})" style="background:#E17055;color:white;border:none;border-radius:4px;padding:2px 10px;cursor:pointer;font-size:11px;">✕</button></span>
        </div>`;
    });
    list.innerHTML = html;
    document.getElementById('saleTotalDisplay').textContent = saleTotal + ' ج.م';
    updateSaleBalance();
}

function removeSaleItem(index) {
    saleTotal -= saleItems[index].total;
    saleItems.splice(index, 1);
    updateSaleUI();
    showToast('🗑️ تم الحذف');
}

function updateSaleBalance() {
    const paid = parseFloat(document.getElementById('salePaid').value) || 0;
    const balance = saleTotal - paid;
    const el = document.getElementById('saleBalanceDisplay');
    el.textContent = balance + ' ج.م';
    el.style.color = balance > 0 ? '#E17055' : '#00B894';
}

function saveSaleInvoice() {
    const client = document.getElementById('saleClient').value.trim();
    const invNum = document.getElementById('saleInvoiceNumber').value;
    const date = document.getElementById('saleInvoiceDate').value;
    const type = document.getElementById('saleType').value;
    const paid = parseFloat(document.getElementById('salePaid').value) || 0;
    if (!client) return showToast('⚠️ أدخل اسم العميل');
    if (saleItems.length === 0) return showToast('⚠️ أضف منتجات');
    const d = getData();
    const inv = { id: invNum, client, date, type, items: JSON.parse(JSON.stringify(saleItems)), total: saleTotal, paid, balance: saleTotal - paid };
    d.sales.push(inv);
    if (type === 'cash') {
        d.treasury = (d.treasury || 0) + paid;
        d.treasuryLog.push({ desc: 'بيع كاش - ' + client + ' (' + invNum + ')', amount: paid });
    }
    saveLocal();
    showToast('✅ تم حفظ ' + invNum + ' بقيمة ' + saleTotal + ' ج.م');
    clearSaleInvoice();
    updateUI();
}

function clearSaleInvoice() {
    saleItems = [];
    saleTotal = 0;
    document.getElementById('saleClient').value = '';
    document.getElementById('salePaid').value = 0;
    document.getElementById('saleProductSearch').value = '';
    document.getElementById('saleQty').value = 1;
    document.getElementById('salePrice').value = '';
    updateSaleUI();
    initSaleInvoice();
}

// ============================================================
// 14. دوال المشتريات
// ============================================================
let purchaseItems = [];
let purchaseTotal = 0;

function initPurchaseInvoice() {
    const d = getData();
    const today = new Date().toLocaleDateString('ar-EG');
    document.getElementById('purchaseInvoiceDate').value = today;
    d.purchaseCounter = (d.purchaseCounter || 0) + 1;
    document.getElementById('purchaseInvoiceNumber').value = 'PUR-' + String(d.purchaseCounter).padStart(4, '0');
    purchaseItems = [];
    purchaseTotal = 0;
    updatePurchaseUI();
    saveLocal();
}

function addProductToPurchase() {
    const name = document.getElementById('purchaseProductSearch').value.trim();
    const qty = parseInt(document.getElementById('purchaseQty').value) || 1;
    const price = parseFloat(document.getElementById('purchasePrice').value) || 0;
    if (!name || price <= 0 || qty <= 0) return showToast('⚠️ أدخل البيانات');
    const total = qty * price;
    purchaseItems.push({ name, qty, price, total });
    purchaseTotal += total;
    updatePurchaseUI();
    document.getElementById('purchaseProductSearch').value = '';
    document.getElementById('purchaseQty').value = 1;
    document.getElementById('purchasePrice').value = '';
    showToast('✅ تم إضافة ' + name);
}

function updatePurchaseUI() {
    const list = document.getElementById('purchaseItemsList');
    if (!list) return;
    if (purchaseItems.length === 0) {
        list.innerHTML = '<div style="text-align:center;padding:30px;color:#999;font-size:13px;">أضف منتجات</div>';
        document.getElementById('purchaseTotalDisplay').textContent = '0 ج.م';
        updatePurchaseBalance();
        return;
    }
    let html = '';
    purchaseItems.forEach((item, index) => {
        html += `<div style="display:grid;grid-template-columns:2fr 1fr 1fr 1fr 1fr;padding:6px 10px;border-bottom:1px solid #eee;font-size:13px;align-items:center;">
            <span>${item.name}</span>
            <span style="text-align:center;">${item.qty}</span>
            <span style="text-align:center;">${item.price} ج.م</span>
            <span style="text-align:center;font-weight:bold;">${item.total} ج.م</span>
            <span style="text-align:center;"><button onclick="removePurchaseItem(${index})" style="background:#E17055;color:white;border:none;border-radius:4px;padding:2px 10px;cursor:pointer;font-size:11px;">✕</button></span>
        </div>`;
    });
    list.innerHTML = html;
    document.getElementById('purchaseTotalDisplay').textContent = purchaseTotal + ' ج.م';
    updatePurchaseBalance();
}

function removePurchaseItem(index) {
    purchaseTotal -= purchaseItems[index].total;
    purchaseItems.splice(index, 1);
    updatePurchaseUI();
    showToast('🗑️ تم الحذف');
}

function updatePurchaseBalance() {
    const paid = parseFloat(document.getElementById('purchasePaid').value) || 0;
    const balance = purchaseTotal - paid;
    const el = document.getElementById('purchaseBalanceDisplay');
    el.textContent = balance + ' ج.م';
    el.style.color = balance > 0 ? '#E17055' : '#00B894';
}

function savePurchaseInvoice() {
    const supplier = document.getElementById('purchaseSupplier').value.trim();
    const invNum = document.getElementById('purchaseInvoiceNumber').value;
    const date = document.getElementById('purchaseInvoiceDate').value;
    const type = document.getElementById('purchaseType').value;
    const paid = parseFloat(document.getElementById('purchasePaid').value) || 0;
    if (!supplier) return showToast('⚠️ أدخل اسم المورد');
    if (purchaseItems.length === 0) return showToast('⚠️ أضف منتجات');
    const d = getData();
    const inv = { id: invNum, supplier, date, type, items: JSON.parse(JSON.stringify(purchaseItems)), total: purchaseTotal, paid, balance: purchaseTotal - paid };
    d.purchases.push(inv);
    if (type === 'cash') {
        d.treasury = (d.treasury || 0) - paid;
        d.treasuryLog.push({ desc: 'شراء كاش - ' + supplier + ' (' + invNum + ')', amount: -paid });
    }
    saveLocal();
    showToast('✅ تم حفظ ' + invNum + ' بقيمة ' + purchaseTotal + ' ج.م');
    clearPurchaseInvoice();
    updateUI();
}

function clearPurchaseInvoice() {
    purchaseItems = [];
    purchaseTotal = 0;
    document.getElementById('purchaseSupplier').value = '';
    document.getElementById('purchasePaid').value = 0;
    document.getElementById('purchaseProductSearch').value = '';
    document.getElementById('purchaseQty').value = 1;
    document.getElementById('purchasePrice').value = '';
    updatePurchaseUI();
    initPurchaseInvoice();
}

// ============================================================
// 15. دوال المنتجات
// ============================================================
function addProduct() {
    const d = getData();
    const name = document.getElementById('prodName').value.trim();
    const desc = document.getElementById('prodDesc').value.trim();
    const qty = parseInt(document.getElementById('prodQty').value) || 0;
    const buy = parseFloat(document.getElementById('prodBuy').value) || 0;
    const sell = parseFloat(document.getElementById('prodSell').value) || 0;
    const barcode = document.getElementById('prodBarcode').value.trim() || Math.floor(10000000 + Math.random() * 90000000).toString();
    if (!name || qty <= 0) return showToast('⚠️ أدخل الاسم والكمية');
    d.products.push({ id: Date.now().toString(), name, desc, qty, buy, sell, barcode });
    saveLocal();
    document.getElementById('prodName').value = '';
    document.getElementById('prodDesc').value = '';
    document.getElementById('prodQty').value = '';
    document.getElementById('prodBuy').value = '';
    document.getElementById('prodSell').value = '';
    document.getElementById('prodBarcode').value = '';
    updateUI();
    showToast('✅ تم إضافة المنتج - الباركود: ' + barcode);
}

// ============================================================
// 16. دوال جهات الاتصال
// ============================================================
function addContact() {
    const d = getData();
    const name = document.getElementById('contactName').value.trim();
    const phone = document.getElementById('contactPhone').value.trim();
    const address = document.getElementById('contactAddress').value.trim();
    const type = document.getElementById('contactType').value;
    if (!name) return showToast('⚠️ أدخل الاسم');
    d.clients.push({ id: Date.now().toString(), name, phone, address, type });
    saveLocal();
    document.getElementById('contactName').value = '';
    document.getElementById('contactPhone').value = '';
    document.getElementById('contactAddress').value = '';
    updateUI();
    showToast('✅ تم إضافة جهة الاتصال');
}

// ============================================================
// 17. دوال الخزنة
// ============================================================
function collectDebt() {
    const d = getData();
    const client = document.getElementById('collectClient').value.trim();
    const amount = parseFloat(document.getElementById('collectAmount').value);
    if (!client || !amount || amount <= 0) return showToast('⚠️ أدخل البيانات');
    d.treasury = (d.treasury || 0) + amount;
    d.collections.push({ id: Date.now().toString(), client, amount });
    d.treasuryLog.push({ desc: 'تحصيل من ' + client, amount: amount });
    saveLocal();
    document.getElementById('collectClient').value = '';
    document.getElementById('collectAmount').value = '';
    updateUI();
    showToast('✅ تم تحصيل ' + amount + ' ج.م');
}

function paySupplier() {
    const d = getData();
    const supplier = document.getElementById('paySupplier').value.trim();
    const amount = parseFloat(document.getElementById('payAmount').value);
    if (!supplier || !amount || amount <= 0) return showToast('⚠️ أدخل البيانات');
    if (d.treasury < amount) return showToast('⚠️ الرصيد غير كافي');
    d.treasury = (d.treasury || 0) - amount;
    d.supplierPayments.push({ id: Date.now().toString(), supplier, amount });
    d.treasuryLog.push({ desc: 'سداد مورد - ' + supplier, amount: -amount });
    saveLocal();
    document.getElementById('paySupplier').value = '';
    document.getElementById('payAmount').value = '';
    updateUI();
    showToast('✅ تم سداد ' + amount + ' ج.م');
}

function addToTreasury() {
    const d = getData();
    const amount = parseFloat(document.getElementById('treasuryAmount').value);
    if (!amount || amount <= 0) return showToast('⚠️ أدخل مبلغ صحيح');
    d.treasury = (d.treasury || 0) + amount;
    d.treasuryLog.push({ desc: 'إيداع في الخزنة', amount: amount });
    saveLocal();
    document.getElementById('treasuryAmount').value = '';
    updateUI();
    showToast('✅ تم إيداع ' + amount + ' ج.م');
}

function withdrawTreasury() {
    const d = getData();
    const amount = parseFloat(document.getElementById('treasuryAmount').value);
    if (!amount || amount <= 0) return showToast('⚠️ أدخل مبلغ صحيح');
    if (d.treasury < amount) return showToast('⚠️ الرصيد غير كافي');
    d.treasury = (d.treasury || 0) - amount;
    d.treasuryLog.push({ desc: 'سحب من الخزنة', amount: -amount });
    saveLocal();
    document.getElementById('treasuryAmount').value = '';
    updateUI();
    showToast('✅ تم سحب ' + amount + ' ج.م');
}

function addExpense() {
    const d = getData();
    const desc = document.getElementById('expenseDesc').value.trim();
    const amount = parseFloat(document.getElementById('expenseAmount').value);
    if (!desc || !amount || amount <= 0) return showToast('⚠️ أدخل البيانات');
    if (d.treasury < amount) return showToast('⚠️ الرصيد غير كافي');
    d.treasury = (d.treasury || 0) - amount;
    d.expenses.push({ id: Date.now().toString(), desc, amount, date: new Date().toLocaleDateString() });
    d.treasuryLog.push({ desc: 'مصروف: ' + desc, amount: -amount });
    saveLocal();
    document.getElementById('expenseDesc').value = '';
    document.getElementById('expenseAmount').value = '';
    updateUI();
    showToast('✅ تم تسجيل مصروف ' + amount + ' ج.م');
}

// ============================================================
// 18. دوال التقارير
// ============================================================
function showReport(type) {
    const d = getData();
    const sales = d.sales || [];
    const purchases = d.purchases || [];
    const expenses = d.expenses || [];
    const totalSales = sales.reduce((s, i) => s + i.total, 0);
    const totalPurchases = purchases.reduce((s, i) => s + i.total, 0);
    const totalExpenses = expenses.reduce((s, i) => s + i.amount, 0);
    const profit = totalSales - totalPurchases - totalExpenses;
    const today = new Date().toLocaleDateString('ar-EG');
    
    let html = '';
    if (type === 'income') {
        html = `<div style="background:#1e1e2e;border-radius:12px;padding:15px;color:white;">
            <div style="text-align:center;border-bottom:2px solid #00B894;padding-bottom:10px;margin-bottom:15px;">
                <h3 style="margin:0;color:#00B894;">📈 قائمة الدخل</h3>
                <small style="color:#888;">${today}</small>
            </div>
            <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #333;">
                <span>الإيرادات</span>
                <span style="color:#00B894;">${totalSales} ج.م</span>
            </div>
            <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #333;">
                <span>التكاليف</span>
                <span style="color:#E17055;">${totalPurchases} ج.م</span>
            </div>
            <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #333;">
                <span>المصروفات</span>
                <span style="color:#E17055;">${totalExpenses} ج.م</span>
            </div>
            <div style="display:flex;justify-content:space-between;padding-top:10px;margin-top:10px;border-top:2px solid #00B894;font-size:18px;">
                <span style="font-weight:bold;">صافي الربح</span>
                <span style="color:${profit >= 0 ? '#00B894' : '#E17055'};font-weight:bold;">${profit} ج.م</span>
            </div>
        </div>`;
    } else if (type === 'daily') {
        const todaySales = sales.filter(s => s.date === today).reduce((s, i) => s + i.total, 0);
        const todayPurchases = purchases.filter(p => p.date === today).reduce((s, i) => s + i.total, 0);
        const todayExpenses = expenses.filter(e => e.date === today).reduce((s, i) => s + i.amount, 0);
        const todayProfit = todaySales - todayPurchases - todayExpenses;
        html = `<div style="background:#1e1e2e;border-radius:12px;padding:15px;color:white;">
            <div style="text-align:center;border-bottom:2px solid #FDCB6E;padding-bottom:10px;margin-bottom:15px;">
                <h3 style="margin:0;color:#FDCB6E;">📅 تقرير اليوم</h3>
                <small style="color:#888;">${today}</small>
            </div>
            <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #333;">
                <span>مبيعات اليوم</span>
                <span style="color:#00B894;">${todaySales} ج.م</span>
            </div>
            <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #333;">
                <span>مشتريات اليوم</span>
                <span style="color:#E17055;">${todayPurchases} ج.م</span>
            </div>
            <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #333;">
                <span>مصروفات اليوم</span>
                <span style="color:#E17055;">${todayExpenses} ج.م</span>
            </div>
            <div style="display:flex;justify-content:space-between;padding-top:10px;margin-top:10px;border-top:2px solid #FDCB6E;font-size:18px;">
                <span style="font-weight:bold;">صافي ربح اليوم</span>
                <span style="color:${todayProfit >= 0 ? '#00B894' : '#E17055'};font-weight:bold;">${todayProfit} ج.م</span>
            </div>
        </div>`;
    } else if (type === 'trial') {
        const totalAssets = d.treasury || 0;
        const totalLiabilities = sales.filter(s => s.type === 'credit').reduce((s, i) => s + i.total, 0);
        const equity = totalAssets - totalLiabilities;
        html = `<div style="background:#1e1e2e;border-radius:12px;padding:15px;color:white;">
            <div style="text-align:center;border-bottom:2px solid #6C5CE7;padding-bottom:10px;margin-bottom:15px;">
                <h3 style="margin:0;color:#6C5CE7;">📋 ميزان المراجعة</h3>
                <small style="color:#888;">${today}</small>
            </div>
            <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #333;">
                <span>الأصول (الخزنة)</span>
                <span style="color:#00B894;">${totalAssets} ج.م</span>
            </div>
            <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #333;">
                <span>الخصوم (الآجل)</span>
                <span style="color:#E17055;">${totalLiabilities} ج.م</span>
            </div>
            <div style="display:flex;justify-content:space-between;padding-top:10px;margin-top:10px;border-top:2px solid #6C5CE7;font-size:18px;">
                <span style="font-weight:bold;">حقوق الملكية</span>
                <span style="color:${equity >= 0 ? '#00B894' : '#E17055'};font-weight:bold;">${equity} ج.م</span>
            </div>
        </div>`;
    } else if (type === 'statement') {
        html = `<div style="background:#1e1e2e;border-radius:12px;padding:15px;color:white;text-align:center;padding:40px;">
            <p style="color:#aaa;">📋 كشف حساب - جاري التطوير</p>
        </div>`;
    }
    document.getElementById('reportContent').innerHTML = html;
}

// ============================================================
// 19. دوال الإعدادات
// ============================================================
function changeTheme(theme) {
    document.body.className = '';
    if (theme !== 'default') {
        document.body.classList.add('theme-' + theme);
    }
    showToast('✅ تم تغيير السمة');
}

function changeFontSize(size) {
    const sizeMap = { small: '13px', medium: '16px', large: '19px' };
    document.body.style.fontSize = sizeMap[size] || '16px';
    showToast('✅ تم تغيير حجم الخط');
}

function resetAppSettings() {
    if (!confirm('إعادة ضبط الإعدادات؟')) return;
    document.body.className = '';
    document.body.style.fontSize = '16px';
    document.getElementById('soundAlerts').checked = true;
    document.getElementById('popupAlerts').checked = true;
    showToast('✅ تم إعادة ضبط الإعدادات');
}



