// ================================================================
// 💾 النظام المحاسبي - باستخدام LocalStorage
// ================================================================

let customers = [], suppliers = [], items = [], sales = [], purchases = [];
let employees = [], loans = [], expenses = [], treasuryTransactions = [];
let customerId = 1, supplierId = 1, itemId = 1, employeeId = 1, loanId = 1, expenseId = 1;
let treasuryBalance = 0, treasuryIncome = 0, treasuryExpense = 0;
let currentUser = null;
let notifications = [];
let darkMode = false;
let auditLog = [];

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
    updateDashboard();
});

// ================================================================
// 💾 حفظ وتحميل البيانات
// ================================================================
function saveData() {
    try {
        const data = {
            customers, suppliers, items, sales, purchases,
            employees, loans, expenses, treasuryTransactions,
            treasuryBalance, treasuryIncome, treasuryExpense,
            customerId, supplierId, itemId, employeeId, loanId, expenseId,
            auditLog
        };
        localStorage.setItem('rashed_accounting_data', JSON.stringify(data));
        localStorage.setItem('rashed_accounting_updated', new Date().toISOString());
        console.log('✅ تم حفظ البيانات');
    } catch (e) {
        console.error('❌ خطأ في الحفظ:', e);
    }
}

function loadData() {
    try {
        const data = JSON.parse(localStorage.getItem('rashed_accounting_data'));
        if (data) {
            customers = data.customers || [];
            suppliers = data.suppliers || [];
            items = data.items || [];
            sales = data.sales || [];
            purchases = data.purchases || [];
            employees = data.employees || [];
            loans = data.loans || [];
            expenses = data.expenses || [];
            treasuryTransactions = data.treasuryTransactions || [];
            treasuryBalance = data.treasuryBalance || 0;
            treasuryIncome = data.treasuryIncome || 0;
            treasuryExpense = data.treasuryExpense || 0;
            customerId = data.customerId || 1;
            supplierId = data.supplierId || 1;
            itemId = data.itemId || 1;
            employeeId = data.employeeId || 1;
            loanId = data.loanId || 1;
            expenseId = data.expenseId || 1;
            auditLog = data.auditLog || [];
            console.log('✅ تم تحميل البيانات');
            updateAllUI();
            updateDashboard();
            return true;
        }
        return false;
    } catch (e) {
        console.error('❌ خطأ في التحميل:', e);
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
        const users = JSON.parse(localStorage.getItem('rashed_users') || '[]');
        const user = users.find(u => u.email === email && u.password === pass);
        if (user) {
            afterLogin(user.name);
        } else {
            const newUser = { name: 'راشد', email: email, password: pass };
            users.push(newUser);
            localStorage.setItem('rashed_users', JSON.stringify(users));
            afterLogin('راشد');
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
    const users = JSON.parse(localStorage.getItem('rashed_users') || '[]');
    if (users.find(u => u.email === email)) {
        alert('❌ هذا البريد الإلكتروني مستخدم بالفعل');
        return;
    }
    users.push({ name, email, password: pass });
    localStorage.setItem('rashed_users', JSON.stringify(users));
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
    updateDashboard();
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
    saveData();
}

// ================================================================
// تحديث لوحة التحكم
// ================================================================
function updateDashboard() {
    const totalSales = sales.reduce((s, x) => s + (x.total || 0), 0);
    const totalPurchases = purchases.reduce((s, x) => s + (x.total || 0), 0);
    const totalItems = items.reduce((s, i) => s + (i.stock || 0), 0);
    const totalLoans = loans.reduce((s, l) => s + (l.amount || 0), 0);
    const totalExpenses = expenses.reduce((s, e) => s + (e.amount || 0), 0);
    const totalEmployees = employees.length;
    
    document.getElementById('statTasks').textContent = items.length;
    document.getElementById('statDone').textContent = sales.length;
    document.getElementById('statExpenses').textContent = totalExpenses.toFixed(2);
    document.getElementById('statLoans').textContent = totalLoans.toFixed(2);
    document.getElementById('statSales').textContent = sales.length;
    document.getElementById('statPurchases').textContent = purchases.length;
    
    document.getElementById('totalSales').textContent = totalSales.toLocaleString();
    document.getElementById('totalPurchases').textContent = totalPurchases.toLocaleString();
    document.getElementById('totalStock').textContent = items.reduce((s, i) => s + ((i.stock || 0) * (i.salePrice || 0)), 0).toLocaleString();
    document.getElementById('treasuryBalance').textContent = treasuryBalance.toLocaleString();
    
    document.getElementById('treasuryCurrentBalance').textContent = treasuryBalance.toFixed(2) + ' جنيه';
    document.getElementById('treasuryIncome').textContent = treasuryIncome.toFixed(2) + ' جنيه';
    document.getElementById('treasuryExpense').textContent = treasuryExpense.toFixed(2) + ' جنيه';
    
    // آخر النشاطات
    const activities = document.getElementById('recentActivities');
    if (activities) {
        activities.innerHTML = '';
        const recent = [...auditLog].slice(-5).reverse();
        recent.forEach(log => {
            const div = document.createElement('div');
            div.className = 'activity-item';
            div.innerHTML = `
                <span>${log.action}</span>
                <span style="font-size:11px;color:var(--text-light);">${new Date(log.timestamp).toLocaleString('ar-EG')}</span>
            `;
            activities.appendChild(div);
        });
        if (recent.length === 0) {
            activities.innerHTML = '<div class="activity-item">لا توجد نشاطات حتى الآن</div>';
        }
    }
}

// ================================================================
// تحديث الواجهة
// ================================================================
function updateAllUI() {
    // العملاء
    const ct = document.getElementById('customersList');
    if (ct) {
        ct.innerHTML = '';
        customers.forEach(c => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${c.name}</td>
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
    
    // الموظفين
    const el = document.getElementById('employeesList');
    if (el) {
        el.innerHTML = '';
        employees.forEach(e => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${e.name}</td>
                <td>${e.position || '-'}</td>
                <td>${e.phone || '-'}</td>
                <td>${(e.salary || 0).toFixed(2)}</td>
                <td><button class="btn-delete" onclick="deleteEmployee(${e.id})"><i class="fas fa-trash"></i></button></td>
            `;
            el.appendChild(row);
        });
    }
    
    // السلف
    const ll = document.getElementById('loansList');
    if (ll) {
        ll.innerHTML = '';
        loans.forEach(l => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${l.employee}</td>
                <td>${(l.amount || 0).toFixed(2)}</td>
                <td>${l.date}</td>
                <td><span class="status ${l.status === 'مسددة' ? 'paid' : 'pending'}">${l.status || 'مستحقة'}</span></td>
                <td><button class="btn-delete" onclick="deleteLoan(${l.id})"><i class="fas fa-trash"></i></button></td>
            `;
            ll.appendChild(row);
        });
    }
    
    // المصروفات
    const ex = document.getElementById('expensesList');
    if (ex) {
        ex.innerHTML = '';
        expenses.forEach(e => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${e.desc}</td>
                <td>${(e.amount || 0).toFixed(2)}</td>
                <td>${e.date}</td>
                <td>${e.category || 'أخرى'}</td>
                <td><button class="btn-delete" onclick="deleteExpense(${e.id})"><i class="fas fa-trash"></i></button></td>
            `;
            ex.appendChild(row);
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
    
    updateCustomerSelects();
    updateSupplierSelects();
    updateEmployeeSelects();
    updateDashboard();
    saveData();
}

// ================================================================
// تحديث القوائم المنسدلة
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

function updateEmployeeSelects() {
    const sel = document.getElementById('loanEmployee');
    if (!sel) return;
    sel.innerHTML = '<option value="">-- اختر --</option>';
    employees.forEach(e => {
        const opt = document.createElement('option');
        opt.value = e.name;
        opt.textContent = e.name;
        sel.appendChild(opt);
    });
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
// العملاء
// ================================================================
document.getElementById('customerForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const name = document.getElementById('custName').value.trim();
    if (!name) { alert('أدخل الاسم'); return; }
    customers.push({
        id: customerId++,
        name,
        phone: document.getElementById('custPhone').value || '',
        balance: parseFloat(document.getElementById('custBalance').value) || 0
    });
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

// ================================================================
// الموردين
// ================================================================
document.getElementById('supplierForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const name = document.getElementById('suppName').value.trim();
    if (!name) { alert('أدخل الاسم'); return; }
    suppliers.push({
        id: supplierId++,
        name,
        phone: document.getElementById('suppPhone').value || '',
        balance: parseFloat(document.getElementById('suppBalance').value) || 0
    });
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

// ================================================================
// الأصناف
// ================================================================
document.getElementById('itemForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const code = document.getElementById('itemCode').value.trim();
    const name = document.getElementById('itemName').value.trim();
    if (!code || !name) { alert('أدخل الكود والاسم'); return; }
    items.push({
        id: itemId++,
        code,
        name,
        unit: document.getElementById('itemUnit').value,
        salePrice: parseFloat(document.getElementById('itemSalePrice').value) || 0,
        stock: parseInt(document.getElementById('itemStock').value) || 0
    });
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

// ================================================================
// الموظفين
// ================================================================
document.getElementById('employeeForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const name = document.getElementById('empName').value.trim();
    if (!name) { alert('أدخل الاسم'); return; }
    employees.push({
        id: employeeId++,
        name,
        position: document.getElementById('empPosition').value || '',
        phone: document.getElementById('empPhone').value || '',
        salary: parseFloat(document.getElementById('empSalary').value) || 0
    });
    logAction('إضافة موظف', { name });
    updateAllUI();
    closeModal('employeeModal');
    this.reset();
    addNotification('success', `✅ تم إضافة ${name}`);
});

function deleteEmployee(id) {
    if (confirm('حذف الموظف؟')) {
        employees = employees.filter(e => e.id !== id);
        logAction('حذف موظف', { id });
        updateAllUI();
        addNotification('warning', 'تم الحذف');
    }
}

// ================================================================
// السلف
// ================================================================
document.getElementById('loanForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const employee = document.getElementById('loanEmployee').value;
    const amount = parseFloat(document.getElementById('loanAmount').value);
    const desc = document.getElementById('loanDesc').value || '';
    if (!employee) { alert('اختر الموظف'); return; }
    if (!amount) { alert('أدخل المبلغ'); return; }
    loans.push({
        id: loanId++,
        employee,
        amount,
        desc,
        date: new Date().toISOString().split('T')[0],
        status: 'مستحقة'
    });
    logAction('إضافة سلفة', { employee, amount });
    updateAllUI();
    closeModal('loanModal');
    this.reset();
    addNotification('success', `✅ تم إضافة سلفة بقيمة ${amount}`);
});

function deleteLoan(id) {
    if (confirm('حذف السلفة؟')) {
        loans = loans.filter(l => l.id !== id);
        logAction('حذف سلفة', { id });
        updateAllUI();
        addNotification('warning', 'تم الحذف');
    }
}

// ================================================================
// المصروفات
// ================================================================
document.getElementById('expenseForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const desc = document.getElementById('expenseDesc').value.trim();
    const amount = parseFloat(document.getElementById('expenseAmount').value);
    if (!desc) { alert('أدخل البيان'); return; }
    if (!amount) { alert('أدخل المبلغ'); return; }
    expenses.push({
        id: expenseId++,
        desc,
        amount,
        date: new Date().toISOString().split('T')[0],
        category: document.getElementById('expenseCategory').value
    });
    logAction('إضافة مصروف', { desc, amount });
    updateAllUI();
    closeModal('expenseModal');
    this.reset();
    addNotification('warning', `✅ تم إضافة مصروف بقيمة ${amount}`);
});

function deleteExpense(id) {
    if (confirm('حذف المصروف؟')) {
        expenses = expenses.filter(e => e.id !== id);
        logAction('حذف مصروف', { id });
        updateAllUI();
        addNotification('warning', 'تم الحذف');
    }
}

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
    treasuryTransactions.push({
        id: Date.now(),
        date,
        type: 'إيداع',
        desc: `${desc} (${document.getElementById('depositMethod').value})`,
        debit: amount,
        credit: 0,
        balance: treasuryBalance
    });
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
    treasuryTransactions.push({
        id: Date.now(),
        date,
        type: 'سحب',
        desc: `${desc} (${document.getElementById('withdrawMethod').value})`,
        debit: 0,
        credit: amount,
        balance: treasuryBalance
    });
    logAction('سحب', { desc, amount });
    updateAllUI();
    closeModal('treasuryWithdrawModal');
    this.reset();
    addNotification('warning', `✅ تم تسجيل السحب بقيمة ${amount}`);
});

// ================================================================
// المبيعات
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
    sales.push({
        id: sales.length + 1,
        invoiceNo,
        date,
        customer,
        subtotal,
        tax,
        total: grandTotal,
        status: 'مدفوعة',
        payment: document.getElementById('salePaymentMethod').value
    });
    treasuryBalance += grandTotal;
    treasuryIncome += grandTotal;
    treasuryTransactions.push({
        id: Date.now(),
        date,
        type: 'مبيعات',
        desc: `مبيعات - ${invoiceNo}`,
        debit: grandTotal,
        credit: 0,
        balance: treasuryBalance
    });
    logAction('إضافة فاتورة مبيعات', { invoiceNo, customer, grandTotal });
    updateAllUI();
    closeModal('saleInvoiceModal');
    addNotification('success', `✅ فاتورة ${invoiceNo} بقيمة ${grandTotal.toFixed(2)}`);
});

function deleteSale(id) {
    if (confirm('حذف الفاتورة؟')) {
        sales = sales.filter(s => s.id !== id);
        logAction('حذف فاتورة مبيعات', { id });
        updateAllUI();
        addNotification('warning', 'تم الحذف');
    }
}

// ================================================================
// المشتريات
// ================================================================
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
    purchases.push({
        id: purchases.length + 1,
        invoiceNo,
        date,
        supplier,
        subtotal,
        tax,
        total: grandTotal,
        status: 'مدفوعة',
        payment: document.getElementById('purchasePaymentMethod').value
    });
    treasuryBalance -= grandTotal;
    treasuryExpense += grandTotal;
    treasuryTransactions.push({
        id: Date.now(),
        date,
        type: 'مشتريات',
        desc: `مشتريات - ${invoiceNo}`,
        debit: 0,
        credit: grandTotal,
        balance: treasuryBalance
    });
    logAction('إضافة فاتورة مشتريات', { invoiceNo, supplier, grandTotal });
    updateAllUI();
    closeModal('purchaseInvoiceModal');
    addNotification('success', `✅ فاتورة شراء ${invoiceNo} بقيمة ${grandTotal.toFixed(2)}`);
});

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
    const companyName = document.getElementById('companyName').value || 'شركة راشد للتجارة';
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
        tbody.innerHTML = sales.length ? sales.map(s => `<tr><td>${s.invoiceNo}</td><td>${s.date}</td><td>${s.customer}</td><td>${(s.total || 0).toFixed(2)}</td><td><span class="status ${s.status === 'مدفوعة' ? 'paid' : 'pending'}">${s.status || 'مدفوعة'}</span></td></tr>`).join('') : '<tr><td colspan="5">لا توجد مبيعات</td></tr>';
    } else if (type === 'inventory') {
        thead.innerHTML = `<tr><th>الكود</th><th>اسم الصنف</th><th>الوحدة</th><th>سعر البيع</th><th>الكمية</th><th>القيمة</th></tr>`;
        tbody.innerHTML = items.length ? items.map(i => `<tr><td>${i.code}</td><td>${i.name}</td><td>${i.unit || 'قطعة'}</td><td>${(i.salePrice || 0).toFixed(2)}</td><td>${i.stock || 0}</td><td>${((i.stock || 0) * (i.salePrice || 0)).toFixed(2)}</td></tr>`).join('') : '<tr><td colspan="6">لا توجد أصناف</td></tr>';
    } else if (type === 'customers') {
        thead.innerHTML = `<tr><th>الاسم</th><th>الهاتف</th><th>الرصيد</th></tr>`;
        tbody.innerHTML = customers.length ? customers.map(c => `<tr><td>${c.name}</td><td>${c.phone || '-'}</td><td>${(c.balance || 0).toFixed(2)}</td></tr>`).join('') : '<tr><td colspan="3">لا يوجد عملاء</td></tr>';
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
        localStorage.setItem('rashed_company_logo', ev.target.result);
        logAction('رفع شعار', {});
        addNotification('success', '✅ تم رفع الشعار');
    };
    reader.readAsDataURL(file);
});

document.addEventListener('DOMContentLoaded', function() {
    const logo = localStorage.getItem('rashed_company_logo');
    if (logo) {
        document.getElementById('logoPreview').innerHTML = `<img src="${logo}" alt="شعار">`;
    }
});

// ================================================================
// الإعدادات
// ================================================================
function saveSettings() {
    const autoSync = document.getElementById('autoSync').checked;
    const notifications = document.getElementById('notifications').checked;
    const language = document.getElementById('language').value;
    localStorage.setItem('rashed_settings', JSON.stringify({ autoSync, notifications, language }));
    logAction('حفظ الإعدادات', { autoSync, notifications, language });
    addNotification('success', '✅ تم حفظ الإعدادات');
}

// تحميل الإعدادات
document.addEventListener('DOMContentLoaded', function() {
    const settings = JSON.parse(localStorage.getItem('rashed_settings'));
    if (settings) {
        if (document.getElementById('autoSync')) document.getElementById('autoSync').checked = settings.autoSync;
        if (document.getElementById('notifications')) document.getElementById('notifications').checked = settings.notifications;
        if (document.getElementById('language')) document.getElementById('language').value = settings.language;
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
            setTimeout(() => { drawChart(); updateDashboard(); }, 100);
        }
    });
});

// ================================================================
// الرسوم البيانية
// ================================================================
function drawChart() {
    // المبيعات الشهرية
    const canvas1 = document.getElementById('salesChart');
    if (canvas1) {
        const ctx = canvas1.getContext('2d');
        const rect = canvas1.parentElement.getBoundingClientRect();
        const width = rect.width - 30;
        const height = 180;
        canvas1.width = width;
        canvas1.height = height;
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
    
    // توزيع الأصول
    const canvas2 = document.getElementById('assetsChart');
    if (canvas2) {
        const ctx = canvas2.getContext('2d');
        const rect = canvas2.parentElement.getBoundingClientRect();
        const width = rect.width - 30;
        const height = 180;
        canvas2.width = width;
        canvas2.height = height;
        const totalStock = items.reduce((s, i) => s + ((i.stock || 0) * (i.salePrice || 0)), 0);
        const totalCustomers = customers.reduce((s, c) => s + ((c.balance || 0) > 0 ? c.balance : 0), 0);
        const data = [
            { label: 'خزينة', value: treasuryBalance > 0 ? treasuryBalance : 0 },
            { label: 'مخزون', value: totalStock },
            { label: 'عملاء', value: totalCustomers }
        ];
        const total = data.reduce((s, d) => s + d.value, 0) || 1;
        let startAngle = -Math.PI / 2;
        const colors = ['#4fc3f7', '#81c784', '#ffb74d'];
        const centerX = width / 2;
        const centerY = height / 2;
        const radius = Math.min(width, height) / 2 - 20;
        ctx.clearRect(0, 0, width, height);
        data.forEach((d, i) => {
            const sliceAngle = (d.value / total) * 2 * Math.PI;
            ctx.beginPath();
            ctx.moveTo(centerX, centerY);
            ctx.arc(centerX, centerY, radius, startAngle, startAngle + sliceAngle);
            ctx.closePath();
            ctx.fillStyle = colors[i % colors.length];
            ctx.fill();
            ctx.strokeStyle = 'var(--bg)';
            ctx.lineWidth = 2;
            ctx.stroke();
            startAngle += sliceAngle;
        });
        // إضافة وسيلة إيضاح
        ctx.fillStyle = 'var(--text-light)';
        ctx.font = '10px Arial';
        let legendY = 10;
        data.forEach((d, i) => {
            ctx.fillStyle = colors[i];
            ctx.fillRect(10, legendY, 12, 12);
            ctx.fillStyle = 'var(--text)';
            ctx.fillText(`${d.label}: ${((d.value/total)*100).toFixed(1)}%`, 28, legendY + 10);
            legendY += 20;
        });
    }
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
    updateDashboard();
    drawChart();
    addNotification('success', '✅ تمت المزامنة');
}

console.log('🏆 نظام راشد المحاسبي - النسخة النهائية');
console.log('📧 admin@example.com | 🔑 123456');
console.log('📱 شغال على الكمبيوتر والموبايل');
console.log('💾 يعمل بدون إنترنت');
