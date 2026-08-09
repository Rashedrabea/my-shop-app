/* ============================================
   نظام راشد V31 - Backup & Restore
   ============================================ */

const firebaseConfig = {
    apiKey: "AIzaSyCQVcCAkZpeL9F9KADI5PtVanwTwO3SH5Y",
    authDomain: "smart-task-manager-d2a71.firebaseapp.com",
    databaseURL: "https://smart-task-manager-d2a71-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "smart-task-manager-d2a71",
    storageBucket: "smart-task-manager-d2a71.firebasestorage.app",
    messagingSenderId: "669004983540",
    appId: "1:669004983540:web:d80e9181527782d41e82a1"
};

let appData = { users: {}, currentUser: null };
let chartInstances = {};

// دالة تحميل وحفظ البيانات
function loadLocal() {
    try { const raw = localStorage.getItem('RashedV31'); if (raw) appData = JSON.parse(raw); } catch(e) {}
}
function saveLocal() {
    try {
        localStorage.setItem('RashedV31', JSON.stringify(appData));
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
// نظام الدخول والخروج
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
    
    appData.users[user] = { password: pass, data: { sales: [], purchases: [], products: [], clients: [], treasury: 0, treasuryLog: [], expenses: [], collections: [], supplierPayments: [], saleCounter: 0, purchaseCounter: 0 } };
    appData.currentUser = user;
    saveLocal();
    enterApp();
    showToast('✅ تم إنشاء الحساب بنجاح');
}

function logout() {
    if(confirm('هل أنت متأكد من تسجيل الخروج؟')) {
        appData.currentUser = null;
        saveLocal();
        location.reload(); // إعادة تحميل الصفحة للعودة لشاشة الدخول
    }
}

function enterApp() {
    document.getElementById('authContainer').style.display = 'none';
    document.getElementById('appContainer').style.display = 'block';
    document.getElementById('userDisplay').textContent = appData.currentUser;
    loadFromCloud();
    updateUI();
    switchPage('dashboard');
}

// ============================================
// السحابة (Firebase) - المزامنة التلقائية
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
                localStorage.setItem('RashedV31', JSON.stringify(appData));
                updateUI();
                showToast('☁️ تم تحديث البيانات من السحابة');
            }
        });
    } catch(e) {}
}

// ============================================
// التنقل بين الصفحات
// ============================================
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
    if(page === 'reports') updateReportSelects();
}

// ============================================
// تحديث القوائم
// ============================================
function updateSelects() {
    if(!appData.currentUser) return;
    const data = getData();
    document.querySelectorAll('#saleProduct, #purchaseProduct, #returnProduct, #returnPurchaseProduct').forEach(sel => {
        if(sel) {
            sel.innerHTML = '<option value="">اختر المنتج</option>';
            data.products.forEach(p => sel.innerHTML += `<option value="${p.id}">${p.name} (${p.qty})</option>`);
        }
    });
}

function updateReportSelects() {
    const data = getData();
    const select = document.getElementById('statementClientSelect');
    if(select) {
        select.innerHTML = '<option value="">-- اختر جهة الاتصال --</option>';
        data.clients.forEach(c => select.innerHTML += `<option value="${c.name}">${c.name}</option>`);
    }
}

function updateUI() {
    if(!appData.currentUser) return;
    const data = getData();
    updateSelects();

    document.getElementById('clientList').innerHTML = data.clients.map(c => `
        <div class="list-item"><div><strong>${c.name}</strong><br><small style="color:#777;">📞 ${c.phone || 'N/A'} | 📍 ${c.address || 'N/A'}</small></div><div><span style="background:#eee;padding:2px 8px;border-radius:4px;font-size:11px;">${c.type}</span></div></div>
    `).join('');

    document.getElementById('productList').innerHTML = data.products.map(p => `
        <div class="list-item">
            <div>
                <strong>${p.name}</strong><br>
                <small style="color:#777;">${p.desc || ''}</small>
            </div>
            <div style="text-align:left;">
                <span style="font-weight:bold;">${p.sell} ج.م (${p.qty})</span>
            </div>
        </div>
    `).join('');

    document.getElementById('treasuryDisplay').textContent = data.treasury;
    
    let logHtml = '';
    logHtml += data.treasuryLog.slice().reverse().map(t => `
        <div class="list-item"><span>${t.desc}</span><span style="font-weight:bold;color:${t.amount > 0 ? 'var(--secondary)' : 'var(--danger)'};">${t.amount} ج.م</span></div>
    `).join('');
    logHtml += data.expenses.slice().reverse().map(e => `
        <div class="list-item" style="color:var(--danger);"><span>💸 ${e.desc}</span><span style="font-weight:bold;">-${e.amount} ج.م</span></div>
    `).join('');
    logHtml += data.collections.slice().reverse().map(c => `
        <div class="list-item" style="color:var(--secondary);"><span>💰 تحصيل من ${c.client}</span><span style="font-weight:bold;">+${c.amount} ج.م</span></div>
    `).join('');
    logHtml += data.supplierPayments.slice().reverse().map(p => `
        <div class="list-item" style="color:var(--danger);"><span>💸 سداد مورد - ${p.supplier}</span><span style="font-weight:bold;">-${p.amount} ج.م</span></div>
    `).join('');
    document.getElementById('treasuryLog').innerHTML = logHtml || '<div style="text-align:center;color:#777;padding:10px;">لا توجد حركات مالية</div>';

    document.getElementById('saleList').innerHTML = data.sales.slice().reverse().map(s => `
        <div class="list-item">
            <span>${s.client} - ${s.product}</span>
            <div>
                <span style="font-weight:bold;">${s.total} ج.م</span>
                <button onclick="printSaleInvoice('${s.id}')" style="background:none;border:none;color:var(--primary);cursor:pointer;margin-right:5px;"><i class="fas fa-print"></i></button>
            </div>
        </div>
    `).join('');
    document.getElementById('purchaseList').innerHTML = data.purchases.slice().reverse().map(p => `
        <div class="list-item">
            <span>${p.supplier} - ${p.product}</span>
            <div>
                <span style="font-weight:bold;">${p.total} ج.م</span>
                <button onclick="printPurchaseInvoice('${p.id}')" style="background:none;border:none;color:var(--danger);cursor:pointer;margin-right:5px;"><i class="fas fa-print"></i></button>
            </div>
        </div>
    `).join('');
}

// ============================================
// عمليات إضافة البيانات
// ============================================
function addContact() {
    const data = getData();
    const name = document.getElementById('contactName').value.trim();
    const phone = document.getElementById('contactPhone').value.trim();
    const address = document.getElementById('contactAddress').value.trim();
    const type = document.getElementById('contactType').value;
    if(!name) return showToast('أدخل الاسم');
    data.clients.push({ id: Date.now().toString(), name, phone, address, type });
    saveLocal();
    document.getElementById('contactName').value = '';
    document.getElementById('contactPhone').value = '';
    document.getElementById('contactAddress').value = '';
    updateUI();
    showToast('تم إضافة جهة الاتصال');
}

function addProduct() {
    const data = getData();
    const name = document.getElementById('prodName').value.trim();
    const desc = document.getElementById('prodDesc').value.trim();
    const qty = parseInt(document.getElementById('prodQty').value) || 0;
    const buy = parseFloat(document.getElementById('prodBuy').value) || 0;
    const sell = parseFloat(document.getElementById('prodSell').value) || 0;
    if(!name || qty <= 0) return showToast('أدخل الاسم والكمية');
    
    // توليد باركود عشوائي للمنتج
    const barcode = Math.floor(10000000 + Math.random() * 90000000).toString();
    
    data.products.push({ id: Date.now().toString(), name, desc, qty, buy, sell, barcode });
    saveLocal();
    document.getElementById('prodName').value = '';
    document.getElementById('prodDesc').value = '';
    document.getElementById('prodQty').value = '';
    updateUI();
    showToast(`تم إضافة المنتج. الباركود: ${barcode}`);
}

// ============================================
// البحث بالباركود
// ============================================
function searchByBarcode() {
    const input = document.getElementById('manualBarcode').value.trim();
    if(!input) return showToast('أدخل الباركود أو اسم المنتج');
    const data = getData();
    // البحث بالباركود أو بالاسم
    let product = data.products.find(p => p.barcode === input);
    if(!product) {
        product = data.products.find(p => p.name.toLowerCase().includes(input.toLowerCase()));
    }
    if(product) {
        document.getElementById('saleProduct').value = product.id;
        document.getElementById('saleProduct').dispatchEvent(new Event('change'));
        showToast(`✅ تم العثور على المنتج: ${product.name}`);
    } else {
        showToast('⚠️ المنتج غير موجود');
    }
}

// ============================================
// المبيعات (مع الترقيم التلقائي)
// ============================================
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
    
    // ترقيم الفاتورة
    data.saleCounter = (data.saleCounter || 0) + 1;
    const invNum = `INV-${String(data.saleCounter).padStart(4, '0')}`;
    
    data.sales.push({ id: invNum, client, product: prod.name, qty, price, total, type, date: new Date().toLocaleDateString() });
    if(type === 'cash') {
        data.treasury += total;
        data.treasuryLog.push({ desc: `بيع كاش - ${client} (${invNum})`, amount: total });
    }
    saveLocal();
    updateUI();
    showToast(`بيع بقيمة ${total} ج.م - الفاتورة: ${invNum}`);
}

// ============================================
// المشتريات (مع الترقيم التلقائي)
// ============================================
function addPurchase() {
    const data = getData();
    const supplier = document.getElementById('purchaseSupplier').value.trim();
    const productId = document.getElementById('purchaseProduct').value;
    const qty = parseInt(document.getElementById('purchaseQty').value) || 0;
    const price = parseFloat(document.getElementById('purchasePrice').value) || 0;
    const type = document.getElementById('purchaseType').value;
    if(!supplier || !productId || qty <= 0) return showToast('أكمل البيانات');
    const prod = data.products.find(p => p.id === productId);
    if(!prod) return showToast('المنتج غير موجود');
    prod.qty += qty;
    const total = qty * price;
    
    // ترقيم فاتورة الشراء
    data.purchaseCounter = (data.purchaseCounter || 0) + 1;
    const purNum = `PUR-${String(data.purchaseCounter).padStart(4, '0')}`;
    
    data.purchases.push({ id: purNum, supplier, product: prod.name, qty, price, total, type, date: new Date().toLocaleDateString() });
    data.treasury -= total;
    data.treasuryLog.push({ desc: `شراء من ${supplier} (${purNum})`, amount: -total });
    saveLocal();
    updateUI();
    showToast(`شراء بقيمة ${total} ج.م - الفاتورة: ${purNum}`);
}

// ============================================
// الخزنة والسداد
// ============================================
function collectDebt() {
    const data = getData();
    const client = document.getElementById('collectClient').value.trim();
    const amount = parseFloat(document.getElementById('collectAmount').value);
    if(!client || !amount || amount <= 0) return showToast('أدخل اسم العميل والمبلغ');
    const clientExists = data.clients.find(c => c.name === client);
    if(!clientExists) return showToast('العميل غير موجود');
    data.treasury += amount;
    data.collections.push({ id: Date.now().toString(), client, amount });
    data.treasuryLog.push({ desc: `تحصيل من ${client}`, amount: amount });
    saveLocal();
    document.getElementById('collectClient').value = '';
    document.getElementById('collectAmount').value = '';
    updateUI();
    showToast(`تم تحصيل ${amount} ج.م من ${client}`);
}

function paySupplier() {
    const data = getData();
    const supplier = document.getElementById('paySupplier').value.trim();
    const amount = parseFloat(document.getElementById('payAmount').value);
    if(!supplier || !amount || amount <= 0) return showToast('أدخل اسم المورد والمبلغ');
    const supplierExists = data.clients.find(c => c.name === supplier);
    if(!supplierExists) return showToast('المورد غير موجود');
    if(data.treasury < amount) return showToast('الرصيد غير كافي للسداد');
    data.treasury -= amount;
    data.supplierPayments.push({ id: Date.now().toString(), supplier, amount });
    data.treasuryLog.push({ desc: `سداد مورد - ${supplier}`, amount: -amount });
    saveLocal();
    document.getElementById('paySupplier').value = '';
    document.getElementById('payAmount').value = '';
    updateUI();
    showToast(`تم سداد ${amount} ج.م للمورد ${supplier}`);
}

function addExpense() {
    const data = getData();
    const desc = document.getElementById('expenseDesc').value.trim();
    const amount = parseFloat(document.getElementById('expenseAmount').value);
    if(!desc || !amount || amount <= 0) return showToast('أدخل البيان والمبلغ');
    if(data.treasury < amount) return showToast('الرصيد غير كافي');
    data.treasury -= amount;
    data.expenses.push({ id: Date.now().toString(), desc, amount });
    saveLocal();
    document.getElementById('expenseDesc').value = '';
    document.getElementById('expenseAmount').value = '';
    updateUI();
    showToast('تم تسجيل المصروف');
}

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
    data.treasuryLog.push({ desc: 'سحب يدوي', amount: -amt });
    saveLocal();
    updateUI();
    document.getElementById('treasuryAmount').value = '';
    showToast('تم السحب');
}

// ============================================
// مسح كل البيانات (جديد)
// ============================================
function clearAllData() {
    if(!confirm('⚠️ هل أنت متأكد من مسح كل البيانات؟ هذا الإجراء لا يمكن التراجع عنه.')) return;
    if(!confirm('⚠️ تأكيد نهائي: هل تريد حذف كل المبيعات والمشتريات والمخزون والخزنة؟')) return;
    
    const data = getData();
    data.sales = [];
    data.purchases = [];
    data.products = [];
    data.clients = [];
    data.treasury = 0;
    data.treasuryLog = [];
    data.expenses = [];
    data.collections = [];
    data.supplierPayments = [];
    data.saleCounter = 0;
    data.purchaseCounter = 0;
    
    saveLocal();
    updateUI();
    showToast('🗑️ تم مسح كل البيانات بنجاح');
}

// ============================================
// تصدير واستيراد النسخ الاحتياطي (Backup & Restore)
// ============================================
function exportBackup() {
    const data = getData();
    if(!data) return showToast('لا توجد بيانات للتصدير');
    
    // تحويل البيانات لملف JSON
    const jsonData = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    // إنشاء رابط تحميل
    const a = document.createElement('a');
    a.href = url;
    a.download = `Rashed_Backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showToast('📥 تم تصدير النسخة الاحتياطية بنجاح');
}

function importBackup() {
    // إنشاء عنصر إدخال ملف مخفي
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    
    input.onchange = function(e) {
        const file = e.target.files[0];
        if(!file) return;
        
        const reader = new FileReader();
        reader.onload = function(event) {
            try {
                const importedData = JSON.parse(event.target.result);
                
                // التحقق من صحة البيانات
                if(typeof importedData === 'object' && importedData !== null) {
                    const data = getData();
                    
                    // دمج البيانات المستوردة مع البيانات الحالية (أو استبدالها)
                    if(confirm('هل تريد استبدال البيانات الحالية بالبيانات المستوردة؟ (اختر "إلغاء" للدمج)')) {
                        // استبدال كامل
                        Object.assign(data, importedData);
                    } else {
                        // دمج البيانات (إضافة الفواتير والمنتجات الجديدة فقط)
                        if(importedData.sales) {
                            importedData.sales.forEach(s => {
                                if(!data.sales.find(existing => existing.id === s.id)) {
                                    data.sales.push(s);
                                }
                            });
                        }
                        if(importedData.purchases) {
                            importedData.purchases.forEach(p => {
                                if(!data.purchases.find(existing => existing.id === p.id)) {
                                    data.purchases.push(p);
                                }
                            });
                        }
                        if(importedData.products) {
                            importedData.products.forEach(p => {
                                if(!data.products.find(existing => existing.id === p.id)) {
                                    data.products.push(p);
                                }
                            });
                        }
                        if(importedData.clients) {
                            importedData.clients.forEach(c => {
                                if(!data.clients.find(existing => existing.id === c.id)) {
                                    data.clients.push(c);
                                }
                            });
                        }
                        // تحديث الرصيد
                        data.treasury = importedData.treasury || data.treasury;
                        data.saleCounter = importedData.saleCounter || data.saleCounter;
                        data.purchaseCounter = importedData.purchaseCounter || data.purchaseCounter;
                    }
                    
                    saveLocal();
                    updateUI();
                    showToast('📤 تم استيراد البيانات بنجاح');
                } else {
                    showToast('❌ ملف غير صالح');
                }
            } catch(err) {
                showToast('❌ خطأ في قراءة الملف');
                console.error(err);
            }
        };
        reader.readAsText(file);
    };
    
    input.click();
}

// ============================================
// الطباعة
// ============================================
function generateInvoiceHTML(item, type) {
    const profile = appData.users[appData.currentUser].profile || { shopName: 'نظام راشد' };
    const title = type === 'sale' ? 'فاتورة بيع' : 'فاتورة شراء';
    const party = type === 'sale' ? item.client : item.supplier;
    return `
        <div class="print-area" style="direction:rtl;font-family:Arial,sans-serif;padding:20px;max-width:600px;margin:auto;border:1px solid #ddd;border-radius:10px;background:white;">
            <div style="text-align:center;border-bottom:2px solid #2E4057;padding-bottom:15px;margin-bottom:15px;">
                <h2 style="margin:0;">${profile.shopName}</h2>
                <p style="font-size:12px;color:#777;">${title}</p>
            </div>
            <div style="display:flex;justify-content:space-between;font-size:14px;margin-bottom:10px;">
                <span>${type === 'sale' ? 'العميل' : 'المورد'}: ${party}</span>
                <span>رقم الفاتورة: ${item.id}</span>
            </div>
            <table style="width:100%;border-collapse:collapse;font-size:14px;">
                <tr style="background:#2E4057;color:white;"><th style="padding:8px;text-align:right;">المنتج</th><th style="padding:8px;text-align:right;">الكمية</th><th style="padding:8px;text-align:right;">السعر</th><th style="padding:8px;text-align:right;">الإجمالي</th></tr>
                <tr><td style="padding:8px;border-bottom:1px solid #ddd;">${item.product}</td><td style="padding:8px;border-bottom:1px solid #ddd;">${item.qty}</td><td style="padding:8px;border-bottom:1px solid #ddd;">${item.price}</td><td style="padding:8px;border-bottom:1px solid #ddd;font-weight:bold;">${item.total} ج.م</td></tr>
            </table>
            <div style="text-align:left;font-size:18px;font-weight:bold;border-top:2px solid #2E4057;padding-top:10px;margin-top:10px;">الإجمالي: ${item.total} ج.م</div>
            <div style="text-align:center;font-size:11px;color:#777;margin-top:20px;">شكراً لتعاملكم معنا</div>
        </div>
    `;
}

function printSaleInvoice(id) {
    const data = getData();
    const sale = data.sales.find(s => s.id === id);
    if(!sale) return showToast('الفاتورة غير موجودة');
    const win = window.open('', '_blank');
    win.document.write(`<html><head><meta charset="UTF-8"><title>فاتورة ${sale.id}</title><style>body{background:white;padding:20px;}</style></head><body>`);
    win.document.write(generateInvoiceHTML(sale, 'sale'));
    win.document.write(`</body></html>`);
    win.document.close();
    win.focus();
    win.print();
}

function printPurchaseInvoice(id) {
    const data = getData();
    const purchase = data.purchases.find(p => p.id === id);
    if(!purchase) return showToast('الفاتورة غير موجودة');
    const win = window.open('', '_blank');
    win.document.write(`<html><head><meta charset="UTF-8"><title>فاتورة ${purchase.id}</title><style>body{background:white;padding:20px;}</style></head><body>`);
    win.document.write(generateInvoiceHTML(purchase, 'purchase'));
    win.document.write(`</body></html>`);
    win.document.close();
    win.focus();
    win.print();
}

function printAllInvoices() {
    const data = getData();
    if(data.sales.length === 0) return showToast('لا توجد فواتير للطباعة');
    data.sales.forEach(s => printSaleInvoice(s.id));
}

// ============================================
// الرسوم البيانية والتقارير
// ============================================
function drawCharts() {
    const data = getData();
    const salesTotal = data.sales.reduce((s, i) => s + i.total, 0);
    const expensesTotal = data.expenses.reduce((s, i) => s + i.amount, 0);
    const collectionsTotal = data.collections.reduce((s, i) => s + i.amount, 0);

    // الرسم البياني للمبيعات (شريطي)
    if(chartInstances.sales) chartInstances.sales.destroy();
    chartInstances.sales = new Chart(document.getElementById('salesChart'), {
        type: 'bar',
        data: {
            labels: ['مبيعات', 'مصروفات', 'تحصيل'],
            datasets: [{
                label: 'الحركة المالية',
                data: [salesTotal, expensesTotal, collectionsTotal],
                backgroundColor: ['#00B894', '#E17055', '#FDCB6E']
            }]
        },
        options: { plugins: { legend: { display: false } } }
    });

    // الرسم البياني للخزنة (تم تحويله لشريطي)
    if(chartInstances.treasury) chartInstances.treasury.destroy();
    chartInstances.treasury = new Chart(document.getElementById('treasuryChart'), {
        type: 'bar',
        data: {
            labels: ['الخزنة', 'مصروفات'],
            datasets: [{
                label: 'توزيع الرصيد',
                data: [data.treasury, expensesTotal],
                backgroundColor: ['#2E4057', '#E17055']
            }]
        },
        options: { plugins: { legend: { display: true, position: 'bottom' } } }
    });
}

function showReport(type) {
    const data = getData();
    const totalSales = data.sales.reduce((s, i) => s + i.total, 0);
    const totalPurchases = data.purchases.reduce((s, i) => s + i.total, 0);
    const totalExpenses = data.expenses.reduce((s, i) => s + i.amount, 0);
    const totalCollections = data.collections.reduce((s, i) => s + i.amount, 0);
    const totalSupplierPayments = data.supplierPayments.reduce((s, i) => s + i.amount, 0);
    const profit = totalSales - totalPurchases - totalExpenses;
    
    let html = '';
    
    if(type === 'income') {
        html = `
            <div style="background:#252538; border-radius:12px; padding:15px;">
                <div style="display:flex; justify-content:space-between; border-bottom:1px solid #444; padding:8px 0;">
                    <span style="color:#aaa;">📈 قائمة الدخل</span>
                    <span style="color:#fff;">المبلغ</span>
                </div>
                <div style="display:flex; justify-content:space-between; padding:8px 0; border-bottom:1px solid #333;">
                    <span>الإيرادات (المبيعات)</span>
                    <span style="color:#00B894;">${totalSales} ج.م</span>
                </div>
                <div style="display:flex; justify-content:space-between; padding:8px 0; border-bottom:1px solid #333;">
                    <span>التكاليف (المشتريات)</span>
                    <span style="color:#E17055;">${totalPurchases} ج.م</span>
                </div>
                <div style="display:flex; justify-content:space-between; padding:8px 0; border-bottom:1px solid #333;">
                    <span>المصروفات</span>
                    <span style="color:#E17055;">${totalExpenses} ج.م</span>
                </div>
                <div style="display:flex; justify-content:space-between; padding:8px 0; border-bottom:1px solid #333;">
                    <span>التحصيل</span>
                    <span style="color:#00B894;">${totalCollections} ج.م</span>
                </div>
                <div style="display:flex; justify-content:space-between; padding:8px 0; border-bottom:1px solid #333;">
                    <span>سداد الموردين</span>
                    <span style="color:#E17055;">${totalSupplierPayments} ج.م</span>
                </div>
                <div style="display:flex; justify-content:space-between; padding-top:10px; margin-top:10px; border-top:2px solid #00B894;">
                    <span style="font-weight:bold;">صافي الربح</span>
                    <span style="color:${profit >= 0 ? '#00B894' : '#E17055'}; font-weight:bold;">${profit} ج.м</span>
                </div>
            </div>
        `;
    } else if(type === 'daily') {
        const today = new Date().toLocaleDateString();
        const todaySales = data.sales.filter(s => s.date === today).reduce((s, i) => s + i.total, 0);
        const todayPurchases = data.purchases.filter(p => p.date === today).reduce((s, i) => s + i.total, 0);
        const todayExpenses = data.expenses.filter(e => e.date === today).reduce((s, i) => s + i.amount, 0);
        const todayProfit = todaySales - todayPurchases - todayExpenses;

        html = `
            <div style="background:#252538; border-radius:12px; padding:15px;">
                <div style="text-align:center; border-bottom:1px solid #444; padding-bottom:10px; margin-bottom:10px;">
                    <span style="color:#fff; font-size:16px; font-weight:bold;">📅 تقرير الخزنة اليومي</span><br>
                    <span style="color:#aaa; font-size:12px;">${today}</span>
                </div>
                <div style="display:flex; justify-content:space-between; padding:8px 0; border-bottom:1px solid #333;">
                    <span>مبيعات اليوم</span>
                    <span style="color:#00B894;">${todaySales} ج.м</span>
                </div>
                <div style="display:flex; justify-content:space-between; padding:8px 0; border-bottom:1px solid #333;">
                    <span>مشتريات اليوم</span>
                    <span style="color:#E17055;">${todayPurchases} ج.м</span>
                </div>
                <div style="display:flex; justify-content:space-between; padding:8px 0; border-bottom:1px solid #333;">
                    <span>مصروفات اليوم</span>
                    <span style="color:#E17055;">${todayExpenses} ج.м</span>
                </div>
                <div style="display:flex; justify-content:space-between; padding-top:10px; margin-top:10px; border-top:2px solid #00B894;">
                    <span style="font-weight:bold;">صافي ربح اليوم</span>
                    <span style="color:${todayProfit >= 0 ? '#00B894' : '#E17055'}; font-weight:bold;">${todayProfit} ج.м</span>
                </div>
            </div>
        `;
    } else if(type === 'trial') {
        const totalAssets = data.treasury;
        const totalLiabilities = data.sales.filter(s => s.type === 'credit').reduce((s, i) => s + i.total, 0);
        const equity = totalAssets - totalLiabilities;

        html = `
            <div style="background:#252538; border-radius:12px; padding:15px;">
                <div style="text-align:center; border-bottom:1px solid #444; padding-bottom:10px; margin-bottom:10px;">
                    <span style="color:#fff; font-size:16px; font-weight:bold;">📋 ميزان المراجعة</span>
                </div>
                <div style="display:flex; justify-content:space-between; padding:8px 0; border-bottom:1px solid #333;">
                    <span style="color:#aaa;">الأصول (الخزنة)</span>
                    <span style="color:#00B894;">${totalAssets} ج.м</span>
                </div>
                <div style="display:flex; justify-content:space-between; padding:8px 0; border-bottom:1px solid #333;">
                    <span style="color:#aaa;">الخصوم (الآجل)</span>
                    <span style="color:#E17055;">${totalLiabilities} ج.м</span>
                </div>
                <div style="display:flex; justify-content:space-between; padding-top:10px; margin-top:10px; border-top:2px solid #00B894;">
                    <span style="color:#fff;">حقوق الملكية</span>
                    <span style="color:${equity >= 0 ? '#00B894' : '#E17055'}; font-weight:bold;">${equity} ج.м</span>
                </div>
            </div>
        `;
    } else if(type === 'statement') {
        const clientName = document.getElementById('statementClientSelect').value;
        if(!clientName) {
            document.getElementById('statementClientField').style.display = 'block';
            html = `<div style="color:#aaa; text-align:center; padding:20px;">الرجاء اختيار جهة الاتصال</div>`;
        } else {
            document.getElementById('statementClientField').style.display = 'block';
            const clientSales = data.sales.filter(s => s.client === clientName);
            const clientCollections = data.collections.filter(c => c.client === clientName);
            const clientPurchases = data.purchases.filter(p => p.supplier === clientName);
            const clientPayments = data.supplierPayments.filter(p => p.supplier === clientName);
            
            let balance = 0;
            let rows = '';
            
            const isClient = data.clients.find(c => c.name === clientName && (c.type === 'عميل' || c.type === 'كلاهما'));
            if(isClient) {
                clientSales.forEach(s => {
                    balance += s.total;
                    rows += `
                        <div style="display:flex; justify-content:space-between; padding:6px 0; border-bottom:1px solid #333; font-size:13px;">
                            <span style="color:#aaa;">${s.date}</span>
                            <span style="color:#fff;">بيع - ${s.product}</span>
                            <span style="color:#E17055;">${s.total} ج.м</span>
                            <span style="color:#fff;">${balance} ج.м</span>
                        </div>
                    `;
                });
                clientCollections.forEach(c => {
                    balance -= c.amount;
                    rows += `
                        <div style="display:flex; justify-content:space-between; padding:6px 0; border-bottom:1px solid #333; font-size:13px;">
                            <span style="color:#aaa;">${new Date(c.id).toLocaleDateString()}</span>
                            <span style="color:#fff;">تحصيل</span>
                            <span style="color:#00B894;">${c.amount} ج.м</span>
                            <span style="color:#fff;">${balance} ج.м</span>
                        </div>
                    `;
                });
            }

            const isSupplier = data.clients.find(c => c.name === clientName && (c.type === 'مورد' || c.type === 'كلاهما'));
            if(isSupplier) {
                clientPurchases.forEach(p => {
                    balance += p.total;
                    rows += `
                        <div style="display:flex; justify-content:space-between; padding:6px 0; border-bottom:1px solid #333; font-size:13px;">
                            <span style="color:#aaa;">${p.date}</span>
                            <span style="color:#fff;">شراء - ${p.product}</span>
                            <span style="color:#E17055;">${p.total} ج.м</span>
                            <span style="color:#fff;">${balance} ج.м</span>
                        </div>
                    `;
                });
                clientPayments.forEach(p => {
                    balance -= p.amount;
                    rows += `
                        <div style="display:flex; justify-content:space-between; padding:6px 0; border-bottom:1px solid #333; font-size:13px;">
                            <span style="color:#aaa;">${new Date(p.id).toLocaleDateString()}</span>
                            <span style="color:#fff;">سداد مورد</span>
                            <span style="color:#00B894;">${p.amount} ج.м</span>
                            <span style="color:#fff;">${balance} ج.м</span>
                        </div>
                    `;
                });
            }

            if(!rows) {
                html = `<div style="color:#aaa; text-align:center; padding:20px;">لا توجد معاملات لهذه الجهة</div>`;
            } else {
                html = `
                    <div style="background:#252538; border-radius:12px; padding:15px;">
                        <div style="text-align:center; border-bottom:1px solid #444; padding-bottom:10px; margin-bottom:10px;">
                            <span style="color:#fff; font-size:16px; font-weight:bold;">📋 كشف حساب ${clientName}</span>
                        </div>
                        <div style="display:flex; justify-content:space-between; padding:8px 0; border-bottom:2px solid #00B894; font-weight:bold;">
                            <span style="color:#fff;">التاريخ</span>
                            <span style="color:#fff;">البيان</span>
                            <span style="color:#fff;">المبلغ</span>
                            <span style="color:#fff;">الرصيد</span>
                        </div>
                        ${rows}
                        <div style="display:flex; justify-content:space-between; padding-top:10px; margin-top:10px; border-top:2px solid #00B894; font-weight:bold;">
                            <span style="color:#fff;">الرصيد النهائي</span>
                            <span style="color:${balance > 0 ? '#E17055' : '#00B894'}; font-weight:bold;">${balance} ج.м</span>
                        </div>
                    </div>
                `;
            }
        }
    } else {
        html = `<div style="color:#aaa; text-align:center; padding:20px;">جاري تطوير هذا التقرير</div>`;
    }
    document.getElementById('reportContent').innerHTML = html;
}

// ============================================
// الذكاء الاصطناعي (AI Report)
// ============================================
function showAIReport() {
    const data = getData();
    const totalSales = data.sales.reduce((s, i) => s + i.total, 0);
    const totalPurchases = data.purchases.reduce((s, i) => s + i.total, 0);
    const totalExpenses = data.expenses.reduce((s, i) => s + i.amount, 0);
    const profit = totalSales - totalPurchases - totalExpenses;
    const totalProducts = data.products.length;
    const totalClients = data.clients.length;

    let report = `🤖 **تحليل الذكاء الاصطناعي لعملك**\n\n`;
    report += `📊 **إجمالي المبيعات:** ${totalSales} ج.م\n`;
    report += `📉 **إجمالي المشتريات:** ${totalPurchases} ج.م\n`;
    report += `💸 **إجمالي المصروفات:** ${totalExpenses} ج.м\n`;
    report += `💰 **صافي الربح:** ${profit} ج.м\n\n`;

    if(profit > 0) {
        report += `✅ **الأداء المالي:** عملك يحقق أرباحاً. استمر في تطوير مبيعاتك.\n`;
        if(totalExpenses > (totalSales * 0.3)) {
            report += `⚠️ **نصيحة:** مصروفاتك تمثل ${((totalExpenses/totalSales)*100).toFixed(1)}% من مبيعاتك. حاول تقليل المصروفات غير الضرورية.\n`;
        }
    } else {
        report += `⚠️ **الأداء المالي:** عملك يحقق خسائر. راجع المصروفات واستراتيجية التسعير.\n`;
    }

    if(totalProducts === 0) {
        report += `📦 **تنبيه المخزون:** لم تضف أي منتجات بعد. ابدأ بإضافة منتجات.\n`;
    }

    const productSales = {};
    data.sales.forEach(s => {
        productSales[s.product] = (productSales[s.product] || 0) + s.qty;
    });
    let bestSeller = null;
    let maxSales = 0;
    for(const [product, count] of Object.entries(productSales)) {
        if(count > maxSales) {
            maxSales = count;
            bestSeller = product;
        }
    }
    if(bestSeller) {
        report += `🏆 **المنتج الأكثر مبيعاً:** ${bestSeller} (تم بيع ${maxSales} قطعة)\n`;
    }

    alert(report);
}

// ============================================
// التوست
// ============================================
function showToast(msg) {
    const t = document.getElementById('toast');
    t.textContent = msg;
    t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), 3000);
}

// ============================================
// بدء التشغيل
// ============================================
loadLocal();
if(appData.currentUser && appData.users[appData.currentUser]) {
    document.getElementById('authContainer').style.display = 'none';
    document.getElementById('appContainer').style.display = 'block';
    document.getElementById('userDisplay').textContent = appData.currentUser;
    updateUI();
    switchPage('dashboard');
}
console.log('✅ نظام راشد V31 - Backup, Restore, و Clear Data');
