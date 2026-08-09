/* ============================================
   نظام راشد V33 - الترخيص والتجربة والتفعيل
   ============================================ */

// ============================================
// 1. إعدادات Firebase
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

let appData = {
    users: {},
    currentUser: null,
    license: {
        isActive: false,
        key: '',
        trialStart: null
    },
    admin: {
        password: 'admin123', // كلمة مرور افتراضية للوحة التحكم
        logins: 0,
        usersCount: 0
    },
    company: {
        name: '', branch: 'رئيسي', address: '', phone: '', cr: '', tax: ''
    },
    employees: []
};

// دالة تحميل وحفظ البيانات
function loadLocal() {
    try {
        const raw = localStorage.getItem('RashedV33');
        if (raw) {
            const parsed = JSON.parse(raw);
            appData = parsed;
        }
    } catch(e) {}
}
function saveLocal() {
    try {
        localStorage.setItem('RashedV33', JSON.stringify(appData));
        syncCloud();
    } catch(e) {}
}

function getData() {
    if(!appData.currentUser || !appData.users[appData.currentUser]) {
        return { sales: [], purchases: [], products: [], clients: [], treasury: 0, treasuryLog: [], expenses: [], collections: [], supplierPayments: [], saleCounter: 0, purchaseCounter: 0 };
    }
    return appData.users[appData.currentUser].data;
}

// ============================================
// 2. نظام الدخول والخروج
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
    appData.admin.logins++;
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
    
    appData.users[user] = { password: pass, data: { sales: [], purchases: [], products: [], clients: [], treasury: 0, treasuryLog: [], expenses: [], collections: [], supplierPayments: [], saleCounter: 0, purchaseCounter: 0 } };
    appData.admin.usersCount++;
    appData.currentUser = user;
    saveLocal();
    enterApp();
    showToast('✅ تم إنشاء الحساب بنجاح');
}

function logout() {
    if(confirm('هل أنت متأكد من تسجيل الخروج؟')) {
        appData.currentUser = null;
        saveLocal();
        location.reload();
    }
}

function enterApp() {
    document.getElementById('authContainer').style.display = 'none';
    document.getElementById('appContainer').style.display = 'block';
    document.getElementById('userDisplay').textContent = appData.currentUser;
    loadFromCloud();
    checkTrialStatus(); // فحص حالة التجربة عند الدخول
    updateUI();
    switchPage('dashboard');
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
                localStorage.setItem('RashedV33', JSON.stringify(appData));
                updateUI();
                showToast('☁️ تم تحديث البيانات من السحابة');
            }
        });
    } catch(e) {}
}

// ============================================
// 4. نظام التفعيل والتجربة (الجزء الأهم)
// ============================================
function checkTrialStatus() {
    const statusText = document.getElementById('licenseStatusText');
    const trialCounter = document.getElementById('trialCounter');
    const daysLeftSpan = document.getElementById('daysLeft');

    if(appData.license.isActive) {
        statusText.textContent = '✅ مفعل (نسخة كاملة)';
        statusText.style.color = 'var(--secondary)';
        trialCounter.style.display = 'none';
        return;
    }

    // إذا لم يبدأ التفعيل، نبدأ حساب التجربة من اليوم
    if(!appData.license.trialStart) {
        appData.license.trialStart = new Date().toISOString();
        saveLocal();
    }

    const startDate = new Date(appData.license.trialStart);
    const currentDate = new Date();
    const diffTime = Math.abs(currentDate - startDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const remainingDays = 5 - diffDays;

    if(remainingDays <= 0) {
        statusText.textContent = '⛔ انتهت الفترة التجريبية';
        statusText.style.color = 'var(--danger)';
        trialCounter.style.display = 'none';
        showToast('⚠️ انتهت الفترة التجريبية. يرجى تفعيل التطبيق.', 'error');
    } else {
        statusText.textContent = '🟡 نسخة تجريبية';
        statusText.style.color = 'var(--accent)';
        trialCounter.style.display = 'block';
        daysLeftSpan.textContent = remainingDays;
    }
}

function activateLicense() {
    const input = document.getElementById('licenseKeyInput').value.trim();
    
    // أكواد التفعيل المقترحة (يمكنك تغييرها بعد الدفع)
    const validKeys = ['RASHED-PRO-2026', 'PREMIUM-2026', 'V33-LICENSE'];
    
    if(validKeys.includes(input)) {
        appData.license.isActive = true;
        appData.license.key = input;
        saveLocal();
        checkTrialStatus();
        document.getElementById('licenseKeyInput').value = '';
        showToast('🎉 تم تفعيل التطبيق بنجاح!', 'success');
    } else {
        showToast('❌ كود التفعيل غير صحيح', 'error');
    }
}

// ============================================
// 5. لوحة التحكم السرية (ضغط اللوجو 5 مرات)
// ============================================
let logoClickCount = 0;

function handleLogoClick() {
    logoClickCount++;
    if(logoClickCount >= 5) {
        logoClickCount = 0;
        document.getElementById('adminPanel').classList.add('active');
        document.getElementById('totalUsers').textContent = Object.keys(appData.users).length;
        document.getElementById('totalLogins').textContent = appData.admin.logins;
    }
    setTimeout(() => { logoClickCount = 0; }, 3000);
}

function closeAdminPanel() {
    document.getElementById('adminPanel').classList.remove('active');
    document.getElementById('adminContent').style.display = 'none';
}

function unlockAdminPanel() {
    const pass = document.getElementById('adminPassword').value.trim();
    if(pass === appData.admin.password) {
        document.getElementById('adminContent').style.display = 'block';
        document.getElementById('adminPassword').value = '';
        showToast('✅ مرحباً بك في لوحة التحكم');
    } else {
        showToast('❌ كلمة مرور خاطئة');
    }
}

function changeAdminPassword() {
    const newPass = document.getElementById('newAdminPass').value.trim();
    if(newPass.length < 4) return showToast('⚠️ كلمة المرور 4 أحرف على الأقل');
    appData.admin.password = newPass;
    saveLocal();
    document.getElementById('newAdminPass').value = '';
    showToast('✅ تم تغيير كلمة مرور الأدمن');
}

// ============================================
// 6. بيانات الشركة والموظفين
// ============================================
function saveCompanyData() {
    appData.company.name = document.getElementById('compName').value.trim();
    appData.company.branch = document.getElementById('compBranch').value;
    appData.company.address = document.getElementById('compAddress').value.trim();
    appData.company.phone = document.getElementById('compPhone').value.trim();
    appData.company.cr = document.getElementById('compCR').value.trim();
    appData.company.tax = document.getElementById('compTax').value.trim();
    saveLocal();
    showToast('✅ تم حفظ بيانات الشركة');
}

function addEmployee() {
    const name = document.getElementById('empName').value.trim();
    const role = document.getElementById('empRole').value.trim();
    const salary = parseFloat(document.getElementById('empSalary').value);
    if(!name || !role || !salary) return showToast('أكمل بيانات الموظف');
    appData.employees.push({ id: Date.now().toString(), name, role, salary });
    saveLocal();
    document.getElementById('empName').value = '';
    document.getElementById('empRole').value = '';
    document.getElementById('empSalary').value = '';
    renderEmployees();
    showToast('✅ تم إضافة الموظف');
}

function renderEmployees() {
    const list = document.getElementById('employeeList');
    list.innerHTML = appData.employees.map(e => `
        <div class="list-item">
            <span><strong>${e.name}</strong> (${e.role})</span>
            <span>${e.salary} ج.م</span>
        </div>
    `).join('');
}

// ============================================
// 7. النسخ الاحتياطي
// ============================================
function exportBackup() {
    const data = {
        users: appData.users,
        company: appData.company,
        employees: appData.employees,
        license: appData.license
    };
    const jsonData = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Rashed_Backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('📥 تم تصدير النسخة');
}

function importBackup() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = function(e) {
        const file = e.target.files[0];
        if(!file) return;
        const reader = new FileReader();
        reader.onload = function(event) {
            try {
                const imported = JSON.parse(event.target.result);
                if(imported.users && imported.company && imported.license) {
                    appData.users = imported.users;
                    appData.company = imported.company;
                    appData.employees = imported.employees || [];
                    appData.license = imported.license;
                    saveLocal();
                    renderEmployees();
                    showToast('📤 تم استيراد البيانات');
                    location.reload();
                } else {
                    showToast('❌ ملف غير صالح');
                }
            } catch(err) {
                showToast('❌ خطأ في القراءة');
            }
        };
        reader.readAsText(file);
    };
    input.click();
}

// ============================================
// 8. تحديث الواجهة
// ============================================
function updateUI() {
    if(!appData.currentUser) return;
    const data = getData();
    
    // تحديث قوائم جهات الاتصال والمخزون
    document.getElementById('clientList').innerHTML = data.clients.map(c => `
        <div class="list-item"><span><strong>${c.name}</strong> - ${c.type}</span></div>
    `).join('');

    document.getElementById('productList').innerHTML = data.products.map(p => `
        <div class="list-item"><span><strong>${p.name}</strong> (${p.qty}) - ${p.sell} ج.م</span></div>
    `).join('');

    // تحديث سجل الخزنة
    document.getElementById('treasuryLog').innerHTML = data.treasuryLog.slice().reverse().map(t => `
        <div class="list-item"><span>${t.desc}</span><span>${t.amount} ج.م</span></div>
    `).join('') || '<div style="text-align:center;color:#777;padding:10px;">لا توجد حركات</div>';

    // تحديث قائمة المبيعات
    document.getElementById('saleList').innerHTML = data.sales.slice().reverse().map(s => `
        <div class="list-item">
            <span>${s.client} - ${s.product}</span>
            <div>
                <span style="font-weight:bold;">${s.total} ج.م</span>
                <button onclick="printSaleInvoice('${s.id}')" style="background:none;border:none;color:var(--primary);cursor:pointer;"><i class="fas fa-print"></i></button>
            </div>
        </div>
    `).join('');

    // تحديث بيانات الشركة في الإعدادات
    document.getElementById('compName').value = appData.company.name || '';
    document.getElementById('compBranch').value = appData.company.branch || 'رئيسي';
    document.getElementById('compAddress').value = appData.company.address || '';
    document.getElementById('compPhone').value = appData.company.phone || '';
    document.getElementById('compCR').value = appData.company.cr || '';
    document.getElementById('compTax').value = appData.company.tax || '';
    
    renderEmployees();
}

function switchPage(page) {
    document.querySelectorAll('.page').forEach(el => el.classList.remove('active'));
    const target = document.getElementById('page-' + page);
    if(target) target.classList.add('active');
    document.querySelectorAll('.bottom-nav button').forEach(btn => btn.style.color = '#777');
    const activeBtn = document.querySelector(`.bottom-nav button[onclick*="switchPage('${page}')"]`);
    if(activeBtn) activeBtn.style.color = 'var(--primary)';
    document.querySelectorAll('.sidebar .nav-btn').forEach(btn => btn.style.background = 'rgba(255,255,255,0.05)');
    const activeSideBtn = document.querySelector(`.sidebar .nav-btn[onclick*="switchPage('${page}')"]`);
    if(activeSideBtn) activeSideBtn.style.background = 'rgba(255,255,255,0.2)';
    if(page === 'dashboard') drawCharts();
}

// ============================================
// 9. الرسوم البيانية والطباعة
// ============================================
function drawCharts() {
    const data = getData();
    const salesTotal = data.sales.reduce((s, i) => s + i.total, 0);
    const expensesTotal = data.expenses.reduce((s, i) => s + i.amount, 0);

    if(window.salesChart) window.salesChart.destroy();
    window.salesChart = new Chart(document.getElementById('salesChart'), {
        type: 'bar',
        data: {
            labels: ['مبيعات', 'مصروفات'],
            datasets: [{ label: 'الحركة المالية', data: [salesTotal, expensesTotal], backgroundColor: ['#00B894', '#E17055'] }]
        }
    });
}

function printSaleInvoice(id) {
    const data = getData();
    const sale = data.sales.find(s => s.id === id);
    if(!sale) return showToast('الفاتورة غير موجودة');
    const win = window.open('', '_blank');
    win.document.write(`
        <html><head><meta charset="UTF-8"><title>فاتورة ${sale.id}</title>
        <style>
            body { background:white; padding:20px; font-family: Arial; }
            .invoice { max-width: 600px; margin: auto; border: 1px solid #ddd; padding: 20px; border-radius: 10px; }
            h2 { margin: 0; text-align: center; border-bottom: 2px solid #2E4057; padding-bottom: 15px; }
            table { width: 100%; border-collapse: collapse; margin-top: 15px; }
            th { background: #2E4057; color: white; padding: 8px; text-align: right; }
            td { padding: 8px; border-bottom: 1px solid #ddd; }
            .total { text-align: left; font-size: 18px; font-weight: bold; border-top: 2px solid #2E4057; padding-top: 10px; margin-top: 10px; }
        </style>
        </head><body>
        <div class="invoice">
            <h2>نظام راشد</h2>
            <div style="display:flex; justify-content:space-between; margin-top:10px;">
                <span>العميل: ${sale.client}</span>
                <span>الفاتورة: ${sale.id}</span>
            </div>
            <table>
                <tr><th>المنتج</th><th>الكمية</th><th>السعر</th><th>الإجمالي</th></tr>
                <tr><td>${sale.product}</td><td>${sale.qty}</td><td>${sale.price}</td><td>${sale.total} ج.م</td></tr>
            </table>
            <div class="total">الإجمالي: ${sale.total} ج.م</div>
            <div style="text-align:center;font-size:11px;color:#777;margin-top:20px;">شكراً لتعاملكم معنا</div>
        </div>
        <script>window.print();<\\/script>
        </body></html>
    `);
    win.document.close();
}

// ============================================
// 10. الباقي (البحث، التوست)
// ============================================
function searchByBarcode() {
    const input = document.getElementById('manualBarcode').value.trim();
    if(!input) return showToast('أدخل الباركود');
    const data = getData();
    const product = data.products.find(p => p.barcode === input);
    if(product) showToast(`✅ ${product.name}`);
    else showToast('⚠️ المنتج غير موجود');
}

function showToast(msg, type = 'info') {
    const t = document.getElementById('toast');
    t.textContent = msg;
    t.className = 'toast show';
    if(type === 'success') t.style.background = 'var(--secondary)';
    else if(type === 'error') t.style.background = 'var(--danger)';
    else t.style.background = '#333';
    setTimeout(() => t.classList.remove('show'), 3000);
}

// ============================================
// 11. بدء التشغيل
// ============================================
loadLocal();
if(appData.currentUser && appData.users[appData.currentUser]) {
    document.getElementById('authContainer').style.display = 'none';
    document.getElementById('appContainer').style.display = 'block';
    document.getElementById('userDisplay').textContent = appData.currentUser;
    checkTrialStatus();
    updateUI();
    switchPage('dashboard');
}
console.log('✅ نظام راشد V33 - (Trial, License, Admin Panel, Company Data)');
