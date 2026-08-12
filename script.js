const firebaseConfig = {
    apiKey: "AIzaSyDZlzKX7urPYIiLI8dKjUmmMarS17sKseo",
    authDomain: "accounting-system-4695d.firebaseapp.com",
    databaseURL: "https://accounting-system-4695d-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "accounting-system-4695d",
    storageBucket: "accounting-system-4695d.firebasestorage.app",
    messagingSenderId: "577360785300",
    appId: "1:577360785300:web:c277d41bd114ebcefea981",
    measurementId: "G-VPHGNXYPDZ"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const auth = firebase.auth();
const storage = firebase.storage();

db.enablePersistence()
    .then(() => console.log('✅ Firebase persistence enabled'))
    .catch(err => console.log('⚠️ Persistence error:', err));

let customers = [], suppliers = [], items = [], warehouses = [], sales = [], purchases = [];
let salesReturns = [], purchasesReturns = [], treasuryTransactions = [];
let leads = [], quotations = [];
let customerId = 1, supplierId = 1, itemId = 1, warehouseId = 1;
let treasuryBalance = 0, treasuryIncome = 0, treasuryExpense = 0;
let currentUser = null;
let notifications = [];
let darkMode = false;
let isOnline = navigator.onLine;
let auditLog = [];
let currentUserRole = 'admin';

document.addEventListener('DOMContentLoaded', function() {
    setTimeout(() => document.getElementById('loader').style.display = 'none', 400);
    const now = new Date();
    document.querySelectorAll('.date-display').forEach(el => {
        el.textContent = now.toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' });
    });
    window.addEventListener('online', () => {
        isOnline = true;
        document.getElementById('onlineStatus').textContent = '🟢 متصل';
    });
    window.addEventListener('offline', () => {
        isOnline = false;
        document.getElementById('onlineStatus').textContent = '🔴 غير متصل';
    });
    if (localStorage.getItem('darkMode') === 'true') {
        document.body.classList.add('dark-mode');
        document.getElementById('darkIcon').className = 'fas fa-sun';
    }
    document.querySelector('.menu-toggle').addEventListener('click', function(e) {
        e.stopPropagation();
        document.querySelector('.sidebar').classList.toggle('open');
    });
    document.querySelectorAll('nav a').forEach(link => {
        link.addEventListener('click', function() {
            document.querySelector('.sidebar').classList.remove('open');
        });
    });
    document.addEventListener('click', function(e) {
        const sidebar = document.querySelector('.sidebar');
        const menuToggle = document.querySelector('.menu-toggle');
        if (sidebar && sidebar.classList.contains('open') && 
            !sidebar.contains(e.target) && 
            menuToggle && !menuToggle.contains(e.target)) {
            sidebar.classList.remove('open');
        }
    });
    window.addEventListener('resize', function() {
        if (window.innerWidth > 768) {
            document.querySelector('.sidebar').classList.remove('open');
        }
    });
    requestNotificationPermission();
});

// ================================================================
// 🔔 إشعارات Push
// ================================================================
async function requestNotificationPermission() {
    if (!('Notification' in window)) return;
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
        console.log('✅ تم السماح بالإشعارات');
    }
}

function sendNotification(title, body, icon = 'https://example.com/icon.png') {
    if (!('Notification' in window)) return;
    if (Notification.permission === 'granted') {
        new Notification(title, { body, icon, vibrate: [200, 100, 200] });
    }
}

// ================================================================
// 📋 سجل العمليات
// ================================================================
function logAction(action, details, userId = currentUser || 'admin') {
    const logEntry = {
        id: Date.now(),
        timestamp: new Date().toISOString(),
        userId: userId,
        action: action,
        details: JSON.stringify(details),
        ip: 'local'
    };
    auditLog.push(logEntry);
    db.collection('auditLog').add(logEntry);
    updateAuditLog();
}

function showAuditLog() {
    document.querySelector('nav a[data-page="audit"]').click();
}

function updateAuditLog() {
    const tbody = document.getElementById('auditLogList');
    if (!tbody) return;
    tbody.innerHTML = '';
    const filtered = auditLog.slice().reverse();
    filtered.forEach(log => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${new Date(log.timestamp).toLocaleString('ar-EG')}</td>
            <td>${log.userId}</td>
            <td>${log.action}</td>
            <td>${log.details}</td>
        `;
        tbody.appendChild(row);
    });
    document.getElementById('auditCount').textContent = auditLog.length;
}

function filterAuditLog() {
    const date = document.getElementById('auditDateFilter').value;
    if (!date) { updateAuditLog(); return; }
    const tbody = document.getElementById('auditLogList');
    tbody.innerHTML = '';
    const filtered = auditLog.filter(log => log.timestamp.startsWith(date)).reverse();
    filtered.forEach(log => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${new Date(log.timestamp).toLocaleString('ar-EG')}</td>
            <td>${log.userId}</td>
            <td>${log.action}</td>
            <td>${log.details}</td>
        `;
        tbody.appendChild(row);
    });
    document.getElementById('auditCount').textContent = filtered.length;
}

// ================================================================
// 📱 إرسال الفواتير عبر واتساب
// ================================================================
function sendInvoiceWhatsApp(type) {
    const invoiceNo = document.getElementById('saleInvoiceNo')?.value || '';
    const customer = document.getElementById('saleCustomerSelect')?.value || '';
    const grandTotal = document.getElementById('saleGrandTotal')?.textContent || '0';
    const customerPhone = prompt('أدخل رقم هاتف العميل (مثال: 01001234567):');
    if (!customerPhone) return;
    const message = `مرحباً، مرفق فاتورتكم رقم ${invoiceNo} بقيمة ${grandTotal} جنيه. نرجو الإطلاع.`;
    const url = `https://wa.me/${customerPhone}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
    addNotification('success', '✅ تم إرسال الفاتورة عبر واتساب');
    logAction('إرسال فاتورة واتساب', { invoiceNo, customer, grandTotal });
}

// ================================================================
// 🔐 صلاحيات المستخدمين
// ================================================================
const ROLES = {
    ADMIN: 'admin',
    ACCOUNTANT: 'accountant',
    WAREHOUSE: 'warehouse',
    CASHIER: 'cashier',
    VIEWER: 'viewer'
};

const PERMISSIONS = {
    [ROLES.ADMIN]: ['all'],
    [ROLES.ACCOUNTANT]: ['sales', 'purchases', 'treasury', 'reports', 'customers', 'suppliers', 'audit'],
    [ROLES.WAREHOUSE]: ['items', 'warehouses', 'inventory'],
    [ROLES.CASHIER]: ['sales', 'customers'],
    [ROLES.VIEWER]: ['reports', 'dashboard']
};

function checkPermission(role, permission) {
    if (role === ROLES.ADMIN) return true;
    return PERMISSIONS[role]?.includes(permission) || PERMISSIONS[role]?.includes('all');
}

function applyPermissions(userRole) {
    document.querySelectorAll('[data-permission]').forEach(el => {
        const perm = el.dataset.permission;
        if (!checkPermission(userRole, perm)) {
            el.style.display = 'none';
        }
    });
}

// ================================================================
// دوال Firebase
// ================================================================
async function saveToFirebase(collection, id, data) {
    try {
        await db.collection(collection).doc(String(id)).set(data, { merge: true });
        return true;
    } catch (e) { console.error('Save error:', e); return false; }
}

async function deleteFromFirebase(collection, id) {
    try {
        await db.collection(collection).doc(String(id)).delete();
        return true;
    } catch (e) { console.error('Delete error:', e); return false; }
}

async function getAllFromFirebase(collection) {
    try {
        const snapshot = await db.collection(collection).get();
        const data = [];
        snapshot.forEach(doc => data.push({ id: parseInt(doc.id) || doc.id, ...doc.data() }));
        return data;
    } catch (e) { console.error('Get error:', e); return []; }
}

// ================================================================
// تحميل كل البيانات
// ================================================================
async function loadAllData() {
    try {
        customers = await getAllFromFirebase('customers');
        suppliers = await getAllFromFirebase('suppliers');
        items = await getAllFromFirebase('items');
        warehouses = await getAllFromFirebase('warehouses');
        sales = await getAllFromFirebase('sales');
        purchases = await getAllFromFirebase('purchases');
        salesReturns = await getAllFromFirebase('salesReturns');
        purchasesReturns = await getAllFromFirebase('purchasesReturns');
        treasuryTransactions = await getAllFromFirebase('treasury');
        leads = await getAllFromFirebase('leads');
        quotations = await getAllFromFirebase('quotations');
        auditLog = await getAllFromFirebase('auditLog');
        
        treasuryBalance = treasuryTransactions.reduce((s, t) => s + (t.debit || 0) - (t.credit || 0), 0);
        treasuryIncome = treasuryTransactions.reduce((s, t) => s + (t.debit || 0), 0);
        treasuryExpense = treasuryTransactions.reduce((s, t) => s + (t.credit || 0), 0);
        
        customerId = customers.length ? Math.max(...customers.map(c => c.id)) + 1 : 1;
        supplierId = suppliers.length ? Math.max(...suppliers.map(s => s.id)) + 1 : 1;
        itemId = items.length ? Math.max(...items.map(i => i.id)) + 1 : 1;
        warehouseId = warehouses.length ? Math.max(...warehouses.map(w => w.id)) + 1 : 1;
        
        const companyDoc = await db.collection('company').doc('info').get();
        if (companyDoc.exists) {
            const data = companyDoc.data();
            document.getElementById('companyName').value = data.name || 'شركة راشد للتجارة و التوزيع';
            document.getElementById('companyReg').value = data.reg || 'السجل التجاري';
            document.getElementById('companyTax').value = data.tax || 'الرقم التجاري';
            document.getElementById('companyAddress').value = data.address || 'العنوان';
            document.getElementById('companyPhone').value = data.phone || '01158767633';
            document.getElementById('companyEmail').value = data.email || 'rashedrbae20081217@gmail.com';
            document.getElementById('companyCurrency').value = data.currency || 'EGP';
            document.getElementById('companyTaxRate').value = data.taxRate || 14;
            if (data.logo) {
                document.getElementById('logoPreview').innerHTML = `<img src="${data.logo}" alt="شعار الشركة">`;
            }
        }
        
        updateAllUI();
        drawChart();
        updateTopItems();
        checkAlerts();
        document.getElementById('lastUpdate').textContent = new Date().toLocaleString('ar-EG');
        addNotification('success', '✅ تم تحميل البيانات من السحابة');
    } catch (e) {
        console.error('Load error:', e);
        addNotification('danger', '❌ خطأ في تحميل البيانات');
    }
}

// ================================================================
// حفظ كل البيانات
// ================================================================
async function saveAllData() {
    if (!isOnline) {
        addNotification('warning', '⚠️ غير متصل، سيتم الحفظ محلياً');
        return;
    }
    try {
        for (const c of customers) await saveToFirebase('customers', c.id, c);
        for (const s of suppliers) await saveToFirebase('suppliers', s.id, s);
        for (const i of items) await saveToFirebase('items', i.id, i);
        for (const w of warehouses) await saveToFirebase('warehouses', w.id, w);
        for (const s of sales) await saveToFirebase('sales', s.id, s);
        for (const p of purchases) await saveToFirebase('purchases', p.id, p);
        for (const r of salesReturns) await saveToFirebase('salesReturns', r.id, r);
        for (const r of purchasesReturns) await saveToFirebase('purchasesReturns', r.id, r);
        for (const t of treasuryTransactions) await saveToFirebase('treasury', t.id || Date.now(), t);
        for (const l of leads) await saveToFirebase('leads', l.id, l);
        for (const q of quotations) await saveToFirebase('quotations', q.id, q);
        for (const a of auditLog) await saveToFirebase('auditLog', a.id, a);
        await db.collection('company').doc('info').set(getCompanyData(), { merge: true });
        addNotification('success', '✅ تم حفظ البيانات في السحابة');
    } catch (e) {
        console.error('Save all error:', e);
        addNotification('danger', '❌ خطأ في حفظ البيانات');
    }
}

function getCompanyData() {
    return {
        name: document.getElementById('companyName').value,
        reg: document.getElementById('companyReg').value,
        tax: document.getElementById('companyTax').value,
        address: document.getElementById('companyAddress').value,
        phone: document.getElementById('companyPhone').value,
        email: document.getElementById('companyEmail').value,
        currency: document.getElementById('companyCurrency').value,
        taxRate: parseFloat(document.getElementById('companyTaxRate').value) || 14
    };
}

async function syncData() {
    document.getElementById('syncIcon').className = 'fas fa-spinner fa-spin';
    await loadAllData();
    document.getElementById('syncIcon').className = 'fas fa-sync';
    addNotification('success', '✅ تم مزامنة البيانات');
}

// ================================================================
// تسجيل الدخول
// ================================================================
document.getElementById('loginForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value;
    const pass = document.getElementById('loginPass').value;
    try {
        await auth.signInWithEmailAndPassword(email, pass);
        afterLogin(email.split('@')[0]);
    } catch (error) {
        alert('❌ ' + error.message);
    }
});

document.getElementById('signupForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    const name = document.getElementById('signupName').value;
    const email = document.getElementById('signupEmail').value;
    const pass = document.getElementById('signupPass').value;
    try {
        const userCredential = await auth.createUserWithEmailAndPassword(email, pass);
        await db.collection('users').doc(userCredential.user.uid).set({
            name, email, role: 'admin', createdAt: new Date().toISOString()
        });
        afterLogin(name);
    } catch (error) {
        alert('❌ ' + error.message);
    }
});

async function loginWithGoogle() {
    try {
        const provider = new firebase.auth.GoogleAuthProvider();
        const result = await auth.signInWithPopup(provider);
        afterLogin(result.user.displayName || result.user.email.split('@')[0]);
    } catch (error) {
        alert('❌ ' + error.message);
    }
}

function afterLogin(name) {
    currentUser = name;
    document.getElementById('loginScreen').style.display = 'none';
    document.getElementById('app').style.display = 'flex';
    document.getElementById('userNameDisplay').textContent = name;
    document.getElementById('headerUserName').textContent = name;
    applyPermissions(currentUserRole);
    loadAllData();
    logAction('تسجيل دخول', { user: name });
}

function showSignup() {
    document.getElementById('loginForm').style.display = 'none';
    document.getElementById('signupForm').style.display = 'block';
}
function showLogin() {
    document.getElementById('loginForm').style.display = 'block';
    document.getElementById('signupForm').style.display = 'none';
}

auth.onAuthStateChanged(user => {
    if (user) {
        const name = user.displayName || user.email.split('@')[0];
        currentUser = name;
        document.getElementById('loginScreen').style.display = 'none';
        document.getElementById('app').style.display = 'flex';
        document.getElementById('userNameDisplay').textContent = name;
        document.getElementById('headerUserName').textContent = name;
        applyPermissions(currentUserRole);
        loadAllData();
    }
});

document.getElementById('logoutBtn').addEventListener('click', async function(e) {
    e.preventDefault();
    if (confirm('تسجيل الخروج؟')) {
        logAction('تسجيل خروج', { user: currentUser });
        await auth.signOut();
        document.getElementById('app').style.display = 'none';
        document.getElementById('loginScreen').style.display = 'flex';
    }
});

// ================================================================
// تحديث الواجهة
// ================================================================
function updateAllUI() {
    const totalSales = sales.reduce((s, x) => s + (x.total || 0), 0);
    const totalPurchases = purchases.reduce((s, x) => s + (x.total || 0), 0);
    const totalStock = items.reduce((s, i) => s + ((i.stock || 0) * (i.salePrice || 0)), 0);
    
    document.getElementById('totalSales').textContent = totalSales.toLocaleString();
    document.getElementById('totalPurchases').textContent = totalPurchases.toLocaleString();
    document.getElementById('totalStock').textContent = totalStock.toLocaleString();
    document.getElementById('treasuryBalance').textContent = treasuryBalance.toLocaleString();
    document.getElementById('treasuryCurrentBalance').textContent = treasuryBalance.toFixed(2) + ' جنيه';
    document.getElementById('treasuryIncome').textContent = treasuryIncome.toFixed(2) + ' جنيه';
    document.getElementById('treasuryExpense').textContent = treasuryExpense.toFixed(2) + ' جنيه';
    document.getElementById('customerCount').textContent = customers.length;
    document.getElementById('supplierCount').textContent = suppliers.length;
    document.getElementById('leadsCount').textContent = leads.length;
    document.getElementById('quotationsCount').textContent = quotations.length;
    
    // العملاء
    const ct = document.getElementById('customersList');
    ct.innerHTML = '';
    customers.forEach(c => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${c.name}</td>
            <td>${c.type || 'عميل'}</td>
            <td>${c.phone || '-'}</td>
            <td>${(c.balance || 0).toFixed(2)}</td>
            <td>${(c.creditLimit || 0).toFixed(2)}</td>
            <td><button class="btn-delete" onclick="deleteCustomer(${c.id})"><i class="fas fa-trash"></i></button></td>
        `;
        ct.appendChild(row);
    });
    
    // الموردين
    const st = document.getElementById('suppliersList');
    st.innerHTML = '';
    suppliers.forEach(s => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${s.name}</td>
            <td>${s.type || 'مورد'}</td>
            <td>${s.phone || '-'}</td>
            <td>${(s.balance || 0).toFixed(2)}</td>
            <td>${(s.creditLimit || 0).toFixed(2)}</td>
            <td><button class="btn-delete" onclick="deleteSupplier(${s.id})"><i class="fas fa-trash"></i></button></td>
        `;
        st.appendChild(row);
    });
    
    // الأصناف
    const it = document.getElementById('itemsList');
    it.innerHTML = '';
    items.forEach(i => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${i.code}</td>
            <td>${i.name}</td>
            <td>${i.unit || 'قطعة'}</td>
            <td>${(i.salePrice || 0).toFixed(2)}</td>
            <td>${i.stock || 0}</td>
            <td>${i.minStock || 5}</td>
            <td>${i.barcode || '-'}</td>
            <td>
                <button class="btn-edit" onclick="printBarcode(${i.id}, '${i.barcode || i.code}')"><i class="fas fa-barcode"></i></button>
                <button class="btn-delete" onclick="deleteItem(${i.id})"><i class="fas fa-trash"></i></button>
            </td>
        `;
        it.appendChild(row);
    });
    
    // المبيعات
    const sl = document.getElementById('salesList');
    sl.innerHTML = '';
    sales.forEach(s => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${s.invoiceNo}</td>
            <td>${s.date}</td>
            <td>${s.customer}</td>
            <td>${(s.total || 0).toFixed(2)}</td>
            <td><span class="status ${s.status === 'مدفوعة' ? 'paid' : 'pending'}">${s.status || 'مدفوعة'}</span></td>
            <td><button class="btn-delete" onclick="deleteSale(${s.id})"><i class="fas fa-trash"></i></button></td>
        `;
        sl.appendChild(row);
    });
    
    // المشتريات
    const pl = document.getElementById('purchasesList');
    pl.innerHTML = '';
    purchases.forEach(p => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${p.invoiceNo}</td>
            <td>${p.date}</td>
            <td>${p.supplier}</td>
            <td>${(p.total || 0).toFixed(2)}</td>
            <td><span class="status ${p.status === 'مدفوعة' ? 'paid' : 'pending'}">${p.status || 'مدفوعة'}</span></td>
            <td><button class="btn-delete" onclick="deletePurchase(${p.id})"><i class="fas fa-trash"></i></button></td>
        `;
        pl.appendChild(row);
    });
    
    // الخزينة
    const tt = document.getElementById('treasuryTransactions');
    tt.innerHTML = '';
    treasuryTransactions.forEach(t => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${t.date}</td>
            <td>${t.type || 'حركة'}</td>
            <td>${t.desc}</td>
            <td>${t.debit ? t.debit.toFixed(2) : '-'}</td>
            <td>${t.credit ? t.credit.toFixed(2) : '-'}</td>
            <td>${(t.balance || 0).toFixed(2)}</td>
        `;
        tt.appendChild(row);
    });
    
    // مرتجعات المبيعات
    const srt = document.getElementById('salesReturnsList');
    srt.innerHTML = '';
    salesReturns.forEach(r => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${r.returnNo}</td>
            <td>${r.date}</td>
            <td>${r.invoiceNo}</td>
            <td>${r.party}</td>
            <td>${(r.amount || 0).toFixed(2)}</td>
            <td>${r.reason || 'مرتجع'}</td>
            <td><button class="btn-delete" onclick="deleteSaleReturn(${r.id})"><i class="fas fa-trash"></i></button></td>
        `;
        srt.appendChild(row);
    });
    
    // مرتجعات المشتريات
    const prt = document.getElementById('purchasesReturnsList');
    prt.innerHTML = '';
    purchasesReturns.forEach(r => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${r.returnNo}</td>
            <td>${r.date}</td>
            <td>${r.invoiceNo}</td>
            <td>${r.party}</td>
            <td>${(r.amount || 0).toFixed(2)}</td>
            <td>${r.reason || 'مرتجع'}</td>
            <td><button class="btn-delete" onclick="deletePurchaseReturn(${r.id})"><i class="fas fa-trash"></i></button></td>
        `;
        prt.appendChild(row);
    });
    
    // العملاء المحتملين
    updateLeadsList();
    // العروض والأسعار
    updateQuotationsList();
    // سجل العمليات
    updateAuditLog();
    
    // المخازن
    const wg = document.getElementById('warehousesGrid');
    wg.innerHTML = '';
    warehouses.forEach(w => {
        const card = document.createElement('div');
        card.className = 'warehouse-card';
        card.innerHTML = `
            <h3><i class="fas fa-warehouse"></i> ${w.name}</h3>
            <p>${w.location || ''}</p>
            <div class="warehouse-stats">
                <span>الأصناف: ${items.length}</span>
            </div>
        `;
        wg.appendChild(card);
    });
    
    // آخر الفواتير
    const rt = document.getElementById('recentInvoicesList');
    rt.innerHTML = '';
    const recent = [...sales].slice(-5).reverse();
    recent.forEach(s => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${s.invoiceNo}</td>
            <td>${s.customer}</td>
            <td>${(s.total || 0).toFixed(2)}</td>
            <td><span class="status ${s.status === 'مدفوعة' ? 'paid' : 'pending'}">${s.status || 'مدفوعة'}</span></td>
        `;
        rt.appendChild(row);
    });
    
    updateCustomerSelects();
    updateSupplierSelects();
    updateReturnCustomerSelects();
    updateReturnSupplierSelects();
    updateWarehouseSelects();
    updateItemSelects();
    updateCollectionSelects();
    updatePaymentSelects();
    updateQuotationCustomerSelects();
    updateInventoryWarehouseSelects();
    updateInventoryItemsList();
    
    if (isOnline) saveAllData();
    document.getElementById('lastUpdate').textContent = new Date().toLocaleString('ar-EG');
}

// ================================================================
// العملاء المحتملين
// ================================================================
function addLead(name, phone, source, status = 'جديد', notes = '') {
    const lead = {
        id: leads.length + 1,
        name,
        phone,
        source,
        status,
        notes,
        createdAt: new Date().toISOString()
    };
    leads.push(lead);
    updateLeadsList();
    logAction('إضافة عميل محتمل', { name, phone, source });
    addNotification('success', `✅ تم إضافة العميل المحتمل ${name}`);
    sendNotification('عميل محتمل جديد', `تم إضافة ${name} من مصدر ${source}`);
}

function convertLeadToCustomer(leadId) {
    const lead = leads.find(l => l.id === leadId);
    if (!lead) return;
    customers.push({
        id: customerId++,
        name: lead.name,
        phone: lead.phone,
        type: 'عميل',
        balance: 0,
        creditLimit: 0,
        source: lead.source,
        notes: lead.notes
    });
    leads = leads.filter(l => l.id !== leadId);
    updateLeadsList();
    updateAllUI();
    logAction('تحويل عميل محتمل لعميل', { name: lead.name });
    addNotification('success', `✅ تم تحويل ${lead.name} إلى عميل`);
}

function deleteLead(id) {
    if (confirm('حذف العميل المحتمل؟')) {
        leads = leads.filter(l => l.id !== id);
        updateLeadsList();
        logAction('حذف عميل محتمل', { id });
        addNotification('warning', 'تم الحذف');
    }
}

function updateLeadsList() {
    const tbody = document.getElementById('leadsList');
    if (!tbody) return;
    tbody.innerHTML = '';
    leads.forEach(l => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${l.name}</td>
            <td>${l.phone || '-'}</td>
            <td>${l.source || 'مباشر'}</td>
            <td><span class="status pending">${l.status}</span></td>
            <td>${new Date(l.createdAt).toLocaleDateString('ar-EG')}</td>
            <td>
                <button class="btn-success" onclick="convertLeadToCustomer(${l.id})"><i class="fas fa-user-check"></i> تحويل</button>
                <button class="btn-delete" onclick="deleteLead(${l.id})"><i class="fas fa-trash"></i></button>
            </td>
        `;
        tbody.appendChild(row);
    });
    document.getElementById('leadsCount').textContent = leads.length;
}

// ================================================================
// العروض والأسعار
// ================================================================
function addQuotation(customer, items, total, validity = 30) {
    const quotation = {
        id: quotations.length + 1,
        number: `QT-${String(quotations.length + 1).padStart(4, '0')}`,
        date: new Date().toISOString().split('T')[0],
        customer,
        items,
        total,
        validity,
        status: 'مرسل',
        createdAt: new Date().toISOString()
    };
    quotations.push(quotation);
    updateQuotationsList();
    logAction('إضافة عرض سعر', { number: quotation.number, customer, total });
    addNotification('success', `✅ تم إضافة عرض السعر ${quotation.number}`);
    sendNotification('عرض سعر جديد', `تم إضافة عرض سعر للعميل ${customer} بقيمة ${total}`);
}

function convertQuotationToInvoice(quotationId) {
    const q = quotations.find(q => q.id === quotationId);
    if (!q) return;
    q.status = 'محول لفاتورة';
    updateQuotationsList();
    logAction('تحويل عرض سعر لفاتورة', { number: q.number, customer: q.customer });
    addNotification('success', `✅ تم تحويل عرض السعر ${q.number} لفاتورة`);
}

function deleteQuotation(id) {
    if (confirm('حذف عرض السعر؟')) {
        quotations = quotations.filter(q => q.id !== id);
        updateQuotationsList();
        logAction('حذف عرض سعر', { id });
        addNotification('warning', 'تم الحذف');
    }
}

function updateQuotationsList() {
    const tbody = document.getElementById('quotationsList');
    if (!tbody) return;
    tbody.innerHTML = '';
    quotations.forEach(q => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${q.number}</td>
            <td>${q.date}</td>
            <td>${q.customer}</td>
            <td>${(q.total || 0).toFixed(2)}</td>
            <td><span class="status ${q.status === 'محول لفاتورة' ? 'paid' : 'pending'}">${q.status}</span></td>
            <td>
                <button class="btn-success" onclick="convertQuotationToInvoice(${q.id})"><i class="fas fa-exchange-alt"></i> تحويل</button>
                <button class="btn-delete" onclick="deleteQuotation(${q.id})"><i class="fas fa-trash"></i></button>
            </td>
        `;
        tbody.appendChild(row);
    });
    document.getElementById('quotationsCount').textContent = quotations.length;
}

// ================================================================
// جرد المخزون
// ================================================================
function updateInventoryItemsList() {
    const tbody = document.getElementById('inventoryItemsList');
    if (!tbody) return;
    tbody.innerHTML = '';
    items.forEach(i => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${i.name}</td>
            <td><input type="number" class="inventory-actual" data-id="${i.id}" value="${i.stock || 0}" min="0"></td>
            <td>${i.stock || 0}</td>
            <td id="inventory-diff-${i.id}">0</td>
        `;
        tbody.appendChild(row);
        // حساب الفرق تلقائياً
        const input = row.querySelector('.inventory-actual');
        input.addEventListener('input', function() {
            const actual = parseInt(this.value) || 0;
            const recorded = parseInt(this.dataset.recorded) || 0;
            const diff = actual - recorded;
            document.getElementById(`inventory-diff-${this.dataset.id}`).textContent = diff;
        });
        input.dataset.recorded = i.stock || 0;
    });
}

document.getElementById('inventoryForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    const date = document.getElementById('inventoryDate').value;
    const warehouse = document.getElementById('inventoryWarehouse').value;
    const inputs = document.querySelectorAll('.inventory-actual');
    let differences = [];
    inputs.forEach(input => {
        const id = parseInt(input.dataset.id);
        const actual = parseInt(input.value) || 0;
        const recorded = parseInt(input.dataset.recorded) || 0;
        const diff = actual - recorded;
        if (diff !== 0) {
            differences.push({ id, actual, recorded, diff });
            // تحديث المخزون
            const item = items.find(i => i.id === id);
            if (item) {
                item.stock = actual;
                saveToFirebase('items', item.id, item);
            }
        }
    });
    if (differences.length === 0) {
        alert('لا توجد فروق في الجرد');
        return;
    }
    logAction('تسجيل جرد مخزون', { date, warehouse, differences });
    addNotification('success', `✅ تم تسجيل الجرد، عدد الفروق: ${differences.length}`);
    updateAllUI();
    closeModal('inventoryModal');
});

// ================================================================
// طلب شراء تلقائي (عند وصول المخزون للحد الأدنى)
// ================================================================
function checkAutoPurchase() {
    items.forEach(item => {
        if ((item.stock || 0) <= (item.minStock || 5)) {
            addNotification('warning', `⚠️ تنبيه: الصنف ${item.name} وصل للحد الأدنى (${item.stock}/${item.minStock})`);
            // يمكن إضافة طلب شراء تلقائي هنا
            logAction('تنبيه طلب شراء تلقائي', { item: item.name, stock: item.stock, minStock: item.minStock });
        }
    });
}

// ================================================================
// باقي الدوال (نفس اللي قبل كده مع تعديلات)
// ================================================================
function updateCustomerSelects() {
    const sel = document.getElementById('saleCustomerSelect');
    if (!sel) return;
    sel.innerHTML = '<option value="">-- اختر --</option>';
    customers.forEach(c => {
        const opt = document.createElement('option');
        opt.value = c.name;
        opt.textContent = c.name;
        sel.appendChild(opt);
    });
}

function updateSupplierSelects() {
    const sel = document.getElementById('purchaseSupplierSelect');
    if (!sel) return;
    sel.innerHTML = '<option value="">-- اختر --</option>';
    suppliers.forEach(s => {
        const opt = document.createElement('option');
        opt.value = s.name;
        opt.textContent = s.name;
        sel.appendChild(opt);
    });
}

function updateReturnCustomerSelects() {
    const sel = document.getElementById('saleReturnCustomer');
    if (!sel) return;
    sel.innerHTML = '<option value="">-- اختر --</option>';
    customers.forEach(c => {
        const opt = document.createElement('option');
        opt.value = c.name;
        opt.textContent = c.name;
        sel.appendChild(opt);
    });
    const invSel = document.getElementById('saleReturnOriginalInvoice');
    if (invSel) {
        invSel.innerHTML = '<option value="">-- اختر فاتورة --</option>';
        sales.forEach(s => {
            const opt = document.createElement('option');
            opt.value = s.invoiceNo;
            opt.textContent = s.invoiceNo + ' - ' + s.customer;
            invSel.appendChild(opt);
        });
    }
}

function updateReturnSupplierSelects() {
    const sel = document.getElementById('purchaseReturnSupplier');
    if (!sel) return;
    sel.innerHTML = '<option value="">-- اختر --</option>';
    suppliers.forEach(s => {
        const opt = document.createElement('option');
        opt.value = s.name;
        opt.textContent = s.name;
        sel.appendChild(opt);
    });
    const invSel = document.getElementById('purchaseReturnOriginalInvoice');
    if (invSel) {
        invSel.innerHTML = '<option value="">-- اختر فاتورة --</option>';
        purchases.forEach(p => {
            const opt = document.createElement('option');
            opt.value = p.invoiceNo;
            opt.textContent = p.invoiceNo + ' - ' + p.supplier;
            invSel.appendChild(opt);
        });
    }
}

function updateWarehouseSelects() {
    const fromSel = document.getElementById('transferFromWarehouse');
    const toSel = document.getElementById('transferToWarehouse');
    const issueSel = document.getElementById('issueWarehouse');
    const receiptSel = document.getElementById('receiptWarehouse');
    const inventorySel = document.getElementById('inventoryWarehouse');
    const options = warehouses.map(w => `<option value="${w.name}">${w.name}</option>`).join('');
    if (fromSel) fromSel.innerHTML = '<option value="">-- اختر --</option>' + options;
    if (toSel) toSel.innerHTML = '<option value="">-- اختر --</option>' + options;
    if (issueSel) issueSel.innerHTML = '<option value="">-- اختر --</option>' + options;
    if (receiptSel) receiptSel.innerHTML = '<option value="">-- اختر --</option>' + options;
    if (inventorySel) inventorySel.innerHTML = '<option value="">-- اختر --</option>' + options;
}

function updateItemSelects() {
    const selects = ['transferItem', 'issueItem', 'receiptItem'];
    const options = items.map(i => `<option value="${i.id}">${i.code} - ${i.name} (${i.stock})</option>`).join('');
    selects.forEach(id => {
        const sel = document.getElementById(id);
        if (sel) sel.innerHTML = '<option value="">-- اختر --</option>' + options;
    });
}

function updateCollectionSelects() {
    const custSel = document.getElementById('collectionCustomer');
    if (custSel) {
        custSel.innerHTML = '<option value="">-- اختر --</option>';
        customers.forEach(c => {
            custSel.innerHTML += `<option value="${c.name}">${c.name} (الرصيد: ${(c.balance || 0).toFixed(2)})</option>`;
        });
    }
}

function updatePaymentSelects() {
    const suppSel = document.getElementById('paymentSupplier');
    if (suppSel) {
        suppSel.innerHTML = '<option value="">-- اختر --</option>';
        suppliers.forEach(s => {
            suppSel.innerHTML += `<option value="${s.name}">${s.name} (الرصيد: ${(s.balance || 0).toFixed(2)})</option>`;
        });
    }
}

function updateQuotationCustomerSelects() {
    const sel = document.getElementById('quotationCustomer');
    if (!sel) return;
    sel.innerHTML = '<option value="">-- اختر --</option>';
    customers.forEach(c => {
        const opt = document.createElement('option');
        opt.value = c.name;
        opt.textContent = c.name;
        sel.appendChild(opt);
    });
    // إضافة عملاء محتملين أيضاً
    leads.forEach(l => {
        const opt = document.createElement('option');
        opt.value = l.name;
        opt.textContent = `${l.name} (عميل محتمل)`;
        sel.appendChild(opt);
    });
}

function filterTable(input, tableId) {
    const query = input.value.toLowerCase();
    document.querySelectorAll(`#${tableId} tr`).forEach(row => {
        row.style.display = row.textContent.toLowerCase().includes(query) ? '' : 'none';
    });
}

function showModal(id) { document.getElementById(id).style.display = 'block'; }
function closeModal(id) { document.getElementById(id).style.display = 'none'; }
window.onclick = function(e) { if (e.target.classList.contains('modal')) e.target.style.display = 'none'; };

// ================================================================
// العملاء والموردين (نفس اللي قبل كده)
// ================================================================
document.getElementById('customerForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    const name = document.getElementById('custName').value.trim();
    if (!name) { alert('أدخل الاسم'); return; }
    const customer = {
        id: customerId++,
        name,
        type: document.getElementById('custType').value,
        phone: document.getElementById('custPhone').value || '',
        email: document.getElementById('custEmail').value || '',
        address: document.getElementById('custAddress').value || '',
        commercial: document.getElementById('custCommercial').value || '',
        tax: document.getElementById('custTax').value || '',
        creditLimit: parseFloat(document.getElementById('custCreditLimit').value) || 0,
        notes: document.getElementById('custNotes').value || '',
        balance: 0
    };
    customers.push(customer);
    await saveToFirebase('customers', customer.id, customer);
    logAction('إضافة عميل', { name, type: customer.type });
    updateAllUI();
    closeModal('customerModal');
    this.reset();
    addNotification('success', `✅ تم إضافة ${name}`);
    sendNotification('عميل جديد', `تم إضافة العميل ${name}`);
});

document.getElementById('supplierForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    const name = document.getElementById('suppName').value.trim();
    if (!name) { alert('أدخل الاسم'); return; }
    const supplier = {
        id: supplierId++,
        name,
        type: document.getElementById('suppType').value,
        phone: document.getElementById('suppPhone').value || '',
        email: document.getElementById('suppEmail').value || '',
        address: document.getElementById('suppAddress').value || '',
        commercial: document.getElementById('suppCommercial').value || '',
        tax: document.getElementById('suppTax').value || '',
        creditLimit: parseFloat(document.getElementById('suppCreditLimit').value) || 0,
        notes: document.getElementById('suppNotes').value || '',
        balance: 0
    };
    suppliers.push(supplier);
    await saveToFirebase('suppliers', supplier.id, supplier);
    logAction('إضافة مورد', { name, type: supplier.type });
    updateAllUI();
    closeModal('supplierModal');
    this.reset();
    addNotification('success', `✅ تم إضافة ${name}`);
});

async function deleteCustomer(id) {
    if (confirm('حذف العميل؟')) {
        customers = customers.filter(c => c.id !== id);
        await deleteFromFirebase('customers', id);
        logAction('حذف عميل', { id });
        updateAllUI();
        addNotification('warning', 'تم الحذف');
    }
}
async function deleteSupplier(id) {
    if (confirm('حذف المورد؟')) {
        suppliers = suppliers.filter(s => s.id !== id);
        await deleteFromFirebase('suppliers', id);
        logAction('حذف مورد', { id });
        updateAllUI();
        addNotification('warning', 'تم الحذف');
    }
}

// ================================================================
// الأصناف
// ================================================================
document.getElementById('itemForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    const code = document.getElementById('itemCode').value.trim();
    const name = document.getElementById('itemName').value.trim();
    if (!code || !name) { alert('أدخل الكود والاسم'); return; }
    const barcode = document.getElementById('itemBarcode').value.trim() || `BAR-${code}`;
    const item = {
        id: itemId++,
        code,
        name,
        category: document.getElementById('itemCategory').value || '',
        unit: document.getElementById('itemUnit').value,
        weight: parseFloat(document.getElementById('itemWeight').value) || 0,
        volume: parseFloat(document.getElementById('itemVolume').value) || 0,
        color: document.getElementById('itemColor').value || '',
        barcode: barcode,
        purchasePrice: parseFloat(document.getElementById('itemPurchasePrice').value) || 0,
        salePrice: parseFloat(document.getElementById('itemSalePrice').value) || 0,
        stock: parseInt(document.getElementById('itemStock').value) || 0,
        minStock: parseInt(document.getElementById('itemMinStock').value) || 5,
        notes: document.getElementById('itemNotes').value || ''
    };
    items.push(item);
    await saveToFirebase('items', item.id, item);
    logAction('إضافة صنف', { code, name });
    updateAllUI();
    closeModal('itemModal');
    this.reset();
    addNotification('success', `✅ تم إضافة ${name}`);
    checkAutoPurchase();
});

async function deleteItem(id) {
    if (confirm('حذف الصنف؟')) {
        items = items.filter(i => i.id !== id);
        await deleteFromFirebase('items', id);
        logAction('حذف صنف', { id });
        updateAllUI();
        addNotification('warning', 'تم الحذف');
    }
}

// ================================================================
// طباعة الباركود
// ================================================================
function printBarcode(itemId, code) {
    const win = window.open('', '_blank');
    win.document.write(`
        <html><head><title>باركود</title>
        <style>
            body { display: flex; justify-content: center; align-items: center; height: 100vh; flex-direction: column; font-family: 'Cairo', sans-serif; }
            .barcode-container { text-align: center; padding: 20px; border: 1px solid #ddd; border-radius: 8px; }
            .barcode-container h3 { margin-bottom: 10px; }
            @media print { body { margin: 0; padding: 0; } }
        </style>
        </head><body>
        <div class="barcode-container">
            <h3>${code}</h3>
            <svg id="barcode"></svg>
            <p>${itemId}</p>
        </div>
        <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.6/dist/JsBarcode.all.min.js"><\/script>
        <script>
            JsBarcode("#barcode", "${code}", { format: "CODE128", width: 2, height: 100, displayValue: true, font: "Cairo" });
            window.print();
        <\/script>
    `);
    win.document.close();
    logAction('طباعة باركود', { itemId, code });
}

// ================================================================
// المخازن (نفس اللي قبل كده مع logAction)
// ================================================================
document.getElementById('warehouseForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    const name = document.getElementById('warehouseName').value.trim();
    if (!name) { alert('أدخل الاسم'); return; }
    const warehouse = { id: warehouseId++, name, location: document.getElementById('warehouseLocation').value || '', desc: document.getElementById('warehouseDesc').value || '' };
    warehouses.push(warehouse);
    await saveToFirebase('warehouses', warehouse.id, warehouse);
    logAction('إضافة مخزن', { name });
    updateAllUI();
    closeModal('warehouseModal');
    this.reset();
    addNotification('success', `✅ تم إضافة ${name}`);
});

document.getElementById('warehouseTransferForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    const from = document.getElementById('transferFromWarehouse').value;
    const to = document.getElementById('transferToWarehouse').value;
    const itemId = parseInt(document.getElementById('transferItem').value);
    const qty = parseInt(document.getElementById('transferQty').value);
    if (!from || !to) { alert('اختر المخازن'); return; }
    if (from === to) { alert('⚠️ لا يمكن التحويل لنفس المخزن'); return; }
    if (!itemId) { alert('اختر الصنف'); return; }
    if (!qty || qty <= 0) { alert('أدخل الكمية'); return; }
    const item = items.find(i => i.id === itemId);
    if (!item) { alert('الصنف غير موجود'); return; }
    if (item.stock < qty) { alert(`⚠️ المخزون غير كافي (المتاح: ${item.stock})`); return; }
    item.stock -= qty;
    await saveToFirebase('items', item.id, item);
    logAction('تحويل بين المخازن', { from, to, item: item.name, qty });
    addNotification('success', `✅ تم تحويل ${qty} من ${item.name} من ${from} إلى ${to}`);
    updateAllUI();
    closeModal('warehouseTransferModal');
    this.reset();
});

document.getElementById('warehouseIssueForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    const warehouse = document.getElementById('issueWarehouse').value;
    const itemId = parseInt(document.getElementById('issueItem').value);
    const qty = parseInt(document.getElementById('issueQty').value);
    if (!warehouse) { alert('اختر المخزن'); return; }
    if (!itemId) { alert('اختر الصنف'); return; }
    if (!qty || qty <= 0) { alert('أدخل الكمية'); return; }
    const item = items.find(i => i.id === itemId);
    if (!item) { alert('الصنف غير موجود'); return; }
    if (item.stock < qty) { alert(`⚠️ المخزون غير كافي (المتاح: ${item.stock})`); return; }
    item.stock -= qty;
    await saveToFirebase('items', item.id, item);
    logAction('إذن صرف', { warehouse, item: item.name, qty });
    addNotification('warning', `✅ تم صرف ${qty} من ${item.name} من ${warehouse}`);
    updateAllUI();
    closeModal('warehouseIssueModal');
    this.reset();
});

document.getElementById('warehouseReceiptForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    const warehouse = document.getElementById('receiptWarehouse').value;
    const itemId = parseInt(document.getElementById('receiptItem').value);
    const qty = parseInt(document.getElementById('receiptQty').value);
    if (!warehouse) { alert('اختر المخزن'); return; }
    if (!itemId) { alert('اختر الصنف'); return; }
    if (!qty || qty <= 0) { alert('أدخل الكمية'); return; }
    const item = items.find(i => i.id === itemId);
    if (!item) { alert('الصنف غير موجود'); return; }
    item.stock += qty;
    await saveToFirebase('items', item.id, item);
    logAction('إذن إضافة', { warehouse, item: item.name, qty });
    addNotification('success', `✅ تم إضافة ${qty} من ${item.name} إلى ${warehouse}`);
    updateAllUI();
    closeModal('warehouseReceiptModal');
    this.reset();
});

// ================================================================
// الخزينة (نفس اللي قبل كده مع logAction)
// ================================================================
document.getElementById('treasuryDepositForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    const desc = document.getElementById('depositDesc').value.trim();
    const amount = parseFloat(document.getElementById('depositAmount').value);
    if (!desc || !amount) { alert('أدخل البيان والمبلغ'); return; }
    const date = new Date().toISOString().split('T')[0];
    treasuryBalance += amount;
    treasuryIncome += amount;
    const trans = {
        id: Date.now(),
        date,
        type: 'إيداع',
        desc: `${desc} (${document.getElementById('depositMethod').value})`,
        debit: amount,
        credit: 0,
        balance: treasuryBalance,
        party: document.getElementById('depositParty').value || ''
    };
    treasuryTransactions.push(trans);
    await saveToFirebase('treasury', trans.id, trans);
    logAction('إيداع', { desc, amount });
    updateAllUI();
    closeModal('treasuryDepositModal');
    this.reset();
    addNotification('success', `✅ تم تسجيل الإيداع بقيمة ${amount}`);
});

document.getElementById('treasuryWithdrawForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    const desc = document.getElementById('withdrawDesc').value.trim();
    const amount = parseFloat(document.getElementById('withdrawAmount').value);
    if (!desc || !amount) { alert('أدخل البيان والمبلغ'); return; }
    if (amount > treasuryBalance) { alert('⚠️ الرصيد غير كافي'); return; }
    const date = new Date().toISOString().split('T')[0];
    treasuryBalance -= amount;
    treasuryExpense += amount;
    const trans = {
        id: Date.now(),
        date,
        type: 'سحب',
        desc: `${desc} (${document.getElementById('withdrawMethod').value})`,
        debit: 0,
        credit: amount,
        balance: treasuryBalance,
        party: document.getElementById('withdrawParty').value || ''
    };
    treasuryTransactions.push(trans);
    await saveToFirebase('treasury', trans.id, trans);
    logAction('سحب', { desc, amount });
    updateAllUI();
    closeModal('treasuryWithdrawModal');
    this.reset();
    addNotification('warning', `✅ تم تسجيل السحب بقيمة ${amount}`);
});

document.getElementById('treasuryTransferForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    const from = document.getElementById('transferFrom').value;
    const to = document.getElementById('transferTo').value;
    const amount = parseFloat(document.getElementById('transferAmount').value);
    const desc = document.getElementById('transferDesc').value.trim() || `تحويل من ${from} إلى ${to}`;
    if (!amount) { alert('أدخل المبلغ'); return; }
    if (from === to) { alert('⚠️ لا يمكن التحويل لنفس الخزينة'); return; }
    const date = new Date().toISOString().split('T')[0];
    treasuryBalance -= amount;
    treasuryExpense += amount;
    const trans1 = { id: Date.now(), date, type: 'تحويل (من)', desc: `${desc} - من ${from}`, debit: 0, credit: amount, balance: treasuryBalance };
    treasuryTransactions.push(trans1);
    await saveToFirebase('treasury', trans1.id, trans1);
    treasuryBalance += amount;
    treasuryIncome += amount;
    const trans2 = { id: Date.now() + 1, date, type: 'تحويل (إلى)', desc: `${desc} - إلى ${to}`, debit: amount, credit: 0, balance: treasuryBalance };
    treasuryTransactions.push(trans2);
    await saveToFirebase('treasury', trans2.id, trans2);
    logAction('تحويل بين الخزن', { from, to, amount });
    updateAllUI();
    closeModal('treasuryTransferModal');
    this.reset();
    addNotification('success', `✅ تم تحويل ${amount} من ${from} إلى ${to}`);
});

document.getElementById('treasuryCollectionForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    const customer = document.getElementById('collectionCustomer').value;
    const amount = parseFloat(document.getElementById('collectionAmount').value);
    const desc = document.getElementById('collectionDesc').value.trim() || `تحصيل من ${customer}`;
    if (!customer) { alert('اختر العميل'); return; }
    if (!amount) { alert('أدخل المبلغ'); return; }
    const date = new Date().toISOString().split('T')[0];
    treasuryBalance += amount;
    treasuryIncome += amount;
    const trans = {
        id: Date.now(),
        date,
        type: 'تحصيل',
        desc: `${desc} (${document.getElementById('collectionMethod').value})`,
        debit: amount,
        credit: 0,
        balance: treasuryBalance,
        party: customer
    };
    treasuryTransactions.push(trans);
    await saveToFirebase('treasury', trans.id, trans);
    const cust = customers.find(c => c.name === customer);
    if (cust) {
        cust.balance = (cust.balance || 0) - amount;
        await saveToFirebase('customers', cust.id, cust);
    }
    logAction('تحصيل من عميل', { customer, amount });
    updateAllUI();
    closeModal('treasuryCollectionModal');
    this.reset();
    addNotification('success', `✅ تم تحصيل ${amount} من ${customer}`);
});

document.getElementById('treasuryPaymentForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    const supplier = document.getElementById('paymentSupplier').value;
    const amount = parseFloat(document.getElementById('paymentAmount').value);
    const desc = document.getElementById('paymentDesc').value.trim() || `سداد لـ ${supplier}`;
    if (!supplier) { alert('اختر المورد'); return; }
    if (!amount) { alert('أدخل المبلغ'); return; }
    if (amount > treasuryBalance) { alert('⚠️ الرصيد غير كافي'); return; }
    const date = new Date().toISOString().split('T')[0];
    treasuryBalance -= amount;
    treasuryExpense += amount;
    const trans = {
        id: Date.now(),
        date,
        type: 'سداد',
        desc: `${desc} (${document.getElementById('paymentMethod').value})`,
        debit: 0,
        credit: amount,
        balance: treasuryBalance,
        party: supplier
    };
    treasuryTransactions.push(trans);
    await saveToFirebase('treasury', trans.id, trans);
    const supp = suppliers.find(s => s.name === supplier);
    if (supp) {
        supp.balance = (supp.balance || 0) + amount;
        await saveToFirebase('suppliers', supp.id, supp);
    }
    logAction('سداد لمورد', { supplier, amount });
    updateAllUI();
    closeModal('treasuryPaymentModal');
    this.reset();
    addNotification('warning', `✅ تم سداد ${amount} لـ ${supplier}`);
});

// ================================================================
// الفواتير (مع شروط الدفع والخصومات)
// ================================================================
function openSaleInvoice() {
    document.getElementById('saleInvoiceModal').style.display = 'block';
    const now = new Date();
    document.getElementById('saleInvoiceDate').value = now.toISOString().split('T')[0];
    const dueDate = new Date(now);
    dueDate.setDate(dueDate.getDate() + 30);
    document.getElementById('saleDueDate').value = dueDate.toISOString().split('T')[0];
    document.getElementById('saleInvoiceNo').value = `INV-${String(sales.length + 1).padStart(4, '0')}`;
    updateCustomerSelects();
    document.getElementById('saleInvoiceItems').innerHTML = `
        <tr class="item-row">
            <td><input type="text" class="item-name" placeholder="اسم الصنف"></td>
            <td><input type="number" class="item-qty" value="1" oninput="calcSaleRowTotal(this)"></td>
            <td><input type="number" class="item-price" value="0" oninput="calcSaleRowTotal(this)"></td>
            <td><input type="number" class="item-discount-percent" value="0" oninput="calcSaleRowTotal(this)"></td>
            <td><input type="number" class="item-discount-amount" value="0" oninput="calcSaleRowTotal(this)"></td>
            <td><input type="number" class="item-total" value="0" readonly></td>
            <td><button type="button" class="btn-delete-sm" onclick="removeSaleRow(this)"><i class="fas fa-times"></i></button></td>
        </tr>
    `;
    calcSaleSummary();
    generateQRCode('qrCode', `فاتورة ${document.getElementById('saleInvoiceNo').value}`);
}

function calcSaleRowTotal(el) {
    const row = el.closest('tr');
    const qty = parseFloat(row.querySelector('.item-qty').value) || 0;
    const price = parseFloat(row.querySelector('.item-price').value) || 0;
    const discountPercent = parseFloat(row.querySelector('.item-discount-percent').value) || 0;
    const discountAmount = parseFloat(row.querySelector('.item-discount-amount').value) || 0;
    const total = (qty * price);
    const discount = (total * discountPercent / 100) + discountAmount;
    row.querySelector('.item-total').value = (total - discount).toFixed(2);
    calcSaleSummary();
}

function calcSaleSummary() {
    const rows = document.querySelectorAll('#saleInvoiceItems .item-row');
    let grandTotal = 0;
    let totalDiscount = 0;
    rows.forEach(row => {
        const discountPercent = parseFloat(row.querySelector('.item-discount-percent').value) || 0;
        const discountAmount = parseFloat(row.querySelector('.item-discount-amount').value) || 0;
        const total = parseFloat(row.querySelector('.item-total').value) || 0;
        grandTotal += total;
        totalDiscount += discountAmount + (total * discountPercent / 100);
    });
    document.getElementById('saleTotalDiscount').textContent = totalDiscount.toFixed(2);
    document.getElementById('saleGrandTotal').textContent = grandTotal.toFixed(2);
    // تحديث QR Code
    const invoiceNo = document.getElementById('saleInvoiceNo').value;
    generateQRCode('qrCode', `فاتورة ${invoiceNo} - ${grandTotal.toFixed(2)} جنيه`);
}

function addSaleRow() {
    const tbody = document.getElementById('saleInvoiceItems');
    const row = document.createElement('tr');
    row.className = 'item-row';
    row.innerHTML = `
        <td><input type="text" class="item-name" placeholder="اسم الصنف"></td>
        <td><input type="number" class="item-qty" value="1" oninput="calcSaleRowTotal(this)"></td>
        <td><input type="number" class="item-price" value="0" oninput="calcSaleRowTotal(this)"></td>
        <td><input type="number" class="item-discount-percent" value="0" oninput="calcSaleRowTotal(this)"></td>
        <td><input type="number" class="item-discount-amount" value="0" oninput="calcSaleRowTotal(this)"></td>
        <td><input type="number" class="item-total" value="0" readonly></td>
        <td><button type="button" class="btn-delete-sm" onclick="removeSaleRow(this)"><i class="fas fa-times"></i></button></td>
    `;
    tbody.appendChild(row);
    calcSaleSummary();
}

function removeSaleRow(btn) {
    const tbody = document.getElementById('saleInvoiceItems');
    if (tbody.querySelectorAll('.item-row').length <= 1) { alert('يجب أن يكون صف واحد على الأقل'); return; }
    btn.closest('tr').remove();
    calcSaleSummary();
}

// ===== فاتورة مشتريات (نفس نظام الخصومات) =====
function openPurchaseInvoice() {
    document.getElementById('purchaseInvoiceModal').style.display = 'block';
    const now = new Date();
    document.getElementById('purchaseInvoiceDate').value = now.toISOString().split('T')[0];
    const dueDate = new Date(now);
    dueDate.setDate(dueDate.getDate() + 30);
    document.getElementById('purchaseDueDate').value = dueDate.toISOString().split('T')[0];
    document.getElementById('purchaseInvoiceNo').value = `PUR-${String(purchases.length + 1).padStart(4, '0')}`;
    updateSupplierSelects();
    document.getElementById('purchaseInvoiceItems').innerHTML = `
        <tr class="item-row">
            <td><input type="text" class="item-name" placeholder="اسم الصنف"></td>
            <td><input type="number" class="item-qty" value="1" oninput="calcPurchaseRowTotal(this)"></td>
            <td><input type="number" class="item-price" value="0" oninput="calcPurchaseRowTotal(this)"></td>
            <td><input type="number" class="item-discount-percent" value="0" oninput="calcPurchaseRowTotal(this)"></td>
            <td><input type="number" class="item-discount-amount" value="0" oninput="calcPurchaseRowTotal(this)"></td>
            <td><input type="number" class="item-total" value="0" readonly></td>
            <td><button type="button" class="btn-delete-sm" onclick="removePurchaseRow(this)"><i class="fas fa-times"></i></button></td>
        </tr>
    `;
    calcPurchaseSummary();
}

function calcPurchaseRowTotal(el) {
    const row = el.closest('tr');
    const qty = parseFloat(row.querySelector('.item-qty').value) || 0;
    const price = parseFloat(row.querySelector('.item-price').value) || 0;
    const discountPercent = parseFloat(row.querySelector('.item-discount-percent').value) || 0;
    const discountAmount = parseFloat(row.querySelector('.item-discount-amount').value) || 0;
    const total = (qty * price);
    const discount = (total * discountPercent / 100) + discountAmount;
    row.querySelector('.item-total').value = (total - discount).toFixed(2);
    calcPurchaseSummary();
}

function calcPurchaseSummary() {
    const rows = document.querySelectorAll('#purchaseInvoiceItems .item-row');
    let grandTotal = 0;
    let totalDiscount = 0;
    rows.forEach(row => {
        const discountPercent = parseFloat(row.querySelector('.item-discount-percent').value) || 0;
        const discountAmount = parseFloat(row.querySelector('.item-discount-amount').value) || 0;
        const total = parseFloat(row.querySelector('.item-total').value) || 0;
        grandTotal += total;
        totalDiscount += discountAmount + (total * discountPercent / 100);
    });
    document.getElementById('purchaseTotalDiscount').textContent = totalDiscount.toFixed(2);
    document.getElementById('purchaseGrandTotal').textContent = grandTotal.toFixed(2);
}

function addPurchaseRow() {
    const tbody = document.getElementById('purchaseInvoiceItems');
    const row = document.createElement('tr');
    row.className = 'item-row';
    row.innerHTML = `
        <td><input type="text" class="item-name" placeholder="اسم الصنف"></td>
        <td><input type="number" class="item-qty" value="1" oninput="calcPurchaseRowTotal(this)"></td>
        <td><input type="number" class="item-price" value="0" oninput="calcPurchaseRowTotal(this)"></td>
        <td><input type="number" class="item-discount-percent" value="0" oninput="calcPurchaseRowTotal(this)"></td>
        <td><input type="number" class="item-discount-amount" value="0" oninput="calcPurchaseRowTotal(this)"></td>
        <td><input type="number" class="item-total" value="0" readonly></td>
        <td><button type="button" class="btn-delete-sm" onclick="removePurchaseRow(this)"><i class="fas fa-times"></i></button></td>
    `;
    tbody.appendChild(row);
    calcPurchaseSummary();
}

function removePurchaseRow(btn) {
    const tbody = document.getElementById('purchaseInvoiceItems');
    if (tbody.querySelectorAll('.item-row').length <= 1) { alert('يجب أن يكون صف واحد على الأقل'); return; }
    btn.closest('tr').remove();
    calcPurchaseSummary();
}

// ===== حفظ فاتورة مبيعات =====
document.getElementById('saleInvoiceForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    const customer = document.getElementById('saleCustomerSelect').value;
    const grandTotal = parseFloat(document.getElementById('saleGrandTotal').textContent) || 0;
    const invoiceNo = document.getElementById('saleInvoiceNo').value;
    const date = document.getElementById('saleInvoiceDate').value;
    const dueDate = document.getElementById('saleDueDate').value;
    const paymentTerms = document.getElementById('salePaymentTerms').value;
    if (!customer) { alert('اختر العميل'); return; }
    if (grandTotal === 0) { alert('أضف منتجات'); return; }
    const tax = grandTotal * 0.14;
    const subtotal = grandTotal - tax;
    const sale = {
        id: sales.length + 1,
        invoiceNo,
        date,
        dueDate,
        customer,
        subtotal,
        tax,
        total: grandTotal,
        status: 'مدفوعة',
        payment: document.getElementById('salePaymentMethod').value,
        paymentTerms: paymentTerms,
        items: []
    };
    // جلب الأصناف
    const rows = document.querySelectorAll('#saleInvoiceItems .item-row');
    rows.forEach(row => {
        const name = row.querySelector('.item-name').value;
        const qty = parseFloat(row.querySelector('.item-qty').value) || 0;
        const price = parseFloat(row.querySelector('.item-price').value) || 0;
        const discountPercent = parseFloat(row.querySelector('.item-discount-percent').value) || 0;
        const discountAmount = parseFloat(row.querySelector('.item-discount-amount').value) || 0;
        const total = parseFloat(row.querySelector('.item-total').value) || 0;
        if (name && qty > 0) {
            sale.items.push({ name, qty, price, discountPercent, discountAmount, total });
        }
    });
    sales.push(sale);
    await saveToFirebase('sales', sale.id, sale);
    treasuryBalance += grandTotal;
    treasuryIncome += grandTotal;
    const trans = {
        id: Date.now(),
        date,
        type: 'مبيعات',
        desc: `مبيعات - ${invoiceNo} (${sale.payment})`,
        debit: grandTotal,
        credit: 0,
        balance: treasuryBalance
    };
    treasuryTransactions.push(trans);
    await saveToFirebase('treasury', trans.id, trans);
    logAction('إضافة فاتورة مبيعات', { invoiceNo, customer, grandTotal });
    sendNotification('فاتورة جديدة', `تم إضافة فاتورة ${invoiceNo} للعميل ${customer} بقيمة ${grandTotal}`);
    updateAllUI();
    closeModal('saleInvoiceModal');
    addNotification('success', `✅ فاتورة ${invoiceNo} بقيمة ${grandTotal.toFixed(2)}`);
});

// ===== حفظ فاتورة مشتريات =====
document.getElementById('purchaseInvoiceForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    const supplier = document.getElementById('purchaseSupplierSelect').value;
    const grandTotal = parseFloat(document.getElementById('purchaseGrandTotal').textContent) || 0;
    const invoiceNo = document.getElementById('purchaseInvoiceNo').value;
    const date = document.getElementById('purchaseInvoiceDate').value;
    const dueDate = document.getElementById('purchaseDueDate').value;
    if (!supplier) { alert('اختر المورد'); return; }
    if (grandTotal === 0) { alert('أضف منتجات'); return; }
    const tax = grandTotal * 0.14;
    const subtotal = grandTotal - tax;
    const purchase = {
        id: purchases.length + 1,
        invoiceNo,
        date,
        dueDate,
        supplier,
        subtotal,
        tax,
        total: grandTotal,
        status: 'مدفوعة',
        payment: document.getElementById('purchasePaymentMethod').value,
        items: []
    };
    const rows = document.querySelectorAll('#purchaseInvoiceItems .item-row');
    rows.forEach(row => {
        const name = row.querySelector('.item-name').value;
        const qty = parseFloat(row.querySelector('.item-qty').value) || 0;
        const price = parseFloat(row.querySelector('.item-price').value) || 0;
        const discountPercent = parseFloat(row.querySelector('.item-discount-percent').value) || 0;
        const discountAmount = parseFloat(row.querySelector('.item-discount-amount').value) || 0;
        const total = parseFloat(row.querySelector('.item-total').value) || 0;
        if (name && qty > 0) {
            purchase.items.push({ name, qty, price, discountPercent, discountAmount, total });
        }
    });
    purchases.push(purchase);
    await saveToFirebase('purchases', purchase.id, purchase);
    treasuryBalance -= grandTotal;
    treasuryExpense += grandTotal;
    const trans = {
        id: Date.now(),
        date,
        type: 'مشتريات',
        desc: `مشتريات - ${invoiceNo} (${purchase.payment})`,
        debit: 0,
        credit: grandTotal,
        balance: treasuryBalance
    };
    treasuryTransactions.push(trans);
    await saveToFirebase('treasury', trans.id, trans);
    logAction('إضافة فاتورة مشتريات', { invoiceNo, supplier, grandTotal });
    updateAllUI();
    closeModal('purchaseInvoiceModal');
    addNotification('success', `✅ فاتورة شراء ${invoiceNo} بقيمة ${grandTotal.toFixed(2)}`);
});

// ================================================================
// تصدير الفواتير مع الشعار
// ================================================================
async function exportInvoiceWithLogo(type) {
    const idMap = {
        'sale': 'saleInvoiceContent',
        'purchase': 'purchaseInvoiceContent',
        'sale-return': 'saleReturnContent',
        'purchase-return': 'purchaseReturnContent'
    };
    const nameMap = {
        'sale': 'فاتورة_مبيعات',
        'purchase': 'فاتورة_مشتريات',
        'sale-return': 'مرتجع_مبيعات',
        'purchase-return': 'مرتجع_مشتريات'
    };
    const el = document.getElementById(idMap[type]);
    if (!el) { alert('لا توجد فاتورة'); return; }
    const logoUrl = await getCompanyLogo();
    if (logoUrl) {
        const img = document.createElement('img');
        img.src = logoUrl;
        img.style.maxWidth = '150px';
        img.style.marginBottom = '10px';
        el.prepend(img);
    }
    const opt = {
        margin: 10,
        filename: `${nameMap[type]}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };
    html2pdf().set(opt).from(el).save();
    logAction('تصدير فاتورة PDF', { type });
    addNotification('success', '✅ تم تصدير الفاتورة مع الشعار');
}

async function getCompanyLogo() {
    try {
        const doc = await db.collection('company').doc('info').get();
        if (doc.exists && doc.data().logo) {
            return doc.data().logo;
        }
        return null;
    } catch (e) {
        return null;
    }
}

// ================================================================
// QR Code
// ================================================================
function generateQRCode(elementId, data) {
    const el = document.getElementById(elementId);
    if (!el) return;
    el.innerHTML = '';
    if (typeof QRCode !== 'undefined') {
        new QRCode(el, {
            text: data,
            width: 100,
            height: 100,
            colorDark: "#000000",
            colorLight: "#ffffff",
            correctLevel: QRCode.CorrectLevel.H
        });
    }
}

// ================================================================
// مرتجعات المبيعات والمشتريات (نفس اللي قبل كده)
// ================================================================
function openSaleReturnInvoice() {
    document.getElementById('saleReturnModal').style.display = 'block';
    document.getElementById('saleReturnDate').value = new Date().toISOString().split('T')[0];
    document.getElementById('saleReturnNo').value = `SR-${String(salesReturns.length + 1).padStart(4, '0')}`;
    updateReturnCustomerSelects();
    document.getElementById('saleReturnItems').innerHTML = `
        <tr class="item-row">
            <td><input type="text" class="item-name" placeholder="اسم الصنف"></td>
            <td><input type="number" class="item-qty" value="1" oninput="calcSaleReturnRowTotal(this)"></td>
            <td><input type="number" class="item-price" value="0" oninput="calcSaleReturnRowTotal(this)"></td>
            <td><input type="number" class="item-discount" value="0" oninput="calcSaleReturnRowTotal(this)"></td>
            <td><input type="number" class="item-total" value="0" readonly></td>
            <td><button type="button" class="btn-delete-sm" onclick="removeSaleReturnRow(this)"><i class="fas fa-times"></i></button></td>
        </tr>
    `;
    calcSaleReturnSummary();
}

function openPurchaseReturnInvoice() {
    document.getElementById('purchaseReturnModal').style.display = 'block';
    document.getElementById('purchaseReturnDate').value = new Date().toISOString().split('T')[0];
    document.getElementById('purchaseReturnNo').value = `PR-${String(purchasesReturns.length + 1).padStart(4, '0')}`;
    updateReturnSupplierSelects();
    document.getElementById('purchaseReturnItems').innerHTML = `
        <tr class="item-row">
            <td><input type="text" class="item-name" placeholder="اسم الصنف"></td>
            <td><input type="number" class="item-qty" value="1" oninput="calcPurchaseReturnRowTotal(this)"></td>
            <td><input type="number" class="item-price" value="0" oninput="calcPurchaseReturnRowTotal(this)"></td>
            <td><input type="number" class="item-discount" value="0" oninput="calcPurchaseReturnRowTotal(this)"></td>
            <td><input type="number" class="item-total" value="0" readonly></td>
            <td><button type="button" class="btn-delete-sm" onclick="removePurchaseReturnRow(this)"><i class="fas fa-times"></i></button></td>
        </tr>
    `;
    calcPurchaseReturnSummary();
}

function calcSaleReturnRowTotal(el) {
    const row = el.closest('tr');
    const qty = parseFloat(row.querySelector('.item-qty').value) || 0;
    const price = parseFloat(row.querySelector('.item-price').value) || 0;
    const discount = parseFloat(row.querySelector('.item-discount').value) || 0;
    row.querySelector('.item-total').value = ((qty * price) - discount).toFixed(2);
    calcSaleReturnSummary();
}

function calcSaleReturnSummary() {
    const rows = document.querySelectorAll('#saleReturnItems .item-row');
    let grandTotal = 0;
    rows.forEach(row => {
        grandTotal += parseFloat(row.querySelector('.item-total').value) || 0;
    });
    document.getElementById('saleReturnGrandTotal').textContent = grandTotal.toFixed(2);
}

function addSaleReturnRow() {
    const tbody = document.getElementById('saleReturnItems');
    const row = document.createElement('tr');
    row.className = 'item-row';
    row.innerHTML = `
        <td><input type="text" class="item-name" placeholder="اسم الصنف"></td>
        <td><input type="number" class="item-qty" value="1" oninput="calcSaleReturnRowTotal(this)"></td>
        <td><input type="number" class="item-price" value="0" oninput="calcSaleReturnRowTotal(this)"></td>
        <td><input type="number" class="item-discount" value="0" oninput="calcSaleReturnRowTotal(this)"></td>
        <td><input type="number" class="item-total" value="0" readonly></td>
        <td><button type="button" class="btn-delete-sm" onclick="removeSaleReturnRow(this)"><i class="fas fa-times"></i></button></td>
    `;
    tbody.appendChild(row);
    calcSaleReturnSummary();
}

function removeSaleReturnRow(btn) {
    const tbody = document.getElementById('saleReturnItems');
    if (tbody.querySelectorAll('.item-row').length <= 1) { alert('يجب أن يكون صف واحد على الأقل'); return; }
    btn.closest('tr').remove();
    calcSaleReturnSummary();
}

function calcPurchaseReturnRowTotal(el) {
    const row = el.closest('tr');
    const qty = parseFloat(row.querySelector('.item-qty').value) || 0;
    const price = parseFloat(row.querySelector('.item-price').value) || 0;
    const discount = parseFloat(row.querySelector('.item-discount').value) || 0;
    row.querySelector('.item-total').value = ((qty * price) - discount).toFixed(2);
    calcPurchaseReturnSummary();
}

function calcPurchaseReturnSummary() {
    const rows = document.querySelectorAll('#purchaseReturnItems .item-row');
    let grandTotal = 0;
    rows.forEach(row => {
        grandTotal += parseFloat(row.querySelector('.item-total').value) || 0;
    });
    document.getElementById('purchaseReturnGrandTotal').textContent = grandTotal.toFixed(2);
}

function addPurchaseReturnRow() {
    const tbody = document.getElementById('purchaseReturnItems');
    const row = document.createElement('tr');
    row.className = 'item-row';
    row.innerHTML = `
        <td><input type="text" class="item-name" placeholder="اسم الصنف"></td>
        <td><input type="number" class="item-qty" value="1" oninput="calcPurchaseReturnRowTotal(this)"></td>
        <td><input type="number" class="item-price" value="0" oninput="calcPurchaseReturnRowTotal(this)"></td>
        <td><input type="number" class="item-discount" value="0" oninput="calcPurchaseReturnRowTotal(this)"></td>
        <td><input type="number" class="item-total" value="0" readonly></td>
        <td><button type="button" class="btn-delete-sm" onclick="removePurchaseReturnRow(this)"><i class="fas fa-times"></i></button></td>
    `;
    tbody.appendChild(row);
    calcPurchaseReturnSummary();
}

function removePurchaseReturnRow(btn) {
    const tbody = document.getElementById('purchaseReturnItems');
    if (tbody.querySelectorAll('.item-row').length <= 1) { alert('يجب أن يكون صف واحد على الأقل'); return; }
    btn.closest('tr').remove();
    calcPurchaseReturnSummary();
}

document.getElementById('saleReturnForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    const customer = document.getElementById('saleReturnCustomer').value;
    const invoiceNo = document.getElementById('saleReturnOriginalInvoice').value;
    const grandTotal = parseFloat(document.getElementById('saleReturnGrandTotal').textContent) || 0;
    const returnNo = document.getElementById('saleReturnNo').value;
    const date = document.getElementById('saleReturnDate').value;
    const reason = document.getElementById('saleReturnReason').value;
    if (!customer) { alert('اختر العميل'); return; }
    if (!invoiceNo) { alert('اختر الفاتورة الأصلية'); return; }
    if (grandTotal === 0) { alert('أضف منتجات'); return; }
    const ret = { id: salesReturns.length + 1, returnNo, date, invoiceNo, party: customer, amount: grandTotal, reason };
    salesReturns.push(ret);
    await saveToFirebase('salesReturns', ret.id, ret);
    treasuryBalance -= grandTotal;
    treasuryExpense += grandTotal;
    const trans = { id: Date.now(), date, type: 'مرتجع مبيعات', desc: `مرتجع مبيعات - ${returnNo}`, debit: 0, credit: grandTotal, balance: treasuryBalance };
    treasuryTransactions.push(trans);
    await saveToFirebase('treasury', trans.id, trans);
    logAction('تسجيل مرتجع مبيعات', { returnNo, customer, grandTotal });
    updateAllUI();
    closeModal('saleReturnModal');
    addNotification('warning', `✅ تم تسجيل مرتجع ${returnNo} بقيمة ${grandTotal.toFixed(2)}`);
});

document.getElementById('purchaseReturnForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    const supplier = document.getElementById('purchaseReturnSupplier').value;
    const invoiceNo = document.getElementById('purchaseReturnOriginalInvoice').value;
    const grandTotal = parseFloat(document.getElementById('purchaseReturnGrandTotal').textContent) || 0;
    const returnNo = document.getElementById('purchaseReturnNo').value;
    const date = document.getElementById('purchaseReturnDate').value;
    const reason = document.getElementById('purchaseReturnReason').value;
    if (!supplier) { alert('اختر المورد'); return; }
    if (!invoiceNo) { alert('اختر الفاتورة الأصلية'); return; }
    if (grandTotal === 0) { alert('أضف منتجات'); return; }
    const ret = { id: purchasesReturns.length + 1, returnNo, date, invoiceNo, party: supplier, amount: grandTotal, reason };
    purchasesReturns.push(ret);
    await saveToFirebase('purchasesReturns', ret.id, ret);
    treasuryBalance += grandTotal;
    treasuryIncome += grandTotal;
    const trans = { id: Date.now(), date, type: 'مرتجع مشتريات', desc: `مرتجع مشتريات - ${returnNo}`, debit: grandTotal, credit: 0, balance: treasuryBalance };
    treasuryTransactions.push(trans);
    await saveToFirebase('treasury', trans.id, trans);
    logAction('تسجيل مرتجع مشتريات', { returnNo, supplier, grandTotal });
    updateAllUI();
    closeModal('purchaseReturnModal');
    addNotification('success', `✅ تم تسجيل مرتجع ${returnNo} بقيمة ${grandTotal.toFixed(2)}`);
});

// ================================================================
// حذف الفواتير والمرتجعات
// ================================================================
async function deleteSale(id) {
    if (confirm('حذف الفاتورة؟')) {
        sales = sales.filter(s => s.id !== id);
        await deleteFromFirebase('sales', id);
        logAction('حذف فاتورة مبيعات', { id });
        updateAllUI();
        addNotification('warning', 'تم الحذف');
    }
}
async function deletePurchase(id) {
    if (confirm('حذف الفاتورة؟')) {
        purchases = purchases.filter(p => p.id !== id);
        await deleteFromFirebase('purchases', id);
        logAction('حذف فاتورة مشتريات', { id });
        updateAllUI();
        addNotification('warning', 'تم الحذف');
    }
}
async function deleteSaleReturn(id) {
    if (confirm('حذف المرتجع؟')) {
        salesReturns = salesReturns.filter(r => r.id !== id);
        await deleteFromFirebase('salesReturns', id);
        logAction('حذف مرتجع مبيعات', { id });
        updateAllUI();
        addNotification('warning', 'تم الحذف');
    }
}
async function deletePurchaseReturn(id) {
    if (confirm('حذف المرتجع؟')) {
        purchasesReturns = purchasesReturns.filter(r => r.id !== id);
        await deleteFromFirebase('purchasesReturns', id);
        logAction('حذف مرتجع مشتريات', { id });
        updateAllUI();
        addNotification('warning', 'تم الحذف');
    }
}

// ================================================================
// الإشعارات
// ================================================================
function addNotification(type, text) {
    notifications.push({ type, text, time: new Date().toLocaleString('ar-EG') });
    document.getElementById('notifBadge').textContent = notifications.length;
}

function showNotifications() {
    const list = document.getElementById('notifList');
    list.innerHTML = '';
    if (notifications.length === 0) {
        list.innerHTML = '<p style="text-align:center;padding:20px;color:var(--text-light);">لا توجد إشعارات</p>';
    } else {
        notifications.forEach(n => {
            const div = document.createElement('div');
            div.className = `notif-item ${n.type}`;
            const icons = { success: '✅', warning: '⚠️', danger: '❌', info: '📌' };
            div.innerHTML = `
                <span class="notif-icon">${icons[n.type] || '📌'}</span>
                <span class="notif-text">${n.text}</span>
                <span class="notif-time">${n.time}</span>
            `;
            list.appendChild(div);
        });
    }
    document.getElementById('notifModal').style.display = 'block';
}

function checkAlerts() {
    items.forEach(item => {
        if ((item.stock || 0) < (item.minStock || 5)) {
            addNotification('warning', `⚠️ مخزون منخفض: ${item.name} (${item.stock}/${item.minStock})`);
        }
    });
    customers.forEach(c => {
        if ((c.balance || 0) > (c.creditLimit || 0) && (c.creditLimit || 0) > 0) {
            addNotification('danger', `❌ ${c.name} تجاوز حد الائتمان`);
        }
    });
    checkAutoPurchase();
}

// ================================================================
// التقارير المنبثقة
// ================================================================
function generateReport(type) {
    const names = {
        'balance': 'ميزان المراجعة',
        'income': 'قائمة الدخل',
        'financial': 'المركز المالي',
        'sales': 'تقرير المبيعات',
        'inventory': 'تقرير المخزون',
        'customers': 'تقرير العملاء',
        'cashflow': 'التدفق النقدي',
        'profit': 'تحليل الأرباح'
    };
    document.getElementById('reportMainTitle').textContent = names[type] || 'تقرير';
    document.getElementById('reportTitle').innerHTML = `<i class="fas fa-file-alt"></i> ${names[type] || 'تقرير'}`;
    document.getElementById('reportDate').textContent = new Date().toLocaleDateString('ar-EG');
    const companyName = document.getElementById('companyName').value || 'شركة راشد للتجارة و التوزيع';
    const companyPhone = document.getElementById('companyPhone').value || '01158767633';
    const companyEmail = document.getElementById('companyEmail').value || 'rashedrbae20081217@gmail.com';
    const companyAddress = document.getElementById('companyAddress').value || 'العنوان';
    const companyTax = document.getElementById('companyTax').value || 'الرقم التجاري';
    document.getElementById('reportCompanyName').textContent = companyName;
    document.getElementById('reportCompanyInfo').innerHTML = `${companyAddress} | ت: ${companyPhone} | ${companyEmail} | الرقم الضريبي: ${companyTax}`;
    const summary = document.getElementById('reportSummary');
    const thead = document.getElementById('reportThead');
    const tbody = document.getElementById('reportTbody');
    const totalSales = sales.reduce((s, x) => s + (x.total || 0), 0);
    const totalPurchases = purchases.reduce((s, x) => s + (x.total || 0), 0);
    const totalStock = items.reduce((s, i) => s + ((i.stock || 0) * (i.salePrice || 0)), 0);
    summary.innerHTML = `
        <div class="summary-grid">
            <div class="summary-stat"><span>إجمالي المبيعات</span><strong>${totalSales.toFixed(2)} جنيه</strong></div>
            <div class="summary-stat"><span>إجمالي المشتريات</span><strong>${totalPurchases.toFixed(2)} جنيه</strong></div>
            <div class="summary-stat"><span>قيمة المخزون</span><strong>${totalStock.toFixed(2)} جنيه</strong></div>
            <div class="summary-stat"><span>رصيد الخزينة</span><strong>${treasuryBalance.toFixed(2)} جنيه</strong></div>
        </div>
    `;
    if (type === 'balance') {
        thead.innerHTML = `<tr><th>الحساب</th><th>مدين</th><th>دائن</th></tr>`;
        let totalDebit = 0, totalCredit = 0;
        const rows = [
            ['الخزينة', treasuryBalance > 0 ? treasuryBalance : 0, treasuryBalance < 0 ? Math.abs(treasuryBalance) : 0],
            ['العملاء', customers.reduce((s, c) => s + ((c.balance || 0) > 0 ? c.balance : 0), 0), 0],
            ['الموردين', 0, Math.abs(suppliers.reduce((s, c) => s + ((c.balance || 0) < 0 ? c.balance : 0), 0))],
            ['المخزون', totalStock, 0]
        ];
        rows.forEach(r => { totalDebit += r[1]; totalCredit += r[2]; });
        tbody.innerHTML = rows.map(r => `<tr><td>${r[0]}</td><td>${r[1] ? r[1].toFixed(2) : '-'}</td><td>${r[2] ? r[2].toFixed(2) : '-'}</td></tr>`).join('');
        tbody.innerHTML += `<tr style="font-weight:bold;border-top:2px solid #000;"><td>الإجمالي</td><td>${totalDebit.toFixed(2)}</td><td>${totalCredit.toFixed(2)}</td></tr>`;
    } else if (type === 'income') {
        thead.innerHTML = `<tr><th>البيان</th><th>المبلغ</th></tr>`;
        const profit = totalSales - totalPurchases;
        tbody.innerHTML = `
            <tr><td>الإيرادات (المبيعات)</td><td>${totalSales.toFixed(2)}</td></tr>
            <tr><td>المصروفات (المشتريات)</td><td>${totalPurchases.toFixed(2)}</td></tr>
            <tr style="font-weight:bold;border-top:2px solid #000;"><td>صافي الربح</td><td style="color:${profit >= 0 ? '#22c55e' : '#ef4444'};">${profit.toFixed(2)}</td></tr>
        `;
    } else if (type === 'financial') {
        thead.innerHTML = `<tr><th>البيان</th><th>المبلغ</th></tr>`;
        const assets = treasuryBalance + totalStock + customers.reduce((s, c) => s + ((c.balance || 0) > 0 ? c.balance : 0), 0);
        const liabilities = Math.abs(suppliers.reduce((s, c) => s + ((c.balance || 0) < 0 ? c.balance : 0), 0));
        const equity = assets - liabilities;
        tbody.innerHTML = `
            <tr style="font-weight:bold;"><td>الأصول</td><td>${assets.toFixed(2)}</td></tr>
            <tr><td style="padding-right:20px;">- الخزينة</td><td>${treasuryBalance.toFixed(2)}</td></tr>
            <tr><td style="padding-right:20px;">- المخزون</td><td>${totalStock.toFixed(2)}</td></tr>
            <tr><td style="padding-right:20px;">- العملاء</td><td>${customers.reduce((s, c) => s + ((c.balance || 0) > 0 ? c.balance : 0), 0).toFixed(2)}</td></tr>
            <tr style="font-weight:bold;"><td>الخصوم</td><td>${liabilities.toFixed(2)}</td></tr>
            <tr><td style="padding-right:20px;">- الموردين</td><td>${liabilities.toFixed(2)}</td></tr>
            <tr style="font-weight:bold;border-top:2px solid #000;"><td>حقوق الملكية</td><td style="color:#22c55e;">${equity.toFixed(2)}</td></tr>
        `;
    } else if (type === 'sales') {
        thead.innerHTML = `<tr><th>رقم الفاتورة</th><th>التاريخ</th><th>العميل</th><th>الإجمالي</th><th>الحالة</th><th>شروط الدفع</th></tr>`;
        tbody.innerHTML = sales.length ? sales.map(s => `<tr><td>${s.invoiceNo}</td><td>${s.date}</td><td>${s.customer}</td><td>${(s.total || 0).toFixed(2)}</td><td><span class="status ${s.status === 'مدفوعة' ? 'paid' : 'pending'}">${s.status || 'مدفوعة'}</span></td><td>${s.paymentTerms || 'فوري'}</td></tr>`).join('') : '<tr><td colspan="6" style="text-align:center;">لا توجد مبيعات</td></tr>';
    } else if (type === 'inventory') {
        thead.innerHTML = `<tr><th>الكود</th><th>اسم الصنف</th><th>الوحدة</th><th>سعر البيع</th><th>الكمية</th><th>الحد الأدنى</th><th>القيمة</th></tr>`;
        tbody.innerHTML = items.length ? items.map(i => `<tr><td>${i.code}</td><td>${i.name}</td><td>${i.unit || 'قطعة'}</td><td>${(i.salePrice || 0).toFixed(2)}</td><td>${i.stock || 0}</td><td>${i.minStock || 5}</td><td>${((i.stock || 0) * (i.salePrice || 0)).toFixed(2)}</td></tr>`).join('') : '<tr><td colspan="7" style="text-align:center;">لا توجد أصناف</td></tr>';
    } else if (type === 'customers') {
        thead.innerHTML = `<tr><th>الاسم</th><th>النوع</th><th>الهاتف</th><th>الرصيد</th><th>حد الائتمان</th></tr>`;
        tbody.innerHTML = customers.length ? customers.map(c => `<tr><td>${c.name}</td><td>${c.type || 'عميل'}</td><td>${c.phone || '-'}</td><td>${(c.balance || 0).toFixed(2)}</td><td>${(c.creditLimit || 0).toFixed(2)}</td></tr>`).join('') : '<tr><td colspan="5" style="text-align:center;">لا يوجد عملاء</td></tr>';
    } else if (type === 'cashflow') {
        thead.innerHTML = `<tr><th>البيان</th><th>المبلغ</th></tr>`;
        const netCash = treasuryIncome - treasuryExpense;
        tbody.innerHTML = `
            <tr><td>إجمالي التدفقات الداخلة</td><td style="color:#22c55e;">${treasuryIncome.toFixed(2)}</td></tr>
            <tr><td>إجمالي التدفقات الخارجة</td><td style="color:#ef4444;">${treasuryExpense.toFixed(2)}</td></tr>
            <tr style="font-weight:bold;border-top:2px solid #000;"><td>صافي التدفق النقدي</td><td style="color:${netCash >= 0 ? '#22c55e' : '#ef4444'};">${netCash.toFixed(2)}</td></tr>
            <tr><td>الرصيد النهائي</td><td>${treasuryBalance.toFixed(2)}</td></tr>
        `;
    } else if (type === 'profit') {
        thead.innerHTML = `<tr><th>الصنف</th><th>سعر البيع</th><th>سعر الشراء</th><th>الربح</th><th>الهامش %</th></tr>`;
        tbody.innerHTML = items.length ? items.map(i => {
            const profit = (i.salePrice || 0) - (i.purchasePrice || 0);
            const margin = i.salePrice ? ((profit / i.salePrice) * 100).toFixed(2) : 0;
            return `<tr><td>${i.name}</td><td>${(i.salePrice || 0).toFixed(2)}</td><td>${(i.purchasePrice || 0).toFixed(2)}</td><td style="color:${profit >= 0 ? '#22c55e' : '#ef4444'};">${profit.toFixed(2)}</td><td>${margin}%</td></tr>`;
        }).join('') : '<tr><td colspan="5" style="text-align:center;">لا توجد أصناف</td></tr>';
    }
    document.getElementById('reportModal').style.display = 'block';
    logAction('فتح تقرير', { type: names[type] });
    addNotification('info', `📊 تم فتح تقرير ${names[type]}`);
}

// ================================================================
// طباعة وتصدير التقارير
// ================================================================
function printReport() {
    const content = document.getElementById('reportBody');
    const win = window.open('', '_blank');
    win.document.write(`
        <html><head><title>تقرير</title>
        <style>
            body{font-family:'Cairo',sans-serif;padding:20px;direction:rtl;}
            table{width:100%;border-collapse:collapse;margin-top:10px;}
            th,td{border:1px solid #ddd;padding:6px;text-align:center;}
            th{background:#f5f5f5;font-weight:bold;}
            .summary-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin:10px 0;}
            .summary-stat{background:#f8f9fa;padding:8px;border-radius:6px;text-align:center;}
            .summary-stat strong{display:block;font-size:16px;}
            .status.paid{color:#155724;}.status.pending{color:#856404;}.status.unpaid{color:#721c24;}
            .report-footer{margin-top:15px;padding-top:8px;border-top:1px solid #ddd;text-align:center;color:#999;font-size:11px;}
            .report-header{display:flex;justify-content:space-between;border-bottom:2px solid #000;padding-bottom:8px;margin-bottom:10px;}
        </style>
        </head><body>
    `);
    win.document.write(content.innerHTML);
    win.document.write(`</body></html>`);
    win.document.close();
    win.print();
}

function exportReportPDF() {
    const el = document.getElementById('reportBody');
    html2pdf().from(el).save(`تقرير_${document.getElementById('reportMainTitle').textContent}.pdf`);
    addNotification('success', '✅ تم تصدير PDF');
}

function exportReportExcel() {
    const table = document.getElementById('reportTable');
    if (!table || table.querySelectorAll('tr').length === 0) { alert('لا توجد بيانات'); return; }
    const ws = XLSX.utils.table_to_sheet(table);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'تقرير');
    XLSX.writeFile(wb, `تقرير_${document.getElementById('reportMainTitle').textContent}.xlsx`);
    addNotification('success', '✅ تم تصدير Excel');
}

function exportToExcel(data, name) {
    if (!data || data.length === 0) { alert('لا توجد بيانات'); return; }
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, name);
    XLSX.writeFile(wb, `${name}.xlsx`);
    addNotification('success', `✅ تم تصدير ${name}`);
}

function exportAllData() {
    const all = { customers, suppliers, items, sales, purchases, salesReturns, purchasesReturns, treasuryTransactions, leads, quotations, auditLog };
    const blob = new Blob([JSON.stringify(all, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `نسخة_احتياطية_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    logAction('تصدير نسخة احتياطية', {});
    addNotification('success', '✅ تم تصدير النسخة الاحتياطية');
}

function printInvoiceContent(type) {
    const idMap = {
        'sale': 'saleInvoiceContent',
        'purchase': 'purchaseInvoiceContent',
        'sale-return': 'saleReturnContent',
        'purchase-return': 'purchaseReturnContent'
    };
    const content = document.getElementById(idMap[type]);
    if (!content) return;
    const win = window.open('', '_blank');
    win.document.write(`
        <html><head><title>فاتورة</title>
        <style>
            body{font-family:'Cairo',sans-serif;padding:20px;direction:rtl;}
            table{width:100%;border-collapse:collapse;}
            th,td{border:1px solid #ddd;padding:6px;text-align:center;}
            th{background:#f5f5f5;}
        </style>
        </head><body>
    `);
    win.document.write(content.innerHTML);
    win.document.write(`</body></html>`);
    win.document.close();
    win.print();
}

// ================================================================
// رفع اللوجو
// ================================================================
document.getElementById('logoUpload').addEventListener('change', async function(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(ev) {
        document.getElementById('logoPreview').innerHTML = `<img src="${ev.target.result}" alt="شعار">`;
    };
    reader.readAsDataURL(file);
    try {
        const ref = storage.ref(`logos/${Date.now()}_${file.name}`);
        await ref.put(file);
        const url = await ref.getDownloadURL();
        await db.collection('company').doc('info').update({ logo: url });
        logAction('رفع شعار', {});
        addNotification('success', '✅ تم رفع الشعار');
    } catch (e) {
        console.error(e);
        addNotification('danger', '❌ خطأ في رفع الشعار');
    }
});

// ================================================================
// Dark Mode
// ================================================================
function toggleDarkMode() {
    darkMode = !darkMode;
    document.body.classList.toggle('dark-mode');
    document.getElementById('darkIcon').className = darkMode ? 'fas fa-sun' : 'fas fa-moon';
    localStorage.setItem('darkMode', JSON.stringify(darkMode));
}
document.getElementById('darkModeToggle').addEventListener('click', toggleDarkMode);
if (localStorage.getItem('darkMode') === 'true') {
    document.body.classList.add('dark-mode');
    document.getElementById('darkIcon').className = 'fas fa-sun';
}

// ================================================================
// حفظ بيانات الشركة
// ================================================================
document.getElementById('companyForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    await db.collection('company').doc('info').set(getCompanyData(), { merge: true });
    logAction('حفظ بيانات الشركة', {});
    addNotification('success', '✅ تم حفظ بيانات الشركة');
});

// ================================================================
// التنقل
// ================================================================
document.querySelectorAll('nav a').forEach(link => {
    link.addEventListener('click', function(e) {
        if (this.id === 'logoutBtn') return;
        e.preventDefault();
        document.querySelectorAll('nav a').forEach(a => a.classList.remove('active'));
        this.classList.add('active');
        document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
        document.getElementById(`page-${this.dataset.page}`).classList.add('active');
        document.querySelector('.page-title').textContent = this.textContent.trim();
        document.querySelector('.sidebar').classList.remove('open');
        if (this.dataset.page === 'dashboard') {
            setTimeout(() => { drawChart(); updateTopItems(); }, 100);
        }
    });
});

document.querySelectorAll('.tabs-header .tab-btn').forEach(btn => {
    btn.addEventListener('click', function() {
        const parent = this.closest('.tabs-container');
        parent.querySelectorAll('.tabs-header .tab-btn').forEach(b => b.classList.remove('active'));
        this.classList.add('active');
        parent.querySelectorAll('.tabs-body .tab-panel').forEach(p => p.classList.remove('active'));
        document.getElementById(this.dataset.tab).classList.add('active');
    });
});

// ================================================================
// الرسم البياني
// ================================================================
function drawChart() {
    const canvas = document.getElementById('salesChart');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const rect = canvas.parentElement.getBoundingClientRect();
    const width = rect.width - 30;
    const height = 180;
    canvas.width = width;
    canvas.height = height;
    const data = sales.length > 0 ? sales.map(s => s.total || 0) : [12000, 19000, 15000, 22000, 18000, 25000];
    const max = Math.max(...data, 1);
    const barWidth = Math.min((width - 50) / Math.max(data.length, 6) - 4, 30);
    const startX = 25;
    ctx.fillStyle = 'var(--bg)';
    ctx.fillRect(0, 0, width, height);
    data.forEach((value, index) => {
        const x = startX + index * (barWidth + 4);
        const barHeight = (value / max) * (height - 50);
        const y = height - 18 - barHeight;
        const gradient = ctx.createLinearGradient(x, y, x, height - 18);
        gradient.addColorStop(0, '#4fc3f7');
        gradient.addColorStop(1, '#0288d1');
        ctx.fillStyle = gradient;
        ctx.shadowColor = 'rgba(79,195,247,0.25)';
        ctx.shadowBlur = 4;
        ctx.beginPath();
        ctx.roundRect(x, y, barWidth, barHeight, 3);
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.fillStyle = 'var(--text)';
        ctx.font = '9px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(value.toLocaleString(), x + barWidth / 2, y - 3);
        const months = ['يناير','فبراير','مارس','ابريل','مايو','يونيو','يوليو','اغسطس','سبتمبر','اكتوبر','نوفمبر','ديسمبر'];
        ctx.fillStyle = 'var(--text-light)';
        ctx.font = '8px Arial';
        ctx.fillText(months[index % 12], x + barWidth / 2, height - 3);
    });
}

function updateTopItems() {
    const container = document.getElementById('topItems');
    if (!container) return;
    const sorted = [...items].sort((a, b) => (b.stock || 0) - (a.stock || 0)).slice(0, 5);
    container.innerHTML = sorted.length ? sorted.map(i => `<div class="top-item"><span class="item-name">${i.name}</span><span class="item-sales">${i.stock || 0} وحدة</span></div>`).join('') : '<div class="top-item">لا توجد أصناف</div>';
}

// ================================================================
// مودال Lead و Quotation
// ================================================================
document.getElementById('leadForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const name = document.getElementById('leadName').value.trim();
    if (!name) { alert('أدخل الاسم'); return; }
    addLead(
        name,
        document.getElementById('leadPhone').value || '',
        document.getElementById('leadSource').value,
        'جديد',
        document.getElementById('leadNotes').value || ''
    );
    closeModal('leadModal');
    this.reset();
});

document.getElementById('quotationForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const customer = document.getElementById('quotationCustomer').value;
    const grandTotal = parseFloat(document.getElementById('quotationGrandTotal').textContent) || 0;
    const validity = parseInt(document.getElementById('quotationValidity').value) || 30;
    if (!customer) { alert('اختر العميل'); return; }
    if (grandTotal === 0) { alert('أضف منتجات'); return; }
    const items = [];
    const rows = document.querySelectorAll('#quotationItems .item-row');
    rows.forEach(row => {
        const name = row.querySelector('.item-name').value;
        const qty = parseFloat(row.querySelector('.item-qty').value) || 0;
        const price = parseFloat(row.querySelector('.item-price').value) || 0;
        const discount = parseFloat(row.querySelector('.item-discount').value) || 0;
        const total = parseFloat(row.querySelector('.item-total').value) || 0;
        if (name && qty > 0) {
            items.push({ name, qty, price, discount, total });
        }
    });
    addQuotation(customer, items, grandTotal, validity);
    closeModal('quotationModal');
    this.reset();
});

function calcQuotationTotal() {
    const rows = document.querySelectorAll('#quotationItems .item-row');
    let grandTotal = 0;
    rows.forEach(row => {
        const qty = parseFloat(row.querySelector('.item-qty').value) || 0;
        const price = parseFloat(row.querySelector('.item-price').value) || 0;
        const discount = parseFloat(row.querySelector('.item-discount').value) || 0;
        const total = (qty * price) - discount;
        row.querySelector('.item-total').value = total.toFixed(2);
        grandTotal += total;
    });
    document.getElementById('quotationGrandTotal').textContent = grandTotal.toFixed(2);
}

function addQuotationRow() {
    const tbody = document.getElementById('quotationItems');
    const row = document.createElement('tr');
    row.className = 'item-row';
    row.innerHTML = `
        <td><input type="text" class="item-name" placeholder="اسم الصنف" onchange="calcQuotationTotal()"></td>
        <td><input type="number" class="item-qty" value="1" oninput="calcQuotationTotal()"></td>
        <td><input type="number" class="item-price" value="0" oninput="calcQuotationTotal()"></td>
        <td><input type="number" class="item-discount" value="0" oninput="calcQuotationTotal()"></td>
        <td><input type="number" class="item-total" value="0" readonly></td>
        <td><button type="button" class="btn-delete-sm" onclick="removeQuotationRow(this)"><i class="fas fa-times"></i></button></td>
    `;
    tbody.appendChild(row);
    calcQuotationTotal();
}

function removeQuotationRow(btn) {
    const tbody = document.getElementById('quotationItems');
    if (tbody.querySelectorAll('.item-row').length <= 1) { alert('يجب أن يكون صف واحد على الأقل'); return; }
    btn.closest('tr').remove();
    calcQuotationTotal();
}

// ================================================================
// Polyfill
// ================================================================
if (!CanvasRenderingContext2D.prototype.roundRect) {
    CanvasRenderingContext2D.prototype.roundRect = function(x, y, w, h, r) {
        if (r > w/2) r = w/2;
        if (r > h/2) r = h/2;
        this.moveTo(x + r, y);
        this.arcTo(x + w, y, x + w, y + h, r);
        this.arcTo(x + w, y + h, x, y + h, r);
        this.arcTo(x, y + h, x, y, r);
        this.arcTo(x, y, x + w, y, r);
        return this;
    };
}

console.log('🔥✅ النظام المحاسبي المتكامل - النسخة الاحترافية جاهز');
console.log('📧 admin@example.com | 🔑 123456');
console.log('📱 شغال على الكمبيوتر والموبايل');
console.log('☁️ سحابة Firebase للمزامنة بين الأجهزة');
console.log('🏆 يحتوي على: Leads, Quotations, QR Code, WhatsApp, Audit Log, Barcode, Inventory, Auto Purchase');
