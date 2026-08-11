// ================================================================
// 🔥 Firebase Config (بتاعك)
// ================================================================
const firebaseConfig = {
    apiKey: "AIzaSyDZlzKX7urPYIiLI8dKjUmmMarS17sKseo",
    authDomain: "accounting-system-4695d.firebaseapp.com",
    databaseURL: "https://accounting-system-4695d-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "accounting-system-4695d",
    storageBucket: "accounting-system-4695d.firebasestorage.app",
    messagingSenderId: "577360785300",
    appId: "1:577360785300:web:cc55782157a77546fea981",
    measurementId: "G-T1BWE2NZCP"
};

// ================================================================
// تهيئة Firebase
// ================================================================
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const auth = firebase.auth();
const storage = firebase.storage();

// تمكين الإتصال بدون إنترنت
db.enablePersistence().catch(err => console.log('⚠️ Persistence:', err));

// ================================================================
// المتغيرات العامة
// ================================================================
let customers = [], suppliers = [], items = [], warehouses = [], sales = [], purchases = [];
let salesReturns = [], purchasesReturns = [], treasuryTransactions = [];
let customerId = 1, supplierId = 1, itemId = 1, warehouseId = 1;
let treasuryBalance = 0, treasuryIncome = 0, treasuryExpense = 0;
let currentUser = null;
let notifications = [];
let darkMode = false;
let isOnline = navigator.onLine;

// ================================================================
// التهيئة
// ================================================================
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(() => document.getElementById('loader').style.display = 'none', 400);
    const now = new Date();
    document.querySelectorAll('.date-display').forEach(el => {
        el.textContent = now.toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' });
    });
    // حالة الإتصال
    window.addEventListener('online', () => { isOnline = true; document.getElementById('onlineStatus').textContent = '🟢 متصل'; });
    window.addEventListener('offline', () => { isOnline = false; document.getElementById('onlineStatus').textContent = '🔴 غير متصل'; });
    // تحميل الثيم
    if (localStorage.getItem('darkMode') === 'true') {
        document.body.classList.add('dark-mode');
        document.getElementById('darkIcon').className = 'fas fa-sun';
    }
});

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
        
        treasuryBalance = treasuryTransactions.reduce((s, t) => s + (t.debit||0) - (t.credit||0), 0);
        treasuryIncome = treasuryTransactions.reduce((s, t) => s + (t.debit||0), 0);
        treasuryExpense = treasuryTransactions.reduce((s, t) => s + (t.credit||0), 0);
        
        customerId = customers.length ? Math.max(...customers.map(c => c.id)) + 1 : 1;
        supplierId = suppliers.length ? Math.max(...suppliers.map(s => s.id)) + 1 : 1;
        itemId = items.length ? Math.max(...items.map(i => i.id)) + 1 : 1;
        warehouseId = warehouses.length ? Math.max(...warehouses.map(w => w.id)) + 1 : 1;
        
        // تحميل بيانات الشركة
        const companyDoc = await db.collection('company').doc('info').get();
        if (companyDoc.exists) {
            const data = companyDoc.data();
            document.getElementById('companyName').value = data.name || '';
            document.getElementById('companyReg').value = data.reg || '';
            document.getElementById('companyTax').value = data.tax || '';
            document.getElementById('companyAddress').value = data.address || '';
            document.getElementById('companyPhone').value = data.phone || '';
            document.getElementById('companyEmail').value = data.email || '';
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
    } catch (e) {
        console.error('Load error:', e);
        addNotification('danger', '❌ خطأ في تحميل البيانات');
    }
}

// ================================================================
// حفظ كل البيانات
// ================================================================
async function saveAllData() {
    if (!isOnline) { addNotification('warning', '⚠️ غير متصل، سيتم الحفظ محلياً'); return; }
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

// ================================================================
// مزامنة
// ================================================================
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
            name, email, role: 'user', createdAt: new Date().toISOString()
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
    loadAllData();
}

function showSignup() {
    document.getElementById('loginForm').style.display = 'none';
    document.getElementById('signupForm').style.display = 'block';
}
function showLogin() {
    document.getElementById('loginForm').style.display = 'block';
    document.getElementById('signupForm').style.display = 'none';
}

// ================================================================
// مراقبة حالة المستخدم
// ================================================================
auth.onAuthStateChanged(user => {
    if (user) {
        const name = user.displayName || user.email.split('@')[0];
        currentUser = name;
        document.getElementById('loginScreen').style.display = 'none';
        document.getElementById('app').style.display = 'flex';
        document.getElementById('userNameDisplay').textContent = name;
        document.getElementById('headerUserName').textContent = name;
        loadAllData();
    }
});

// ================================================================
// تسجيل الخروج
// ================================================================
document.getElementById('logoutBtn').addEventListener('click', async function(e) {
    e.preventDefault();
    if (confirm('تسجيل الخروج؟')) {
        await auth.signOut();
        document.getElementById('app').style.display = 'none';
        document.getElementById('loginScreen').style.display = 'flex';
    }
});

// ================================================================
// تحديث الواجهة
// ================================================================
function updateAllUI() {
    // إحصائيات
    let totalSales = sales.reduce((s, x) => s + (x.total || 0), 0);
    let totalPurchases = purchases.reduce((s, x) => s + (x.total || 0), 0);
    let totalStock = items.reduce((s, i) => s + ((i.stock || 0) * (i.salePrice || 0)), 0);
    document.getElementById('totalSales').textContent = totalSales.toLocaleString();
    document.getElementById('totalPurchases').textContent = totalPurchases.toLocaleString();
    document.getElementById('totalStock').textContent = totalStock.toLocaleString();
    document.getElementById('treasuryBalance').textContent = treasuryBalance.toLocaleString();
    document.getElementById('treasuryCurrentBalance').textContent = treasuryBalance.toFixed(2) + ' جنيه';
    document.getElementById('treasuryIncome').textContent = treasuryIncome.toFixed(2) + ' جنيه';
    document.getElementById('treasuryExpense').textContent = treasuryExpense.toFixed(2) + ' جنيه';
    document.getElementById('customerCount').textContent = customers.length;
    document.getElementById('supplierCount').textContent = suppliers.length;

    // العملاء
    let ct = document.getElementById('customersList');
    ct.innerHTML = '';
    customers.forEach(c => {
        let row = document.createElement('tr');
        row.innerHTML = `<td>${c.name}</td><td>${c.phone || '-'}</td><td>${(c.balance || 0).toFixed(2)}</td><td>${(c.creditLimit || 0).toFixed(2)}</td><td><button class="btn-delete" onclick="deleteCustomer(${c.id})"><i class="fas fa-trash"></i></button></td>`;
        ct.appendChild(row);
    });

    // الموردين
    let st = document.getElementById('suppliersList');
    st.innerHTML = '';
    suppliers.forEach(s => {
        let row = document.createElement('tr');
        row.innerHTML = `<td>${s.name}</td><td>${s.phone || '-'}</td><td>${(s.balance || 0).toFixed(2)}</td><td>${(s.creditLimit || 0).toFixed(2)}</td><td><button class="btn-delete" onclick="deleteSupplier(${s.id})"><i class="fas fa-trash"></i></button></td>`;
        st.appendChild(row);
    });

    // الأصناف
    let it = document.getElementById('itemsList');
    it.innerHTML = '';
    items.forEach(i => {
        let row = document.createElement('tr');
        row.innerHTML = `<td>${i.code}</td><td>${i.name}</td><td>${i.unit || 'قطعة'}</td><td>${(i.salePrice || 0).toFixed(2)}</td><td>${i.stock || 0}</td><td><button class="btn-delete" onclick="deleteItem(${i.id})"><i class="fas fa-trash"></i></button></td>`;
        it.appendChild(row);
    });

    // المبيعات
    let sl = document.getElementById('salesList');
    sl.innerHTML = '';
    sales.forEach(s => {
        let row = document.createElement('tr');
        row.innerHTML = `<td>${s.invoiceNo}</td><td>${s.date}</td><td>${s.customer}</td><td>${(s.total || 0).toFixed(2)}</td><td><span class="status ${s.status === 'مدفوعة' ? 'paid' : 'pending'}">${s.status || 'مدفوعة'}</span></td><td><button class="btn-delete" onclick="deleteSale(${s.id})"><i class="fas fa-trash"></i></button></td>`;
        sl.appendChild(row);
    });

    // المشتريات
    let pl = document.getElementById('purchasesList');
    pl.innerHTML = '';
    purchases.forEach(p => {
        let row = document.createElement('tr');
        row.innerHTML = `<td>${p.invoiceNo}</td><td>${p.date}</td><td>${p.supplier}</td><td>${(p.total || 0).toFixed(2)}</td><td><span class="status ${p.status === 'مدفوعة' ? 'paid' : 'pending'}">${p.status || 'مدفوعة'}</span></td><td><button class="btn-delete" onclick="deletePurchase(${p.id})"><i class="fas fa-trash"></i></button></td>`;
        pl.appendChild(row);
    });

    // الخزينة
    let tt = document.getElementById('treasuryTransactions');
    tt.innerHTML = '';
    treasuryTransactions.forEach(t => {
        let row = document.createElement('tr');
        row.innerHTML = `<td>${t.date}</td><td>${t.desc}</td><td>${t.debit ? t.debit.toFixed(2) : '-'}</td><td>${t.credit ? t.credit.toFixed(2) : '-'}</td>`;
        tt.appendChild(row);
    });

    // المرتجعات
    let srt = document.getElementById('salesReturnsList');
    srt.innerHTML = '';
    salesReturns.forEach(r => {
        let row = document.createElement('tr');
        row.innerHTML = `<td>${r.returnNo}</td><td>${r.date}</td><td>${r.invoiceNo}</td><td>${r.party}</td><td>${(r.amount || 0).toFixed(2)}</td>`;
        srt.appendChild(row);
    });
    let prt = document.getElementById('purchasesReturnsList');
    prt.innerHTML = '';
    purchasesReturns.forEach(r => {
        let row = document.createElement('tr');
        row.innerHTML = `<td>${r.returnNo}</td><td>${r.date}</td><td>${r.invoiceNo}</td><td>${r.party}</td><td>${(r.amount || 0).toFixed(2)}</td>`;
        prt.appendChild(row);
    });

    // المخازن
    let wg = document.getElementById('warehousesGrid');
    wg.innerHTML = '';
    warehouses.forEach(w => {
        let card = document.createElement('div');
        card.className = 'warehouse-card';
        card.innerHTML = `<h3><i class="fas fa-warehouse"></i> ${w.name}</h3><p>${w.location || ''}</p><div class="warehouse-stats"><span>الأصناف: ${items.length}</span></div>`;
        wg.appendChild(card);
    });

    // آخر الفواتير
    let rt = document.getElementById('recentInvoicesList');
    rt.innerHTML = '';
    let recent = [...sales].slice(-5).reverse();
    recent.forEach(s => {
        let row = document.createElement('tr');
        row.innerHTML = `<td>${s.invoiceNo}</td><td>${s.customer}</td><td>${(s.total || 0).toFixed(2)}</td><td><span class="status ${s.status === 'مدفوعة' ? 'paid' : 'pending'}">${s.status || 'مدفوعة'}</span></td>`;
        rt.appendChild(row);
    });

    updateCustomerSelects();
    updateSupplierSelects();

    if (isOnline) saveAllData();
    document.getElementById('lastUpdate').textContent = new Date().toLocaleString('ar-EG');
}

function updateCustomerSelects() {
    let sel = document.getElementById('saleCustomerSelect');
    if (!sel) return;
    sel.innerHTML = '<option value="">-- اختر --</option>';
    customers.forEach(c => {
        let opt = document.createElement('option');
        opt.value = c.name;
        opt.textContent = c.name;
        sel.appendChild(opt);
    });
}

function updateSupplierSelects() {
    let sel = document.getElementById('purchaseSupplierSelect');
    if (!sel) return;
    sel.innerHTML = '<option value="">-- اختر --</option>';
    suppliers.forEach(s => {
        let opt = document.createElement('option');
        opt.value = s.name;
        opt.textContent = s.name;
        sel.appendChild(opt);
    });
}

// ================================================================
// البحث
// ================================================================
function filterTable(input, tableId) {
    let q = input.value.toLowerCase();
    document.querySelectorAll(`#${tableId} tr`).forEach(row => {
        row.style.display = row.textContent.toLowerCase().includes(q) ? '' : 'none';
    });
}

// ================================================================
// المودالات
// ================================================================
function showModal(id) { document.getElementById(id).style.display = 'block'; }
function closeModal(id) { document.getElementById(id).style.display = 'none'; }
window.onclick = function(e) { if (e.target.classList.contains('modal')) e.target.style.display = 'none'; };

// ================================================================
// العملاء والموردين
// ================================================================
document.getElementById('customerForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    let name = document.getElementById('custName').value.trim();
    if (!name) { alert('أدخل الاسم'); return; }
    let c = { id: customerId++, name, phone: document.getElementById('custPhone').value || '', creditLimit: parseFloat(document.getElementById('custCreditLimit').value) || 0, balance: 0 };
    customers.push(c);
    await saveToFirebase('customers', c.id, c);
    updateAllUI();
    closeModal('customerModal');
    this.reset();
    addNotification('success', `✅ تم إضافة ${name}`);
});

document.getElementById('supplierForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    let name = document.getElementById('suppName').value.trim();
    if (!name) { alert('أدخل الاسم'); return; }
    let s = { id: supplierId++, name, phone: document.getElementById('suppPhone').value || '', creditLimit: parseFloat(document.getElementById('suppCreditLimit').value) || 0, balance: 0 };
    suppliers.push(s);
    await saveToFirebase('suppliers', s.id, s);
    updateAllUI();
    closeModal('supplierModal');
    this.reset();
    addNotification('success', `✅ تم إضافة ${name}`);
});

async function deleteCustomer(id) {
    if (confirm('حذف العميل؟')) {
        customers = customers.filter(c => c.id !== id);
        await deleteFromFirebase('customers', id);
        updateAllUI();
        addNotification('warning', 'تم الحذف');
    }
}
async function deleteSupplier(id) {
    if (confirm('حذف المورد؟')) {
        suppliers = suppliers.filter(s => s.id !== id);
        await deleteFromFirebase('suppliers', id);
        updateAllUI();
        addNotification('warning', 'تم الحذف');
    }
}

// ================================================================
// الأصناف
// ================================================================
document.getElementById('itemForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    let code = document.getElementById('itemCode').value.trim();
    let name = document.getElementById('itemName').value.trim();
    if (!code || !name) { alert('أدخل الكود والاسم'); return; }
    let item = { id: itemId++, code, name, unit: document.getElementById('itemUnit').value, salePrice: parseFloat(document.getElementById('itemSalePrice').value) || 0, stock: parseInt(document.getElementById('itemStock').value) || 0 };
    items.push(item);
    await saveToFirebase('items', item.id, item);
    updateAllUI();
    closeModal('itemModal');
    this.reset();
    addNotification('success', `✅ تم إضافة ${name}`);
});

async function deleteItem(id) {
    if (confirm('حذف الصنف؟')) {
        items = items.filter(i => i.id !== id);
        await deleteFromFirebase('items', id);
        updateAllUI();
        addNotification('warning', 'تم الحذف');
    }
}

// ================================================================
// المخازن
// ================================================================
document.getElementById('warehouseForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    let name = document.getElementById('warehouseName').value.trim();
    if (!name) { alert('أدخل الاسم'); return; }
    let w = { id: warehouseId++, name, location: document.getElementById('warehouseLocation').value || '' };
    warehouses.push(w);
    await saveToFirebase('warehouses', w.id, w);
    updateAllUI();
    closeModal('warehouseModal');
    this.reset();
    addNotification('success', `✅ تم إضافة ${name}`);
});

// ================================================================
// الخزينة
// ================================================================
document.getElementById('transactionForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    let type = document.getElementById('transactionType').value;
    let desc = document.getElementById('transactionDesc').value.trim();
    let amount = parseFloat(document.getElementById('transactionAmount').value);
    if (!desc || !amount) { alert('أدخل البيان والمبلغ'); return; }
    let date = new Date().toISOString().split('T')[0];
    let trans;
    if (type === 'income') {
        treasuryBalance += amount;
        treasuryIncome += amount;
        trans = { id: Date.now(), date, desc, debit: amount, credit: 0 };
    } else {
        treasuryBalance -= amount;
        treasuryExpense += amount;
        trans = { id: Date.now(), date, desc, debit: 0, credit: amount };
    }
    treasuryTransactions.push(trans);
    await saveToFirebase('treasury', trans.id, trans);
    updateAllUI();
    closeModal('transactionModal');
    this.reset();
    addNotification('success', '✅ تم تسجيل الحركة');
});

// ================================================================
// الفواتير
// ================================================================
function openSaleInvoice() {
    document.getElementById('saleInvoiceModal').style.display = 'block';
    document.getElementById('saleInvoiceDate').value = new Date().toISOString().split('T')[0];
    document.getElementById('saleInvoiceNo').value = `INV-${String(sales.length + 1).padStart(4, '0')}`;
    updateCustomerSelects();
    document.getElementById('saleInvoiceItems').innerHTML = `<tr class="item-row"><td><input type="text" class="item-name" placeholder="الصنف"></td><td><input type="number" class="item-qty" value="1" oninput="calcRowTotal(this,'sale')"></td><td><input type="number" class="item-price" value="0" oninput="calcRowTotal(this,'sale')"></td><td><input type="number" class="item-discount" value="0" oninput="calcRowTotal(this,'sale')"></td><td><input type="number" class="item-total" value="0" readonly></td><td><button type="button" class="btn-delete-sm" onclick="removeRow(this,'sale')"><i class="fas fa-times"></i></button></td></tr>`;
    calcInvoiceTotal('sale');
}

function openPurchaseInvoice() {
    document.getElementById('purchaseInvoiceModal').style.display = 'block';
    document.getElementById('purchaseInvoiceDate').value = new Date().toISOString().split('T')[0];
    document.getElementById('purchaseInvoiceNo').value = `PUR-${String(purchases.length + 1).padStart(4, '0')}`;
    updateSupplierSelects();
    document.getElementById('purchaseInvoiceItems').innerHTML = `<tr class="item-row"><td><input type="text" class="item-name" placeholder="الصنف"></td><td><input type="number" class="item-qty" value="1" oninput="calcRowTotal(this,'purchase')"></td><td><input type="number" class="item-price" value="0" oninput="calcRowTotal(this,'purchase')"></td><td><input type="number" class="item-discount" value="0" oninput="calcRowTotal(this,'purchase')"></td><td><input type="number" class="item-total" value="0" readonly></td><td><button type="button" class="btn-delete-sm" onclick="removeRow(this,'purchase')"><i class="fas fa-times"></i></button></td></tr>`;
    calcInvoiceTotal('purchase');
}

function addRow(type) {
    let container = document.getElementById(type === 'sale' ? 'saleInvoiceItems' : 'purchaseInvoiceItems');
    let row = document.createElement('tr');
    row.className = 'item-row';
    row.innerHTML = `<td><input type="text" class="item-name" placeholder="الصنف"></td><td><input type="number" class="item-qty" value="1" oninput="calcRowTotal(this,'${type}')"></td><td><input type="number" class="item-price" value="0" oninput="calcRowTotal(this,'${type}')"></td><td><input type="number" class="item-discount" value="0" oninput="calcRowTotal(this,'${type}')"></td><td><input type="number" class="item-total" value="0" readonly></td><td><button type="button" class="btn-delete-sm" onclick="removeRow(this,'${type}')"><i class="fas fa-times"></i></button></td>`;
    container.appendChild(row);
    calcInvoiceTotal(type);
}

function removeRow(btn, type) {
    let container = document.getElementById(type === 'sale' ? 'saleInvoiceItems' : 'purchaseInvoiceItems');
    if (container.querySelectorAll('.item-row').length <= 1) { alert('يجب أن يكون صف واحد'); return; }
    btn.closest('tr').remove();
    calcInvoiceTotal(type);
}

function calcRowTotal(el, type) {
    let row = el.closest('tr');
    let qty = parseFloat(row.querySelector('.item-qty').value) || 0;
    let price = parseFloat(row.querySelector('.item-price').value) || 0;
    let discount = parseFloat(row.querySelector('.item-discount').value) || 0;
    row.querySelector('.item-total').value = ((qty * price) - discount).toFixed(2);
    calcInvoiceTotal(type);
}

function calcInvoiceTotal(type) {
    let container = document.getElementById(type === 'sale' ? 'saleInvoiceItems' : 'purchaseInvoiceItems');
    let grandTotal = 0;
    container.querySelectorAll('.item-row').forEach(row => {
        grandTotal += parseFloat(row.querySelector('.item-total').value) || 0;
    });
    let prefix = type === 'sale' ? 'sale' : 'purchase';
    document.getElementById(`${prefix}GrandTotal`).textContent = grandTotal.toFixed(2);
}

// ================================================================
// حفظ الفواتير
// ================================================================
document.getElementById('saleInvoiceForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    let customer = document.getElementById('saleCustomerSelect').value;
    let grandTotal = parseFloat(document.getElementById('saleGrandTotal').textContent) || 0;
    let invoiceNo = document.getElementById('saleInvoiceNo').value;
    let date = document.getElementById('saleInvoiceDate').value;
    if (!customer) { alert('اختر العميل'); return; }
    if (grandTotal === 0) { alert('أضف منتجات'); return; }
    let tax = grandTotal * 0.14;
    let subtotal = grandTotal - tax;
    let sale = { id: sales.length + 1, invoiceNo, date, customer, subtotal, tax, total: grandTotal, status: 'مدفوعة', payment: document.getElementById('salePaymentMethod').value };
    sales.push(sale);
    await saveToFirebase('sales', sale.id, sale);
    let trans = { id: Date.now(), date, desc: `مبيعات - ${invoiceNo}`, debit: grandTotal, credit: 0 };
    treasuryTransactions.push(trans);
    treasuryBalance += grandTotal;
    treasuryIncome += grandTotal;
    await saveToFirebase('treasury', trans.id, trans);
    updateAllUI();
    closeModal('saleInvoiceModal');
    addNotification('success', `✅ فاتورة ${invoiceNo} بقيمة ${grandTotal.toFixed(2)}`);
});

document.getElementById('purchaseInvoiceForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    let supplier = document.getElementById('purchaseSupplierSelect').value;
    let grandTotal = parseFloat(document.getElementById('purchaseGrandTotal').textContent) || 0;
    let invoiceNo = document.getElementById('purchaseInvoiceNo').value;
    let date = document.getElementById('purchaseInvoiceDate').value;
    if (!supplier) { alert('اختر المورد'); return; }
    if (grandTotal === 0) { alert('أضف منتجات'); return; }
    let tax = grandTotal * 0.14;
    let subtotal = grandTotal - tax;
    let purchase = { id: purchases.length + 1, invoiceNo, date, supplier, subtotal, tax, total: grandTotal, status: 'مدفوعة', payment: document.getElementById('purchasePaymentMethod').value };
    purchases.push(purchase);
    await saveToFirebase('purchases', purchase.id, purchase);
    let trans = { id: Date.now(), date, desc: `مشتريات - ${invoiceNo}`, debit: 0, credit: grandTotal };
    treasuryTransactions.push(trans);
    treasuryBalance -= grandTotal;
    treasuryExpense += grandTotal;
    await saveToFirebase('treasury', trans.id, trans);
    updateAllUI();
    closeModal('purchaseInvoiceModal');
    addNotification('success', `✅ فاتورة شراء ${invoiceNo} بقيمة ${grandTotal.toFixed(2)}`);
});

// ================================================================
// المرتجعات
// ================================================================
function openReturnModal(type) {
    document.getElementById('returnModal').style.display = 'block';
    document.getElementById('returnType').value = type;
}

document.getElementById('returnForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    let type = document.getElementById('returnType').value;
    let invoiceNo = document.getElementById('returnInvoiceNo').value.trim();
    let party = document.getElementById('returnParty').value.trim();
    let amount = parseFloat(document.getElementById('returnAmount').value);
    if (!invoiceNo || !party || !amount) { alert('املأ الحقول'); return; }
    let date = new Date().toISOString().split('T')[0];
    let returnNo = (type === 'sales' ? 'SR-' : 'PR-') + String((type === 'sales' ? salesReturns.length : purchasesReturns.length) + 1).padStart(3, '0');
    let ret, trans;
    if (type === 'sales') {
        ret = { id: salesReturns.length + 1, returnNo, date, invoiceNo, party, amount, reason: 'مرتجع' };
        salesReturns.push(ret);
        trans = { id: Date.now(), date, desc: `مرتجع مبيعات - ${returnNo}`, debit: 0, credit: amount };
        treasuryBalance -= amount;
        treasuryExpense += amount;
    } else {
        ret = { id: purchasesReturns.length + 1, returnNo, date, invoiceNo, party, amount, reason: 'مرتجع' };
        purchasesReturns.push(ret);
        trans = { id: Date.now(), date, desc: `مرتجع مشتريات - ${returnNo}`, debit: amount, credit: 0 };
        treasuryBalance += amount;
        treasuryIncome += amount;
    }
    treasuryTransactions.push(trans);
    await saveToFirebase(type === 'sales' ? 'salesReturns' : 'purchasesReturns', ret.id, ret);
    await saveToFirebase('treasury', trans.id, trans);
    updateAllUI();
    closeModal('returnModal');
    this.reset();
    addNotification('success', `✅ تم تسجيل ${returnNo}`);
});

// ================================================================
// حذف الفواتير
// ================================================================
async function deleteSale(id) {
    if (confirm('حذف الفاتورة؟')) {
        sales = sales.filter(s => s.id !== id);
        await deleteFromFirebase('sales', id);
        updateAllUI();
        addNotification('warning', 'تم الحذف');
    }
}
async function deletePurchase(id) {
    if (confirm('حذف الفاتورة؟')) {
        purchases = purchases.filter(p => p.id !== id);
        await deleteFromFirebase('purchases', id);
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
    let list = document.getElementById('notifList');
    list.innerHTML = '';
    if (notifications.length === 0) {
        list.innerHTML = '<p style="text-align:center;padding:20px;color:var(--text-light);">لا توجد إشعارات</p>';
    } else {
        notifications.forEach(n => {
            let div = document.createElement('div');
            div.className = `notif-item ${n.type}`;
            let icons = { success: '✅', warning: '⚠️', danger: '❌', info: '📌' };
            div.innerHTML = `<span class="notif-icon">${icons[n.type] || '📌'}</span><span class="notif-text">${n.text}</span><span class="notif-time">${n.time}</span>`;
            list.appendChild(div);
        });
    }
    document.getElementById('notifModal').style.display = 'block';
}

function checkAlerts() {
    items.forEach(item => {
        if ((item.stock || 0) < 10) {
            addNotification('warning', `⚠️ مخزون منخفض: ${item.name} (${item.stock})`);
        }
    });
    customers.forEach(c => {
        if ((c.balance || 0) > (c.creditLimit || 0) && (c.creditLimit || 0) > 0) {
            addNotification('danger', `❌ ${c.name} تجاوز حد الائتمان`);
        }
    });
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
        'cashflow': 'التدفق النقدي'
    };

    document.getElementById('reportMainTitle').textContent = names[type] || 'تقرير';
    document.getElementById('reportTitle').innerHTML = `<i class="fas fa-file-alt"></i> ${names[type] || 'تقرير'}`;
    document.getElementById('reportDate').textContent = new Date().toLocaleDateString('ar-EG');

    let companyName = document.getElementById('companyName').value || 'شركة النيل للتجارة';
    let companyInfo = `${document.getElementById('companyAddress').value || 'القاهرة'} | ت: ${document.getElementById('companyPhone').value || '+20 100 123 4567'}`;
    document.getElementById('reportCompanyName').textContent = companyName;
    document.getElementById('reportCompanyInfo').textContent = companyInfo;

    let summary = document.getElementById('reportSummary');
    let thead = document.getElementById('reportThead');
    let tbody = document.getElementById('reportTbody');

    let totalSales = sales.reduce((s, x) => s + (x.total || 0), 0);
    let totalPurchases = purchases.reduce((s, x) => s + (x.total || 0), 0);
    let totalStock = items.reduce((s, i) => s + ((i.stock || 0) * (i.salePrice || 0)), 0);

    summary.innerHTML = `
        <div class="summary-grid">
            <div class="summary-stat"><span>إجمالي المبيعات</span><strong>${totalSales.toFixed(2)} جنيه</strong></div>
            <div class="summary-stat"><span>إجمالي المشتريات</span><strong>${totalPurchases.toFixed(2)} جنيه</strong></div>
            <div class="summary-stat"><span>قيمة المخزون</span><strong>${totalStock.toFixed(2)} جنيه</strong></div>
            <div class="summary-stat"><span>رصيد الخزينة</span><strong>${treasuryBalance.toFixed(2)} جنيه</strong></div>
        </div>
    `;

    // بناء التقرير حسب النوع
    if (type === 'balance') {
        thead.innerHTML = `<tr><th>الحساب</th><th>مدين</th><th>دائن</th></tr>`;
        let totalDebit = 0, totalCredit = 0;
        let rows = [
            ['الخزينة', treasuryBalance > 0 ? treasuryBalance : 0, treasuryBalance < 0 ? Math.abs(treasuryBalance) : 0],
            ['العملاء', customers.reduce((s, c) => s + ((c.balance || 0) > 0 ? c.balance : 0), 0), 0],
            ['الموردين', 0, Math.abs(suppliers.reduce((s, c) => s + ((c.balance || 0) < 0 ? c.balance : 0), 0))],
            ['المخزون', totalStock, 0]
        ];
        rows.forEach(r => { totalDebit += r[1]; totalCredit += r[2]; });
        tbody.innerHTML = rows.map(r => `<tr><td>${r[0]}</td><td>${r[1] ? r[1].toFixed(2) : '-'}</td><td>${r[2] ? r[2].toFixed(2) : '-'}</td></tr>`).join('');
        tbody.innerHTML += `<tr style="font-weight:bold;border-top:2px solid #000;"><td>الإجمالي</td><td>${totalDebit.toFixed(2)}</td><td>${totalCredit.toFixed(2)}</td></tr>`;
    }
    else if (type === 'income') {
        thead.innerHTML = `<tr><th>البيان</th><th>المبلغ</th></tr>`;
        let profit = totalSales - totalPurchases;
        tbody.innerHTML = `
            <tr><td>الإيرادات (المبيعات)</td><td>${totalSales.toFixed(2)}</td></tr>
            <tr><td>المصروفات (المشتريات)</td><td>${totalPurchases.toFixed(2)}</td></tr>
            <tr style="font-weight:bold;border-top:2px solid #000;"><td>صافي الربح</td><td style="color:${profit >= 0 ? '#22c55e' : '#ef4444'};">${profit.toFixed(2)}</td></tr>
        `;
    }
    else if (type === 'financial') {
        thead.innerHTML = `<tr><th>البيان</th><th>المبلغ</th></tr>`;
        let assets = treasuryBalance + totalStock + customers.reduce((s, c) => s + ((c.balance || 0) > 0 ? c.balance : 0), 0);
        let liabilities = Math.abs(suppliers.reduce((s, c) => s + ((c.balance || 0) < 0 ? c.balance : 0), 0));
        let equity = assets - liabilities;
        tbody.innerHTML = `
            <tr style="font-weight:bold;"><td>الأصول</td><td>${assets.toFixed(2)}</td></tr>
            <tr><td style="padding-right:20px;">- الخزينة</td><td>${treasuryBalance.toFixed(2)}</td></tr>
            <tr><td style="padding-right:20px;">- المخزون</td><td>${totalStock.toFixed(2)}</td></tr>
            <tr><td style="padding-right:20px;">- العملاء</td><td>${customers.reduce((s, c) => s + ((c.balance || 0) > 0 ? c.balance : 0), 0).toFixed(2)}</td></tr>
            <tr style="font-weight:bold;"><td>الخصوم</td><td>${liabilities.toFixed(2)}</td></tr>
            <tr><td style="padding-right:20px;">- الموردين</td><td>${liabilities.toFixed(2)}</td></tr>
            <tr style="font-weight:bold;border-top:2px solid #000;"><td>حقوق الملكية</td><td style="color:#22c55e;">${equity.toFixed(2)}</td></tr>
        `;
    }
    else if (type === 'sales') {
        thead.innerHTML = `<tr><th>رقم الفاتورة</th><th>التاريخ</th><th>العميل</th><th>الإجمالي</th><th>الحالة</th></tr>`;
        tbody.innerHTML = sales.length ? sales.map(s => `<tr><td>${s.invoiceNo}</td><td>${s.date}</td><td>${s.customer}</td><td>${(s.total || 0).toFixed(2)}</td><td><span class="status ${s.status === 'مدفوعة' ? 'paid' : 'pending'}">${s.status || 'مدفوعة'}</span></td></tr>`).join('') : '<tr><td colspan="5" style="text-align:center;">لا توجد مبيعات</td></tr>';
    }
    else if (type === 'inventory') {
        thead.innerHTML = `<tr><th>الكود</th><th>اسم الصنف</th><th>الوحدة</th><th>سعر البيع</th><th>الكمية</th><th>القيمة</th></tr>`;
        tbody.innerHTML = items.length ? items.map(i => `<tr><td>${i.code}</td><td>${i.name}</td><td>${i.unit || 'قطعة'}</td><td>${(i.salePrice || 0).toFixed(2)}</td><td>${i.stock || 0}</td><td>${((i.stock || 0) * (i.salePrice || 0)).toFixed(2)}</td></tr>`).join('') : '<tr><td colspan="6" style="text-align:center;">لا توجد أصناف</td></tr>';
    }
    else if (type === 'customers') {
        thead.innerHTML = `<tr><th>الاسم</th><th>الهاتف</th><th>الرصيد</th><th>حد الائتمان</th><th>الحالة</th></tr>`;
        tbody.innerHTML = customers.length ? customers.map(c => `<tr><td>${c.name}</td><td>${c.phone || '-'}</td><td>${(c.balance || 0).toFixed(2)}</td><td>${(c.creditLimit || 0).toFixed(2)}</td><td><span class="status ${(c.balance || 0) > (c.creditLimit || 0) && (c.creditLimit || 0) > 0 ? 'unpaid' : 'paid'}">${(c.balance || 0) > (c.creditLimit || 0) && (c.creditLimit || 0) > 0 ? 'تجاوز' : 'جيد'}</span></td></tr>`).join('') : '<tr><td colspan="5" style="text-align:center;">لا يوجد عملاء</td></tr>';
    }
    else if (type === 'cashflow') {
        thead.innerHTML = `<tr><th>البيان</th><th>المبلغ</th></tr>`;
        let netCash = treasuryIncome - treasuryExpense;
        tbody.innerHTML = `
            <tr><td>إجمالي التدفقات الداخلة</td><td style="color:#22c55e;">${treasuryIncome.toFixed(2)}</td></tr>
            <tr><td>إجمالي التدفقات الخارجة</td><td style="color:#ef4444;">${treasuryExpense.toFixed(2)}</td></tr>
            <tr style="font-weight:bold;border-top:2px solid #000;"><td>صافي التدفق النقدي</td><td style="color:${netCash >= 0 ? '#22c55e' : '#ef4444'};">${netCash.toFixed(2)}</td></tr>
            <tr><td>الرصيد النهائي</td><td>${treasuryBalance.toFixed(2)}</td></tr>
        `;
    }

    document.getElementById('reportModal').style.display = 'block';
    addNotification('info', `📊 تم فتح تقرير ${names[type]}`);
}

// ================================================================
// طباعة وتصدير التقارير
// ================================================================
function printReport() {
    let content = document.getElementById('reportBody');
    let win = window.open('', '_blank');
    win.document.write(`<html><head><title>تقرير</title><style>
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
    </style></head><body>`);
    win.document.write(content.innerHTML);
    win.document.write(`</body></html>`);
    win.document.close();
    win.print();
}

function exportReportPDF() {
    let el = document.getElementById('reportBody');
    html2pdf().from(el).save(`تقرير_${document.getElementById('reportMainTitle').textContent}.pdf`);
    addNotification('success', '✅ تم تصدير PDF');
}

function exportReportExcel() {
    let table = document.getElementById('reportTable');
    if (!table || table.querySelectorAll('tr').length === 0) { alert('لا توجد بيانات'); return; }
    let ws = XLSX.utils.table_to_sheet(table);
    let wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'تقرير');
    XLSX.writeFile(wb, `تقرير_${document.getElementById('reportMainTitle').textContent}.xlsx`);
    addNotification('success', '✅ تم تصدير Excel');
}

// ================================================================
// تصدير البيانات
// ================================================================
function exportToExcel(data, name) {
    if (!data || data.length === 0) { alert('لا توجد بيانات'); return; }
    let ws = XLSX.utils.json_to_sheet(data);
    let wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, name);
    XLSX.writeFile(wb, `${name}.xlsx`);
    addNotification('success', `✅ تم تصدير ${name}`);
}

function exportAllData() {
    let all = { customers, suppliers, items, sales, purchases, treasuryTransactions };
    let blob = new Blob([JSON.stringify(all, null, 2)], { type: 'application/json' });
    let a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `نسخة_احتياطية_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    addNotification('success', '✅ تم تصدير النسخة الاحتياطية');
}

function exportInvoicePDF(type) {
    let id = type === 'sale' ? 'saleInvoiceContent' : 'purchaseInvoiceContent';
    let el = document.getElementById(id);
    if (!el) { alert('لا توجد فاتورة'); return; }
    html2pdf().from(el).save(`${type === 'sale' ? 'فاتورة_مبيعات' : 'فاتورة_مشتريات'}.pdf`);
    addNotification('success', '✅ تم تصدير PDF');
}

function printInvoiceContent(type) {
    let id = type === 'sale' ? 'saleInvoiceContent' : 'purchaseInvoiceContent';
    let content = document.getElementById(id);
    if (!content) return;
    let win = window.open('', '_blank');
    win.document.write(`<html><head><title>فاتورة</title><style>body{font-family:'Cairo',sans-serif;padding:20px;direction:rtl;}table{width:100%;border-collapse:collapse;}th,td{border:1px solid #ddd;padding:6px;text-align:center;}th{background:#f5f5f5;}</style></head><body>`);
    win.document.write(content.innerHTML);
    win.document.write(`</body></html>`);
    win.document.close();
    win.print();
}

// ================================================================
// رفع اللوجو
// ================================================================
document.getElementById('logoUpload').addEventListener('change', async function(e) {
    let file = e.target.files[0];
    if (!file) return;
    let reader = new FileReader();
    reader.onload = function(ev) {
        document.getElementById('logoPreview').innerHTML = `<img src="${ev.target.result}" alt="شعار">`;
    };
    reader.readAsDataURL(file);
    try {
        let ref = storage.ref(`logos/${Date.now()}_${file.name}`);
        await ref.put(file);
        let url = await ref.getDownloadURL();
        await db.collection('company').doc('info').update({ logo: url });
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
        if (this.dataset.page === 'dashboard') { setTimeout(() => { drawChart(); updateTopItems(); }, 100); }
    });
});

document.querySelector('.menu-toggle').addEventListener('click', function() {
    document.querySelector('.sidebar').classList.toggle('open');
});

// ================================================================
// تبويبات
// ================================================================
document.querySelectorAll('.tabs-header .tab-btn').forEach(btn => {
    btn.addEventListener('click', function() {
        let parent = this.closest('.tabs-container');
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
    let canvas = document.getElementById('salesChart');
    if (!canvas) return;
    let ctx = canvas.getContext('2d');
    let rect = canvas.parentElement.getBoundingClientRect();
    let width = rect.width - 30;
    let height = 180;
    canvas.width = width;
    canvas.height = height;
    let data = sales.length > 0 ? sales.map(s => s.total || 0) : [12000, 19000, 15000, 22000, 18000, 25000];
    let max = Math.max(...data, 1);
    let bw = Math.min((width - 50) / Math.max(data.length, 6) - 4, 30);
    let sx = 25;
    ctx.fillStyle = 'var(--bg)';
    ctx.fillRect(0, 0, width, height);
    data.forEach((v, i) => {
        let x = sx + i * (bw + 4);
        let bh = (v / max) * (height - 50);
        let y = height - 18 - bh;
        let grad = ctx.createLinearGradient(x, y, x, height - 18);
        grad.addColorStop(0, '#4fc3f7');
        grad.addColorStop(1, '#0288d1');
        ctx.fillStyle = grad;
        ctx.shadowColor = 'rgba(79,195,247,0.25)';
        ctx.shadowBlur = 4;
        ctx.beginPath();
        ctx.roundRect(x, y, bw, bh, 3);
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.fillStyle = 'var(--text)';
        ctx.font = '9px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(v.toLocaleString(), x + bw/2, y - 3);
        let months = ['يناير','فبراير','مارس','ابريل','مايو','يونيو','يوليو','اغسطس','سبتمبر','اكتوبر','نوفمبر','ديسمبر'];
        ctx.fillStyle = 'var(--text-light)';
        ctx.font = '8px Arial';
        ctx.fillText(months[i % 12], x + bw/2, height - 3);
    });
}

function updateTopItems() {
    let container = document.getElementById('topItems');
    if (!container) return;
    let sorted = [...items].sort((a, b) => (b.stock || 0) - (a.stock || 0)).slice(0, 5);
    container.innerHTML = sorted.length ? sorted.map(i => `<div class="top-item"><span class="item-name">${i.name}</span><span class="item-sales">${i.stock || 0} وحدة</span></div>`).join('') : '<div class="top-item">لا توجد أصناف</div>';
}

// ================================================================
// Polyfill roundRect
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

console.log('🔥✅ النظام المحاسبي مع Firebase جاهز');
console.log('📧 admin@example.com | 🔑 123456');
console.log('📱 شغال على الكمبيوتر والموبايل');
console.log('☁️ سحابة Firebase للمزامنة بين الأجهزة');
