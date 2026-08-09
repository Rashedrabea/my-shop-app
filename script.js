/* ============================================
   نظام راشد V34 - النسخة الكاملة المتكاملة
   ============================================ */

const firebaseConfig = {
    apiKey: "AIzaSyCQVcCAkZpeL9F9KADI5PtVanwTwO3SH5Y",
    authDomain: "smart-task-manager-d2a71.firebaseapp.com",
    databaseURL: "https://smart-task-manager-d2a71-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "smart-task-manager-d2a71",
    storageBucket: "smart-task-manager-d2a71.firebasestorage.app",
    messagingSenderId: "669004983540",
    appId: "1:669004983540:web:d80e9181527782d41e82a1"
};

let appData = {
    users: {},
    currentUser: null,
    license: { isActive: false, key: '', trialStart: null },
    admin: { password: 'admin123', logins: 0, usersCount: 0 },
    company: { name: '', branch: 'رئيسي', address: '', phone: '', cr: '', tax: '' },
    employees: []
};

let chartInstances = {};
let logoClickCount = 0;

function loadLocal() {
    try {
        const raw = localStorage.getItem('RashedV34');
        if (raw) {
            const parsed = JSON.parse(raw);
            appData = parsed;
        }
    } catch(e) {}
}
function saveLocal() {
    try {
        localStorage.setItem('RashedV34', JSON.stringify(appData));
        syncCloud();
    } catch(e) {}
}

function getData() {
    if(!appData.currentUser || !appData.users[appData.currentUser]) {
        return { sales: [], purchases: [], products: [], clients: [], treasury: 0, treasuryLog: [], expenses: [], collections: [], supplierPayments: [], saleCounter: 0, purchaseCounter: 0 };
    }
    return appData.users[appData.currentUser].data;
}

// ============================================
// نظام الدخول
// ============================================
function toggleAuthMode() {
    document.getElementById('loginForm').style.display = document.getElementById('loginForm').style.display === 'none' ? 'block' : 'none';
    document.getElementById('registerForm').style.display = document.getElementById('registerForm').style.display === 'none' ? 'block' : 'none';
}

function handleLogin() {
    const user = document.getElementById('loginUser').value.trim();
    const pass = document.getElementById('loginPass').value.trim();
    if(!appData.users[user]) return showToast('❌ اسم المستخدم غير موجود');
    if(appData.users[user].password !== pass) return showToast('❌ كلمة المرور خطأ');
    appData.currentUser = user;
    appData.admin.logins++;
    saveLocal();
    enterApp();
}

function handleRegister() {
    const user = document.getElementById('regUser').value.trim();
    const pass = document.getElementById('regPass').value.trim();
    const confirm = document.getElementById('regPassConfirm').value.trim();
    if(!user || user.length < 3) return showToast('⚠️ الاسم 3 أحرف على الأقل');
    if(pass !== confirm) return showToast('⚠️ كلمة المرور غير متطابقة');
    if(appData.users[user]) return showToast('⚠️ الاسم موجود بالفعل');
    
    appData.users[user] = { password: pass, data: { sales: [], purchases: [], products: [], clients: [], treasury: 0, treasuryLog: [], expenses: [], collections: [], supplierPayments: [], saleCounter: 0, purchaseCounter: 0 } };
    appData.admin.usersCount++;
    appData.currentUser = user;
    saveLocal();
    enterApp();
    showToast('✅ تم إنشاء الحساب بنجاح');
}

function logout() {
    if(confirm('هل أنت متأكد من تسجيل الخروج؟')) {
        appData.currentUser = null;
        saveLocal();
        location.reload();
    }
}

function enterApp() {
    document.getElementById('authContainer').style.display = 'none';
    document.getElementById('appContainer').style.display = 'block';
    document.getElementById('userDisplay').textContent = appData.currentUser;
    loadFromCloud();
    checkTrialStatus();
    updateUI();
    switchPage('dashboard');
}

// ============================================
// السحابة
// ============================================
function syncCloud() {
    if(!appData.currentUser || !appData.users[appData.currentUser]) return;
    try {
        const app = firebase.initializeApp(firebaseConfig, 'syncApp');
        const db = firebase.database();
        const uid = appData.currentUser;
        db.ref('users/' + uid).set(appData.users[uid].data);
    } catch(e) {}
}

function loadFromCloud() {
    if(!appData.currentUser) return;
    try {
        const app = firebase.initializeApp(firebaseConfig, 'loadApp');
        const db = firebase.database();
        const uid = appData.currentUser;
        db.ref('users/' + uid).once('value').then(snapshot => {
            const data = snapshot.val();
            if(data) {
                appData.users[uid].data = data;
                localStorage.setItem('RashedV34', JSON.stringify(appData));
                updateUI();
                showToast('☁️ تم تحديث البيانات من السحابة');
            }
        });
    } catch(e) {}
}

// ============================================
// نظام التفعيل والتجربة
// ============================================
function checkTrialStatus() {
    const statusText = document.getElementById('licenseStatusText');
    const trialCounter = document.getElementById('trialCounter');
    const daysLeftSpan = document.getElementById('daysLeft');

    if(appData.license.isActive) {
        statusText.textContent = '✅ مفعل (نسخة كاملة)';
        statusText.style.color = 'var(--secondary)';
        trialCounter.style.display = 'none';
        return;
    }

    if(!appData.license.trialStart) {
        appData.license.trialStart = new Date().toISOString();
        saveLocal();
    }

    const startDate = new Date(appData.license.trialStart);
    const currentDate = new Date();
    const diffTime = Math.abs(currentDate - startDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const remainingDays = 5 - diffDays;

    if(remainingDays <= 0) {
        statusText.textContent = '⛔ انتهت الفترة التجريبية';
        statusText.style.color = 'var(--danger)';
        trialCounter.style.display = 'none';
        showToast('⚠️ انتهت الفترة التجريبية. يرجى تفعيل التطبيق.');
    } else {
        statusText.textContent = '🟡 نسخة تجريبية';
        statusText.style.color = 'var(--accent)';
        trialCounter.style.display = 'block';
        daysLeftSpan.textContent = remainingDays;
    }
}

function activateLicense() {
    const input = document.getElementById('licenseKeyInput').value.trim();
    const validKeys = ['RASHED-PRO-2026', 'PREMIUM-2026', 'V34-LICENSE'];
    if(validKeys.includes(input)) {
        appData.license.isActive = true;
        appData.license.key = input;
        saveLocal();
        checkTrialStatus();
        document.getElementById('licenseKeyInput').value = '';
        showToast('🎉 تم تفعيل التطبيق بنجاح!');
    } else {
        showToast('❌ كود التفعيل غير صحيح');
    }
}

// ============================================
// لوحة التحكم السرية
// ============================================
function handleLogoClick() {
    logoClickCount++;
    if(logoClickCount >= 5) {
        logoClickCount = 0;
        document.getElementById('adminPanel').classList.add('active');
        document.getElementById('totalUsers').textContent = Object.keys(appData.users).length;
        document.getElementById('totalLogins').textContent = appData.admin.logins;
    }
    setTimeout(() => { logoClickCount = 0; }, 3000);
}

function closeAdminPanel() {
    document.getElementById('adminPanel').classList.remove('active');
    document.getElementById('adminContent').style.display = 'none';
}

function unlockAdminPanel() {
    const pass = document.getElementById('adminPassword').value.trim();
    if(pass === appData.admin.password) {
        document.getElementById('adminContent').style.display = 'block';
        document.getElementById('adminPassword').value = '';
        showToast('✅ مرحباً بك في لوحة التحكم');
    } else {
        showToast('❌ كلمة مرور خاطئة');
    }
}

function changeAdminPassword() {
    const newPass = document.getElementById('newAdminPass').value.trim();
    if(newPass.length < 4) return showToast('⚠️ كلمة المرور 4 أحرف على الأقل');
    appData.admin.password = newPass;
    saveLocal();
    document.getElementById('newAdminPass').value = '';
    showToast('✅ تم تغيير كلمة مرور الأدمن');
}

// ============================================
// بيانات الشركة
// ============================================
function saveCompanyData() {
    appData.company.name = document.getElementById('compName').value.trim();
    appData.company.branch = document.getElementById('compBranch').value;
    appData.company.address = document.getElementById('compAddress').value.trim();
    appData.company.phone = document.getElementById('compPhone').value.trim();
    appData.company.cr = document.getElementById('compCR').value.trim();
    appData.company.tax = document.getElementById('compTax').value.trim();
    saveLocal();
    showToast('✅ تم حفظ بيانات الشركة');
}

// ============================================
// إضافة البيانات (العمليات الأساسية)
// ============================================
function addContact() {
    const data = getData();
    const name = document.getElementById('contactName').value.trim();
    const phone = document.getElementById('contactPhone').value.trim();
    const address = document.getElementById('contactAddress').value.trim();
    const type = document.getElementById('contactType').value;
    if(!name) return showToast('أدخل الاسم');
    data.clients.push({ id: Date.now().toString(), name, phone, address, type });
    saveLocal();
    document.getElementById('contactName').value = '';
    document.getElementById('contactPhone').value = '';
    document.getElementById('contactAddress').value = '';
    updateUI();
    showToast('تم إضافة جهة الاتصال');
}

function addProduct() {
    const data = getData();
    const name = document.getElementById('prodName').value.trim();
    const desc = document.getElementById('prodDesc').value.trim();
    const qty = parseInt(document.getElementById('prodQty').value) || 0;
    const buy = parseFloat(document.getElementById('prodBuy').value) || 0;
    const sell = parseFloat(document.getElementById('prodSell').value) || 0;
    if(!name || qty <= 0) return showToast('أدخل الاسم والكمية');
    const barcode = Math.floor(10000000 + Math.random() * 90000000).toString();
    data.products.push({ id: Date.now().toString(), name, desc, qty, buy, sell, barcode });
    saveLocal();
    document.getElementById('prodName').value = '';
    document.getElementById('prodDesc').value = '';
    document.getElementById('prodQty').value = '';
    updateUI();
    showToast(`تم إضافة المنتج. الباركود: ${barcode}`);
}

function searchByBarcode() {
    const input = document.getElementById('manualBarcode').value.trim();
    if(!input) return showToast('أدخل الباركود');
    const data = getData();
    const product = data.products.find(p => p.barcode === input);
    if(product) showToast(`✅ ${product.name}`);
    else showToast('⚠️ المنتج غير موجود');
}

function switchSalesMode(mode) {
    if(mode === 'add') {
        document.getElementById('saleModeAdd').className = 'btn-toggle active';
        document.getElementById('saleModeReturn').className = 'btn-toggle';
        document.getElementById('saleAddFields').style.display = 'block';
        document.getElementById('saleReturnFields').style.display = 'none';
    } else {
        document.getElementById('saleModeReturn').className = 'btn-toggle active';
        document.getElementById('saleModeAdd').className = 'btn-toggle';
        document.getElementById('saleAddFields').style.display = 'none';
        document.getElementById('saleReturnFields').style.display = 'block';
        updateSelects();
    }
}

function addSale() {
    const data = getData();
    const client = document.getElementById('saleClient').value.trim();
    const productId = document.getElementById('saleProduct').value;
    const qty = parseInt(document.getElementById('saleQty').value) || 0;
    const price = parseFloat(document.getElementById('salePrice').value) || 0;
    const type = document.getElementById('saleType').value;
    if(!client || !productId || qty <= 0) return showToast('أكمل البيانات');
    const prod = data.products.find(p => p.id === productId);
    if(!prod || prod.qty < qty) return showToast('الكمية غير متوفرة');
    prod.qty -= qty;
    const total = qty * price;
    data.saleCounter = (data.saleCounter || 0) + 1;
    const invNum = `INV-${String(data.saleCounter).padStart(4, '0')}`;
    data.sales.push({ id: invNum, client, product: prod.name, qty, price, total, type, date: new Date().toLocaleDateString() });
    if(type === 'cash') {
        data.treasury += total;
        data.treasuryLog.push({ desc: `بيع كاش - ${client} (${invNum})`, amount: total });
    }
    saveLocal();
    updateUI();
    showToast(`بيع بقيمة ${total} ج.م - الفاتورة: ${invNum}`);
}

function addSaleReturn() {
    const data = getData();
    const client = document.getElementById('returnClient').value.trim();
    const productId = document.getElementById('returnProduct').value;
    const qty = parseInt(document.getElementById('returnQty').value) || 0;
    const price = parseFloat(document.getElementById('returnPrice').value) || 0;
    const type = document.getElementById('returnSaleType').value || 'cash';
    if(!client || !productId || qty <= 0) return showToast('أكمل البيانات');
    const prod = data.products.find(p => p.id === productId);
    if(!prod) return showToast('المنتج غير موجود');
    prod.qty += qty;
    const total = qty * price;
    if(type === 'cash') {
        data.treasury -= total;
        data.treasuryLog.push({ desc: `مرتجع بيع - ${client}`, amount: -total });
    }
    saveLocal();
    updateUI();
    showToast(`تم استلام مرتجع بقيمة ${total} ج.م`);
}

function switchPurchaseMode(mode) {
    if(mode === 'add') {
        document.getElementById('purchaseModeAdd').className = 'btn-toggle active';
        document.getElementById('purchaseModeReturn').className = 'btn-toggle';
        document.getElementById('purchaseAddFields').style.display = 'block';
        document.getElementById('purchaseReturnFields').style.display = 'none';
    } else {
        document.getElementById('purchaseModeReturn').className = 'btn-toggle active';
        document.getElementById('purchaseModeAdd').className = 'btn-toggle';
        document.getElementById('purchaseAddFields').style.display = 'none';
        document.getElementById('purchaseReturnFields').style.display = 'block';
        updateSelects();
    }
}

function addPurchase() {
    const data = getData();
    const supplier = document.getElementById('purchaseSupplier').value.trim();
    const productId = document.getElementById('purchaseProduct').value;
    const qty = parseInt(document.getElementById('purchaseQty').value) || 0;
    const price = parseFloat(document.getElementById('purchasePrice').value) || 0;
    const type = document.getElementById('purchaseType').value;
    if(!supplier || !productId || qty <= 0) return showToast('أكمل البيانات');
    const prod = data.products.find(p => p.id === productId);
    if(!prod) return showToast('المنتج غير موجود');
    prod.qty += qty;
    const total = qty * price;
    data.purchaseCounter = (data.purchaseCounter || 0) + 1;
    const purNum = `PUR-${String(data.purchaseCounter).padStart(4, '0')}`;
    data.purchases.push({ id: purNum, supplier, product: prod.name, qty, price, total, type, date: new Date().toLocaleDateString() });
    data.treasury -= total;
    data.treasuryLog.push({ desc: `شراء من ${supplier} (${purNum})`, amount: -total });
    saveLocal();
    updateUI();
    showToast(`شراء بقيمة ${total} ج.م - الفاتورة: ${purNum}`);
}

function addPurchaseReturn() {
    const data = getData();
    const supplier = document.getElementById('returnSupplier').value.trim();
    const productId = document.getElementById('returnPurchaseProduct').value;
    const qty = parseInt(document.getElementById('returnPurchaseQty').value) || 0;
    const price = parseFloat(document.getElementById('returnPurchasePrice').value) || 0;
    const type = document.getElementById('returnPurchaseType').value || 'cash';
    if(!supplier || !productId || qty <= 0) return showToast('أكمل البيانات');
    const prod = data.products.find(p => p.id === productId);
    if(!prod) return showToast('المنتج غير موجود');
    if(prod.qty < qty) return showToast('الكمية المرتجعة أكبر من المتاحة');
    prod.qty -= qty;
    const total = qty * price;
    if(type === 'cash') {
        data.treasury += total;
        data.treasuryLog.push({ desc: `مرتجع شراء من ${supplier}`, amount: total });
    }
    saveLocal();
    updateUI();
    showToast(`تم إرجاع منتجات بقيمة ${total} ج.م`);
}

// ============================================
// الخزنة والسداد
// ============================================
function collectDebt() {
    const data = getData();
    const client = document.getElementById('collectClient').value.trim();
    const amount = parseFloat(document.getElementById('collectAmount').value);
    if(!client || !amount || amount <= 0) return showToast('أدخل اسم العميل والمبلغ');
    const clientExists = data.clients.find(c => c.name === client);
    if(!clientExists) return showToast('العميل غير موجود');
    data.treasury += amount;
    data.collections.push({ id: Date.now().toString(), client, amount });
    data.treasuryLog.push({ desc: `تحصيل من ${client}`, amount: amount });
    saveLocal();
    document.getElementById('collectClient').value = '';
    document.getElementById('collectAmount').value = '';
    updateUI();
    showToast(`تم تحصيل ${amount} ج.م من ${client}`);
}

function paySupplier() {
    const data = getData();
    const supplier = document.getElementById('paySupplier').value.trim();
    const amount = parseFloat(document.getElementById('payAmount').value);
    if(!supplier || !amount || amount <= 0) return showToast('أدخل اسم المورد والمبلغ');
    const supplierExists = data.clients.find(c => c.name === supplier);
    if(!supplierExists) return showToast('المورد غير موجود');
    if(data.treasury < amount) return showToast('الرصيد غير كافي للسداد');
    data.treasury -= amount;
    data.supplierPayments.push({ id: Date.now().toString(), supplier, amount });
    data.treasuryLog.push({ desc: `سداد مورد - ${supplier}`, amount: -amount });
    saveLocal();
    document.getElementById('paySupplier').value = '';
    document.getElementById('payAmount').value = '';
    updateUI();
    showToast(`تم سداد ${amount} ج.م للمورد ${supplier}`);
}

function addExpense() {
    const data = getData();
    const desc = document.getElementById('expenseDesc').value.trim();
    const amount = parseFloat(document.getElementById('expenseAmount').value);
    if(!desc || !amount || amount <= 0) return showToast('أدخل البيان والمبلغ');
    if(data.treasury < amount) return showToast('الرصيد غير كافي');
    data.treasury -= amount;
    data.expenses.push({ id: Date.now().toString(), desc, amount });
    saveLocal();
    document.getElementById('expenseDesc').value = '';
    document.getElementById('expenseAmount').value = '';
    updateUI();
    showToast('تم تسجيل المصروف');
}

function addToTreasury() {
    const data = getData();
    const amt = parseFloat(document.getElementById('treasuryAmount').value);
    if(!amt || amt <= 0) return showToast('أدخل مبلغ');
    data.treasury += amt;
    data.treasuryLog.push({ desc: 'إيداع يدوي', amount: amt });
    saveLocal();
    updateUI();
    document.getElementById('treasuryAmount').value = '';
    showToast('تم الإيداع');
}

function withdrawTreasury() {
    const data = getData();
    const amt = parseFloat(document.getElementById('treasuryAmount').value);
    if(!amt || amt <= 0) return showToast('أدخل مبلغ');
    if(data.treasury < amt) return showToast('الرصيد غير كافي');
    data.treasury -= amt;
    data.treasuryLog.push({ desc: 'سحب يدوي', amount: -amt });
    saveLocal();
    updateUI();
    document.getElementById('treasuryAmount').value = '';
    showToast('تم السحب');
}

// ============================================
// عرض البيانات
// ============================================
function updateSelects() {
    if(!appData.currentUser) return;
    const data = getData();
    document.querySelectorAll('#saleProduct, #purchaseProduct, #returnProduct, #returnPurchaseProduct').forEach(sel => {
        if(sel) {
            sel.innerHTML = '<option value="">اختر المنتج</option>';
            data.products.forEach(p => sel.innerHTML += `<option value="${p.id}">${p.name} (${p.qty})</option>`);
        }
    });
}

function updateUI() {
    if(!appData.currentUser) return;
    const data = getData();
    updateSelects();

    // تحديث قوائم جهات الاتصال والمخزون
    document.getElementById('clientList').innerHTML = data.clients.map(c => `
        <div class="list-item"><span><strong>${c.name}</strong> - ${c.type}</span></div>
    `).join('');

    document.getElementById('productList').innerHTML = data.products.map(p => `
        <div class="list-item"><span><strong>${p.name}</strong> (${p.qty}) - ${p.sell} ج.م</span></div>
    `).join('');

    // تحديث سجل الخزنة
    document.getElementById('treasuryLog').innerHTML = data.treasuryLog.slice().reverse().map(t => `
        <div class="list-item"><span>${t.desc}</span><span>${t.amount} ج.م</span></div>
    `).join('') || '<div style="text-align:center;color:#777;padding:10px;">لا توجد حركات</div>';

    // تحديث قائمة المبيعات
    document.getElementById('saleList').innerHTML = data.sales.slice().reverse().map(s => `
        <div class="list-item">
            <span>${s.client} - ${s.product}</span>
            <div>
                <span style="font-weight:bold;">${s.total} ج.م</span>
                <button onclick="printSaleInvoice('${s.id}')" style="background:none;border:none;color:var(--primary);cursor:pointer;"><i class="fas fa-print"></i></button>
            </div>
        </div>
    `).join('');

    // تحديث قائمة المشتريات
    document.getElementById('purchaseList').innerHTML = data.purchases.slice().reverse().map(p => `
        <div class="list-item">
            <span>${p.supplier} - ${p.product}</span>
            <div>
                <span style="font-weight:bold;">${p.total} ج.م</span>
                <button onclick="printPurchaseInvoice('${p.id}')" style="background:none;border:none;color:var(--danger);cursor:pointer;"><i class="fas fa-print"></i></button>
            </div>
        </div>
    `).join('');

    // تحديث بيانات الشركة في الإعدادات
    document.getElementById('compName').value = appData.company.name || '';
    document.getElementById('compBranch').value = appData.company.branch || 'رئيسي';
    document.getElementById('compAddress').value = appData.company.address || '';
    document.getElementById('compPhone').value = appData.company.phone || '';
    document.getElementById('compCR').value = appData.company.cr || '';
    document.getElementById('compTax').value = appData.company.tax || '';
    
    // تحديث الخزنة
    document.getElementById('treasuryDisplay').textContent = data.treasury;
}

function switchPage(page) {
    document.querySelectorAll('.page').forEach(el => el.classList.remove('active'));
    const target = document.getElementById('page-' + page);
    if(target) target.classList.add('active');
    document.querySelectorAll('.bottom-nav button').forEach(btn => btn.style.color = '#777');
    const activeBtn = document.querySelector(`.bottom-nav button[onclick*="switchPage('${page}')"]`);
    if(activeBtn) activeBtn.style.color = 'var(--primary)';
    document.querySelectorAll('.sidebar .nav-btn').forEach(btn => btn.style.background = 'rgba(255,255,255,0.05)');
    const activeSideBtn = document.querySelector(`.sidebar .nav-btn[onclick*="switchPage('${page}')"]`);
    if(activeSideBtn) activeSideBtn.style.background = 'rgba(255,255,255,0.2)';
    if(page === 'dashboard') drawCharts();
}

// ============================================
// الرسوم البيانية
// ============================================
function drawCharts() {
    const data = getData();
    const salesTotal = data.sales.reduce((s, i) => s + i.total, 0);
    const expensesTotal = data.expenses.reduce((s, i) => s + i.amount, 0);
    const treasury = data.treasury;

    if(window.salesChart) window.salesChart.destroy();
    window.salesChart = new Chart(document.getElementById('salesChart'), {
        type: 'bar',
        data: { labels: ['مبيعات', 'مصروفات'], datasets: [{ label: 'الحركة المالية', data: [salesTotal, expensesTotal], backgroundColor: ['#00B894', '#E17055'] }] }
    });

    if(window.treasuryChart) window.treasuryChart.destroy();
    window.treasuryChart = new Chart(document.getElementById('treasuryChart'), {
        type: 'doughnut',
        data: { labels: ['الخزنة', 'مصروفات'], datasets: [{ data: [treasury, expensesTotal], backgroundColor: ['#2E4057', '#E17055'] }] }
    });
}

// ============================================
// الطباعة
// ============================================
function generateInvoiceHTML(item, type) {
    const profile = appData.users[appData.currentUser].profile || { shopName: 'نظام راشد' };
    const title = type === 'sale' ? 'فاتورة بيع' : 'فاتورة شراء';
    const party = type === 'sale' ? item.client : item.supplier;
    return `
        <div class="print-area" style="direction:rtl;font-family:Arial,sans-serif;padding:20px;max-width:600px;margin:auto;border:1px solid #ddd;border-radius:10px;background:white;">
            <div style="text-align:center;border-bottom:2px solid #2E4057;padding-bottom:15px;margin-bottom:15px;">
                <h2 style="margin:0;">${profile.shopName}</h2>
                <p style="font-size:12px;color:#777;">${title}</p>
            </div>
            <div style="display:flex;justify-content:space-between;font-size:14px;margin-bottom:10px;">
                <span>${type === 'sale' ? 'العميل' : 'المورد'}: ${party}</span>
                <span>رقم الفاتورة: ${item.id}</span>
            </div>
            <table style="width:100%;border-collapse:collapse;font-size:14px;">
                <tr style="background:#2E4057;color:white;"><th style="padding:8px;text-align:right;">المنتج</th><th style="padding:8px;text-align:right;">الكمية</th><th style="padding:8px;text-align:right;">السعر</th><th style="padding:8px;text-align:right;">الإجمالي</th></tr>
                <tr><td style="padding:8px;border-bottom:1px solid #ddd;">${item.product}</td><td style="padding:8px;border-bottom:1px solid #ddd;">${item.qty}</td><td style="padding:8px;border-bottom:1px solid #ddd;">${item.price}</td><td style="padding:8px;border-bottom:1px solid #ddd;font-weight:bold;">${item.total} ج.م</td></tr>
            </table>
            <div style="text-align:left;font-size:18px;font-weight:bold;border-top:2px solid #2E4057;padding-top:10px;margin-top:10px;">الإجمالي: ${item.total} ج.م</div>
            <div style="text-align:center;font-size:11px;color:#777;margin-top:20px;">شكراً لتعاملكم معنا</div>
        </div>
    `;
}

function printSaleInvoice(id) {
    const data = getData();
    const sale = data.sales.find(s => s.id === id);
    if(!sale) return showToast('الفاتورة غير موجودة');
    const win = window.open('', '_blank');
    win.document.write(`<html><head><meta charset="UTF-8"><title>فاتورة ${sale.id}</title><style>body{background:white;padding:20px;}</style></head><body>`);
    win.document.write(generateInvoiceHTML(sale, 'sale'));
    win.document.write(`</body></html>`);
    win.document.close();
    win.focus();
    win.print();
}

function printPurchaseInvoice(id) {
    const data = getData();
    const purchase = data.purchases.find(p => p.id === id);
    if(!purchase) return showToast('الفاتورة غير موجودة');
    const win = window.open('', '_blank');
    win.document.write(`<html><head><meta charset="UTF-8"><title>فاتورة ${purchase.id}</title><style>body{background:white;padding:20px;}</style></head><body>`);
    win.document.write(generateInvoiceHTML(purchase, 'purchase'));
    win.document.write(`</body></html>`);
    win.document.close();
    win.focus();
    win.print();
}

// ============================================
// التوست
// ============================================
function showToast(msg) {
    const t = document.getElementById('toast');
    t.textContent = msg;
    t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), 3000);
}

// ============================================
// بدء التشغيل
// ============================================
loadLocal();
if(appData.currentUser && appData.users[appData.currentUser]) {
    document.getElementById('authContainer').style.display = 'none';
    document.getElementById('appContainer').style.display = 'block';
    document.getElementById('userDisplay').textContent = appData.currentUser;
    checkTrialStatus();
    updateUI();
    switchPage('dashboard');
}
console.log('✅ نظام راشد V34 - النسخة الكاملة والمستقرة');
