// ============================================================
// نظام راشد V31 - ERP متكامل
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
let chartInstances = {};
let clickCount = 0;
let clickTimer = null;
let firebaseApp = null, firebaseAuth = null, firebaseDb = null;

let saleItems = [], saleTotal = 0, saleDiscount = 0;
let returnSaleItems = [], returnSaleTotal = 0;
let purchaseItems = [], purchaseTotal = 0, purchaseDiscount = 0;
let returnPurchaseItems = [], returnPurchaseTotal = 0;

let currentClientFilter = 'all';

// ============================================================
// 3. تهيئة Firebase
// ============================================================
function initFirebase() {
    try {
        if (!firebaseApp) {
            firebaseApp = firebase.initializeApp(firebaseConfig);
            firebaseAuth = firebase.auth(firebaseApp);
            firebaseDb = firebase.database(firebaseApp);
        }
    } catch(e) { console.warn('Firebase:', e); }
    return { app: firebaseApp, auth: firebaseAuth, db: firebaseDb };
}

// ============================================================
// 4. إدارة البيانات
// ============================================================
function loadLocal() {
    try {
        const raw = localStorage.getItem('RashedV31');
        if (raw) {
            const parsed = JSON.parse(raw);
            appData = parsed;
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
            banks: [],
            treasury: 0, cashTreasury: 0, walletTreasury: 0, bankTreasury: 0,
            treasuryLog: [], expenses: [], collections: [], supplierPayments: [],
            warehouse: [], saleCounter: 0, purchaseCounter: 0,
            returnSaleCounter: 0, returnPurchaseCounter: 0,
            company: {}, paymentMethods: {},
            profile: { shopName: 'نظام راشد', branch: 'رئيسي' },
            settings: { theme: 'default', fontSize: 'medium', soundAlerts: true, popupAlerts: true, alertSound: 'beep' }
        };
    }
    const d = appData.users[appData.currentUser].data || {};
    if (!d.sales) d.sales = [];
    if (!d.purchases) d.purchases = [];
    if (!d.products) d.products = [];
    if (!d.clients) d.clients = [];
    if (!d.suppliers) d.suppliers = [];
    if (!d.banks) d.banks = [];
    if (d.treasury === undefined) d.treasury = 0;
    if (d.cashTreasury === undefined) d.cashTreasury = 0;
    if (d.walletTreasury === undefined) d.walletTreasury = 0;
    if (d.bankTreasury === undefined) d.bankTreasury = 0;
    if (!d.treasuryLog) d.treasuryLog = [];
    if (!d.expenses) d.expenses = [];
    if (!d.collections) d.collections = [];
    if (!d.supplierPayments) d.supplierPayments = [];
    if (!d.warehouse) d.warehouse = [];
    if (d.saleCounter === undefined) d.saleCounter = 0;
    if (d.purchaseCounter === undefined) d.purchaseCounter = 0;
    if (d.returnSaleCounter === undefined) d.returnSaleCounter = 0;
    if (d.returnPurchaseCounter === undefined) d.returnPurchaseCounter = 0;
    if (!d.company) d.company = {};
    if (!d.paymentMethods) d.paymentMethods = {};
    if (!d.profile) d.profile = { shopName: 'نظام راشد', branch: 'رئيسي' };
    if (!d.settings) d.settings = { theme: 'default', fontSize: 'medium', soundAlerts: true, popupAlerts: true, alertSound: 'beep' };
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
function toggleAuthMode() {
    const l = document.getElementById('loginForm'), r = document.getElementById('registerForm');
    if (l) l.style.display = l.style.display === 'none' ? 'block' : 'none';
    if (r) r.style.display = r.style.display === 'none' ? 'block' : 'none';
}

async function handleLogin() {
    const u = document.getElementById('loginUser').value.trim(), p = document.getElementById('loginPass').value.trim();
    if (!u || !p) return showToast('⚠️ أدخل البيانات');
    try {
        const { auth } = initFirebase();
        await auth.signInWithEmailAndPassword(u + '@rashed.com', p);
        const user = auth.currentUser, loc = await getUserLocation();
        appData.currentUser = user.uid;
        if (!appData.users[user.uid]) {
            appData.users[user.uid] = {
                displayName: u, fullName: u, phone: '', address: '',
                data: {
                    sales: [], purchases: [], products: [], clients: [], suppliers: [], banks: [],
                    treasury: 0, cashTreasury: 0, walletTreasury: 0, bankTreasury: 0,
                    treasuryLog: [], expenses: [], collections: [], supplierPayments: [],
                    warehouse: [], saleCounter: 0, purchaseCounter: 0,
                    returnSaleCounter: 0, returnPurchaseCounter: 0,
                    company: {}, paymentMethods: {},
                    profile: { shopName: 'نظام راشد', branch: 'رئيسي' },
                    settings: { theme: 'default', fontSize: 'medium', soundAlerts: true, popupAlerts: true, alertSound: 'beep' }
                }
            };
        }
        appData.users[user.uid].lastLogin = new Date().toISOString();
        appData.users[user.uid].lastLocation = loc;
        appData.activityLog.push({ userId: user.uid, username: u, action: 'دخول', time: new Date().toISOString(), ip: loc.ip, country: loc.country });
        saveLocal();
        enterApp();
        showToast('✅ مرحباً ' + u);
    } catch(e) {
        if (e.code === 'auth/user-not-found') showToast('❌ المستخدم غير موجود');
        else if (e.code === 'auth/wrong-password') showToast('❌ كلمة المرور خطأ');
        else showToast('❌ ' + e.message);
    }
}

async function handleRegister() {
    const u = document.getElementById('regUser').value.trim(), p = document.getElementById('regPass').value.trim(), c = document.getElementById('regPassConfirm').value.trim();
    const fn = document.getElementById('regFullName').value.trim(), ph = document.getElementById('regPhone').value.trim(), ad = document.getElementById('regAddress').value.trim();
    if (!u || u.length < 3) return showToast('⚠️ 3 أحرف');
    if (p.length < 6) return showToast('⚠️ 6 أحرف');
    if (p !== c) return showToast('⚠️ غير متطابقة');
    if (!fn) return showToast('⚠️ الاسم الكامل');
    try {
        const { auth, db } = initFirebase();
        const result = await auth.createUserWithEmailAndPassword(u + '@rashed.com', p);
        const user = result.user, loc = await getUserLocation();
        await db.ref('users/' + user.uid + '/data').set({
            sales: [], purchases: [], products: [], clients: [], suppliers: [], banks: [],
            treasury: 0, cashTreasury: 0, walletTreasury: 0, bankTreasury: 0,
            treasuryLog: [], expenses: [], collections: [], supplierPayments: [],
            warehouse: [], saleCounter: 0, purchaseCounter: 0,
            returnSaleCounter: 0, returnPurchaseCounter: 0,
            company: {}, paymentMethods: {},
            profile: { shopName: 'نظام راشد', branch: 'رئيسي' },
            settings: { theme: 'default', fontSize: 'medium', soundAlerts: true, popupAlerts: true, alertSound: 'beep' }
        });
        appData.currentUser = user.uid;
        appData.users[user.uid] = {
            displayName: u, fullName: fn, phone: ph, address: ad,
            lastLogin: new Date().toISOString(), lastLocation: loc,
            data: {
                sales: [], purchases: [], products: [], clients: [], suppliers: [], banks: [],
                treasury: 0, cashTreasury: 0, walletTreasury: 0, bankTreasury: 0,
                treasuryLog: [], expenses: [], collections: [], supplierPayments: [],
                warehouse: [], saleCounter: 0, purchaseCounter: 0,
                returnSaleCounter: 0, returnPurchaseCounter: 0,
                company: {}, paymentMethods: {},
                profile: { shopName: 'نظام راشد', branch: 'رئيسي' },
                settings: { theme: 'default', fontSize: 'medium', soundAlerts: true, popupAlerts: true, alertSound: 'beep' }
            }
        };
        appData.activityLog.push({ userId: user.uid, username: u, action: 'تسجيل جديد', time: new Date().toISOString(), ip: loc.ip, country: loc.country });
        saveLocal();
        enterApp();
        showToast('✅ تم إنشاء الحساب');
    } catch(e) {
        if (e.code === 'auth/email-already-in-use') showToast('⚠️ الاسم مستخدم');
        else showToast('❌ ' + e.message);
    }
}

function logout() {
    if (confirm('تسجيل الخروج؟')) {
        const { auth } = initFirebase();
        const u = appData.users[appData.currentUser]?.displayName || 'مستخدم';
        appData.activityLog.push({ userId: appData.currentUser, username: u, action: 'خروج', time: new Date().toISOString() });
        saveLocal();
        auth.signOut().then(() => { appData.currentUser = null; saveLocal(); location.reload(); });
    }
}

function enterApp() {
    document.getElementById('authContainer').style.display = 'none';
    document.getElementById('appContainer').style.display = 'block';
    const dn = appData.users[appData.currentUser]?.fullName || appData.users[appData.currentUser]?.displayName || 'مستخدم';
    document.getElementById('userDisplay').textContent = dn;
    loadSettings();
    loadCompanyData();
    loadPaymentMethods();
    updateUI();
    updateAdminPanel();
    switchPage('dashboard');
}

function autoLogin() {
    if (appData.currentUser && appData.users[appData.currentUser]) { enterApp(); return true; }
    return false;
}

// ============================================================
// 7. التنقل
// ============================================================
function switchPage(page) {
    document.querySelectorAll('.page').forEach(el => el.classList.remove('active'));
    const t = document.getElementById('page-' + page);
    if (t) t.classList.add('active');
    if (page === 'dashboard') drawCharts();
    if (page === 'reports') updateReportSelects();
    if (page === 'company') loadCompanyData();
    if (page === 'settings') {
        loadSettings();
        loadPaymentMethods();
        const d = getData();
        document.getElementById('settingsUser').textContent = appData.users[appData.currentUser]?.fullName || appData.users[appData.currentUser]?.displayName || 'مستخدم';
        document.getElementById('settingsProducts').textContent = d.products.length;
        document.getElementById('settingsClients').textContent = d.clients.length;
        document.getElementById('settingsSuppliers').textContent = d.suppliers.length;
    }
    if (page === 'sales') { initSaleInvoice(); updateClientSelects(); }
    if (page === 'purchases') { initPurchaseInvoice(); updateSupplierSelects(); }
    if (page === 'admin') updateAdminPanel();
    if (page === 'warehouse') updateWarehouseLog();
    if (page === 'clients') updateClientList();
    if (page === 'suppliers') updateSupplierList();
    if (page === 'banks') updateBankList();
}

// ============================================================
// 8. البحث الذكي
// ============================================================
function searchProductLive(input) {
    const d = getData();
    const suggestions = document.getElementById('productSuggestions');
    const infoDisplay = document.getElementById('productInfoDisplay');
    if (!input || input.length === 0) {
        if (suggestions) suggestions.style.display = 'none';
        if (infoDisplay) infoDisplay.style.display = 'none';
        return;
    }
    const products = d.products || [];
    const results = products.filter(p => 
        p.name.toLowerCase().includes(input.toLowerCase()) ||
        (p.barcode && p.barcode.includes(input)) ||
        (p.mainCategory && p.mainCategory.toLowerCase().includes(input.toLowerCase()))
    );
    if (results.length === 0) {
        if (suggestions) { suggestions.innerHTML = '<div style="padding:10px;color:#999;text-align:center;">لا توجد نتائج</div>'; suggestions.style.display = 'block'; }
        return;
    }
    let html = '';
    results.forEach(p => {
        html += `<div class="suggestion-item" onclick="selectProductForSale('${p.id}')">
            <span class="name">${p.name}</span>
            <div><span class="qty">📦 ${p.qty || 0}</span><span class="price">${p.sell || 0} ج.م</span></div>
        </div>`;
    });
    if (suggestions) { suggestions.innerHTML = html; suggestions.style.display = 'block'; }
}

function selectProductForSale(productId) {
    const d = getData();
    const product = d.products.find(p => p.id === productId);
    if (!product) return;
    document.getElementById('saleProductSearch').value = product.name;
    document.getElementById('salePrice').value = product.sell || 0;
    document.getElementById('saleQty').value = 1;
    document.getElementById('selectedProductName').textContent = product.name;
    document.getElementById('selectedProductQty').textContent = product.qty || 0;
    document.getElementById('selectedProductPrice').textContent = product.sell || 0;
    document.getElementById('productInfoDisplay').style.display = 'block';
    document.getElementById('productSuggestions').style.display = 'none';
}

function searchProductLivePurchase(input) {
    const d = getData();
    const suggestions = document.getElementById('purchaseProductSuggestions');
    const infoDisplay = document.getElementById('purchaseProductInfo');
    if (!input || input.length === 0) {
        if (suggestions) suggestions.style.display = 'none';
        if (infoDisplay) infoDisplay.style.display = 'none';
        return;
    }
    const products = d.products || [];
    const results = products.filter(p => 
        p.name.toLowerCase().includes(input.toLowerCase()) ||
        (p.barcode && p.barcode.includes(input))
    );
    if (results.length === 0) {
        if (suggestions) { suggestions.innerHTML = '<div style="padding:10px;color:#999;text-align:center;">لا توجد نتائج</div>'; suggestions.style.display = 'block'; }
        return;
    }
    let html = '';
    results.forEach(p => {
        html += `<div class="suggestion-item" onclick="selectProductForPurchase('${p.id}')">
            <span class="name">${p.name}</span>
            <div><span class="qty">📦 ${p.qty || 0}</span><span class="price" style="color:#E17055;">${p.buy || 0} ج.م</span></div>
        </div>`;
    });
    if (suggestions) { suggestions.innerHTML = html; suggestions.style.display = 'block'; }
}

function selectProductForPurchase(productId) {
    const d = getData();
    const product = d.products.find(p => p.id === productId);
    if (!product) return;
    document.getElementById('purchaseProductSearch').value = product.name;
    document.getElementById('purchasePrice').value = product.buy || 0;
    document.getElementById('purchaseQty').value = 1;
    document.getElementById('selectedPurchaseProductName').textContent = product.name;
    document.getElementById('selectedPurchaseProductQty').textContent = product.qty || 0;
    document.getElementById('selectedPurchaseProductPrice').textContent = product.buy || 0;
    document.getElementById('purchaseProductInfo').style.display = 'block';
    document.getElementById('purchaseProductSuggestions').style.display = 'none';
}

// ============================================================
// 9. المبيعات
// ============================================================
function initSaleInvoice() {
    const d = getData();
    document.getElementById('saleInvoiceDate').value = new Date().toLocaleDateString('ar-EG');
    d.saleCounter = (d.saleCounter || 0) + 1;
    document.getElementById('saleInvoiceNumber').value = 'INV-' + String(d.saleCounter).padStart(4, '0');
    saleItems = []; saleTotal = 0; saleDiscount = 0;
    document.getElementById('saleDiscount').value = 0;
    document.getElementById('salePaid').value = 0;
    updateSaleUI();
    saveLocal();
}

function addProductToSale() {
    const name = document.getElementById('saleProductSearch').value.trim();
    const qty = parseInt(document.getElementById('saleQty').value) || 1;
    const price = parseFloat(document.getElementById('salePrice').value) || 0;
    if (!name || price <= 0 || qty <= 0) return showToast('⚠️ أدخل البيانات');
    const d = getData();
    const p = d.products.find(x => x.name === name);
    if (p && p.qty < qty) return showToast('⚠️ الكمية غير متوفرة');
    const total = qty * price;
    saleItems.push({ name, qty, price, total });
    saleTotal += total;
    updateSaleUI();
    document.getElementById('saleProductSearch').value = '';
    document.getElementById('saleQty').value = 1;
    document.getElementById('salePrice').value = '';
    document.getElementById('productInfoDisplay').style.display = 'none';
    showToast('✅ تم إضافة ' + name);
}

function updateSaleUI() {
    const list = document.getElementById('saleItemsList');
    if (!list) return;
    if (saleItems.length === 0) {
        list.innerHTML = '<div style="text-align:center;padding:30px;color:#999;">أضف منتجات</div>';
        document.getElementById('saleTotalDisplay').textContent = '0 ج.م';
        updateSaleTotals();
        return;
    }
    let html = '';
    saleItems.forEach((item, i) => {
        html += `<div style="display:grid;grid-template-columns:2fr 0.8fr 1fr 1fr 0.8fr;padding:6px 10px;border-bottom:1px solid #eee;font-size:13px;align-items:center;">
            <span>${item.name}</span><span style="text-align:center;">${item.qty}</span>
            <span style="text-align:center;">${item.price} ج.م</span>
            <span style="text-align:center;font-weight:bold;">${item.total} ج.م</span>
            <span style="text-align:center;"><button onclick="removeSaleItem(${i})" style="background:#E17055;color:white;border:none;border-radius:4px;padding:2px 10px;cursor:pointer;font-size:11px;">✕</button></span>
        </div>`;
    });
    list.innerHTML = html;
    updateSaleTotals();
}

function removeSaleItem(i) { saleTotal -= saleItems[i].total; saleItems.splice(i, 1); updateSaleUI(); showToast('🗑️ تم الحذف'); }

function updateSaleTotals() {
    const discount = parseFloat(document.getElementById('saleDiscount').value) || 0;
    const paid = parseFloat(document.getElementById('salePaid').value) || 0;
    const totalAfterDiscount = saleTotal - discount;
    const tax = totalAfterDiscount * 0.14;
    const totalWithTax = totalAfterDiscount + tax;
    const balance = totalWithTax - paid;
    document.getElementById('saleTotalDisplay').textContent = totalAfterDiscount + ' ج.م';
    document.getElementById('saleTaxDisplay').textContent = tax + ' ج.م';
    const el = document.getElementById('saleBalanceDisplay');
    el.textContent = balance + ' ج.م';
    el.style.color = balance > 0 ? '#E17055' : '#00B894';
}

function toggleInstallmentFields() {
    const type = document.getElementById('saleType').value;
    const fields = document.getElementById('installmentFields');
    if (type === 'installment') {
        fields.style.display = 'block';
        updateInstallmentCalc();
    } else {
        fields.style.display = 'none';
    }
}

function updateInstallmentCalc() {
    const total = saleTotal - (parseFloat(document.getElementById('saleDiscount').value) || 0);
    const count = parseInt(document.getElementById('installmentCount').value) || 1;
    if (count > 0 && total > 0) {
        const amount = total / count;
        document.getElementById('installmentAmount').value = amount.toFixed(2);
        generateInstallmentSchedule(amount, count);
    }
}

function generateInstallmentSchedule(amount, count) {
    const schedule = document.getElementById('installmentSchedule');
    let startDate = document.getElementById('installmentStartDate').value;
    if (!startDate) {
        const today = new Date();
        startDate = today.toISOString().split('T')[0];
        document.getElementById('installmentStartDate').value = startDate;
    }
    let html = '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:5px;font-weight:bold;background:#2E4057;color:white;padding:5px 8px;border-radius:6px;">';
    html += '<span>#</span><span>التاريخ</span><span>المبلغ</span></div>';
    const date = new Date(startDate);
    for (let i = 0; i < count; i++) {
        const d = new Date(date);
        d.setMonth(d.getMonth() + i);
        html += `<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:5px;padding:4px 8px;border-bottom:1px solid #eee;font-size:12px;">
            <span>${i + 1}</span>
            <span>${d.toLocaleDateString('ar-EG')}</span>
            <span>${amount.toFixed(2)} ج.م</span>
        </div>`;
    }
    schedule.innerHTML = html;
}

function saveSaleInvoice() {
    let client = document.getElementById('saleClient').value.trim();
    const clientNew = document.getElementById('saleClientNew').value.trim();
    if (clientNew) client = clientNew;
    const invNum = document.getElementById('saleInvoiceNumber').value;
    const date = document.getElementById('saleInvoiceDate').value;
    const type = document.getElementById('saleType').value;
    const paymentMethod = document.getElementById('salePaymentMethodSelect').value;
    const paymentAccount = document.getElementById('salePaymentAccount').value.trim();
    const discount = parseFloat(document.getElementById('saleDiscount').value) || 0;
    const paid = parseFloat(document.getElementById('salePaid').value) || 0;
    if (!client) return showToast('⚠️ أدخل اسم العميل');
    if (saleItems.length === 0) return showToast('⚠️ أضف منتجات');
    const d = getData();
    if (clientNew && !d.clients.find(c => c.name === clientNew)) {
        d.clients.push({ id: Date.now().toString(), name: clientNew, phone: '', address: '', type: 'عميل', balance: 0, creditLimit: 0, taxNumber: '', notes: '', email: '', paymentPeriod: 30 });
    }
    let can = true;
    saleItems.forEach(item => { const p = d.products.find(x => x.name === item.name); if (p && p.qty < item.qty) { can = false; showToast('⚠️ الكمية غير متوفرة لـ ' + item.name); } });
    if (!can) return;
    saleItems.forEach(item => { const p = d.products.find(x => x.name === item.name); if (p) p.qty -= item.qty; });
    const totalAfterDiscount = saleTotal - discount;
    const tax = totalAfterDiscount * 0.14;
    const totalWithTax = totalAfterDiscount + tax;
    const inv = { id: invNum, client, date, type, paymentMethod, paymentAccount, discount, tax, items: JSON.parse(JSON.stringify(saleItems)), total: saleTotal, totalAfterDiscount, totalWithTax, paid, balance: totalWithTax - paid, isReturn: false };
    d.sales.push(inv);
    if (paid > 0) {
        if (paymentMethod === 'cash') { d.cashTreasury = (d.cashTreasury || 0) + paid; }
        else if (paymentMethod === 'vodafone' || paymentMethod === 'instapay') { d.walletTreasury = (d.walletTreasury || 0) + paid; }
        else if (paymentMethod === 'bank') { d.bankTreasury = (d.bankTreasury || 0) + paid; }
        d.treasury = (d.treasury || 0) + paid;
        d.treasuryLog.push({ desc: 'بيع - ' + client + ' (' + invNum + ') - ' + paymentMethod, amount: paid });
    }
    // حفظ الأقساط
    if (type === 'installment' && paid < totalWithTax) {
        const count = parseInt(document.getElementById('installmentCount').value) || 1;
        const installmentAmount = (totalWithTax - paid) / count;
        if (!d.installments) d.installments = [];
        for (let i = 0; i < count; i++) {
            d.installments.push({ invoiceId: invNum, client, number: i + 1, total: count, amount: installmentAmount, paid: false, dueDate: new Date(Date.now() + (i + 1) * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] });
        }
    }
    saveLocal();
    showToast('✅ تم حفظ ' + invNum + ' بقيمة ' + totalWithTax + ' ج.م');
    printSaleInvoice(invNum);
    clearSaleInvoice();
    updateUI();
}

function clearSaleInvoice() {
    saleItems = []; saleTotal = 0; saleDiscount = 0;
    document.getElementById('saleClient').value = '';
    document.getElementById('saleClientNew').value = '';
    document.getElementById('salePaid').value = 0;
    document.getElementById('saleDiscount').value = 0;
    document.getElementById('salePaymentAccount').value = '';
    updateSaleUI();
    document.getElementById('saleProductSearch').value = '';
    document.getElementById('saleQty').value = 1;
    document.getElementById('salePrice').value = '';
    document.getElementById('productInfoDisplay').style.display = 'none';
    initSaleInvoice();
}

function printSaleInvoice(id) {
    const d = getData(), inv = d.sales.find(s => s.id === id);
    if (!inv) return showToast('⚠️ غير موجودة');
    const c = d.company || {};
    const p = d.profile || {};
    const tn = { cash: 'كاش', credit: 'آجل', installment: 'تقسيط' };
    const pm = { cash: 'خزنة نقدي', vodafone: 'فودافون كاش', instapay: 'إنستاباي', bank: 'تحويل بنكي' };
    let items = '';
    inv.items.forEach(item => {
        items += `<tr><td style="padding:6px;border:1px solid #ddd;text-align:right;">${item.name}</td><td style="padding:6px;border:1px solid #ddd;text-align:center;">${item.qty}</td><td style="padding:6px;border:1px solid #ddd;text-align:center;">${item.price} ج.م</td><td style="padding:6px;border:1px solid #ddd;text-align:left;font-weight:bold;">${item.total} ج.م</td></tr>`;
    });
    const logo = c.logo ? `<img src="${c.logo}" style="max-height:60px;margin-bottom:5px;">` : '';
    const html = `<div class="print-area" style="direction:rtl;font-family:Arial;padding:20px;max-width:800px;margin:auto;background:white;color:#333;border:1px solid #ddd;border-radius:10px;">
        <div style="text-align:center;border-bottom:2px solid #2E4057;padding-bottom:15px;margin-bottom:20px;">
            ${logo}
            <h2 style="margin:0;color:#2E4057;">${c.name || p.shopName || 'نظام راشد'}</h2>
            <p style="font-size:12px;color:#666;margin:2px 0;">${c.address || p.branch || ''}</p>
            <p style="font-size:12px;color:#666;">📞 ${c.phone || ''} | 📧 ${c.email || ''} | 🆔 ${c.taxNumber || ''}</p>
            <p style="font-size:14px;font-weight:bold;color:#2E4057;margin:5px 0;">فاتورة بيع</p>
        </div>
        <div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:15px;flex-wrap:wrap;">
            <div><strong>رقم:</strong> ${inv.id}<br><strong>التاريخ:</strong> ${inv.date}</div>
            <div style="text-align:left;"><strong>العميل:</strong> ${inv.client}<br><strong>نوع الدفع:</strong> ${tn[inv.type] || inv.type}</div>
            <div style="text-align:left;"><strong>وسيلة الدفع:</strong> ${pm[inv.paymentMethod] || inv.paymentMethod}<br>${inv.paymentAccount ? '<strong>رقم الحساب:</strong> ' + inv.paymentAccount : ''}</div>
        </div>
        <table style="width:100%;border-collapse:collapse;font-size:13px;margin-bottom:15px;">
            <thead><tr style="background:#2E4057;color:white;"><th style="padding:8px;text-align:right;border:1px solid #2E4057;">المنتج</th><th style="padding:8px;text-align:center;border:1px solid #2E4057;">الكمية</th><th style="padding:8px;text-align:center;border:1px solid #2E4057;">السعر</th><th style="padding:8px;text-align:left;border:1px solid #2E4057;">الإجمالي</th></tr></thead>
            <tbody>${items}</tbody>
            <tfoot>
                <tr style="background:#f0f2f5;font-weight:bold;"><td colspan="3" style="padding:8px;border:1px solid #ddd;text-align:left;">الإجمالي</td><td style="padding:8px;border:1px solid #ddd;color:#2E4057;font-size:16px;">${inv.total || 0} ج.م</td></tr>
                ${inv.discount ? `<tr><td colspan="3" style="padding:8px;border:1px solid #ddd;text-align:left;">الخصم</td><td style="padding:8px;border:1px solid #ddd;color:#E17055;font-size:14px;">-${inv.discount} ج.م</td></tr>` : ''}
                <tr style="font-weight:bold;"><td colspan="3" style="padding:8px;border:1px solid #ddd;text-align:left;">الإجمالي بعد الخصم</td><td style="padding:8px;border:1px solid #ddd;color:#2E4057;font-size:16px;">${inv.totalAfterDiscount || inv.total || 0} ج.م</td></tr>
                <tr><td colspan="3" style="padding:8px;border:1px solid #ddd;text-align:left;">الضريبة (14%)</td><td style="padding:8px;border:1px solid #ddd;color:#FDCB6E;font-weight:bold;">${inv.tax || 0} ج.م</td></tr>
                <tr style="background:#f0f2f5;font-weight:bold;"><td colspan="3" style="padding:8px;border:1px solid #ddd;text-align:left;">الإجمالي النهائي</td><td style="padding:8px;border:1px solid #ddd;color:#2E4057;font-size:16px;">${inv.totalWithTax || inv.total || 0} ج.م</td></tr>
                <tr><td colspan="3" style="padding:8px;border:1px solid #ddd;text-align:left;">المدفوع</td><td style="padding:8px;border:1px solid #ddd;color:#00B894;font-weight:bold;">${inv.paid || 0} ج.م</td></tr>
                <tr style="font-weight:bold;"><td colspan="3" style="padding:8px;border:1px solid #ddd;text-align:left;">المتبقي</td><td style="padding:8px;border:1px solid #ddd;color:${(inv.balance || 0) > 0 ? '#E17055' : '#00B894'};font-size:16px;">${inv.balance || 0} ج.م</td></tr>
            </tfoot>
        </table>
        <div style="text-align:center;font-size:11px;color:#999;margin-top:15px;border-top:1px solid #ddd;padding-top:10px;">شكراً لتعاملكم معنا - ${c.name || p.shopName || 'نظام راشد'}</div>
    </div>`;
    const win = window.open('', '_blank');
    if (win) {
        win.document.write(`<html><head><meta charset="UTF-8"><title>فاتورة ${inv.id}</title><style>body{margin:0;padding:20px;background:#f5f5f5;display:flex;justify-content:center;align-items:center;min-height:100vh;}@media print{body{background:white;padding:0;}.print-area{border:none!important;}}</style></head><body>${html}</body></html>`);
        win.document.close();
        win.focus();
        setTimeout(() => win.print(), 500);
    }
}

function printSaleInvoiceCurrent() {
    const invNum = document.getElementById('saleInvoiceNumber').value;
    if (saleItems.length === 0) return showToast('⚠️ لا توجد منتجات للطباعة');
    const d = getData();
    const client = document.getElementById('saleClient').value.trim() || document.getElementById('saleClientNew').value.trim() || 'عميل';
    const date = document.getElementById('saleInvoiceDate').value;
    const type = document.getElementById('saleType').value;
    const paymentMethod = document.getElementById('salePaymentMethodSelect').value;
    const paymentAccount = document.getElementById('salePaymentAccount').value.trim();
    const discount = parseFloat(document.getElementById('saleDiscount').value) || 0;
    const paid = parseFloat(document.getElementById('salePaid').value) || 0;
    const totalAfterDiscount = saleTotal - discount;
    const tax = totalAfterDiscount * 0.14;
    const totalWithTax = totalAfterDiscount + tax;
    const tempInv = {
        id: invNum, client, date, type, paymentMethod, paymentAccount,
        discount, tax, items: saleItems, total: saleTotal,
        totalAfterDiscount, totalWithTax, paid, balance: totalWithTax - paid,
        isReturn: false
    };
    const c = d.company || {};
    const p = d.profile || {};
    const tn = { cash: 'كاش', credit: 'آجل', installment: 'تقسيط' };
    const pm = { cash: 'خزنة نقدي', vodafone: 'فودافون كاش', instapay: 'إنستاباي', bank: 'تحويل بنكي' };
    let items = '';
    tempInv.items.forEach(item => {
        items += `<tr><td style="padding:6px;border:1px solid #ddd;text-align:right;">${item.name}</td><td style="padding:6px;border:1px solid #ddd;text-align:center;">${item.qty}</td><td style="padding:6px;border:1px solid #ddd;text-align:center;">${item.price} ج.م</td><td style="padding:6px;border:1px solid #ddd;text-align:left;font-weight:bold;">${item.total} ج.م</td></tr>`;
    });
    const logo = c.logo ? `<img src="${c.logo}" style="max-height:60px;margin-bottom:5px;">` : '';
    const html = `<div class="print-area" style="direction:rtl;font-family:Arial;padding:20px;max-width:800px;margin:auto;background:white;color:#333;border:1px solid #ddd;border-radius:10px;">
        <div style="text-align:center;border-bottom:2px solid #2E4057;padding-bottom:15px;margin-bottom:20px;">
            ${logo}
            <h2 style="margin:0;color:#2E4057;">${c.name || p.shopName || 'نظام راشد'}</h2>
            <p style="font-size:12px;color:#666;margin:2px 0;">${c.address || p.branch || ''}</p>
            <p style="font-size:12px;color:#666;">📞 ${c.phone || ''} | 📧 ${c.email || ''} | 🆔 ${c.taxNumber || ''}</p>
            <p style="font-size:14px;font-weight:bold;color:#2E4057;margin:5px 0;">فاتورة بيع</p>
        </div>
        <div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:15px;flex-wrap:wrap;">
            <div><strong>رقم:</strong> ${tempInv.id}<br><strong>التاريخ:</strong> ${tempInv.date}</div>
            <div style="text-align:left;"><strong>العميل:</strong> ${tempInv.client}<br><strong>نوع الدفع:</strong> ${tn[tempInv.type] || tempInv.type}</div>
            <div style="text-align:left;"><strong>وسيلة الدفع:</strong> ${pm[tempInv.paymentMethod] || tempInv.paymentMethod}<br>${tempInv.paymentAccount ? '<strong>رقم الحساب:</strong> ' + tempInv.paymentAccount : ''}</div>
        </div>
        <table style="width:100%;border-collapse:collapse;font-size:13px;margin-bottom:15px;">
            <thead><tr style="background:#2E4057;color:white;"><th style="padding:8px;text-align:right;border:1px solid #2E4057;">المنتج</th><th style="padding:8px;text-align:center;border:1px solid #2E4057;">الكمية</th><th style="padding:8px;text-align:center;border:1px solid #2E4057;">السعر</th><th style="padding:8px;text-align:left;border:1px solid #2E4057;">الإجمالي</th></tr></thead>
            <tbody>${items}</tbody>
            <tfoot>
                <tr style="background:#f0f2f5;font-weight:bold;"><td colspan="3" style="padding:8px;border:1px solid #ddd;text-align:left;">الإجمالي</td><td style="padding:8px;border:1px solid #ddd;color:#2E4057;font-size:16px;">${tempInv.total || 0} ج.م</td></tr>
                ${tempInv.discount ? `<tr><td colspan="3" style="padding:8px;border:1px solid #ddd;text-align:left;">الخصم</td><td style="padding:8px;border:1px solid #ddd;color:#E17055;font-size:14px;">-${tempInv.discount} ج.م</td></tr>` : ''}
                <tr style="font-weight:bold;"><td colspan="3" style="padding:8px;border:1px solid #ddd;text-align:left;">الإجمالي بعد الخصم</td><td style="padding:8px;border:1px solid #ddd;color:#2E4057;font-size:16px;">${tempInv.totalAfterDiscount || tempInv.total || 0} ج.م</td></tr>
                <tr><td colspan="3" style="padding:8px;border:1px solid #ddd;text-align:left;">الضريبة (14%)</td><td style="padding:8px;border:1px solid #ddd;color:#FDCB6E;font-weight:bold;">${tempInv.tax || 0} ج.م</td></tr>
                <tr style="background:#f0f2f5;font-weight:bold;"><td colspan="3" style="padding:8px;border:1px solid #ddd;text-align:left;">الإجمالي النهائي</td><td style="padding:8px;border:1px solid #ddd;color:#2E4057;font-size:16px;">${tempInv.totalWithTax || tempInv.total || 0} ج.م</td></tr>
                <tr><td colspan="3" style="padding:8px;border:1px solid #ddd;text-align:left;">المدفوع</td><td style="padding:8px;border:1px solid #ddd;color:#00B894;font-weight:bold;">${tempInv.paid || 0} ج.م</td></tr>
                <tr style="font-weight:bold;"><td colspan="3" style="padding:8px;border:1px solid #ddd;text-align:left;">المتبقي</td><td style="padding:8px;border:1px solid #ddd;color:${(tempInv.balance || 0) > 0 ? '#E17055' : '#00B894'};font-size:16px;">${tempInv.balance || 0} ج.م</td></tr>
            </tfoot>
        </table>
        <div style="text-align:center;font-size:11px;color:#999;margin-top:15px;border-top:1px solid #ddd;padding-top:10px;">شكراً لتعاملكم معنا - ${c.name || p.shopName || 'نظام راشد'}</div>
    </div>`;
    const win = window.open('', '_blank');
    if (win) {
        win.document.write(`<html><head><meta charset="UTF-8"><title>فاتورة ${invNum}</title><style>body{margin:0;padding:20px;background:#f5f5f5;display:flex;justify-content:center;align-items:center;min-height:100vh;}@media print{body{background:white;padding:0;}.print-area{border:none!important;}}</style></head><body>${html}</body></html>`);
        win.document.close();
        win.focus();
        setTimeout(() => win.print(), 500);
    }
}

// ============================================================
// 10. مرتجع بيع (مختصر)
// ============================================================
function initReturnSale() {
    const d = getData();
    document.getElementById('saleInvoiceDate').value = new Date().toLocaleDateString('ar-EG');
    d.returnSaleCounter = (d.returnSaleCounter || 0) + 1;
    document.getElementById('saleInvoiceNumber').value = 'RET-INV-' + String(d.returnSaleCounter).padStart(4, '0');
    returnSaleItems = []; returnSaleTotal = 0;
    updateReturnSaleUI();
    saveLocal();
}

function addProductToReturnSale() {
    const name = document.getElementById('saleProductSearch').value.trim();
    const qty = parseInt(document.getElementById('saleQty').value) || 1;
    const price = parseFloat(document.getElementById('salePrice').value) || 0;
    if (!name || price <= 0 || qty <= 0) return showToast('⚠️ أدخل البيانات');
    const d = getData();
    const p = d.products.find(x => x.name === name);
    if (!p) return showToast('⚠️ المنتج غير موجود');
    const total = qty * price;
    returnSaleItems.push({ name, qty, price, total });
    returnSaleTotal += total;
    updateReturnSaleUI();
    document.getElementById('saleProductSearch').value = '';
    document.getElementById('saleQty').value = 1;
    document.getElementById('salePrice').value = '';
    showToast('✅ تم إضافة ' + name + ' للمرتجع');
}

function updateReturnSaleUI() {
    const list = document.getElementById('saleItemsList');
    if (!list) return;
    if (returnSaleItems.length === 0) {
        list.innerHTML = '<div style="text-align:center;padding:30px;color:#999;">أضف منتجات للمرتجع</div>';
        document.getElementById('saleTotalDisplay').textContent = '0 ج.م';
        updateReturnSaleBalance();
        return;
    }
    let html = '';
    returnSaleItems.forEach((item, i) => {
        html += `<div style="display:grid;grid-template-columns:2fr 0.8fr 1fr 1fr 0.8fr;padding:6px 10px;border-bottom:1px solid #eee;font-size:13px;align-items:center;background:#fff5f5;">
            <span>${item.name}</span><span style="text-align:center;">${item.qty}</span>
            <span style="text-align:center;">${item.price} ج.م</span>
            <span style="text-align:center;font-weight:bold;color:#E17055;">${item.total} ج.م</span>
            <span style="text-align:center;"><button onclick="removeReturnSaleItem(${i})" style="background:#E17055;color:white;border:none;border-radius:4px;padding:2px 10px;cursor:pointer;font-size:11px;">✕</button></span>
        </div>`;
    });
    list.innerHTML = html;
    document.getElementById('saleTotalDisplay').textContent = returnSaleTotal + ' ج.م';
    updateReturnSaleBalance();
}

function removeReturnSaleItem(i) { returnSaleTotal -= returnSaleItems[i].total; returnSaleItems.splice(i, 1); updateReturnSaleUI(); showToast('🗑️ تم الحذف'); }

function updateReturnSaleBalance() {
    const paid = parseFloat(document.getElementById('salePaid').value) || 0;
    const bal = returnSaleTotal - paid;
    const el = document.getElementById('saleBalanceDisplay');
    el.textContent = bal + ' ج.م';
    el.style.color = bal > 0 ? '#E17055' : '#00B894';
}

function saveReturnSaleInvoice() {
    let client = document.getElementById('saleClient').value.trim();
    const clientNew = document.getElementById('saleClientNew').value.trim();
    if (clientNew) client = clientNew;
    const invNum = document.getElementById('saleInvoiceNumber').value;
    const date = document.getElementById('saleInvoiceDate').value;
    const type = document.getElementById('saleType').value;
    const paymentMethod = document.getElementById('salePaymentMethodSelect').value;
    const paymentAccount = document.getElementById('salePaymentAccount').value.trim();
    const paid = parseFloat(document.getElementById('salePaid').value) || 0;
    if (!client) return showToast('⚠️ أدخل اسم العميل');
    if (returnSaleItems.length === 0) return showToast('⚠️ أضف منتجات');
    const d = getData();
    if (clientNew && !d.clients.find(c => c.name === clientNew)) {
        d.clients.push({ id: Date.now().toString(), name: clientNew, phone: '', address: '', type: 'عميل', balance: 0, creditLimit: 0, taxNumber: '', notes: '', email: '', paymentPeriod: 30 });
    }
    returnSaleItems.forEach(item => {
        let p = d.products.find(x => x.name === item.name);
        if (p) p.qty = (p.qty || 0) + item.qty;
        else d.products.push({ id: Date.now().toString(), name: item.name, desc: 'من مرتجع', qty: item.qty, buy: item.price * 0.8, sell: item.price, barcode: Math.floor(10000000 + Math.random() * 90000000).toString(), mainCategory: 'عام', subCategory: '', unit: 'قطعة', minQty: 0, location: '', tax: 14 });
    });
    const inv = { id: invNum, client, date, type, paymentMethod, paymentAccount, items: JSON.parse(JSON.stringify(returnSaleItems)), total: returnSaleTotal, paid, balance: returnSaleTotal - paid, isReturn: true };
    d.sales.push(inv);
    if (paid > 0) {
        if (paymentMethod === 'cash') { d.cashTreasury = (d.cashTreasury || 0) - paid; }
        else if (paymentMethod === 'vodafone' || paymentMethod === 'instapay') { d.walletTreasury = (d.walletTreasury || 0) - paid; }
        else if (paymentMethod === 'bank') { d.bankTreasury = (d.bankTreasury || 0) - paid; }
        d.treasury = (d.treasury || 0) - paid;
        d.treasuryLog.push({ desc: 'مرتجع بيع - ' + client + ' (' + invNum + ')', amount: -paid });
    }
    saveLocal();
    showToast('✅ تم حفظ مرتجع ' + invNum + ' بقيمة ' + returnSaleTotal + ' ج.م');
    clearReturnSaleInvoice();
    updateUI();
}

function clearReturnSaleInvoice() {
    returnSaleItems = []; returnSaleTotal = 0;
    document.getElementById('saleClient').value = '';
    document.getElementById('saleClientNew').value = '';
    document.getElementById('salePaid').value = 0;
    document.getElementById('salePaymentAccount').value = '';
    updateReturnSaleUI();
    document.getElementById('saleProductSearch').value = '';
    document.getElementById('saleQty').value = 1;
    document.getElementById('salePrice').value = '';
    document.getElementById('productInfoDisplay').style.display = 'none';
    initReturnSale();
}

function switchSalesMode(mode) {
    const a = document.getElementById('saleAddFields'), r = document.getElementById('saleReturnFields');
    const ab = document.getElementById('saleModeAdd'), rb = document.getElementById('saleModeReturn');
    if (mode === 'add') {
        if (a) a.style.display = 'block';
        if (r) r.style.display = 'none';
        if (ab) ab.classList.add('active');
        if (rb) rb.classList.remove('active');
        document.getElementById('saleProductSearch').placeholder = '🔍 اكتب اسم أو باركود';
        document.getElementById('saleInvoiceNumber').style.borderColor = '#2E4057';
        document.querySelector('.modal-box').style.borderColor = '#eee';
        initSaleInvoice();
    } else {
        if (a) a.style.display = 'none';
        if (r) r.style.display = 'block';
        if (ab) ab.classList.remove('active');
        if (rb) rb.classList.add('active');
        document.getElementById('saleProductSearch').placeholder = '🔍 اكتب اسم المنتج للمرتجع';
        document.getElementById('saleInvoiceNumber').style.borderColor = '#E17055';
        document.querySelector('.modal-box').style.borderColor = '#E17055';
        initReturnSale();
    }
}

// ============================================================
// 11. المشتريات (مختصرة)
// ============================================================
function initPurchaseInvoice() {
    const d = getData();
    document.getElementById('purchaseInvoiceDate').value = new Date().toLocaleDateString('ar-EG');
    d.purchaseCounter = (d.purchaseCounter || 0) + 1;
    document.getElementById('purchaseInvoiceNumber').value = 'PUR-' + String(d.purchaseCounter).padStart(4, '0');
    purchaseItems = []; purchaseTotal = 0; purchaseDiscount = 0;
    document.getElementById('purchaseDiscount').value = 0;
    document.getElementById('purchasePaid').value = 0;
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
    document.getElementById('purchaseProductInfo').style.display = 'none';
    showToast('✅ تم إضافة ' + name);
}

function updatePurchaseUI() {
    const list = document.getElementById('purchaseItemsList');
    if (!list) return;
    if (purchaseItems.length === 0) {
        list.innerHTML = '<div style="text-align:center;padding:30px;color:#999;">أضف منتجات</div>';
        document.getElementById('purchaseTotalDisplay').textContent = '0 ج.م';
        updatePurchaseTotals();
        return;
    }
    let html = '';
    purchaseItems.forEach((item, i) => {
        html += `<div style="display:grid;grid-template-columns:2fr 0.8fr 1fr 1fr 0.8fr;padding:6px 10px;border-bottom:1px solid #eee;font-size:13px;align-items:center;">
            <span>${item.name}</span><span style="text-align:center;">${item.qty}</span>
            <span style="text-align:center;">${item.price} ج.م</span>
            <span style="text-align:center;font-weight:bold;">${item.total} ج.م</span>
            <span style="text-align:center;"><button onclick="removePurchaseItem(${i})" style="background:#E17055;color:white;border:none;border-radius:4px;padding:2px 10px;cursor:pointer;font-size:11px;">✕</button></span>
        </div>`;
    });
    list.innerHTML = html;
    updatePurchaseTotals();
}

function removePurchaseItem(i) { purchaseTotal -= purchaseItems[i].total; purchaseItems.splice(i, 1); updatePurchaseUI(); showToast('🗑️ تم الحذف'); }

function updatePurchaseTotals() {
    const discount = parseFloat(document.getElementById('purchaseDiscount').value) || 0;
    const paid = parseFloat(document.getElementById('purchasePaid').value) || 0;
    const totalAfterDiscount = purchaseTotal - discount;
    const balance = totalAfterDiscount - paid;
    document.getElementById('purchaseTotalDisplay').textContent = totalAfterDiscount + ' ج.م';
    const el = document.getElementById('purchaseBalanceDisplay');
    el.textContent = balance + ' ج.م';
    el.style.color = balance > 0 ? '#E17055' : '#00B894';
}

function savePurchaseInvoice() {
    let supplier = document.getElementById('purchaseSupplier').value.trim();
    const supplierNew = document.getElementById('purchaseSupplierNew').value.trim();
    if (supplierNew) supplier = supplierNew;
    const invNum = document.getElementById('purchaseInvoiceNumber').value;
    const date = document.getElementById('purchaseInvoiceDate').value;
    const type = document.getElementById('purchaseType').value;
    const paymentMethod = document.getElementById('purchasePaymentMethodSelect').value;
    const paymentAccount = document.getElementById('purchasePaymentAccount').value.trim();
    const discount = parseFloat(document.getElementById('purchaseDiscount').value) || 0;
    const paid = parseFloat(document.getElementById('purchasePaid').value) || 0;
    if (!supplier) return showToast('⚠️ أدخل اسم المورد');
    if (purchaseItems.length === 0) return showToast('⚠️ أضف منتجات');
    const d = getData();
    if (supplierNew && !d.suppliers.find(c => c.name === supplierNew)) {
        d.suppliers.push({ id: Date.now().toString(), name: supplierNew, phone: '', address: '', balance: 0, taxNumber: '', notes: '', email: '', paymentPeriod: 30 });
    }
    purchaseItems.forEach(item => {
        let p = d.products.find(x => x.name === item.name);
        if (p) p.qty = (p.qty || 0) + item.qty;
        else d.products.push({ id: Date.now().toString(), name: item.name, desc: '', qty: item.qty, buy: item.price, sell: item.price * 1.2, barcode: Math.floor(10000000 + Math.random() * 90000000).toString(), mainCategory: 'عام', subCategory: '', unit: 'قطعة', minQty: 0, location: '', tax: 14 });
    });
    const totalAfterDiscount = purchaseTotal - discount;
    const inv = { id: invNum, supplier, date, type, paymentMethod, paymentAccount, discount, items: JSON.parse(JSON.stringify(purchaseItems)), total: purchaseTotal, totalAfterDiscount, paid, balance: totalAfterDiscount - paid, isReturn: false };
    d.purchases.push(inv);
    if (paid > 0) {
        if (paymentMethod === 'cash') { d.cashTreasury = (d.cashTreasury || 0) - paid; }
        else if (paymentMethod === 'vodafone' || paymentMethod === 'instapay') { d.walletTreasury = (d.walletTreasury || 0) - paid; }
        else if (paymentMethod === 'bank') { d.bankTreasury = (d.bankTreasury || 0) - paid; }
        d.treasury = (d.treasury || 0) - paid;
        d.treasuryLog.push({ desc: 'شراء - ' + supplier + ' (' + invNum + ') - ' + paymentMethod, amount: -paid });
    }
    saveLocal();
    showToast('✅ تم حفظ ' + invNum + ' بقيمة ' + totalAfterDiscount + ' ج.م');
    printPurchaseInvoice(invNum);
    clearPurchaseInvoice();
    updateUI();
}

function clearPurchaseInvoice() {
    purchaseItems = []; purchaseTotal = 0; purchaseDiscount = 0;
    document.getElementById('purchaseSupplier').value = '';
    document.getElementById('purchaseSupplierNew').value = '';
    document.getElementById('purchasePaid').value = 0;
    document.getElementById('purchaseDiscount').value = 0;
    document.getElementById('purchasePaymentAccount').value = '';
    updatePurchaseUI();
    document.getElementById('purchaseProductSearch').value = '';
    document.getElementById('purchaseQty').value = 1;
    document.getElementById('purchasePrice').value = '';
    document.getElementById('purchaseProductInfo').style.display = 'none';
    initPurchaseInvoice();
}

function printPurchaseInvoice(id) {
    const d = getData(), inv = d.purchases.find(p => p.id === id);
    if (!inv) return showToast('⚠️ غير موجودة');
    const c = d.company || {};
    const p = d.profile || {};
    const pm = { cash: 'خزنة نقدي', vodafone: 'فودافون كاش', instapay: 'إنستاباي', bank: 'تحويل بنكي' };
    let items = '';
    inv.items.forEach(item => {
        items += `<tr><td style="padding:6px;border:1px solid #ddd;text-align:right;">${item.name}</td><td style="padding:6px;border:1px solid #ddd;text-align:center;">${item.qty}</td><td style="padding:6px;border:1px solid #ddd;text-align:center;">${item.price} ج.م</td><td style="padding:6px;border:1px solid #ddd;text-align:left;font-weight:bold;">${item.total} ج.م</td></tr>`;
    });
    const logo = c.logo ? `<img src="${c.logo}" style="max-height:60px;margin-bottom:5px;">` : '';
    const html = `<div class="print-area" style="direction:rtl;font-family:Arial;padding:20px;max-width:800px;margin:auto;background:white;color:#333;border:1px solid #ddd;border-radius:10px;">
        <div style="text-align:center;border-bottom:2px solid #E17055;padding-bottom:15px;margin-bottom:20px;">
            ${logo}
            <h2 style="margin:0;color:#E17055;">${c.name || p.shopName || 'نظام راشد'}</h2>
            <p style="font-size:12px;color:#666;margin:2px 0;">${c.address || p.branch || ''}</p>
            <p style="font-size:14px;font-weight:bold;color:#E17055;margin:5px 0;">فاتورة شراء</p>
        </div>
        <div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:15px;flex-wrap:wrap;">
            <div><strong>رقم:</strong> ${inv.id}<br><strong>التاريخ:</strong> ${inv.date}</div>
            <div style="text-align:left;"><strong>المورد:</strong> ${inv.supplier}<br><strong>نوع الدفع:</strong> ${inv.type === 'cash' ? 'كاش' : 'آجل'}</div>
            <div style="text-align:left;"><strong>وسيلة الدفع:</strong> ${pm[inv.paymentMethod] || inv.paymentMethod}<br>${inv.paymentAccount ? '<strong>رقم الحساب:</strong> ' + inv.paymentAccount : ''}</div>
        </div>
        <table style="width:100%;border-collapse:collapse;font-size:13px;margin-bottom:15px;">
            <thead><tr style="background:#E17055;color:white;"><th style="padding:8px;text-align:right;border:1px solid #E17055;">المنتج</th><th style="padding:8px;text-align:center;border:1px solid #E17055;">الكمية</th><th style="padding:8px;text-align:center;border:1px solid #E17055;">السعر</th><th style="padding:8px;text-align:left;border:1px solid #E17055;">الإجمالي</th></tr></thead>
            <tbody>${items}</tbody>
            <tfoot>
                <tr style="background:#f0f2f5;font-weight:bold;"><td colspan="3" style="padding:8px;border:1px solid #ddd;text-align:left;">الإجمالي</td><td style="padding:8px;border:1px solid #ddd;color:#E17055;font-size:16px;">${inv.total || 0} ج.م</td></tr>
                ${inv.discount ? `<tr><td colspan="3" style="padding:8px;border:1px solid #ddd;text-align:left;">الخصم</td><td style="padding:8px;border:1px solid #ddd;color:#E17055;font-size:14px;">-${inv.discount} ج.م</td></tr>` : ''}
                <tr style="font-weight:bold;"><td colspan="3" style="padding:8px;border:1px solid #ddd;text-align:left;">الإجمالي بعد الخصم</td><td style="padding:8px;border:1px solid #ddd;color:#E17055;font-size:16px;">${inv.totalAfterDiscount || inv.total || 0} ج.م</td></tr>
                <tr><td colspan="3" style="padding:8px;border:1px solid #ddd;text-align:left;">المدفوع</td><td style="padding:8px;border:1px solid #ddd;color:#00B894;font-weight:bold;">${inv.paid || 0} ج.م</td></tr>
                <tr style="font-weight:bold;"><td colspan="3" style="padding:8px;border:1px solid #ddd;text-align:left;">المتبقي</td><td style="padding:8px;border:1px solid #ddd;color:${(inv.balance || 0) > 0 ? '#E17055' : '#00B894'};font-size:16px;">${inv.balance || 0} ج.م</td></tr>
            </tfoot>
        </table>
        <div style="text-align:center;font-size:11px;color:#999;margin-top:15px;border-top:1px solid #ddd;padding-top:10px;">شكراً لتعاملكم معنا - ${c.name || p.shopName || 'نظام راشد'}</div>
    </div>`;
    const win = window.open('', '_blank');
    if (win) {
        win.document.write(`<html><head><meta charset="UTF-8"><title>فاتورة ${inv.id}</title><style>body{margin:0;padding:20px;background:#f5f5f5;display:flex;justify-content:center;align-items:center;min-height:100vh;}@media print{body{background:white;padding:0;}.print-area{border:none!important;}}</style></head><body>${html}</body></html>`);
        win.document.close();
        win.focus();
        setTimeout(() => win.print(), 500);
    }
}

function printPurchaseInvoiceCurrent() {
    const invNum = document.getElementById('purchaseInvoiceNumber').value;
    if (purchaseItems.length === 0) return showToast('⚠️ لا توجد منتجات للطباعة');
    const d = getData();
    const supplier = document.getElementById('purchaseSupplier').value.trim() || document.getElementById('purchaseSupplierNew').value.trim() || 'مورد';
    const date = document.getElementById('purchaseInvoiceDate').value;
    const type = document.getElementById('purchaseType').value;
    const paymentMethod = document.getElementById('purchasePaymentMethodSelect').value;
    const paymentAccount = document.getElementById('purchasePaymentAccount').value.trim();
    const discount = parseFloat(document.getElementById('purchaseDiscount').value) || 0;
    const paid = parseFloat(document.getElementById('purchasePaid').value) || 0;
    const totalAfterDiscount = purchaseTotal - discount;
    const tempInv = {
        id: invNum, supplier, date, type, paymentMethod, paymentAccount,
        discount, items: purchaseItems, total: purchaseTotal,
        totalAfterDiscount, paid, balance: totalAfterDiscount - paid,
        isReturn: false
    };
    const c = d.company || {};
    const p = d.profile || {};
    const pm = { cash: 'خزنة نقدي', vodafone: 'فودافون كاش', instapay: 'إنستاباي', bank: 'تحويل بنكي' };
    let items = '';
    tempInv.items.forEach(item => {
        items += `<tr><td style="padding:6px;border:1px solid #ddd;text-align:right;">${item.name}</td><td style="padding:6px;border:1px solid #ddd;text-align:center;">${item.qty}</td><td style="padding:6px;border:1px solid #ddd;text-align:center;">${item.price} ج.م</td><td style="padding:6px;border:1px solid #ddd;text-align:left;font-weight:bold;">${item.total} ج.م</td></tr>`;
    });
    const logo = c.logo ? `<img src="${c.logo}" style="max-height:60px;margin-bottom:5px;">` : '';
    const html = `<div class="print-area" style="direction:rtl;font-family:Arial;padding:20px;max-width:800px;margin:auto;background:white;color:#333;border:1px solid #ddd;border-radius:10px;">
        <div style="text-align:center;border-bottom:2px solid #E17055;padding-bottom:15px;margin-bottom:20px;">
            ${logo}
            <h2 style="margin:0;color:#E17055;">${c.name || p.shopName || 'نظام راشد'}</h2>
            <p style="font-size:12px;color:#666;margin:2px 0;">${c.address || p.branch || ''}</p>
            <p style="font-size:14px;font-weight:bold;color:#E17055;margin:5px 0;">فاتورة شراء</p>
        </div>
        <div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:15px;flex-wrap:wrap;">
            <div><strong>رقم:</strong> ${tempInv.id}<br><strong>التاريخ:</strong> ${tempInv.date}</div>
            <div style="text-align:left;"><strong>المورد:</strong> ${tempInv.supplier}<br><strong>نوع الدفع:</strong> ${tempInv.type === 'cash' ? 'كاش' : 'آجل'}</div>
            <div style="text-align:left;"><strong>وسيلة الدفع:</strong> ${pm[tempInv.paymentMethod] || tempInv.paymentMethod}<br>${tempInv.paymentAccount ? '<strong>رقم الحساب:</strong> ' + tempInv.paymentAccount : ''}</div>
        </div>
        <table style="width:100%;border-collapse:collapse;font-size:13px;margin-bottom:15px;">
            <thead><tr style="background:#E17055;color:white;"><th style="padding:8px;text-align:right;border:1px solid #E17055;">المنتج</th><th style="padding:8px;text-align:center;border:1px solid #E17055;">الكمية</th><th style="padding:8px;text-align:center;border:1px solid #E17055;">السعر</th><th style="padding:8px;text-align:left;border:1px solid #E17055;">الإجمالي</th></tr></thead>
            <tbody>${items}</tbody>
            <tfoot>
                <tr style="background:#f0f2f5;font-weight:bold;"><td colspan="3" style="padding:8px;border:1px solid #ddd;text-align:left;">الإجمالي</td><td style="padding:8px;border:1px solid #ddd;color:#E17055;font-size:16px;">${tempInv.total || 0} ج.م</td></tr>
                ${tempInv.discount ? `<tr><td colspan="3" style="padding:8px;border:1px solid #ddd;text-align:left;">الخصم</td><td style="padding:8px;border:1px solid #ddd;color:#E17055;font-size:14px;">-${tempInv.discount} ج.م</td></tr>` : ''}
                <tr style="font-weight:bold;"><td colspan="3" style="padding:8px;border:1px solid #ddd;text-align:left;">الإجمالي بعد الخصم</td><td style="padding:8px;border:1px solid #ddd;color:#E17055;font-size:16px;">${tempInv.totalAfterDiscount || tempInv.total || 0} ج.م</td></tr>
                <tr><td colspan="3" style="padding:8px;border:1px solid #ddd;text-align:left;">المدفوع</td><td style="padding:8px;border:1px solid #ddd;color:#00B894;font-weight:bold;">${tempInv.paid || 0} ج.م</td></tr>
                <tr style="font-weight:bold;"><td colspan="3" style="padding:8px;border:1px solid #ddd;text-align:left;">المتبقي</td><td style="padding:8px;border:1px solid #ddd;color:${(tempInv.balance || 0) > 0 ? '#E17055' : '#00B894'};font-size:16px;">${tempInv.balance || 0} ج.م</td></tr>
            </tfoot>
        </table>
        <div style="text-align:center;font-size:11px;color:#999;margin-top:15px;border-top:1px solid #ddd;padding-top:10px;">شكراً لتعاملكم معنا - ${c.name || p.shopName || 'نظام راشد'}</div>
    </div>`;
    const win = window.open('', '_blank');
    if (win) {
        win.document.write(`<html><head><meta charset="UTF-8"><title>فاتورة ${invNum}</title><style>body{margin:0;padding:20px;background:#f5f5f5;display:flex;justify-content:center;align-items:center;min-height:100vh;}@media print{body{background:white;padding:0;}.print-area{border:none!important;}}</style></head><body>${html}</body></html>`);
        win.document.close();
        win.focus();
        setTimeout(() => win.print(), 500);
    }
}

// ============================================================
// 12. مرتجع شراء (مختصر)
// ============================================================
function initReturnPurchase() {
    const d = getData();
    document.getElementById('purchaseInvoiceDate').value = new Date().toLocaleDateString('ar-EG');
    d.returnPurchaseCounter = (d.returnPurchaseCounter || 0) + 1;
    document.getElementById('purchaseInvoiceNumber').value = 'RET-PUR-' + String(d.returnPurchaseCounter).padStart(4, '0');
    returnPurchaseItems = []; returnPurchaseTotal = 0;
    updateReturnPurchaseUI();
    saveLocal();
}

function addProductToReturnPurchase() {
    const name = document.getElementById('purchaseProductSearch').value.trim();
    const qty = parseInt(document.getElementById('purchaseQty').value) || 1;
    const price = parseFloat(document.getElementById('purchasePrice').value) || 0;
    if (!name || price <= 0 || qty <= 0) return showToast('⚠️ أدخل البيانات');
    const d = getData();
    const p = d.products.find(x => x.name === name);
    if (!p) return showToast('⚠️ المنتج غير موجود');
    if ((p.qty || 0) < qty) return showToast('⚠️ الكمية غير متوفرة');
    const total = qty * price;
    returnPurchaseItems.push({ name, qty, price, total });
    returnPurchaseTotal += total;
    updateReturnPurchaseUI();
    document.getElementById('purchaseProductSearch').value = '';
    document.getElementById('purchaseQty').value = 1;
    document.getElementById('purchasePrice').value = '';
    showToast('✅ تم إضافة ' + name + ' للمرتجع');
}

function updateReturnPurchaseUI() {
    const list = document.getElementById('purchaseItemsList');
    if (!list) return;
    if (returnPurchaseItems.length === 0) {
        list.innerHTML = '<div style="text-align:center;padding:30px;color:#999;">أضف منتجات للمرتجع</div>';
        document.getElementById('purchaseTotalDisplay').textContent = '0 ج.م';
        updateReturnPurchaseBalance();
        return;
    }
    let html = '';
    returnPurchaseItems.forEach((item, i) => {
        html += `<div style="display:grid;grid-template-columns:2fr 0.8fr 1fr 1fr 0.8fr;padding:6px 10px;border-bottom:1px solid #eee;font-size:13px;align-items:center;background:#fff5f5;">
            <span>${item.name}</span><span style="text-align:center;">${item.qty}</span>
            <span style="text-align:center;">${item.price} ج.م</span>
            <span style="text-align:center;font-weight:bold;color:#E17055;">${item.total} ج.م</span>
            <span style="text-align:center;"><button onclick="removeReturnPurchaseItem(${i})" style="background:#E17055;color:white;border:none;border-radius:4px;padding:2px 10px;cursor:pointer;font-size:11px;">✕</button></span>
        </div>`;
    });
    list.innerHTML = html;
    document.getElementById('purchaseTotalDisplay').textContent = returnPurchaseTotal + ' ج.م';
    updateReturnPurchaseBalance();
}

function removeReturnPurchaseItem(i) { returnPurchaseTotal -= returnPurchaseItems[i].total; returnPurchaseItems.splice(i, 1); updateReturnPurchaseUI(); showToast('🗑️ تم الحذف'); }

function updateReturnPurchaseBalance() {
    const paid = parseFloat(document.getElementById('purchasePaid').value) || 0;
    const bal = returnPurchaseTotal - paid;
    const el = document.getElementById('purchaseBalanceDisplay');
    el.textContent = bal + ' ج.م';
    el.style.color = bal > 0 ? '#E17055' : '#00B894';
}

function saveReturnPurchaseInvoice() {
    let supplier = document.getElementById('purchaseSupplier').value.trim();
    const supplierNew = document.getElementById('purchaseSupplierNew').value.trim();
    if (supplierNew) supplier = supplierNew;
    const invNum = document.getElementById('purchaseInvoiceNumber').value;
    const date = document.getElementById('purchaseInvoiceDate').value;
    const type = document.getElementById('purchaseType').value;
    const paymentMethod = document.getElementById('purchasePaymentMethodSelect').value;
    const paymentAccount = document.getElementById('purchasePaymentAccount').value.trim();
    const paid = parseFloat(document.getElementById('purchasePaid').value) || 0;
    if (!supplier) return showToast('⚠️ أدخل اسم المورد');
    if (returnPurchaseItems.length === 0) return showToast('⚠️ أضف منتجات');
    const d = getData();
    if (supplierNew && !d.suppliers.find(c => c.name === supplierNew)) {
        d.suppliers.push({ id: Date.now().toString(), name: supplierNew, phone: '', address: '', balance: 0, taxNumber: '', notes: '', email: '', paymentPeriod: 30 });
    }
    returnPurchaseItems.forEach(item => {
        const p = d.products.find(x => x.name === item.name);
        if (p) { if ((p.qty || 0) < item.qty) return showToast('⚠️ الكمية غير متوفرة'); p.qty = (p.qty || 0) - item.qty; }
    });
    const inv = { id: invNum, supplier, date, type, paymentMethod, paymentAccount, items: JSON.parse(JSON.stringify(returnPurchaseItems)), total: returnPurchaseTotal, paid, balance: returnPurchaseTotal - paid, isReturn: true };
    d.purchases.push(inv);
    if (paid > 0) {
        if (paymentMethod === 'cash') { d.cashTreasury = (d.cashTreasury || 0) + paid; }
        else if (paymentMethod === 'vodafone' || paymentMethod === 'instapay') { d.walletTreasury = (d.walletTreasury || 0) + paid; }
        else if (paymentMethod === 'bank') { d.bankTreasury = (d.bankTreasury || 0) + paid; }
        d.treasury = (d.treasury || 0) + paid;
        d.treasuryLog.push({ desc: 'مرتجع شراء - ' + supplier + ' (' + invNum + ')', amount: paid });
    }
    saveLocal();
    showToast('✅ تم حفظ مرتجع ' + invNum + ' بقيمة ' + returnPurchaseTotal + ' ج.م');
    clearReturnPurchaseInvoice();
    updateUI();
}

function clearReturnPurchaseInvoice() {
    returnPurchaseItems = []; returnPurchaseTotal = 0;
    document.getElementById('purchaseSupplier').value = '';
    document.getElementById('purchaseSupplierNew').value = '';
    document.getElementById('purchasePaid').value = 0;
    document.getElementById('purchasePaymentAccount').value = '';
    updateReturnPurchaseUI();
    document.getElementById('purchaseProductSearch').value = '';
    document.getElementById('purchaseQty').value = 1;
    document.getElementById('purchasePrice').value = '';
    document.getElementById('purchaseProductInfo').style.display = 'none';
    initReturnPurchase();
}

function switchPurchaseMode(mode) {
    const a = document.getElementById('purchaseAddFields'), r = document.getElementById('purchaseReturnFields');
    const ab = document.getElementById('purchaseModeAdd'), rb = document.getElementById('purchaseModeReturn');
    if (mode === 'add') {
        if (a) a.style.display = 'block';
        if (r) r.style.display = 'none';
        if (ab) ab.classList.add('active');
        if (rb) rb.classList.remove('active');
        document.getElementById('purchaseProductSearch').placeholder = '🔍 اكتب اسم المنتج';
        document.getElementById('purchaseInvoiceNumber').style.borderColor = '#E17055';
        document.querySelector('.modal-box').style.borderColor = '#eee';
        initPurchaseInvoice();
    } else {
        if (a) a.style.display = 'none';
        if (r) r.style.display = 'block';
        if (ab) ab.classList.remove('active');
        if (rb) rb.classList.add('active');
        document.getElementById('purchaseProductSearch').placeholder = '🔍 اكتب اسم المنتج للمرتجع';
        document.getElementById('purchaseInvoiceNumber').style.borderColor = '#E17055';
        document.querySelector('.modal-box').style.borderColor = '#E17055';
        initReturnPurchase();
    }
}

// ============================================================
// 13. المخازن
// ============================================================
function showWarehouseForm(type) {
    const f = document.getElementById('warehouseForm');
    const t = document.getElementById('warehouseFormTitle');
    if (!f) return;
    const titles = { add: '📥 إذن إضافة', remove: '📤 إذن صرف', transfer: '🔄 تحويل مخزن', inventory: '📋 جرد', opening: '📊 مخزون أول المدة' };
    t.textContent = titles[type] || 'إذن مخزن';
    f.style.display = 'block';
    f.dataset.type = type;
    document.getElementById('whTransferFrom').style.display = type === 'transfer' ? 'block' : 'none';
    document.getElementById('whTransferTo').style.display = type === 'transfer' ? 'block' : 'none';
    if (type === 'transfer') {
        document.getElementById('whFromWarehouse').value = 'رئيسي';
        document.getElementById('whToWarehouse').value = 'فرعي';
    }
    const d = getData();
    const sel = document.getElementById('whProduct');
    if (sel) {
        sel.innerHTML = '<option value="">اختر المنتج</option>';
        (d.products || []).forEach(p => { sel.innerHTML += `<option value="${p.id}">${p.name} (${p.qty || 0})</option>`; });
    }
    document.getElementById('whQty').value = 1;
    document.getElementById('whReason').value = '';
}

function saveWarehouse() {
    const d = getData();
    const type = document.getElementById('warehouseForm').dataset.type;
    const pid = document.getElementById('whProduct').value;
    const qty = parseInt(document.getElementById('whQty').value) || 0;
    const reason = document.getElementById('whReason').value.trim() || 'بدون سبب';
    if (!pid || qty <= 0) return showToast('⚠️ اختر المنتج والكمية');
    const p = d.products.find(x => x.id === pid);
    if (!p) return showToast('⚠️ المنتج غير موجود');
    if (!d.warehouse) d.warehouse = [];
    if (type === 'transfer') {
        const from = document.getElementById('whFromWarehouse').value;
        const to = document.getElementById('whToWarehouse').value;
        if (from === to) return showToast('⚠️ لا يمكن التحويل لنفس المخزن');
        if ((p.qty || 0) < qty) return showToast('⚠️ الكمية غير متوفرة في ' + from);
        p.qty = (p.qty || 0) - qty;
        d.warehouse.push({ id: 'TR-' + Date.now(), type: 'transfer', product: p.name, qty, from, to, reason, date: new Date().toLocaleDateString('ar-EG') });
        showToast(`✅ تم تحويل ${qty} من ${p.name} من ${from} إلى ${to}`);
    } else if (type === 'add' || type === 'opening') {
        p.qty = (p.qty || 0) + qty;
        d.warehouse.push({ id: 'WH-' + Date.now(), type, product: p.name, qty, reason, date: new Date().toLocaleDateString('ar-EG') });
        showToast('✅ تم إضافة ' + qty + ' من ' + p.name);
    } else if (type === 'remove') {
        if ((p.qty || 0) < qty) return showToast('⚠️ الكمية غير متوفرة');
        p.qty -= qty;
        d.warehouse.push({ id: 'WH-' + Date.now(), type, product: p.name, qty: -qty, reason, date: new Date().toLocaleDateString('ar-EG') });
        showToast('✅ تم صرف ' + qty + ' من ' + p.name);
    } else if (type === 'inventory') {
        d.warehouse.push({ id: 'INV-' + Date.now(), type, product: p.name, qty: p.qty || 0, reason, date: new Date().toLocaleDateString('ar-EG') });
        showToast('📋 تم جرد ' + p.name + ': ' + (p.qty || 0));
    }
    saveLocal();
    document.getElementById('warehouseForm').style.display = 'none';
    updateUI();
    updateWarehouseLog();
}

function updateWarehouseLog() {
    const d = getData();
    const w = d.warehouse || [];
    const log = document.getElementById('warehouseLog');
    if (!log) return;
    const icons = { add: '📥', remove: '📤', transfer: '🔄', inventory: '📋', opening: '📊' };
    log.innerHTML = w.slice().reverse().map(x => {
        let extra = '';
        if (x.type === 'transfer') { extra = ` (من ${x.from || 'رئيسي'} إلى ${x.to || 'فرعي'})`; }
        return `<div class="list-item" style="border-right: 3px solid ${x.type === 'transfer' ? '#6C5CE7' : (x.qty || 0) > 0 ? '#00B894' : '#E17055'}; padding-right: 10px;">
            <div><span style="font-weight:bold;">${icons[x.type] || '📦'} ${x.product}</span><span style="font-size:12px;color:#666;">${extra}</span><small style="color:#999;display:block;font-size:11px;">${x.reason || ''} | ${x.date || ''}</small></div>
            <div><span style="color:${(x.qty || 0) > 0 ? '#00B894' : '#E17055'};font-weight:bold;font-size:16px;">${(x.qty || 0) > 0 ? '+' : ''}${x.qty || 0}</span></div>
        </div>`;
    }).join('') || '<div style="text-align:center;color:#999;padding:10px;">لا توجد حركات مخازن</div>';
}

function showWarehouseReport() {
    const d = getData();
    const w = d.warehouse || [];
    const p = d.products || [];
    let r = '📊 تقرير المخازن\n\n📦 المنتجات:\n';
    p.forEach(x => { r += `  - ${x.name}: ${x.qty || 0} (سعر البيع: ${x.sell || 0})\n`; });
    r += '\n📋 آخر الحركات:\n';
    w.slice().reverse().slice(0, 10).forEach(x => {
        r += `  ${(x.qty || 0) > 0 ? '➕' : '➖'} ${x.product}: ${x.qty || 0} (${x.reason || ''}) - ${x.date || ''}\n`;
    });
    alert(r);
}

// ============================================================
// 14. المنتجات
// ============================================================
function addProduct() {
    const d = getData();
    const name = document.getElementById('prodName').value.trim();
    const desc = document.getElementById('prodDesc').value.trim();
    const qty = parseInt(document.getElementById('prodQty').value) || 0;
    const buy = parseFloat(document.getElementById('prodBuy').value) || 0;
    const sell = parseFloat(document.getElementById('prodSell').value) || 0;
    const mainCategory = document.getElementById('prodMainCategory').value || 'عام';
    const subCategory = document.getElementById('prodSubCategory').value.trim();
    const unit = document.getElementById('prodUnit').value || 'قطعة';
    const minQty = parseInt(document.getElementById('prodMinQty').value) || 0;
    const location = document.getElementById('prodLocation').value.trim();
    const tax = parseFloat(document.getElementById('prodTax').value) || 14;
    const barcode = document.getElementById('prodBarcode').value.trim() || Math.floor(10000000 + Math.random() * 90000000).toString();
    if (!name) return showToast('⚠️ أدخل اسم المنتج');
    if (d.products.find(x => x.barcode === barcode)) return showToast('⚠️ الباركود موجود');
    d.products.push({ id: Date.now().toString(), name, desc, qty, buy, sell, mainCategory, subCategory, unit, minQty, location, tax, barcode });
    saveLocal();
    clearProductForm();
    updateUI();
    showToast('✅ تم إضافة ' + name + ' - الباركود: ' + barcode);
}

function clearProductForm() {
    ['prodName', 'prodDesc', 'prodQty', 'prodBuy', 'prodSell', 'prodBarcode', 'prodMinQty', 'prodSubCategory', 'prodLocation'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = '';
    });
    document.getElementById('prodTax').value = 14;
}

// ============================================================
// 15. العملاء والموردين (منفصلين)
// ============================================================
function addClient() {
    const d = getData();
    const name = document.getElementById('clientName').value.trim();
    const phone = document.getElementById('clientPhone').value.trim();
    const address = document.getElementById('clientAddress').value.trim();
    const email = document.getElementById('clientEmail').value.trim();
    const balance = parseFloat(document.getElementById('clientBalance').value) || 0;
    const creditLimit = parseFloat(document.getElementById('clientCreditLimit').value) || 0;
    const paymentPeriod = parseInt(document.getElementById('clientPaymentPeriod').value) || 30;
    const taxNumber = document.getElementById('clientTaxNumber').value.trim();
    const notes = document.getElementById('clientNotes').value.trim();
    if (!name) return showToast('⚠️ أدخل اسم العميل');
    d.clients.push({ id: Date.now().toString(), name, phone, address, email, type: 'عميل', balance, creditLimit, paymentPeriod, taxNumber, notes });
    saveLocal();
    clearClientForm();
    updateUI();
    updateClientList();
    showToast('✅ تم إضافة العميل ' + name);
}

function clearClientForm() {
    ['clientName', 'clientPhone', 'clientAddress', 'clientEmail', 'clientTaxNumber', 'clientNotes'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = '';
    });
    ['clientBalance', 'clientCreditLimit', 'clientPaymentPeriod'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = '0';
    });
}

function updateClientList() {
    const d = getData();
    const clients = d.clients || [];
    const list = document.getElementById('clientList');
    if (!list) return;
    list.innerHTML = clients.map(c => `
        <div class="list-item">
            <div>
                <strong>${c.name}</strong>
                <br><small>📞 ${c.phone || ''}</small>
                ${c.balance ? `<br><small style="color:${c.balance > 0 ? '#E17055' : '#00B894'};">الرصيد: ${c.balance} ج.م</small>` : ''}
            </div>
            <div>
                <span style="background:#00B894;color:white;padding:2px 8px;border-radius:4px;font-size:11px;">عميل</span>
            </div>
        </div>
    `).join('') || '<div style="text-align:center;color:#999;padding:10px;">لا يوجد عملاء</div>';
}

function addSupplier() {
    const d = getData();
    const name = document.getElementById('supplierName').value.trim();
    const phone = document.getElementById('supplierPhone').value.trim();
    const address = document.getElementById('supplierAddress').value.trim();
    const email = document.getElementById('supplierEmail').value.trim();
    const balance = parseFloat(document.getElementById('supplierBalance').value) || 0;
    const paymentPeriod = parseInt(document.getElementById('supplierPaymentPeriod').value) || 30;
    const taxNumber = document.getElementById('supplierTaxNumber').value.trim();
    const notes = document.getElementById('supplierNotes').value.trim();
    if (!name) return showToast('⚠️ أدخل اسم المورد');
    d.suppliers.push({ id: Date.now().toString(), name, phone, address, email, type: 'مورد', balance, paymentPeriod, taxNumber, notes });
    saveLocal();
    clearSupplierForm();
    updateUI();
    updateSupplierList();
    showToast('✅ تم إضافة المورد ' + name);
}

function clearSupplierForm() {
    ['supplierName', 'supplierPhone', 'supplierAddress', 'supplierEmail', 'supplierTaxNumber', 'supplierNotes'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = '';
    });
    ['supplierBalance', 'supplierPaymentPeriod'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = '0';
    });
}

function updateSupplierList() {
    const d = getData();
    const suppliers = d.suppliers || [];
    const list = document.getElementById('supplierList');
    if (!list) return;
    list.innerHTML = suppliers.map(c => `
        <div class="list-item">
            <div>
                <strong>${c.name}</strong>
                <br><small>📞 ${c.phone || ''}</small>
                ${c.balance ? `<br><small style="color:${c.balance > 0 ? '#E17055' : '#00B894'};">الرصيد: ${c.balance} ج.م</small>` : ''}
            </div>
            <div>
                <span style="background:#E17055;color:white;padding:2px 8px;border-radius:4px;font-size:11px;">مورد</span>
            </div>
        </div>
    `).join('') || '<div style="text-align:center;color:#999;padding:10px;">لا يوجد موردين</div>';
}

// ============================================================
// 16. البنوك
// ============================================================
function addBankAccount() {
    const d = getData();
    const name = document.getElementById('bankName').value.trim();
    const account = document.getElementById('bankAccountNumber').value.trim();
    const iban = document.getElementById('bankIBAN').value.trim();
    const balance = parseFloat(document.getElementById('bankBalance').value) || 0;
    if (!name || !account) return showToast('⚠️ أدخل اسم البنك ورقم الحساب');
    d.banks.push({ id: Date.now().toString(), name, account, iban, balance });
    saveLocal();
    clearBankForm();
    updateBankList();
    showToast('✅ تم إضافة الحساب البنكي ' + name);
}

function clearBankForm() {
    ['bankName', 'bankAccountNumber', 'bankIBAN'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = '';
    });
    document.getElementById('bankBalance').value = 0;
}

function updateBankList() {
    const d = getData();
    const banks = d.banks || [];
    const list = document.getElementById('bankList');
    if (!list) return;
    list.innerHTML = banks.map(b => `
        <div class="list-item">
            <div>
                <strong>🏦 ${b.name}</strong>
                <br><small>رقم الحساب: ${b.account}</small>
                ${b.iban ? `<br><small>IBAN: ${b.iban}</small>` : ''}
            </div>
            <div>
                <span style="font-weight:bold;color:#0984e3;">${b.balance || 0} ج.م</span>
            </div>
        </div>
    `).join('') || '<div style="text-align:center;color:#999;padding:10px;">لا توجد حسابات بنكية</div>';
}

// ============================================================
// 17. الخزنة
// ============================================================
function collectDebt() {
    const d = getData();
    let client = document.getElementById('collectClient').value.trim();
    const clientNew = document.getElementById('collectClientNew').value.trim();
    if (clientNew) client = clientNew;
    const amount = parseFloat(document.getElementById('collectAmount').value);
    const method = document.getElementById('collectPaymentMethod').value;
    if (!client || !amount || amount <= 0) return showToast('⚠️ أدخل البيانات');
    if (clientNew && !d.clients.find(c => c.name === clientNew)) {
        d.clients.push({ id: Date.now().toString(), name: clientNew, phone: '', address: '', type: 'عميل', balance: 0, creditLimit: 0, taxNumber: '', notes: '', email: '', paymentPeriod: 30 });
    }
    if (method === 'cash') { d.cashTreasury = (d.cashTreasury || 0) + amount; }
    else if (method === 'vodafone' || method === 'instapay') { d.walletTreasury = (d.walletTreasury || 0) + amount; }
    else if (method === 'bank') { d.bankTreasury = (d.bankTreasury || 0) + amount; }
    d.treasury = (d.treasury || 0) + amount;
    d.collections.push({ id: Date.now().toString(), client, amount, method, date: new Date().toLocaleDateString('ar-EG') });
    d.treasuryLog.push({ desc: 'تحصيل من ' + client + ' (' + method + ')', amount });
    saveLocal();
    document.getElementById('collectClient').value = '';
    document.getElementById('collectClientNew').value = '';
    document.getElementById('collectAmount').value = '';
    updateUI();
    showToast('✅ تم تحصيل ' + amount + ' ج.م من ' + client);
}

function paySupplier() {
    const d = getData();
    let supplier = document.getElementById('paySupplier').value.trim();
    const supplierNew = document.getElementById('paySupplierNew').value.trim();
    if (supplierNew) supplier = supplierNew;
    const amount = parseFloat(document.getElementById('payAmount').value);
    const method = document.getElementById('payPaymentMethod').value;
    if (!supplier || !amount || amount <= 0) return showToast('⚠️ أدخل البيانات');
    if (supplierNew && !d.suppliers.find(c => c.name === supplierNew)) {
        d.suppliers.push({ id: Date.now().toString(), name: supplierNew, phone: '', address: '', balance: 0, taxNumber: '', notes: '', email: '', paymentPeriod: 30 });
    }
    if ((d.treasury || 0) < amount) return showToast('⚠️ الرصيد غير كافي');
    if (method === 'cash') { d.cashTreasury = (d.cashTreasury || 0) - amount; }
    else if (method === 'vodafone' || method === 'instapay') { d.walletTreasury = (d.walletTreasury || 0) - amount; }
    else if (method === 'bank') { d.bankTreasury = (d.bankTreasury || 0) - amount; }
    d.treasury = (d.treasury || 0) - amount;
    d.supplierPayments.push({ id: Date.now().toString(), supplier, amount, method, date: new Date().toLocaleDateString('ar-EG') });
    d.treasuryLog.push({ desc: 'سداد مورد - ' + supplier + ' (' + method + ')', amount: -amount });
    saveLocal();
    document.getElementById('paySupplier').value = '';
    document.getElementById('paySupplierNew').value = '';
    document.getElementById('payAmount').value = '';
    updateUI();
    showToast('✅ تم سداد ' + amount + ' ج.م للمورد ' + supplier);
}

function addToTreasury() {
    const d = getData();
    const amount = parseFloat(document.getElementById('treasuryAmount').value);
    const type = document.getElementById('treasuryType').value;
    const desc = document.getElementById('treasuryDesc').value.trim() || 'إيداع';
    if (!amount || amount <= 0) return showToast('⚠️ أدخل مبلغ صحيح');
    if (type === 'cash') { d.cashTreasury = (d.cashTreasury || 0) + amount; }
    else if (type === 'vodafone' || type === 'instapay') { d.walletTreasury = (d.walletTreasury || 0) + amount; }
    else if (type === 'bank') { d.bankTreasury = (d.bankTreasury || 0) + amount; }
    d.treasury = (d.treasury || 0) + amount;
    d.treasuryLog.push({ desc: desc + ' (' + type + ')', amount });
    saveLocal();
    document.getElementById('treasuryAmount').value = '';
    document.getElementById('treasuryDesc').value = '';
    updateUI();
    showToast('✅ تم إيداع ' + amount + ' ج.م');
}

function withdrawTreasury() {
    const d = getData();
    const amount = parseFloat(document.getElementById('treasuryAmount').value);
    const type = document.getElementById('treasuryType').value;
    const desc = document.getElementById('treasuryDesc').value.trim() || 'سحب';
    if (!amount || amount <= 0) return showToast('⚠️ أدخل مبلغ صحيح');
    if ((d.treasury || 0) < amount) return showToast('⚠️ الرصيد غير كافي');
    if (type === 'cash') {
        if ((d.cashTreasury || 0) < amount) return showToast('⚠️ رصيد الخزنة النقدية غير كافي');
        d.cashTreasury = (d.cashTreasury || 0) - amount;
    } else if (type === 'vodafone' || type === 'instapay') {
        if ((d.walletTreasury || 0) < amount) return showToast('⚠️ رصيد المحفظة غير كافي');
        d.walletTreasury = (d.walletTreasury || 0) - amount;
    } else if (type === 'bank') {
        if ((d.bankTreasury || 0) < amount) return showToast('⚠️ رصيد البنك غير كافي');
        d.bankTreasury = (d.bankTreasury || 0) - amount;
    }
    d.treasury = (d.treasury || 0) - amount;
    d.treasuryLog.push({ desc: desc + ' (' + type + ')', amount: -amount });
    saveLocal();
    document.getElementById('treasuryAmount').value = '';
    document.getElementById('treasuryDesc').value = '';
    updateUI();
    showToast('✅ تم سحب ' + amount + ' ج.م');
}

function addExpense() {
    const d = getData();
    const desc = document.getElementById('expenseDesc').value.trim();
    const amount = parseFloat(document.getElementById('expenseAmount').value);
    const method = document.getElementById('expensePaymentMethod').value;
    if (!desc || !amount || amount <= 0) return showToast('⚠️ أدخل البيانات');
    if ((d.treasury || 0) < amount) return showToast('⚠️ الرصيد غير كافي');
    if (method === 'cash') { d.cashTreasury = (d.cashTreasury || 0) - amount; }
    else if (method === 'vodafone' || method === 'instapay') { d.walletTreasury = (d.walletTreasury || 0) - amount; }
    else if (method === 'bank') { d.bankTreasury = (d.bankTreasury || 0) - amount; }
    d.treasury = (d.treasury || 0) - amount;
    d.expenses.push({ id: Date.now().toString(), desc, amount, method, date: new Date().toLocaleDateString() });
    d.treasuryLog.push({ desc: 'مصروف: ' + desc + ' (' + method + ')', amount: -amount });
    saveLocal();
    document.getElementById('expenseDesc').value = '';
    document.getElementById('expenseAmount').value = '';
    updateUI();
    showToast('✅ تم تسجيل مصروف ' + amount + ' ج.م');
}

// ============================================================
// 18. بيانات الشركة
// ============================================================
function saveCompanyData() {
    const d = getData();
    d.company = {
        name: document.getElementById('companyName').value.trim(),
        logo: document.getElementById('companyLogo').value.trim(),
        address: document.getElementById('companyAddress').value.trim(),
        phone: document.getElementById('companyPhone').value.trim(),
        email: document.getElementById('companyEmail').value.trim(),
        website: document.getElementById('companyWebsite').value.trim(),
        taxNumber: document.getElementById('companyTaxNumber').value.trim(),
        commercialRegister: document.getElementById('companyCommercialRegister').value.trim(),
        branch: document.getElementById('companyBranch').value.trim(),
        defaultTax: parseFloat(document.getElementById('companyDefaultTax').value) || 14
    };
    saveLocal();
    showCompanyData();
    showToast('✅ تم حفظ بيانات الشركة');
}

function showCompanyData() {
    const d = getData();
    const c = d.company || {};
    const display = document.getElementById('companyDataDisplay');
    if (!display) return;
    display.innerHTML = `
        <p><strong>🏢 اسم الشركة:</strong> ${c.name || 'غير محدد'}</p>
        <p><strong>📍 العنوان:</strong> ${c.address || 'غير محدد'}</p>
        <p><strong>📞 الهاتف:</strong> ${c.phone || 'غير محدد'}</p>
        <p><strong>📧 البريد الإلكتروني:</strong> ${c.email || 'غير محدد'}</p>
        <p><strong>🌐 الموقع:</strong> ${c.website || 'غير محدد'}</p>
        <p><strong>🆔 الرقم الضريبي:</strong> ${c.taxNumber || 'غير محدد'}</p>
        <p><strong>📋 السجل التجاري:</strong> ${c.commercialRegister || 'غير محدد'}</p>
        <p><strong>🏛️ الفرع:</strong> ${c.branch || 'غير محدد'}</p>
        <p><strong>💰 الضريبة الافتراضية:</strong> ${c.defaultTax || 14}%</p>
    `;
}

function loadCompanyData() {
    const d = getData();
    const c = d.company || {};
    document.getElementById('companyName').value = c.name || '';
    document.getElementById('companyLogo').value = c.logo || '';
    document.getElementById('companyAddress').value = c.address || '';
    document.getElementById('companyPhone').value = c.phone || '';
    document.getElementById('companyEmail').value = c.email || '';
    document.getElementById('companyWebsite').value = c.website || '';
    document.getElementById('companyTaxNumber').value = c.taxNumber || '';
    document.getElementById('companyCommercialRegister').value = c.commercialRegister || '';
    document.getElementById('companyBranch').value = c.branch || '';
    document.getElementById('companyDefaultTax').value = c.defaultTax || 14;
    showCompanyData();
}

// ============================================================
// 19. وسائل الدفع
// ============================================================
function savePaymentMethods() {
    const d = getData();
    d.paymentMethods = {
        vodafone: document.getElementById('vodafoneNumber').value.trim(),
        instapay: document.getElementById('instapayNumber').value.trim(),
        bankName: document.getElementById('settingsBankName').value.trim(),
        bankAccount: document.getElementById('settingsBankAccount').value.trim(),
        bankIBAN: document.getElementById('settingsBankIBAN').value.trim()
    };
    saveLocal();
    showPaymentMethods();
    showToast('✅ تم حفظ وسائل الدفع');
}

function showPaymentMethods() {
    const d = getData();
    const p = d.paymentMethods || {};
    const display = document.getElementById('paymentMethodsList');
    if (!display) return;
    let html = '';
    if (p.vodafone) html += `<div class="list-item"><span>📱 فودافون كاش</span><span>${p.vodafone}</span></div>`;
    if (p.instapay) html += `<div class="list-item"><span>📱 إنستاباي</span><span>${p.instapay}</span></div>`;
    if (p.bankName) html += `<div class="list-item"><span>🏦 ${p.bankName}</span><span>${p.bankAccount || ''} ${p.bankIBAN ? '| IBAN: ' + p.bankIBAN : ''}</span></div>`;
    display.innerHTML = html || '<div style="text-align:center;color:#999;padding:10px;">لا توجد وسائل دفع مسجلة</div>';
}

function loadPaymentMethods() {
    const d = getData();
    const p = d.paymentMethods || {};
    document.getElementById('vodafoneNumber').value = p.vodafone || '';
    document.getElementById('instapayNumber').value = p.instapay || '';
    document.getElementById('settingsBankName').value = p.bankName || '';
    document.getElementById('settingsBankAccount').value = p.bankAccount || '';
    document.getElementById('settingsBankIBAN').value = p.bankIBAN || '';
    showPaymentMethods();
}

// ============================================================
// 20. التقارير
// ============================================================
function drawCharts() {
    const d = getData();
    const s = d.sales || [], p = d.purchases || [], e = d.expenses || [], c = d.collections || [];
    const st = s.reduce((sum, x) => sum + (x.total || 0), 0);
    const pt = p.reduce((sum, x) => sum + (x.total || 0), 0);
    const et = e.reduce((sum, x) => sum + (x.amount || 0), 0);
    const ct = c.reduce((sum, x) => sum + (x.amount || 0), 0);
    const tr = d.treasury || 0;
    if (chartInstances.sales) chartInstances.sales.destroy();
    chartInstances.sales = new Chart(document.getElementById('salesChart'), {
        type: 'bar',
        data: { labels: ['المبيعات', 'المشتريات', 'المصروفات', 'التحصيل'], datasets: [{ label: 'الحركة المالية', data: [st, pt, et, ct], backgroundColor: ['#2E4057', '#E17055', '#FDCB6E', '#00B894'], borderRadius: 8 }] },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true } } }
    });
    if (chartInstances.treasury) chartInstances.treasury.destroy();
    chartInstances.treasury = new Chart(document.getElementById('treasuryChart'), {
        type: 'doughnut',
        data: { labels: ['الخزنة', 'المصروفات', 'المشتريات'], datasets: [{ data: [tr, et, pt], backgroundColor: ['#2E4057', '#E17055', '#FDCB6E'], borderWidth: 3, borderColor: '#fff' }] },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { usePointStyle: true } } } }
    });
}

function updateReportSelects() {
    const d = getData();
    const sel = document.getElementById('statementClientSelect');
    if (sel) {
        sel.innerHTML = '<option value="">-- اختر --</option>';
        (d.clients || []).forEach(c => { if (c.name) sel.innerHTML += `<option value="${c.name}">${c.name}</option>`; });
    }
}

function showReport(type) {
    const d = getData();
    const s = d.sales || [], p = d.purchases || [], e = d.expenses || [], c = d.collections || [], sp = d.supplierPayments || [];
    const st = s.reduce((sum, x) => sum + (x.total || 0), 0);
    const pt = p.reduce((sum, x) => sum + (x.total || 0), 0);
    const et = e.reduce((sum, x) => sum + (x.amount || 0), 0);
    const ct = c.reduce((sum, x) => sum + (x.amount || 0), 0);
    const spt = sp.reduce((sum, x) => sum + (x.amount || 0), 0);
    const profit = st - pt - et;
    const today = new Date().toLocaleDateString('ar-EG');
    let html = '';
    if (type === 'income') {
        html = `<div style="background:#1e1e2e;border-radius:12px;padding:15px;color:white;">
            <div style="text-align:center;border-bottom:2px solid #00B894;padding-bottom:10px;margin-bottom:15px;"><h3 style="margin:0;color:#00B894;">📈 قائمة الدخل</h3><small style="color:#888;">${today}</small></div>
            <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #333;"><span>الإيرادات</span><span style="color:#00B894;">${st} ج.م</span></div>
            <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #333;"><span>تكلفة المشتريات</span><span style="color:#E17055;">${pt} ج.م</span></div>
            <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #333;"><span>المصروفات</span><span style="color:#E17055;">${et} ج.م</span></div>
            <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #333;"><span>التحصيل</span><span style="color:#00B894;">${ct} ج.م</span></div>
            <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #333;"><span>سداد الموردين</span><span style="color:#E17055;">${spt} ج.م</span></div>
            <div style="display:flex;justify-content:space-between;padding-top:10px;margin-top:10px;border-top:2px solid #00B894;font-size:18px;"><span>صافي الربح</span><span style="color:${profit >= 0 ? '#00B894' : '#E17055'};font-weight:bold;">${profit} ج.م</span></div>
        </div>`;
    } else if (type === 'daily') {
        const ts = s.filter(x => x.date === today).reduce((sum, x) => sum + (x.total || 0), 0);
        const tp = p.filter(x => x.date === today).reduce((sum, x) => sum + (x.total || 0), 0);
        const te = e.filter(x => x.date === today).reduce((sum, x) => sum + (x.amount || 0), 0);
        const tc = c.filter(x => x.date === today).reduce((sum, x) => sum + (x.amount || 0), 0);
        const tProfit = ts - tp - te;
        html = `<div style="background:#1e1e2e;border-radius:12px;padding:15px;color:white;">
            <div style="text-align:center;border-bottom:2px solid #FDCB6E;padding-bottom:10px;margin-bottom:15px;"><h3 style="margin:0;color:#FDCB6E;">📅 تقرير اليوم</h3><small style="color:#888;">${today}</small></div>
            <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #333;"><span>مبيعات اليوم</span><span style="color:#00B894;">${ts} ج.م</span></div>
            <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #333;"><span>مشتريات اليوم</span><span style="color:#E17055;">${tp} ج.م</span></div>
            <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #333;"><span>مصروفات اليوم</span><span style="color:#E17055;">${te} ج.م</span></div>
            <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #333;"><span>تحصيل اليوم</span><span style="color:#00B894;">${tc} ج.م</span></div>
            <div style="display:flex;justify-content:space-between;padding-top:10px;margin-top:10px;border-top:2px solid #FDCB6E;font-size:18px;"><span>صافي ربح اليوم</span><span style="color:${tProfit >= 0 ? '#00B894' : '#E17055'};font-weight:bold;">${tProfit} ج.م</span></div>
        </div>`;
    } else if (type === 'trial') {
        const assets = d.treasury || 0;
        const liabilities = s.filter(x => x.type === 'credit').reduce((sum, x) => sum + (x.total || 0), 0);
        const equity = assets - liabilities;
        html = `<div style="background:#1e1e2e;border-radius:12px;padding:15px;color:white;">
            <div style="text-align:center;border-bottom:2px solid #6C5CE7;padding-bottom:10px;margin-bottom:15px;"><h3 style="margin:0;color:#6C5CE7;">📋 ميزان المراجعة</h3><small style="color:#888;">${today}</small></div>
            <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #333;"><span>الأصول (الخزنة)</span><span style="color:#00B894;">${assets} ج.م</span></div>
            <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #333;"><span>الخصوم (الآجل)</span><span style="color:#E17055;">${liabilities} ج.م</span></div>
            <div style="display:flex;justify-content:space-between;padding-top:10px;margin-top:10px;border-top:2px solid #6C5CE7;font-size:18px;"><span>حقوق الملكية</span><span style="color:${equity >= 0 ? '#00B894' : '#E17055'};font-weight:bold;">${equity} ج.م</span></div>
        </div>`;
    } else if (type === 'statement') {
        const clientName = document.getElementById('statementClientSelect').value;
        const sf = document.getElementById('statementClientField');
        if (!clientName) {
            if (sf) sf.style.display = 'block';
            html = `<div style="color:#aaa;text-align:center;padding:40px;background:#1e1e2e;border-radius:12px;">اختر جهة الاتصال</div>`;
        } else {
            if (sf) sf.style.display = 'block';
            const cs = s.filter(x => x.client === clientName);
            const cc = c.filter(x => x.client === clientName);
            let bal = 0, rows = '';
            cs.forEach(x => { bal += (x.total || 0); rows += `<div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid #333;font-size:13px;"><span style="color:#aaa;">${x.date || ''}</span><span>بيع - ${x.product || ''}</span><span style="color:#E17055;">${x.total || 0} ج.م</span><span>${bal} ج.م</span></div>`; });
            cc.forEach(x => { bal -= (x.amount || 0); rows += `<div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid #333;font-size:13px;"><span style="color:#aaa;">${new Date(x.id).toLocaleDateString('ar-EG')}</span><span>تحصيل</span><span style="color:#00B894;">${x.amount || 0} ج.م</span><span>${bal} ج.م</span></div>`; });
            html = `<div style="background:#1e1e2e;border-radius:12px;padding:15px;color:white;">
                <div style="text-align:center;border-bottom:2px solid #00B894;padding-bottom:10px;margin-bottom:15px;"><h3 style="margin:0;color:#00B894;">📋 كشف حساب ${clientName}</h3><small style="color:#888;">${today}</small></div>
                <div style="display:grid;grid-template-columns:1fr 2fr 1.5fr 1.5fr;gap:5px;padding:10px 0;border-bottom:2px solid #00B894;font-weight:bold;font-size:13px;background:#2a2a3e;border-radius:8px 8px 0 0;padding:8px 10px;"><span>التاريخ</span><span>البيان</span><span>المبلغ</span><span>الرصيد</span></div>
                ${rows || '<div style="text-align:center;padding:20px;color:#aaa;">لا توجد معاملات</div>'}
                <div style="display:grid;grid-template-columns:2fr 1fr 1.5fr;gap:5px;padding:15px 0;margin-top:10px;border-top:3px solid #00B894;font-size:16px;font-weight:bold;background:#2a2a3e;border-radius:0 0 8px 8px;padding:10px;"><span></span><span style="color:#888;">الرصيد النهائي</span><span style="color:${bal > 0 ? '#E17055' : '#00B894'};font-size:18px;">${bal} ج.م</span></div>
                <button onclick="printStatement('${clientName}')" style="width:100%;padding:12px;margin-top:10px;background:#2E4057;color:white;border:none;border-radius:8px;font-size:14px;font-weight:bold;cursor:pointer;">🖨️ طباعة</button>
            </div>`;
        }
    }
    document.getElementById('reportContent').innerHTML = html;
}

function printStatement(clientName) {
    const d = getData(), s = d.sales || [], c = d.collections || [];
    const today = new Date().toLocaleDateString('ar-EG');
    const cs = s.filter(x => x.client === clientName);
    const cc = c.filter(x => x.client === clientName);
    let all = [];
    cs.forEach(x => { all.push({ date: x.date || today, type: 'بيع', desc: `${x.product} (${x.id})`, amount: x.total || 0 }); });
    cc.forEach(x => { all.push({ date: new Date(x.id).toLocaleDateString('ar-EG'), type: 'تحصيل', desc: 'تحصيل نقدي', amount: -(x.amount || 0) }); });
    all.sort((a, b) => { const da = a.date.split('/').reverse().join('-'), db = b.date.split('/').reverse().join('-'); return da.localeCompare(db); });
    let bal = 0, rows = '';
    all.forEach(x => { bal += x.amount; rows += `<tr><td style="padding:8px;border:1px solid #ddd;">${x.date}</td><td style="padding:8px;border:1px solid #ddd;">${x.type}</td><td style="padding:8px;border:1px solid #ddd;">${x.desc}</td><td style="padding:8px;border:1px solid #ddd;color:${x.amount > 0 ? '#00B894' : '#E17055'};font-weight:bold;">${x.amount > 0 ? '+' : ''}${x.amount} ج.م</td><td style="padding:8px;border:1px solid #ddd;font-weight:bold;">${bal} ج.م</td></tr>`; });
    const co = d.company || {};
    const p = d.profile || {};
    const html = `<div style="direction:rtl;font-family:Arial;padding:20px;max-width:800px;margin:auto;background:white;color:#333;">
        <div style="text-align:center;border-bottom:2px solid #2E4057;padding-bottom:15px;margin-bottom:20px;"><h2 style="margin:0;color:#2E4057;">${co.name || p.shopName || 'نظام راشد'}</h2><p style="font-size:14px;color:#666;">كشف حساب تفصيلي</p><p style="font-size:12px;color:#888;">${clientName} - ${today}</p></div>
        <table style="width:100%;border-collapse:collapse;font-size:13px;"><thead><tr style="background:#2E4057;color:white;"><th style="padding:10px;text-align:right;border:1px solid #2E4057;">التاريخ</th><th style="padding:10px;text-align:right;border:1px solid #2E4057;">البيان</th><th style="padding:10px;text-align:right;border:1px solid #2E4057;">الوصف</th><th style="padding:10px;text-align:right;border:1px solid #2E4057;">المبلغ</th><th style="padding:10px;text-align:right;border:1px solid #2E4057;">الرصيد</th></tr></thead><tbody>${rows || '<tr><td colspan="5" style="text-align:center;padding:20px;color:#999;">لا توجد معاملات</td></tr>'}</tbody>
        <tfoot><tr style="background:#f0f2f5;font-weight:bold;"><td colspan="3" style="padding:10px;border:1px solid #ddd;text-align:left;">الرصيد النهائي</td><td colspan="2" style="padding:10px;border:1px solid #ddd;color:${bal > 0 ? '#E17055' : '#00B894'};font-size:16px;">${bal} ج.م</td></tr></tfoot></table>
        <div style="text-align:center;font-size:11px;color:#999;margin-top:20px;border-top:1px solid #ddd;padding-top:10px;">شكراً لتعاملكم معنا</div>
    </div>`;
    const win = window.open('', '_blank');
    if (win) { win.document.write(`<html><head><meta charset="UTF-8"><title>كشف حساب ${clientName}</title><style>body{margin:0;padding:20px;background:#f5f5f5;}@media print{body{background:white;padding:0;}}</style></head><body>${html}</body></html>`); win.document.close(); win.focus(); setTimeout(() => win.print(), 500); }
}

// ============================================================
// 21. التقارير المتقدمة
// ============================================================
function showAdvancedReport(type) {
    const d = getData();
    const today = new Date().toLocaleDateString('ar-EG');
    let html = '';
    if (type === 'inventory') {
        const p = d.products || [];
        let rows = '';
        p.forEach(x => {
            const status = (x.qty || 0) <= (x.minQty || 0) ? '⚠️ منخفض' : '✅ جيد';
            const color = (x.qty || 0) <= (x.minQty || 0) ? '#E17055' : '#00B894';
            rows += `<tr style="border-bottom:1px solid #333;"><td style="padding:8px;">${x.name}</td><td style="padding:8px;text-align:center;">${x.mainCategory || 'عام'}</td><td style="padding:8px;text-align:center;">${x.qty || 0}</td><td style="padding:8px;text-align:center;">${x.minQty || 0}</td><td style="padding:8px;text-align:center;color:${color};">${status}</td><td style="padding:8px;text-align:center;">${x.sell || 0} ج.م</td></tr>`;
        });
        html = `<div style="background:#1e1e2e;border-radius:12px;padding:15px;color:white;overflow-x:auto;">
            <div style="text-align:center;border-bottom:2px solid #00B894;padding-bottom:10px;margin-bottom:15px;"><h3 style="margin:0;color:#00B894;">📦 تقرير المخزون</h3><small style="color:#888;">${today}</small></div>
            <table style="width:100%;border-collapse:collapse;font-size:13px;"><thead><tr style="background:#2E4057;color:white;"><th style="padding:8px;text-align:right;">المنتج</th><th style="padding:8px;text-align:center;">التصنيف</th><th style="padding:8px;text-align:center;">الكمية</th><th style="padding:8px;text-align:center;">الحد الأدنى</th><th style="padding:8px;text-align:center;">الحالة</th><th style="padding:8px;text-align:center;">سعر البيع</th></tr></thead><tbody>${rows || '<tr><td colspan="6" style="text-align:center;padding:20px;color:#888;">لا توجد منتجات</td></tr>'}</tbody></table>
            <button onclick="printInventoryReport()" style="width:100%;padding:12px;margin-top:10px;background:#2E4057;color:white;border:none;border-radius:8px;font-size:14px;font-weight:bold;cursor:pointer;">🖨️ طباعة</button>
        </div>`;
    } else if (type === 'clients') {
        const c = d.clients || [];
        const s = d.sales || [];
        let rows = '';
        c.forEach(x => {
            const st = s.filter(si => si.client === x.name).reduce((sum, si) => sum + (si.total || 0), 0);
            rows += `<tr style="border-bottom:1px solid #333;"><td style="padding:8px;">${x.name}</td><td style="padding:8px;text-align:center;">${x.phone || '-'}</td><td style="padding:8px;text-align:center;color:${(x.balance || 0) > 0 ? '#E17055' : '#00B894'};">${x.balance || 0} ج.م</td><td style="padding:8px;text-align:center;">${x.creditLimit || 0} ج.م</td><td style="padding:8px;text-align:center;color:#00B894;">${st} ج.م</td></tr>`;
        });
        html = `<div style="background:#1e1e2e;border-radius:12px;padding:15px;color:white;overflow-x:auto;">
            <div style="text-align:center;border-bottom:2px solid #6C5CE7;padding-bottom:10px;margin-bottom:15px;"><h3 style="margin:0;color:#6C5CE7;">👤 تقرير العملاء</h3><small style="color:#888;">${today}</small></div>
            <table style="width:100%;border-collapse:collapse;font-size:13px;"><thead><tr style="background:#2E4057;color:white;"><th style="padding:8px;text-align:right;">الاسم</th><th style="padding:8px;text-align:center;">الهاتف</th><th style="padding:8px;text-align:center;">الرصيد</th><th style="padding:8px;text-align:center;">الحد الائتماني</th><th style="padding:8px;text-align:center;">إجمالي المبيعات</th></tr></thead><tbody>${rows || '<tr><td colspan="5" style="text-align:center;padding:20px;color:#888;">لا يوجد عملاء</td></tr>'}</tbody></table>
        </div>`;
    } else if (type === 'sales') {
        const s = d.sales || [];
        const byClient = {};
        s.forEach(x => { if (!byClient[x.client]) byClient[x.client] = 0; byClient[x.client] += x.total || 0; });
        let rows = '';
        Object.keys(byClient).forEach(k => {
            rows += `<tr style="border-bottom:1px solid #333;"><td style="padding:8px;">${k}</td><td style="padding:8px;text-align:center;">${s.filter(si => si.client === k).length}</td><td style="padding:8px;text-align:center;color:#00B894;">${byClient[k]} ج.م</td></tr>`;
        });
        const total = s.reduce((sum, x) => sum + (x.total || 0), 0);
        html = `<div style="background:#1e1e2e;border-radius:12px;padding:15px;color:white;overflow-x:auto;">
            <div style="text-align:center;border-bottom:2px solid #FDCB6E;padding-bottom:10px;margin-bottom:15px;"><h3 style="margin:0;color:#FDCB6E;">📊 تقرير المبيعات</h3><small style="color:#888;">${today}</small></div>
            <table style="width:100%;border-collapse:collapse;font-size:13px;"><thead><tr style="background:#2E4057;color:white;"><th style="padding:8px;text-align:right;">العميل</th><th style="padding:8px;text-align:center;">عدد الفواتير</th><th style="padding:8px;text-align:center;">إجمالي المبيعات</th></tr></thead><tbody>${rows || '<tr><td colspan="3" style="text-align:center;padding:20px;color:#888;">لا توجد مبيعات</td></tr>'}</tbody></table>
            <div style="display:flex;justify-content:space-between;padding:15px 0;margin-top:10px;border-top:2px solid #FDCB6E;font-size:16px;"><span>الإجمالي الكلي</span><span style="color:#FDCB6E;font-weight:bold;">${total} ج.م</span></div>
        </div>`;
    } else if (type === 'purchases') {
        const p = d.purchases || [];
        const bySupplier = {};
        p.forEach(x => { if (!bySupplier[x.supplier]) bySupplier[x.supplier] = 0; bySupplier[x.supplier] += x.total || 0; });
        let rows = '';
        Object.keys(bySupplier).forEach(k => {
            rows += `<tr style="border-bottom:1px solid #333;"><td style="padding:8px;">${k}</td><td style="padding:8px;text-align:center;">${p.filter(pi => pi.supplier === k).length}</td><td style="padding:8px;text-align:center;color:#E17055;">${bySupplier[k]} ج.م</td></tr>`;
        });
        const total = p.reduce((sum, x) => sum + (x.total || 0), 0);
        html = `<div style="background:#1e1e2e;border-radius:12px;padding:15px;color:white;overflow-x:auto;">
            <div style="text-align:center;border-bottom:2px solid #E17055;padding-bottom:10px;margin-bottom:15px;"><h3 style="margin:0;color:#E17055;">📊 تقرير المشتريات</h3><small style="color:#888;">${today}</small></div>
            <table style="width:100%;border-collapse:collapse;font-size:13px;"><thead><tr style="background:#2E4057;color:white;"><th style="padding:8px;text-align:right;">المورد</th><th style="padding:8px;text-align:center;">عدد الفواتير</th><th style="padding:8px;text-align:center;">إجمالي المشتريات</th></tr></thead><tbody>${rows || '<tr><td colspan="3" style="text-align:center;padding:20px;color:#888;">لا توجد مشتريات</td></tr>'}</tbody></table>
            <div style="display:flex;justify-content:space-between;padding:15px 0;margin-top:10px;border-top:2px solid #E17055;font-size:16px;"><span>الإجمالي الكلي</span><span style="color:#E17055;font-weight:bold;">${total} ج.م</span></div>
        </div>`;
    }
    document.getElementById('reportContent').innerHTML = html;
}

function printInventoryReport() {
    const d = getData(), p = d.products || [];
    const today = new Date().toLocaleDateString('ar-EG');
    const co = d.company || {};
    const profile = d.profile || {};
    let rows = '';
    p.forEach(x => {
        const status = (x.qty || 0) <= (x.minQty || 0) ? '⚠️ منخفض' : '✅ جيد';
        rows += `<tr><td style="padding:8px;border:1px solid #ddd;">${x.name}</td><td style="padding:8px;border:1px solid #ddd;text-align:center;">${x.mainCategory || 'عام'}</td><td style="padding:8px;border:1px solid #ddd;text-align:center;">${x.qty || 0}</td><td style="padding:8px;border:1px solid #ddd;text-align:center;">${x.minQty || 0}</td><td style="padding:8px;border:1px solid #ddd;text-align:center;">${status}</td><td style="padding:8px;border:1px solid #ddd;text-align:center;">${x.sell || 0} ج.م</td></tr>`;
    });
    const html = `<div style="direction:rtl;font-family:Arial;padding:20px;max-width:900px;margin:auto;background:white;color:#333;">
        <div style="text-align:center;border-bottom:2px solid #2E4057;padding-bottom:15px;margin-bottom:20px;"><h2 style="margin:0;color:#2E4057;">${co.name || profile.shopName || 'نظام راشد'}</h2><p style="font-size:12px;color:#666;">${co.address || profile.branch || ''}</p><p style="font-size:14px;font-weight:bold;color:#2E4057;">📦 تقرير المخزون</p><p style="font-size:12px;color:#888;">${today}</p></div>
        <table style="width:100%;border-collapse:collapse;font-size:13px;"><thead><tr style="background:#2E4057;color:white;"><th style="padding:8px;text-align:right;border:1px solid #2E4057;">المنتج</th><th style="padding:8px;text-align:center;border:1px solid #2E4057;">التصنيف</th><th style="padding:8px;text-align:center;border:1px solid #2E4057;">الكمية</th><th style="padding:8px;text-align:center;border:1px solid #2E4057;">الحد الأدنى</th><th style="padding:8px;text-align:center;border:1px solid #2E4057;">الحالة</th><th style="padding:8px;text-align:center;border:1px solid #2E4057;">سعر البيع</th></tr></thead><tbody>${rows || '<tr><td colspan="6" style="text-align:center;padding:20px;color:#888;">لا توجد منتجات</td></tr>'}</tbody></table>
        <div style="text-align:center;font-size:11px;color:#999;margin-top:20px;border-top:1px solid #ddd;padding-top:10px;">شكراً لتعاملكم معنا</div>
    </div>`;
    const win = window.open('', '_blank');
    if (win) { win.document.write(`<html><head><meta charset="UTF-8"><title>تقرير المخزون</title><style>body{margin:0;padding:20px;background:#f5f5f5;}@media print{body{background:white;padding:0;}}</style></head><body>${html}</body></html>`); win.document.close(); win.focus(); setTimeout(() => win.print(), 500); }
}

function printAllInvoices() {
    const d = getData(), s = d.sales || [];
    if (s.length === 0) return showToast('⚠️ لا توجد فواتير');
    s.forEach(x => printSaleInvoice(x.id));
}

function showAIReport() {
    const d = getData();
    const s = d.sales || [], p = d.purchases || [], e = d.expenses || [];
    const st = s.reduce((sum, x) => sum + (x.total || 0), 0);
    const pt = p.reduce((sum, x) => sum + (x.total || 0), 0);
    const et = e.reduce((sum, x) => sum + (x.amount || 0), 0);
    const profit = st - pt - et;
    let r = '🤖 تحليل الذكاء الاصطناعي\n\n📊 إجمالي المبيعات: ' + st + ' ج.م\n📉 إجمالي المشتريات: ' + pt + ' ج.م\n💸 إجمالي المصروفات: ' + et + ' ج.م\n💰 صافي الربح: ' + profit + ' ج.م\n\n';
    if (profit > 0) { r += '✅ عملك يحقق أرباحاً.\n'; if (et > (st * 0.3)) { r += '⚠️ نصيحة: المصروفات تمثل ' + ((et/st)*100).toFixed(1) + '% من المبيعات. حاول تقليلها.\n'; } } else { r += '⚠️ عملك يحقق خسائر. راجع المصروفات.\n'; }
    if (d.products.length === 0) r += '📦 تنبيه: لم تضف أي منتجات.\n';
    alert(r);
}

// ============================================================
// 22. تحديث الواجهة
// ============================================================
function updateUI() {
    if (!appData.currentUser) return;
    const d = getData();
    updateSelects();
    updateClientSelects();
    updateSupplierSelects();
    
    document.getElementById('cashTreasuryDisplay').textContent = (d.cashTreasury || 0) + ' ج.م';
    document.getElementById('walletTreasuryDisplay').textContent = (d.walletTreasury || 0) + ' ج.م';
    document.getElementById('bankTreasuryDisplay').textContent = (d.bankTreasury || 0) + ' ج.م';
    document.getElementById('treasuryDisplay').textContent = d.treasury || 0;
    
    document.getElementById('productList').innerHTML = (d.products || []).map(p => `
        <div class="list-item"><div><strong>${p.name}</strong><br><small>${p.mainCategory || 'عام'} | ${p.unit || 'قطعة'}</small></div><div><span style="font-weight:bold;">${p.sell || 0} ج.م (${p.qty || 0})</span></div></div>
    `).join('') || '<div style="text-align:center;color:#999;padding:10px;">لا توجد منتجات</div>';
    
    let log = '';
    log += (d.treasuryLog || []).slice().reverse().map(t => `<div class="list-item"><span>${t.desc}</span><span style="font-weight:bold;color:${(t.amount || 0) > 0 ? '#00B894' : '#E17055'};">${t.amount || 0} ج.م</span></div>`).join('');
    log += (d.expenses || []).slice().reverse().map(e => `<div class="list-item" style="color:#E17055;"><span>💸 ${e.desc}</span><span style="font-weight:bold;">-${e.amount || 0} ج.م</span></div>`).join('');
    log += (d.collections || []).slice().reverse().map(c => `<div class="list-item" style="color:#00B894;"><span>💰 تحصيل من ${c.client}</span><span style="font-weight:bold;">+${c.amount || 0} ج.م</span></div>`).join('');
    log += (d.supplierPayments || []).slice().reverse().map(p => `<div class="list-item" style="color:#E17055;"><span>💸 سداد - ${p.supplier}</span><span style="font-weight:bold;">-${p.amount || 0} ج.م</span></div>`).join('');
    document.getElementById('treasuryLog').innerHTML = log || '<div style="text-align:center;color:#999;padding:10px;">لا توجد حركات</div>';
    
    document.getElementById('saleList').innerHTML = (d.sales || []).slice().reverse().map(s => `
        <div class="list-item" style="flex-wrap:wrap;gap:5px;${s.isReturn ? 'background:#fff5f5;border-right:3px solid #E17055;' : ''}">
            <div><strong>${s.id}</strong> ${s.isReturn ? '↩️' : ''} - ${s.client}<small style="color:#999;display:block;font-size:11px;">${s.date} | ${s.items ? s.items.length : 0} منتج</small></div>
            <div style="display:flex;align-items:center;gap:8px;"><span style="font-weight:bold;color:${s.isReturn ? '#E17055' : '#2E4057'};">${s.total || 0} ج.م</span><button onclick="printSaleInvoice('${s.id}')" style="background:#2E4057;color:white;border:none;border-radius:4px;padding:2px 10px;cursor:pointer;font-size:11px;"><i class="fas fa-print"></i></button></div>
        </div>
    `).join('') || '<div style="text-align:center;color:#999;padding:10px;">لا توجد فواتير</div>';
    
    document.getElementById('purchaseList').innerHTML = (d.purchases || []).slice().reverse().map(p => `
        <div class="list-item" style="flex-wrap:wrap;gap:5px;${p.isReturn ? 'background:#fff5f5;border-right:3px solid #E17055;' : ''}">
            <div><strong>${p.id}</strong> ${p.isReturn ? '↩️' : ''} - ${p.supplier}<small style="color:#999;display:block;font-size:11px;">${p.date} | ${p.items ? p.items.length : 0} منتج</small></div>
            <div style="display:flex;align-items:center;gap:8px;"><span style="font-weight:bold;color:#E17055;">${p.total || 0} ج.م</span><button onclick="printPurchaseInvoice('${p.id}')" style="background:#E17055;color:white;border:none;border-radius:4px;padding:2px 10px;cursor:pointer;font-size:11px;"><i class="fas fa-print"></i></button></div>
        </div>
    `).join('') || '<div style="text-align:center;color:#999;padding:10px;">لا توجد فواتير شراء</div>';
    
    updateWarehouseLog();
    updateClientList();
    updateSupplierList();
    updateBankList();
}

function updateSelects() {
    const d = getData();
    const p = d.products || [];
    document.querySelectorAll('#saleProduct, #purchaseProduct, #returnProduct, #returnPurchaseProduct, #whProduct').forEach(sel => {
        if (sel) {
            sel.innerHTML = '<option value="">اختر</option>';
            p.forEach(x => { if (x.id) sel.innerHTML += `<option value="${x.id}">${x.name} (${x.qty || 0})</option>`; });
        }
    });
}

function updateClientSelects() {
    const d = getData();
    const clients = d.clients || [];
    const selects = ['saleClient', 'collectClient', 'statementClientSelect'];
    selects.forEach(id => {
        const sel = document.getElementById(id);
        if (!sel) return;
        const currentVal = sel.value;
        sel.innerHTML = '<option value="">اختر</option>';
        clients.forEach(c => { sel.innerHTML += `<option value="${c.name}">${c.name}</option>`; });
        if (currentVal) sel.value = currentVal;
    });
}

function updateSupplierSelects() {
    const d = getData();
    const suppliers = d.suppliers || [];
    const selects = ['purchaseSupplier', 'paySupplier'];
    selects.forEach(id => {
        const sel = document.getElementById(id);
        if (!sel) return;
        const currentVal = sel.value;
        sel.innerHTML = '<option value="">اختر</option>';
        suppliers.forEach(c => { sel.innerHTML += `<option value="${c.name}">${c.name}</option>`; });
        if (currentVal) sel.value = currentVal;
    });
}

// ============================================================
// 23. الإعدادات
// ============================================================
function getSettings() {
    const d = getData();
    if (!d.settings) d.settings = { theme: 'default', fontSize: 'medium', soundAlerts: true, popupAlerts: true, alertSound: 'beep' };
    return d.settings;
}

function saveSettings(settings) {
    const d = getData();
    d.settings = settings;
    saveLocal();
}

function loadSettings() {
    const s = getSettings();
    document.body.className = '';
    if (s.theme && s.theme !== 'default') document.body.classList.add('theme-' + s.theme);
    const sz = { small: '13px', medium: '16px', large: '19px', xlarge: '22px' };
    document.body.style.fontSize = sz[s.fontSize] || '16px';
    document.getElementById('soundAlerts').checked = s.soundAlerts !== false;
    document.getElementById('alertSound').value = s.alertSound || 'beep';
}

function changeTheme(theme) {
    document.body.className = '';
    if (theme !== 'default') document.body.classList.add('theme-' + theme);
    const s = getSettings();
    s.theme = theme;
    saveSettings(s);
    showToast('✅ تم تغيير السمة');
}

function changeFontSize(size) {
    const sz = { small: '13px', medium: '16px', large: '19px', xlarge: '22px' };
    document.body.style.fontSize = sz[size] || '16px';
    const s = getSettings();
    s.fontSize = size;
    saveSettings(s);
    showToast('✅ تم تغيير حجم الخط');
}

function resetAppSettings() {
    if (!confirm('إعادة ضبط الإعدادات؟')) return;
    const d = getData();
    d.settings = { theme: 'default', fontSize: 'medium', soundAlerts: true, popupAlerts: true, alertSound: 'beep' };
    saveLocal();
    loadSettings();
    showToast('✅ تم إعادة الضبط');
}

// ============================================================
// 24. لوحة التحكم
// ============================================================
function updateAdminPanel() {
    const users = Object.keys(appData.users || {});
    document.getElementById('adminTotalUsers').textContent = users.length;
    const now = new Date();
    const fiveAgo = new Date(now.getTime() - 5 * 60 * 1000);
    let online = 0;
    users.forEach(uid => { const u = appData.users[uid]; if (u && u.lastLogin && new Date(u.lastLogin) > fiveAgo) online++; });
    document.getElementById('adminOnlineUsers').textContent = online;
    const today = new Date().toISOString().slice(0, 10);
    const visits = (appData.activityLog || []).filter(l => l.action === 'دخول' && l.time && l.time.slice(0, 10) === today);
    document.getElementById('adminTodayVisits').textContent = visits.length;
    let table = '', c = 0;
    users.forEach(uid => {
        const u = appData.users[uid];
        if (!u) return;
        c++;
        const last = u.lastLogin ? new Date(u.lastLogin).toLocaleString() : 'لم يسجل';
        const country = u.lastLocation?.country || 'غير معروف';
        const ip = u.lastLocation?.ip || 'غير معروف';
        const isOnline = u.lastLogin && new Date(u.lastLogin) > new Date(Date.now() - 5 * 60 * 1000);
        table += `<tr style="border-bottom:1px solid #eee;"><td style="padding:8px;">${c}</td><td style="padding:8px;"><strong>${u.displayName || 'غير معروف'}</strong></td><td style="padding:8px;">${u.fullName || ''}</td><td style="padding:8px;">${u.phone || ''}</td><td style="padding:8px;font-size:12px;">${last}</td><td style="padding:8px;">${country}</td><td style="padding:8px;font-size:11px;color:#999;">${ip}</td><td style="padding:8px;"><span style="background:${isOnline ? '#00B894' : '#999'};color:white;padding:2px 10px;border-radius:12px;font-size:11px;">${isOnline ? '🟢 متصل' : '🔴 غير متصل'}</span></td></tr>`;
    });
    document.getElementById('adminUsersTable').innerHTML = table || '<tr><td colspan="8" style="text-align:center;padding:20px;color:#999;">لا يوجد مستخدمين</td></tr>';
    let logHtml = (appData.activityLog || []).slice().reverse().slice(0, 50).map(l => {
        const time = l.time ? new Date(l.time).toLocaleString() : '';
        const icon = l.action === 'دخول' ? '🟢' : l.action === 'خروج' ? '🔴' : '📝';
        return `<div class="list-item"><span>${icon} ${l.username || 'مستخدم'} - ${l.action}</span><span style="font-size:11px;color:#999;">${time} ${l.country ? '| ' + l.country : ''} ${l.ip && l.ip !== 'غير معروف' ? '| IP: ' + l.ip : ''}</span></div>`;
    }).join('');
    document.getElementById('adminActivityLog').innerHTML = logHtml || '<div style="text-align:center;color:#999;padding:10px;">لا يوجد سجل نشاط</div>';
}

// ============================================================
// 25. لوحة الأدمن (5 ضغطات)
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
                const d = getData();
                if (d.profile) {
                    document.getElementById('adminShopName').value = d.profile.shopName || '';
                    document.getElementById('adminBranch').value = d.profile.branch || '';
                }
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
        showToast('✅ تم فتح اللوحة');
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
    if (!np || np.length < 4) return showToast('⚠️ 4 أحرف');
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
    d.banks = [];
    d.treasury = 0;
    d.cashTreasury = 0;
    d.walletTreasury = 0;
    d.bankTreasury = 0;
    d.treasuryLog = [];
    d.expenses = [];
    d.collections = [];
    d.supplierPayments = [];
    d.warehouse = [];
    d.saleCounter = 0;
    d.purchaseCounter = 0;
    d.returnSaleCounter = 0;
    d.returnPurchaseCounter = 0;
    d.company = {};
    d.paymentMethods = {};
    saveLocal();
    updateUI();
    showToast('🗑️ تم المسح');
    closeAdminPanel();
}

// ============================================================
// 26. Toast
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
// الميزات الجديدة
// ============================================================

// ============================================================
// 1. نظام المصادقة المتقدم
// ============================================================
async function handleLogin() {
    const email = document.getElementById('loginEmail').value.trim();
    const pass = document.getElementById('loginPass').value.trim();
    const remember = document.getElementById('rememberMe').checked;
    if (!email || !pass) return showToast('⚠️ أدخل البريد وكلمة المرور');
    try {
        const { auth } = initFirebase();
        await auth.signInWithEmailAndPassword(email, pass);
        const user = auth.currentUser;
        if (remember) {
            localStorage.setItem('rememberedUser', email);
        }
        // جلب بيانات المستخدم من Firebase
        const { db } = initFirebase();
        const snapshot = await db.ref('users/' + user.uid).once('value');
        const userData = snapshot.val() || {};
        appData.currentUser = user.uid;
        appData.users[user.uid] = userData;
        appData.users[user.uid].email = email;
        appData.users[user.uid].displayName = userData.displayName || email.split('@')[0];
        appData.users[user.uid].role = userData.role || 'admin';
        saveLocal();
        enterApp();
        showToast('✅ مرحباً ' + appData.users[user.uid].displayName);
    } catch(e) {
        if (e.code === 'auth/user-not-found') showToast('❌ المستخدم غير موجود');
        else if (e.code === 'auth/wrong-password') showToast('❌ كلمة المرور خطأ');
        else showToast('❌ ' + e.message);
    }
}

async function handleRegister() {
    const fullName = document.getElementById('regFullName').value.trim();
    const email = document.getElementById('regEmail').value.trim();
    const phone = document.getElementById('regPhone').value.trim();
    const pass = document.getElementById('regPass').value.trim();
    const confirm = document.getElementById('regPassConfirm').value.trim();
    const role = document.getElementById('regRole').value;
    if (!fullName || !email || !pass) return showToast('⚠️ أكمل البيانات');
    if (pass !== confirm) return showToast('⚠️ كلمة المرور غير متطابقة');
    if (pass.length < 6) return showToast('⚠️ كلمة المرور 6 أحرف على الأقل');
    try {
        const { auth, db } = initFirebase();
        const result = await auth.createUserWithEmailAndPassword(email, pass);
        const user = result.user;
        const loc = await getUserLocation();
        const userData = {
            displayName: fullName,
            email: email,
            phone: phone,
            role: role,
            createdAt: new Date().toISOString(),
            lastLogin: new Date().toISOString(),
            lastLocation: loc,
            data: {
                sales: [], purchases: [], products: [], clients: [], suppliers: [], banks: [],
                treasury: 0, cashTreasury: 0, walletTreasury: 0, bankTreasury: 0,
                treasuryLog: [], expenses: [], collections: [], supplierPayments: [],
                warehouse: [], saleCounter: 0, purchaseCounter: 0,
                returnSaleCounter: 0, returnPurchaseCounter: 0,
                company: {}, paymentMethods: {},
                profile: { shopName: 'نظام راشد', branch: 'رئيسي' },
                settings: { theme: 'default', fontSize: 'medium', soundAlerts: true, popupAlerts: true, alertSound: 'beep' }
            }
        };
        await db.ref('users/' + user.uid).set(userData);
        appData.currentUser = user.uid;
        appData.users[user.uid] = userData;
        saveLocal();
        enterApp();
        showToast('✅ تم إنشاء الحساب بنجاح');
    } catch(e) {
        if (e.code === 'auth/email-already-in-use') showToast('⚠️ البريد مستخدم');
        else showToast('❌ ' + e.message);
    }
}

function showForgotPassword() {
    document.getElementById('loginForm').style.display = 'none';
    document.getElementById('registerForm').style.display = 'none';
    document.getElementById('forgotPasswordForm').style.display = 'block';
}

function showLoginForm() {
    document.getElementById('loginForm').style.display = 'block';
    document.getElementById('registerForm').style.display = 'none';
    document.getElementById('forgotPasswordForm').style.display = 'none';
}

async function sendResetPassword() {
    const email = document.getElementById('resetEmail').value.trim();
    if (!email) return showToast('⚠️ أدخل البريد الإلكتروني');
    try {
        const { auth } = initFirebase();
        await auth.sendPasswordResetEmail(email);
        showToast('✅ تم إرسال رابط إعادة التعيين إلى بريدك');
        showLoginForm();
    } catch(e) {
        showToast('❌ ' + e.message);
    }
}

// ============================================================
// 2. نظام الفواتير الإلكترونية
// ============================================================
function generateInvoiceQR(invoice) {
    // توليد QR Code للفاتورة
    const qrData = JSON.stringify({
        id: invoice.id,
        client: invoice.client,
        total: invoice.total,
        date: invoice.date,
        tax: invoice.tax || 0
    });
    return qrData;
}

function exportInvoicePDF() {
    const invNum = document.getElementById('saleInvoiceNumber').value;
    if (saleItems.length === 0) return showToast('⚠️ لا توجد منتجات للتصدير');
    const d = getData();
    const client = document.getElementById('saleClient').value.trim() || document.getElementById('saleClientNew').value.trim() || 'عميل';
    const date = document.getElementById('saleInvoiceDate').value;
    const type = document.getElementById('saleType').value;
    const paymentMethod = document.getElementById('salePaymentMethodSelect').value;
    const paymentAccount = document.getElementById('salePaymentAccount').value.trim();
    const discount = parseFloat(document.getElementById('saleDiscount').value) || 0;
    const paid = parseFloat(document.getElementById('salePaid').value) || 0;
    const totalAfterDiscount = saleTotal - discount;
    const tax = totalAfterDiscount * 0.14;
    const totalWithTax = totalAfterDiscount + tax;
    const tempInv = {
        id: invNum, client, date, type, paymentMethod, paymentAccount,
        discount, tax, items: saleItems, total: saleTotal,
        totalAfterDiscount, totalWithTax, paid, balance: totalWithTax - paid
    };
    const c = d.company || {};
    const p = d.profile || {};
    const tn = { cash: 'كاش', credit: 'آجل', installment: 'تقسيط' };
    const pm = { cash: 'خزنة نقدي', vodafone: 'فودافون كاش', instapay: 'إنستاباي', bank: 'تحويل بنكي' };
    let itemsHtml = '';
    tempInv.items.forEach(item => {
        itemsHtml += `<tr><td style="padding:6px;border:1px solid #ddd;text-align:right;">${item.name}</td><td style="padding:6px;border:1px solid #ddd;text-align:center;">${item.qty}</td><td style="padding:6px;border:1px solid #ddd;text-align:center;">${item.price} ج.م</td><td style="padding:6px;border:1px solid #ddd;text-align:left;font-weight:bold;">${item.total} ج.م</td></tr>`;
    });
    const logo = c.logo ? `<img src="${c.logo}" style="max-height:60px;margin-bottom:5px;">` : '';
    const html = `<div style="direction:rtl;font-family:Arial;padding:20px;max-width:800px;margin:auto;background:white;color:#333;border:1px solid #ddd;border-radius:10px;">
        <div style="text-align:center;border-bottom:2px solid #2E4057;padding-bottom:15px;margin-bottom:20px;">
            ${logo}
            <h2 style="margin:0;color:#2E4057;">${c.name || p.shopName || 'نظام راشد'}</h2>
            <p style="font-size:12px;color:#666;margin:2px 0;">${c.address || p.branch || ''}</p>
            <p style="font-size:12px;color:#666;">📞 ${c.phone || ''} | 📧 ${c.email || ''} | 🆔 ${c.taxNumber || ''}</p>
            <p style="font-size:14px;font-weight:bold;color:#2E4057;margin:5px 0;">فاتورة بيع</p>
        </div>
        <div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:15px;flex-wrap:wrap;">
            <div><strong>رقم:</strong> ${tempInv.id}<br><strong>التاريخ:</strong> ${tempInv.date}</div>
            <div style="text-align:left;"><strong>العميل:</strong> ${tempInv.client}<br><strong>نوع الدفع:</strong> ${tn[tempInv.type] || tempInv.type}</div>
            <div style="text-align:left;"><strong>وسيلة الدفع:</strong> ${pm[tempInv.paymentMethod] || tempInv.paymentMethod}<br>${tempInv.paymentAccount ? '<strong>رقم الحساب:</strong> ' + tempInv.paymentAccount : ''}</div>
        </div>
        <table style="width:100%;border-collapse:collapse;font-size:13px;margin-bottom:15px;">
            <thead><tr style="background:#2E4057;color:white;"><th style="padding:8px;text-align:right;border:1px solid #2E4057;">المنتج</th><th style="padding:8px;text-align:center;border:1px solid #2E4057;">الكمية</th><th style="padding:8px;text-align:center;border:1px solid #2E4057;">السعر</th><th style="padding:8px;text-align:left;border:1px solid #2E4057;">الإجمالي</th></tr></thead>
            <tbody>${itemsHtml}</tbody>
            <tfoot>
                <tr style="background:#f0f2f5;font-weight:bold;"><td colspan="3" style="padding:8px;border:1px solid #ddd;text-align:left;">الإجمالي</td><td style="padding:8px;border:1px solid #ddd;color:#2E4057;font-size:16px;">${tempInv.total || 0} ج.م</td></tr>
                ${tempInv.discount ? `<tr><td colspan="3" style="padding:8px;border:1px solid #ddd;text-align:left;">الخصم</td><td style="padding:8px;border:1px solid #ddd;color:#E17055;font-size:14px;">-${tempInv.discount} ج.م</td></tr>` : ''}
                <tr style="font-weight:bold;"><td colspan="3" style="padding:8px;border:1px solid #ddd;text-align:left;">الإجمالي بعد الخصم</td><td style="padding:8px;border:1px solid #ddd;color:#2E4057;font-size:16px;">${tempInv.totalAfterDiscount || tempInv.total || 0} ج.م</td></tr>
                <tr><td colspan="3" style="padding:8px;border:1px solid #ddd;text-align:left;">الضريبة (14%)</td><td style="padding:8px;border:1px solid #ddd;color:#FDCB6E;font-weight:bold;">${tempInv.tax || 0} ج.م</td></tr>
                <tr style="background:#f0f2f5;font-weight:bold;"><td colspan="3" style="padding:8px;border:1px solid #ddd;text-align:left;">الإجمالي النهائي</td><td style="padding:8px;border:1px solid #ddd;color:#2E4057;font-size:16px;">${tempInv.totalWithTax || tempInv.total || 0} ج.م</td></tr>
                <tr><td colspan="3" style="padding:8px;border:1px solid #ddd;text-align:left;">المدفوع</td><td style="padding:8px;border:1px solid #ddd;color:#00B894;font-weight:bold;">${tempInv.paid || 0} ج.م</td></tr>
                <tr style="font-weight:bold;"><td colspan="3" style="padding:8px;border:1px solid #ddd;text-align:left;">المتبقي</td><td style="padding:8px;border:1px solid #ddd;color:${(tempInv.balance || 0) > 0 ? '#E17055' : '#00B894'};font-size:16px;">${tempInv.balance || 0} ج.م</td></tr>
                <tr><td colspan="4" style="padding:8px;text-align:center;border-top:2px solid #2E4057;">
                    <div style="font-size:12px;color:#666;">🔐 QR Code</div>
                    <div style="font-size:10px;color:#999;">${generateInvoiceQR(tempInv)}</div>
                </td></tr>
            </tfoot>
        </table>
        <div style="text-align:center;font-size:11px;color:#999;margin-top:15px;border-top:1px solid #ddd;padding-top:10px;">شكراً لتعاملكم معنا - ${c.name || p.shopName || 'نظام راشد'}</div>
    </div>`;
    const win = window.open('', '_blank');
    if (win) {
        win.document.write(`<html><head><meta charset="UTF-8"><title>فاتورة ${invNum}</title><style>body{margin:0;padding:20px;background:#f5f5f5;display:flex;justify-content:center;align-items:center;min-height:100vh;}@media print{body{background:white;padding:0;}.print-area{border:none!important;}}</style></head><body>${html}</body></html>`);
        win.document.close();
        win.focus();
        setTimeout(() => win.print(), 500);
    }
}

// ============================================================
// 3. نظام التقارير الذكية
// ============================================================
function generateBusinessReport() {
    const d = getData();
    const s = d.sales || [];
    const p = d.purchases || [];
    const e = d.expenses || [];
    const products = d.products || [];
    const clients = d.clients || [];
    const today = new Date().toLocaleDateString('ar-EG');
    const totalSales = s.reduce((sum, x) => sum + (x.total || 0), 0);
    const totalPurchases = p.reduce((sum, x) => sum + (x.total || 0), 0);
    const totalExpenses = e.reduce((sum, x) => sum + (x.amount || 0), 0);
    const profit = totalSales - totalPurchases - totalExpenses;
    
    // تحليل المبيعات
    const salesByClient = {};
    s.forEach(x => {
        if (!salesByClient[x.client]) salesByClient[x.client] = 0;
        salesByClient[x.client] += x.total || 0;
    });
    const bestClient = Object.keys(salesByClient).length > 0 ? 
        Object.keys(salesByClient).reduce((a, b) => salesByClient[a] > salesByClient[b] ? a : b) : 'لا يوجد';
    
    // تحليل المنتجات
    const productSales = {};
    s.forEach(inv => {
        if (inv.items) {
            inv.items.forEach(item => {
                if (!productSales[item.name]) productSales[item.name] = 0;
                productSales[item.name] += item.qty || 0;
            });
        }
    });
    const bestProduct = Object.keys(productSales).length > 0 ?
        Object.keys(productSales).reduce((a, b) => productSales[a] > productSales[b] ? a : b) : 'لا يوجد';
    
    const report = `
📊 **تقرير الأعمال الشامل**
📅 التاريخ: ${today}

📈 **الإيرادات والمصروفات**
━━━━━━━━━━━━━━━━━━━━
💰 إجمالي المبيعات: ${totalSales.toFixed(2)} ج.م
💸 إجمالي المشتريات: ${totalPurchases.toFixed(2)} ج.م
🧾 إجمالي المصروفات: ${totalExpenses.toFixed(2)} ج.م
💎 صافي الربح: ${profit.toFixed(2)} ج.م

🏆 **أفضل عميل:** ${bestClient} (${salesByClient[bestClient]?.toFixed(2) || 0} ج.م)

📦 **أفضل منتج:** ${bestProduct} (${productSales[bestProduct] || 0} وحدة)

👥 **إحصائيات**
━━━━━━━━━━━━━━━━━━━━
📦 عدد المنتجات: ${products.length}
👤 عدد العملاء: ${clients.length}
📋 عدد الفواتير: ${s.length}

${profit > 0 ? '✅ ✅ ✅ عملك يحقق أرباحاً ممتازة! استمر في التطوير.' : '⚠️ ⚠️ ⚠️ عملك يحقق خسائر. راجع المصروفات واستراتيجية التسعير.'}
    `;
    alert(report);
}

// ============================================================
// 4. مسح الباركود بالكاميرا
// ============================================================
function scanBarcode() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        return showToast('⚠️ الكاميرا غير مدعومة في هذا المتصفح');
    }
    // محاكاة مسح الباركود - في التطبيق الحقيقي نستخدم مكتبة مثل html5-qrcode
    const barcode = prompt('📷 أدخل الباركود (محاكاة المسح):');
    if (barcode) {
        document.getElementById('saleProductSearch').value = barcode;
        searchProductLive(barcode);
    }
}

// ============================================================
// 5. نظام التصدير
// ============================================================
function exportAllReports() {
    const d = getData();
    const data = {
        sales: d.sales || [],
        purchases: d.purchases || [],
        products: d.products || [],
        clients: d.clients || [],
        suppliers: d.suppliers || [],
        treasury: d.treasury || 0,
        expenses: d.expenses || [],
        collections: d.collections || [],
        supplierPayments: d.supplierPayments || []
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `reports_${new Date().toISOString().slice(0,10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('📤 تم تصدير التقارير');
}

// ============================================================
// 6. نظام إدارة المستخدمين والصلاحيات
// ============================================================
function showUserManagement() {
    const panel = document.getElementById('userManagementPanel');
    panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
    if (panel.style.display === 'block') {
        const d = getData();
        const users = appData.users || {};
        let html = '<h4 style="color:#2E4057;">👤 المستخدمين</h4>';
        html += '<table style="width:100%;border-collapse:collapse;font-size:13px;">';
        html += '<thead><tr style="background:#2E4057;color:white;"><th style="padding:8px;text-align:right;">الاسم</th><th style="padding:8px;text-align:right;">البريد</th><th style="padding:8px;text-align:right;">الدور</th><th style="padding:8px;text-align:right;">الحالة</th></tr></thead><tbody>';
        Object.keys(users).forEach(uid => {
            const u = users[uid];
            if (u) {
                html += `<tr style="border-bottom:1px solid #eee;"><td style="padding:8px;">${u.displayName || 'غير معروف'}</td><td style="padding:8px;">${u.email || ''}</td><td style="padding:8px;"><span style="background:${u.role === 'admin' ? '#2E4057' : u.role === 'accountant' ? '#00B894' : u.role === 'sales' ? '#FDCB6E' : '#6C5CE7'};color:white;padding:2px 8px;border-radius:4px;font-size:11px;">${u.role || 'user'}</span></td><td style="padding:8px;"><span style="color:${u.lastLogin ? '#00B894' : '#999'};">${u.lastLogin ? '🟢 نشط' : '🔴 غير نشط'}</span></td></tr>`;
            }
        });
        html += '</tbody></table>';
        panel.innerHTML = html;
    }
}

function showRolesManagement() {
    const panel = document.getElementById('userManagementPanel');
    panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
    if (panel.style.display === 'block') {
        const roles = [
            { id: 'admin', name: 'مدير', permissions: 'كل الصلاحيات' },
            { id: 'accountant', name: 'محاسب', permissions: 'الفواتير، التقارير، الخزنة' },
            { id: 'sales', name: 'مندوب مبيعات', permissions: 'إضافة المبيعات فقط' },
            { id: 'warehouse', name: 'مشرف مخازن', permissions: 'إدارة المخازن فقط' },
            { id: 'viewer', name: 'مشاهد', permissions: 'مشاهدة فقط بدون تعديل' }
        ];
        let html = '<h4 style="color:#2E4057;">🔐 الصلاحيات</h4>';
        html += '<table style="width:100%;border-collapse:collapse;font-size:13px;">';
        html += '<thead><tr style="background:#2E4057;color:white;"><th style="padding:8px;text-align:right;">الدور</th><th style="padding:8px;text-align:right;">الصلاحيات</th></tr></thead><tbody>';
        roles.forEach(r => {
            html += `<tr style="border-bottom:1px solid #eee;"><td style="padding:8px;"><span style="background:${r.id === 'admin' ? '#2E4057' : r.id === 'accountant' ? '#00B894' : r.id === 'sales' ? '#FDCB6E' : '#6C5CE7'};color:white;padding:2px 8px;border-radius:4px;font-size:11px;">${r.name}</span></td><td style="padding:8px;">${r.permissions}</td></tr>`;
        });
        html += '</tbody></table>';
        panel.innerHTML = html;
    }
}

// ============================================================
// 7. نظام تصنيف العملاء
// ============================================================
let currentClientFilter = 'all';

function filterClients(type) {
    currentClientFilter = type;
    document.getElementById('filterAll').classList.toggle('active', type === 'all');
    document.getElementById('filterVip').classList.toggle('active', type === 'vip');
    document.getElementById('filterRegular').classList.toggle('active', type === 'regular');
    document.getElementById('filterOverdue').classList.toggle('active', type === 'overdue');
    updateClientList();
}

function updateClientList() {
    const d = getData();
    let clients = d.clients || [];
    if (currentClientFilter === 'vip') {
        clients = clients.filter(c => c.category === 'vip');
    } else if (currentClientFilter === 'regular') {
        clients = clients.filter(c => c.category === 'regular' || !c.category);
    } else if (currentClientFilter === 'overdue') {
        const today = new Date();
        clients = clients.filter(c => {
            if (!c.lastPaymentDate) return false;
            const lastPayment = new Date(c.lastPaymentDate);
            const diff = Math.floor((today - lastPayment) / (1000 * 60 * 60 * 24));
            return diff > (c.paymentPeriod || 30);
        });
    }
    const list = document.getElementById('clientList');
    if (!list) return;
    list.innerHTML = clients.map(c => `
        <div class="list-item">
            <div>
                <strong>${c.name}</strong>
                ${c.category === 'vip' ? '<span style="background:#FDCB6E;color:#333;padding:0 6px;border-radius:4px;font-size:11px;">⭐ VIP</span>' : ''}
                <br><small>📞 ${c.phone || ''}</small>
                ${c.balance ? `<br><small style="color:${c.balance > 0 ? '#E17055' : '#00B894'};">الرصيد: ${c.balance} ج.م</small>` : ''}
            </div>
            <div>
                <span style="background:#00B894;color:white;padding:2px 8px;border-radius:4px;font-size:11px;">عميل</span>
            </div>
        </div>
    `).join('') || '<div style="text-align:center;color:#999;padding:10px;">لا يوجد عملاء</div>';
}

// ============================================================
// 8. نظام الأقساط المتقدم
// ============================================================
function showAdvancedReport(type) {
    const d = getData();
    const today = new Date().toLocaleDateString('ar-EG');
    let html = '';
    if (type === 'installments') {
        const installments = d.installments || [];
        let rows = '';
        const totalInstallments = installments.length;
        const paidInstallments = installments.filter(x => x.paid).length;
        const overdueInstallments = installments.filter(x => !x.paid && new Date(x.dueDate) < new Date()).length;
        const totalAmount = installments.reduce((sum, x) => sum + (x.amount || 0), 0);
        const paidAmount = installments.filter(x => x.paid).reduce((sum, x) => sum + (x.amount || 0), 0);
        const overdueAmount = installments.filter(x => !x.paid && new Date(x.dueDate) < new Date()).reduce((sum, x) => sum + (x.amount || 0), 0);
        installments.forEach(x => {
            const status = x.paid ? '✅ مدفوع' : new Date(x.dueDate) < new Date() ? '⚠️ متأخر' : '⏳ مستحق';
            const color = x.paid ? '#00B894' : new Date(x.dueDate) < new Date() ? '#E17055' : '#FDCB6E';
            rows += `<tr style="border-bottom:1px solid #333;"><td style="padding:8px;">${x.client || ''}</td><td style="padding:8px;text-align:center;">${x.invoiceId || ''}</td><td style="padding:8px;text-align:center;">${x.number || 0}/${x.total || 0}</td><td style="padding:8px;text-align:center;">${x.amount || 0} ج.م</td><td style="padding:8px;text-align:center;">${x.dueDate || ''}</td><td style="padding:8px;text-align:center;color:${color};">${status}</td></tr>`;
        });
        html = `<div style="background:#1e1e2e;border-radius:12px;padding:15px;color:white;overflow-x:auto;">
            <div style="text-align:center;border-bottom:2px solid #6C5CE7;padding-bottom:10px;margin-bottom:15px;">
                <h3 style="margin:0;color:#6C5CE7;">📋 تقرير الأقساط</h3>
                <small style="color:#888;">${today}</small>
            </div>
            <div style="display:grid;grid-template-columns:1fr 1fr 1fr 1fr;gap:10px;margin-bottom:15px;">
                <div style="background:#2E4057;padding:10px;border-radius:8px;text-align:center;">
                    <div style="font-size:12px;color:#aaa;">إجمالي الأقساط</div>
                    <div style="font-size:20px;font-weight:bold;">${totalInstallments}</div>
                </div>
                <div style="background:#00B894;padding:10px;border-radius:8px;text-align:center;">
                    <div style="font-size:12px;color:#b8e6d9;">المدفوع</div>
                    <div style="font-size:20px;font-weight:bold;">${paidInstallments}</div>
                </div>
                <div style="background:#E17055;padding:10px;border-radius:8px;text-align:center;">
                    <div style="font-size:12px;color:#fdd;">المتأخر</div>
                    <div style="font-size:20px;font-weight:bold;">${overdueInstallments}</div>
                </div>
                <div style="background:#6C5CE7;padding:10px;border-radius:8px;text-align:center;">
                    <div style="font-size:12px;color:#d5cdf2;">القيمة</div>
                    <div style="font-size:20px;font-weight:bold;">${totalAmount} ج.م</div>
                </div>
            </div>
            <table style="width:100%;border-collapse:collapse;font-size:13px;">
                <thead><tr style="background:#2E4057;color:white;"><th style="padding:8px;text-align:right;">العميل</th><th style="padding:8px;text-align:center;">الفاتورة</th><th style="padding:8px;text-align:center;">القسط</th><th style="padding:8px;text-align:center;">المبلغ</th><th style="padding:8px;text-align:center;">تاريخ الاستحقاق</th><th style="padding:8px;text-align:center;">الحالة</th></tr></thead>
                <tbody>${rows || '<tr><td colspan="6" style="text-align:center;padding:20px;color:#888;">لا توجد أقساط</td></tr>'}</tbody>
            </table>
            <div style="display:flex;justify-content:space-between;padding:15px 0;margin-top:10px;border-top:2px solid #6C5CE7;font-size:16px;">
                <span>إجمالي المدفوع: ${paidAmount} ج.م</span>
                <span style="color:#E17055;">المتأخر: ${overdueAmount} ج.م</span>
            </div>
        </div>`;
    } else if (type === 'profit') {
        const s = d.sales || [];
        const p = d.purchases || [];
        const products = d.products || [];
        let rows = '';
        products.forEach(prod => {
            const sales = s.filter(inv => inv.items && inv.items.some(item => item.name === prod.name));
            const totalSales = sales.reduce((sum, inv) => sum + (inv.total || 0), 0);
            const totalQty = sales.reduce((sum, inv) => {
                const item = inv.items.find(i => i.name === prod.name);
                return sum + (item ? item.qty : 0);
            }, 0);
            const profitMargin = totalQty > 0 ? ((prod.sell || 0) - (prod.buy || 0)) * totalQty : 0;
            rows += `<tr style="border-bottom:1px solid #333;">
                <td style="padding:8px;">${prod.name}</td>
                <td style="padding:8px;text-align:center;">${totalQty}</td>
                <td style="padding:8px;text-align:center;">${prod.buy || 0} ج.م</td>
                <td style="padding:8px;text-align:center;">${prod.sell || 0} ج.م</td>
                <td style="padding:8px;text-align:center;color:${profitMargin > 0 ? '#00B894' : '#E17055'};">${profitMargin} ج.م</td>
                <td style="padding:8px;text-align:center;color:${profitMargin > 0 ? '#00B894' : '#E17055'};">${((profitMargin / ((prod.buy || 1) * totalQty || 1)) * 100).toFixed(1)}%</td>
            </tr>`;
        });
        html = `<div style="background:#1e1e2e;border-radius:12px;padding:15px;color:white;overflow-x:auto;">
            <div style="text-align:center;border-bottom:2px solid #FDCB6E;padding-bottom:10px;margin-bottom:15px;">
                <h3 style="margin:0;color:#FDCB6E;">💰 تقرير الربحية</h3>
                <small style="color:#888;">${today}</small>
            </div>
            <table style="width:100%;border-collapse:collapse;font-size:13px;">
                <thead><tr style="background:#2E4057;color:white;"><th style="padding:8px;text-align:right;">المنتج</th><th style="padding:8px;text-align:center;">الكمية المباعة</th><th style="padding:8px;text-align:center;">سعر الشراء</th><th style="padding:8px;text-align:center;">سعر البيع</th><th style="padding:8px;text-align:center;">هامش الربح</th><th style="padding:8px;text-align:center;">نسبة الربح</th></tr></thead>
                <tbody>${rows || '<tr><td colspan="6" style="text-align:center;padding:20px;color:#888;">لا توجد منتجات</td></tr>'}</tbody>
            </table>
        </div>`;
    }
    document.getElementById('reportContent').innerHTML = html;
}

// ============================================================
// 9. نظام تبديل اللغة والثيم
// ============================================================
let currentLang = 'ar';

function toggleLanguage() {
    currentLang = currentLang === 'ar' ? 'en' : 'ar';
    document.getElementById('langToggle').textContent = currentLang === 'ar' ? 'EN' : 'ع';
    document.documentElement.dir = currentLang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = currentLang;
    showToast(`✅ تم تبديل اللغة إلى ${currentLang === 'ar' ? 'العربية' : 'English'}`);
}

function toggleTheme() {
    const body = document.body;
    const icon = document.getElementById('themeIcon');
    if (body.classList.contains('theme-dark')) {
        body.classList.remove('theme-dark');
        icon.className = 'fas fa-moon';
        showToast('☀️ تم التبديل إلى الوضع الفاتح');
    } else {
        body.classList.add('theme-dark');
        icon.className = 'fas fa-sun';
        showToast('🌙 تم التبديل إلى الوضع الداكن');
    }
    // حفظ التفضيل
    const d = getData();
    if (!d.settings) d.settings = {};
    d.settings.theme = body.classList.contains('theme-dark') ? 'dark' : 'default';
    saveLocal();
}

// ============================================================
// 10. إعادة ضبط الإعدادات
// ============================================================
function resetAppSettings() {
    if (!confirm('⚠️ هل أنت متأكد من إعادة ضبط جميع الإعدادات؟')) return;
    const d = getData();
    d.settings = {
        theme: 'default',
        fontSize: 'medium',
        soundAlerts: true,
        popupAlerts: true,
        alertSound: 'beep'
    };
    saveLocal();
    loadSettings();
    showToast('✅ تم إعادة ضبط الإعدادات');
}

// ============================================================
// 27. بدء التشغيل
// ============================================================
initFirebase();
loadLocal();
if (!appData.users) appData.users = {};
if (!appData.activityLog) appData.activityLog = [];
if (!autoLogin()) {
    document.getElementById('authContainer').style.display = 'flex';
    document.getElementById('appContainer').style.display = 'none';
}
console.log('✅ نظام راشد V31 - ERP متكامل يعمل');

