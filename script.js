// ============================================================
// نظام راشد V31 - الملف الكامل النهائي
// جميع الدوال في ملف واحد
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
let appData = { users: {}, currentUser: null, adminPin: '1234', activityLog: [] };
let firebaseApp = null, firebaseAuth = null, firebaseDb = null;
let chartInstances = {};
let clickCount = 0;
let clickTimer = null;

// متغيرات المبيعات
let saleItems = [];
let saleTotal = 0;
let returnItems = [];
let returnTotal = 0;

// متغيرات المشتريات
let purchaseItems = [];
let purchaseTotal = 0;
let returnPurchaseItems = [];
let returnPurchaseTotal = 0;

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
        console.error('❌ Firebase error:', e);
    }
    return { app: firebaseApp, auth: firebaseAuth, db: firebaseDb };
}

// ============================================================
// 4. إدارة البيانات
// ============================================================
function loadLocal() {
    try {
        const raw = localStorage.getItem('RashedV31');
        if (raw) {
            appData = JSON.parse(raw);
            if (!appData.activityLog) appData.activityLog = [];
            if (!appData.users) appData.users = {};
        }
    } catch(e) {}
}

function saveLocal() {
    try {
        localStorage.setItem('RashedV31', JSON.stringify(appData));
        syncCloud();
    } catch(e) {}
}

function getData() {
    if (!appData.currentUser || !appData.users[appData.currentUser]) {
        return {
            sales: [], purchases: [], products: [], clients: [], suppliers: [],
            treasury: 0, treasuryLog: [], expenses: [],
            collections: [], supplierPayments: [],
            warehouse: [],
            saleCounter: 0, purchaseCounter: 0,
            returnCounter: 0, returnPurchaseCounter: 0
        };
    }
    const d = appData.users[appData.currentUser].data || {};
    if (!d.sales) d.sales = [];
    if (!d.purchases) d.purchases = [];
    if (!d.products) d.products = [];
    if (!d.clients) d.clients = [];
    if (!d.suppliers) d.suppliers = [];
    if (d.treasury === undefined) d.treasury = 0;
    if (!d.treasuryLog) d.treasuryLog = [];
    if (!d.expenses) d.expenses = [];
    if (!d.collections) d.collections = [];
    if (!d.supplierPayments) d.supplierPayments = [];
    if (!d.warehouse) d.warehouse = [];
    if (d.saleCounter === undefined) d.saleCounter = 0;
    if (d.purchaseCounter === undefined) d.purchaseCounter = 0;
    if (d.returnCounter === undefined) d.returnCounter = 0;
    if (d.returnPurchaseCounter === undefined) d.returnPurchaseCounter = 0;
    return d;
}

function syncCloud() {
    if (!appData.currentUser || !appData.users[appData.currentUser]) return;
    try {
        const { db } = initFirebase();
        const d = appData.users[appData.currentUser].data;
        if (d) db.ref('users/' + appData.currentUser + '/data').set(d);
    } catch(e) {}
}

// ============================================================
// 5. جلب الموقع
// ============================================================
async function getUserLocation() {
    try {
        const r = await fetch('https://ipapi.co/json/');
        const d = await r.json();
        return { ip: d.ip || 'غير معروف', country: d.country_name || 'غير معروف', city: d.city || 'غير معروف', browser: navigator.userAgent || 'غير معروف' };
    } catch(e) {
        return { ip: 'غير معروف', country: 'غير معروف', city: 'غير معروف', browser: navigator.userAgent || 'غير معروف' };
    }
}

// ============================================================
// 6. الدخول والخروج
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

    const { auth } = initFirebase();
    auth.signInWithEmailAndPassword(email, pass)
        .then(result => {
            const user = result.user;
            appData.currentUser = user.uid;
            if (!appData.users[user.uid]) {
                appData.users[user.uid] = {
                    displayName: username,
                    data: {
                        sales: [], purchases: [], products: [], clients: [], suppliers: [],
                        treasury: 0, treasuryLog: [], expenses: [],
                        collections: [], supplierPayments: [],
                        warehouse: [],
                        saleCounter: 0, purchaseCounter: 0,
                        returnCounter: 0, returnPurchaseCounter: 0
                    }
                };
            }
            saveLocal();
            enterApp();
            showToast('✅ مرحباً ' + username);
        })
        .catch(error => {
            if (error.code === 'auth/user-not-found') showToast('❌ اسم المستخدم غير موجود');
            else if (error.code === 'auth/wrong-password') showToast('❌ كلمة المرور خطأ');
            else showToast('❌ ' + error.message);
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

    const { auth, db } = initFirebase();
    auth.createUserWithEmailAndPassword(email, pass)
        .then(result => {
            const user = result.user;
            return db.ref('users/' + user.uid + '/data').set({
                sales: [], purchases: [], products: [], clients: [], suppliers: [],
                treasury: 0, treasuryLog: [], expenses: [],
                collections: [], supplierPayments: [],
                warehouse: [],
                saleCounter: 0, purchaseCounter: 0,
                returnCounter: 0, returnPurchaseCounter: 0
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
                    sales: [], purchases: [], products: [], clients: [], suppliers: [],
                    treasury: 0, treasuryLog: [], expenses: [],
                    collections: [], supplierPayments: [],
                    warehouse: [],
                    saleCounter: 0, purchaseCounter: 0,
                    returnCounter: 0, returnPurchaseCounter: 0
                }
            };
            saveLocal();
            enterApp();
            showToast('✅ تم إنشاء الحساب بنجاح');
        })
        .catch(error => {
            if (error.code === 'auth/email-already-in-use') showToast('⚠️ هذا الاسم مستخدم');
            else showToast('❌ ' + error.message);
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
    const { auth } = initFirebase();
    auth.sendPasswordResetEmail(email)
        .then(() => {
            showToast('✅ تم إرسال رابط إعادة التعيين');
            showLoginForm();
        })
        .catch(error => {
            showToast('❌ ' + error.message);
        });
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
    const dn = appData.users[appData.currentUser]?.fullName || appData.users[appData.currentUser]?.displayName || 'مستخدم';
    document.getElementById('userDisplay').textContent = dn;
    document.getElementById('settingsUser').textContent = dn;
    updateUI();
    updateDashboardStats();
    switchPage('dashboard');
}

function autoLogin() {
    if (appData.currentUser && appData.users[appData.currentUser]) {
        const { auth } = initFirebase();
        if (auth.currentUser) {
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
// 7. التنقل بين الصفحات
// ============================================================
function switchPage(page) {
    document.querySelectorAll('.page').forEach(el => el.classList.remove('active'));
    const target = document.getElementById('page-' + page);
    if (target) target.classList.add('active');
    if (page === 'dashboard') {
        drawCharts();
        updateDashboardStats();
    }
    if (page === 'sales') initSaleInvoice();
    if (page === 'purchases') initPurchaseInvoice();
    if (page === 'reports') updateReportSelects();
    if (page === 'warehouse') updateWarehouseLog();
}

// ============================================================
// 8. تحديث الواجهة العامة
// ============================================================
function updateUI() {
    const d = getData();
    updateProductList();
    updateClientList();
    updateSupplierList();
    updateSaleList();
    updatePurchaseList();
    updateTreasuryDisplay();
    updateSettingsStats();
    updateWarehouseLog();
}

function updateProductList() {
    const d = getData();
    const list = document.getElementById('productList');
    if (!list) return;
    list.innerHTML = (d.products || []).map(p => `
        <div class="list-item">
            <div><strong>${p.name}</strong><br><small>${p.desc || ''}</small></div>
            <div><span style="font-weight:bold;">${p.sell || 0} ج.م (${p.qty || 0})</span></div>
        </div>
    `).join('') || '<div style="text-align:center;color:#999;padding:10px;">لا توجد منتجات</div>';
}

function updateClientList() {
    const d = getData();
    const list = document.getElementById('clientList');
    if (!list) return;
    list.innerHTML = (d.clients || []).map(c => `
        <div class="list-item">
            <div><strong>${c.name}</strong><br><small>📞 ${c.phone || ''}</small></div>
            <div><span style="background:#00B894;color:white;padding:2px 8px;border-radius:4px;font-size:11px;">عميل</span></div>
        </div>
    `).join('') || '<div style="text-align:center;color:#999;padding:10px;">لا يوجد عملاء</div>';
}

function updateSupplierList() {
    const d = getData();
    const list = document.getElementById('supplierList');
    if (!list) return;
    list.innerHTML = (d.suppliers || []).map(s => `
        <div class="list-item">
            <div><strong>${s.name}</strong><br><small>📞 ${s.phone || ''}</small></div>
            <div><span style="background:#E17055;color:white;padding:2px 8px;border-radius:4px;font-size:11px;">مورد</span></div>
        </div>
    `).join('') || '<div style="text-align:center;color:#999;padding:10px;">لا يوجد موردين</div>';
}

function updateSaleList() {
    const d = getData();
    const list = document.getElementById('saleList');
    if (!list) return;
    list.innerHTML = (d.sales || []).slice().reverse().map(s => `
        <div class="list-item">
            <div><strong>${s.id}</strong> - ${s.client}${s.isReturn ? ' ↩️ مرتجع' : ''}</div>
            <div style="font-weight:bold;color:${s.isReturn ? '#E17055' : '#2E4057'};">${s.total || 0} ج.م</div>
        </div>
    `).join('') || '<div style="text-align:center;color:#999;padding:10px;">لا توجد فواتير</div>';
}

function updatePurchaseList() {
    const d = getData();
    const list = document.getElementById('purchaseList');
    if (!list) return;
    list.innerHTML = (d.purchases || []).slice().reverse().map(p => `
        <div class="list-item">
            <div><strong>${p.id}</strong> - ${p.supplier}${p.isReturn ? ' ↩️ مرتجع' : ''}</div>
            <div style="font-weight:bold;color:${p.isReturn ? '#00B894' : '#E17055'};">${p.total || 0} ج.م</div>
        </div>
    `).join('') || '<div style="text-align:center;color:#999;padding:10px;">لا توجد فواتير شراء</div>';
}

function updateTreasuryDisplay() {
    const d = getData();
    const display = document.getElementById('treasuryDisplay');
    if (display) display.textContent = d.treasury || 0;
    const log = document.getElementById('treasuryLog');
    if (!log) return;
    let html = '';
    (d.treasuryLog || []).slice().reverse().forEach(t => {
        html += `<div class="list-item">
            <span>${t.desc}</span>
            <span style="font-weight:bold;color:${(t.amount || 0) > 0 ? '#00B894' : '#E17055'};">${t.amount || 0} ج.م</span>
        </div>`;
    });
    (d.expenses || []).slice().reverse().forEach(e => {
        html += `<div class="list-item" style="color:#E17055;">
            <span>💸 ${e.desc}</span>
            <span style="font-weight:bold;">-${e.amount || 0} ج.م</span>
        </div>`;
    });
    (d.collections || []).slice().reverse().forEach(c => {
        html += `<div class="list-item" style="color:#00B894;">
            <span>💰 تحصيل من ${c.client}</span>
            <span style="font-weight:bold;">+${c.amount || 0} ج.م</span>
        </div>`;
    });
    (d.supplierPayments || []).slice().reverse().forEach(p => {
        html += `<div class="list-item" style="color:#E17055;">
            <span>💸 سداد - ${p.supplier}</span>
            <span style="font-weight:bold;">-${p.amount || 0} ج.م</span>
        </div>`;
    });
    log.innerHTML = html || '<div style="text-align:center;color:#999;padding:10px;">لا توجد حركات</div>';
}

function updateSettingsStats() {
    const d = getData();
    const products = document.getElementById('settingsProducts');
    const clients = document.getElementById('settingsClients');
    const suppliers = document.getElementById('settingsSuppliers');
    if (products) products.textContent = (d.products || []).length;
    if (clients) clients.textContent = (d.clients || []).length;
    if (suppliers) suppliers.textContent = (d.suppliers || []).length;
}

function updateDashboardStats() {
    const d = getData();
    const totalSales = (d.sales || []).reduce((s, i) => s + (i.total || 0), 0);
    const treasury = d.treasury || 0;
    const today = new Date().toLocaleDateString();
    const todaySales = (d.sales || []).filter(s => s.date === today).length;
    document.getElementById('dashTotalSales').textContent = totalSales + ' ج.م';
    document.getElementById('dashTreasury').textContent = treasury + ' ج.م';
    document.getElementById('dashTodaySales').textContent = todaySales;
}

// ============================================================
// 9. الرسوم البيانية
// ============================================================
function drawCharts() {
    const d = getData();
    const sales = d.sales || [];
    const expenses = d.expenses || [];
    const collections = d.collections || [];
    const salesTotal = sales.reduce((s, i) => s + (i.total || 0), 0);
    const expensesTotal = expenses.reduce((s, i) => s + (i.amount || 0), 0);
    const collectionsTotal = collections.reduce((s, i) => s + (i.amount || 0), 0);
    const treasury = d.treasury || 0;

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
                    backgroundColor: ['#2E4057', '#E17055', '#00B894'],
                    borderRadius: 8
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } }
            }
        });
    }

    const treasuryChart = document.getElementById('treasuryChart');
    if (treasuryChart) {
        if (chartInstances.treasury) chartInstances.treasury.destroy();
        chartInstances.treasury = new Chart(treasuryChart, {
            type: 'doughnut',
            data: {
                labels: ['الخزنة', 'المصروفات'],
                datasets: [{
                    data: [treasury, expensesTotal],
                    backgroundColor: ['#2E4057', '#E17055'],
                    borderWidth: 2,
                    borderColor: '#fff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'bottom', labels: { usePointStyle: true } }
                }
            }
        });
    }
}

// ============================================================
// 10. المبيعات - البيع
// ============================================================
function initSaleInvoice() {
    const d = getData();
    const today = new Date().toLocaleDateString('ar-EG');
    document.getElementById('saleInvoiceDate').value = today;
    d.saleCounter = (d.saleCounter || 0) + 1;
    document.getElementById('saleInvoiceNumber').value = 'INV-' + String(d.saleCounter).padStart(4, '0');
    saleItems = [];
    saleTotal = 0;
    updateSaleItemsUI();
}

function addProductToSale() {
    const name = document.getElementById('saleProductSearch').value.trim();
    const qty = parseInt(document.getElementById('saleQty').value) || 1;
    const price = parseFloat(document.getElementById('salePrice').value) || 0;
    if (!name || price <= 0 || qty <= 0) return showToast('⚠️ أدخل البيانات');
    const d = getData();
    const prod = d.products.find(p => p.name === name);
    if (prod && prod.qty < qty) return showToast('⚠️ الكمية غير متوفرة');
    const total = qty * price;
    saleItems.push({ name, qty, price, total });
    saleTotal += total;
    updateSaleItemsUI();
    document.getElementById('saleProductSearch').value = '';
    document.getElementById('saleQty').value = 1;
    document.getElementById('salePrice').value = '';
    showToast('✅ تم إضافة ' + name);
}

function updateSaleItemsUI() {
    const list = document.getElementById('saleItemsList');
    if (!list) return;
    if (saleItems.length === 0) {
        list.innerHTML = '<div style="text-align:center;padding:30px;color:#999;">أضف منتجات</div>';
        document.getElementById('saleTotalDisplay').textContent = '0 ج.م';
        updateSaleBalance();
        return;
    }
    let html = '';
    saleItems.forEach((item, i) => {
        html += `<div style="display:grid;grid-template-columns:2fr 1fr 1fr 1fr 1fr;padding:6px 10px;border-bottom:1px solid #eee;font-size:13px;align-items:center;">
            <span>${item.name}</span>
            <span style="text-align:center;">${item.qty}</span>
            <span style="text-align:center;">${item.price} ج.م</span>
            <span style="text-align:center;font-weight:bold;">${item.total} ج.م</span>
            <span style="text-align:center;"><button onclick="removeSaleItem(${i})" style="background:#E17055;color:white;border:none;border-radius:4px;padding:2px 10px;cursor:pointer;font-size:11px;">✕</button></span>
        </div>`;
    });
    list.innerHTML = html;
    document.getElementById('saleTotalDisplay').textContent = saleTotal + ' ج.م';
    updateSaleBalance();
}

function removeSaleItem(index) {
    saleTotal -= saleItems[index].total;
    saleItems.splice(index, 1);
    updateSaleItemsUI();
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
    // خصم الكميات من المخزون
    saleItems.forEach(item => {
        const prod = d.products.find(p => p.name === item.name);
        if (prod) prod.qty -= item.qty;
    });
    const inv = { id: invNum, client, date, type, items: JSON.parse(JSON.stringify(saleItems)), total: saleTotal, paid, balance: saleTotal - paid, isReturn: false };
    d.sales.push(inv);
    // تحديث الخزنة
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
    updateSaleItemsUI();
    initSaleInvoice();
}

// ============================================================
// 11. المبيعات - المرتجع
// ============================================================
function initReturnSale() {
    const d = getData();
    const today = new Date().toLocaleDateString('ar-EG');
    document.getElementById('saleReturnDate').value = today;
    d.returnCounter = (d.returnCounter || 0) + 1;
    document.getElementById('saleReturnNumber').value = 'RET-' + String(d.returnCounter).padStart(4, '0');
    returnItems = [];
    returnTotal = 0;
    updateReturnItemsUI();
}

function addReturnProduct() {
    const name = document.getElementById('returnProductSearch').value.trim();
    const qty = parseInt(document.getElementById('returnQty').value) || 1;
    const price = parseFloat(document.getElementById('returnPrice').value) || 0;
    if (!name || price <= 0 || qty <= 0) return showToast('⚠️ أدخل البيانات');
    const total = qty * price;
    returnItems.push({ name, qty, price, total });
    returnTotal += total;
    updateReturnItemsUI();
    document.getElementById('returnProductSearch').value = '';
    document.getElementById('returnQty').value = 1;
    document.getElementById('returnPrice').value = '';
    showToast('✅ تم إضافة ' + name);
}

function updateReturnItemsUI() {
    const list = document.getElementById('returnItemsList');
    if (!list) return;
    if (returnItems.length === 0) {
        list.innerHTML = '<div style="text-align:center;padding:30px;color:#999;">أضف منتجات</div>';
        document.getElementById('returnTotalDisplay').textContent = '0 ج.م';
        updateReturnBalance();
        return;
    }
    let html = '';
    returnItems.forEach((item, i) => {
        html += `<div style="display:grid;grid-template-columns:2fr 1fr 1fr 1fr 1fr;padding:6px 10px;border-bottom:1px solid #eee;font-size:13px;align-items:center;background:#fff5f5;">
            <span>${item.name}</span>
            <span style="text-align:center;">${item.qty}</span>
            <span style="text-align:center;">${item.price} ج.م</span>
            <span style="text-align:center;font-weight:bold;color:#E17055;">${item.total} ج.م</span>
            <span style="text-align:center;"><button onclick="removeReturnItem(${i})" style="background:#E17055;color:white;border:none;border-radius:4px;padding:2px 10px;cursor:pointer;font-size:11px;">✕</button></span>
        </div>`;
    });
    list.innerHTML = html;
    document.getElementById('returnTotalDisplay').textContent = returnTotal + ' ج.م';
    updateReturnBalance();
}

function removeReturnItem(index) {
    returnTotal -= returnItems[index].total;
    returnItems.splice(index, 1);
    updateReturnItemsUI();
    showToast('🗑️ تم الحذف');
}

function updateReturnBalance() {
    const paid = parseFloat(document.getElementById('returnPaid').value) || 0;
    const balance = returnTotal - paid;
    const el = document.getElementById('returnBalanceDisplay');
    el.textContent = balance + ' ج.م';
    el.style.color = balance > 0 ? '#E17055' : '#00B894';
}

function saveReturnInvoice() {
    const client = document.getElementById('returnClient').value.trim();
    const invNum = document.getElementById('saleReturnNumber').value;
    const date = document.getElementById('saleReturnDate').value;
    const type = document.getElementById('returnType').value;
    const paid = parseFloat(document.getElementById('returnPaid').value) || 0;
    if (!client) return showToast('⚠️ أدخل اسم العميل');
    if (returnItems.length === 0) return showToast('⚠️ أضف منتجات');
    const d = getData();
    // إضافة الكميات للمخزون (مرتجع بيع = إضافة للمخزون)
    returnItems.forEach(item => {
        const prod = d.products.find(p => p.name === item.name);
        if (prod) prod.qty += item.qty;
        else d.products.push({ id: Date.now().toString(), name: item.name, desc: '', qty: item.qty, buy: 0, sell: item.price, barcode: Math.floor(10000000 + Math.random() * 90000000).toString() });
    });
    const inv = { id: invNum, client, date, type, items: JSON.parse(JSON.stringify(returnItems)), total: returnTotal, paid, balance: returnTotal - paid, isReturn: true };
    d.sales.push(inv);
    if (type === 'cash') {
        d.treasury = (d.treasury || 0) - paid;
        d.treasuryLog.push({ desc: 'مرتجع بيع - ' + client + ' (' + invNum + ')', amount: -paid });
    }
    saveLocal();
    showToast('✅ تم حفظ المرتجع ' + invNum + ' بقيمة ' + returnTotal + ' ج.م');
    clearReturnInvoice();
    updateUI();
}

function clearReturnInvoice() {
    returnItems = [];
    returnTotal = 0;
    document.getElementById('returnClient').value = '';
    document.getElementById('returnPaid').value = 0;
    document.getElementById('returnProductSearch').value = '';
    document.getElementById('returnQty').value = 1;
    document.getElementById('returnPrice').value = '';
    updateReturnItemsUI();
    initReturnSale();
}

function switchSalesMode(mode) {
    const addFields = document.getElementById('saleAddFields');
    const returnFields = document.getElementById('saleReturnFields');
    const addBtn = document.getElementById('saleModeAdd');
    const returnBtn = document.getElementById('saleModeReturn');
    if (mode === 'add') {
        if (addFields) addFields.style.display = 'block';
        if (returnFields) returnFields.style.display = 'none';
        if (addBtn) addBtn.classList.add('active');
        if (returnBtn) returnBtn.classList.remove('active');
        initSaleInvoice();
    } else {
        if (addFields) addFields.style.display = 'none';
        if (returnFields) returnFields.style.display = 'block';
        if (addBtn) addBtn.classList.remove('active');
        if (returnBtn) returnBtn.classList.add('active');
        initReturnSale();
    }
}

// ============================================================
// 12. المشتريات - الشراء
// ============================================================
function initPurchaseInvoice() {
    const d = getData();
    const today = new Date().toLocaleDateString('ar-EG');
    document.getElementById('purchaseInvoiceDate').value = today;
    d.purchaseCounter = (d.purchaseCounter || 0) + 1;
    document.getElementById('purchaseInvoiceNumber').value = 'PUR-' + String(d.purchaseCounter).padStart(4, '0');
    purchaseItems = [];
    purchaseTotal = 0;
    updatePurchaseItemsUI();
}

function addProductToPurchase() {
    const name = document.getElementById('purchaseProductSearch').value.trim();
    const qty = parseInt(document.getElementById('purchaseQty').value) || 1;
    const price = parseFloat(document.getElementById('purchasePrice').value) || 0;
    if (!name || price <= 0 || qty <= 0) return showToast('⚠️ أدخل البيانات');
    const total = qty * price;
    purchaseItems.push({ name, qty, price, total });
    purchaseTotal += total;
    updatePurchaseItemsUI();
    document.getElementById('purchaseProductSearch').value = '';
    document.getElementById('purchaseQty').value = 1;
    document.getElementById('purchasePrice').value = '';
    showToast('✅ تم إضافة ' + name);
}

function updatePurchaseItemsUI() {
    const list = document.getElementById('purchaseItemsList');
    if (!list) return;
    if (purchaseItems.length === 0) {
        list.innerHTML = '<div style="text-align:center;padding:30px;color:#999;">أضف منتجات</div>';
        document.getElementById('purchaseTotalDisplay').textContent = '0 ج.م';
        updatePurchaseBalance();
        return;
    }
    let html = '';
    purchaseItems.forEach((item, i) => {
        html += `<div style="display:grid;grid-template-columns:2fr 1fr 1fr 1fr 1fr;padding:6px 10px;border-bottom:1px solid #eee;font-size:13px;align-items:center;">
            <span>${item.name}</span>
            <span style="text-align:center;">${item.qty}</span>
            <span style="text-align:center;">${item.price} ج.م</span>
            <span style="text-align:center;font-weight:bold;">${item.total} ج.م</span>
            <span style="text-align:center;"><button onclick="removePurchaseItem(${i})" style="background:#E17055;color:white;border:none;border-radius:4px;padding:2px 10px;cursor:pointer;font-size:11px;">✕</button></span>
        </div>`;
    });
    list.innerHTML = html;
    document.getElementById('purchaseTotalDisplay').textContent = purchaseTotal + ' ج.م';
    updatePurchaseBalance();
}

function removePurchaseItem(index) {
    purchaseTotal -= purchaseItems[index].total;
    purchaseItems.splice(index, 1);
    updatePurchaseItemsUI();
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
    // إضافة الكميات للمخزون
    purchaseItems.forEach(item => {
        const prod = d.products.find(p => p.name === item.name);
        if (prod) prod.qty += item.qty;
        else d.products.push({ id: Date.now().toString(), name: item.name, desc: '', qty: item.qty, buy: item.price, sell: item.price * 1.2, barcode: Math.floor(10000000 + Math.random() * 90000000).toString() });
    });
    const inv = { id: invNum, supplier, date, type, items: JSON.parse(JSON.stringify(purchaseItems)), total: purchaseTotal, paid, balance: purchaseTotal - paid, isReturn: false };
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
    updatePurchaseItemsUI();
    initPurchaseInvoice();
}

// ============================================================
// 13. المشتريات - المرتجع
// ============================================================
function initReturnPurchase() {
    const d = getData();
    const today = new Date().toLocaleDateString('ar-EG');
    document.getElementById('purchaseReturnDate').value = today;
    d.returnPurchaseCounter = (d.returnPurchaseCounter || 0) + 1;
    document.getElementById('purchaseReturnNumber').value = 'PRET-' + String(d.returnPurchaseCounter).padStart(4, '0');
    returnPurchaseItems = [];
    returnPurchaseTotal = 0;
    updateReturnPurchaseItemsUI();
}

function addReturnPurchase() {
    const name = document.getElementById('returnPurchaseProduct').value.trim();
    const qty = parseInt(document.getElementById('returnPurchaseQty').value) || 1;
    const price = parseFloat(document.getElementById('returnPurchasePrice').value) || 0;
    if (!name || price <= 0 || qty <= 0) return showToast('⚠️ أدخل البيانات');
    const total = qty * price;
    returnPurchaseItems.push({ name, qty, price, total });
    returnPurchaseTotal += total;
    updateReturnPurchaseItemsUI();
    document.getElementById('returnPurchaseProduct').value = '';
    document.getElementById('returnPurchaseQty').value = 1;
    document.getElementById('returnPurchasePrice').value = '';
    showToast('✅ تم إضافة ' + name);
}

function updateReturnPurchaseItemsUI() {
    const list = document.getElementById('returnPurchaseItemsList');
    if (!list) return;
    if (returnPurchaseItems.length === 0) {
        list.innerHTML = '<div style="text-align:center;padding:30px;color:#999;">أضف منتجات</div>';
        document.getElementById('returnPurchaseTotalDisplay').textContent = '0 ج.م';
        updateReturnPurchaseBalance();
        return;
    }
    let html = '';
    returnPurchaseItems.forEach((item, i) => {
        html += `<div style="display:grid;grid-template-columns:2fr 1fr 1fr 1fr 1fr;padding:6px 10px;border-bottom:1px solid #eee;font-size:13px;align-items:center;background:#fff5f5;">
            <span>${item.name}</span>
            <span style="text-align:center;">${item.qty}</span>
            <span style="text-align:center;">${item.price} ج.م</span>
            <span style="text-align:center;font-weight:bold;color:#E17055;">${item.total} ج.م</span>
            <span style="text-align:center;"><button onclick="removeReturnPurchaseItem(${i})" style="background:#E17055;color:white;border:none;border-radius:4px;padding:2px 10px;cursor:pointer;font-size:11px;">✕</button></span>
        </div>`;
    });
    list.innerHTML = html;
    document.getElementById('returnPurchaseTotalDisplay').textContent = returnPurchaseTotal + ' ج.م';
    updateReturnPurchaseBalance();
}

function removeReturnPurchaseItem(index) {
    returnPurchaseTotal -= returnPurchaseItems[index].total;
    returnPurchaseItems.splice(index, 1);
    updateReturnPurchaseItemsUI();
    showToast('🗑️ تم الحذف');
}

function updateReturnPurchaseBalance() {
    const paid = parseFloat(document.getElementById('returnPurchasePaid').value) || 0;
    const balance = returnPurchaseTotal - paid;
    const el = document.getElementById('returnPurchaseBalanceDisplay');
    el.textContent = balance + ' ج.م';
    el.style.color = balance > 0 ? '#E17055' : '#00B894';
}

function saveReturnPurchase() {
    const supplier = document.getElementById('returnSupplier').value.trim();
    const invNum = document.getElementById('purchaseReturnNumber').value;
    const date = document.getElementById('purchaseReturnDate').value;
    const type = document.getElementById('returnPurchaseType').value;
    const paid = parseFloat(document.getElementById('returnPurchasePaid').value) || 0;
    if (!supplier) return showToast('⚠️ أدخل اسم المورد');
    if (returnPurchaseItems.length === 0) return showToast('⚠️ أضف منتجات');
    const d = getData();
    // خصم الكميات من المخزون (مرتجع شراء = خصم من المخزون)
    returnPurchaseItems.forEach(item => {
        const prod = d.products.find(p => p.name === item.name);
        if (prod && prod.qty >= item.qty) prod.qty -= item.qty;
    });
    const inv = { id: invNum, supplier, date, type, items: JSON.parse(JSON.stringify(returnPurchaseItems)), total: returnPurchaseTotal, paid, balance: returnPurchaseTotal - paid, isReturn: true };
    d.purchases.push(inv);
    if (type === 'cash') {
        d.treasury = (d.treasury || 0) + paid;
        d.treasuryLog.push({ desc: 'مرتجع شراء - ' + supplier + ' (' + invNum + ')', amount: paid });
    }
    saveLocal();
    showToast('✅ تم حفظ المرتجع ' + invNum + ' بقيمة ' + returnPurchaseTotal + ' ج.م');
    clearReturnPurchase();
    updateUI();
}

function clearReturnPurchase() {
    returnPurchaseItems = [];
    returnPurchaseTotal = 0;
    document.getElementById('returnSupplier').value = '';
    document.getElementById('returnPurchasePaid').value = 0;
    document.getElementById('returnPurchaseProduct').value = '';
    document.getElementById('returnPurchaseQty').value = 1;
    document.getElementById('returnPurchasePrice').value = '';
    updateReturnPurchaseItemsUI();
    initReturnPurchase();
}

function switchPurchaseMode(mode) {
    const addFields = document.getElementById('purchaseAddFields');
    const returnFields = document.getElementById('purchaseReturnFields');
    const addBtn = document.getElementById('purchaseModeAdd');
    const returnBtn = document.getElementById('purchaseModeReturn');
    if (mode === 'add') {
        if (addFields) addFields.style.display = 'block';
        if (returnFields) returnFields.style.display = 'none';
        if (addBtn) addBtn.classList.add('active');
        if (returnBtn) returnBtn.classList.remove('active');
        initPurchaseInvoice();
    } else {
        if (addFields) addFields.style.display = 'none';
        if (returnFields) returnFields.style.display = 'block';
        if (addBtn) addBtn.classList.remove('active');
        if (returnBtn) returnBtn.classList.add('active');
        initReturnPurchase();
    }
}

// ============================================================
// 14. المنتجات (الأصناف)
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
    showToast('✅ تم إضافة ' + name + ' - الباركود: ' + barcode);
}

// ============================================================
// 15. العملاء
// ============================================================
function addClient() {
    const d = getData();
    const name = document.getElementById('clientName').value.trim();
    const phone = document.getElementById('clientPhone').value.trim();
    const address = document.getElementById('clientAddress').value.trim();
    const balance = parseFloat(document.getElementById('clientBalance').value) || 0;
    const creditLimit = parseFloat(document.getElementById('clientCreditLimit').value) || 0;
    const notes = document.getElementById('clientNotes').value.trim();
    if (!name) return showToast('⚠️ أدخل اسم العميل');
    d.clients.push({ id: Date.now().toString(), name, phone, address, balance, creditLimit, notes });
    saveLocal();
    document.getElementById('clientName').value = '';
    document.getElementById('clientPhone').value = '';
    document.getElementById('clientAddress').value = '';
    document.getElementById('clientBalance').value = 0;
    document.getElementById('clientCreditLimit').value = 0;
    document.getElementById('clientNotes').value = '';
    updateUI();
    showToast('✅ تم إضافة العميل ' + name);
}

// ============================================================
// 16. الموردين
// ============================================================
function addSupplier() {
    const d = getData();
    const name = document.getElementById('supplierName').value.trim();
    const phone = document.getElementById('supplierPhone').value.trim();
    const address = document.getElementById('supplierAddress').value.trim();
    const balance = parseFloat(document.getElementById('supplierBalance').value) || 0;
    const notes = document.getElementById('supplierNotes').value.trim();
    if (!name) return showToast('⚠️ أدخل اسم المورد');
    d.suppliers.push({ id: Date.now().toString(), name, phone, address, balance, notes });
    saveLocal();
    document.getElementById('supplierName').value = '';
    document.getElementById('supplierPhone').value = '';
    document.getElementById('supplierAddress').value = '';
    document.getElementById('supplierBalance').value = 0;
    document.getElementById('supplierNotes').value = '';
    updateUI();
    showToast('✅ تم إضافة المورد ' + name);
}

// ============================================================
// 17. الخزنة
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
// 18. المخازن
// ============================================================
function showWarehouseForm(type) {
    const form = document.getElementById('whForm');
    const title = document.getElementById('whFormTitle');
    if (!form) return;
    const titles = {
        'add': '📥 إذن إضافة للمخزن',
        'remove': '📤 إذن صرف من المخزن',
        'transfer': '🔄 تحويل بين المخازن',
        'inventory': '📋 جرد المخزن',
        'opening': '📊 مخزون أول المدة'
    };
    title.textContent = titles[type] || 'إذن مخزن';
    form.style.display = 'block';
    form.dataset.type = type;
    const d = getData();
    const select = document.getElementById('whProduct');
    if (select) {
        select.innerHTML = '<option value="">اختر المنتج</option>';
        (d.products || []).forEach(p => {
            select.innerHTML += `<option value="${p.id}">${p.name} (${p.qty || 0})</option>`;
        });
    }
    document.getElementById('whQty').value = 1;
    document.getElementById('whReason').value = '';
}

function saveWarehouse() {
    const d = getData();
    const type = document.getElementById('whForm').dataset.type;
    const productId = document.getElementById('whProduct').value;
    const qty = parseInt(document.getElementById('whQty').value) || 0;
    const reason = document.getElementById('whReason').value.trim() || 'بدون سبب';
    if (!productId || qty <= 0) return showToast('⚠️ اختر المنتج والكمية');
    const prod = d.products.find(p => p.id === productId);
    if (!prod) return showToast('⚠️ المنتج غير موجود');
    if (!d.warehouse) d.warehouse = [];
    if (type === 'add' || type === 'opening') {
        prod.qty = (prod.qty || 0) + qty;
        d.warehouse.push({ id: 'WH-' + Date.now(), type, product: prod.name, qty, reason, date: new Date().toLocaleDateString('ar-EG') });
        showToast('✅ تم إضافة ' + qty + ' من ' + prod.name);
    } else if (type === 'remove') {
        if ((prod.qty || 0) < qty) return showToast('⚠️ الكمية غير متوفرة');
        prod.qty = (prod.qty || 0) - qty;
        d.warehouse.push({ id: 'WH-' + Date.now(), type, product: prod.name, qty: -qty, reason, date: new Date().toLocaleDateString('ar-EG') });
        showToast('✅ تم صرف ' + qty + ' من ' + prod.name);
    } else if (type === 'inventory') {
        d.warehouse.push({ id: 'INV-' + Date.now(), type, product: prod.name, qty: prod.qty || 0, reason, date: new Date().toLocaleDateString('ar-EG') });
        showToast('📋 تم جرد ' + prod.name + ': ' + (prod.qty || 0));
    } else if (type === 'transfer') {
        showToast('🔄 جاري تطوير التحويل بين المخازن');
        return;
    }
    saveLocal();
    document.getElementById('whForm').style.display = 'none';
    updateWarehouseLog();
    updateUI();
}

function updateWarehouseLog() {
    const d = getData();
    const warehouse = d.warehouse || [];
    const log = document.getElementById('whLog');
    if (!log) return;
    const icons = { 'add': '📥', 'remove': '📤', 'transfer': '🔄', 'inventory': '📋', 'opening': '📊' };
    log.innerHTML = warehouse.slice().reverse().map(w => `
        <div class="list-item">
            <div>
                <span>${icons[w.type] || '📦'} ${w.product}</span>
                <small style="color:#999;display:block;font-size:11px;">${w.reason || ''} | ${w.date || ''}</small>
            </div>
            <div>
                <span style="color:${(w.qty || 0) > 0 ? '#00B894' : '#E17055'};font-weight:bold;">
                    ${(w.qty || 0) > 0 ? '+' : ''}${w.qty || 0}
                </span>
            </div>
        </div>
    `).join('') || '<div style="text-align:center;color:#999;padding:10px;">لا توجد حركات مخازن</div>';
}

function showWarehouseReport() {
    const d = getData();
    const products = d.products || [];
    let report = '📊 تقرير المخازن\n\n';
    report += '📦 المنتجات الموجودة:\n';
    products.forEach(p => {
        report += `  - ${p.name}: ${p.qty || 0} وحدة (سعر البيع: ${p.sell || 0} ج.م)\n`;
    });
    alert(report);
}

// ============================================================
// 19. التقارير
// ============================================================
function updateReportSelects() {
    const d = getData();
    const select = document.getElementById('statementClientSelect');
    if (select) {
        select.innerHTML = '<option value="">-- اختر العميل --</option>';
        (d.clients || []).forEach(c => {
            select.innerHTML += `<option value="${c.name}">${c.name}</option>`;
        });
    }
}

function showReport(type) {
    const d = getData();
    const sales = d.sales || [];
    const purchases = d.purchases || [];
    const expenses = d.expenses || [];
    const collections = d.collections || [];
    const supplierPayments = d.supplierPayments || [];
    const totalSales = sales.reduce((s, i) => s + (i.total || 0), 0);
    const totalPurchases = purchases.reduce((s, i) => s + (i.total || 0), 0);
    const totalExpenses = expenses.reduce((s, i) => s + (i.amount || 0), 0);
    const totalCollections = collections.reduce((s, i) => s + (i.amount || 0), 0);
    const totalSupplierPayments = supplierPayments.reduce((s, i) => s + (i.amount || 0), 0);
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
                <span>الإيرادات</span><span style="color:#00B894;">${totalSales} ج.م</span>
            </div>
            <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #333;">
                <span>تكلفة المشتريات</span><span style="color:#E17055;">${totalPurchases} ج.م</span>
            </div>
            <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #333;">
                <span>المصروفات</span><span style="color:#E17055;">${totalExpenses} ج.م</span>
            </div>
            <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #333;">
                <span>التحصيل</span><span style="color:#00B894;">${totalCollections} ج.م</span>
            </div>
            <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #333;">
                <span>سداد الموردين</span><span style="color:#E17055;">${totalSupplierPayments} ج.م</span>
            </div>
            <div style="display:flex;justify-content:space-between;padding-top:10px;margin-top:10px;border-top:2px solid #00B894;font-size:18px;">
                <span>صافي الربح</span><span style="color:${profit >= 0 ? '#00B894' : '#E17055'};font-weight:bold;">${profit} ج.م</span>
            </div>
        </div>`;
    } else if (type === 'daily') {
        const todaySales = sales.filter(s => s.date === today).reduce((s, i) => s + (i.total || 0), 0);
        const todayPurchases = purchases.filter(p => p.date === today).reduce((s, i) => s + (i.total || 0), 0);
        const todayExpenses = expenses.filter(e => e.date === today).reduce((s, i) => s + (i.amount || 0), 0);
        const todayProfit = todaySales - todayPurchases - todayExpenses;
        html = `<div style="background:#1e1e2e;border-radius:12px;padding:15px;color:white;">
            <div style="text-align:center;border-bottom:2px solid #FDCB6E;padding-bottom:10px;margin-bottom:15px;">
                <h3 style="margin:0;color:#FDCB6E;">📅 تقرير اليوم</h3>
                <small style="color:#888;">${today}</small>
            </div>
            <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #333;">
                <span>مبيعات اليوم</span><span style="color:#00B894;">${todaySales} ج.م</span>
            </div>
            <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #333;">
                <span>مشتريات اليوم</span><span style="color:#E17055;">${todayPurchases} ج.م</span>
            </div>
            <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #333;">
                <span>مصروفات اليوم</span><span style="color:#E17055;">${todayExpenses} ج.م</span>
            </div>
            <div style="display:flex;justify-content:space-between;padding-top:10px;margin-top:10px;border-top:2px solid #FDCB6E;font-size:18px;">
                <span>صافي ربح اليوم</span><span style="color:${todayProfit >= 0 ? '#00B894' : '#E17055'};font-weight:bold;">${todayProfit} ج.م</span>
            </div>
        </div>`;
    } else if (type === 'trial') {
        const totalAssets = d.treasury || 0;
        const totalLiabilities = sales.filter(s => s.type === 'credit').reduce((s, i) => s + (i.total || 0), 0);
        const equity = totalAssets - totalLiabilities;
        html = `<div style="background:#1e1e2e;border-radius:12px;padding:15px;color:white;">
            <div style="text-align:center;border-bottom:2px solid #6C5CE7;padding-bottom:10px;margin-bottom:15px;">
                <h3 style="margin:0;color:#6C5CE7;">📋 ميزان المراجعة</h3>
                <small style="color:#888;">${today}</small>
            </div>
            <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #333;">
                <span>الأصول (الخزنة)</span><span style="color:#00B894;">${totalAssets} ج.م</span>
            </div>
            <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #333;">
                <span>الخصوم (الآجل)</span><span style="color:#E17055;">${totalLiabilities} ج.م</span>
            </div>
            <div style="display:flex;justify-content:space-between;padding-top:10px;margin-top:10px;border-top:2px solid #6C5CE7;font-size:18px;">
                <span>حقوق الملكية</span><span style="color:${equity >= 0 ? '#00B894' : '#E17055'};font-weight:bold;">${equity} ج.م</span>
            </div>
        </div>`;
    } else if (type === 'statement') {
        const clientName = document.getElementById('statementClientSelect').value;
        const field = document.getElementById('statementField');
        if (!clientName) {
            if (field) field.style.display = 'block';
            html = '<div style="color:#aaa;text-align:center;padding:40px;background:#1e1e2e;border-radius:12px;">اختر عميلاً لعرض كشف الحساب</div>';
        } else {
            if (field) field.style.display = 'block';
            const clientSales = sales.filter(s => s.client === clientName);
            const clientCollections = collections.filter(c => c.client === clientName);
            let balance = 0;
            let rows = '';
            clientSales.forEach(s => {
                balance += (s.total || 0);
                rows += `<div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid #333;font-size:13px;">
                    <span style="color:#aaa;">${s.date || ''}</span>
                    <span>بيع - ${s.product || ''}</span>
                    <span style="color:#E17055;">${s.total || 0} ج.م</span>
                    <span>${balance} ج.م</span>
                </div>`;
            });
            clientCollections.forEach(c => {
                balance -= (c.amount || 0);
                rows += `<div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid #333;font-size:13px;">
                    <span style="color:#aaa;">${new Date(c.id).toLocaleDateString('ar-EG')}</span>
                    <span>تحصيل</span>
                    <span style="color:#00B894;">${c.amount || 0} ج.م</span>
                    <span>${balance} ج.م</span>
                </div>`;
            });
            html = `<div style="background:#1e1e2e;border-radius:12px;padding:15px;color:white;">
                <div style="text-align:center;border-bottom:2px solid #00B894;padding-bottom:10px;margin-bottom:15px;">
                    <h3 style="margin:0;color:#00B894;">📋 كشف حساب ${clientName}</h3>
                    <small style="color:#888;">${today}</small>
                </div>
                <div style="display:grid;grid-template-columns:1fr 2fr 1.5fr 1.5fr;gap:5px;padding:10px 0;border-bottom:2px solid #00B894;font-weight:bold;font-size:13px;background:#2a2a3e;border-radius:8px 8px 0 0;padding:8px 10px;">
                    <span>التاريخ</span><span>البيان</span><span>المبلغ</span><span>الرصيد</span>
                </div>
                ${rows || '<div style="text-align:center;padding:20px;color:#aaa;">لا توجد معاملات</div>'}
                <div style="display:grid;grid-template-columns:2fr 1fr 1.5fr;gap:5px;padding:15px 0;margin-top:10px;border-top:3px solid #00B894;font-size:16px;font-weight:bold;background:#2a2a3e;border-radius:0 0 8px 8px;padding:10px;">
                    <span></span>
                    <span style="color:#888;">الرصيد النهائي</span>
                    <span style="color:${balance > 0 ? '#E17055' : '#00B894'};font-size:18px;">${balance} ج.م</span>
                </div>
            </div>`;
        }
    }
    document.getElementById('reportContent').innerHTML = html;
}

// ============================================================
// 20. الذكاء الاصطناعي
// ============================================================
function showAIReport() {
    const d = getData();
    const sales = d.sales || [];
    const purchases = d.purchases || [];
    const expenses = d.expenses || [];
    const products = d.products || [];
    const clients = d.clients || [];
    const totalSales = sales.reduce((s, i) => s + (i.total || 0), 0);
    const totalPurchases = purchases.reduce((s, i) => s + (i.total || 0), 0);
    const totalExpenses = expenses.reduce((s, i) => s + (i.amount || 0), 0);
    const profit = totalSales - totalPurchases - totalExpenses;
    let report = '🤖 تحليل الذكاء الاصطناعي\n\n';
    report += '📊 إجمالي المبيعات: ' + totalSales + ' ج.م\n';
    report += '📉 إجمالي المشتريات: ' + totalPurchases + ' ج.م\n';
    report += '💸 إجمالي المصروفات: ' + totalExpenses + ' ج.م\n';
    report += '💰 صافي الربح: ' + profit + ' ج.م\n\n';
    report += '📦 عدد المنتجات: ' + products.length + '\n';
    report += '👤 عدد العملاء: ' + clients.length + '\n\n';
    if (profit > 0) {
        report += '✅ عملك يحقق أرباحاً.\n';
        if (totalExpenses > (totalSales * 0.3)) {
            report += '⚠️ نصيحة: المصروفات تمثل ' + ((totalExpenses/totalSales)*100).toFixed(1) + '% من المبيعات.\n';
        }
    } else {
        report += '⚠️ عملك يحقق خسائر. راجع المصروفات.\n';
    }
    if (products.length === 0) report += '📦 تنبيه: لم تضف أي منتجات.\n';
    alert(report);
}

// ============================================================
// 21. الإعدادات
// ============================================================
function changeTheme(theme) {
    document.body.className = '';
    if (theme !== 'default') document.body.classList.add('theme-' + theme);
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

// ============================================================
// 22. لوحة الأدمن المخفية (5 ضغطات على اللوجو)
// ============================================================
document.addEventListener('DOMContentLoaded', function() {
    const logo = document.getElementById('brandLogo');
    if (logo) {
        logo.addEventListener('click', function() {
            clickCount++;
            clearTimeout(clickTimer);
            clickTimer = setTimeout(() => { clickCount = 0; }, 1000);
            if (clickCount >= 5) {
                clickCount = 0;
                document.getElementById('adminPanel').style.display = 'flex';
                document.getElementById('adminPinSection').style.display = 'block';
                document.getElementById('adminContent').style.display = 'none';
                document.getElementById('adminPinInput').value = '';
                showToast('🔐 أدخل الرقم السري');
            }
        });
    }
    document.getElementById('adminPinInput').addEventListener('keydown', function(e) {
        if (e.key === 'Enter') unlockAdminPanel();
    });
});

function unlockAdminPanel() {
    const pin = document.getElementById('adminPinInput').value;
    if (pin === appData.adminPin) {
        document.getElementById('adminPinSection').style.display = 'none';
        document.getElementById('adminContent').style.display = 'block';
        showToast('✅ تم فتح لوحة التحكم');
    } else {
        showToast('❌ الرقم السري خطأ');
        document.getElementById('adminPinInput').value = '';
    }
}

function closeAdminPanel() {
    document.getElementById('adminPanel').style.display = 'none';
}

function changeAdminPassword() {
    const np = document.getElementById('adminNewPassword').value.trim();
    if (!np || np.length < 4) return showToast('⚠️ 4 أحرف على الأقل');
    appData.adminPin = np;
    saveLocal();
    document.getElementById('adminNewPassword').value = '';
    showToast('✅ تم تغيير الرقم السري');
}

function exportData() {
    const d = getData();
    const blob = new Blob([JSON.stringify(d, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'backup_' + new Date().toISOString().slice(0, 10) + '.json';
    a.click();
    URL.revokeObjectURL(url);
    showToast('📤 تم التصدير');
}

function importData(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = JSON.parse(e.target.result);
            const ud = getData();
            Object.assign(ud, data);
            saveLocal();
            updateUI();
            showToast('✅ تم الاستيراد');
        } catch(err) {
            showToast('❌ ملف غير صالح');
        }
    };
    reader.readAsText(file);
    event.target.value = '';
}

function clearAllData() {
    if (!confirm('⚠️ مسح كل البيانات؟')) return;
    const d = getData();
    d.sales = [];
    d.purchases = [];
    d.products = [];
    d.clients = [];
    d.suppliers = [];
    d.treasury = 0;
    d.treasuryLog = [];
    d.expenses = [];
    d.collections = [];
    d.supplierPayments = [];
    d.warehouse = [];
    d.saleCounter = 0;
    d.purchaseCounter = 0;
    d.returnCounter = 0;
    d.returnPurchaseCounter = 0;
    saveLocal();
    updateUI();
    showToast('🗑️ تم مسح كل البيانات');
    closeAdminPanel();
}

// ============================================================
// 23. Toast
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
// 24. ربط الأزرار - التشغيل النهائي
// ============================================================
function bindButtons() {
    // أزرار الدخول
    document.getElementById('loginBtn')?.addEventListener('click', handleLogin);
    document.getElementById('registerBtn')?.addEventListener('click', handleRegister);
    document.getElementById('showRegisterBtn')?.addEventListener('click', toggleAuthMode);
    document.getElementById('backToLoginBtn')?.addEventListener('click', showLoginForm);
    document.getElementById('forgotLink')?.addEventListener('click', showForgotPassword);
    document.getElementById('backFromForgotBtn')?.addEventListener('click', showLoginForm);
    document.getElementById('resetBtn')?.addEventListener('click', sendResetPassword);

    // أزرار التنقل
    document.querySelectorAll('[data-page]').forEach(el => {
        el.addEventListener('click', function() {
            const page = this.getAttribute('data-page');
            if (page) switchPage(page);
        });
    });

    // أزرار الخروج
    document.getElementById('logoutBtn')?.addEventListener('click', logout);
    document.getElementById('logoutBtnBottom')?.addEventListener('click', logout);

    // أزرار المبيعات
    document.querySelector('#saleModeAdd')?.addEventListener('click', function() { switchSalesMode('add'); });
    document.querySelector('#saleModeReturn')?.addEventListener('click', function() { switchSalesMode('return'); });
    document.querySelector('#addSaleBtn')?.addEventListener('click', addProductToSale);
    document.querySelector('#saveSaleBtn')?.addEventListener('click', saveSaleInvoice);
    document.querySelector('#clearSaleBtn')?.addEventListener('click', clearSaleInvoice);
    document.querySelector('#addReturnBtn')?.addEventListener('click', addReturnProduct);
    document.querySelector('#saveReturnBtn')?.addEventListener('click', saveReturnInvoice);
    document.querySelector('#clearReturnBtn')?.addEventListener('click', clearReturnInvoice);

    // أزرار المشتريات
    document.querySelector('#purchaseModeAdd')?.addEventListener('click', function() { switchPurchaseMode('add'); });
    document.querySelector('#purchaseModeReturn')?.addEventListener('click', function() { switchPurchaseMode('return'); });
    document.querySelector('#addPurchaseBtn')?.addEventListener('click', addProductToPurchase);
    document.querySelector('#savePurchaseBtn')?.addEventListener('click', savePurchaseInvoice);
    document.querySelector('#clearPurchaseBtn')?.addEventListener('click', clearPurchaseInvoice);
    document.querySelector('#addReturnPurchaseBtn')?.addEventListener('click', addReturnPurchase);
    document.querySelector('#saveReturnPurchaseBtn')?.addEventListener('click', saveReturnPurchase);
    document.querySelector('#clearReturnPurchaseBtn')?.addEventListener('click', clearReturnPurchase);

    // أزرار المنتجات
    document.querySelector('#addProductBtn')?.addEventListener('click', addProduct);

    // أزرار العملاء والموردين
    document.querySelector('#addClientBtn')?.addEventListener('click', addClient);
    document.querySelector('#addSupplierBtn')?.addEventListener('click', addSupplier);

    // أزرار الخزنة
    document.querySelector('#collectDebtBtn')?.addEventListener('click', collectDebt);
    document.querySelector('#paySupplierBtn')?.addEventListener('click', paySupplier);
    document.querySelector('#addTreasuryBtn')?.addEventListener('click', addToTreasury);
    document.querySelector('#withdrawTreasuryBtn')?.addEventListener('click', withdrawTreasury);
    document.querySelector('#addExpenseBtn')?.addEventListener('click', addExpense);

    // أزرار المخازن
    document.querySelector('#whAddBtn')?.addEventListener('click', function() { showWarehouseForm('add'); });
    document.querySelector('#whRemoveBtn')?.addEventListener('click', function() { showWarehouseForm('remove'); });
    document.querySelector('#whTransferBtn')?.addEventListener('click', function() { showWarehouseForm('transfer'); });
    document.querySelector('#whInventoryBtn')?.addEventListener('click', function() { showWarehouseForm('inventory'); });
    document.querySelector('#whOpeningBtn')?.addEventListener('click', function() { showWarehouseForm('opening'); });
    document.querySelector('#whReportBtn')?.addEventListener('click', showWarehouseReport);
    document.querySelector('#whSaveBtn')?.addEventListener('click', saveWarehouse);
    document.querySelector('#whCancelBtn')?.addEventListener('click', function() {
        document.getElementById('whForm').style.display = 'none';
    });

    // أزرار التقارير
    document.querySelector('#reportIncomeBtn')?.addEventListener('click', function() { showReport('income'); });
    document.querySelector('#reportDailyBtn')?.addEventListener('click', function() { showReport('daily'); });
    document.querySelector('#reportTrialBtn')?.addEventListener('click', function() { showReport('trial'); });
    document.querySelector('#reportStatementBtn')?.addEventListener('click', function() { showReport('statement'); });

    // أزرار الإعدادات
    document.querySelector('#themeDefault')?.addEventListener('click', function() { changeTheme('default'); });
    document.querySelector('#themeDark')?.addEventListener('click', function() { changeTheme('dark'); });
    document.querySelector('#themeBlue')?.addEventListener('click', function() { changeTheme('blue'); });
    document.querySelector('#themeGreen')?.addEventListener('click', function() { changeTheme('green'); });
    document.querySelector('#fontSmall')?.addEventListener('click', function() { changeFontSize('small'); });
    document.querySelector('#fontMedium')?.addEventListener('click', function() { changeFontSize('medium'); });
    document.querySelector('#fontLarge')?.addEventListener('click', function() { changeFontSize('large'); });
    document.querySelector('#resetSettingsBtn')?.addEventListener('click', resetAppSettings);

    // زر الذكاء الاصطناعي
    document.querySelector('#aiReportBtn')?.addEventListener('click', showAIReport);

    // Enter في حقول الدخول
    document.getElementById('loginUser')?.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') handleLogin();
    });
    document.getElementById('loginPass')?.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') handleLogin();
    });

    console.log('✅ جميع الأزرار مرتبطة');
}

// ============================================================
// 25. بدء التشغيل
// ============================================================
function startApp() {
    console.log('🚀 بدء تشغيل نظام راشد V31...');
    initFirebase();
    loadLocal();

    if (!autoLogin()) {
        document.getElementById('authContainer').style.display = 'flex';
        document.getElementById('appContainer').style.display = 'none';
    }

    bindButtons();
    console.log('✅ نظام راشد V31 جاهز للعمل');
}

// تشغيل التطبيق
startApp();
