// ============================================================
// نظام راشد V31 - النسخة الكاملة
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
let firebaseApp = null;
let firebaseAuth = null;
let firebaseDb = null;

// متغيرات الفواتير
let saleItems = [];
let saleTotal = 0;
let returnSaleItems = [];
let returnSaleTotal = 0;
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
        }
    } catch(e) {
        console.warn('Firebase error:', e);
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
            const parsed = JSON.parse(raw);
            appData = parsed;
            if (!appData.activityLog) appData.activityLog = [];
            if (!appData.users) appData.users = {};
        }
    } catch(e) { console.warn('Load error:', e); }
}

function saveLocal() {
    try {
        localStorage.setItem('RashedV31', JSON.stringify(appData));
        syncCloud();
    } catch(e) { console.warn('Save error:', e); }
}

function getData() {
    if (!appData.currentUser || !appData.users[appData.currentUser]) {
        return {
            sales: [], purchases: [], products: [], clients: [],
            treasury: 0, treasuryLog: [], expenses: [],
            collections: [], supplierPayments: [],
            warehouse: [],
            saleCounter: 0, purchaseCounter: 0,
            returnSaleCounter: 0, returnPurchaseCounter: 0,
            profile: { shopName: 'نظام راشد', branch: 'رئيسي' },
            settings: { theme: 'default', fontSize: 'medium', soundAlerts: true, popupAlerts: true, alertSound: 'beep', printer: 'thermal', barcodeLibrary: 'barcode', barcodeSize: 100 }
        };
    }
    
    const data = appData.users[appData.currentUser].data || {};
    if (!data.sales) data.sales = [];
    if (!data.purchases) data.purchases = [];
    if (!data.products) data.products = [];
    if (!data.clients) data.clients = [];
    if (data.treasury === undefined) data.treasury = 0;
    if (!data.treasuryLog) data.treasuryLog = [];
    if (!data.expenses) data.expenses = [];
    if (!data.collections) data.collections = [];
    if (!data.supplierPayments) data.supplierPayments = [];
    if (!data.warehouse) data.warehouse = [];
    if (data.saleCounter === undefined) data.saleCounter = 0;
    if (data.purchaseCounter === undefined) data.purchaseCounter = 0;
    if (data.returnSaleCounter === undefined) data.returnSaleCounter = 0;
    if (data.returnPurchaseCounter === undefined) data.returnPurchaseCounter = 0;
    if (!data.profile) data.profile = { shopName: 'نظام راشد', branch: 'رئيسي' };
    if (!data.settings) data.settings = { theme: 'default', fontSize: 'medium', soundAlerts: true, popupAlerts: true, alertSound: 'beep', printer: 'thermal', barcodeLibrary: 'barcode', barcodeSize: 100 };
    return data;
}

function syncCloud() {
    if (!appData.currentUser || !appData.users[appData.currentUser]) return;
    try {
        const { db } = initFirebase();
        const data = appData.users[appData.currentUser].data;
        if (data) db.ref('users/' + appData.currentUser + '/data').set(data);
    } catch(e) { console.warn('Sync error:', e); }
}

// ============================================================
// 5. جلب الموقع
// ============================================================
async function getUserLocation() {
    try {
        const response = await fetch('https://ipapi.co/json/');
        const data = await response.json();
        return { ip: data.ip || 'غير معروف', country: data.country_name || 'غير معروف', city: data.city || 'غير معروف', region: data.region || 'غير معروف', browser: navigator.userAgent || 'غير معروف' };
    } catch(e) {
        return { ip: 'غير معروف', country: 'غير معروف', city: 'غير معروف', region: 'غير معروف', browser: navigator.userAgent || 'غير معروف' };
    }
}

// ============================================================
// 6. الدخول والخروج
// ============================================================
function toggleAuthMode() {
    const login = document.getElementById('loginForm');
    const register = document.getElementById('registerForm');
    if (login) login.style.display = login.style.display === 'none' ? 'block' : 'none';
    if (register) register.style.display = register.style.display === 'none' ? 'block' : 'none';
}

async function handleLogin() {
    const username = document.getElementById('loginUser').value.trim();
    const pass = document.getElementById('loginPass').value.trim();
    const email = username + '@rashed.com';
    if (!username || !pass) return showToast('⚠️ أدخل البيانات');
    
    try {
        const { auth } = initFirebase();
        await auth.signInWithEmailAndPassword(email, pass);
        const user = auth.currentUser;
        const location = await getUserLocation();
        
        appData.currentUser = user.uid;
        if (!appData.users[user.uid]) {
            appData.users[user.uid] = {
                displayName: username,
                fullName: username,
                phone: '',
                address: '',
                data: {
                    sales: [], purchases: [], products: [], clients: [],
                    treasury: 0, treasuryLog: [], expenses: [],
                    collections: [], supplierPayments: [],
                    warehouse: [],
                    saleCounter: 0, purchaseCounter: 0,
                    returnSaleCounter: 0, returnPurchaseCounter: 0,
                    profile: { shopName: 'نظام راشد', branch: 'رئيسي' },
                    settings: { theme: 'default', fontSize: 'medium', soundAlerts: true, popupAlerts: true, alertSound: 'beep', printer: 'thermal', barcodeLibrary: 'barcode', barcodeSize: 100 }
                }
            };
        }
        
        appData.users[user.uid].lastLogin = new Date().toISOString();
        appData.users[user.uid].lastLocation = location;
        appData.activityLog.push({ userId: user.uid, username: username, action: 'دخول', time: new Date().toISOString(), ip: location.ip, country: location.country, city: location.city, browser: location.browser });
        saveLocal();
        enterApp();
        showToast('✅ مرحباً ' + username);
    } catch(error) {
        if (error.code === 'auth/user-not-found') showToast('❌ المستخدم غير موجود');
        else if (error.code === 'auth/wrong-password') showToast('❌ كلمة المرور خطأ');
        else showToast('❌ ' + error.message);
    }
}

async function handleRegister() {
    const username = document.getElementById('regUser').value.trim();
    const pass = document.getElementById('regPass').value.trim();
    const confirm = document.getElementById('regPassConfirm').value.trim();
    const fullName = document.getElementById('regFullName').value.trim();
    const phone = document.getElementById('regPhone').value.trim();
    const address = document.getElementById('regAddress').value.trim();
    const email = username + '@rashed.com';
    
    if (!username || username.length < 3) return showToast('⚠️ 3 أحرف على الأقل');
    if (pass.length < 6) return showToast('⚠️ 6 أحرف على الأقل');
    if (pass !== confirm) return showToast('⚠️ غير متطابقة');
    if (!fullName) return showToast('⚠️ أدخل الاسم الكامل');
    
    try {
        const { auth, db } = initFirebase();
        const result = await auth.createUserWithEmailAndPassword(email, pass);
        const user = result.user;
        const location = await getUserLocation();
        
        await db.ref('users/' + user.uid + '/data').set({
            sales: [], purchases: [], products: [], clients: [],
            treasury: 0, treasuryLog: [], expenses: [],
            collections: [], supplierPayments: [],
            warehouse: [],
            saleCounter: 0, purchaseCounter: 0,
            returnSaleCounter: 0, returnPurchaseCounter: 0,
            profile: { shopName: 'نظام راشد', branch: 'رئيسي' },
            settings: { theme: 'default', fontSize: 'medium', soundAlerts: true, popupAlerts: true, alertSound: 'beep', printer: 'thermal', barcodeLibrary: 'barcode', barcodeSize: 100 }
        });
        
        appData.currentUser = user.uid;
        appData.users[user.uid] = {
            displayName: username,
            fullName: fullName,
            phone: phone,
            address: address,
            lastLogin: new Date().toISOString(),
            lastLocation: location,
            data: {
                sales: [], purchases: [], products: [], clients: [],
                treasury: 0, treasuryLog: [], expenses: [],
                collections: [], supplierPayments: [],
                warehouse: [],
                saleCounter: 0, purchaseCounter: 0,
                returnSaleCounter: 0, returnPurchaseCounter: 0,
                profile: { shopName: 'نظام راشد', branch: 'رئيسي' },
                settings: { theme: 'default', fontSize: 'medium', soundAlerts: true, popupAlerts: true, alertSound: 'beep', printer: 'thermal', barcodeLibrary: 'barcode', barcodeSize: 100 }
            }
        };
        appData.activityLog.push({ userId: user.uid, username: username, action: 'تسجيل حساب جديد', time: new Date().toISOString(), ip: location.ip, country: location.country, city: location.city, browser: location.browser });
        saveLocal();
        enterApp();
        showToast('✅ تم إنشاء الحساب');
    } catch(error) {
        if (error.code === 'auth/email-already-in-use') showToast('⚠️ الاسم مستخدم');
        else showToast('❌ ' + error.message);
    }
}

function logout() {
    if (confirm('تسجيل الخروج؟')) {
        const { auth } = initFirebase();
        const username = appData.users[appData.currentUser]?.displayName || 'مستخدم';
        appData.activityLog.push({ userId: appData.currentUser, username: username, action: 'خروج', time: new Date().toISOString() });
        saveLocal();
        auth.signOut().then(() => { appData.currentUser = null; saveLocal(); location.reload(); });
    }
}

function enterApp() {
    document.getElementById('authContainer').style.display = 'none';
    document.getElementById('appContainer').style.display = 'block';
    const displayName = appData.users[appData.currentUser]?.fullName || appData.users[appData.currentUser]?.displayName || 'مستخدم';
    document.getElementById('userDisplay').textContent = displayName;
    loadSettings();
    updateUI();
    updateAdminPanel();
    switchPage('dashboard');
}

function autoLogin() {
    if (appData.currentUser && appData.users[appData.currentUser]) { enterApp(); return true; }
    return false;
}

// ============================================================
// 7. التنقل بين الصفحات
// ============================================================
function switchPage(page) {
    document.querySelectorAll('.page').forEach(el => el.classList.remove('active'));
    const target = document.getElementById('page-' + page);
    if (target) target.classList.add('active');
    if (page === 'dashboard') drawCharts();
    if (page === 'reports') updateReportSelects();
    if (page === 'sales') { 
        // التحقق من الوضع الحالي
        if (document.getElementById('saleModeReturn').classList.contains('active')) {
            initReturnSale();
        } else {
            initSaleInvoice();
        }
    }
    if (page === 'purchases') {
        if (document.getElementById('purchaseModeReturn').classList.contains('active')) {
            initReturnPurchase();
        } else {
            initPurchaseInvoice();
        }
    }
    if (page === 'settings') {
        loadSettings();
        const data = getData();
        document.getElementById('settingsUser').textContent = appData.users[appData.currentUser]?.fullName || appData.users[appData.currentUser]?.displayName || 'مستخدم';
        document.getElementById('settingsProducts').textContent = data.products.length;
        document.getElementById('settingsClients').textContent = data.clients.length;
    }
    if (page === 'admin') updateAdminPanel();
    if (page === 'warehouse') updateWarehouseLog();
}

// ============================================================
// 8. فاتورة المبيعات - بيع
// ============================================================
function initSaleInvoice() {
    const data = getData();
    const today = new Date().toLocaleDateString('ar-EG');
    document.getElementById('saleInvoiceDate').value = today;
    data.saleCounter = (data.saleCounter || 0) + 1;
    const invNum = 'INV-' + String(data.saleCounter).padStart(4, '0');
    document.getElementById('saleInvoiceNumber').value = invNum;
    saleItems = [];
    saleTotal = 0;
    updateSaleUI();
    saveLocal();
}

function searchProductForSale() {
    const input = document.getElementById('saleProductSearch').value.trim();
    if (!input) return;
    const data = getData();
    let product = data.products.find(p => p.barcode === input);
    if (!product) product = data.products.find(p => p.name && p.name.toLowerCase().includes(input.toLowerCase()));
    if (product) {
        document.getElementById('salePrice').value = product.sell || 0;
        document.getElementById('saleQty').value = 1;
        document.getElementById('saleProductSearch').value = product.name;
        showToast('✅ تم العثور على: ' + product.name);
    }
}

function addProductToSale() {
    const name = document.getElementById('saleProductSearch').value.trim();
    const qty = parseInt(document.getElementById('saleQty').value) || 1;
    const price = parseFloat(document.getElementById('salePrice').value) || 0;
    if (!name || price <= 0 || qty <= 0) return showToast('⚠️ أدخل اسم المنتج وسعر صحيح');
    const data = getData();
    const product = data.products.find(p => p.name === name);
    if (product && product.qty < qty) return showToast(`⚠️ الكمية غير متوفرة! المتاح: ${product.qty}`);
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
        list.innerHTML = '<div style="text-align:center;padding:30px;color:#999;font-size:13px;">أضف منتجات للفاتورة</div>';
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
    showToast('🗑️ تم حذف المنتج');
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
    if (saleItems.length === 0) return showToast('⚠️ أضف منتجات للفاتورة');
    
    const data = getData();
    let canSave = true;
    saleItems.forEach(item => {
        const product = data.products.find(p => p.name === item.name);
        if (product && product.qty < item.qty) { canSave = false; showToast(`⚠️ الكمية غير متوفرة لـ ${item.name}`); }
    });
    if (!canSave) return;
    
    saleItems.forEach(item => {
        const product = data.products.find(p => p.name === item.name);
        if (product) product.qty -= item.qty;
    });
    
    const invoice = { id: invNum, client, date, type, items: JSON.parse(JSON.stringify(saleItems)), total: saleTotal, paid, balance: saleTotal - paid, isReturn: false };
    if (!data.sales) data.sales = [];
    data.sales.push(invoice);
    
    if (type === 'cash') {
        data.treasury = (data.treasury || 0) + paid;
        data.treasuryLog.push({ desc: 'بيع كاش - ' + client + ' (' + invNum + ')', amount: paid });
    } else if (paid > 0) {
        data.treasury = (data.treasury || 0) + paid;
        data.treasuryLog.push({ desc: 'دفعة مبيعات - ' + client + ' (' + invNum + ')', amount: paid });
    }
    
    saveLocal();
    showToast('✅ تم حفظ الفاتورة ' + invNum + ' بقيمة ' + saleTotal + ' ج.م');
    printSaleInvoice(invNum);
    clearSaleInvoice();
    updateUI();
}

function clearSaleInvoice() {
    saleItems = [];
    saleTotal = 0;
    document.getElementById('saleClient').value = '';
    document.getElementById('salePaid').value = 0;
    updateSaleUI();
    document.getElementById('saleProductSearch').value = '';
    document.getElementById('saleQty').value = 1;
    document.getElementById('salePrice').value = '';
    initSaleInvoice();
}

function printSaleInvoice(invoiceId) {
    const data = getData();
    const invoice = data.sales.find(s => s.id === invoiceId);
    if (!invoice) return showToast('⚠️ الفاتورة غير موجودة');
    const profile = data.profile || { shopName: 'نظام راشد', branch: 'رئيسي' };
    const typeNames = { cash: 'كاش', credit: 'آجل', installment: 'تقسيط' };
    let itemsHtml = '';
    invoice.items.forEach(item => {
        itemsHtml += `<tr><td style="padding:6px;border:1px solid #ddd;text-align:right;">${item.name}</td><td style="padding:6px;border:1px solid #ddd;text-align:center;">${item.qty}</td><td style="padding:6px;border:1px solid #ddd;text-align:center;">${item.price} ج.م</td><td style="padding:6px;border:1px solid #ddd;text-align:left;font-weight:bold;">${item.total} ج.م</td></tr>`;
    });
    let printContent = `<div style="direction:rtl;font-family:Arial,sans-serif;padding:20px;max-width:600px;margin:auto;background:white;color:#333;border:1px solid #ddd;border-radius:10px;">
        <div style="text-align:center;border-bottom:2px solid #2E4057;padding-bottom:15px;margin-bottom:20px;">
            <h2 style="margin:0;color:#2E4057;">${profile.shopName}</h2>
            <p style="font-size:12px;color:#666;margin:2px 0;">${profile.branch || ''}</p>
            <p style="font-size:14px;font-weight:bold;color:#2E4057;margin:5px 0;">فاتورة بيع</p>
        </div>
        <div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:15px;">
            <div><strong>رقم الفاتورة:</strong> ${invoice.id}<br><strong>التاريخ:</strong> ${invoice.date}</div>
            <div style="text-align:left;"><strong>العميل:</strong> ${invoice.client}<br><strong>نوع الدفع:</strong> ${typeNames[invoice.type] || invoice.type}</div>
        </div>
        <table style="width:100%;border-collapse:collapse;font-size:13px;margin-bottom:15px;">
            <thead><tr style="background:#2E4057;color:white;"><th style="padding:8px;text-align:right;border:1px solid #2E4057;">المنتج</th><th style="padding:8px;text-align:center;border:1px solid #2E4057;">الكمية</th><th style="padding:8px;text-align:center;border:1px solid #2E4057;">السعر</th><th style="padding:8px;text-align:left;border:1px solid #2E4057;">الإجمالي</th></tr></thead>
            <tbody>${itemsHtml}</tbody>
            <tfoot>
                <tr style="background:#f0f2f5;font-weight:bold;"><td colspan="3" style="padding:8px;border:1px solid #ddd;text-align:left;">الإجمالي</td><td style="padding:8px;border:1px solid #ddd;color:#2E4057;font-size:16px;">${invoice.total} ج.م</td></tr>
                <tr><td colspan="3" style="padding:8px;border:1px solid #ddd;text-align:left;">المدفوع</td><td style="padding:8px;border:1px solid #ddd;color:#00B894;font-weight:bold;">${invoice.paid || 0} ج.م</td></tr>
                <tr style="font-weight:bold;"><td colspan="3" style="padding:8px;border:1px solid #ddd;text-align:left;">المتبقي</td><td style="padding:8px;border:1px solid #ddd;color:${(invoice.balance || 0) > 0 ? '#E17055' : '#00B894'};font-size:16px;">${invoice.balance || 0} ج.م</td></tr>
            </tfoot>
        </table>
        <div style="text-align:center;font-size:11px;color:#999;margin-top:15px;border-top:1px solid #ddd;padding-top:10px;">شكراً لتعاملكم معنا - ${profile.shopName}</div>
    </div>`;
    const win = window.open('', '_blank');
    if (win) {
        win.document.write(`<html><head><meta charset="UTF-8"><title>فاتورة ${invoice.id}</title><style>body{margin:0;padding:20px;background:#f5f5f5;display:flex;justify-content:center;align-items:center;min-height:100vh;}@media print{body{background:white;padding:0;}}</style></head><body>${printContent}</body></html>`);
        win.document.close();
        win.focus();
        setTimeout(() => { win.print(); }, 500);
    }
}

// ============================================================
// 9. فاتورة المبيعات - مرتجع بيع
// ============================================================
function initReturnSale() {
    const data = getData();
    const today = new Date().toLocaleDateString('ar-EG');
    document.getElementById('saleInvoiceDate').value = today;
    data.returnSaleCounter = (data.returnSaleCounter || 0) + 1;
    const invNum = 'RET-INV-' + String(data.returnSaleCounter).padStart(4, '0');
    document.getElementById('saleInvoiceNumber').value = invNum;
    returnSaleItems = [];
    returnSaleTotal = 0;
    updateReturnSaleUI();
    saveLocal();
}

function searchProductForReturnSale() {
    const input = document.getElementById('saleProductSearch').value.trim();
    if (!input) return;
    const data = getData();
    let product = data.products.find(p => p.barcode === input);
    if (!product) product = data.products.find(p => p.name && p.name.toLowerCase().includes(input.toLowerCase()));
    if (product) {
        document.getElementById('salePrice').value = product.sell || 0;
        document.getElementById('saleQty').value = 1;
        document.getElementById('saleProductSearch').value = product.name;
        showToast('✅ تم العثور على: ' + product.name);
    }
}

function addProductToReturnSale() {
    const name = document.getElementById('saleProductSearch').value.trim();
    const qty = parseInt(document.getElementById('saleQty').value) || 1;
    const price = parseFloat(document.getElementById('salePrice').value) || 0;
    if (!name || price <= 0 || qty <= 0) return showToast('⚠️ أدخل اسم المنتج وسعر صحيح');
    const data = getData();
    const product = data.products.find(p => p.name === name);
    if (!product) return showToast('⚠️ المنتج غير موجود في المخزون');
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
        list.innerHTML = '<div style="text-align:center;padding:30px;color:#999;font-size:13px;">أضف منتجات للمرتجع</div>';
        document.getElementById('saleTotalDisplay').textContent = '0 ج.م';
        updateReturnSaleBalance();
        return;
    }
    let html = '';
    returnSaleItems.forEach((item, index) => {
        html += `<div style="display:grid;grid-template-columns:2fr 1fr 1fr 1fr 1fr;padding:6px 10px;border-bottom:1px solid #eee;font-size:13px;align-items:center;background:#fff5f5;">
            <span>${item.name}</span>
            <span style="text-align:center;">${item.qty}</span>
            <span style="text-align:center;">${item.price} ج.م</span>
            <span style="text-align:center;font-weight:bold;color:#E17055;">${item.total} ج.م</span>
            <span style="text-align:center;"><button onclick="removeReturnSaleItem(${index})" style="background:#E17055;color:white;border:none;border-radius:4px;padding:2px 10px;cursor:pointer;font-size:11px;">✕</button></span>
        </div>`;
    });
    list.innerHTML = html;
    document.getElementById('saleTotalDisplay').textContent = returnSaleTotal + ' ج.م';
    updateReturnSaleBalance();
}

function removeReturnSaleItem(index) {
    returnSaleTotal -= returnSaleItems[index].total;
    returnSaleItems.splice(index, 1);
    updateReturnSaleUI();
    showToast('🗑️ تم حذف المنتج');
}

function updateReturnSaleBalance() {
    const paid = parseFloat(document.getElementById('salePaid').value) || 0;
    const balance = returnSaleTotal - paid;
    const el = document.getElementById('saleBalanceDisplay');
    el.textContent = balance + ' ج.م';
    el.style.color = balance > 0 ? '#E17055' : '#00B894';
}

function saveReturnSaleInvoice() {
    const client = document.getElementById('saleClient').value.trim();
    const invNum = document.getElementById('saleInvoiceNumber').value;
    const date = document.getElementById('saleInvoiceDate').value;
    const type = document.getElementById('saleType').value;
    const paid = parseFloat(document.getElementById('salePaid').value) || 0;
    if (!client) return showToast('⚠️ أدخل اسم العميل');
    if (returnSaleItems.length === 0) return showToast('⚠️ أضف منتجات للمرتجع');
    
    const data = getData();
    returnSaleItems.forEach(item => {
        let product = data.products.find(p => p.name === item.name);
        if (product) {
            product.qty = (product.qty || 0) + item.qty;
        } else {
            data.products.push({ id: Date.now().toString(), name: item.name, desc: 'تم إضافته من مرتجع', qty: item.qty, buy: item.price * 0.8, sell: item.price, barcode: Math.floor(10000000 + Math.random() * 90000000).toString() });
        }
    });
    
    const invoice = { id: invNum, client, date, type, items: JSON.parse(JSON.stringify(returnSaleItems)), total: returnSaleTotal, paid, balance: returnSaleTotal - paid, isReturn: true };
    if (!data.sales) data.sales = [];
    data.sales.push(invoice);
    
    if (type === 'cash') {
        data.treasury = (data.treasury || 0) - paid;
        data.treasuryLog.push({ desc: 'مرتجع بيع كاش - ' + client + ' (' + invNum + ')', amount: -paid });
    }
    
    saveLocal();
    showToast('✅ تم حفظ مرتجع البيع ' + invNum + ' بقيمة ' + returnSaleTotal + ' ج.م');
    printReturnSaleInvoice(invNum);
    clearReturnSaleInvoice();
    updateUI();
}

function clearReturnSaleInvoice() {
    returnSaleItems = [];
    returnSaleTotal = 0;
    document.getElementById('saleClient').value = '';
    document.getElementById('salePaid').value = 0;
    updateReturnSaleUI();
    document.getElementById('saleProductSearch').value = '';
    document.getElementById('saleQty').value = 1;
    document.getElementById('salePrice').value = '';
    initReturnSale();
}

function printReturnSaleInvoice(invoiceId) {
    const data = getData();
    const invoice = data.sales.find(s => s.id === invoiceId);
    if (!invoice) return showToast('⚠️ الفاتورة غير موجودة');
    const profile = data.profile || { shopName: 'نظام راشد', branch: 'رئيسي' };
    let itemsHtml = '';
    invoice.items.forEach(item => {
        itemsHtml += `<tr><td style="padding:6px;border:1px solid #ddd;text-align:right;">${item.name}</td><td style="padding:6px;border:1px solid #ddd;text-align:center;">${item.qty}</td><td style="padding:6px;border:1px solid #ddd;text-align:center;">${item.price} ج.م</td><td style="padding:6px;border:1px solid #ddd;text-align:left;font-weight:bold;color:#E17055;">${item.total} ج.م</td></tr>`;
    });
    let printContent = `<div style="direction:rtl;font-family:Arial,sans-serif;padding:20px;max-width:600px;margin:auto;background:white;color:#333;border:2px solid #E17055;border-radius:10px;">
        <div style="text-align:center;border-bottom:2px solid #E17055;padding-bottom:15px;margin-bottom:20px;">
            <h2 style="margin:0;color:#E17055;">${profile.shopName}</h2>
            <p style="font-size:12px;color:#666;margin:2px 0;">${profile.branch || ''}</p>
            <p style="font-size:14px;font-weight:bold;color:#E17055;margin:5px 0;">📝 مرتجع بيع</p>
        </div>
        <div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:15px;">
            <div><strong>رقم المرتجع:</strong> ${invoice.id}<br><strong>التاريخ:</strong> ${invoice.date}</div>
            <div style="text-align:left;"><strong>العميل:</strong> ${invoice.client}<br><strong>نوع الدفع:</strong> ${invoice.type === 'cash' ? 'كاش' : 'آجل'}</div>
        </div>
        <table style="width:100%;border-collapse:collapse;font-size:13px;margin-bottom:15px;">
            <thead><tr style="background:#E17055;color:white;"><th style="padding:8px;text-align:right;border:1px solid #E17055;">المنتج</th><th style="padding:8px;text-align:center;border:1px solid #E17055;">الكمية</th><th style="padding:8px;text-align:center;border:1px solid #E17055;">السعر</th><th style="padding:8px;text-align:left;border:1px solid #E17055;">الإجمالي</th></tr></thead>
            <tbody>${itemsHtml}</tbody>
            <tfoot>
                <tr style="background:#f0f2f5;font-weight:bold;"><td colspan="3" style="padding:8px;border:1px solid #ddd;text-align:left;">إجمالي المرتجع</td><td style="padding:8px;border:1px solid #ddd;color:#E17055;font-size:16px;">${invoice.total} ج.م</td></tr>
                <tr><td colspan="3" style="padding:8px;border:1px solid #ddd;text-align:left;">المدفوع (مسترد)</td><td style="padding:8px;border:1px solid #ddd;color:#00B894;font-weight:bold;">${invoice.paid || 0} ج.م</td></tr>
                <tr style="font-weight:bold;"><td colspan="3" style="padding:8px;border:1px solid #ddd;text-align:left;">المتبقي</td><td style="padding:8px;border:1px solid #ddd;color:${(invoice.balance || 0) > 0 ? '#E17055' : '#00B894'};font-size:16px;">${invoice.balance || 0} ج.م</td></tr>
            </tfoot>
        </table>
        <div style="text-align:center;font-size:11px;color:#999;margin-top:15px;border-top:1px solid #ddd;padding-top:10px;">شكراً لتعاملكم معنا - ${profile.shopName}</div>
    </div>`;
    const win = window.open('', '_blank');
    if (win) {
        win.document.write(`<html><head><meta charset="UTF-8"><title>مرتجع ${invoice.id}</title><style>body{margin:0;padding:20px;background:#f5f5f5;display:flex;justify-content:center;align-items:center;min-height:100vh;}@media print{body{background:white;padding:0;}}</style></head><body>${printContent}</body></html>`);
        win.document.close();
        win.focus();
        setTimeout(() => { win.print(); }, 500);
    }
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
        document.getElementById('saleProductSearch').placeholder = '🔍 اكتب اسم أو باركود';
        document.getElementById('saleInvoiceNumber').style.borderColor = '#2E4057';
        document.querySelector('.modal-box').style.borderColor = '#eee';
        initSaleInvoice();
    } else {
        if (addFields) addFields.style.display = 'none';
        if (returnFields) returnFields.style.display = 'block';
        if (addBtn) addBtn.classList.remove('active');
        if (returnBtn) returnBtn.classList.add('active');
        document.getElementById('saleProductSearch').placeholder = '🔍 اكتب اسم المنتج للمرتجع';
        document.getElementById('saleInvoiceNumber').style.borderColor = '#E17055';
        document.querySelector('.modal-box').style.borderColor = '#E17055';
        initReturnSale();
    }
}

// ============================================================
// 10. فاتورة المشتريات - شراء
// ============================================================
function initPurchaseInvoice() {
    const data = getData();
    const today = new Date().toLocaleDateString('ar-EG');
    document.getElementById('purchaseInvoiceDate').value = today;
    data.purchaseCounter = (data.purchaseCounter || 0) + 1;
    const purNum = 'PUR-' + String(data.purchaseCounter).padStart(4, '0');
    document.getElementById('purchaseInvoiceNumber').value = purNum;
    purchaseItems = [];
    purchaseTotal = 0;
    updatePurchaseUI();
    saveLocal();
}

function searchProductForPurchase() {
    const input = document.getElementById('purchaseProductSearch').value.trim();
    if (!input) return;
    const data = getData();
    let product = data.products.find(p => p.name && p.name.toLowerCase().includes(input.toLowerCase()));
    if (product) {
        document.getElementById('purchasePrice').value = product.buy || 0;
        document.getElementById('purchaseQty').value = 1;
        document.getElementById('purchaseProductSearch').value = product.name;
        showToast('✅ تم العثور على: ' + product.name);
    }
}

function addProductToPurchase() {
    const name = document.getElementById('purchaseProductSearch').value.trim();
    const qty = parseInt(document.getElementById('purchaseQty').value) || 1;
    const price = parseFloat(document.getElementById('purchasePrice').value) || 0;
    if (!name || price <= 0 || qty <= 0) return showToast('⚠️ أدخل اسم المنتج وسعر صحيح');
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
        list.innerHTML = '<div style="text-align:center;padding:30px;color:#999;font-size:13px;">أضف منتجات للفاتورة</div>';
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
    showToast('🗑️ تم حذف المنتج');
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
    if (purchaseItems.length === 0) return showToast('⚠️ أضف منتجات للفاتورة');
    
    const data = getData();
    purchaseItems.forEach(item => {
        let product = data.products.find(p => p.name === item.name);
        if (product) {
            product.qty = (product.qty || 0) + item.qty;
        } else {
            data.products.push({ id: Date.now().toString(), name: item.name, desc: '', qty: item.qty, buy: item.price, sell: item.price * 1.2, barcode: Math.floor(10000000 + Math.random() * 90000000).toString() });
        }
    });
    
    const invoice = { id: invNum, supplier, date, type, items: JSON.parse(JSON.stringify(purchaseItems)), total: purchaseTotal, paid, balance: purchaseTotal - paid, isReturn: false };
    if (!data.purchases) data.purchases = [];
    data.purchases.push(invoice);
    
    if (type === 'cash') {
        data.treasury = (data.treasury || 0) - paid;
        data.treasuryLog.push({ desc: 'شراء كاش - ' + supplier + ' (' + invNum + ')', amount: -paid });
    }
    
    saveLocal();
    showToast('✅ تم حفظ فاتورة الشراء ' + invNum + ' بقيمة ' + purchaseTotal + ' ج.م');
    printPurchaseInvoice(invNum);
    clearPurchaseInvoice();
    updateUI();
}

function clearPurchaseInvoice() {
    purchaseItems = [];
    purchaseTotal = 0;
    document.getElementById('purchaseSupplier').value = '';
    document.getElementById('purchasePaid').value = 0;
    updatePurchaseUI();
    document.getElementById('purchaseProductSearch').value = '';
    document.getElementById('purchaseQty').value = 1;
    document.getElementById('purchasePrice').value = '';
    initPurchaseInvoice();
}

function printPurchaseInvoice(invoiceId) {
    const data = getData();
    const invoice = data.purchases.find(p => p.id === invoiceId);
    if (!invoice) return showToast('⚠️ الفاتورة غير موجودة');
    const profile = data.profile || { shopName: 'نظام راشد', branch: 'رئيسي' };
    let itemsHtml = '';
    invoice.items.forEach(item => {
        itemsHtml += `<tr><td style="padding:6px;border:1px solid #ddd;text-align:right;">${item.name}</td><td style="padding:6px;border:1px solid #ddd;text-align:center;">${item.qty}</td><td style="padding:6px;border:1px solid #ddd;text-align:center;">${item.price} ج.م</td><td style="padding:6px;border:1px solid #ddd;text-align:left;font-weight:bold;">${item.total} ج.م</td></tr>`;
    });
    let printContent = `<div style="direction:rtl;font-family:Arial,sans-serif;padding:20px;max-width:600px;margin:auto;background:white;color:#333;border:1px solid #ddd;border-radius:10px;">
        <div style="text-align:center;border-bottom:2px solid #E17055;padding-bottom:15px;margin-bottom:20px;">
            <h2 style="margin:0;color:#E17055;">${profile.shopName}</h2>
            <p style="font-size:12px;color:#666;margin:2px 0;">${profile.branch || ''}</p>
            <p style="font-size:14px;font-weight:bold;color:#E17055;margin:5px 0;">فاتورة شراء</p>
        </div>
        <div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:15px;">
            <div><strong>رقم الفاتورة:</strong> ${invoice.id}<br><strong>التاريخ:</strong> ${invoice.date}</div>
            <div style="text-align:left;"><strong>المورد:</strong> ${invoice.supplier}<br><strong>نوع الدفع:</strong> ${invoice.type === 'cash' ? 'كاش' : 'آجل'}</div>
        </div>
        <table style="width:100%;border-collapse:collapse;font-size:13px;margin-bottom:15px;">
            <thead><tr style="background:#E17055;color:white;"><th style="padding:8px;text-align:right;border:1px solid #E17055;">المنتج</th><th style="padding:8px;text-align:center;border:1px solid #E17055;">الكمية</th><th style="padding:8px;text-align:center;border:1px solid #E17055;">السعر</th><th style="padding:8px;text-align:left;border:1px solid #E17055;">الإجمالي</th></tr></thead>
            <tbody>${itemsHtml}</tbody>
            <tfoot>
                <tr style="background:#f0f2f5;font-weight:bold;"><td colspan="3" style="padding:8px;border:1px solid #ddd;text-align:left;">الإجمالي</td><td style="padding:8px;border:1px solid #ddd;color:#E17055;font-size:16px;">${invoice.total} ج.م</td></tr>
                <tr><td colspan="3" style="padding:8px;border:1px solid #ddd;text-align:left;">المدفوع</td><td style="padding:8px;border:1px solid #ddd;color:#00B894;font-weight:bold;">${invoice.paid || 0} ج.م</td></tr>
                <tr style="font-weight:bold;"><td colspan="3" style="padding:8px;border:1px solid #ddd;text-align:left;">المتبقي</td><td style="padding:8px;border:1px solid #ddd;color:${(invoice.balance || 0) > 0 ? '#E17055' : '#00B894'};font-size:16px;">${invoice.balance || 0} ج.م</td></tr>
            </tfoot>
        </table>
        <div style="text-align:center;font-size:11px;color:#999;margin-top:15px;border-top:1px solid #ddd;padding-top:10px;">شكراً لتعاملكم معنا - ${profile.shopName}</div>
    </div>`;
    const win = window.open('', '_blank');
    if (win) {
        win.document.write(`<html><head><meta charset="UTF-8"><title>فاتورة ${invoice.id}</title><style>body{margin:0;padding:20px;background:#f5f5f5;display:flex;justify-content:center;align-items:center;min-height:100vh;}@media print{body{background:white;padding:0;}}</style></head><body>${printContent}</body></html>`);
        win.document.close();
        win.focus();
        setTimeout(() => { win.print(); }, 500);
    }
}

// ============================================================
// 11. فاتورة المشتريات - مرتجع شراء
// ============================================================
function initReturnPurchase() {
    const data = getData();
    const today = new Date().toLocaleDateString('ar-EG');
    document.getElementById('purchaseInvoiceDate').value = today;
    data.returnPurchaseCounter = (data.returnPurchaseCounter || 0) + 1;
    const purNum = 'RET-PUR-' + String(data.returnPurchaseCounter).padStart(4, '0');
    document.getElementById('purchaseInvoiceNumber').value = purNum;
    returnPurchaseItems = [];
    returnPurchaseTotal = 0;
    updateReturnPurchaseUI();
    saveLocal();
}

function searchProductForReturnPurchase() {
    const input = document.getElementById('purchaseProductSearch').value.trim();
    if (!input) return;
    const data = getData();
    let product = data.products.find(p => p.name && p.name.toLowerCase().includes(input.toLowerCase()));
    if (product) {
        document.getElementById('purchasePrice').value = product.buy || 0;
        document.getElementById('purchaseQty').value = 1;
        document.getElementById('purchaseProductSearch').value = product.name;
        showToast('✅ تم العثور على: ' + product.name);
    }
}

function addProductToReturnPurchase() {
    const name = document.getElementById('purchaseProductSearch').value.trim();
    const qty = parseInt(document.getElementById('purchaseQty').value) || 1;
    const price = parseFloat(document.getElementById('purchasePrice').value) || 0;
    if (!name || price <= 0 || qty <= 0) return showToast('⚠️ أدخل اسم المنتج وسعر صحيح');
    const data = getData();
    const product = data.products.find(p => p.name === name);
    if (!product) return showToast('⚠️ المنتج غير موجود');
    if ((product.qty || 0) < qty) return showToast('⚠️ الكمية غير متوفرة للمرتجع');
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
        list.innerHTML = '<div style="text-align:center;padding:30px;color:#999;font-size:13px;">أضف منتجات للمرتجع</div>';
        document.getElementById('purchaseTotalDisplay').textContent = '0 ج.م';
        updateReturnPurchaseBalance();
        return;
    }
    let html = '';
    returnPurchaseItems.forEach((item, index) => {
        html += `<div style="display:grid;grid-template-columns:2fr 1fr 1fr 1fr 1fr;padding:6px 10px;border-bottom:1px solid #eee;font-size:13px;align-items:center;background:#fff5f5;">
            <span>${item.name}</span>
            <span style="text-align:center;">${item.qty}</span>
            <span style="text-align:center;">${item.price} ج.م</span>
            <span style="text-align:center;font-weight:bold;color:#E17055;">${item.total} ج.م</span>
            <span style="text-align:center;"><button onclick="removeReturnPurchaseItem(${index})" style="background:#E17055;color:white;border:none;border-radius:4px;padding:2px 10px;cursor:pointer;font-size:11px;">✕</button></span>
        </div>`;
    });
    list.innerHTML = html;
    document.getElementById('purchaseTotalDisplay').textContent = returnPurchaseTotal + ' ج.م';
    updateReturnPurchaseBalance();
}

function removeReturnPurchaseItem(index) {
    returnPurchaseTotal -= returnPurchaseItems[index].total;
    returnPurchaseItems.splice(index, 1);
    updateReturnPurchaseUI();
    showToast('🗑️ تم حذف المنتج');
}

function updateReturnPurchaseBalance() {
    const paid = parseFloat(document.getElementById('purchasePaid').value) || 0;
    const balance = returnPurchaseTotal - paid;
    const el = document.getElementById('purchaseBalanceDisplay');
    el.textContent = balance + ' ج.م';
    el.style.color = balance > 0 ? '#E17055' : '#00B894';
}

function saveReturnPurchaseInvoice() {
    const supplier = document.getElementById('purchaseSupplier').value.trim();
    const invNum = document.getElementById('purchaseInvoiceNumber').value;
    const date = document.getElementById('purchaseInvoiceDate').value;
    const type = document.getElementById('purchaseType').value;
    const paid = parseFloat(document.getElementById('purchasePaid').value) || 0;
    if (!supplier) return showToast('⚠️ أدخل اسم المورد');
    if (returnPurchaseItems.length === 0) return showToast('⚠️ أضف منتجات للمرتجع');
    
    const data = getData();
    returnPurchaseItems.forEach(item => {
        const product = data.products.find(p => p.name === item.name);
        if (product) {
            if ((product.qty || 0) < item.qty) {
                return showToast(`⚠️ الكمية غير متوفرة لـ ${item.name}`);
            }
            product.qty = (product.qty || 0) - item.qty;
        }
    });
    
    const invoice = { id: invNum, supplier, date, type, items: JSON.parse(JSON.stringify(returnPurchaseItems)), total: returnPurchaseTotal, paid, balance: returnPurchaseTotal - paid, isReturn: true };
    if (!data.purchases) data.purchases = [];
    data.purchases.push(invoice);
    
    if (type === 'cash') {
        data.treasury = (data.treasury || 0) + paid;
        data.treasuryLog.push({ desc: 'مرتجع شراء كاش - ' + supplier + ' (' + invNum + ')', amount: paid });
    }
    
    saveLocal();
    showToast('✅ تم حفظ مرتجع الشراء ' + invNum + ' بقيمة ' + returnPurchaseTotal + ' ج.م');
    printReturnPurchaseInvoice(invNum);
    clearReturnPurchaseInvoice();
    updateUI();
}

function clearReturnPurchaseInvoice() {
    returnPurchaseItems = [];
    returnPurchaseTotal = 0;
    document.getElementById('purchaseSupplier').value = '';
    document.getElementById('purchasePaid').value = 0;
    updateReturnPurchaseUI();
    document.getElementById('purchaseProductSearch').value = '';
    document.getElementById('purchaseQty').value = 1;
    document.getElementById('purchasePrice').value = '';
    initReturnPurchase();
}

function printReturnPurchaseInvoice(invoiceId) {
    const data = getData();
    const invoice = data.purchases.find(p => p.id === invoiceId);
    if (!invoice) return showToast('⚠️ الفاتورة غير موجودة');
    const profile = data.profile || { shopName: 'نظام راشد', branch: 'رئيسي' };
    let itemsHtml = '';
    invoice.items.forEach(item => {
        itemsHtml += `<tr><td style="padding:6px;border:1px solid #ddd;text-align:right;">${item.name}</td><td style="padding:6px;border:1px solid #ddd;text-align:center;">${item.qty}</td><td style="padding:6px;border:1px solid #ddd;text-align:center;">${item.price} ج.م</td><td style="padding:6px;border:1px solid #ddd;text-align:left;font-weight:bold;color:#E17055;">${item.total} ج.م</td></tr>`;
    });
    let printContent = `<div style="direction:rtl;font-family:Arial,sans-serif;padding:20px;max-width:600px;margin:auto;background:white;color:#333;border:2px solid #E17055;border-radius:10px;">
        <div style="text-align:center;border-bottom:2px solid #E17055;padding-bottom:15px;margin-bottom:20px;">
            <h2 style="margin:0;color:#E17055;">${profile.shopName}</h2>
            <p style="font-size:12px;color:#666;margin:2px 0;">${profile.branch || ''}</p>
            <p style="font-size:14px;font-weight:bold;color:#E17055;margin:5px 0;">📝 مرتجع شراء</p>
        </div>
        <div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:15px;">
            <div><strong>رقم المرتجع:</strong> ${invoice.id}<br><strong>التاريخ:</strong> ${invoice.date}</div>
            <div style="text-align:left;"><strong>المورد:</strong> ${invoice.supplier}<br><strong>نوع الدفع:</strong> ${invoice.type === 'cash' ? 'كاش' : 'آجل'}</div>
        </div>
        <table style="width:100%;border-collapse:collapse;font-size:13px;margin-bottom:15px;">
            <thead><tr style="background:#E17055;color:white;"><th style="padding:8px;text-align:right;border:1px solid #E17055;">المنتج</th><th style="padding:8px;text-align:center;border:1px solid #E17055;">الكمية</th><th style="padding:8px;text-align:center;border:1px solid #E17055;">السعر</th><th style="padding:8px;text-align:left;border:1px solid #E17055;">الإجمالي</th></tr></thead>
            <tbody>${itemsHtml}</tbody>
            <tfoot>
                <tr style="background:#f0f2f5;font-weight:bold;"><td colspan="3" style="padding:8px;border:1px solid #ddd;text-align:left;">إجمالي المرتجع</td><td style="padding:8px;border:1px solid #ddd;color:#E17055;font-size:16px;">${invoice.total} ج.م</td></tr>
                <tr><td colspan="3" style="padding:8px;border:1px solid #ddd;text-align:left;">المدفوع (مسترد)</td><td style="padding:8px;border:1px solid #ddd;color:#00B894;font-weight:bold;">${invoice.paid || 0} ج.م</td></tr>
                <tr style="font-weight:bold;"><td colspan="3" style="padding:8px;border:1px solid #ddd;text-align:left;">المتبقي</td><td style="padding:8px;border:1px solid #ddd;color:${(invoice.balance || 0) > 0 ? '#E17055' : '#00B894'};font-size:16px;">${invoice.balance || 0} ج.م</td></tr>
            </tfoot>
        </table>
        <div style="text-align:center;font-size:11px;color:#999;margin-top:15px;border-top:1px solid #ddd;padding-top:10px;">شكراً لتعاملكم معنا - ${profile.shopName}</div>
    </div>`;
    const win = window.open('', '_blank');
    if (win) {
        win.document.write(`<html><head><meta charset="UTF-8"><title>مرتجع ${invoice.id}</title><style>body{margin:0;padding:20px;background:#f5f5f5;display:flex;justify-content:center;align-items:center;min-height:100vh;}@media print{body{background:white;padding:0;}}</style></head><body>${printContent}</body></html>`);
        win.document.close();
        win.focus();
        setTimeout(() => { win.print(); }, 500);
    }
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
        document.getElementById('purchaseProductSearch').placeholder = '🔍 اكتب اسم المنتج';
        document.getElementById('purchaseInvoiceNumber').style.borderColor = '#E17055';
        document.querySelector('.modal-box').style.borderColor = '#eee';
        initPurchaseInvoice();
    } else {
        if (addFields) addFields.style.display = 'none';
        if (returnFields) returnFields.style.display = 'block';
        if (addBtn) addBtn.classList.remove('active');
        if (returnBtn) returnBtn.classList.add('active');
        document.getElementById('purchaseProductSearch').placeholder = '🔍 اكتب اسم المنتج للمرتجع';
        document.getElementById('purchaseInvoiceNumber').style.borderColor = '#E17055';
        document.querySelector('.modal-box').style.borderColor = '#E17055';
        initReturnPurchase();
    }
}

// ============================================================
// 12. المخازن
// ============================================================
function showWarehouseForm(type) {
    const form = document.getElementById('warehouseForm');
    const title = document.getElementById('warehouseFormTitle');
    if (!form) return;
    const titles = { 'add': '📥 إذن إضافة للمخزن', 'remove': '📤 إذن صرف من المخزن', 'inventory': '📋 جرد المخزن', 'opening': '📊 مخزون أول المدة' };
    title.textContent = titles[type] || 'إذن مخزن';
    form.style.display = 'block';
    form.dataset.type = type;
    const data = getData();
    const select = document.getElementById('whProduct');
    if (select) {
        select.innerHTML = '<option value="">اختر المنتج</option>';
        (data.products || []).forEach(p => { select.innerHTML += `<option value="${p.id}">${p.name} (${p.qty || 0})</option>`; });
    }
    document.getElementById('whQty').value = 1;
    document.getElementById('whReason').value = '';
}

function saveWarehouse() {
    const data = getData();
    const type = document.getElementById('warehouseForm').dataset.type;
    const productId = document.getElementById('whProduct').value;
    const qty = parseInt(document.getElementById('whQty').value) || 0;
    const reason = document.getElementById('whReason').value.trim() || 'بدون سبب';
    if (!productId || qty <= 0) return showToast('⚠️ اختر المنتج والكمية');
    const prod = data.products.find(p => p.id === productId);
    if (!prod) return showToast('⚠️ المنتج غير موجود');
    const typeNames = { 'add': 'إضافة', 'remove': 'صرف', 'inventory': 'جرد', 'opening': 'مخزون أول المدة' };
    if (!data.warehouse) data.warehouse = [];
    if (type === 'add' || type === 'opening') {
        prod.qty = (prod.qty || 0) + qty;
        data.warehouse.push({ id: 'WH-' + Date.now(), type, product: prod.name, qty: qty, reason, date: new Date().toLocaleDateString('ar-EG') });
        showToast(`✅ تم إضافة ${qty} من ${prod.name}`);
    } else if (type === 'remove') {
        if ((prod.qty || 0) < qty) return showToast('⚠️ الكمية غير متوفرة');
        prod.qty -= qty;
        data.warehouse.push({ id: 'WH-' + Date.now(), type, product: prod.name, qty: -qty, reason, date: new Date().toLocaleDateString('ar-EG') });
        showToast(`✅ تم صرف ${qty} من ${prod.name}`);
    } else if (type === 'inventory') {
        data.warehouse.push({ id: 'INV-' + Date.now(), type, product: prod.name, qty: prod.qty || 0, reason, date: new Date().toLocaleDateString('ar-EG') });
        showToast(`📋 تم جرد ${prod.name}: ${prod.qty || 0}`);
    }
    saveLocal();
    document.getElementById('warehouseForm').style.display = 'none';
    updateUI();
    updateWarehouseLog();
}

function updateWarehouseLog() {
    const data = getData();
    const warehouse = data.warehouse || [];
    const log = document.getElementById('warehouseLog');
    if (!log) return;
    const typeIcons = { 'add': '📥', 'remove': '📤', 'inventory': '📋', 'opening': '📊' };
    log.innerHTML = warehouse.slice().reverse().map(w => `
        <div class="list-item">
            <div><span>${typeIcons[w.type] || '📦'} ${w.product}</span><small style="color:#999;display:block;font-size:11px;">${w.reason || ''} | ${w.date || ''}</small></div>
            <div><span style="color:${(w.qty || 0) > 0 ? '#00B894' : '#E17055'};font-weight:bold;">${(w.qty || 0) > 0 ? '+' : ''}${w.qty || 0}</span></div>
        </div>
    `).join('') || '<div style="text-align:center;color:#999;padding:10px;">لا توجد حركات مخازن</div>';
}

function showWarehouseReport() {
    const data = getData();
    const warehouse = data.warehouse || [];
    const products = data.products || [];
    let report = '📊 تقرير المخازن\n\n📦 المنتجات الموجودة:\n';
    products.forEach(p => { report += `  - ${p.name}: ${p.qty || 0} وحدة (سعر البيع: ${p.sell || 0} ج.م)\n`; });
    report += '\n📋 آخر حركات المخازن:\n';
    warehouse.slice().reverse().slice(0, 10).forEach(w => {
        report += `  ${(w.qty || 0) > 0 ? '➕' : '➖'} ${w.product}: ${w.qty || 0} (${w.reason || ''}) - ${w.date || ''}\n`;
    });
    alert(report);
}

// ============================================================
// 13. المنتجات وجهات الاتصال والخزنة
// ============================================================
function addProduct() {
    const data = getData();
    const name = document.getElementById('prodName').value.trim();
    const desc = document.getElementById('prodDesc').value.trim();
    const qty = parseInt(document.getElementById('prodQty').value) || 0;
    const buy = parseFloat(document.getElementById('prodBuy').value) || 0;
    const sell = parseFloat(document.getElementById('prodSell').value) || 0;
    if (!name || qty <= 0) return showToast('⚠️ أدخل الاسم والكمية');
    const barcode = Math.floor(10000000 + Math.random() * 90000000).toString();
    data.products.push({ id: Date.now().toString(), name, desc, qty, buy, sell, barcode });
    saveLocal();
    document.getElementById('prodName').value = '';
    document.getElementById('prodDesc').value = '';
    document.getElementById('prodQty').value = '';
    document.getElementById('prodBuy').value = '';
    document.getElementById('prodSell').value = '';
    updateUI();
    showToast('✅ تم إضافة المنتج - الباركود: ' + barcode);
}

function addContact() {
    const data = getData();
    const name = document.getElementById('contactName').value.trim();
    const phone = document.getElementById('contactPhone').value.trim();
    const address = document.getElementById('contactAddress').value.trim();
    const type = document.getElementById('contactType').value;
    if (!name) return showToast('⚠️ أدخل الاسم');
    data.clients.push({ id: Date.now().toString(), name, phone, address, type });
    saveLocal();
    document.getElementById('contactName').value = '';
    document.getElementById('contactPhone').value = '';
    document.getElementById('contactAddress').value = '';
    updateUI();
    showToast('✅ تم إضافة جهة الاتصال');
}

function collectDebt() {
    const data = getData();
    const client = document.getElementById('collectClient').value.trim();
    const amount = parseFloat(document.getElementById('collectAmount').value);
    if (!client || !amount || amount <= 0) return showToast('⚠️ أدخل البيانات');
    data.treasury = (data.treasury || 0) + amount;
    data.collections.push({ id: Date.now().toString(), client, amount });
    data.treasuryLog.push({ desc: 'تحصيل من ' + client, amount: amount });
    saveLocal();
    document.getElementById('collectClient').value = '';
    document.getElementById('collectAmount').value = '';
    updateUI();
    showToast('✅ تم تحصيل ' + amount + ' ج.م');
}

function paySupplier() {
    const data = getData();
    const supplier = document.getElementById('paySupplier').value.trim();
    const amount = parseFloat(document.getElementById('payAmount').value);
    if (!supplier || !amount || amount <= 0) return showToast('⚠️ أدخل البيانات');
    if ((data.treasury || 0) < amount) return showToast('⚠️ الرصيد غير كافي');
    data.treasury = (data.treasury || 0) - amount;
    data.supplierPayments.push({ id: Date.now().toString(), supplier, amount });
    data.treasuryLog.push({ desc: 'سداد مورد - ' + supplier, amount: -amount });
    saveLocal();
    document.getElementById('paySupplier').value = '';
    document.getElementById('payAmount').value = '';
    updateUI();
    showToast('✅ تم سداد ' + amount + ' ج.م');
}

function addToTreasury() {
    const data = getData();
    const amount = parseFloat(document.getElementById('treasuryAmount').value);
    if (!amount || amount <= 0) return showToast('⚠️ أدخل مبلغ صحيح');
    data.treasury = (data.treasury || 0) + amount;
    data.treasuryLog.push({ desc: 'إيداع في الخزنة', amount: amount });
    saveLocal();
    document.getElementById('treasuryAmount').value = '';
    updateUI();
    showToast('✅ تم إيداع ' + amount + ' ج.م');
}

function withdrawTreasury() {
    const data = getData();
    const amount = parseFloat(document.getElementById('treasuryAmount').value);
    if (!amount || amount <= 0) return showToast('⚠️ أدخل مبلغ صحيح');
    if ((data.treasury || 0) < amount) return showToast('⚠️ الرصيد غير كافي');
    data.treasury = (data.treasury || 0) - amount;
    data.treasuryLog.push({ desc: 'سحب من الخزنة', amount: -amount });
    saveLocal();
    document.getElementById('treasuryAmount').value = '';
    updateUI();
    showToast('✅ تم سحب ' + amount + ' ج.م');
}

function addExpense() {
    const data = getData();
    const desc = document.getElementById('expenseDesc').value.trim();
    const amount = parseFloat(document.getElementById('expenseAmount').value);
    if (!desc || !amount || amount <= 0) return showToast('⚠️ أدخل البيانات');
    if ((data.treasury || 0) < amount) return showToast('⚠️ الرصيد غير كافي');
    data.treasury = (data.treasury || 0) - amount;
    data.expenses.push({ id: Date.now().toString(), desc, amount, date: new Date().toLocaleDateString() });
    data.treasuryLog.push({ desc: 'مصروف: ' + desc, amount: -amount });
    saveLocal();
    document.getElementById('expenseDesc').value = '';
    document.getElementById('expenseAmount').value = '';
    updateUI();
    showToast('✅ تم تسجيل مصروف ' + amount + ' ج.م');
}

// ============================================================
// 14. التقارير
// ============================================================
function drawCharts() {
    const data = getData();
    const sales = data.sales || [];
    const purchases = data.purchases || [];
    const expenses = data.expenses || [];
    const collections = data.collections || [];
    const salesTotal = sales.reduce((s, i) => s + (i.total || 0), 0);
    const purchasesTotal = purchases.reduce((s, i) => s + (i.total || 0), 0);
    const expensesTotal = expenses.reduce((s, i) => s + (i.amount || 0), 0);
    const collectionsTotal = collections.reduce((s, i) => s + (i.amount || 0), 0);
    const treasury = data.treasury || 0;
    if (chartInstances.sales) chartInstances.sales.destroy();
    chartInstances.sales = new Chart(document.getElementById('salesChart'), {
        type: 'bar',
        data: { labels: ['المبيعات', 'المشتريات', 'المصروفات', 'التحصيل'], datasets: [{ label: 'الحركة المالية (ج.م)', data: [salesTotal, purchasesTotal, expensesTotal, collectionsTotal], backgroundColor: ['#2E4057', '#E17055', '#FDCB6E', '#00B894'], borderColor: ['#1a2a3a', '#c0392b', '#f39c12', '#00a87a'], borderWidth: 2, borderRadius: 8 }] },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false }, tooltip: { callbacks: { label: function(context) { return context.parsed.y + ' ج.م'; } } } }, scales: { y: { beginAtZero: true, ticks: { callback: function(value) { return value + ' ج.م'; } } } } }
    });
    if (chartInstances.treasury) chartInstances.treasury.destroy();
    chartInstances.treasury = new Chart(document.getElementById('treasuryChart'), {
        type: 'doughnut',
        data: { labels: ['الخزنة', 'المصروفات', 'المشتريات'], datasets: [{ data: [treasury, expensesTotal, purchasesTotal], backgroundColor: ['#2E4057', '#E17055', '#FDCB6E'], borderWidth: 3, borderColor: '#fff' }] },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { padding: 15, usePointStyle: true, pointStyle: 'circle' } }, tooltip: { callbacks: { label: function(context) { const total = context.dataset.data.reduce((a, b) => a + b, 0); const percentage = total > 0 ? ((context.parsed / total) * 100).toFixed(1) : 0; return context.label + ': ' + context.parsed + ' ج.م (' + percentage + '%)'; } } } } }
    });
}

function updateReportSelects() {
    const data = getData();
    const clients = data.clients || [];
    const select = document.getElementById('statementClientSelect');
    if (select) {
        select.innerHTML = '<option value="">-- اختر --</option>';
        clients.forEach(c => { if (c && c.name) select.innerHTML += `<option value="${c.name}">${c.name}</option>`; });
    }
}

function showReport(type) {
    const data = getData();
    const sales = data.sales || [];
    const purchases = data.purchases || [];
    const expenses = data.expenses || [];
    const collections = data.collections || [];
    const supplierPayments = data.supplierPayments || [];
    const totalSales = sales.reduce((s, i) => s + (i.total || 0), 0);
    const totalPurchases = purchases.reduce((s, i) => s + (i.total || 0), 0);
    const totalExpenses = expenses.reduce((s, i) => s + (i.amount || 0), 0);
    const totalCollections = collections.reduce((s, i) => s + (i.amount || 0), 0);
    const totalSupplierPayments = supplierPayments.reduce((s, i) => s + (i.amount || 0), 0);
    const profit = totalSales - totalPurchases - totalExpenses;
    const today = new Date().toLocaleDateString('ar-EG');
    let html = '';
    if (type === 'income') {
        html = `<div style="background:#1e1e2e;border-radius:12px;padding:15px;color:white;font-family:Arial;">
            <div style="text-align:center;border-bottom:2px solid #00B894;padding-bottom:10px;margin-bottom:15px;"><h3 style="margin:0;color:#00B894;">📈 قائمة الدخل</h3><small style="color:#888;">${today}</small></div>
            <div style="display:flex;justify-content:space-between;padding:10px 0;border-bottom:1px solid #333;"><span>الإيرادات (المبيعات)</span><span style="color:#00B894;font-weight:bold;">${totalSales} ج.م</span></div>
            <div style="display:flex;justify-content:space-between;padding:10px 0;border-bottom:1px solid #333;"><span>تكلفة المشتريات</span><span style="color:#E17055;font-weight:bold;">${totalPurchases} ج.م</span></div>
            <div style="display:flex;justify-content:space-between;padding:10px 0;border-bottom:1px solid #333;"><span>المصروفات التشغيلية</span><span style="color:#E17055;font-weight:bold;">${totalExpenses} ج.م</span></div>
            <div style="display:flex;justify-content:space-between;padding:10px 0;border-bottom:1px solid #333;"><span>التحصيل من العملاء</span><span style="color:#00B894;font-weight:bold;">${totalCollections} ج.م</span></div>
            <div style="display:flex;justify-content:space-between;padding:10px 0;border-bottom:1px solid #333;"><span>سداد الموردين</span><span style="color:#E17055;font-weight:bold;">${totalSupplierPayments} ج.م</span></div>
            <div style="display:flex;justify-content:space-between;padding:15px 0;margin-top:10px;border-top:3px solid #00B894;font-size:18px;"><span style="font-weight:bold;">صافي الربح</span><span style="color:${profit >= 0 ? '#00B894' : '#E17055'};font-weight:bold;">${profit} ج.م</span></div>
        </div>`;
    } else if (type === 'daily') {
        const todaySales = sales.filter(s => s.date === today).reduce((s, i) => s + (i.total || 0), 0);
        const todayPurchases = purchases.filter(p => p.date === today).reduce((s, i) => s + (i.total || 0), 0);
        const todayExpenses = expenses.filter(e => e.date === today).reduce((s, i) => s + (i.amount || 0), 0);
        const todayCollections = collections.filter(c => c.date === today).reduce((s, i) => s + (i.amount || 0), 0);
        const todayProfit = todaySales - todayPurchases - todayExpenses;
        html = `<div style="background:#1e1e2e;border-radius:12px;padding:15px;color:white;font-family:Arial;">
            <div style="text-align:center;border-bottom:2px solid #FDCB6E;padding-bottom:10px;margin-bottom:15px;"><h3 style="margin:0;color:#FDCB6E;">📅 تقرير اليوم</h3><small style="color:#888;">${today}</small></div>
            <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #333;"><span>🛒 مبيعات اليوم</span><span style="color:#00B894;font-weight:bold;">${todaySales} ج.م</span></div>
            <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #333;"><span>🚚 مشتريات اليوم</span><span style="color:#E17055;font-weight:bold;">${todayPurchases} ج.م</span></div>
            <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #333;"><span>💸 مصروفات اليوم</span><span style="color:#E17055;font-weight:bold;">${todayExpenses} ج.م</span></div>
            <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #333;"><span>💰 تحصيل اليوم</span><span style="color:#00B894;font-weight:bold;">${todayCollections} ج.م</span></div>
            <div style="display:flex;justify-content:space-between;padding:15px 0;margin-top:10px;border-top:3px solid #FDCB6E;font-size:18px;"><span style="font-weight:bold;">صافي ربح اليوم</span><span style="color:${todayProfit >= 0 ? '#00B894' : '#E17055'};font-weight:bold;">${todayProfit} ج.م</span></div>
        </div>`;
    } else if (type === 'trial') {
        const totalAssets = data.treasury || 0;
        const totalLiabilities = sales.filter(s => s.type === 'credit').reduce((s, i) => s + (i.total || 0), 0);
        const equity = totalAssets - totalLiabilities;
        html = `<div style="background:#1e1e2e;border-radius:12px;padding:15px;color:white;font-family:Arial;">
            <div style="text-align:center;border-bottom:2px solid #6C5CE7;padding-bottom:10px;margin-bottom:15px;"><h3 style="margin:0;color:#6C5CE7;">📋 ميزان المراجعة</h3><small style="color:#888;">${today}</small></div>
            <div style="display:flex;justify-content:space-between;padding:10px 0;border-bottom:1px solid #333;"><span>🏦 الأصول (الخزنة)</span><span style="color:#00B894;font-weight:bold;">${totalAssets} ج.م</span></div>
            <div style="display:flex;justify-content:space-between;padding:10px 0;border-bottom:1px solid #333;"><span>📋 الخصوم (الآجل)</span><span style="color:#E17055;font-weight:bold;">${totalLiabilities} ج.م</span></div>
            <div style="display:flex;justify-content:space-between;padding:15px 0;margin-top:10px;border-top:3px solid #6C5CE7;font-size:18px;"><span style="font-weight:bold;">حقوق الملكية</span><span style="color:${equity >= 0 ? '#00B894' : '#E17055'};font-weight:bold;">${equity} ج.م</span></div>
        </div>`;
    } else if (type === 'statement') {
        const clientName = document.getElementById('statementClientSelect').value;
        const statementField = document.getElementById('statementClientField');
        if (!clientName) {
            if (statementField) statementField.style.display = 'block';
            html = `<div style="color:#aaa;text-align:center;padding:40px;background:#1e1e2e;border-radius:12px;"><i class="fas fa-user" style="font-size:40px;display:block;margin-bottom:15px;"></i>اختر جهة الاتصال من القائمة أعلاه لعرض كشف الحساب</div>`;
        } else {
            if (statementField) statementField.style.display = 'block';
            const clientSales = sales.filter(s => s.client === clientName);
            const clientCollections = collections.filter(c => c.client === clientName);
            let balance = 0;
            let rows = '';
            clientSales.forEach(s => { balance += (s.total || 0); rows += `<div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid #333;font-size:13px;"><span style="color:#aaa;">${s.date || ''}</span><span>بيع - ${s.product || ''}</span><span style="color:#E17055;">${s.total || 0} ج.م</span><span>${balance} ج.م</span></div>`; });
            clientCollections.forEach(c => { balance -= (c.amount || 0); rows += `<div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid #333;font-size:13px;"><span style="color:#aaa;">${new Date(c.id).toLocaleDateString('ar-EG')}</span><span>تحصيل</span><span style="color:#00B894;">${c.amount || 0} ج.م</span><span>${balance} ج.م</span></div>`; });
            html = `<div style="background:#1e1e2e;border-radius:12px;padding:15px;color:white;font-family:Arial;">
                <div style="text-align:center;border-bottom:2px solid #00B894;padding-bottom:10px;margin-bottom:15px;"><h3 style="margin:0;color:#00B894;">📋 كشف حساب ${clientName}</h3><small style="color:#888;">${today}</small></div>
                <div style="display:grid;grid-template-columns:1fr 2fr 1.5fr 1.5fr;gap:5px;padding:10px 0;border-bottom:2px solid #00B894;font-weight:bold;font-size:13px;background:#2a2a3e;border-radius:8px 8px 0 0;padding:8px 10px;"><span>📅 التاريخ</span><span>📌 البيان</span><span>💰 المبلغ</span><span>⚖️ الرصيد</span></div>
                ${rows || '<div style="text-align:center;padding:20px;color:#aaa;">لا توجد معاملات</div>'}
                <div style="display:grid;grid-template-columns:2fr 1fr 1.5fr;gap:5px;padding:15px 0;margin-top:10px;border-top:3px solid #00B894;font-size:16px;font-weight:bold;background:#2a2a3e;border-radius:0 0 8px 8px;padding:10px;"><span></span><span style="color:#888;">الرصيد النهائي</span><span style="color:${balance > 0 ? '#E17055' : '#00B894'};font-size:18px;">${balance} ج.م</span></div>
                <button onclick="printStatement('${clientName}')" style="width:100%;padding:12px;margin-top:10px;background:#2E4057;color:white;border:none;border-radius:8px;font-size:14px;font-weight:bold;cursor:pointer;">🖨️ طباعة كشف الحساب</button>
            </div>`;
        }
    }
    document.getElementById('reportContent').innerHTML = html;
}

function printStatement(clientName) {
    const data = getData();
    const sales = data.sales || [];
    const collections = data.collections || [];
    const today = new Date().toLocaleDateString('ar-EG');
    const clientSales = sales.filter(s => s.client === clientName);
    const clientCollections = collections.filter(c => c.client === clientName);
    let allTransactions = [];
    clientSales.forEach(s => { allTransactions.push({ date: s.date || today, type: 'بيع', desc: `${s.product} (فاتورة: ${s.id})`, amount: s.total || 0 }); });
    clientCollections.forEach(c => { allTransactions.push({ date: new Date(c.id).toLocaleDateString('ar-EG'), type: 'تحصيل', desc: 'تحصيل نقدي', amount: -(c.amount || 0) }); });
    allTransactions.sort((a, b) => { const dateA = a.date.split('/').reverse().join('-'); const dateB = b.date.split('/').reverse().join('-'); return dateA.localeCompare(dateB); });
    let balance = 0;
    let rows = '';
    allTransactions.forEach(t => { balance += t.amount; rows += `<tr><td style="padding:8px;border:1px solid #ddd;">${t.date}</td><td style="padding:8px;border:1px solid #ddd;">${t.type}</td><td style="padding:8px;border:1px solid #ddd;">${t.desc}</td><td style="padding:8px;border:1px solid #ddd;color:${t.amount > 0 ? '#00B894' : '#E17055'};font-weight:bold;">${t.amount > 0 ? '+' : ''}${t.amount} ج.م</td><td style="padding:8px;border:1px solid #ddd;font-weight:bold;">${balance} ج.م</td></tr>`; });
    const profile = data.profile || { shopName: 'نظام راشد', branch: 'رئيسي' };
    let printContent = `<div style="direction:rtl;font-family:Arial,sans-serif;padding:20px;max-width:800px;margin:auto;background:white;color:#333;">
        <div style="text-align:center;border-bottom:2px solid #2E4057;padding-bottom:15px;margin-bottom:20px;"><h2 style="margin:0;color:#2E4057;">${profile.shopName}</h2><p style="font-size:14px;color:#666;margin:5px 0;">كشف حساب تفصيلي</p><p style="font-size:12px;color:#888;margin:0;">${clientName}</p><p style="font-size:12px;color:#888;margin:0;">التاريخ: ${today}</p></div>
        <table style="width:100%;border-collapse:collapse;font-size:13px;"><thead><tr style="background:#2E4057;color:white;"><th style="padding:10px;text-align:right;border:1px solid #2E4057;">التاريخ</th><th style="padding:10px;text-align:right;border:1px solid #2E4057;">البيان</th><th style="padding:10px;text-align:right;border:1px solid #2E4057;">الوصف</th><th style="padding:10px;text-align:right;border:1px solid #2E4057;">المبلغ</th><th style="padding:10px;text-align:right;border:1px solid #2E4057;">الرصيد</th></tr></thead><tbody>${rows || '<tr><td colspan="5" style="text-align:center;padding:20px;color:#999;">لا توجد معاملات</td></tr>'}</tbody>
        <tfoot><tr style="background:#f0f2f5;font-weight:bold;"><td colspan="3" style="padding:10px;border:1px solid #ddd;text-align:left;">الرصيد النهائي</td><td colspan="2" style="padding:10px;border:1px solid #ddd;color:${balance > 0 ? '#E17055' : '#00B894'};font-size:16px;">${balance} ج.م</td></tr></tfoot></table>
        <div style="text-align:center;font-size:11px;color:#999;margin-top:20px;border-top:1px solid #ddd;padding-top:10px;">شكراً لتعاملكم معنا - ${profile.shopName}</div>
    </div>`;
    const win = window.open('', '_blank');
    if (win) {
        win.document.write(`<html><head><meta charset="UTF-8"><title>كشف حساب ${clientName}</title><style>body{margin:0;padding:20px;background:#f5f5f5;}@media print{body{background:white;padding:0;}}</style></head><body>${printContent}</body></html>`);
        win.document.close();
        win.focus();
        setTimeout(() => { win.print(); }, 500);
    }
}

function printAllInvoices() {
    const data = getData();
    const sales = data.sales || [];
    if (sales.length === 0) return showToast('⚠️ لا توجد فواتير');
    sales.forEach(s => printSaleInvoice(s.id));
}

function showAIReport() {
    const data = getData();
    const sales = data.sales || [];
    const purchases = data.purchases || [];
    const expenses = data.expenses || [];
    const products = data.products || [];
    const clients = data.clients || [];
    const totalSales = sales.reduce((s, i) => s + (i.total || 0), 0);
    const totalPurchases = purchases.reduce((s, i) => s + (i.total || 0), 0);
    const totalExpenses = expenses.reduce((s, i) => s + (i.amount || 0), 0);
    const profit = totalSales - totalPurchases - totalExpenses;
    let report = '🤖 تحليل الذكاء الاصطناعي\n\n📊 إجمالي المبيعات: ' + totalSales + ' ج.م\n📉 إجمالي المشتريات: ' + totalPurchases + ' ج.م\n💸 إجمالي المصروفات: ' + totalExpenses + ' ج.م\n💰 صافي الربح: ' + profit + ' ج.م\n\n📦 عدد المنتجات: ' + products.length + '\n👤 عدد العملاء: ' + clients.length + '\n\n';
    if (profit > 0) { report += '✅ عملك يحقق أرباحاً. استمر في تطوير مبيعاتك.\n'; if (totalExpenses > (totalSales * 0.3)) { report += '⚠️ نصيحة: مصروفاتك تمثل ' + ((totalExpenses/totalSales)*100).toFixed(1) + '% من مبيعاتك. حاول تقليل المصروفات.\n'; } } else { report += '⚠️ عملك يحقق خسائر. راجع المصروفات واستراتيجية التسعير.\n'; }
    if (products.length === 0) report += '📦 تنبيه: لم تضف أي منتجات بعد. ابدأ بإضافة منتجات.\n';
    alert(report);
}

// ============================================================
// 15. تحديث الواجهة
// ============================================================
function updateUI() {
    if (!appData.currentUser) return;
    const data = getData();
    updateSelects();
    
    document.getElementById('clientList').innerHTML = (data.clients || []).map(c => `
        <div class="list-item"><div><strong>${c.name || ''}</strong><br><small>📞 ${c.phone || ''}</small></div><div><span style="background:#eee;padding:2px 8px;border-radius:4px;font-size:11px;">${c.type || ''}</span></div></div>
    `).join('') || '<div style="text-align:center;color:#999;padding:10px;">لا توجد جهات اتصال</div>';
    
    document.getElementById('productList').innerHTML = (data.products || []).map(p => `
        <div class="list-item"><div><strong>${p.name || ''}</strong><br><small>${p.desc || ''}</small></div><div><span style="font-weight:bold;">${p.sell || 0} ج.م (${p.qty || 0})</span></div></div>
    `).join('') || '<div style="text-align:center;color:#999;padding:10px;">لا توجد منتجات</div>';
    
    document.getElementById('treasuryDisplay').textContent = data.treasury || 0;
    
    let logHtml = '';
    logHtml += (data.treasuryLog || []).slice().reverse().map(t => `<div class="list-item"><span>${t.desc || ''}</span><span style="font-weight:bold;color:${(t.amount || 0) > 0 ? '#00B894' : '#E17055'};">${t.amount || 0} ج.م</span></div>`).join('');
    logHtml += (data.expenses || []).slice().reverse().map(e => `<div class="list-item" style="color:#E17055;"><span>💸 ${e.desc || ''}</span><span style="font-weight:bold;">-${e.amount || 0} ج.م</span></div>`).join('');
    logHtml += (data.collections || []).slice().reverse().map(c => `<div class="list-item" style="color:#00B894;"><span>💰 تحصيل من ${c.client || ''}</span><span style="font-weight:bold;">+${c.amount || 0} ج.م</span></div>`).join('');
    logHtml += (data.supplierPayments || []).slice().reverse().map(p => `<div class="list-item" style="color:#E17055;"><span>💸 سداد - ${p.supplier || ''}</span><span style="font-weight:bold;">-${p.amount || 0} ج.م</span></div>`).join('');
    document.getElementById('treasuryLog').innerHTML = logHtml || '<div style="text-align:center;color:#999;padding:10px;">لا توجد حركات</div>';
    
    document.getElementById('saleList').innerHTML = (data.sales || []).slice().reverse().map(s => `
        <div class="list-item" style="flex-wrap:wrap;gap:5px;${s.isReturn ? 'background:#fff5f5;border-right:3px solid #E17055;' : ''}">
            <div><strong>${s.id}</strong> ${s.isReturn ? '↩️' : ''} - ${s.client || ''}<small style="color:#999;display:block;font-size:11px;">${s.date || ''} | ${s.items ? s.items.length : 0} منتج</small></div>
            <div style="display:flex;align-items:center;gap:8px;"><span style="font-weight:bold;color:${s.isReturn ? '#E17055' : '#2E4057'};">${s.total || 0} ج.م</span><button onclick="${s.isReturn ? 'printReturnSaleInvoice' : 'printSaleInvoice'}('${s.id}')" style="background:${s.isReturn ? '#E17055' : '#2E4057'};color:white;border:none;border-radius:4px;padding:2px 10px;cursor:pointer;font-size:11px;"><i class="fas fa-print"></i></button></div>
        </div>
    `).join('') || '<div style="text-align:center;color:#999;padding:10px;">لا توجد فواتير</div>';
    
    document.getElementById('purchaseList').innerHTML = (data.purchases || []).slice().reverse().map(p => `
        <div class="list-item" style="flex-wrap:wrap;gap:5px;${p.isReturn ? 'background:#fff5f5;border-right:3px solid #E17055;' : ''}">
            <div><strong>${p.id}</strong> ${p.isReturn ? '↩️' : ''} - ${p.supplier || ''}<small style="color:#999;display:block;font-size:11px;">${p.date || ''} | ${p.items ? p.items.length : 0} منتج</small></div>
            <div style="display:flex;align-items:center;gap:8px;"><span style="font-weight:bold;color:${p.isReturn ? '#E17055' : '#E17055'};">${p.total || 0} ج.م</span><button onclick="${p.isReturn ? 'printReturnPurchaseInvoice' : 'printPurchaseInvoice'}('${p.id}')" style="background:#E17055;color:white;border:none;border-radius:4px;padding:2px 10px;cursor:pointer;font-size:11px;"><i class="fas fa-print"></i></button></div>
        </div>
    `).join('') || '<div style="text-align:center;color:#999;padding:10px;">لا توجد فواتير شراء</div>';
    
    updateWarehouseLog();
}

function updateSelects() {
    const data = getData();
    const products = data.products || [];
    document.querySelectorAll('#saleProduct, #purchaseProduct, #returnProduct, #returnPurchaseProduct, #whProduct').forEach(sel => {
        if (sel) {
            sel.innerHTML = '<option value="">اختر المنتج</option>';
            products.forEach(p => { if (p && p.id) sel.innerHTML += `<option value="${p.id}">${p.name || 'منتج'} (${p.qty || 0})</option>`; });
        }
    });
}

// ============================================================
// 16. الإعدادات
// ============================================================
function getSettings() {
    const data = getData();
    if (!data.settings) data.settings = { theme: 'default', fontSize: 'medium', soundAlerts: true, popupAlerts: true, alertSound: 'beep', printer: 'thermal', barcodeLibrary: 'barcode', barcodeSize: 100 };
    return data.settings;
}

function saveSettings(settings) {
    const data = getData();
    data.settings = settings;
    saveLocal();
}

function loadSettings() {
    const settings = getSettings();
    document.body.className = '';
    if (settings.theme && settings.theme !== 'default') document.body.classList.add('theme-' + settings.theme);
    const sizeMap = { small: '13px', medium: '16px', large: '19px', xlarge: '22px' };
    document.body.style.fontSize = sizeMap[settings.fontSize] || '16px';
    document.getElementById('soundAlerts').checked = settings.soundAlerts !== false;
    document.getElementById('popupAlerts').checked = settings.popupAlerts !== false;
    document.getElementById('alertSound').value = settings.alertSound || 'beep';
    document.getElementById('barcodeSize').value = settings.barcodeSize || 100;
    document.getElementById('barcodeSizeLabel').textContent = (settings.barcodeSize || 100) + '%';
}

function changeTheme(theme) {
    document.body.className = '';
    if (theme !== 'default') document.body.classList.add('theme-' + theme);
    const settings = getSettings();
    settings.theme = theme;
    saveSettings(settings);
    showToast('✅ تم تغيير السمة');
}

function changeFontSize(size) {
    const sizeMap = { small: '13px', medium: '16px', large: '19px', xlarge: '22px' };
    document.body.style.fontSize = sizeMap[size] || '16px';
    const settings = getSettings();
    settings.fontSize = size;
    saveSettings(settings);
    showToast('✅ تم تغيير حجم الخط');
}

function resetAppSettings() {
    if (!confirm('إعادة ضبط الإعدادات؟')) return;
    const data = getData();
    data.settings = { theme: 'default', fontSize: 'medium', soundAlerts: true, popupAlerts: true, alertSound: 'beep', printer: 'thermal', barcodeLibrary: 'barcode', barcodeSize: 100 };
    saveLocal();
    loadSettings();
    showToast('✅ تم إعادة الضبط');
}

function setBarcodeLibrary(type) {
    const settings = getSettings();
    settings.barcodeLibrary = type;
    saveSettings(settings);
    showToast('✅ تم تغيير نوع الباركود');
}

function updateBarcodeSizeLabel() {
    const size = document.getElementById('barcodeSize').value;
    document.getElementById('barcodeSizeLabel').textContent = size + '%';
    const settings = getSettings();
    settings.barcodeSize = parseInt(size);
    saveSettings(settings);
}

// ============================================================
// 17. لوحة التحكم
// ============================================================
function updateAdminPanel() {
    const users = Object.keys(appData.users || {});
    document.getElementById('adminTotalUsers').textContent = users.length;
    const now = new Date();
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
    let onlineCount = 0;
    users.forEach(uid => { const user = appData.users[uid]; if (user && user.lastLogin && new Date(user.lastLogin) > fiveMinutesAgo) onlineCount++; });
    document.getElementById('adminOnlineUsers').textContent = onlineCount;
    const today = new Date().toISOString().slice(0, 10);
    const todayVisits = (appData.activityLog || []).filter(log => log.action === 'دخول' && log.time && log.time.slice(0, 10) === today);
    document.getElementById('adminTodayVisits').textContent = todayVisits.length;
    let tableHtml = '';
    let counter = 0;
    users.forEach(uid => {
        const user = appData.users[uid];
        if (!user) return;
        counter++;
        const lastLogin = user.lastLogin ? new Date(user.lastLogin).toLocaleString() : 'لم يسجل بعد';
        const country = user.lastLocation?.country || 'غير معروف';
        const ip = user.lastLocation?.ip || 'غير معروف';
        const isOnline = user.lastLogin && new Date(user.lastLogin) > new Date(Date.now() - 5 * 60 * 1000);
        tableHtml += `<tr style="border-bottom:1px solid #eee;"><td style="padding:8px;">${counter}</td><td style="padding:8px;"><strong>${user.displayName || 'غير معروف'}</strong></td><td style="padding:8px;">${user.fullName || ''}</td><td style="padding:8px;">${user.phone || ''}</td><td style="padding:8px;font-size:12px;">${lastLogin}</td><td style="padding:8px;">${country}</td><td style="padding:8px;font-size:11px;color:#999;">${ip}</td><td style="padding:8px;"><span style="background:${isOnline ? '#00B894' : '#999'};color:white;padding:2px 10px;border-radius:12px;font-size:11px;">${isOnline ? '🟢 متصل' : '🔴 غير متصل'}</span></td></tr>`;
    });
    document.getElementById('adminUsersTable').innerHTML = tableHtml || '<tr><td colspan="8" style="text-align:center;padding:20px;color:#999;">لا يوجد مستخدمين</td></tr>';
    let logHtml = (appData.activityLog || []).slice().reverse().slice(0, 50).map(log => {
        const time = log.time ? new Date(log.time).toLocaleString() : '';
        const icon = log.action === 'دخول' ? '🟢' : log.action === 'خروج' ? '🔴' : '📝';
        return `<div class="list-item"><span>${icon} ${log.username || 'مستخدم'} - ${log.action || ''}</span><span style="font-size:11px;color:#999;">${time} ${log.country ? '| ' + log.country : ''} ${log.ip && log.ip !== 'غير معروف' ? '| IP: ' + log.ip : ''}</span></div>`;
    }).join('');
    document.getElementById('adminActivityLog').innerHTML = logHtml || '<div style="text-align:center;color:#999;padding:10px;">لا يوجد سجل نشاط</div>';
}

// ============================================================
// 18. لوحة الأدمن (5 ضغطات)
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
                const data = getData();
                if (data.profile) {
                    document.getElementById('adminShopName').value = data.profile.shopName || '';
                    document.getElementById('adminBranch').value = data.profile.branch || '';
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
    const newPass = document.getElementById('adminNewPassword').value.trim();
    if (!newPass || newPass.length < 4) return showToast('⚠️ 4 أحرف على الأقل');
    appData.adminPin = newPass;
    saveLocal();
    document.getElementById('adminNewPassword').value = '';
    showToast('✅ تم تغيير الرقم السري');
}

function exportData() {
    const data = getData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'backup_' + new Date().toISOString().slice(0,10) + '.json';
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
            const userData = getData();
            Object.assign(userData, data);
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
    const data = getData();
    data.sales = [];
    data.purchases = [];
    data.products = [];
    data.clients = [];
    data.treasury = 0;
    data.treasuryLog = [];
    data.expenses = [];
    data.collections = [];
    data.supplierPayments = [];
    data.warehouse = [];
    data.saleCounter = 0;
    data.purchaseCounter = 0;
    data.returnSaleCounter = 0;
    data.returnPurchaseCounter = 0;
    saveLocal();
    updateUI();
    showToast('🗑️ تم المسح');
    closeAdminPanel();
}

// ============================================================
// 19. الإشعارات
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
// 20. بدء التشغيل
// ============================================================
initFirebase();
loadLocal();

if (!appData.users) appData.users = {};
if (!appData.activityLog) appData.activityLog = [];

if (!autoLogin()) {
    document.getElementById('authContainer').style.display = 'flex';
    document.getElementById('appContainer').style.display = 'none';
}

console.log('✅ نظام راشد V31 - النسخة الكاملة مع المرتجعات');
