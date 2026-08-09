/* ============================================
   نظام راشد V31 - النسخة النهائية المتكاملة
   مع Firebase Authentication وحماية البيانات
   ============================================ */

// ============================================
// إعدادات Firebase
// ============================================
const firebaseConfig = {
    apiKey: "AIzaSyCQVcCAkZpeL9F9KADI5PtVanwTwO3SH5Y",
    authDomain: "smart-task-manager-d2a71.firebaseapp.com",
    databaseURL: "https://smart-task-manager-d2a71-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "smart-task-manager-d2a71",
    storageBucket: "smart-task-manager-d2a71.firebasestorage.app",
    messagingSenderId: "669004983540",
    appId: "1:669004983540:web:285edca38108f02f1e82a1",
    measurementId: "G-0HD3Q39B1Y"
};

// ============================================
// تهيئة Firebase - الطريقة الصحيحة لـ compat
// ============================================
let firebaseApp = null;
let firebaseAuth = null;
let firebaseDb = null;

function initFirebase() {
    if (!firebaseApp) {
        try {
            firebaseApp = firebase.initializeApp(firebaseConfig);
            firebaseAuth = firebase.auth(firebaseApp);
            firebaseDb = firebase.database(firebaseApp);
        } catch(e) {
            console.warn('Firebase already initialized:', e);
            firebaseApp = firebase.app();
            firebaseAuth = firebase.auth(firebaseApp);
            firebaseDb = firebase.database(firebaseApp);
        }
    }
    return { app: firebaseApp, auth: firebaseAuth, db: firebaseDb };
}

// ============================================
// المتغيرات العامة
// ============================================
let appData = { users: {}, currentUser: null, adminPin: '1234' };
let chartInstances = {};
let clickCount = 0;
let clickTimer = null;

// ============================================
// تحميل وحفظ البيانات
// ============================================
function loadLocal() {
    try {
        const raw = localStorage.getItem('RashedV31');
        if (raw) {
            const parsed = JSON.parse(raw);
            appData = parsed;
            if (appData.currentUser) {
                const { auth } = initFirebase();
                const currentUser = auth.currentUser;
                if (currentUser && currentUser.uid === appData.currentUser) {
                    autoLogin();
                } else if (currentUser) {
                    appData.currentUser = currentUser.uid;
                    autoLogin();
                }
            }
        }
    } catch(e) {
        console.warn('Error loading local data:', e);
    }
}

function saveLocal() {
    try {
        localStorage.setItem('RashedV31', JSON.stringify(appData));
        syncCloud();
    } catch(e) {
        console.warn('Error saving local data:', e);
    }
}

function getData() {
    if(!appData.currentUser || !appData.users[appData.currentUser]) {
        return { 
            sales: [], purchases: [], products: [], clients: [], 
            treasury: 0, treasuryLog: [], expenses: [], 
            collections: [], supplierPayments: [], 
            saleCounter: 0, purchaseCounter: 0,
            profile: { shopName: 'نظام راشد', branch: 'رئيسي' }
        };
    }
    return appData.users[appData.currentUser].data || {};
}

// ============================================
// مراقبة الاتصال
// ============================================
function setupConnectionMonitor() {
    try {
        const { db } = initFirebase();
        const connectedRef = db.ref('.info/connected');
        connectedRef.on('value', (snap) => {
            if (snap.val() === true) {
                console.log('🟢 متصل بالسحابة');
            } else {
                console.log('🔴 غير متصل - البيانات محلية فقط');
            }
        });
    } catch(e) {
        console.warn('Connection monitor error:', e);
    }
}

// ============================================
// السحابة (Firebase) - المزامنة
// ============================================
function syncCloud() {
    if(!appData.currentUser || !appData.users[appData.currentUser]) return;
    try {
        const { db } = initFirebase();
        const uid = appData.currentUser;
        const data = appData.users[uid].data;
        if (data) {
            db.ref('users/' + uid + '/data').set(data).catch(err => {
                console.warn('خطأ في المزامنة:', err);
            });
        }
    } catch(e) {
        console.warn('خطأ في المزامنة:', e);
    }
}

function loadFromCloud() {
    if(!appData.currentUser) return;
    try {
        const { db } = initFirebase();
        const uid = appData.currentUser;
        db.ref('users/' + uid + '/data').once('value').then(snapshot => {
            const data = snapshot.val();
            if(data) {
                if (!appData.users[uid]) {
                    appData.users[uid] = { data: {} };
                }
                appData.users[uid].data = data;
                localStorage.setItem('RashedV31', JSON.stringify(appData));
                updateUI();
                showToast('☁️ تم تحديث البيانات من السحابة');
            }
        }).catch(err => {
            console.warn('خطأ في تحميل البيانات:', err);
        });
    } catch(e) {
        console.warn('خطأ في الاتصال بالسحابة:', e);
    }
}

// ============================================
// الدخول التلقائي
// ============================================
function autoLogin() {
    if (appData.currentUser && appData.users[appData.currentUser]) {
        document.getElementById('authContainer').style.display = 'none';
        document.getElementById('appContainer').style.display = 'block';
        const displayName = appData.users[appData.currentUser]?.displayName || appData.currentUser.substring(0, 8);
        document.getElementById('userDisplay').textContent = displayName;
        setupConnectionMonitor();
        loadFromCloud();
        updateUI();
        switchPage('dashboard');
        return true;
    }
    return false;
}

// ============================================
// نظام الدخول باستخدام Firebase Auth
// ============================================
function toggleAuthMode() {
    document.getElementById('loginForm').style.display = document.getElementById('loginForm').style.display === 'none' ? 'block' : 'none';
    document.getElementById('registerForm').style.display = document.getElementById('registerForm').style.display === 'none' ? 'block' : 'none';
}

async function handleLogin() {
    const username = document.getElementById('loginUser').value.trim();
    const pass = document.getElementById('loginPass').value.trim();
    const email = username + '@rashed.com';
    
    if(!username || !pass) return showToast('⚠️ أدخل اسم المستخدم وكلمة المرور');
    
    try {
        const { auth } = initFirebase();
        const result = await auth.signInWithEmailAndPassword(email, pass);
        const user = result.user;
        
        appData.currentUser = user.uid;
        if (!appData.users[user.uid]) {
            appData.users[user.uid] = { 
                email: user.email,
                displayName: username,
                data: { 
                    sales: [], purchases: [], products: [], clients: [], 
                    treasury: 0, treasuryLog: [], expenses: [], 
                    collections: [], supplierPayments: [], 
                    saleCounter: 0, purchaseCounter: 0,
                    profile: { shopName: 'نظام راشد', branch: 'رئيسي' }
                }
            };
        } else {
            appData.users[user.uid].displayName = username;
        }
        saveLocal();
        enterApp();
        showToast('✅ مرحباً ' + username);
    } catch(error) {
        console.error('Login error:', error);
        if(error.code === 'auth/user-not-found') {
            showToast('❌ اسم المستخدم غير موجود');
        } else if(error.code === 'auth/wrong-password') {
            showToast('❌ كلمة المرور خطأ');
        } else {
            showToast('❌ خطأ: ' + error.message);
        }
    }
}

async function handleRegister() {
    const username = document.getElementById('regUser').value.trim();
    const pass = document.getElementById('regPass').value.trim();
    const confirm = document.getElementById('regPassConfirm').value.trim();
    const email = username + '@rashed.com';
    
    if(!username || username.length < 3) return showToast('⚠️ الاسم 3 أحرف على الأقل');
    if(pass.length < 6) return showToast('⚠️ كلمة المرور 6 أحرف على الأقل');
    if(pass !== confirm) return showToast('⚠️ كلمة المرور غير متطابقة');
    
    try {
        const { auth, db } = initFirebase();
        const result = await auth.createUserWithEmailAndPassword(email, pass);
        const newUser = result.user;
        
        await newUser.updateProfile({ displayName: username });
        
        await db.ref('users/' + newUser.uid + '/data').set({
            sales: [],
            purchases: [],
            products: [],
            clients: [],
            treasury: 0,
            treasuryLog: [],
            expenses: [],
            collections: [],
            supplierPayments: [],
            saleCounter: 0,
            purchaseCounter: 0,
            profile: { shopName: 'نظام راشد', branch: 'رئيسي' }
        });
        
        appData.currentUser = newUser.uid;
        appData.users[newUser.uid] = { 
            email: newUser.email,
            displayName: username,
            data: { 
                sales: [], purchases: [], products: [], clients: [], 
                treasury: 0, treasuryLog: [], expenses: [], 
                collections: [], supplierPayments: [], 
                saleCounter: 0, purchaseCounter: 0,
                profile: { shopName: 'نظام راشد', branch: 'رئيسي' }
            }
        };
        saveLocal();
        enterApp();
        showToast('✅ تم إنشاء الحساب بنجاح');
    } catch(error) {
        console.error('Register error:', error);
        if(error.code === 'auth/email-already-in-use') {
            showToast('⚠️ هذا الاسم مستخدم بالفعل');
        } else {
            showToast('❌ خطأ: ' + error.message);
        }
    }
}

function logout() {
    if(confirm('هل أنت متأكد من تسجيل الخروج؟')) {
        const { auth } = initFirebase();
        auth.signOut().then(() => {
            appData.currentUser = null;
            saveLocal();
            location.reload();
        });
    }
}

function enterApp() {
    document.getElementById('authContainer').style.display = 'none';
    document.getElementById('appContainer').style.display = 'block';
    const displayName = appData.users[appData.currentUser]?.displayName || appData.currentUser.substring(0, 8);
    document.getElementById('userDisplay').textContent = displayName;
    setupConnectionMonitor();
    loadFromCloud();
    updateUI();
    switchPage('dashboard');
}

// ============================================
// باقي الكود (نفس الكود السابق - جميع الدوال)
// ============================================
// ... (كل الدوال من script.js السابق: 
// switchPage, updateSelects, updateReportSelects, updateUI,
// addContact, addProduct, searchByBarcode, addSale, addPurchase,
// switchSalesMode, switchPurchaseMode, addSaleReturn, addPurchaseReturn,
// collectDebt, paySupplier, addToTreasury, withdrawTreasury, addExpense,
// generateInvoiceHTML, printSaleInvoice, printPurchaseInvoice, printAllInvoices,
// drawCharts, showReport, showAIReport, showToast,
// وكل دوال لوحة الأدمن)

// ============================================
// بدء التشغيل
// ============================================
// تأكد من تهيئة Firebase أولاً
initFirebase();

loadLocal();
if(!autoLogin()) {
    document.getElementById('authContainer').style.display = 'flex';
    document.getElementById('appContainer').style.display = 'none';
}
console.log('✅ نظام راشد V31 - النسخة النهائية المستقرة');
