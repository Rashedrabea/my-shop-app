// ============================================
// 1. البيانات الأساسية
// ============================================
let appData = {
    users: {
        admin: {
            password: "123456", // في الواقع يجب تشفيرها
            data: {
                clients: [], products: [], sales: [], purchases: [], treasuryLog: [], treasuryBalance: 0
            }
        }
    },
    currentUser: 'admin',
    saleCounter: 0
};

function loadData() {
    try { const raw = localStorage.getItem('RashedV20'); if (raw) appData = JSON.parse(raw); } catch(e) {}
}
function saveData() {
    try { localStorage.setItem('RashedV20', JSON.stringify(appData)); } catch(e) {}
}

// ============================================
// 2. نظام الدخول
// ============================================
function handleLogin() {
    const user = document.getElementById('loginUser').value.trim();
    const pass = document.getElementById('loginPass').value.trim();
    if(appData.users[user] && appData.users[user].password === pass) {
        appData.currentUser = user;
        document.getElementById('authContainer').style.display = 'none';
        document.getElementById('appContainer').style.display = 'block';
        document.getElementById('userDisplay').textContent = `مرحباً ${user}`;
        loadData();
        updateSelects();
        renderContactList();
        renderProductList();
        updateTreasuryUI();
    } else {
        alert('خطأ في اسم المستخدم أو كلمة المرور');
    }
}

// ============================================
// 3. التنقل والمودالات
// ============================================
function openModal(id) { document.getElementById('modal-' + id).classList.add('active'); }
function closeModal(id) { document.getElementById('modal-' + id).classList.remove('active'); }

// ============================================
// 4. البحث الذكي
// ============================================
function searchClients(val, type) {
    const data = appData.users[appData.currentUser].data;
    const resultsBox = type === 'sale' ? document.getElementById('saleResults') : document.getElementById('purchaseResults');
    const inputId = type === 'sale' ? 'saleClient' : 'purchaseSupplier';
    
    if(val.length === 0) { resultsBox.style.display = 'none'; return; }
    const filtered = data.clients.filter(c => c.name.includes(val));
    if(filtered.length > 0) {
        resultsBox.style.display = 'block';
        resultsBox.innerHTML = filtered.map(c => 
            `<li onclick="document.getElementById('${inputId}').value = '${c.name}'; document.getElementById('${type === 'sale' ? 'sale' : 'purchase'}Results').style.display = 'none';">${c.name}</li>`
        ).join('');
    } else { resultsBox.style.display = 'none'; }
}

// ============================================
// 5. إضافة البيانات
// ============================================
function addContact() {
    const data = appData.users[appData.currentUser].data;
    const name = document.getElementById('contactName').value.trim();
    const type = document.getElementById('contactType').value;
    if(!name) return showToast('أدخل الاسم');
    data.clients.push({ id: Date.now().toString(), name, type });
    saveData();
    document.getElementById('contactName').value = '';
    renderContactList();
    closeModal('clients');
    showToast('تم إضافة جهة الاتصال');
}

function renderContactList() {
    const data = appData.users[appData.currentUser].data;
    const list = document.getElementById('clientList');
    list.innerHTML = data.clients.map(c => `<div style="padding:5px 0;border-bottom:1px solid #eee;">${c.name} (${c.type})</div>`).join('');
}

function addProduct() {
    const data = appData.users[appData.currentUser].data;
    const name = document.getElementById('prodName').value.trim();
    const qty = parseFloat(document.getElementById('prodQty').value);
    const buy = parseFloat(document.getElementById('prodBuy').value);
    const sell = parseFloat(document.getElementById('prodSell').value);
    if(!name || !qty) return showToast('أدخل الاسم والكمية');
    data.products.push({ id: Date.now().toString(), name, qty, buy, sell });
    saveData();
    document.getElementById('prodName').value = '';
    document.getElementById('prodQty').value = '';
    updateSelects();
    renderProductList();
    closeModal('products');
    showToast('تم إضافة المنتج');
}

function renderProductList() {
    const data = appData.users[appData.currentUser].data;
    const list = document.getElementById('productList');
    list.innerHTML = data.products.map(p => `<div style="padding:5px 0;border-bottom:1px solid #eee;">${p.name} | كمية: ${p.qty} | بيع: ${p.sell} ج.م</div>`).join('');
}

function updateSelects() {
    const data = appData.users[appData.currentUser].data;
    document.querySelectorAll('#saleProduct, #purchaseProduct').forEach(sel => {
        sel.innerHTML = '<option value="">اختر المنتج</option>';
        data.products.forEach(p => sel.innerHTML += `<option value="${p.id}">${p.name} (${p.qty})</option>`);
    });
}

// ============================================
// 6. المبيعات والمشتريات (مع الخزنة)
// ============================================
function addSale() {
    const data = appData.users[appData.currentUser].data;
    const client = document.getElementById('saleClient').value.trim();
    const productId = document.getElementById('saleProduct').value;
    const qty = parseFloat(document.getElementById('saleQty').value);
    const price = parseFloat(document.getElementById('salePrice').value);
    const type = document.getElementById('saleType').value;
    if(!client || !productId) return showToast('أكمل البيانات');

    const prod = data.products.find(p => p.id === productId);
    if(!prod || prod.qty < qty) return showToast('الكمية غير متوفرة');
    prod.qty -= qty;
    const total = qty * price;
    appData.saleCounter++;
    const inv = `INV-${String(appData.saleCounter).padStart(4, '0')}`;

    // إضافة للخزنة (فقط لو كاش)
    if(type === 'cash') {
        data.treasuryBalance += total;
        data.treasuryLog.push({ type: 'بيع', amount: total, date: new Date().toLocaleString() });
    }

    data.sales.push({ id: inv, client, product: prod.name, qty, price, total, type, date: new Date().toLocaleString() });
    saveData();
    updateSelects();
    renderProductList();
    updateTreasuryUI();
    closeModal('sales');
    showToast(`الفاتورة ${inv} - ${total} ج.م`);
}

function addPurchase() {
    const data = appData.users[appData.currentUser].data;
    const supplier = document.getElementById('purchaseSupplier').value.trim();
    const productId = document.getElementById('purchaseProduct').value;
    const qty = parseFloat(document.getElementById('purchaseQty').value);
    const price = parseFloat(document.getElementById('purchasePrice').value);
    if(!supplier || !productId) return showToast('أكمل البيانات');

    const prod = data.products.find(p => p.id === productId);
    if(!prod) return showToast('المنتج غير موجود');
    prod.qty += qty;
    const total = qty * price;

    // خصم من الخزنة
    data.treasuryBalance -= total;
    data.treasuryLog.push({ type: 'شراء', amount: total, date: new Date().toLocaleString() });

    data.purchases.push({ id: Date.now().toString(), supplier, product: prod.name, qty, price, total, date: new Date().toLocaleString() });
    saveData();
    updateSelects();
    renderProductList();
    updateTreasuryUI();
    closeModal('purchases');
    showToast(`تم الشراء بقيمة ${total} ج.م`);
}

// ============================================
// 7. الخزنة
// ============================================
function updateTreasuryUI() {
    const data = appData.users[appData.currentUser].data;
    document.getElementById('treasuryDisplay').textContent = data.treasuryBalance.toFixed(0);
    const log = document.getElementById('treasuryLog');
    log.innerHTML = data.treasuryLog.slice().reverse().map(t => 
        `<div style="display:flex;justify-content:space-between;padding:4px 0;border-bottom:1px solid #eee;">
            <span>${t.type}</span><span style="font-weight:bold;color:${t.type === 'بيع' ? 'green' : 'red'};">${t.amount} ج.م</span>
        </div>`
    ).join('');
}

function addToTreasury() {
    const data = appData.users[appData.currentUser].data;
    const amount = parseFloat(document.getElementById('treasuryAmount').value);
    if(!amount || amount <= 0) return showToast('أدخل مبلغ صحيح');
    data.treasuryBalance += amount;
    data.treasuryLog.push({ type: 'إيداع يدوي', amount, date: new Date().toLocaleString() });
    saveData();
    updateTreasuryUI();
    document.getElementById('treasuryAmount').value = '';
    showToast(`تم إيداع ${amount} ج.م`);
}

function withdrawTreasury() {
    const data = appData.users[appData.currentUser].data;
    const amount = parseFloat(document.getElementById('treasuryAmount').value);
    if(!amount || amount <= 0) return showToast('أدخل مبلغ صحيح');
    if(data.treasuryBalance < amount) return showToast('الرصيد غير كافي');
    data.treasuryBalance -= amount;
    data.treasuryLog.push({ type: 'سحب يدوي', amount, date: new Date().toLocaleString() });
    saveData();
    updateTreasuryUI();
    document.getElementById('treasuryAmount').value = '';
    showToast(`تم سحب ${amount} ج.م`);
}

// ============================================
// 8. التقارير المحاسبية الكاملة
// ============================================
function showReport(type) {
    const data = appData.users[appData.currentUser].data;
    const totalSales = data.sales.reduce((s, i) => s + i.total, 0);
    const totalPurchases = data.purchases.reduce((s, i) => s + i.total, 0);
    const totalCash = data.sales.filter(s => s.type === 'cash').reduce((s, i) => s + i.total, 0);
    const totalCredit = data.sales.filter(s => s.type === 'credit').reduce((s, i) => s + i.total, 0);
    const treasury = data.treasuryBalance;
    const netIncome = totalSales - totalPurchases;

    let html = '';
    if(type === 'income') {
        html = `<b>📊 قائمة الدخل</b><br><br>
        إجمالي المبيعات: <b>${totalSales} ج.م</b><br>
        إجمالي المشتريات: <b>${totalPurchases} ج.م</b><br>
        <hr><b style="color:${netIncome >= 0 ? 'var(--secondary)' : 'var(--danger)'};">صافي الربح: ${netIncome} ج.م</b>`;
    } else if(type === 'balance') {
        html = `<b>⚖️ الميزانية العمومية</b><br><br>
        الأصول (الخزنة): <b>${treasury} ج.م</b><br>
        الديون (الآجل): <b>${totalCredit} ج.م</b><br>
        <hr>حقوق الملكية: ${treasury + totalCredit} ج.م`;
    } else if(type === 'trial') {
        html = `<b>📋 ميزان المراجعة</b><br><br>
        كاش: ${totalCash} ج.م<br>
        آجل: ${totalCredit} ج.م<br>
        مشتريات: ${totalPurchases} ج.م<br>
        <hr>الرصيد الختامي: ${treasury} ج.م`;
    } else if(type === 'client') {
        html = `<b>👤 كشف حساب العملاء</b><br><br>
        ${data.sales.map(s => `<div style="padding:4px 0;border-bottom:1px solid #eee;">${s.client} | ${s.date} | ${s.total} ج.م | ${s.type}</div>`).join('')}`;
    }
    document.getElementById('reportContent').innerHTML = html;
}

// ============================================
// 9. السحابة (Firebase)
// ============================================
const firebaseConfig = {
    apiKey: "AIzaSyCQVcCAkZpeL9F9KADI5PtVanwTwO3SH5Y",
    authDomain: "smart-task-manager-d2a71.firebaseapp.com",
    databaseURL: "https://smart-task-manager-d2a71-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "smart-task-manager-d2a71",
    storageBucket: "smart-task-manager-d2a71.firebasestorage.app",
    messagingSenderId: "669004983540",
    appId: "1:669004983540:web:d80e9181527782d41e82a1"
};

function connectCloud() {
    const uid = prompt("أدخل كلمة المرور السحابية:", "my_shop");
    if(uid) {
        const app = firebase.initializeApp(firebaseConfig, 'sync');
        const db = firebase.database();
        db.ref('users/' + uid).set(appData.users[appData.currentUser].data).then(() => {
            showToast('☁️ تمت المزامنة بنجاح');
        });
    }
}

// ============================================
// 10. التوست
// ============================================
function showToast(msg) {
    const t = document.getElementById('toast');
    if(!t) return;
    t.textContent = msg; t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), 3000);
}