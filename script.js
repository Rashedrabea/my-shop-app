// ================================================================
// 💾 النظام المحاسبي المتكامل - باستخدام LocalStorage
// ================================================================

let customers = [], suppliers = [], items = [], warehouses = [], sales = [], purchases = [];
let salesReturns = [], purchasesReturns = [], treasuryTransactions = [];
let leads = [], quotations = [], auditLog = [];
let customerId = 1, supplierId = 1, itemId = 1, warehouseId = 1;
let treasuryBalance = 0, treasuryIncome = 0, treasuryExpense = 0;
let currentUser = null;
let notifications = [];
let darkMode = false;

// ================================================================
// التهيئة
// ================================================================
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(() => document.getElementById('loader').style.display = 'none', 400);
    const now = new Date();
    document.querySelectorAll('.date-display').forEach(el => {
        el.textContent = now.toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' });
    });
    if (localStorage.getItem('darkMode') === 'true') {
        document.body.classList.add('dark-mode');
        document.getElementById('darkIcon').className = 'fas fa-sun';
    }
    // قائمة الموبايل
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
    loadData();
});

// ================================================================
// 💾 حفظ وتحميل البيانات
// ================================================================
function saveData() {
    try {
        const data = {
            customers, suppliers, items, warehouses, sales, purchases,
            salesReturns, purchasesReturns, treasuryTransactions,
            treasuryBalance, treasuryIncome, treasuryExpense,
            leads, quotations, auditLog,
            customerId, supplierId, itemId, warehouseId
        };
        localStorage.setItem('accounting_data', JSON.stringify(data));
        localStorage.setItem('accounting_data_updated', new Date().toISOString());
        console.log('✅ تم حفظ البيانات محلياً');
    } catch (e) {
        console.error('❌ خطأ في الحفظ المحلي:', e);
    }
}

function loadData() {
    try {
        const data = JSON.parse(localStorage.getItem('accounting_data'));
        if (data) {
            customers = data.customers || [];
            suppliers = data.suppliers || [];
            items = data.items || [];
            warehouses = data.warehouses || [];
            sales = data.sales || [];
            purchases = data.purchases || [];
            salesReturns = data.salesReturns || [];
            purchasesReturns = data.purchasesReturns || [];
            treasuryTransactions = data.treasuryTransactions || [];
            treasuryBalance = data.treasuryBalance || 0;
            treasuryIncome = data.treasuryIncome || 0;
            treasuryExpense = data.treasuryExpense || 0;
            leads = data.leads || [];
            quotations = data.quotations || [];
            auditLog = data.auditLog || [];
            customerId = data.customerId || 1;
            supplierId = data.supplierId || 1;
            itemId = data.itemId || 1;
            warehouseId = data.warehouseId || 1;
            console.log('✅ تم تحميل البيانات محلياً');
            updateAllUI();
            drawChart();
            updateTopItems();
            return true;
        }
        return false;
    } catch (e) {
        console.error('❌ خطأ في التحميل المحلي:', e);
        return false;
    }
}

// ================================================================
// تسجيل الدخول
// ================================================================
document.getElementById('loginForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value;
    const pass = document.getElementById('loginPass').value;
    if (email && pass) {
        // التحقق من وجود المستخدم
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        const user = users.find(u => u.email === email && u.password === pass);
        if (user) {
            afterLogin(user.name);
        } else {
            // إذا لم يوجد، نضيفه كأول مستخدم
            const newUser = { name: 'admin', email: email, password: pass };
            users.push(newUser);
            localStorage.setItem('users', JSON.stringify(users));
            afterLogin('admin');
        }
    }
});

document.getElementById('signupForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const name = document.getElementById('signupName').value.trim();
    const email = document.getElementById('signupEmail').value.trim();
    const pass = document.getElementById('signupPass').value;
    if (!name || !email || !pass) {
        alert('❌ يرجى ملء جميع الحقول');
        return;
    }
    if (pass.length < 6) {
        alert('❌ كلمة المرور يجب أن تكون 6 أحرف على الأقل');
        return;
    }
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    if (users.find(u => u.email === email)) {
        alert('❌ هذا البريد الإلكتروني مستخدم بالفعل');
        return;
    }
    users.push({ name, email, password: pass });
    localStorage.setItem('users', JSON.stringify(users));
    alert('✅ تم إنشاء الحساب بنجاح!');
    afterLogin(name);
});

function afterLogin(name) {
    currentUser = name;
    document.getElementById('loginScreen').style.display = 'none';
    document.getElementById('app').style.display = 'flex';
    document.getElementById('userNameDisplay').textContent = name;
    document.getElementById('headerUserName').textContent = name;
    loadData();
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

// ================================================================
// تسجيل الخروج
// ================================================================
document.getElementById('logoutBtn').addEventListener('click', function(e) {
    e.preventDefault();
    if (confirm('تسجيل الخروج؟')) {
        logAction('تسجيل خروج', { user: currentUser });
        document.getElementById('app').style.display = 'none';
        document.getElementById('loginScreen').style.display = 'flex';
        currentUser = null;
    }
});

// ================================================================
// 📋 سجل العمليات
// ================================================================
function logAction(action, details) {
    const logEntry = {
        id: Date.now(),
        timestamp: new Date().toISOString(),
        userId: currentUser || 'guest',
        action: action,
        details: JSON.stringify(details)
    };
    auditLog.push(logEntry);
    updateAuditLog();
    saveData();
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
}

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
    
    // العملاء
    const ct = document.getElementById('customersList');
    if (ct) {
        ct.innerHTML = '';
        customers.forEach(c => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${c.name}</td>
                <td>${c.type || 'عميل'}</td>
                <td>${c.phone || '-'}</td>
                <td>${(c.balance || 0).toFixed(2)}</td>
                <td><button class="btn-delete" onclick="deleteCustomer(${c.id})"><i class="fas fa-trash"></i></button></td>
            `;
            ct.appendChild(row);
        });
    }
    
    // الموردين
    const st = document.getElementById('suppliersList');
    if (st) {
        st.innerHTML = '';
        suppliers.forEach(s => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${s.name}</td>
                <td>${s.type || 'مورد'}</td>
                <td>${s.phone || '-'}</td>
                <td>${(s.balance || 0).toFixed(2)}</td>
                <td><button class="btn-delete" onclick="deleteSupplier(${s.id})"><i class="fas fa-trash"></i></button></td>
            `;
            st.appendChild(row);
        });
    }
    
    // الأصناف
    const it = document.getElementById('itemsList');
    if (it) {
        it.innerHTML = '';
        items.forEach(i => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${i.code}</td>
                <td>${i.name}</td>
                <td>${i.unit || 'قطعة'}</td>
                <td>${(i.salePrice || 0).toFixed(2)}</td>
                <td>${i.stock || 0}</td>
                <td><button class="btn-delete" onclick="deleteItem(${i.id})"><i class="fas fa-trash"></i></button></td>
            `;
            it.appendChild(row);
        });
    }
    
    // المبيعات
    const sl = document.getElementById('salesList');
    if (sl) {
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
    }
    
    // المشتريات
    const pl = document.getElementById('purchasesList');
    if (pl) {
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
    }
    
    // الخزينة
    const tt = document.getElementById('treasuryTransactions');
    if (tt) {
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
    }
    
    // مرتجعات المبيعات
    const srt = document.getElementById('salesReturnsList');
    if (srt) {
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
            `;
            srt.appendChild(row);
        });
    }
    
    // مرتجعات المشتريات
    const prt = document.getElementById('purchasesReturnsList');
    if (prt) {
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
            `;
            prt.appendChild(row);
        });
    }
    
    // العملاء المحتملين
    updateLeadsList();
    
    // المخازن
    const wg = document.getElementById('warehousesGrid');
    if (wg) {
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
    }
    
    // آخر الفواتير
    const rt = document.getElementById('recentInvoicesList');
    if (rt) {
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
    }
    
    updateCustomerSelects();
    updateSupplierSelects();
    updateReturnCustomerSelects();
    updateReturnSupplierSelects();
    updateCollectionSelects();
    updatePaymentSelects();
    updateAuditLog();
    
    document.getElementById('lastUpdate').textContent = new Date().toLocaleString('ar-EG');
    saveData();
}

// ================================================================
// العملاء والموردين
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

// ===== العملاء المحتملين =====
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
            <td><span class="status pending">${l.status || 'جديد'}</span></td>
            <td>
                <button class="btn-success" onclick="convertLeadToCustomer(${l.id})"><i class="fas fa-user-check"></i> تحويل</button>
                <button class="btn-delete" onclick="deleteLead(${l.id})"><i class="fas fa-trash"></i></button>
            </td>
        `;
        tbody.appendChild(row);
    });
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
        creditLimit: 0
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

// ================================================================
// المودالات
// ================================================================
function showModal(id) { document.getElementById(id).style.display = 'block'; }
function closeModal(id) { document.getElementById(id).style.display = 'none'; }
window.onclick = function(e) { if (e.target.classList.contains('modal')) e.target.style.display = 'none'; };

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

// ================================================================
// دوال الإضافة والحذف
// ================================================================

// ===== العملاء =====
document.getElementById('customerForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const name = document.getElementById('custName').value.trim();
    if (!name) { alert('أدخل الاسم'); return; }
    const customer = {
        id: customerId++,
        name,
        type: document.getElementById('custType').value,
        phone: document.getElementById('custPhone').value || '',
        creditLimit: parseFloat(document.getElementById('custCreditLimit').value) || 0,
        balance: 0
    };
    customers.push(customer);
    logAction('إضافة عميل', { name });
    updateAllUI();
    closeModal('customerModal');
    this.reset();
    addNotification('success', `✅ تم إضافة ${name}`);
});

function deleteCustomer(id) {
    if (confirm('حذف العميل؟')) {
        customers = customers.filter(c => c.id !== id);
        logAction('حذف عميل', { id });
        updateAllUI();
        addNotification('warning', 'تم الحذف');
    }
}

// ===== الموردين =====
document.getElementById('supplierForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const name = document.getElementById('suppName').value.trim();
    if (!name) { alert('أدخل الاسم'); return; }
    const supplier = {
        id: supplierId++,
        name,
        type: document.getElementById('suppType').value,
        phone: document.getElementById('suppPhone').value || '',
        creditLimit: parseFloat(document.getElementById('suppCreditLimit').value) || 0,
        balance: 0
    };
    suppliers.push(supplier);
    logAction('إضافة مورد', { name });
    updateAllUI();
    closeModal('supplierModal');
    this.reset();
    addNotification('success', `✅ تم إضافة ${name}`);
});

function deleteSupplier(id) {
    if (confirm('حذف المورد؟')) {
        suppliers = suppliers.filter(s => s.id !== id);
        logAction('حذف مورد', { id });
        updateAllUI();
        addNotification('warning', 'تم الحذف');
    }
}

// ===== الأصناف =====
document.getElementById('itemForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const code = document.getElementById('itemCode').value.trim();
    const name = document.getElementById('itemName').value.trim();
    if (!code || !name) { alert('أدخل الكود والاسم'); return; }
    const item = {
        id: itemId++,
        code,
        name,
        unit: document.getElementById('itemUnit').value,
        salePrice: parseFloat(document.getElementById('itemSalePrice').value) || 0,
        stock: parseInt(document.getElementById('itemStock').value) || 0
    };
    items.push(item);
    logAction('إضافة صنف', { code, name });
    updateAllUI();
    closeModal('itemModal');
    this.reset();
    addNotification('success', `✅ تم إضافة ${name}`);
});

function deleteItem(id) {
    if (confirm('حذف الصنف؟')) {
        items = items.filter(i => i.id !== id);
        logAction('حذف صنف', { id });
        updateAllUI();
        addNotification('warning', 'تم الحذف');
    }
}

// ===== العملاء المحتملين =====
document.getElementById('leadForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const name = document.getElementById('leadName').value.trim();
    if (!name) { alert('أدخل الاسم'); return; }
    const lead = {
        id: leads.length + 1,
        name,
        phone: document.getElementById('leadPhone').value || '',
        source: document.getElementById('leadSource').value,
        status: 'جديد',
        createdAt: new Date().toISOString()
    };
    leads.push(lead);
    updateLeadsList();
    logAction('إضافة عميل محتمل', { name });
    addNotification('success', `✅ تم إضافة العميل المحتمل ${name}`);
    closeModal('leadModal');
    this.reset();
});

// ================================================================
// المخازن
// ================================================================
document.getElementById('warehouseForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const name = document.getElementById('warehouseName').value.trim();
    if (!name) { alert('أدخل الاسم'); return; }
    const warehouse = { id: warehouseId++, name, location: document.getElementById('warehouseLocation').value || '' };
    warehouses.push(warehouse);
    logAction('إضافة مخزن', { name });
    updateAllUI();
    closeModal('warehouseModal');
    this.reset();
    addNotification('success', `✅ تم إضافة ${name}`);
});

// ================================================================
// الخزينة
// ================================================================
document.getElementById('treasuryDepositForm').addEventListener('submit', function(e) {
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
        balance: treasuryBalance
    };
    treasuryTransactions.push(trans);
    logAction('إيداع', { desc, amount });
    updateAllUI();
    closeModal('treasuryDepositModal');
    this.reset();
    addNotification('success', `✅ تم تسجيل الإيداع بقيمة ${amount}`);
});

document.getElementById('treasuryWithdrawForm').addEventListener('submit', function(e) {
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
        balance: treasuryBalance
    };
    treasuryTransactions.push(trans);
    logAction('سحب', { desc, amount });
    updateAllUI();
    closeModal('treasuryWithdrawModal');
    this.reset();
    addNotification('warning', `✅ تم تسجيل السحب بقيمة ${amount}`);
});

document.getElementById('treasuryTransferForm').addEventListener('submit', function(e) {
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
    treasuryBalance += amount;
    treasuryIncome += amount;
    const trans2 = { id: Date.now() + 1, date, type: 'تحويل (إلى)', desc: `${desc} - إلى ${to}`, debit: amount, credit: 0, balance: treasuryBalance };
    treasuryTransactions.push(trans2);
    logAction('تحويل بين الخزن', { from, to, amount });
    updateAllUI();
    closeModal('treasuryTransferModal');
    this.reset();
    addNotification('success', `✅ تم تحويل ${amount} من ${from} إلى ${to}`);
});

document.getElementById('treasuryCollectionForm').addEventListener('submit', function(e) {
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
    const cust = customers.find(c => c.name === customer);
    if (cust) {
        cust.balance = (cust.balance || 0) - amount;
    }
    logAction('تحصيل من عميل', { customer, amount });
    updateAllUI();
    closeModal('treasuryCollectionModal');
    this.reset();
    addNotification('success', `✅ تم تحصيل ${amount} من ${customer}`);
});

document.getElementById('treasuryPaymentForm').addEventListener('submit', function(e) {
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
    const supp = suppliers.find(s => s.name === supplier);
    if (supp) {
        supp.balance = (supp.balance || 0) + amount;
    }
    logAction('سداد لمورد', { supplier, amount });
    updateAllUI();
    closeModal('treasuryPaymentModal');
    this.reset();
    addNotification('warning', `✅ تم سداد ${amount} لـ ${supplier}`);
});

// ================================================================
// الفواتير
// ================================================================
function openSaleInvoice() {
    document.getElementById('saleInvoiceModal').style.display = 'block';
    document.getElementById('saleInvoiceDate').value = new Date().toISOString().split('T')[0];
    document.getElementById('saleInvoiceNo').value = `INV-${String(sales.length + 1).padStart(4, '0')}`;
    updateCustomerSelects();
    document.getElementById('saleInvoiceItems').innerHTML = `
        <tr class="item-row">
            <td><input type="text" class="item-name" placeholder="اسم الصنف"></td>
            <td><input type="number" class="item-qty" value="1" oninput="calcSaleRowTotal(this)"></td>
            <td><input type="number" class="item-price" value="0" oninput="calcSaleRowTotal(this)"></td>
            <td><input type="number" class="item-discount" value="0" oninput="calcSaleRowTotal(this)"></td>
            <td><input type="number" class="item-total" value="0" readonly></td>
            <td><button type="button" class="btn-delete-sm" onclick="removeSaleRow(this)"><i class="fas fa-times"></i></button></td>
        </tr>
    `;
    calcSaleSummary();
}

function calcSaleRowTotal(el) {
    const row = el.closest('tr');
    const qty = parseFloat(row.querySelector('.item-qty').value) || 0;
    const price = parseFloat(row.querySelector('.item-price').value) || 0;
    const discount = parseFloat(row.querySelector('.item-discount').value) || 0;
    row.querySelector('.item-total').value = ((qty * price) - discount).toFixed(2);
    calcSaleSummary();
}

function calcSaleSummary() {
    const rows = document.querySelectorAll('#saleInvoiceItems .item-row');
    let grandTotal = 0;
    rows.forEach(row => {
        grandTotal += parseFloat(row.querySelector('.item-total').value) || 0;
    });
    document.getElementById('saleGrandTotal').textContent = grandTotal.toFixed(2);
}

function addSaleRow() {
    const tbody = document.getElementById('saleInvoiceItems');
    const row = document.createElement('tr');
    row.className = 'item-row';
    row.innerHTML = `
        <td><input type="text" class="item-name" placeholder="اسم الصنف"></td>
        <td><input type="number" class="item-qty" value="1" oninput="calcSaleRowTotal(this)"></td>
        <td><input type="number" class="item-price" value="0" oninput="calcSaleRowTotal(this)"></td>
        <td><input type="number" class="item-discount" value="0" oninput="calcSaleRowTotal(this)"></td>
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

document.getElementById('saleInvoiceForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const customer = document.getElementById('saleCustomerSelect').value;
    const grandTotal = parseFloat(document.getElementById('saleGrandTotal').textContent) || 0;
    const invoiceNo = document.getElementById('saleInvoiceNo').value;
    const date = document.getElementById('saleInvoiceDate').value;
    if (!customer) { alert('اختر العميل'); return; }
    if (grandTotal === 0) { alert('أضف منتجات'); return; }
    const tax = grandTotal * 0.14;
    const subtotal = grandTotal - tax;
    const sale = {
        id: sales.length + 1,
        invoiceNo,
        date,
        customer,
        subtotal,
        tax,
        total: grandTotal,
        status: 'مدفوعة',
        payment: document.getElementById('salePaymentMethod').value
    };
    sales.push(sale);
    treasuryBalance += grandTotal;
    treasuryIncome += grandTotal;
    const trans = {
        id: Date.now(),
        date,
        type: 'مبيعات',
        desc: `مبيعات - ${invoiceNo}`,
        debit: grandTotal,
        credit: 0,
        balance: treasuryBalance
    };
    treasuryTransactions.push(trans);
    logAction('إضافة فاتورة مبيعات', { invoiceNo, customer, grandTotal });
    updateAllUI();
    closeModal('saleInvoiceModal');
    addNotification('success', `✅ فاتورة ${invoiceNo} بقيمة ${grandTotal.toFixed(2)}`);
});

// ===== المشتريات =====
function openPurchaseInvoice() {
    document.getElementById('purchaseInvoiceModal').style.display = 'block';
    document.getElementById('purchaseInvoiceDate').value = new Date().toISOString().split('T')[0];
    document.getElementById('purchaseInvoiceNo').value = `PUR-${String(purchases.length + 1).padStart(4, '0')}`;
    updateSupplierSelects();
    document.getElementById('purchaseInvoiceItems').innerHTML = `
        <tr class="item-row">
            <td><input type="text" class="item-name" placeholder="اسم الصنف"></td>
            <td><input type="number" class="item-qty" value="1" oninput="calcPurchaseRowTotal(this)"></td>
            <td><input type="number" class="item-price" value="0" oninput="calcPurchaseRowTotal(this)"></td>
            <td><input type="number" class="item-discount" value="0" oninput="calcPurchaseRowTotal(this)"></td>
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
    const discount = parseFloat(row.querySelector('.item-discount').value) || 0;
    row.querySelector('.item-total').value = ((qty * price) - discount).toFixed(2);
    calcPurchaseSummary();
}

function calcPurchaseSummary() {
    const rows = document.querySelectorAll('#purchaseInvoiceItems .item-row');
    let grandTotal = 0;
    rows.forEach(row => {
        grandTotal += parseFloat(row.querySelector('.item-total').value) || 0;
    });
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
        <td><input type="number" class="item-discount" value="0" oninput="calcPurchaseRowTotal(this)"></td>
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

document.getElementById('purchaseInvoiceForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const supplier = document.getElementById('purchaseSupplierSelect').value;
    const grandTotal = parseFloat(document.getElementById('purchaseGrandTotal').textContent) || 0;
    const invoiceNo = document.getElementById('purchaseInvoiceNo').value;
    const date = document.getElementById('purchaseInvoiceDate').value;
    if (!supplier) { alert('اختر المورد'); return; }
    if (grandTotal === 0) { alert('أضف منتجات'); return; }
    const tax = grandTotal * 0.14;
    const subtotal = grandTotal - tax;
    const purchase = {
        id: purchases.length + 1,
        invoiceNo,
        date,
        supplier,
        subtotal,
        tax,
        total: grandTotal,
        status: 'مدفوعة',
        payment: document.getElementById('purchasePaymentMethod').value
    };
    purchases.push(purchase);
    treasuryBalance -= grandTotal;
    treasuryExpense += grandTotal;
    const trans = {
        id: Date.now(),
        date,
        type: 'مشتريات',
        desc: `مشتريات - ${invoiceNo}`,
        debit: 0,
        credit: grandTotal,
        balance: treasuryBalance
    };
    treasuryTransactions.push(trans);
    logAction('إضافة فاتورة مشتريات', { invoiceNo, supplier, grandTotal });
    updateAllUI();
    closeModal('purchaseInvoiceModal');
    addNotification('success', `✅ فاتورة شراء ${invoiceNo} بقيمة ${grandTotal.toFixed(2)}`);
});

// ================================================================
// مرتجعات المبيعات
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

document.getElementById('saleReturnForm').addEventListener('submit', function(e) {
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
    treasuryBalance -= grandTotal;
    treasuryExpense += grandTotal;
    const trans = { id: Date.now(), date, type: 'مرتجع مبيعات', desc: `مرتجع مبيعات - ${returnNo}`, debit: 0, credit: grandTotal, balance: treasuryBalance };
    treasuryTransactions.push(trans);
    logAction('تسجيل مرتجع مبيعات', { returnNo, customer, grandTotal });
    updateAllUI();
    closeModal('saleReturnModal');
    addNotification('warning', `✅ تم تسجيل مرتجع ${returnNo} بقيمة ${grandTotal.toFixed(2)}`);
});

// ================================================================
// مرتجعات المشتريات
// ================================================================
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

document.getElementById('purchaseReturnForm').addEventListener('submit', function(e) {
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
    treasuryBalance += grandTotal;
    treasuryIncome += grandTotal;
    const trans = { id: Date.now(), date, type: 'مرتجع مشتريات', desc: `مرتجع مشتريات - ${returnNo}`, debit: grandTotal, credit: 0, balance: treasuryBalance };
    treasuryTransactions.push(trans);
    logAction('تسجيل مرتجع مشتريات', { returnNo, supplier, grandTotal });
    updateAllUI();
    closeModal('purchaseReturnModal');
    addNotification('success', `✅ تم تسجيل مرتجع ${returnNo} بقيمة ${grandTotal.toFixed(2)}`);
});

// ================================================================
// حذف الفواتير
// ================================================================
function deleteSale(id) {
    if (confirm('حذف الفاتورة؟')) {
        sales = sales.filter(s => s.id !== id);
        logAction('حذف فاتورة مبيعات', { id });
        updateAllUI();
        addNotification('warning', 'تم الحذف');
    }
}
function deletePurchase(id) {
    if (confirm('حذف الفاتورة؟')) {
        purchases = purchases.filter(p => p.id !== id);
        logAction('حذف فاتورة مشتريات', { id });
        updateAllUI();
        addNotification('warning', 'تم الحذف');
    }
}

// ================================================================
// التقارير
// ================================================================
function generateReport(type) {
    const names = {
        'balance': 'ميزان المراجعة',
        'income': 'قائمة الدخل',
        'financial': 'المركز المالي',
        'sales': 'تقرير المبيعات',
        'inventory': 'تقرير المخزون',
        'customers': 'تقرير العملاء'
    };
    document.getElementById('reportMainTitle').textContent = names[type] || 'تقرير';
    document.getElementById('reportTitle').innerHTML = `<i class="fas fa-file-alt"></i> ${names[type] || 'تقرير'}`;
    document.getElementById('reportDate').textContent = new Date().toLocaleDateString('ar-EG');
    const companyName = document.getElementById('companyName').value || 'شركة راشد للتجارة و التوزيع';
    const companyPhone = document.getElementById('companyPhone').value || '01158767633';
    document.getElementById('reportCompanyName').textContent = companyName;
    document.getElementById('reportCompanyInfo').textContent = `ت: ${companyPhone}`;
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
            <tr style="font-weight:bold;"><td>الخصوم</td><td>${liabilities.toFixed(2)}</td></tr>
            <tr style="font-weight:bold;border-top:2px solid #000;"><td>حقوق الملكية</td><td style="color:#22c55e;">${equity.toFixed(2)}</td></tr>
        `;
    } else if (type === 'sales') {
        thead.innerHTML = `<tr><th>رقم الفاتورة</th><th>التاريخ</th><th>العميل</th><th>الإجمالي</th><th>الحالة</th></tr>`;
        tbody.innerHTML = sales.length ? sales.map(s => `<tr><td>${s.invoiceNo}</td><td>${s.date}</td><td>${s.customer}</td><td>${(s.total || 0).toFixed(2)}</td><td><span class="status ${s.status === 'مدفوعة' ? 'paid' : 'pending'}">${s.status || 'مدفوعة'}</span></td></tr>`).join('') : '<tr><td colspan="5" style="text-align:center;">لا توجد مبيعات</td></tr>';
    } else if (type === 'inventory') {
        thead.innerHTML = `<tr><th>الكود</th><th>اسم الصنف</th><th>الوحدة</th><th>سعر البيع</th><th>الكمية</th><th>القيمة</th></tr>`;
        tbody.innerHTML = items.length ? items.map(i => `<tr><td>${i.code}</td><td>${i.name}</td><td>${i.unit || 'قطعة'}</td><td>${(i.salePrice || 0).toFixed(2)}</td><td>${i.stock || 0}</td><td>${((i.stock || 0) * (i.salePrice || 0)).toFixed(2)}</td></tr>`).join('') : '<tr><td colspan="6" style="text-align:center;">لا توجد أصناف</td></tr>';
    } else if (type === 'customers') {
        thead.innerHTML = `<tr><th>الاسم</th><th>النوع</th><th>الهاتف</th><th>الرصيد</th></tr>`;
        tbody.innerHTML = customers.length ? customers.map(c => `<tr><td>${c.name}</td><td>${c.type || 'عميل'}</td><td>${c.phone || '-'}</td><td>${(c.balance || 0).toFixed(2)}</td></tr>`).join('') : '<tr><td colspan="4" style="text-align:center;">لا يوجد عملاء</td></tr>';
    }
    document.getElementById('reportModal').style.display = 'block';
    logAction('فتح تقرير', { type: names[type] });
    addNotification('info', `📊 تم فتح تقرير ${names[type]}`);
}

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
            .summary-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;}
            .summary-stat{background:#f8f9fa;padding:8px;border-radius:6px;text-align:center;}
            .summary-stat strong{display:block;font-size:16px;}
            .status.paid{color:#155724;}.status.pending{color:#856404;}
            .report-header{display:flex;justify-content:space-between;border-bottom:2px solid #000;padding-bottom:8px;margin-bottom:10px;}
        </style>
        </head><body>
    `);
    win.document.write(content.innerHTML);
    win.document.write(`</body></html>`);
    win.document.close();
    win.print();
}

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
// بيانات الشركة
// ================================================================
document.getElementById('companyForm').addEventListener('submit', function(e) {
    e.preventDefault();
    logAction('حفظ بيانات الشركة', {});
    addNotification('success', '✅ تم حفظ بيانات الشركة');
});

// ================================================================
// رفع اللوجو
// ================================================================
document.getElementById('logoUpload').addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(ev) {
        document.getElementById('logoPreview').innerHTML = `<img src="${ev.target.result}" alt="شعار">`;
        localStorage.setItem('company_logo', ev.target.result);
        logAction('رفع شعار', {});
        addNotification('success', '✅ تم رفع الشعار');
    };
    reader.readAsDataURL(file);
});

// تحميل اللوجو المحفوظ
document.addEventListener('DOMContentLoaded', function() {
    const logo = localStorage.getItem('company_logo');
    if (logo) {
        document.getElementById('logoPreview').innerHTML = `<img src="${logo}" alt="شعار">`;
    }
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
        const pageId = this.dataset.page;
        const target = document.getElementById(`page-${pageId}`);
        if (target) target.classList.add('active');
        document.querySelector('.page-title').textContent = this.textContent.trim();
        document.querySelector('.sidebar').classList.remove('open');
        if (this.dataset.page === 'dashboard') {
            setTimeout(() => { drawChart(); updateTopItems(); }, 100);
        }
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

function syncData() {
    addNotification('info', '🔄 جاري المزامنة...');
    loadData();
    addNotification('success', '✅ تمت المزامنة');
}

console.log('🔥✅ النظام المحاسبي المتكامل جاهز (LocalStorage)');
console.log('📧 admin@example.com | 🔑 123456');
console.log('📱 شغال على الكمبيوتر والموبايل');
console.log('💾 يعمل بدون إنترنت');
