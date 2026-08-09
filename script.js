/* ============================================
   نظام راشد V23.1 - تعديلات
   ============================================ */

// 1. إعدادات Firebase
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
    currentUser: null
};

// دوال التخزين المحلي
function loadLocal() {
    try { const raw = localStorage.getItem('RashedV23.1'); if (raw) appData = JSON.parse(raw); } catch(e) {}
}
function saveLocal() {
    try {
        localStorage.setItem('RashedV23.1', JSON.stringify(appData));
        syncCloud();
    } catch(e) {}
}

// الحصول على بيانات المستخدم الحالي
function getData() {
    if(!appData.currentUser || !appData.users[appData.currentUser]) {
        return { sales: [], purchases: [], products: [], clients: [], treasury: 0, treasuryLog: [], expenses: [], collections: [] };
    }
    return appData.users[appData.currentUser].data;
}

// ============================================
// 2. نظام الدخول
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
    
    appData.users[user] = {
        password: pass,
        data: { sales: [], purchases: [], products: [], clients: [], treasury: 0, treasuryLog: [], expenses: [], collections: [] }
    };
    appData.currentUser = user;
    saveLocal();
    enterApp();
    showToast('✅ تم إنشاء الحساب بنجاح');
}

function enterApp() {
    document.getElementById('authContainer').style.display = 'none';
    document.getElementById('appContainer').style.display = 'block';
    document.getElementById('userDisplay').textContent = appData.currentUser;
    loadFromCloud();
    updateUI();
}

// ============================================
// 3. السحابة
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
                localStorage.setItem('RashedV23.1', JSON.stringify(appData));
                updateUI();
                showToast('☁️ تم تحديث البيانات من السحابة');
            }
        });
    } catch(e) {}
}

// ============================================
// 4. التنقل والـ Modals
// ============================================
function openModal(id) { document.getElementById('modal-' + id).classList.add('active'); }
function closeModal(id) { document.getElementById('modal-' + id).classList.remove('active'); }

document.querySelectorAll('.modal-overlay').forEach(el => {
    el.addEventListener('click', function(e) {
        if(e.target === this) this.classList.remove('active');
    });
});

function switchSalesMode(mode) {
    if(mode === 'add') {
        document.getElementById('saleModeAdd').style.background = 'var(--primary)';
        document.getElementById('saleModeAdd').style.color = 'white';
        document.getElementById('saleModeReturn').style.background = '#eee';
        document.getElementById('saleModeReturn').style.color = '#333';
        document.getElementById('saleAddFields').style.display = 'block';
        document.getElementById('saleReturnFields').style.display = 'none';
    } else {
        document.getElementById('saleModeReturn').style.background = 'var(--primary)';
        document.getElementById('saleModeReturn').style.color = 'white';
        document.getElementById('saleModeAdd').style.background = '#eee';
        document.getElementById('saleModeAdd').style.color = '#333';
        document.getElementById('saleAddFields').style.display = 'none';
        document.getElementById('saleReturnFields').style.display = 'block';
        updateSelects('returnProduct');
    }
}

function switchPurchaseMode(mode) {
    if(mode === 'add') {
        document.getElementById('purchaseModeAdd').style.background = 'var(--primary)';
        document.getElementById('purchaseModeAdd').style.color = 'white';
        document.getElementById('purchaseModeReturn').style.background = '#eee';
        document.getElementById('purchaseModeReturn').style.color = '#333';
        document.getElementById('purchaseAddFields').style.display = 'block';
        document.getElementById('purchaseReturnFields').style.display = 'none';
    } else {
        document.getElementById('purchaseModeReturn').style.background = 'var(--primary)';
        document.getElementById('purchaseModeReturn').style.color = 'white';
        document.getElementById('purchaseModeAdd').style.background = '#eee';
        document.getElementById('purchaseModeAdd').style.color = '#333';
        document.getElementById('purchaseAddFields').style.display = 'none';
        document.getElementById('purchaseReturnFields').style.display = 'block';
        updateSelects('returnPurchaseProduct');
    }
}

// ============================================
// 5. عرض البيانات
// ============================================
function updateSelects(targetId = null) {
    if(!appData.currentUser) return;
    const data = getData();
    const selectors = ['saleProduct', 'purchaseProduct'];
    if(targetId) selectors.push(targetId);
    selectors.forEach(id => {
        const sel = document.getElementById(id);
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

    document.getElementById('clientList').innerHTML = data.clients.map(c => `
        <div class="list-item"><div><strong>${c.name}</strong><br><small style="color:#777;">📞 ${c.phone || 'N/A'} | 📍 ${c.address || 'N/A'}</small></div><div><span style="background:#eee;padding:2px 8px;border-radius:4px;font-size:11px;">${c.type}</span></div></div>
    `).join('');

    document.getElementById('productList').innerHTML = data.products.map(p => `
        <div class="list-item"><span>${p.name} <small style="color:#777;">(${p.qty} قطعة)</small></span><span style="font-weight:bold;">${p.sell} ج.م</span></div>
    `).join('');

    document.getElementById('treasuryDisplay').textContent = data.treasury;
    let logHtml = '';
    logHtml += data.treasuryLog.slice().reverse().map(t => `
        <div class="list-item"><span>${t.desc}</span><span style="font-weight:bold;color:${t.amount > 0 ? 'var(--secondary)' : 'var(--danger)'};">${t.amount} ج.م</span></div>
    `).join('');
    logHtml += data.expenses.slice().reverse().map(e => `
        <div class="list-item" style="color:var(--danger);"><span>💸 ${e.desc}</span><span style="font-weight:bold;">-${e.amount} ج.م</span></div>
    `).join('');
    logHtml += data.collections.slice().reverse().map(c => `
        <div class="list-item" style="color:var(--secondary);"><span>💰 تحصيل من ${c.client}</span><span style="font-weight:bold;">+${c.amount} ج.م</span></div>
    `).join('');
    document.getElementById('treasuryLog').innerHTML = logHtml || '<div style="text-align:center;color:#777;padding:10px;">لا توجد حركات مالية</div>';
}

// ============================================
// 6. العمليات التجارية
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
    closeModal('clients');
    showToast('تم إضافة جهة الاتصال');
}

function addProduct() {
    const data = getData();
    const name = document.getElementById('prodName').value.trim();
    const qty = parseInt(document.getElementById('prodQty').value) || 0;
    const buy = parseFloat(document.getElementById('prodBuy').value) || 0;
    const sell = parseFloat(document.getElementById('prodSell').value) || 0;
    if(!name || qty <= 0) return showToast('أدخل الاسم والكمية');
    data.products.push({ id: Date.now().toString(), name, qty, buy, sell });
    saveLocal();
    document.getElementById('prodName').value = '';
    document.getElementById('prodQty').value = '';
    updateUI();
    closeModal('products');
    showToast('تم إضافة المنتج');
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
    data.sales.push({ id: Date.now().toString(), client, product: prod.name, qty, price, total, type });
    if(type === 'cash') {
        data.treasury += total;
        data.treasuryLog.push({ desc: `بيع كاش - ${client}`, amount: total });
    }
    saveLocal();
    updateUI();
    closeModal('sales');
    showToast(`بيع بقيمة ${total} ج.م`);
}

// مرتجع المبيعات (تم إصلاح السعر ليكون سعر البيع)
function addSaleReturn() {
    const data = getData();
    const client = document.getElementById('returnClient').value.trim();
    const productId = document.getElementById('returnProduct').value;
    const qty = parseInt(document.getElementById('returnQty').value) || 0;
    const price = parseFloat(document.getElementById('returnPrice').value) || 0; // سعر البيع
    if(!client || !productId || qty <= 0) return showToast('أكمل البيانات');
    const prod = data.products.find(p => p.id === productId);
    if(!prod) return showToast('المنتج غير موجود');
    prod.qty += qty;
    const total = qty * price;
    data.treasury -= total;
    data.treasuryLog.push({ desc: `مرتجع بيع - ${client}`, amount: -total });
    saveLocal();
    updateUI();
    closeModal('sales');
    showToast(`تم استلام مرتجع بقيمة ${total} ج.م`);
}

function addPurchase() {
    const data = getData();
    const supplier = document.getElementById('purchaseSupplier').value.trim();
    const productId = document.getElementById('purchaseProduct').value;
    const qty = parseInt(document.getElementById('purchaseQty').value) || 0;
    const price = parseFloat(document.getElementById('purchasePrice').value) || 0;
    if(!supplier || !productId || qty <= 0) return showToast('أكمل البيانات');
    const prod = data.products.find(p => p.id === productId);
    if(!prod) return showToast('المنتج غير موجود');
    prod.qty += qty;
    const total = qty * price;
    data.purchases.push({ id: Date.now().toString(), supplier, product: prod.name, qty, price, total });
    data.treasury -= total;
    data.treasuryLog.push({ desc: `شراء من ${supplier}`, amount: -total });
    saveLocal();
    updateUI();
    closeModal('purchases');
    showToast(`شراء بقيمة ${total} ج.م`);
}

// مرتجع المشتريات (تم إصلاح السعر ليكون سعر الشراء)
function addPurchaseReturn() {
    const data = getData();
    const supplier = document.getElementById('returnSupplier').value.trim();
    const productId = document.getElementById('returnPurchaseProduct').value;
    const qty = parseInt(document.getElementById('returnPurchaseQty').value) || 0;
    const price = parseFloat(document.getElementById('returnPurchasePrice').value) || 0; // سعر الشراء
    if(!supplier || !productId || qty <= 0) return showToast('أكمل البيانات');
    const prod = data.products.find(p => p.id === productId);
    if(!prod) return showToast('المنتج غير موجود');
    if(prod.qty < qty) return showToast('الكمية المرتجعة أكبر من المتاحة');
    prod.qty -= qty;
    const total = qty * price;
    data.treasury += total;
    data.treasuryLog.push({ desc: `مرتجع شراء من ${supplier}`, amount: total });
    saveLocal();
    updateUI();
    closeModal('purchases');
    showToast(`تم إرجاع منتجات بقيمة ${total} ج.م`);
}

// الخزنة
function collectDebt() {
    const data = getData();
    const client = document.getElementById('collectClient').value.trim();
    const amount = parseFloat(document.getElementById('collectAmount').value);
    if(!client || !amount || amount <= 0) return showToast('أدخل اسم العميل والمبلغ');
    data.treasury += amount;
    data.collections.push({ id: Date.now().toString(), client, amount });
    data.treasuryLog.push({ desc: `تحصيل من ${client}`, amount: amount });
    saveLocal();
    document.getElementById('collectClient').value = '';
    document.getElementById('collectAmount').value = '';
    updateUI();
    showToast(`تم تحصيل ${amount} ج.م من ${client}`);
}

function addExpense() {
    const data = getData();
    const desc = document.getElementById('expenseDesc').value.trim();
    const amount = parseFloat(document.getElementById('expenseAmount').value);
    if(!desc || !amount || amount <= 0) return showToast('أدخل البيان والمبلغ');
    if(data.treasury < amount) return showToast('الرصيد غير كافي لدفع المصروف');
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
// 7. التقارير
// ============================================
function showReport(type) {
    const data = getData();
    const totalSales = data.sales.reduce((s, i) => s + i.total, 0);
    const totalPurchases = data.purchases.reduce((s, i) => s + i.total, 0);
    const totalExpenses = data.expenses.reduce((s, i) => s + i.amount, 0);
    const totalCollections = data.collections.reduce((s, i) => s + i.amount, 0);
    const profit = totalSales - totalPurchases - totalExpenses;
    
    let html = '';
    if(type === 'income') {
        html = `<b>📊 قائمة الدخل</b><br><br>
        إجمالي المبيعات: <b>${totalSales} ج.م</b><br>
        إجمالي المشتريات: <b>${totalPurchases} ج.م</b><br>
        إجمالي المصروفات: <b style="color:var(--danger);">${totalExpenses} ج.م</b><br>
        إجمالي التحصيل: <b style="color:var(--secondary);">${totalCollections} ج.م</b><br>
        <hr><b style="color:${profit >= 0 ? '#00B894' : '#E17055'};">صافي الربح: ${profit} ج.م</b>`;
    } else if(type === 'balance') {
        const assets = data.treasury;
        html = `<b>⚖️ الميزانية العمومية</b><br><br>
        الأصول (الخزنة): <b>${assets} ج.م</b><br>
        <hr>حقوق الملكية: ${assets} ج.م`;
    }
    document.getElementById('reportContent').innerHTML = html;
}

// ============================================
// 8. التوست
// ============================================
function showToast(msg) {
    const t = document.getElementById('toast');
    t.textContent = msg;
    t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), 3000);
}

// ============================================
// 9. بدء التشغيل
// ============================================
loadLocal();
if(appData.currentUser && appData.users[appData.currentUser]) {
    document.getElementById('authContainer').style.display = 'none';
    document.getElementById('appContainer').style.display = 'block';
    document.getElementById('userDisplay').textContent = appData.currentUser;
    updateUI();
}
console.log('✅ نظام راشد V23.1 - تم إصلاح الألوان والمرتجعات');