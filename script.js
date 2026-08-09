// ============================================
// 1. إعدادات Firebase (السحابة)
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

// هيكل البيانات الأساسي
let appData = {
    users: {},
    currentUser: null
};

// دوال التخزين المحلي
function loadLocal() {
    try {
        const raw = localStorage.getItem('RashedV21');
        if (raw) appData = JSON.parse(raw);
    } catch(e) {}
}
function saveLocal() {
    try {
        localStorage.setItem('RashedV21', JSON.stringify(appData));
        syncCloud(); // محاولة رفع البيانات للسحابة بعد الحفظ
    } catch(e) {}
}

// الحصول على بيانات المستخدم الحالي
function getData() {
    if(!appData.currentUser || !appData.users[appData.currentUser]) return { sales: [], purchases: [], products: [], clients: [], treasury: 0, treasuryLog: [] };
    return appData.users[appData.currentUser].data;
}

// ============================================
// 2. نظام الدخول وإنشاء الحساب
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
        data: { sales: [], purchases: [], products: [], clients: [], treasury: 0, treasuryLog: [] }
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
    loadFromCloud(); // تحميل البيانات من السحابة
    updateUI();
}

// ============================================
// 3. السحابة (المزامنة التلقائية)
// ============================================
function syncCloud() {
    if(!appData.currentUser || !appData.users[appData.currentUser]) return;
    try {
        const app = firebase.initializeApp(firebaseConfig, 'syncApp');
        const db = firebase.database();
        const uid = appData.currentUser;
        db.ref('users/' + uid).set(appData.users[uid].data);
    } catch(e) { /* تجاهل أخطاء الإنترنت */ }
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
                localStorage.setItem('RashedV21', JSON.stringify(appData));
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

// إغلاق المودال بالضغط خارجها
document.querySelectorAll('.modal-overlay').forEach(el => {
    el.addEventListener('click', function(e) {
        if(e.target === this) this.classList.remove('active');
    });
});

// ============================================
// 5. عرض البيانات وتحديث القوائم
// ============================================
function updateUI() {
    if(!appData.currentUser) return;
    const data = getData();

    // تحديث قوائم المنتجات المنسدلة
    document.querySelectorAll('#saleProduct, #purchaseProduct').forEach(sel => {
        sel.innerHTML = '<option value="">اختر المنتج</option>';
        data.products.forEach(p => sel.innerHTML += `<option value="${p.id}">${p.name}</option>`);
    });

    // عرض القوائم البسيطة
    document.getElementById('clientList').innerHTML = data.clients.map(c => `<div style="padding:4px 0;border-bottom:1px solid #eee;">${c.name}</div>`).join('');
    document.getElementById('productList').innerHTML = data.products.map(p => `<div style="padding:4px 0;border-bottom:1px solid #eee;">${p.name} (${p.qty})</div>`).join('');
    
    // تحديث الخزنة
    document.getElementById('treasuryDisplay').textContent = data.treasury;
    document.getElementById('treasuryLog').innerHTML = data.treasuryLog.slice().reverse().map(t => 
        `<div style="display:flex;justify-content:space-between;padding:3px 0;border-bottom:1px solid #eee;"><span>${t.desc}</span><span>${t.amount} ج.م</span></div>`
    ).join('');
}

// ============================================
// 6. إضافة البيانات (العمليات الأساسية)
// ============================================
function addContact() {
    const data = getData();
    const name = document.getElementById('contactName').value.trim();
    const type = document.getElementById('contactType').value;
    if(!name) return showToast('أدخل الاسم');
    data.clients.push({ id: Date.now().toString(), name, type });
    saveLocal();
    document.getElementById('contactName').value = '';
    updateUI();
    closeModal('clients');
    showToast('تم الإضافة');
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
    showToast('تم الإضافة');
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
    data.treasuryLog.push({ desc: `شراء من ${supplier}`, amount: total });
    
    saveLocal();
    updateUI();
    closeModal('purchases');
    showToast(`شراء بقيمة ${total} ج.م`);
}

// ============================================
// 7. الخزنة (إيداع وسحب يدوي)
// ============================================
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
    data.treasuryLog.push({ desc: 'سحب يدوي', amount: amt });
    saveLocal();
    updateUI();
    document.getElementById('treasuryAmount').value = '';
    showToast('تم السحب');
}

// ============================================
// 8. التقارير المالية
// ============================================
function showReport(type) {
    const data = getData();
    const totalSales = data.sales.reduce((s, i) => s + i.total, 0);
    const totalPurchases = data.purchases.reduce((s, i) => s + i.total, 0);
    const cashSales = data.sales.filter(s => s.type === 'cash').reduce((s, i) => s + i.total, 0);
    const profit = totalSales - totalPurchases;
    
    let html = '';
    if(type === 'income') {
        html = `<b>📊 قائمة الدخل</b><br><br>
        إجمالي المبيعات: <b>${totalSales} ج.م</b><br>
        إجمالي المشتريات: <b>${totalPurchases} ج.م</b><br>
        <hr><b style="color:${profit >= 0 ? '#00B894' : '#E17055'};">صافي الربح: ${profit} ج.م</b>`;
    } else if(type === 'balance') {
        const assets = data.treasury;
        const debts = totalSales - cashSales;
        html = `<b>⚖️ الميزانية العمومية</b><br><br>
        الأصول (الخزنة): <b>${assets} ج.م</b><br>
        الذمم (الآجل): <b>${debts} ج.م</b><br>
        <hr>حقوق الملكية: ${assets + debts} ج.م`;
    }
    document.getElementById('reportContent').innerHTML = html;
}

// ============================================
// 9. التوست (الإشعارات)
// ============================================
function showToast(msg) {
    const t = document.getElementById('toast');
    t.textContent = msg;
    t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), 3000);
}

// ============================================
// 10. بدء التشغيل
// ============================================
loadLocal();
if(appData.currentUser && appData.users[appData.currentUser]) {
    document.getElementById('authContainer').style.display = 'none';
    document.getElementById('appContainer').style.display = 'block';
    document.getElementById('userDisplay').textContent = appData.currentUser;
    updateUI();
}
console.log('✅ نظام راشد V21 (ملفات منفصلة) - يعمل بالسحابة');