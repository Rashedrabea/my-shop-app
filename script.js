// ============================================
// ⚠️ IMPORTANT: حط الـ Config بتاعك هنا
// ============================================
const firebaseConfig = {
    apiKey: "AIzaSy...",      // <-- اكتب الـ API Key بتاعك
    authDomain: "your-project.firebaseapp.com",
    projectId: "your-project",
    storageBucket: "your-project.appspot.com",
    messagingSenderId: "123456789",
    appId: "1:123456789:web:abcdef"
};

// ===== تهيئة Firebase =====
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const auth = firebase.auth();
const storage = firebase.storage();

// تمكين الإتصال بدون إنترنت
db.enablePersistence().catch(err => console.log('Persistence:', err));

// ===== المتغيرات =====
let customers = [], suppliers = [], items = [], warehouses = [], sales = [], purchases = [];
let salesReturns = [], purchasesReturns = [], treasuryTransactions = [];
let customerId = 1, supplierId = 1, itemId = 1, warehouseId = 1;
let treasuryBalance = 0, treasuryIncome = 0, treasuryExpense = 0;
const TAX_RATE = 0.14;
let currentUser = null;
let notifications = [];
let darkMode = false;
let isOnline = navigator.onLine;

// ===== التهيئة =====
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(() => document.getElementById('loader').style.display = 'none', 500);
    const now = new Date();
    document.querySelectorAll('.date-display').forEach(el => {
        el.textContent = now.toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' });
    });
    // مراقبة حالة الإتصال
    window.addEventListener('online', () => { isOnline = true; document.getElementById('onlineStatus').textContent = '🟢 متصل'; });
    window.addEventListener('offline', () => { isOnline = false; document.getElementById('onlineStatus').textContent = '🔴 غير متصل'; });
});

// ===== دوال Firebase =====
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
        snapshot.forEach(doc => data.push({ id: parseInt(doc.id), ...doc.data() }));
        return data;
    } catch (e) { console.error('Get error:', e); return []; }
}

// ===== تحميل كل البيانات =====
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

// ===== حفظ كل البيانات =====
async function saveAllData() {
    if (!isOnline) { addNotification('warning', '⚠️ لا يوجد اتصال بالإنترنت، سيتم الحفظ محلياً'); return; }
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
        // حفظ الشركة
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

// ===== مزامنة البيانات =====
async function syncData() {
    document.getElementById('syncIcon').className = 'fas fa-spinner fa-spin';
    await loadAllData();
    document.getElementById('syncIcon').className = 'fas fa-sync';
    addNotification('success', '✅ تم مزامنة البيانات');
}

// ===== تسجيل الدخول =====
document.getElementById('loginForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value;
    const pass = document.getElementById('loginPass').value;
    try {
        await auth.signInWithEmailAndPassword(email, pass);
        currentUser = email.split('@')[0];
        afterLogin();
    } catch (error) {
        alert('❌ ' + error.message);
    }
});

// ===== إنشاء حساب =====
document.getElementById('signupForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    const name = document.getElementById('signupName').value;
    const email = document.getElementById('signupEmail').value;
    const pass = document.getElementById('signupPass').value;
    try {
        const userCredential = await auth.createUserWithEmailAndPassword(email, pass);
        await db.collection('users').doc(userCredential.user.uid).set({ name, email, role: 'user', createdAt: new Date().toISOString() });
        currentUser = name;
        afterLogin();
    } catch (error) {
        alert('❌ ' + error.message);
    }
});

// ===== دخول بجوجل =====
async function loginWithGoogle() {
    try {
        const provider = new firebase.auth.GoogleAuthProvider();
        const result = await auth.signInWithPopup(provider);
        currentUser = result.user.displayName || result.user.email.split('@')[0];
        afterLogin();
    } catch (error) {
        alert('❌ ' + error.message);
    }
}

function afterLogin() {
    document.getElementById('loginScreen').style.display = 'none';
    document.getElementById('app').style.display = 'flex';
    document.getElementById('userNameDisplay').textContent = currentUser;
    document.getElementById('headerUserName').textContent = currentUser;
    loadAllData();
}

// ===== مراقبة حالة المستخدم =====
auth.onAuthStateChanged(user => {
    if (user) {
        currentUser = user.email.split('@')[0];
        document.getElementById('loginScreen').style.display = 'none';
        document.getElementById('app').style.display = 'flex';
        document.getElementById('userNameDisplay').textContent = currentUser;
        document.getElementById('headerUserName').textContent = currentUser;
        loadAllData();
    }
});

// ===== تسجيل الخروج =====
document.getElementById('logoutBtn').addEventListener('click', async function(e) {
    e.preventDefault();
    if (confirm('تسجيل الخروج؟')) {
        await auth.signOut();
        document.getElementById('app').style.display = 'none';
        document.getElementById('loginScreen').style.display = 'flex';
    }
});

// ===== تبديل بين تسجيل الدخول والتسجيل =====
function showSignup() {
    document.getElementById('loginForm').style.display = 'none';
    document.getElementById('signupForm').style.display = 'block';
}
function showLogin() {
    document.getElementById('loginForm').style.display = 'block';
    document.getElementById('signupForm').style.display = 'none';
}

// ===== تحديث الواجهة =====
function updateAllUI() {
    // تحديث الإحصائيات
    let totalSales = sales.reduce((s, x) => s + x.total, 0);
    let totalPurchases = purchases.reduce((s, x) => s + x.total, 0);
    let totalStock = items.reduce((s, i) => s + (i.stock * i.salePrice), 0);
    document.getElementById('totalSales').textContent = totalSales.toLocaleString();
    document.getElementById('totalPurchases').textContent = totalPurchases.toLocaleString();
    document.getElementById('totalStock').textContent = totalStock.toLocaleString();
    document.getElementById('treasuryBalance').textContent = treasuryBalance.toLocaleString();
    document.getElementById('treasuryCurrentBalance').textContent = treasuryBalance.toFixed(2) + ' جنيه';
    document.getElementById('treasuryIncome').textContent = treasuryIncome.toFixed(2) + ' جنيه';
    document.getElementById('treasuryExpense').textContent = treasuryExpense.toFixed(2) + ' جنيه';
    document.getElementById('customerCount').textContent = customers.length;
    document.getElementById('supplierCount').textContent = suppliers.length;

    // قائمة العملاء
    let custTbody = document.getElementById('customersList');
    custTbody.innerHTML = '';
    customers.forEach(c => {
        let row = document.createElement('tr');
        row.innerHTML = `<td>${c.name}</td><td>${c.phone || '-'}</td><td>${c.balance || 0}</td><td>${c.creditLimit || 0}</td><td><button class="btn-delete" onclick="deleteCustomer(${c.id})"><i class="fas fa-trash"></i></button></td>`;
        custTbody.appendChild(row);
    });

    // قائمة الموردين
    let suppTbody = document.getElementById('suppliersList');
    suppTbody.innerHTML = '';
    suppliers.forEach(s => {
        let row = document.createElement('tr');
        row.innerHTML = `<td>${s.name}</td><td>${s.phone || '-'}</td><td>${s.balance || 0}</td><td>${s.creditLimit || 0}</td><td><button class="btn-delete" onclick="deleteSupplier(${s.id})"><i class="fas fa-trash"></i></button></td>`;
        suppTbody.appendChild(row);
    });

    // قائمة الأصناف
    let itemsTbody = document.getElementById('itemsList');
    itemsTbody.innerHTML = '';
    items.forEach(i => {
        let row = document.createElement('tr');
        row.innerHTML = `<td>${i.code}</td><td>${i.name}</td><td>${i.unit}</td><td>${i.salePrice || 0}</td><td>${i.stock || 0}</td><td><button class="btn-delete" onclick="deleteItem(${i.id})"><i class="fas fa-trash"></i></button></td>`;
        itemsTbody.appendChild(row);
    });

    // قائمة المبيعات
    let salesTbody = document.getElementById('salesList');
    salesTbody.innerHTML = '';
    sales.forEach(s => {
        let row = document.createElement('tr');
        row.innerHTML = `<td>${s.invoiceNo}</td><td>${s.date}</td><td>${s.customer}</td><td>${s.total}</td><td><span class="status ${s.status === 'مدفوعة' ? 'paid' : 'pending'}">${s.status}</span></td><td><button class="btn-delete" onclick="deleteSale(${s.id})"><i class="fas fa-trash"></i></button></td>`;
        salesTbody.appendChild(row);
    });

    // قائمة المشتريات
    let purchTbody = document.getElementById('purchasesList');
    purchTbody.innerHTML = '';
    purchases.forEach(p => {
        let row = document.createElement('tr');
        row.innerHTML = `<td>${p.invoiceNo}</td><td>${p.date}</td><td>${p.supplier}</td><td>${p.total}</td><td><span class="status ${p.status === 'مدفوعة' ? 'paid' : 'pending'}">${p.status}</span></td><td><button class="btn-delete" onclick="deletePurchase(${p.id})"><i class="fas fa-trash"></i></button></td>`;
        purchTbody.appendChild(row);
    });

    // الخزينة
    let treasTbody = document.getElementById('treasuryTransactions');
    treasTbody.innerHTML = '';
    treasuryTransactions.forEach(t => {
        let row = document.createElement('tr');
        row.innerHTML = `<td>${t.date}</td><td>${t.desc}</td><td>${t.debit || '-'}</td><td>${t.credit || '-'}</td>`;
        treasTbody.appendChild(row);
    });

    // المرتجعات
    let srTbody = document.getElementById('salesReturnsList');
    srTbody.innerHTML = '';
    salesReturns.forEach(r => {
        let row = document.createElement('tr');
        row.innerHTML = `<td>${r.returnNo}</td><td>${r.date}</td><td>${r.invoiceNo}</td><td>${r.party}</td><td>${r.amount}</td>`;
        srTbody.appendChild(row);
    });
    let prTbody = document.getElementById('purchasesReturnsList');
    prTbody.innerHTML = '';
    purchasesReturns.forEach(r => {
        let row = document.createElement('tr');
        row.innerHTML = `<td>${r.returnNo}</td><td>${r.date}</td><td>${r.invoiceNo}</td><td>${r.party}</td><td>${r.amount}</td>`;
        prTbody.appendChild(row);
    });

    // المخازن
    let whGrid = document.getElementById('warehousesGrid');
    whGrid.innerHTML = '';
    warehouses.forEach(w => {
        let card = document.createElement('div');
        card.className = 'warehouse-card';
        card.innerHTML = `<h3>${w.name}</h3><p>${w.location || ''}</p><div class="warehouse-stats"><span>الأصناف: ${items.length}</span></div>`;
        whGrid.appendChild(card);
    });

    // آخر الفواتير
    let recentTbody = document.getElementById('recentInvoicesList');
    recentTbody.innerHTML = '';
    let recent = [...sales].slice(-5).reverse();
    recent.forEach(s => {
        let row = document.createElement('tr');
        row.innerHTML = `<td>${s.invoiceNo}</td><td>${s.customer}</td><td>${s.total}</td><td><span class="status ${s.status === 'مدفوعة' ? 'paid' : 'pending'}">${s.status}</span></td>`;
        recentTbody.appendChild(row);
    });

    // تحديث قوائم الفواتير
    updateCustomerSelects();
    updateSupplierSelects();

    // حفظ في Firebase
    if (isOnline) saveAllData();
    document.getElementById('lastUpdate').textContent = new Date().toLocaleString('ar-EG');
}

function updateCustomerSelects() {
    let select = document.getElementById('saleCustomerSelect');
    if (!select) return;
    select.innerHTML = '<option value="">-- اختر --</option>';
    customers.forEach(c => {
        let opt = document.createElement('option');
        opt.value = c.name;
        opt.textContent = c.name;
        select.appendChild(opt);
    });
}

function updateSupplierSelects() {
    let select = document.getElementById('purchaseSupplierSelect');
    if (!select) return;
    select.innerHTML = '<option value="">-- اختر --</option>';
    suppliers.forEach(s => {
        let opt = document.createElement('option');
        opt.value = s.name;
        opt.textContent = s.name;
        select.appendChild(opt);
    });
}

// ===== البحث =====
function filterTable(input, tableId) {
    let query = input.value.toLowerCase();
    document.querySelectorAll(`#${tableId} tr`).forEach(row => {
        row.style.display = row.textContent.toLowerCase().includes(query) ? '' : 'none';
    });
}

// ===== المودالات =====
function showModal(id) { document.getElementById(id).style.display = 'block'; }
function closeModal(id) { document.getElementById(id).style.display = 'none'; }
window.onclick = function(e) { if (e.target.classList.contains('modal')) e.target.style.display = 'none'; };

// ===== إضافة عميل =====
document.getElementById('customerForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    let name = document.getElementById('custName').value.trim();
    if (!name) { alert('أدخل الاسم'); return; }
    let newCustomer = { id: customerId++, name, phone: document.getElementById('custPhone').value || '', creditLimit: parseFloat(document.getElementById('custCreditLimit').value) || 0, balance: 0 };
    customers.push(newCustomer);
    await saveToFirebase('customers', newCustomer.id, newCustomer);
    updateAllUI();
    closeModal('customerModal');
    this.reset();
    addNotification('success', `✅ تم إضافة ${name}`);
});

// ===== إضافة مورد =====
document.getElementById('supplierForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    let name = document.getElementById('suppName').value.trim();
    if (!name) { alert('أدخل الاسم'); return; }
    let newSupplier = { id: supplierId++, name, phone: document.getElementById('suppPhone').value || '', creditLimit: parseFloat(document.getElementById('suppCreditLimit').value) || 0, balance: 0 };
    suppliers.push(newSupplier);
    await saveToFirebase('suppliers', newSupplier.id, newSupplier);
    updateAllUI();
    closeModal('supplierModal');
    this.reset();
    addNotification('success', `✅ تم إضافة ${name}`);
});

// ===== حذف عميل =====
async function deleteCustomer(id) {
    if (confirm('حذف العميل؟')) {
        customers = customers.filter(c => c.id !== id);
        await deleteFromFirebase('customers', id);
        updateAllUI();
        addNotification('warning', 'تم الحذف');
    }
}

// ===== حذف مورد =====
async function deleteSupplier(id) {
    if (confirm('حذف المورد؟')) {
        suppliers = suppliers.filter(s => s.id !== id);
        await deleteFromFirebase('suppliers', id);
        updateAllUI();
        addNotification('warning', 'تم الحذف');
    }
}

// ===== إضافة صنف =====
document.getElementById('itemForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    let code = document.getElementById('itemCode').value.trim();
    let name = document.getElementById('itemName').value.trim();
    if (!code || !name) { alert('أدخل الكود والاسم'); return; }
    let newItem = { id: itemId++, code, name, unit: document.getElementById('itemUnit').value, salePrice: parseFloat(document.getElementById('itemSalePrice').value) || 0, stock: parseInt(document.getElementById('itemStock').value) || 0 };
    items.push(newItem);
    await saveToFirebase('items', newItem.id, newItem);
    updateAllUI();
    closeModal('itemModal');
    this.reset();
    addNotification('success', `✅ تم إضافة ${name}`);
});

// ===== حذف صنف =====
async function deleteItem(id) {
    if (confirm('حذف الصنف؟')) {
        items = items.filter(i => i.id !== id);
        await deleteFromFirebase('items', id);
        updateAllUI();
        addNotification('warning', 'تم الحذف');
    }
}

// ===== إضافة مخزن =====
document.getElementById('warehouseForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    let name = document.getElementById('warehouseName').value.trim();
    if (!name) { alert('أدخل الاسم'); return; }
    let newWarehouse = { id: warehouseId++, name, location: document.getElementById('warehouseLocation').value || '' };
    warehouses.push(newWarehouse);
    await saveToFirebase('warehouses', newWarehouse.id, newWarehouse);
    updateAllUI();
    closeModal('warehouseModal');
    this.reset();
    addNotification('success', `✅ تم إضافة ${name}`);
});

// ===== إضافة حركة خزينة =====
document.getElementById('transactionForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    let type = document.getElementById('transactionType').value;
    let desc = document.getElementById('transactionDesc').value.trim();
    let amount = parseFloat(document.getElementById('transactionAmount').value);
    if (!desc || !amount) { alert('أدخل البيان والمبلغ'); return; }
    let date = new Date().toISOString().split('T')[0];
    let transaction;
    if (type === 'income') {
        treasuryBalance += amount;
        treasuryIncome += amount;
        transaction = { id: Date.now(), date, desc, debit: amount, credit: 0 };
    } else {
        treasuryBalance -= amount;
        treasuryExpense += amount;
        transaction = { id: Date.now(), date, desc, debit: 0, credit: amount };
    }
    treasuryTransactions.push(transaction);
    await saveToFirebase('treasury', transaction.id, transaction);
    updateAllUI();
    closeModal('transactionModal');
    this.reset();
    addNotification('success', '✅ تم تسجيل الحركة');
});

// ===== فاتورة مبيعات =====
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
    if (container.querySelectorAll('.item-row').length <= 1) { alert('يجب أن يكون صف واحد على الأقل'); return; }
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

// ===== حفظ فاتورة مبيعات =====
document.getElementById('saleInvoiceForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    let customer = document.getElementById('saleCustomerSelect').value;
    let grandTotal = parseFloat(document.getElementById('saleGrandTotal').textContent) || 0;
    let invoiceNo = document.getElementById('saleInvoiceNo').value;
    let date = document.getElementById('saleInvoiceDate').value;
    if (!customer) { alert('اختر العميل'); return; }
    if (grandTotal === 0) { alert('أضف منتجات'); return; }
    let tax = grandTotal * TAX_RATE;
    let subtotal = grandTotal - tax;
    let sale = { id: sales.length + 1, invoiceNo, date, customer, subtotal, tax, total: grandTotal, status: 'مدفوعة', payment: document.getElementById('salePaymentMethod').value };
    sales.push(sale);
    await saveToFirebase('sales', sale.id, sale);
    // تحديث الخزينة
    let trans = { id: Date.now(), date, desc: `مبيعات - ${invoiceNo}`, debit: grandTotal, credit: 0 };
    treasuryTransactions.push(trans);
    treasuryBalance += grandTotal;
    treasuryIncome += grandTotal;
    await saveToFirebase('treasury', trans.id, trans);
    updateAllUI();
    closeModal('saleInvoiceModal');
    addNotification('success', `✅ فاتورة ${invoiceNo} بقيمة ${grandTotal}`);
});

// ===== حفظ فاتورة مشتريات =====
document.getElementById('purchaseInvoiceForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    let supplier = document.getElementById('purchaseSupplierSelect').value;
    let grandTotal = parseFloat(document.getElementById('purchaseGrandTotal').textContent) || 0;
    let invoiceNo = document.getElementById('purchaseInvoiceNo').value;
    let date = document.getElementById('purchaseInvoiceDate').value;
    if (!supplier) { alert('اختر المورد'); return; }
    if (grandTotal === 0) { alert('أضف منتجات'); return; }
    let tax = grandTotal * TAX_RATE;
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
    addNotification('success', `✅ فاتورة شراء ${invoiceNo} بقيمة ${grandTotal}`);
});

// ===== مرتجع =====
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
    let ret;
    let trans;
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

// ===== حذف فاتورة =====
async function deleteSale(id) {
    if (confirm('حذف الفاتورة؟')) {
        sales = sales.filter(s => s.id !== id);
        await deleteFromFirebase('sales', id);
        updateAllUI();
    }
}
async function deletePurchase(id) {
    if (confirm('حذف الفاتورة؟')) {
        purchases = purchases.filter(p => p.id !== id);
        await deleteFromFirebase('purchases', id);
        updateAllUI();
    }
}

// ===== الإشعارات =====
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
        if (item.stock < 10) addNotification('warning', `⚠️ مخزون منخفض: ${item.name} (${item.stock})`);
    });
    customers.forEach(c => {
        if (c.balance > c.creditLimit && c.creditLimit > 0) {
            addNotification('danger', `❌ ${c.name} تجاوز حد الائتمان`);
        }
    });
}

// ===== التقارير =====
function generateReport(type) {
    let names = { 'balance': 'ميزان المراجعة', 'income': 'قائمة الدخل', 'financial': 'المركز المالي', 'sales': 'تقرير المبيعات', 'inventory': 'تقرير المخزون', 'customers': 'تقرير العملاء' };
    let totalSales = sales.reduce((s, x) => s + x.total, 0);
    let totalPurchases = purchases.reduce((s, x) => s + x.total, 0);
    let totalStock = items.reduce((s, i) => s + (i.stock * i.salePrice), 0);
    let msg = `📊 ${names[type]}\n${'='.repeat(30)}\n`;
    if (type === 'balance') msg += `مبيعات: ${totalSales}\nمشتريات: ${totalPurchases}\nخزينة: ${treasuryBalance}\nمخزون: ${totalStock}`;
    else if (type === 'income') msg += `إيرادات: ${totalSales}\nمصروفات: ${totalPurchases}\nصافي: ${totalSales - totalPurchases}`;
    else if (type === 'financial') msg += `أصول: ${treasuryBalance + totalStock}\nخصوم: ${totalPurchases}\nحقوق: ${treasuryBalance + totalStock - totalPurchases}`;
    else if (type === 'sales') msg += `فواتير: ${sales.length}\nإجمالي: ${totalSales}`;
    else if (type === 'inventory') msg += `أصناف: ${items.length}\nقيمة: ${totalStock}`;
    else if (type === 'customers') msg += `عملاء: ${customers.length}\nموردين: ${suppliers.length}`;
    alert(msg);
}

// ===== تصدير =====
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
    win.document.write(`<html><head><title>فاتورة</title><style>body{font-family:'Cairo',sans-serif;padding:20px;direction:rtl;}table{width:100%;border-collapse:collapse;}th,td{border:1px solid #ddd;padding:8px;text-align:center;}</style></head><body>`);
    win.document.write(content.innerHTML);
    win.document.write(`</body></html>`);
    win.document.close();
    win.print();
}

// ===== رفع اللوجو =====
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

// ===== Dark Mode =====
function toggleDarkMode() {
    darkMode = !darkMode;
    document.body.classList.toggle('dark-mode');
    localStorage.setItem('darkMode', JSON.stringify(darkMode));
}
document.getElementById('darkModeToggle').addEventListener('click', toggleDarkMode);
if (JSON.parse(localStorage.getItem('darkMode'))) {
    document.body.classList.add('dark-mode');
}

// ===== التنقل =====
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
        if (this.dataset.page === 'dashboard') { drawChart(); updateTopItems(); }
    });
});

document.querySelector('.menu-toggle').addEventListener('click', function() {
    document.querySelector('.sidebar').classList.toggle('open');
});

// ===== الرسم البياني =====
function drawChart() {
    let canvas = document.getElementById('salesChart');
    if (!canvas) return;
    let ctx = canvas.getContext('2d');
    let rect = canvas.parentElement.getBoundingClientRect();
    let width = rect.width - 40, height = 200;
    canvas.width = width;
    canvas.height = height;
    let data = sales.length > 0 ? sales.map(s => s.total) : [12000, 19000, 15000, 22000, 18000, 25000];
    let max = Math.max(...data, 1);
    let bw = Math.min((width - 60) / Math.max(data.length, 6) - 6, 35);
    let sx = 30;
    ctx.fillStyle = '#f8f9fa';
    ctx.fillRect(0, 0, width, height);
    data.forEach((v, i) => {
        let x = sx + i * (bw + 6);
        let bh = (v / max) * (height - 60);
        let y = height - 20 - bh;
        let grad = ctx.createLinearGradient(x, y, x, height - 20);
        grad.addColorStop(0, '#4fc3f7');
        grad.addColorStop(1, '#0288d1');
        ctx.fillStyle = grad;
        ctx.shadowColor = 'rgba(79,195,247,0.3)';
        ctx.shadowBlur = 6;
        ctx.beginPath();
        ctx.roundRect(x, y, bw, bh, 4);
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.fillStyle = '#1a2332';
        ctx.font = '10px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(v.toLocaleString(), x + bw/2, y - 4);
        let months = ['يناير','فبراير','مارس','ابريل','مايو','يونيو','يوليو','اغسطس','سبتمبر','اكتوبر','نوفمبر','ديسمبر'];
        ctx.fillStyle = '#6b7280';
        ctx.font = '9px Arial';
        ctx.fillText(months[i % 12], x + bw/2, height - 4);
    });
}

function updateTopItems() {
    let container = document.getElementById('topItems');
    if (!container) return;
    let sorted = [...items].sort((a, b) => b.stock - a.stock).slice(0, 5);
    container.innerHTML = sorted.length ? sorted.map(i => `<div class="top-item"><span class="item-name">${i.name}</span><span class="item-sales">${i.stock} وحدة</span></div>`).join('') : '<div class="top-item">لا توجد أصناف</div>';
}

// ===== تبويبات =====
document.querySelectorAll('.tabs-header .tab-btn').forEach(btn => {
    btn.addEventListener('click', function() {
        let parent = this.closest('.tabs-container');
        parent.querySelectorAll('.tabs-header .tab-btn').forEach(b => b.classList.remove('active'));
        this.classList.add('active');
        parent.querySelectorAll('.tabs-body .tab-panel').forEach(p => p.classList.remove('active'));
        document.getElementById(this.dataset.tab).classList.add('active');
    });
});

// ===== حفظ بيانات الشركة =====
document.getElementById('companyForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    await db.collection('company').doc('info').set(getCompanyData(), { merge: true });
    addNotification('success', '✅ تم حفظ بيانات الشركة');
});

// ===== Polyfill roundRect =====
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

console.log('🔥 النظام المحاسبي مع Firebase جاهز');
console.log('📧 demo@example.com | 🔑 123456');
