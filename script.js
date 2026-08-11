// ===== البيانات العالمية =====
let customers = [], suppliers = [], items = [], warehouses = [], sales = [], purchases = [];
let salesReturns = [], purchasesReturns = [], treasuryTransactions = [];
let customerId = 1, supplierId = 1, itemId = 1, warehouseId = 1;
let treasuryBalance = 0, treasuryIncome = 0, treasuryExpense = 0;
const TAX_RATE = 0.14;
let currentUser = null;
let notifications = [];
let darkMode = false;

// ===== التهيئة =====
document.addEventListener('DOMContentLoaded', function() {
    // تحميل البيانات
    loadData();
    // إعداد التاريخ
    const now = new Date();
    document.querySelectorAll('.date-display').forEach(el => {
        el.textContent = now.toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' });
    });
    // إخفاء التحميل
    setTimeout(() => document.getElementById('loader').style.display = 'none', 500);
    // تعبئة التواريخ
    document.querySelectorAll('input[type="date"]').forEach(el => {
        if (!el.value) el.value = now.toISOString().split('T')[0];
    });
    // تحديث الواجهة
    updateAllUI();
    drawChart();
    updateTopItems();
    // فحص الإشعارات
    setTimeout(checkAlerts, 1000);
});

// ===== تسجيل الدخول =====
document.getElementById('loginForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const user = document.getElementById('loginUser').value;
    const pass = document.getElementById('loginPass').value;
    if (user === 'admin' && pass === '123456') {
        currentUser = user;
        document.getElementById('loginScreen').style.display = 'none';
        document.getElementById('app').style.display = 'flex';
        document.getElementById('userNameDisplay').textContent = user;
        document.getElementById('headerUserName').textContent = user;
        // تحميل البيانات بعد الدخول
        loadData();
        updateAllUI();
    } else {
        alert('❌ اسم المستخدم أو كلمة المرور غير صحيحة');
    }
});

// ===== تسجيل الخروج =====
document.getElementById('logoutBtn').addEventListener('click', function(e) {
    e.preventDefault();
    if (confirm('هل أنت متأكد من تسجيل الخروج؟')) {
        currentUser = null;
        document.getElementById('app').style.display = 'none';
        document.getElementById('loginScreen').style.display = 'flex';
        document.getElementById('loginPass').value = '';
    }
});

// ===== حفظ وتحميل البيانات في LocalStorage =====
function saveData() {
    try {
        localStorage.setItem('customers', JSON.stringify(customers));
        localStorage.setItem('suppliers', JSON.stringify(suppliers));
        localStorage.setItem('items', JSON.stringify(items));
        localStorage.setItem('warehouses', JSON.stringify(warehouses));
        localStorage.setItem('sales', JSON.stringify(sales));
        localStorage.setItem('purchases', JSON.stringify(purchases));
        localStorage.setItem('salesReturns', JSON.stringify(salesReturns));
        localStorage.setItem('purchasesReturns', JSON.stringify(purchasesReturns));
        localStorage.setItem('treasuryTransactions', JSON.stringify(treasuryTransactions));
        localStorage.setItem('treasuryBalance', JSON.stringify(treasuryBalance));
        localStorage.setItem('treasuryIncome', JSON.stringify(treasuryIncome));
        localStorage.setItem('treasuryExpense', JSON.stringify(treasuryExpense));
        localStorage.setItem('customerId', JSON.stringify(customerId));
        localStorage.setItem('supplierId', JSON.stringify(supplierId));
        localStorage.setItem('itemId', JSON.stringify(itemId));
        localStorage.setItem('warehouseId', JSON.stringify(warehouseId));
        localStorage.setItem('companyData', JSON.stringify(getCompanyData()));
        localStorage.setItem('darkMode', JSON.stringify(darkMode));
        document.getElementById('lastUpdate').textContent = new Date().toLocaleString('ar-EG');
    } catch(e) { console.error('Save error:', e); }
}

function loadData() {
    try {
        customers = JSON.parse(localStorage.getItem('customers')) || [];
        suppliers = JSON.parse(localStorage.getItem('suppliers')) || [];
        items = JSON.parse(localStorage.getItem('items')) || [];
        warehouses = JSON.parse(localStorage.getItem('warehouses')) || [];
        sales = JSON.parse(localStorage.getItem('sales')) || [];
        purchases = JSON.parse(localStorage.getItem('purchases')) || [];
        salesReturns = JSON.parse(localStorage.getItem('salesReturns')) || [];
        purchasesReturns = JSON.parse(localStorage.getItem('purchasesReturns')) || [];
        treasuryTransactions = JSON.parse(localStorage.getItem('treasuryTransactions')) || [];
        treasuryBalance = JSON.parse(localStorage.getItem('treasuryBalance')) || 0;
        treasuryIncome = JSON.parse(localStorage.getItem('treasuryIncome')) || 0;
        treasuryExpense = JSON.parse(localStorage.getItem('treasuryExpense')) || 0;
        customerId = JSON.parse(localStorage.getItem('customerId')) || 1;
        supplierId = JSON.parse(localStorage.getItem('supplierId')) || 1;
        itemId = JSON.parse(localStorage.getItem('itemId')) || 1;
        warehouseId = JSON.parse(localStorage.getItem('warehouseId')) || 1;
        darkMode = JSON.parse(localStorage.getItem('darkMode')) || false;
        if (darkMode) document.body.classList.add('dark-mode');
        loadCompanyData();
        // إذا كانت البيانات فارغة، أضف بيانات افتراضية
        if (customers.length === 0 && suppliers.length === 0 && items.length === 0) {
            initDefaultData();
        }
    } catch(e) { console.error('Load error:', e); initDefaultData(); }
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
        taxRate: document.getElementById('companyTaxRate').value
    };
}

function loadCompanyData() {
    try {
        const data = JSON.parse(localStorage.getItem('companyData'));
        if (data) {
            document.getElementById('companyName').value = data.name || '';
            document.getElementById('companyReg').value = data.reg || '';
            document.getElementById('companyTax').value = data.tax || '';
            document.getElementById('companyAddress').value = data.address || '';
            document.getElementById('companyPhone').value = data.phone || '';
            document.getElementById('companyEmail').value = data.email || '';
            document.getElementById('companyCurrency').value = data.currency || 'EGP';
            document.getElementById('companyTaxRate').value = data.taxRate || 14;
        }
    } catch(e) {}
}

// ===== بيانات افتراضية =====
function initDefaultData() {
    customers = [
        { id: customerId++, name: 'أحمد محمد', commercialReg: '123456', taxFile: 'TAX-001', creditLimit: 10000, defaultDue: 30, cashDiscount: 5, purchasePrice: 0, extraBalance: 0, city: 'القاهرة', address: 'وسط البلد', phone: '01001234567', email: 'ahmed@example.com', debit: 5000, credit: 0, balance: 5000, businessList: 'تجارة عامة' },
        { id: customerId++, name: 'سارة علي', commercialReg: '789012', taxFile: 'TAX-002', creditLimit: 8000, defaultDue: 30, cashDiscount: 3, purchasePrice: 0, extraBalance: 0, city: 'الإسكندرية', address: 'المنشية', phone: '01008765432', email: 'sara@example.com', debit: 3200, credit: 0, balance: 3200, businessList: 'مقاولات' }
    ];
    suppliers = [
        { id: supplierId++, name: 'مورد الإلكترونيات', commercialReg: '345678', taxFile: 'TAX-003', creditLimit: 20000, defaultDue: 45, cashDiscount: 3, purchasePrice: 0, extraBalance: 0, city: 'القاهرة', address: 'مدينة نصر', phone: '01005556677', email: 'supplier@example.com', debit: 0, credit: 6900, balance: -6900, businessList: 'إلكترونيات' }
    ];
    items = [
        { id: itemId++, code: '001', name: 'منتج عام 1', category: 'عام', unit: 'قطعة', purchasePrice: 100, salePrice: 150, stock: 50 },
        { id: itemId++, code: '002', name: 'منتج عام 2', category: 'عام', unit: 'كجم', purchasePrice: 200, salePrice: 280, stock: 30 },
        { id: itemId++, code: '003', name: 'منتج عام 3', category: 'عام', unit: 'علبة', purchasePrice: 50, salePrice: 75, stock: 100 }
    ];
    warehouses = [{ id: warehouseId++, name: 'المخزن الرئيسي', location: 'القاهرة', desc: 'المخزن الرئيسي للشركة' }];
    treasuryBalance = 45500;
    treasuryIncome = 152000;
    treasuryExpense = 106500;
    treasuryTransactions = [
        { date: '2026-08-11', desc: 'مبيعات - INV-2026-001', debit: 5130, credit: 0, balance: 50630 },
        { date: '2026-08-10', desc: 'مشتريات - PUR-2026-001', debit: 0, credit: 6840, balance: 45500 }
    ];
    sales = [{ id: 1, invoiceNo: 'INV-2026-001', date: '2026-08-11', customer: 'أحمد محمد', subtotal: 4500, tax: 630, total: 5130, status: 'مدفوعة', payment: 'نقدي' }];
    purchases = [{ id: 1, invoiceNo: 'PUR-2026-001', date: '2026-08-10', supplier: 'مورد الإلكترونيات', subtotal: 6000, tax: 840, total: 6840, status: 'مدفوعة', payment: 'تحويل' }];
    saveData();
}

// ===== تحديث الواجهة =====
function updateAllUI() {
    updateStats();
    updateCustomersList();
    updateSuppliersList();
    updateItemsList();
    updateSalesList();
    updatePurchasesList();
    updateSalesReturns();
    updatePurchasesReturns();
    updateTreasuryUI();
    updateWarehouses();
    updateRecentInvoices();
    updateCustomerSelects();
    updateSupplierSelects();
    document.getElementById('customerCount').textContent = customers.length;
    document.getElementById('supplierCount').textContent = suppliers.length;
    document.getElementById('lastUpdate').textContent = new Date().toLocaleString('ar-EG');
    saveData();
}

function updateStats() {
    let totalSales = sales.reduce((s, x) => s + x.total, 0);
    let totalPurchases = purchases.reduce((s, x) => s + x.total, 0);
    let totalStock = items.reduce((s, i) => s + (i.stock * i.purchasePrice), 0);
    document.getElementById('totalSales').textContent = totalSales.toLocaleString();
    document.getElementById('totalPurchases').textContent = totalPurchases.toLocaleString();
    document.getElementById('totalStock').textContent = totalStock.toLocaleString();
    document.getElementById('treasuryBalance').textContent = treasuryBalance.toLocaleString();
}

function updateCustomersList() {
    const tbody = document.getElementById('customersList');
    tbody.innerHTML = '';
    customers.forEach(c => {
        let row = document.createElement('tr');
        row.innerHTML = `<td>${c.name}</td><td>${c.commercialReg || '-'}</td><td>${c.taxFile || '-'}</td><td>${c.phone || '-'}</td><td>${c.balance.toFixed(2)}</td><td>${c.creditLimit.toFixed(2)}</td><td><button class="btn-edit" onclick="editCustomer(${c.id})"><i class="fas fa-edit"></i></button><button class="btn-delete" onclick="deleteCustomer(${c.id})"><i class="fas fa-trash"></i></button></td>`;
        tbody.appendChild(row);
    });
}

function updateSuppliersList() {
    const tbody = document.getElementById('suppliersList');
    tbody.innerHTML = '';
    suppliers.forEach(s => {
        let row = document.createElement('tr');
        row.innerHTML = `<td>${s.name}</td><td>${s.commercialReg || '-'}</td><td>${s.taxFile || '-'}</td><td>${s.phone || '-'}</td><td>${s.balance.toFixed(2)}</td><td>${s.creditLimit.toFixed(2)}</td><td><button class="btn-edit" onclick="editSupplier(${s.id})"><i class="fas fa-edit"></i></button><button class="btn-delete" onclick="deleteSupplier(${s.id})"><i class="fas fa-trash"></i></button></td>`;
        tbody.appendChild(row);
    });
}

function updateItemsList() {
    const tbody = document.getElementById('itemsList');
    tbody.innerHTML = '';
    items.forEach(i => {
        let row = document.createElement('tr');
        row.innerHTML = `<td>${i.code}</td><td>${i.name}</td><td>${i.category || 'عام'}</td><td>${i.unit}</td><td>${i.purchasePrice.toFixed(2)}</td><td>${i.salePrice.toFixed(2)}</td><td>${i.stock}</td><td><button class="btn-edit" onclick="editItem(${i.id})"><i class="fas fa-edit"></i></button><button class="btn-delete" onclick="deleteItem(${i.id})"><i class="fas fa-trash"></i></button></td>`;
        tbody.appendChild(row);
    });
}

function updateSalesList() {
    const tbody = document.getElementById('salesList');
    tbody.innerHTML = '';
    sales.forEach(s => {
        let row = document.createElement('tr');
        row.innerHTML = `<td>${s.invoiceNo}</td><td>${s.date}</td><td>${s.customer}</td><td>${s.subtotal.toFixed(2)}</td><td>${s.tax.toFixed(2)}</td><td>${s.total.toFixed(2)}</td><td><span class="status ${s.status === 'مدفوعة' ? 'paid' : 'pending'}">${s.status}</span></td><td><button class="btn-edit" onclick="printInvoiceContent('sale',${s.id})"><i class="fas fa-print"></i></button><button class="btn-delete" onclick="deleteSale(${s.id})"><i class="fas fa-trash"></i></button></td>`;
        tbody.appendChild(row);
    });
}

function updatePurchasesList() {
    const tbody = document.getElementById('purchasesList');
    tbody.innerHTML = '';
    purchases.forEach(p => {
        let row = document.createElement('tr');
        row.innerHTML = `<td>${p.invoiceNo}</td><td>${p.date}</td><td>${p.supplier}</td><td>${p.subtotal.toFixed(2)}</td><td>${p.tax.toFixed(2)}</td><td>${p.total.toFixed(2)}</td><td><span class="status ${p.status === 'مدفوعة' ? 'paid' : 'pending'}">${p.status}</span></td><td><button class="btn-edit" onclick="printInvoiceContent('purchase',${p.id})"><i class="fas fa-print"></i></button><button class="btn-delete" onclick="deletePurchase(${p.id})"><i class="fas fa-trash"></i></button></td>`;
        tbody.appendChild(row);
    });
}

function updateSalesReturns() {
    const tbody = document.getElementById('salesReturnsList');
    tbody.innerHTML = '';
    salesReturns.forEach(r => {
        let row = document.createElement('tr');
        row.innerHTML = `<td>${r.returnNo}</td><td>${r.date}</td><td>${r.invoiceNo}</td><td>${r.party}</td><td>${r.amount.toFixed(2)}</td><td>${r.reason}</td>`;
        tbody.appendChild(row);
    });
}

function updatePurchasesReturns() {
    const tbody = document.getElementById('purchasesReturnsList');
    tbody.innerHTML = '';
    purchasesReturns.forEach(r => {
        let row = document.createElement('tr');
        row.innerHTML = `<td>${r.returnNo}</td><td>${r.date}</td><td>${r.invoiceNo}</td><td>${r.party}</td><td>${r.amount.toFixed(2)}</td><td>${r.reason}</td>`;
        tbody.appendChild(row);
    });
}

function updateTreasuryUI() {
    document.getElementById('treasuryCurrentBalance').textContent = treasuryBalance.toFixed(2) + ' جنيه';
    document.getElementById('treasuryIncome').textContent = treasuryIncome.toFixed(2) + ' جنيه';
    document.getElementById('treasuryExpense').textContent = treasuryExpense.toFixed(2) + ' جنيه';
    const tbody = document.getElementById('treasuryTransactions');
    tbody.innerHTML = '';
    let balance = 0;
    treasuryTransactions.forEach(t => {
        balance += (t.debit || 0) - (t.credit || 0);
        let row = document.createElement('tr');
        row.innerHTML = `<td>${t.date}</td><td>${t.desc}</td><td>${t.debit ? t.debit.toFixed(2) : '-'}</td><td>${t.credit ? t.credit.toFixed(2) : '-'}</td><td>${balance.toFixed(2)}</td>`;
        tbody.appendChild(row);
    });
}

function updateWarehouses() {
    const grid = document.getElementById('warehousesGrid');
    grid.innerHTML = '';
    warehouses.forEach(w => {
        let totalValue = items.reduce((sum, i) => sum + (i.stock * i.purchasePrice), 0);
        let card = document.createElement('div');
        card.className = 'warehouse-card';
        card.innerHTML = `<h3><i class="fas fa-warehouse"></i> ${w.name}</h3><p>الموقع: ${w.location || 'غير محدد'}</p><div class="warehouse-stats"><span>عدد الأصناف: ${items.length}</span><span>القيمة: ${totalValue.toFixed(2)} جنيه</span></div><button class="btn-secondary" onclick="alert('عرض حركات المخزن ${w.name}')">عرض الحركات</button>`;
        grid.appendChild(card);
    });
}

function updateRecentInvoices() {
    const tbody = document.getElementById('recentInvoicesList');
    tbody.innerHTML = '';
    let recent = [...sales].slice(-5).reverse();
    recent.forEach(s => {
        let row = document.createElement('tr');
        row.innerHTML = `<td>${s.invoiceNo}</td><td>${s.customer}</td><td>${s.total.toFixed(2)}</td><td><span class="status ${s.status === 'مدفوعة' ? 'paid' : 'pending'}">${s.status}</span></td>`;
        tbody.appendChild(row);
    });
}

function updateCustomerSelects() {
    const select = document.getElementById('saleCustomerSelect');
    if (!select) return;
    select.innerHTML = '<option value="">-- اختر عميل --</option>';
    customers.forEach(c => {
        let opt = document.createElement('option');
        opt.value = c.name;
        opt.textContent = c.name;
        select.appendChild(opt);
    });
}

function updateSupplierSelects() {
    const select = document.getElementById('purchaseSupplierSelect');
    if (!select) return;
    select.innerHTML = '<option value="">-- اختر مورد --</option>';
    suppliers.forEach(s => {
        let opt = document.createElement('option');
        opt.value = s.name;
        opt.textContent = s.name;
        select.appendChild(opt);
    });
}

// ===== البحث والتصفية =====
function filterTable(input, tableId) {
    const query = input.value.toLowerCase();
    const rows = document.querySelectorAll(`#${tableId} tr`);
    rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(query) ? '' : 'none';
    });
}

// ===== إدارة العملاء =====
function showModal(id) { document.getElementById(id).style.display = 'block'; }
function closeModal(id) { document.getElementById(id).style.display = 'none'; }

document.getElementById('customerForm').addEventListener('submit', function(e) {
    e.preventDefault();
    let name = document.getElementById('custName').value.trim();
    if (!name) { alert('يرجى إدخال اسم العميل'); return; }
    customers.push({ id: customerId++, name, phone: document.getElementById('custPhone').value || '', taxFile: document.getElementById('custTax').value || '', address: document.getElementById('custAddress').value || '', commercialReg: '', creditLimit: 0, defaultDue: 30, cashDiscount: 0, purchasePrice: 0, extraBalance: 0, city: '', email: '', debit: 0, credit: 0, balance: 0, businessList: '' });
    updateAllUI();
    closeModal('customerModal');
    this.reset();
    addNotification('success', `تم إضافة العميل ${name}`);
});

document.getElementById('supplierForm').addEventListener('submit', function(e) {
    e.preventDefault();
    let name = document.getElementById('suppName').value.trim();
    if (!name) { alert('يرجى إدخال اسم المورد'); return; }
    suppliers.push({ id: supplierId++, name, phone: document.getElementById('suppPhone').value || '', taxFile: document.getElementById('suppTax').value || '', address: document.getElementById('suppAddress').value || '', commercialReg: '', creditLimit: 0, defaultDue: 30, cashDiscount: 0, purchasePrice: 0, extraBalance: 0, city: '', email: '', debit: 0, credit: 0, balance: 0, businessList: '' });
    updateAllUI();
    closeModal('supplierModal');
    this.reset();
    addNotification('success', `تم إضافة المورد ${name}`);
});

function deleteCustomer(id) {
    if (confirm('هل أنت متأكد من حذف هذا العميل؟')) {
        customers = customers.filter(c => c.id !== id);
        updateAllUI();
        addNotification('warning', 'تم حذف العميل');
    }
}
function deleteSupplier(id) {
    if (confirm('هل أنت متأكد من حذف هذا المورد؟')) {
        suppliers = suppliers.filter(s => s.id !== id);
        updateAllUI();
        addNotification('warning', 'تم حذف المورد');
    }
}
function editCustomer(id) {
    let c = customers.find(c => c.id === id);
    if (!c) return;
    document.getElementById('custName').value = c.name;
    document.getElementById('custPhone').value = c.phone || '';
    document.getElementById('custTax').value = c.taxFile || '';
    document.getElementById('custAddress').value = c.address || '';
    customers = customers.filter(x => x.id !== id);
    updateAllUI();
    document.getElementById('customerModal').style.display = 'block';
}
function editSupplier(id) {
    let s = suppliers.find(s => s.id === id);
    if (!s) return;
    document.getElementById('suppName').value = s.name;
    document.getElementById('suppPhone').value = s.phone || '';
    document.getElementById('suppTax').value = s.taxFile || '';
    document.getElementById('suppAddress').value = s.address || '';
    suppliers = suppliers.filter(x => x.id !== id);
    updateAllUI();
    document.getElementById('supplierModal').style.display = 'block';
}

// ===== إدارة الأصناف =====
document.getElementById('itemForm').addEventListener('submit', function(e) {
    e.preventDefault();
    let code = document.getElementById('itemCode').value.trim();
    let name = document.getElementById('itemName').value.trim();
    if (!code || !name) { alert('يرجى إدخال الكود واسم الصنف'); return; }
    items.push({ id: itemId++, code, name, category: document.getElementById('itemCategory').value || 'عام', unit: document.getElementById('itemUnit').value, purchasePrice: parseFloat(document.getElementById('itemPurchasePrice').value) || 0, salePrice: parseFloat(document.getElementById('itemSalePrice').value) || 0, stock: parseInt(document.getElementById('itemStock').value) || 0 });
    updateAllUI();
    closeModal('itemModal');
    this.reset();
    addNotification('success', `تم إضافة الصنف ${name}`);
});
function deleteItem(id) {
    if (confirm('هل أنت متأكد من حذف هذا الصنف؟')) {
        items = items.filter(i => i.id !== id);
        updateAllUI();
        addNotification('warning', 'تم حذف الصنف');
    }
}
function editItem(id) {
    let item = items.find(i => i.id === id);
    if (!item) return;
    document.getElementById('itemCode').value = item.code;
    document.getElementById('itemName').value = item.name;
    document.getElementById('itemCategory').value = item.category || '';
    document.getElementById('itemUnit').value = item.unit;
    document.getElementById('itemPurchasePrice').value = item.purchasePrice;
    document.getElementById('itemSalePrice').value = item.salePrice;
    document.getElementById('itemStock').value = item.stock;
    items = items.filter(i => i.id !== id);
    updateAllUI();
    document.getElementById('itemModal').style.display = 'block';
}

// ===== إدارة المخازن =====
document.getElementById('warehouseForm').addEventListener('submit', function(e) {
    e.preventDefault();
    let name = document.getElementById('warehouseName').value.trim();
    if (!name) { alert('يرجى إدخال اسم المخزن'); return; }
    warehouses.push({ id: warehouseId++, name, location: document.getElementById('warehouseLocation').value || '', desc: document.getElementById('warehouseDesc').value || '' });
    updateAllUI();
    closeModal('warehouseModal');
    this.reset();
    addNotification('success', `تم إضافة المخزن ${name}`);
});

// ===== إدارة الخزينة =====
document.getElementById('transactionForm').addEventListener('submit', function(e) {
    e.preventDefault();
    let type = document.getElementById('transactionType').value;
    let desc = document.getElementById('transactionDesc').value.trim();
    let amount = parseFloat(document.getElementById('transactionAmount').value);
    if (!desc || !amount) { alert('يرجى إدخال البيان والمبلغ'); return; }
    let date = new Date().toISOString().split('T')[0];
    if (type === 'income') {
        treasuryBalance += amount;
        treasuryIncome += amount;
        treasuryTransactions.push({ date, desc, debit: amount, credit: 0, balance: treasuryBalance });
    } else {
        treasuryBalance -= amount;
        treasuryExpense += amount;
        treasuryTransactions.push({ date, desc, debit: 0, credit: amount, balance: treasuryBalance });
    }
    updateAllUI();
    closeModal('transactionModal');
    this.reset();
    addNotification('success', `تم تسجيل الحركة: ${desc}`);
});

// ===== فواتير المبيعات =====
function openSaleInvoice() {
    document.getElementById('saleInvoiceModal').style.display = 'block';
    document.getElementById('saleInvoiceDate').value = new Date().toISOString().split('T')[0];
    document.getElementById('saleInvoiceNo').value = `INV-2026-${String(sales.length + 1).padStart(3, '0')}`;
    updateCustomerSelects();
    // إعادة تعيين الجدول
    document.getElementById('saleInvoiceItems').innerHTML = `<tr class="item-row"><td><input type="text" class="item-code" placeholder="الكود" onchange="loadItemData(this,'sale')"></td><td><input type="text" class="item-name" placeholder="اسم الصنف"></td><td><select class="item-unit"><option value="قطعة">قطعة</option><option value="كجم">كجم</option><option value="علبة">علبة</option></select></td><td><input type="number" class="item-qty" value="1" min="0" step="1" oninput="calcRowTotal(this,'sale')"></td><td><input type="number" class="item-price" value="0" min="0" step="0.01" oninput="calcRowTotal(this,'sale')"></td><td><input type="number" class="item-discount" value="0" min="0" step="0.01" oninput="calcRowTotal(this,'sale')"></td><td><input type="number" class="item-total" value="0" readonly></td><td><span class="stock-balance">0</span></td><td><button type="button" class="btn-delete-sm" onclick="removeRow(this,'sale')"><i class="fas fa-times"></i></button></td></tr>`;
    calcInvoiceTotal('sale');
}

function addRow(type) {
    const container = document.getElementById(type === 'sale' ? 'saleInvoiceItems' : 'purchaseInvoiceItems');
    const row = document.createElement('tr');
    row.className = 'item-row';
    const isSale = type === 'sale';
    row.innerHTML = `<td><input type="text" class="item-code" placeholder="الكود" onchange="loadItemData(this,'${type}')"></td><td><input type="text" class="item-name" placeholder="اسم الصنف"></td><td><select class="item-unit"><option value="قطعة">قطعة</option><option value="كجم">كجم</option><option value="علبة">علبة</option></select></td><td><input type="number" class="item-qty" value="1" min="0" step="1" oninput="calcRowTotal(this,'${type}')"></td><td><input type="number" class="item-price" value="0" min="0" step="0.01" oninput="calcRowTotal(this,'${type}')"></td><td><input type="number" class="item-discount" value="0" min="0" step="0.01" oninput="calcRowTotal(this,'${type}')"></td><td><input type="number" class="item-total" value="0" readonly></td><td><span class="stock-balance">0</span></td><td><button type="button" class="btn-delete-sm" onclick="removeRow(this,'${type}')"><i class="fas fa-times"></i></button></td>`;
    container.appendChild(row);
    calcInvoiceTotal(type);
}

function removeRow(btn, type) {
    const container = document.getElementById(type === 'sale' ? 'saleInvoiceItems' : 'purchaseInvoiceItems');
    if (container.querySelectorAll('.item-row').length <= 1) { alert('يجب أن يكون هناك صف واحد على الأقل'); return; }
    btn.closest('tr').remove();
    calcInvoiceTotal(type);
}

function calcRowTotal(el, type) {
    const row = el.closest('tr');
    const qty = parseFloat(row.querySelector('.item-qty').value) || 0;
    const price = parseFloat(row.querySelector('.item-price').value) || 0;
    const discount = parseFloat(row.querySelector('.item-discount').value) || 0;
    row.querySelector('.item-total').value = ((qty * price) - discount).toFixed(2);
    calcInvoiceTotal(type);
}

function calcInvoiceTotal(type) {
    const container = document.getElementById(type === 'sale' ? 'saleInvoiceItems' : 'purchaseInvoiceItems');
    const rows = container.querySelectorAll('.item-row');
    let totalQty = 0, totalDiscount = 0, grandTotal = 0;
    rows.forEach(row => {
        totalQty += parseFloat(row.querySelector('.item-qty').value) || 0;
        totalDiscount += parseFloat(row.querySelector('.item-discount').value) || 0;
        grandTotal += parseFloat(row.querySelector('.item-total').value) || 0;
    });
    const prefix = type === 'sale' ? 'sale' : 'purchase';
    document.getElementById(`${prefix}TotalQty`).textContent = totalQty;
    document.getElementById(`${prefix}ItemCount`).textContent = rows.length;
    document.getElementById(`${prefix}TotalDiscount`).textContent = totalDiscount.toFixed(2);
    document.getElementById(`${prefix}GrandTotal`).textContent = grandTotal.toFixed(2);
}

function loadItemData(input, type) {
    const code = input.value.trim();
    if (!code) return;
    const item = items.find(i => i.code === code);
    if (!item) { alert('الصنف غير موجود'); input.value = ''; return; }
    const row = input.closest('tr');
    row.querySelector('.item-name').value = item.name;
    row.querySelector('.item-unit').value = item.unit;
    row.querySelector('.item-price').value = type === 'sale' ? item.salePrice : item.purchasePrice;
    row.querySelector('.stock-balance').textContent = item.stock;
    calcRowTotal(row.querySelector('.item-price'), type);
}

function loadCustomerData() {
    const select = document.getElementById('saleCustomerSelect');
    const customer = customers.find(c => c.name === select.value);
    document.getElementById('saleCustomerBalance').textContent = customer ? customer.balance.toFixed(2) : '0.00';
}

function loadSupplierData() {
    const select = document.getElementById('purchaseSupplierSelect');
    const supplier = suppliers.find(s => s.name === select.value);
    document.getElementById('purchaseSupplierBalance').textContent = supplier ? supplier.balance.toFixed(2) : '0.00';
}

// ===== حفظ فاتورة المبيعات =====
document.getElementById('saleInvoiceForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const customer = document.getElementById('saleCustomerSelect').value;
    const grandTotal = parseFloat(document.getElementById('saleGrandTotal').textContent) || 0;
    const invoiceNo = document.getElementById('saleInvoiceNo').value;
    const date = document.getElementById('saleInvoiceDate').value;
    if (!customer) { alert('اختر العميل'); return; }
    if (grandTotal === 0) { alert('أضف منتجات'); return; }
    const subtotal = grandTotal / (1 + TAX_RATE);
    const tax = grandTotal - subtotal;
    sales.push({ id: sales.length + 1, invoiceNo, date, customer, subtotal, tax, total: grandTotal, status: 'مدفوعة', payment: document.getElementById('salePaymentMethod').value });
    // تحديث الخزينة
    treasuryBalance += grandTotal;
    treasuryIncome += grandTotal;
    treasuryTransactions.push({ date, desc: `مبيعات - ${invoiceNo}`, debit: grandTotal, credit: 0, balance: treasuryBalance });
    updateAllUI();
    closeModal('saleInvoiceModal');
    addNotification('success', `✅ تم إصدار الفاتورة ${invoiceNo} بقيمة ${grandTotal.toFixed(2)} جنيه`);
});

// ===== حفظ فاتورة المشتريات =====
document.getElementById('purchaseInvoiceForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const supplier = document.getElementById('purchaseSupplierSelect').value;
    const grandTotal = parseFloat(document.getElementById('purchaseGrandTotal').textContent) || 0;
    const invoiceNo = document.getElementById('purchaseInvoiceNo').value;
    const date = document.getElementById('purchaseInvoiceDate').value;
    if (!supplier) { alert('اختر المورد'); return; }
    if (grandTotal === 0) { alert('أضف منتجات'); return; }
    const subtotal = grandTotal / (1 + TAX_RATE);
    const tax = grandTotal - subtotal;
    purchases.push({ id: purchases.length + 1, invoiceNo, date, supplier, subtotal, tax, total: grandTotal, status: 'مدفوعة', payment: document.getElementById('purchasePaymentMethod').value });
    treasuryBalance -= grandTotal;
    treasuryExpense += grandTotal;
    treasuryTransactions.push({ date, desc: `مشتريات - ${invoiceNo}`, debit: 0, credit: grandTotal, balance: treasuryBalance });
    updateAllUI();
    closeModal('purchaseInvoiceModal');
    addNotification('success', `✅ تم إصدار فاتورة الشراء ${invoiceNo} بقيمة ${grandTotal.toFixed(2)} جنيه`);
});

// ===== فتح فاتورة المشتريات =====
function openPurchaseInvoice() {
    document.getElementById('purchaseInvoiceModal').style.display = 'block';
    document.getElementById('purchaseInvoiceDate').value = new Date().toISOString().split('T')[0];
    document.getElementById('purchaseInvoiceNo').value = `PUR-2026-${String(purchases.length + 1).padStart(3, '0')}`;
    updateSupplierSelects();
    document.getElementById('purchaseInvoiceItems').innerHTML = `<tr class="item-row"><td><input type="text" class="item-code" placeholder="الكود" onchange="loadItemData(this,'purchase')"></td><td><input type="text" class="item-name" placeholder="اسم الصنف"></td><td><select class="item-unit"><option value="قطعة">قطعة</option><option value="كجم">كجم</option><option value="علبة">علبة</option></select></td><td><input type="number" class="item-qty" value="1" min="0" step="1" oninput="calcRowTotal(this,'purchase')"></td><td><input type="number" class="item-price" value="0" min="0" step="0.01" oninput="calcRowTotal(this,'purchase')"></td><td><input type="number" class="item-discount" value="0" min="0" step="0.01" oninput="calcRowTotal(this,'purchase')"></td><td><input type="number" class="item-total" value="0" readonly></td><td><span class="stock-balance">0</span></td><td><button type="button" class="btn-delete-sm" onclick="removeRow(this,'purchase')"><i class="fas fa-times"></i></button></td></tr>`;
    calcInvoiceTotal('purchase');
}

// ===== المرتجعات =====
function openReturnModal(type) {
    document.getElementById('returnModal').style.display = 'block';
    document.getElementById('returnType').value = type;
}

document.getElementById('returnForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const type = document.getElementById('returnType').value;
    const invoiceNo = document.getElementById('returnInvoiceNo').value.trim();
    const party = document.getElementById('returnParty').value.trim();
    const item = document.getElementById('returnItem').value.trim();
    const amount = parseFloat(document.getElementById('returnAmount').value);
    const reason = document.getElementById('returnReason').value;
    if (!invoiceNo || !party || !item || !amount) { alert('يرجى ملء جميع الحقول'); return; }
    const date = new Date().toISOString().split('T')[0];
    const returnNo = (type === 'sales' ? 'SR-' : 'PR-') + String((type === 'sales' ? salesReturns.length : purchasesReturns.length) + 1).padStart(3, '0');
    if (type === 'sales') {
        salesReturns.push({ id: salesReturns.length + 1, returnNo, date, invoiceNo, party, amount, reason });
        treasuryBalance -= amount;
        treasuryExpense += amount;
        treasuryTransactions.push({ date, desc: `مرتجع مبيعات - ${returnNo}`, debit: 0, credit: amount, balance: treasuryBalance });
    } else {
        purchasesReturns.push({ id: purchasesReturns.length + 1, returnNo, date, invoiceNo, party, amount, reason });
        treasuryBalance += amount;
        treasuryIncome += amount;
        treasuryTransactions.push({ date, desc: `مرتجع مشتريات - ${returnNo}`, debit: amount, credit: 0, balance: treasuryBalance });
    }
    updateAllUI();
    closeModal('returnModal');
    this.reset();
    addNotification('success', `✅ تم تسجيل المرتجع ${returnNo}`);
});

// ===== الإشعارات =====
function addNotification(type, text) {
    notifications.push({ type, text, time: new Date().toLocaleString('ar-EG') });
    document.getElementById('notifBadge').textContent = notifications.length;
}

function showNotifications() {
    const list = document.getElementById('notifList');
    list.innerHTML = '';
    if (notifications.length === 0) {
        list.innerHTML = '<p style="text-align:center;color:var(--text-light);padding:20px;">لا توجد إشعارات</p>';
    } else {
        notifications.forEach(n => {
            let div = document.createElement('div');
            div.className = `notif-item ${n.type}`;
            const icons = { success: '✅', warning: '⚠️', danger: '❌' };
            div.innerHTML = `<span class="notif-icon">${icons[n.type] || '📌'}</span><span class="notif-text">${n.text}</span><span class="notif-time">${n.time}</span>`;
            list.appendChild(div);
        });
    }
    document.getElementById('notifModal').style.display = 'block';
}

function checkAlerts() {
    // مخزون منخفض
    items.forEach(item => {
        if (item.stock < 10) {
            addNotification('warning', `⚠️ المخزون منخفض للصنف "${item.name}" (المتبقي: ${item.stock})`);
        }
    });
    // عملاء تجاوزوا حد الائتمان
    customers.forEach(c => {
        if (c.balance > c.creditLimit && c.creditLimit > 0) {
            addNotification('danger', `❌ العميل "${c.name}" تجاوز حد الائتمان (${c.balance}/${c.creditLimit})`);
        }
    });
    document.getElementById('notifBadge').textContent = notifications.length;
}

// ===== تصدير Excel =====
function exportToExcel(data, name) {
    if (!data || data.length === 0) { alert('لا توجد بيانات للتصدير'); return; }
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, name);
    XLSX.writeFile(wb, `${name}.xlsx`);
    addNotification('success', `تم تصدير ${name} إلى Excel`);
}

function exportAllData() {
    const allData = { customers, suppliers, items, warehouses, sales, purchases, salesReturns, purchasesReturns, treasuryTransactions };
    const blob = new Blob([JSON.stringify(allData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `نسخة_احتياطية_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    addNotification('success', 'تم تصدير النسخة الاحتياطية');
}

// ===== تصدير PDF للفواتير =====
function exportInvoicePDF(type) {
    const id = type === 'sale' ? 'saleInvoiceContent' : 'purchaseInvoiceContent';
    const element = document.getElementById(id);
    if (!element) { alert('لا توجد فاتورة للطباعة'); return; }
    const opt = { margin: 10, filename: `${type === 'sale' ? 'فاتورة_مبيعات' : 'فاتورة_مشتريات'}.pdf`, image: { type: 'jpeg', quality: 0.98 }, html2canvas: { scale: 2, useCORS: true }, jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' } };
    html2pdf().set(opt).from(element).save();
    addNotification('success', `تم تصدير الفاتورة إلى PDF`);
}

// ===== طباعة الفاتورة =====
function printInvoiceContent(type, id) {
    const content = document.getElementById(type === 'sale' ? 'saleInvoiceContent' : 'purchaseInvoiceContent');
    if (!content) return;
    const win = window.open('', '_blank');
    win.document.write(`<html><head><title>فاتورة</title><style>body{font-family:'Cairo',sans-serif;padding:20px;direction:rtl;}table{width:100%;border-collapse:collapse;}th,td{border:1px solid #ddd;padding:8px;text-align:center;}th{background:#f5f5f5;}.header{text-align:center;margin-bottom:20px;}.total{font-weight:bold;font-size:18px;}</style></head><body>`);
    win.document.write(content.innerHTML);
    win.document.write(`</body></html>`);
    win.document.close();
    win.print();
}

// ===== حذف الفواتير =====
function deleteSale(id) {
    if (confirm('هل أنت متأكد من حذف هذه الفاتورة؟')) {
        sales = sales.filter(s => s.id !== id);
        updateAllUI();
        addNotification('warning', 'تم حذف الفاتورة');
    }
}
function deletePurchase(id) {
    if (confirm('هل أنت متأكد من حذف هذه الفاتورة؟')) {
        purchases = purchases.filter(p => p.id !== id);
        updateAllUI();
        addNotification('warning', 'تم حذف الفاتورة');
    }
}

// ===== التقارير =====
function generateReport(type) {
    const names = { 'balance': 'ميزان المراجعة', 'income': 'قائمة الدخل', 'financial': 'المركز المالي', 'sales': 'تقرير المبيعات', 'inventory': 'تقرير المخزون', 'customers': 'تقرير العملاء', 'cashflow': 'التدفق النقدي' };
    let totalSales = sales.reduce((s, x) => s + x.total, 0);
    let totalPurchases = purchases.reduce((s, x) => s + x.total, 0);
    let totalStock = items.reduce((s, i) => s + (i.stock * i.purchasePrice), 0);
    let msg = `📊 ${names[type]}\n${'='.repeat(30)}\n\n`;
    if (type === 'balance') msg += `إجمالي المبيعات: ${totalSales.toFixed(2)} جنيه\nإجمالي المشتريات: ${totalPurchases.toFixed(2)} جنيه\nرصيد الخزينة: ${treasuryBalance.toFixed(2)} جنيه\nقيمة المخزون: ${totalStock.toFixed(2)} جنيه`;
    else if (type === 'income') msg += `الإيرادات: ${totalSales.toFixed(2)} جنيه\nالمصروفات: ${totalPurchases.toFixed(2)} جنيه\nصافي الربح: ${(totalSales - totalPurchases).toFixed(2)} جنيه`;
    else if (type === 'financial') msg += `الأصول: ${(treasuryBalance + totalStock).toFixed(2)} جنيه\nالخصوم: ${totalPurchases.toFixed(2)} جنيه\nحقوق الملكية: ${(treasuryBalance + totalStock - totalPurchases).toFixed(2)} جنيه`;
    else if (type === 'sales') msg += `عدد الفواتير: ${sales.length}\nإجمالي المبيعات: ${totalSales.toFixed(2)} جنيه\nأكبر فاتورة: ${sales.length ? Math.max(...sales.map(s => s.total)).toFixed(2) : 0} جنيه`;
    else if (type === 'inventory') msg += `عدد الأصناف: ${items.length}\nقيمة المخزون: ${totalStock.toFixed(2)} جنيه\nعدد المخازن: ${warehouses.length}`;
    else if (type === 'customers') msg += `عدد العملاء: ${customers.length}\nإجمالي أرصدة العملاء: ${customers.reduce((s, c) => s + c.balance, 0).toFixed(2)} جنيه\nعدد الموردين: ${suppliers.length}`;
    else if (type === 'cashflow') {
        let cashIn = treasuryIncome;
        let cashOut = treasuryExpense;
        msg += `إجمالي التدفقات الداخلة: ${cashIn.toFixed(2)} جنيه\nإجمالي التدفقات الخارجة: ${cashOut.toFixed(2)} جنيه\nصافي التدفق النقدي: ${(cashIn - cashOut).toFixed(2)} جنيه\nالرصيد النهائي: ${treasuryBalance.toFixed(2)} جنيه`;
    }
    alert(msg);
    addNotification('info', `تم عرض تقرير ${names[type]}`);
}

// ===== التبويبات =====
document.querySelectorAll('.tabs-header .tab-btn').forEach(btn => {
    btn.addEventListener('click', function() {
        const parent = this.closest('.tabs-container');
        parent.querySelectorAll('.tabs-header .tab-btn').forEach(b => b.classList.remove('active'));
        this.classList.add('active');
        const target = this.dataset.tab;
        parent.querySelectorAll('.tabs-body .tab-panel').forEach(p => p.classList.remove('active'));
        document.getElementById(target).classList.add('active');
    });
});

// ===== التنقل =====
document.querySelectorAll('nav a').forEach(link => {
    link.addEventListener('click', function(e) {
        e.preventDefault();
        if (this.id === 'logoutBtn') return;
        document.querySelectorAll('nav a').forEach(a => a.classList.remove('active'));
        this.classList.add('active');
        document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
        document.getElementById(`page-${this.dataset.page}`).classList.add('active');
        document.querySelector('.page-title').textContent = this.textContent.trim();
        document.querySelector('.sidebar').classList.remove('open');
        if (this.dataset.page === 'dashboard') { drawChart(); updateTopItems(); }
    });
});

// ===== قائمة الموبايل =====
document.querySelector('.menu-toggle').addEventListener('click', function() {
    document.querySelector('.sidebar').classList.toggle('open');
});

// ===== إغلاق المودالات =====
window.onclick = function(e) {
    if (e.target.classList.contains('modal')) e.target.style.display = 'none';
};

// ===== Dark Mode =====
function toggleDarkMode() {
    darkMode = !darkMode;
    document.body.classList.toggle('dark-mode');
    document.getElementById('darkIcon').className = darkMode ? 'fas fa-sun' : 'fas fa-moon';
    localStorage.setItem('darkMode', JSON.stringify(darkMode));
}
document.getElementById('darkModeToggle').addEventListener('click', toggleDarkMode);

// ===== رفع اللوجو =====
document.getElementById('logoUpload').addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(ev) {
            const preview = document.getElementById('logoPreview');
            preview.innerHTML = `<img src="${ev.target.result}" alt="شعار الشركة">`;
        };
        reader.readAsDataURL(file);
    }
});

// ===== حفظ بيانات الشركة =====
document.getElementById('companyForm').addEventListener('submit', function(e) {
    e.preventDefault();
    saveData();
    addNotification('success', '✅ تم حفظ بيانات الشركة بنجاح');
});

// ===== الرسم البياني =====
function drawChart() {
    const canvas = document.getElementById('salesChart');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const rect = canvas.parentElement.getBoundingClientRect();
    const width = rect.width - 40;
    const height = 200;
    canvas.width = width;
    canvas.height = height;
    const data = sales.length > 0 ? sales.map(s => s.total) : [12000, 19000, 15000, 22000, 18000, 25000];
    const maxData = Math.max(...data, 1);
    const barWidth = Math.min((width - 60) / Math.max(data.length, 6) - 6, 35);
    const startX = 30;
    ctx.fillStyle = 'var(--bg)';
    ctx.fillRect(0, 0, width, height);
    data.forEach((value, index) => {
        const x = startX + index * (barWidth + 6);
        const barHeight = (value / maxData) * (height - 60);
        const y = height - 20 - barHeight;
        const gradient = ctx.createLinearGradient(x, y, x, height - 20);
        gradient.addColorStop(0, '#4fc3f7');
        gradient.addColorStop(1, '#0288d1');
        ctx.fillStyle = gradient;
        ctx.shadowColor = 'rgba(79,195,247,0.3)';
        ctx.shadowBlur = 6;
        ctx.beginPath();
        ctx.roundRect(x, y, barWidth, barHeight, 4);
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.fillStyle = 'var(--text)';
        ctx.font = '10px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(value.toLocaleString(), x + barWidth/2, y - 4);
        const months = ['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'];
        ctx.fillStyle = 'var(--text-light)';
        ctx.font = '9px Arial';
        ctx.fillText(months[index % 12], x + barWidth/2, height - 4);
    });
}

// ===== أفضل الأصناف =====
function updateTopItems() {
    const container = document.getElementById('topItems');
    if (!container) return;
    const sorted = [...items].sort((a, b) => b.stock - a.stock).slice(0, 5);
    container.innerHTML = sorted.length ? sorted.map(i => `<div class="top-item"><span class="item-name">${i.name}</span><span class="item-sales">${i.stock} وحدة</span></div>`).join('') : '<div class="top-item"><span class="item-name">لا توجد أصناف</span></div>';
}

// ===== Polyfill للـ roundRect =====
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

console.log('✅ النظام المحاسبي المتكامل - النسخة النهائية');
console.log('👤 مستخدم: admin | 🔑 123456');
