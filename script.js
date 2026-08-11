// ===== البيانات =====
let customers = [], suppliers = [], items = [], warehouses = [], sales = [], purchases = [];
let salesReturns = [], purchasesReturns = [], treasuryTransactions = [];
let customerId = 1, supplierId = 1, itemId = 1, warehouseId = 1;
let saleInvoiceId = 1, purchaseInvoiceId = 1;
let treasuryBalance = 0, treasuryIncome = 0, treasuryExpense = 0;
const TAX_RATE = 0.14;

// ===== التهيئة =====
document.addEventListener('DOMContentLoaded', function() {
    // التاريخ
    const now = new Date();
    document.querySelector('.date-display').textContent = now.toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' });
    // تعبئة التواريخ في الفواتير
    document.querySelectorAll('input[type="date"]').forEach(el => {
        if (!el.value) el.value = now.toISOString().split('T')[0];
    });
    // بيانات افتراضية
    initDefaultData();
    updateAllUI();
    drawChart();
    updateTopItems();
});

// ===== بيانات افتراضية =====
function initDefaultData() {
    // عملاء
    customers.push({ id: customerId++, name: 'أحمد محمد', commercialReg: '123456', taxFile: 'TAX-001', creditLimit: 10000, defaultDue: 30, cashDiscount: 5, purchasePrice: 0, extraBalance: 0, city: 'القاهرة', address: 'وسط البلد', phone: '01001234567', email: 'ahmed@example.com', debit: 5000, credit: 0, balance: 5000, businessList: 'تجارة عامة' });
    customers.push({ id: customerId++, name: 'سارة علي', commercialReg: '789012', taxFile: 'TAX-002', creditLimit: 8000, defaultDue: 30, cashDiscount: 3, purchasePrice: 0, extraBalance: 0, city: 'الإسكندرية', address: 'المنشية', phone: '01008765432', email: 'sara@example.com', debit: 3200, credit: 0, balance: 3200, businessList: 'مقاولات' });
    // موردين
    suppliers.push({ id: supplierId++, name: 'مورد الإلكترونيات', commercialReg: '345678', taxFile: 'TAX-003', creditLimit: 20000, defaultDue: 45, cashDiscount: 3, purchasePrice: 0, extraBalance: 0, city: 'القاهرة', address: 'مدينة نصر', phone: '01005556677', email: 'supplier@example.com', debit: 0, credit: 6900, balance: -6900, businessList: 'إلكترونيات' });
    // أصناف
    items.push({ id: itemId++, code: '001', name: 'منتج عام 1', category: 'عام', unit: 'قطعة', purchasePrice: 100, salePrice: 150, stock: 50 });
    items.push({ id: itemId++, code: '002', name: 'منتج عام 2', category: 'عام', unit: 'كجم', purchasePrice: 200, salePrice: 280, stock: 30 });
    items.push({ id: itemId++, code: '003', name: 'منتج عام 3', category: 'عام', unit: 'علبة', purchasePrice: 50, salePrice: 75, stock: 100 });
    // مخازن
    warehouses.push({ id: warehouseId++, name: 'المخزن الرئيسي', location: 'القاهرة', desc: 'المخزن الرئيسي للشركة' });
    // مبيعات
    sales.push({ id: 1, invoiceNo: 'INV-2026-001', date: '2026-08-11', customer: 'أحمد محمد', subtotal: 4500, tax: 630, total: 5130, status: 'مدفوعة', payment: 'نقدي' });
    // مشتريات
    purchases.push({ id: 1, invoiceNo: 'PUR-2026-001', date: '2026-08-10', supplier: 'مورد الإلكترونيات', subtotal: 6000, tax: 840, total: 6840, status: 'مدفوعة', payment: 'تحويل' });
    // مرتجعات مبيعات
    salesReturns.push({ id: 1, returnNo: 'SR-001', date: '2026-08-11', invoiceNo: 'INV-2026-001', party: 'أحمد محمد', amount: 1000, reason: 'منتج تالف' });
    // خزينة
    treasuryBalance = 45500;
    treasuryIncome = 152000;
    treasuryExpense = 106500;
    treasuryTransactions.push({ date: '2026-08-11', desc: 'مبيعات - INV-2026-001', debit: 5130, credit: 0, balance: treasuryBalance });
    treasuryTransactions.push({ date: '2026-08-10', desc: 'مشتريات - PUR-2026-001', debit: 0, credit: 6840, balance: treasuryBalance - 6840 });
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
}

function updateStats() {
    let totalSales = sales.reduce((sum, s) => sum + s.total, 0);
    let totalPurchases = purchases.reduce((sum, p) => sum + p.total, 0);
    let totalStock = items.reduce((sum, i) => sum + (i.stock * i.purchasePrice), 0);
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
        row.innerHTML = `<td>${s.invoiceNo}</td><td>${s.date}</td><td>${s.customer}</td><td>${s.subtotal.toFixed(2)}</td><td>${s.tax.toFixed(2)}</td><td>${s.total.toFixed(2)}</td><td><span class="status ${s.status === 'مدفوعة' ? 'paid' : 'pending'}">${s.status}</span></td><td><button class="btn-edit" onclick="printInvoice('sale', ${s.id})"><i class="fas fa-print"></i></button><button class="btn-delete" onclick="deleteSale(${s.id})"><i class="fas fa-trash"></i></button></td>`;
        tbody.appendChild(row);
    });
}

function updatePurchasesList() {
    const tbody = document.getElementById('purchasesList');
    tbody.innerHTML = '';
    purchases.forEach(p => {
        let row = document.createElement('tr');
        row.innerHTML = `<td>${p.invoiceNo}</td><td>${p.date}</td><td>${p.supplier}</td><td>${p.subtotal.toFixed(2)}</td><td>${p.tax.toFixed(2)}</td><td>${p.total.toFixed(2)}</td><td><span class="status ${p.status === 'مدفوعة' ? 'paid' : 'pending'}">${p.status}</span></td><td><button class="btn-edit" onclick="printInvoice('purchase', ${p.id})"><i class="fas fa-print"></i></button><button class="btn-delete" onclick="deletePurchase(${p.id})"><i class="fas fa-trash"></i></button></td>`;
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
        let itemsCount = items.filter(i => i.warehouseId === w.id).length || items.length;
        let totalValue = items.reduce((sum, i) => sum + (i.stock * i.purchasePrice), 0);
        let card = document.createElement('div');
        card.className = 'warehouse-card';
        card.innerHTML = `<h3><i class="fas fa-warehouse"></i> ${w.name}</h3><p>الموقع: ${w.location}</p><div class="warehouse-stats"><span>عدد الأصناف: ${itemsCount}</span><span>القيمة: ${totalValue.toFixed(2)} جنيه</span></div><button class="btn-secondary" onclick="alert('عرض حركات المخزن ${w.name}')">عرض الحركات</button>`;
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
    select.innerHTML = '<option value="">-- اختر عميل --</option>';
    customers.forEach(c => {
        let opt = document.createElement('option');
        opt.value = c.name;
        opt.textContent = c.name;
        select.appendChild(opt);
    });
    const modalSelect = document.getElementById('saleCustomerSelect');
    if (modalSelect) {
        modalSelect.innerHTML = '<option value="">-- اختر عميل --</option>';
        customers.forEach(c => {
            let opt = document.createElement('option');
            opt.value = c.name;
            opt.textContent = c.name;
            modalSelect.appendChild(opt);
        });
    }
}

function updateSupplierSelects() {
    const select = document.getElementById('purchaseSupplierSelect');
    select.innerHTML = '<option value="">-- اختر مورد --</option>';
    suppliers.forEach(s => {
        let opt = document.createElement('option');
        opt.value = s.name;
        opt.textContent = s.name;
        select.appendChild(opt);
    });
}

// ===== العملاء والموردين =====
function switchCustomerTab(tab) {
    document.querySelectorAll('.customer-tabs .tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('#page-customers .tab-content').forEach(c => c.classList.remove('active'));
    if (tab === 'customers') {
        document.querySelector('.customer-tabs .tab-btn:first-child').classList.add('active');
        document.getElementById('customersTab').classList.add('active');
    } else {
        document.querySelector('.customer-tabs .tab-btn:last-child').classList.add('active');
        document.getElementById('suppliersTab').classList.add('active');
    }
}

function switchSubTab(tab) {
    document.querySelectorAll('#customersTab .sub-tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('#customersTab .sub-tab-content').forEach(c => c.classList.remove('active'));
    const map = { 'resources': 'resourcesTab', 'purchases': 'purchasesTab', 'cheques': 'chequesTab' };
    document.querySelectorAll('#customersTab .sub-tab-btn').forEach((b, i) => { if (i === Object.keys(map).indexOf(tab)) b.classList.add('active'); });
    document.getElementById(map[tab]).classList.add('active');
}

function switchSupplierSubTab(tab) {
    document.querySelectorAll('#suppliersTab .sub-tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('#suppliersTab .sub-tab-content').forEach(c => c.classList.remove('active'));
    const map = { 'resources': 'suppResourcesTab', 'purchases': 'suppPurchasesTab', 'cheques': 'suppChequesTab' };
    document.querySelectorAll('#suppliersTab .sub-tab-btn').forEach((b, i) => { if (i === Object.keys(map).indexOf(tab)) b.classList.add('active'); });
    document.getElementById(map[tab]).classList.add('active');
}

function showAddCustomerModal() { document.getElementById('customerModal').style.display = 'block'; }
function showAddSupplierModal() { document.getElementById('supplierModal').style.display = 'block'; }

document.getElementById('customerModalForm').addEventListener('submit', function(e) {
    e.preventDefault();
    let name = document.getElementById('modalCustName').value.trim();
    if (!name) { alert('يرجى إدخال اسم العميل'); return; }
    customers.push({ id: customerId++, name, commercialReg: document.getElementById('modalCustTax').value || '', taxFile: '', creditLimit: 0, defaultDue: 30, cashDiscount: 0, purchasePrice: 0, extraBalance: 0, city: '', address: document.getElementById('modalCustAddress').value || '', phone: document.getElementById('modalCustPhone').value || '', email: '', debit: 0, credit: 0, balance: 0, businessList: '' });
    updateAllUI();
    closeModal('customerModal');
    this.reset();
    alert('✅ تم إضافة العميل بنجاح');
});

document.getElementById('supplierModalForm').addEventListener('submit', function(e) {
    e.preventDefault();
    let name = document.getElementById('modalSuppName').value.trim();
    if (!name) { alert('يرجى إدخال اسم المورد'); return; }
    suppliers.push({ id: supplierId++, name, commercialReg: '', taxFile: '', creditLimit: 0, defaultDue: 30, cashDiscount: 0, purchasePrice: 0, extraBalance: 0, city: '', address: document.getElementById('modalSuppAddress').value || '', phone: document.getElementById('modalSuppPhone').value || '', email: '', debit: 0, credit: 0, balance: 0, businessList: '' });
    updateAllUI();
    closeModal('supplierModal');
    this.reset();
    alert('✅ تم إضافة المورد بنجاح');
});

document.getElementById('customerForm').addEventListener('submit', function(e) {
    e.preventDefault();
    let name = document.getElementById('custName').value.trim();
    if (!name) { alert('يرجى إدخال اسم العميل'); return; }
    let debit = parseFloat(document.getElementById('custDebit').value) || 0;
    let credit = parseFloat(document.getElementById('custCredit').value) || 0;
    let balance = debit - credit;
    let customer = { id: customerId++, name, commercialReg: document.getElementById('custCommercialReg').value, taxFile: document.getElementById('custTaxFile').value, creditLimit: parseFloat(document.getElementById('custCreditLimit').value) || 0, defaultDue: parseInt(document.getElementById('custDefaultDue').value) || 30, cashDiscount: parseFloat(document.getElementById('custCashDiscount').value) || 0, purchasePrice: parseFloat(document.getElementById('custPurchasePrice').value) || 0, extraBalance: parseFloat(document.getElementById('custExtraBalance').value) || 0, city: document.getElementById('custCity').value, address: document.getElementById('custAddress').value, phone: document.getElementById('custPhone').value, email: document.getElementById('custEmail').value, debit, credit, balance, businessList: document.getElementById('custBusinessList').value };
    customers.push(customer);
    updateAllUI();
    this.reset();
    alert(`✅ تم حفظ بيانات العميل ${name}`);
});

document.getElementById('supplierForm').addEventListener('submit', function(e) {
    e.preventDefault();
    let name = document.getElementById('suppName').value.trim();
    if (!name) { alert('يرجى إدخال اسم المورد'); return; }
    let debit = parseFloat(document.getElementById('suppDebit').value) || 0;
    let credit = parseFloat(document.getElementById('suppCredit').value) || 0;
    let balance = debit - credit;
    let supplier = { id: supplierId++, name, commercialReg: document.getElementById('suppCommercialReg').value, taxFile: document.getElementById('suppTaxFile').value, creditLimit: parseFloat(document.getElementById('suppCreditLimit').value) || 0, defaultDue: parseInt(document.getElementById('suppDefaultDue').value) || 30, cashDiscount: parseFloat(document.getElementById('suppCashDiscount').value) || 0, purchasePrice: parseFloat(document.getElementById('suppPurchasePrice').value) || 0, extraBalance: parseFloat(document.getElementById('suppExtraBalance').value) || 0, city: document.getElementById('suppCity').value, address: document.getElementById('suppAddress').value, phone: document.getElementById('suppPhone').value, email: document.getElementById('suppEmail').value, debit, credit, balance, businessList: document.getElementById('suppBusinessList').value };
    suppliers.push(supplier);
    updateAllUI();
    this.reset();
    alert(`✅ تم حفظ بيانات المورد ${name}`);
});

function saveCustomer() { document.getElementById('customerForm').dispatchEvent(new Event('submit')); }
function saveSupplier() { document.getElementById('supplierForm').dispatchEvent(new Event('submit')); }

function deleteCustomer(id) {
    if (confirm('هل أنت متأكد من حذف هذا العميل؟')) {
        customers = customers.filter(c => c.id !== id);
        updateAllUI();
        alert('تم الحذف');
    }
}
function deleteSupplier(id) {
    if (confirm('هل أنت متأكد من حذف هذا المورد؟')) {
        suppliers = suppliers.filter(s => s.id !== id);
        updateAllUI();
        alert('تم الحذف');
    }
}
function editCustomer(id) {
    let c = customers.find(c => c.id === id);
    if (!c) return;
    document.getElementById('custName').value = c.name;
    document.getElementById('custCommercialReg').value = c.commercialReg || '';
    document.getElementById('custTaxFile').value = c.taxFile || '';
    document.getElementById('custCreditLimit').value = c.creditLimit;
    document.getElementById('custDefaultDue').value = c.defaultDue;
    document.getElementById('custCashDiscount').value = c.cashDiscount;
    document.getElementById('custPurchasePrice').value = c.purchasePrice;
    document.getElementById('custExtraBalance').value = c.extraBalance;
    document.getElementById('custCity').value = c.city || '';
    document.getElementById('custAddress').value = c.address || '';
    document.getElementById('custPhone').value = c.phone || '';
    document.getElementById('custEmail').value = c.email || '';
    document.getElementById('custDebit').value = c.debit;
    document.getElementById('custCredit').value = c.credit;
    document.getElementById('custBalance').value = c.balance;
    document.getElementById('custBusinessList').value = c.businessList || '';
    customers = customers.filter(x => x.id !== id);
    updateAllUI();
    alert(`جاري تعديل ${c.name}`);
}
function editSupplier(id) {
    let s = suppliers.find(s => s.id === id);
    if (!s) return;
    document.getElementById('suppName').value = s.name;
    document.getElementById('suppCommercialReg').value = s.commercialReg || '';
    document.getElementById('suppTaxFile').value = s.taxFile || '';
    document.getElementById('suppCreditLimit').value = s.creditLimit;
    document.getElementById('suppDefaultDue').value = s.defaultDue;
    document.getElementById('suppCashDiscount').value = s.cashDiscount;
    document.getElementById('suppPurchasePrice').value = s.purchasePrice;
    document.getElementById('suppExtraBalance').value = s.extraBalance;
    document.getElementById('suppCity').value = s.city || '';
    document.getElementById('suppAddress').value = s.address || '';
    document.getElementById('suppPhone').value = s.phone || '';
    document.getElementById('suppEmail').value = s.email || '';
    document.getElementById('suppDebit').value = s.debit;
    document.getElementById('suppCredit').value = s.credit;
    document.getElementById('suppBalance').value = s.balance;
    document.getElementById('suppBusinessList').value = s.businessList || '';
    suppliers = suppliers.filter(x => x.id !== id);
    updateAllUI();
    alert(`جاري تعديل ${s.name}`);
}

// ===== شيكات =====
function addChequeRow() {
    let tbody = document.getElementById('chequesList');
    let row = document.createElement('tr');
    let today = new Date().toISOString().split('T')[0];
    let due = new Date(Date.now() + 30*24*60*60*1000).toISOString().split('T')[0];
    row.innerHTML = `<td><input type="date" class="cheque-date" value="${today}"></td><td><input type="text" class="cheque-number" placeholder="رقم الشيك"></td><td><input type="text" class="cheque-name" placeholder="اسم العملية"></td><td><input type="text" class="cheque-bank" placeholder="البنك"></td><td><input type="number" class="cheque-amount" value="0" step="0.01" oninput="calcChequeTotal()"></td><td><input type="date" class="cheque-due" value="${due}"></td><td><select class="cheque-status"><option value="تحت التحصيل">تحت التحصيل</option><option value="مقبوض">مقبوض</option><option value="مرتجع">مرتجع</option><option value="ملغي">ملغي</option></select></td><td><button class="btn-delete-sm" onclick="removeChequeRow(this)"><i class="fas fa-times"></i></button></td>`;
    tbody.appendChild(row);
    calcChequeTotal();
}
function removeChequeRow(btn) {
    if (document.querySelectorAll('#chequesList tr').length <= 1) { alert('يجب أن يكون هناك صف واحد على الأقل'); return; }
    btn.closest('tr').remove();
    calcChequeTotal();
}
function calcChequeTotal() {
    let total = 0;
    document.querySelectorAll('#chequesList .cheque-amount').forEach(inp => total += parseFloat(inp.value) || 0);
    document.getElementById('totalCheques').textContent = total.toFixed(2);
}
function addSupplierChequeRow() {
    let tbody = document.getElementById('suppChequesList');
    let row = document.createElement('tr');
    let today = new Date().toISOString().split('T')[0];
    let due = new Date(Date.now() + 30*24*60*60*1000).toISOString().split('T')[0];
    row.innerHTML = `<td><input type="date" class="cheque-date" value="${today}"></td><td><input type="text" class="cheque-number" placeholder="رقم الشيك"></td><td><input type="text" class="cheque-name" placeholder="اسم العملية"></td><td><input type="text" class="cheque-bank" placeholder="البنك"></td><td><input type="number" class="cheque-amount" value="0" step="0.01" oninput="calcSupplierChequeTotal()"></td><td><input type="date" class="cheque-due" value="${due}"></td><td><select class="cheque-status"><option value="تحت التحصيل">تحت التحصيل</option><option value="مقبوض">مقبوض</option><option value="مرتجع">مرتجع</option><option value="ملغي">ملغي</option></select></td><td><button class="btn-delete-sm" onclick="removeSupplierChequeRow(this)"><i class="fas fa-times"></i></button></td>`;
    tbody.appendChild(row);
    calcSupplierChequeTotal();
}
function removeSupplierChequeRow(btn) {
    if (document.querySelectorAll('#suppChequesList tr').length <= 1) { alert('يجب أن يكون هناك صف واحد على الأقل'); return; }
    btn.closest('tr').remove();
    calcSupplierChequeTotal();
}
function calcSupplierChequeTotal() {
    let total = 0;
    document.querySelectorAll('#suppChequesList .cheque-amount').forEach(inp => total += parseFloat(inp.value) || 0);
    document.getElementById('suppTotalCheques').textContent = total.toFixed(2);
}

// ===== الأصناف =====
function showAddItemModal() { document.getElementById('itemModal').style.display = 'block'; }
document.getElementById('itemForm').addEventListener('submit', function(e) {
    e.preventDefault();
    let code = document.getElementById('itemCode').value.trim();
    let name = document.getElementById('itemName').value.trim();
    if (!code || !name) { alert('يرجى إدخال الكود واسم الصنف'); return; }
    items.push({ id: itemId++, code, name, category: document.getElementById('itemCategory').value || 'عام', unit: document.getElementById('itemUnit').value, purchasePrice: parseFloat(document.getElementById('itemPurchasePrice').value) || 0, salePrice: parseFloat(document.getElementById('itemSalePrice').value) || 0, stock: parseInt(document.getElementById('itemStock').value) || 0 });
    updateAllUI();
    closeModal('itemModal');
    this.reset();
    alert('✅ تم إضافة الصنف');
});
function deleteItem(id) {
    if (confirm('هل أنت متأكد؟')) { items = items.filter(i => i.id !== id); updateAllUI(); }
}
function editItem(id) {
    let item = items.find(i => i.id === id);
    if (!item) return;
    document.getElementById('itemCode').value = item.code;
    document.getElementById('itemName').value = item.name;
    document.getElementById('itemCategory').value = item.category;
    document.getElementById('itemUnit').value = item.unit;
    document.getElementById('itemPurchasePrice').value = item.purchasePrice;
    document.getElementById('itemSalePrice').value = item.salePrice;
    document.getElementById('itemStock').value = item.stock;
    items = items.filter(i => i.id !== id);
    updateAllUI();
    document.getElementById('itemModal').style.display = 'block';
}

// ===== فواتير المبيعات =====
function openSaleInvoice() {
    document.getElementById('saleInvoiceModal').style.display = 'block';
    document.getElementById('saleInvoiceDate').value = new Date().toISOString().split('T')[0];
    document.getElementById('saleInvoiceNo').value = `INV-2026-${String(sales.length + 1).padStart(3, '0')}`;
    // تعبئة العملاء
    let select = document.getElementById('saleCustomerSelect');
    select.innerHTML = '<option value="">-- اختر عميل --</option>';
    customers.forEach(c => { let opt = document.createElement('option'); opt.value = c.name; opt.textContent = c.name; select.appendChild(opt); });
    // إعادة تعيين جدول الأصناف
    document.getElementById('saleInvoiceItems').innerHTML = `<tr class="item-row"><td><input type="text" class="item-code" placeholder="الكود" onchange="loadItemData(this)"></td><td><input type="text" class="item-name" placeholder="اسم الصنف"></td><td><select class="item-unit"><option value="قطعة">قطعة</option><option value="كجم">كجم</option><option value="علبة">علبة</option><option value="حزمة">حزمة</option></select></td><td><input type="number" class="item-qty" value="1" min="0" step="1" oninput="calcSaleRowTotal(this)"></td><td><input type="number" class="item-price" value="0" min="0" step="0.01" oninput="calcSaleRowTotal(this)"></td><td><input type="number" class="item-discount" value="0" min="0" step="0.01" oninput="calcSaleRowTotal(this)"></td><td><input type="number" class="item-total" value="0" readonly></td><td><span class="stock-balance">0</span></td><td><button type="button" class="btn-delete-sm" onclick="removeSaleRow(this)"><i class="fas fa-times"></i></button></td></tr>`;
    calcSaleSummary();
}
function addSaleRow() {
    let tbody = document.getElementById('saleInvoiceItems');
    let row = document.createElement('tr');
    row.className = 'item-row';
    row.innerHTML = `<td><input type="text" class="item-code" placeholder="الكود" onchange="loadItemData(this)"></td><td><input type="text" class="item-name" placeholder="اسم الصنف"></td><td><select class="item-unit"><option value="قطعة">قطعة</option><option value="كجم">كجم</option><option value="علبة">علبة</option><option value="حزمة">حزمة</option></select></td><td><input type="number" class="item-qty" value="1" min="0" step="1" oninput="calcSaleRowTotal(this)"></td><td><input type="number" class="item-price" value="0" min="0" step="0.01" oninput="calcSaleRowTotal(this)"></td><td><input type="number" class="item-discount" value="0" min="0" step="0.01" oninput="calcSaleRowTotal(this)"></td><td><input type="number" class="item-total" value="0" readonly></td><td><span class="stock-balance">0</span></td><td><button type="button" class="btn-delete-sm" onclick="removeSaleRow(this)"><i class="fas fa-times"></i></button></td>`;
    tbody.appendChild(row);
    calcSaleSummary();
}
function removeSaleRow(btn) {
    if (document.querySelectorAll('#saleInvoiceItems .item-row').length <= 1) { alert('يجب أن يكون هناك صف واحد على الأقل'); return; }
    btn.closest('tr').remove();
    calcSaleSummary();
}
function calcSaleRowTotal(el) {
    let row = el.closest('tr');
    let qty = parseFloat(row.querySelector('.item-qty').value) || 0;
    let price = parseFloat(row.querySelector('.item-price').value) || 0;
    let discount = parseFloat(row.querySelector('.item-discount').value) || 0;
    row.querySelector('.item-total').value = ((qty * price) - discount).toFixed(2);
    calcSaleSummary();
}
function calcSaleSummary() {
    let rows = document.querySelectorAll('#saleInvoiceItems .item-row');
    let totalQty = 0, totalDiscount = 0, grandTotal = 0;
    rows.forEach(row => {
        totalQty += parseFloat(row.querySelector('.item-qty').value) || 0;
        totalDiscount += parseFloat(row.querySelector('.item-discount').value) || 0;
        grandTotal += parseFloat(row.querySelector('.item-total').value) || 0;
    });
    document.getElementById('saleTotalQty').textContent = totalQty;
    document.getElementById('saleItemCount').textContent = rows.length;
    document.getElementById('saleTotalDiscount').textContent = totalDiscount.toFixed(2);
    document.getElementById('saleGrandTotal').textContent = grandTotal.toFixed(2);
}
function loadItemData(input) {
    let code = input.value.trim();
    if (!code) return;
    let item = items.find(i => i.code === code);
    if (!item) { alert('الصنف غير موجود'); input.value = ''; return; }
    let row = input.closest('tr');
    row.querySelector('.item-name').value = item.name;
    row.querySelector('.item-unit').value = item.unit;
    row.querySelector('.item-price').value = item.salePrice;
    row.querySelector('.stock-balance').textContent = item.stock;
    calcSaleRowTotal(row.querySelector('.item-price'));
}
function loadCustomerData() {
    let select = document.getElementById('saleCustomerSelect');
    let customer = customers.find(c => c.name === select.value);
    document.getElementById('saleCustomerBalance').textContent = customer ? customer.balance.toFixed(2) : '0.00';
}
function fetchCustomerData() {
    let select = document.getElementById('saleCustomerSelect');
    if (select.value) { loadCustomerData(); alert('تم جذب بيانات العميل'); } else { alert('اختر عميل أولاً'); }
}

document.getElementById('saleInvoiceForm').addEventListener('submit', function(e) {
    e.preventDefault();
    let customer = document.getElementById('saleCustomerSelect').value;
    let grandTotal = parseFloat(document.getElementById('saleGrandTotal').textContent) || 0;
    let invoiceNo = document.getElementById('saleInvoiceNo').value;
    let date = document.getElementById('saleInvoiceDate').value;
    if (!customer) { alert('اختر العميل'); return; }
    if (grandTotal === 0) { alert('أضف منتجات'); return; }
    let subtotal = grandTotal / (1 + TAX_RATE);
    let tax = grandTotal - subtotal;
    let sale = { id: sales.length + 1, invoiceNo, date, customer, subtotal, tax, total: grandTotal, status: 'مدفوعة', payment: document.getElementById('salePaymentMethod').value };
    sales.push(sale);
    // تحديث الخزينة
    addTreasuryTransaction(date, `مبيعات - ${invoiceNo}`, grandTotal, 0);
    updateAllUI();
    closeModal('saleInvoiceModal');
    alert(`✅ تم إصدار الفاتورة ${invoiceNo} بقيمة ${grandTotal.toFixed(2)} جنيه`);
});

// ===== فواتير المشتريات =====
function openPurchaseInvoice() {
    document.getElementById('purchaseInvoiceModal').style.display = 'block';
    document.getElementById('purchaseInvoiceDate').value = new Date().toISOString().split('T')[0];
    document.getElementById('purchaseInvoiceNo').value = `PUR-2026-${String(purchases.length + 1).padStart(3, '0')}`;
    let select = document.getElementById('purchaseSupplierSelect');
    select.innerHTML = '<option value="">-- اختر مورد --</option>';
    suppliers.forEach(s => { let opt = document.createElement('option'); opt.value = s.name; opt.textContent = s.name; select.appendChild(opt); });
    document.getElementById('purchaseInvoiceItems').innerHTML = `<tr class="item-row"><td><input type="text" class="item-code" placeholder="الكود" onchange="loadPurchaseItemData(this)"></td><td><input type="text" class="item-name" placeholder="اسم الصنف"></td><td><select class="item-unit"><option value="قطعة">قطعة</option><option value="كجم">كجم</option><option value="علبة">علبة</option><option value="حزمة">حزمة</option></select></td><td><input type="number" class="item-qty" value="1" min="0" step="1" oninput="calcPurchaseRowTotal(this)"></td><td><input type="number" class="item-price" value="0" min="0" step="0.01" oninput="calcPurchaseRowTotal(this)"></td><td><input type="number" class="item-discount" value="0" min="0" step="0.01" oninput="calcPurchaseRowTotal(this)"></td><td><input type="number" class="item-total" value="0" readonly></td><td><span class="stock-balance">0</span></td><td><button type="button" class="btn-delete-sm" onclick="removePurchaseRow(this)"><i class="fas fa-times"></i></button></td></tr>`;
    calcPurchaseSummary();
}
function addPurchaseRow() {
    let tbody = document.getElementById('purchaseInvoiceItems');
    let row = document.createElement('tr');
    row.className = 'item-row';
    row.innerHTML = `<td><input type="text" class="item-code" placeholder="الكود" onchange="loadPurchaseItemData(this)"></td><td><input type="text" class="item-name" placeholder="اسم الصنف"></td><td><select class="item-unit"><option value="قطعة">قطعة</option><option value="كجم">كجم</option><option value="علبة">علبة</option><option value="حزمة">حزمة</option></select></td><td><input type="number" class="item-qty" value="1" min="0" step="1" oninput="calcPurchaseRowTotal(this)"></td><td><input type="number" class="item-price" value="0" min="0" step="0.01" oninput="calcPurchaseRowTotal(this)"></td><td><input type="number" class="item-discount" value="0" min="0" step="0.01" oninput="calcPurchaseRowTotal(this)"></td><td><input type="number" class="item-total" value="0" readonly></td><td><span class="stock-balance">0</span></td><td><button type="button" class="btn-delete-sm" onclick="removePurchaseRow(this)"><i class="fas fa-times"></i></button></td>`;
    tbody.appendChild(row);
    calcPurchaseSummary();
}
function removePurchaseRow(btn) {
    if (document.querySelectorAll('#purchaseInvoiceItems .item-row').length <= 1) { alert('يجب أن يكون هناك صف واحد على الأقل'); return; }
    btn.closest('tr').remove();
    calcPurchaseSummary();
}
function calcPurchaseRowTotal(el) {
    let row = el.closest('tr');
    let qty = parseFloat(row.querySelector('.item-qty').value) || 0;
    let price = parseFloat(row.querySelector('.item-price').value) || 0;
    let discount = parseFloat(row.querySelector('.item-discount').value) || 0;
    row.querySelector('.item-total').value = ((qty * price) - discount).toFixed(2);
    calcPurchaseSummary();
}
function calcPurchaseSummary() {
    let rows = document.querySelectorAll('#purchaseInvoiceItems .item-row');
    let totalQty = 0, totalDiscount = 0, grandTotal = 0;
    rows.forEach(row => {
        totalQty += parseFloat(row.querySelector('.item-qty').value) || 0;
        totalDiscount += parseFloat(row.querySelector('.item-discount').value) || 0;
        grandTotal += parseFloat(row.querySelector('.item-total').value) || 0;
    });
    document.getElementById('purchaseTotalQty').textContent = totalQty;
    document.getElementById('purchaseItemCount').textContent = rows.length;
    document.getElementById('purchaseTotalDiscount').textContent = totalDiscount.toFixed(2);
    document.getElementById('purchaseGrandTotal').textContent = grandTotal.toFixed(2);
}
function loadPurchaseItemData(input) {
    let code = input.value.trim();
    if (!code) return;
    let item = items.find(i => i.code === code);
    if (!item) { alert('الصنف غير موجود'); input.value = ''; return; }
    let row = input.closest('tr');
    row.querySelector('.item-name').value = item.name;
    row.querySelector('.item-unit').value = item.unit;
    row.querySelector('.item-price').value = item.purchasePrice;
    row.querySelector('.stock-balance').textContent = item.stock;
    calcPurchaseRowTotal(row.querySelector('.item-price'));
}
function loadSupplierData() {
    let select = document.getElementById('purchaseSupplierSelect');
    let supplier = suppliers.find(s => s.name === select.value);
    document.getElementById('purchaseSupplierBalance').textContent = supplier ? supplier.balance.toFixed(2) : '0.00';
}
function fetchSupplierData() {
    let select = document.getElementById('purchaseSupplierSelect');
    if (select.value) { loadSupplierData(); alert('تم جذب بيانات المورد'); } else { alert('اختر مورد أولاً'); }
}

document.getElementById('purchaseInvoiceForm').addEventListener('submit', function(e) {
    e.preventDefault();
    let supplier = document.getElementById('purchaseSupplierSelect').value;
    let grandTotal = parseFloat(document.getElementById('purchaseGrandTotal').textContent) || 0;
    let invoiceNo = document.getElementById('purchaseInvoiceNo').value;
    let date = document.getElementById('purchaseInvoiceDate').value;
    if (!supplier) { alert('اختر المورد'); return; }
    if (grandTotal === 0) { alert('أضف منتجات'); return; }
    let subtotal = grandTotal / (1 + TAX_RATE);
    let tax = grandTotal - subtotal;
    let purchase = { id: purchases.length + 1, invoiceNo, date, supplier, subtotal, tax, total: grandTotal, status: 'مدفوعة', payment: document.getElementById('purchasePaymentMethod').value };
    purchases.push(purchase);
    addTreasuryTransaction(date, `مشتريات - ${invoiceNo}`, 0, grandTotal);
    updateAllUI();
    closeModal('purchaseInvoiceModal');
    alert(`✅ تم إصدار فاتورة الشراء ${invoiceNo} بقيمة ${grandTotal.toFixed(2)} جنيه`);
});

// ===== الخزينة =====
function addTreasuryTransaction(date, desc, debit, credit) {
    let balance = treasuryBalance + debit - credit;
    treasuryBalance = balance;
    treasuryIncome += debit;
    treasuryExpense += credit;
    treasuryTransactions.push({ date, desc, debit, credit, balance });
}

function showAddTransactionModal() { document.getElementById('transactionModal').style.display = 'block'; }
document.getElementById('transactionForm').addEventListener('submit', function(e) {
    e.preventDefault();
    let type = document.getElementById('transactionType').value;
    let desc = document.getElementById('transactionDesc').value.trim();
    let amount = parseFloat(document.getElementById('transactionAmount').value);
    if (!desc || !amount) { alert('يرجى إدخال البيان والمبلغ'); return; }
    let date = new Date().toISOString().split('T')[0];
    if (type === 'income') {
        addTreasuryTransaction(date, desc, amount, 0);
    } else {
        addTreasuryTransaction(date, desc, 0, amount);
    }
    updateAllUI();
    closeModal('transactionModal');
    this.reset();
    alert('✅ تم تسجيل الحركة');
});

// ===== المرتجعات =====
function switchReturnTab(tab) {
    document.querySelectorAll('.returns-tabs .tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('#page-returns .tab-content').forEach(c => c.classList.remove('active'));
    if (tab === 'sales-returns') {
        document.querySelector('.returns-tabs .tab-btn:first-child').classList.add('active');
        document.getElementById('sales-returns').classList.add('active');
    } else {
        document.querySelector('.returns-tabs .tab-btn:last-child').classList.add('active');
        document.getElementById('purchases-returns').classList.add('active');
    }
}

function openReturnModal(type) {
    document.getElementById('returnModal').style.display = 'block';
    document.getElementById('returnType').value = type;
}

document.getElementById('returnForm').addEventListener('submit', function(e) {
    e.preventDefault();
    let type = document.getElementById('returnType').value;
    let invoiceNo = document.getElementById('returnInvoiceNo').value.trim();
    let party = document.getElementById('returnParty').value.trim();
    let item = document.getElementById('returnItem').value.trim();
    let amount = parseFloat(document.getElementById('returnAmount').value);
    let reason = document.getElementById('returnReason').value;
    if (!invoiceNo || !party || !item || !amount) { alert('يرجى ملء جميع الحقول'); return; }
    let date = new Date().toISOString().split('T')[0];
    let returnNo = (type === 'sales' ? 'SR-' : 'PR-') + String((type === 'sales' ? salesReturns.length : purchasesReturns.length) + 1).padStart(3, '0');
    if (type === 'sales') {
        salesReturns.push({ id: salesReturns.length + 1, returnNo, date, invoiceNo, party, amount, reason });
        addTreasuryTransaction(date, `مرتجع مبيعات - ${returnNo}`, 0, amount);
    } else {
        purchasesReturns.push({ id: purchasesReturns.length + 1, returnNo, date, invoiceNo, party, amount, reason });
        addTreasuryTransaction(date, `مرتجع مشتريات - ${returnNo}`, amount, 0);
    }
    updateAllUI();
    closeModal('returnModal');
    this.reset();
    alert(`✅ تم تسجيل المرتجع ${returnNo}`);
});

// ===== المخازن =====
function showAddWarehouseModal() { document.getElementById('warehouseModal').style.display = 'block'; }
document.getElementById('warehouseForm').addEventListener('submit', function(e) {
    e.preventDefault();
    let name = document.getElementById('warehouseName').value.trim();
    if (!name) { alert('يرجى إدخال اسم المخزن'); return; }
    warehouses.push({ id: warehouseId++, name, location: document.getElementById('warehouseLocation').value || '', desc: document.getElementById('warehouseDesc').value || '' });
    updateAllUI();
    closeModal('warehouseModal');
    this.reset();
    alert('✅ تم إضافة المخزن');
});

// ===== التقارير =====
function generateReport(type) {
    const names = { 'balance': 'ميزان المراجعة', 'income': 'قائمة الدخل', 'financial': 'المركز المالي', 'sales': 'تقرير المبيعات', 'inventory': 'تقرير المخزون', 'customers': 'تقرير العملاء' };
    let totalSales = sales.reduce((s, x) => s + x.total, 0);
    let totalPurchases = purchases.reduce((s, x) => s + x.total, 0);
    let totalStock = items.reduce((s, i) => s + (i.stock * i.purchasePrice), 0);
    let msg = `📊 ${names[type]}\n\n`;
    if (type === 'balance') msg += `إجمالي المبيعات: ${totalSales.toFixed(2)} جنيه\nإجمالي المشتريات: ${totalPurchases.toFixed(2)} جنيه\nرصيد الخزينة: ${treasuryBalance.toFixed(2)} جنيه\nقيمة المخزون: ${totalStock.toFixed(2)} جنيه`;
    else if (type === 'income') msg += `الإيرادات: ${totalSales.toFixed(2)} جنيه\nالمصروفات: ${totalPurchases.toFixed(2)} جنيه\nصافي الربح: ${(totalSales - totalPurchases).toFixed(2)} جنيه`;
    else if (type === 'financial') msg += `الأصول: ${(treasuryBalance + totalStock).toFixed(2)} جنيه\nالخصوم: ${totalPurchases.toFixed(2)} جنيه\nحقوق الملكية: ${(treasuryBalance + totalStock - totalPurchases).toFixed(2)} جنيه`;
    else if (type === 'sales') msg += `عدد الفواتير: ${sales.length}\nإجمالي المبيعات: ${totalSales.toFixed(2)} جنيه\nأكبر فاتورة: ${sales.length ? Math.max(...sales.map(s => s.total)).toFixed(2) : 0} جنيه`;
    else if (type === 'inventory') msg += `عدد الأصناف: ${items.length}\nقيمة المخزون: ${totalStock.toFixed(2)} جنيه\nعدد المخازن: ${warehouses.length}`;
    else if (type === 'customers') msg += `عدد العملاء: ${customers.length}\nإجمالي أرصدة العملاء: ${customers.reduce((s, c) => s + c.balance, 0).toFixed(2)} جنيه\nعدد الموردين: ${suppliers.length}`;
    alert(msg);
}

// ===== دوال مساعدة =====
function goBack() { document.querySelector('nav a[data-page="dashboard"]').click(); }
function closeModal(id) { document.getElementById(id).style.display = 'none'; }
function deleteSale(id) { if (confirm('هل أنت متأكد؟')) { sales = sales.filter(s => s.id !== id); updateAllUI(); } }
function deletePurchase(id) { if (confirm('هل أنت متأكد؟')) { purchases = purchases.filter(p => p.id !== id); updateAllUI(); } }
function printInvoice(type, id) {
    if (type === 'sale') {
        let s = sales.find(x => x.id === id);
        if (s) alert(`طباعة فاتورة المبيعات ${s.invoiceNo}`);
    } else {
        let p = purchases.find(x => x.id === id);
        if (p) alert(`طباعة فاتورة المشتريات ${p.invoiceNo}`);
    }
}
function deleteInvoice(type) { if (confirm('هل أنت متأكد من حذف الفاتورة؟')) alert('تم الحذف'); }

// ===== الرسم البياني =====
function drawChart() {
    let canvas = document.getElementById('salesChart');
    if (!canvas) return;
    let ctx = canvas.getContext('2d');
    let rect = canvas.parentElement.getBoundingClientRect();
    let width = rect.width - 40;
    let height = 200;
    canvas.width = width;
    canvas.height = height;
    let data = [12000, 19000, 15000, 22000, 18000, 25000, 21000, 28000, 24000, 30000, 27000, 33000];
    let maxData = Math.max(...data);
    let barWidth = Math.min((width - 60) / data.length - 8, 30);
    let startX = 30;
    ctx.fillStyle = '#f8f9fa';
    ctx.fillRect(0, 0, width, height);
    data.forEach((value, index) => {
        let x = startX + index * (barWidth + 8);
        let barHeight = (value / maxData) * (height - 60);
        let y = height - 20 - barHeight;
        let gradient = ctx.createLinearGradient(x, y, x, height - 20);
        gradient.addColorStop(0, '#4fc3f7');
        gradient.addColorStop(1, '#0288d1');
        ctx.fillStyle = gradient;
        ctx.shadowColor = 'rgba(79, 195, 247, 0.3)';
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.moveTo(x + 4, y);
        ctx.lineTo(x + barWidth - 4, y);
        ctx.quadraticCurveTo(x + barWidth, y, x + barWidth, y + 4);
        ctx.lineTo(x + barWidth, height - 20);
        ctx.lineTo(x, height - 20);
        ctx.lineTo(x, y + 4);
        ctx.quadraticCurveTo(x, y, x + 4, y);
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.fillStyle = '#2c3e50';
        ctx.font = '11px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(value.toLocaleString(), x + barWidth/2, y - 5);
        let months = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
        ctx.fillStyle = '#7f8c8d';
        ctx.font = '10px Arial';
        ctx.fillText(months[index], x + barWidth/2, height - 3);
    });
}

function updateTopItems() {
    let container = document.getElementById('topItems');
    if (!container) return;
    let sorted = [...items].sort((a, b) => b.stock - a.stock).slice(0, 5);
    container.innerHTML = sorted.map(i => `<div class="top-item"><span class="item-name">${i.name}</span><span class="item-sales">${i.stock} وحدة</span></div>`).join('');
}

// ===== التنقل =====
document.querySelectorAll('nav a').forEach(link => {
    link.addEventListener('click', function(e) {
        e.preventDefault();
        document.querySelectorAll('nav a').forEach(a => a.classList.remove('active'));
        this.classList.add('active');
        document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
        document.getElementById(`page-${this.dataset.page}`).classList.add('active');
        document.querySelector('.page-title').textContent = this.textContent.trim();
        document.querySelector('.sidebar').classList.remove('open');
    });
});
document.querySelector('.menu-toggle').addEventListener('click', function() {
    document.querySelector('.sidebar').classList.toggle('open');
});
window.onclick = function(e) { if (e.target.classList.contains('modal')) e.target.style.display = 'none'; };

// ===== رفع اللوجو =====
document.getElementById('logoUpload').addEventListener('change', function(e) {
    let file = e.target.files[0];
    if (file) {
        let reader = new FileReader();
        reader.onload = function(ev) {
            let preview = document.getElementById('logoPreview');
            preview.innerHTML = `<img src="${ev.target.result}" alt="شعار الشركة">`;
        };
        reader.readAsDataURL(file);
    }
});

// ===== حفظ بيانات الشركة =====
document.getElementById('companyForm').addEventListener('submit', function(e) {
    e.preventDefault();
    alert('✅ تم حفظ بيانات الشركة بنجاح');
});

console.log('✅ النظام المحاسبي المتكامل جاهز - عملة: جنيه مصري');
