<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.5, user-scalable=yes">
    <title>نظام راشد V31</title>
    <link rel="stylesheet" href="style.css">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css">
    <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>
    <script src="https://www.gstatic.com/firebasejs/9.22.0/firebase-app-compat.js"></script>
    <script src="https://www.gstatic.com/firebasejs/9.22.0/firebase-auth-compat.js"></script>
    <script src="https://www.gstatic.com/firebasejs/9.22.0/firebase-database-compat.js"></script>
</head>
<body>

    <!-- شاشة الدخول -->
    <div class="auth-container" id="authContainer">
        <div class="auth-box">
            <h2>نظام راشد V31</h2>
            <div id="loginForm">
                <input type="text" id="loginUser" placeholder="اسم المستخدم" value="admin">
                <input type="password" id="loginPass" placeholder="كلمة المرور" value="123456">
                <button class="btn-auth" onclick="handleLogin()">دخول</button>
                <button class="btn-auth btn-green" onclick="toggleAuthMode()">إنشاء حساب</button>
            </div>
            <div id="registerForm" style="display:none;">
                <input type="text" id="regUser" placeholder="اسم المستخدم">
                <input type="password" id="regPass" placeholder="كلمة المرور">
                <input type="password" id="regPassConfirm" placeholder="تأكيد">
                <input type="text" id="regFullName" placeholder="الاسم الكامل">
                <input type="text" id="regPhone" placeholder="رقم الهاتف">
                <input type="text" id="regAddress" placeholder="العنوان">
                <button class="btn-auth btn-green" onclick="handleRegister()">إنشاء</button>
                <button class="btn-auth btn-back" onclick="toggleAuthMode()">عودة</button>
            </div>
        </div>
    </div>

    <!-- التطبيق -->
    <div id="appContainer" style="display:none;">
        <div class="app-wrapper">

            <!-- الشريط الجانبي -->
            <div class="sidebar">
                <div class="sidebar-brand">📊 راشد V31</div>
                <button class="nav-btn" onclick="switchPage('dashboard')"><i class="fas fa-home"></i> الرئيسية</button>
                <button class="nav-btn" onclick="switchPage('sales')"><i class="fas fa-shopping-cart"></i> المبيعات</button>
                <button class="nav-btn" onclick="switchPage('purchases')"><i class="fas fa-truck"></i> المشتريات</button>
                <button class="nav-btn" onclick="switchPage('products')"><i class="fas fa-warehouse"></i> المخزون</button>
                <button class="nav-btn" onclick="switchPage('clients')"><i class="fas fa-address-book"></i> جهات الاتصال</button>
                <button class="nav-btn" onclick="switchPage('treasury')"><i class="fas fa-coins"></i> الخزنة</button>
                <button class="nav-btn" onclick="switchPage('reports')"><i class="fas fa-chart-pie"></i> التقارير</button>
                <button class="nav-btn" onclick="switchPage('settings')"><i class="fas fa-cog"></i> الإعدادات</button>
                <button class="nav-btn" onclick="switchPage('admin')" style="background:rgba(225,112,85,0.3);color:#E17055;"><i class="fas fa-user-shield"></i> لوحة التحكم</button>
                <button class="nav-btn logout-btn" onclick="logout()"><i class="fas fa-sign-out-alt"></i> خروج</button>
            </div>

            <div class="main-content">
                <div class="top-bar">
                    <div class="brand" id="brandLogo" style="cursor:pointer;">نظام راشد <span class="version">V31</span></div>
                    <div class="user-info">👤 <span id="userDisplay">admin</span></div>
                </div>

                <!-- الرئيسية -->
                <div id="page-dashboard" class="page active">
                    <div class="dashboard-grid">
                        <div class="dash-card card-sales" onclick="switchPage('sales')"><i class="fas fa-shopping-cart"></i><span>مبيعات</span></div>
                        <div class="dash-card card-purchases" onclick="switchPage('purchases')"><i class="fas fa-truck"></i><span>مشتريات</span></div>
                        <div class="dash-card card-products" onclick="switchPage('products')"><i class="fas fa-warehouse"></i><span>المخزون</span></div>
                        <div class="dash-card card-clients" onclick="switchPage('clients')"><i class="fas fa-address-book"></i><span>جهات الاتصال</span></div>
                        <div class="dash-card card-treasury" onclick="switchPage('treasury')"><i class="fas fa-coins"></i><span>الخزنة</span></div>
                        <div class="dash-card card-reports" onclick="switchPage('reports')"><i class="fas fa-chart-pie"></i><span>التقارير</span></div>
                        <div class="dash-card card-settings" onclick="switchPage('settings')" style="background:#6C5CE7;color:white;"><i class="fas fa-cog"></i><span>الإعدادات</span></div>
                        <div class="dash-card card-admin" onclick="switchPage('admin')" style="background:#E17055;color:white;"><i class="fas fa-user-shield"></i><span>لوحة التحكم</span></div>
                    </div>
                    <div class="charts-container">
                        <div class="chart-wrapper"><h4>📈 حركة المبيعات</h4><canvas id="salesChart"></canvas></div>
                        <div class="chart-wrapper"><h4>💰 رصيد الخزنة</h4><canvas id="treasuryChart"></canvas></div>
                    </div>
                    <button onclick="showAIReport()" style="width:100%;padding:15px;background:linear-gradient(135deg,#2E4057,#00B894);color:white;border:none;border-radius:12px;font-size:16px;font-weight:bold;cursor:pointer;margin-top:15px;">🤖 تحليل الذكاء الاصطناعي</button>
                </div>

                <!-- المبيعات (نفسها) -->
                <div id="page-sales" class="page">
                    <div class="modal-box">
                        <div class="modal-header"><h2>🛒 المبيعات</h2><button class="modal-close" onclick="switchPage('dashboard')">&times;</button></div>
                        <div style="display:flex;gap:8px;margin-bottom:10px;">
                            <input type="text" id="manualBarcode" placeholder="🔍 باركود أو اسم" style="flex:1;padding:10px;border:2px solid #eee;border-radius:8px;">
                            <button onclick="searchByBarcode()" style="padding:10px 20px;background:#2E4057;color:white;border:none;border-radius:8px;cursor:pointer;">بحث</button>
                        </div>
                        <div style="display:flex;gap:10px;margin-bottom:10px;">
                            <button onclick="switchSalesMode('add')" id="saleModeAdd" class="btn-toggle active">بيع</button>
                            <button onclick="switchSalesMode('return')" id="saleModeReturn" class="btn-toggle">مرتجع</button>
                        </div>
                        <div id="saleAddFields">
                            <div class="form-group"><label>العميل</label><input type="text" id="saleClient"></div>
                            <div class="form-group"><label>المنتج</label><select id="saleProduct"><option>اختر</option></select></div>
                            <div class="form-group"><label>الكمية</label><input type="number" id="saleQty" value="1"></div>
                            <div class="form-group"><label>السعر</label><input type="number" id="salePrice"></div>
                            <div class="form-group"><label>نوع الدفع</label><select id="saleType"><option value="cash">كاش</option><option value="credit">آجل</option></select></div>
                            <button class="btn-main" onclick="addSale()">تسجيل البيع</button>
                        </div>
                        <div id="saleReturnFields" style="display:none;">
                            <div class="form-group"><label>العميل</label><input type="text" id="returnClient"></div>
                            <div class="form-group"><label>المنتج</label><select id="returnProduct"><option>اختر</option></select></div>
                            <div class="form-group"><label>الكمية</label><input type="number" id="returnQty" value="1"></div>
                            <div class="form-group"><label>السعر</label><input type="number" id="returnPrice"></div>
                            <button class="btn-main" onclick="addSaleReturn()" style="background:#E17055;">تسجيل المرتجع</button>
                        </div>
                        <div id="saleList" class="list-view"></div>
                    </div>
                </div>

                <!-- المشتريات (نفسها) -->
                <div id="page-purchases" class="page">
                    <div class="modal-box">
                        <div class="modal-header"><h2>🚚 المشتريات</h2><button class="modal-close" onclick="switchPage('dashboard')">&times;</button></div>
                        <div style="display:flex;gap:10px;margin-bottom:10px;">
                            <button onclick="switchPurchaseMode('add')" id="purchaseModeAdd" class="btn-toggle active">شراء</button>
                            <button onclick="switchPurchaseMode('return')" id="purchaseModeReturn" class="btn-toggle">مرتجع</button>
                        </div>
                        <div id="purchaseAddFields">
                            <div class="form-group"><label>المورد</label><input type="text" id="purchaseSupplier"></div>
                            <div class="form-group"><label>المنتج</label><select id="purchaseProduct"><option>اختر</option></select></div>
                            <div class="form-group"><label>الكمية</label><input type="number" id="purchaseQty" value="1"></div>
                            <div class="form-group"><label>السعر</label><input type="number" id="purchasePrice"></div>
                            <div class="form-group"><label>نوع الدفع</label><select id="purchaseType"><option value="cash">كاش</option><option value="credit">آجل</option></select></div>
                            <button class="btn-main" onclick="addPurchase()">تسجيل الشراء</button>
                        </div>
                        <div id="purchaseReturnFields" style="display:none;">
                            <div class="form-group"><label>المورد</label><input type="text" id="returnSupplier"></div>
                            <div class="form-group"><label>المنتج</label><select id="returnPurchaseProduct"><option>اختر</option></select></div>
                            <div class="form-group"><label>الكمية</label><input type="number" id="returnPurchaseQty" value="1"></div>
                            <div class="form-group"><label>السعر</label><input type="number" id="returnPurchasePrice"></div>
                            <button class="btn-main" onclick="addPurchaseReturn()" style="background:#E17055;">تسجيل المرتجع</button>
                        </div>
                        <div id="purchaseList" class="list-view"></div>
                    </div>
                </div>

                <!-- المخزون -->
                <div id="page-products" class="page">
                    <div class="modal-box">
                        <div class="modal-header"><h2>📦 المخزون</h2><button class="modal-close" onclick="switchPage('dashboard')">&times;</button></div>
                        <div class="form-group"><label>اسم المنتج</label><input type="text" id="prodName"></div>
                        <div class="form-group"><label>الوصف</label><input type="text" id="prodDesc"></div>
                        <div class="form-group"><label>الكمية</label><input type="number" id="prodQty"></div>
                        <div class="form-group"><label>سعر الشراء</label><input type="number" id="prodBuy"></div>
                        <div class="form-group"><label>سعر البيع</label><input type="number" id="prodSell"></div>
                        <button class="btn-main" onclick="addProduct()">إضافة منتج</button>
                        <div id="productList" class="list-view"></div>
                    </div>
                </div>

                <!-- جهات الاتصال -->
                <div id="page-clients" class="page">
                    <div class="modal-box">
                        <div class="modal-header"><h2>👤 جهات الاتصال</h2><button class="modal-close" onclick="switchPage('dashboard')">&times;</button></div>
                        <div class="form-group"><label>الاسم</label><input type="text" id="contactName"></div>
                        <div class="form-group"><label>الهاتف</label><input type="text" id="contactPhone"></div>
                        <div class="form-group"><label>العنوان</label><input type="text" id="contactAddress"></div>
                        <div class="form-group"><label>النوع</label><select id="contactType"><option value="عميل">عميل</option><option value="مورد">مورد</option><option value="كلاهما">كلاهما</option></select></div>
                        <button class="btn-main" onclick="addContact()">إضافة</button>
                        <div id="clientList" class="list-view"></div>
                    </div>
                </div>

                <!-- الخزنة -->
                <div id="page-treasury" class="page">
                    <div class="modal-box">
                        <div class="modal-header"><h2>💰 الخزنة</h2><button class="modal-close" onclick="switchPage('dashboard')">&times;</button></div>
                        <div class="treasury-balance">الرصيد: <span id="treasuryDisplay">0</span> ج.م</div>
                        <div class="treasury-section">
                            <h3 class="section-title-green">💰 تحصيل دين</h3>
                            <div class="form-group"><label>العميل</label><input type="text" id="collectClient"></div>
                            <div style="display:flex;gap:10px;"><div style="flex:1;"><label>المبلغ</label><input type="number" id="collectAmount"></div><button onclick="collectDebt()" class="btn-green">تحصيل</button></div>
                        </div>
                        <div class="treasury-section">
                            <h3 class="section-title-red">💸 سداد مورد</h3>
                            <div class="form-group"><label>المورد</label><input type="text" id="paySupplier"></div>
                            <div style="display:flex;gap:10px;"><div style="flex:1;"><label>المبلغ</label><input type="number" id="payAmount"></div><button onclick="paySupplier()" class="btn-red">سداد</button></div>
                        </div>
                        <div class="treasury-section">
                            <h3 class="section-title-blue">🏦 الخزنة</h3>
                            <div style="display:flex;gap:10px;"><div style="flex:1;"><label>المبلغ</label><input type="number" id="treasuryAmount"></div><button onclick="addToTreasury()" class="btn-green">إيداع</button><button onclick="withdrawTreasury()" class="btn-red">سحب</button></div>
                        </div>
                        <div class="treasury-section">
                            <h3 class="section-title-red">💸 مصروف</h3>
                            <div style="display:flex;gap:10px;"><div style="flex:2;"><label>البيان</label><input type="text" id="expenseDesc"></div><div style="flex:1;"><label>المبلغ</label><input type="number" id="expenseAmount"></div></div>
                            <button onclick="addExpense()" class="btn-red" style="width:100%;">تسجيل</button>
                        </div>
                        <div id="treasuryLog" class="list-view"></div>
                    </div>
                </div>

                <!-- التقارير -->
                <div id="page-reports" class="page">
                    <div class="modal-box">
                        <div class="modal-header"><h2>📊 التقارير</h2><button class="modal-close" onclick="switchPage('dashboard')">&times;</button></div>
                        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
                            <button onclick="showReport('income')" class="btn-main" style="background:#00B894;">📈 الدخل</button>
                            <button onclick="showReport('daily')" class="btn-main" style="background:#E17055;">📅 اليوم</button>
                            <button onclick="showReport('trial')" class="btn-main" style="background:#FDCB6E;color:#333;">📋 ميزان المراجعة</button>
                            <button onclick="showReport('statement')" class="btn-main" style="background:#2E4057;">📋 كشف حساب</button>
                            <button onclick="printAllInvoices()" class="btn-main" style="background:#333;">🖨️ طباعة</button>
                        </div>
                        <div id="statementClientField" style="display:none;margin-top:10px;">
                            <select id="statementClientSelect" onchange="showReport('statement')" style="width:100%;padding:10px;border:2px solid #eee;border-radius:8px;"><option>اختر</option></select>
                        </div>
                        <div class="report-box" id="reportContent">اختر تقريراً</div>
                    </div>
                </div>

                <!-- الإعدادات -->
                <div id="page-settings" class="page">
                    <div class="modal-box">
                        <div class="modal-header"><h2>⚙️ الإعدادات</h2><button class="modal-close" onclick="switchPage('dashboard')">&times;</button></div>
                        <div class="settings-section">
                            <h3 class="section-title-blue">🎨 المظهر</h3>
                            <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:10px;">
                                <button onclick="changeTheme('default')" class="btn-theme" style="background:#F4F6F9;color:#333;border:2px solid #ddd;">افتراضي</button>
                                <button onclick="changeTheme('dark')" class="btn-theme" style="background:#1a1a2e;color:white;">داكن</button>
                                <button onclick="changeTheme('blue')" class="btn-theme" style="background:#0c2461;color:white;">أزرق</button>
                                <button onclick="changeTheme('green')" class="btn-theme" style="background:#0a3d2e;color:white;">أخضر</button>
                                <button onclick="changeTheme('purple')" class="btn-theme" style="background:#2c1a4d;color:white;">بنفسجي</button>
                            </div>
                            <div style="display:flex;gap:8px;flex-wrap:wrap;">
                                <button onclick="changeFontSize('small')" class="btn-sm">صغير</button>
                                <button onclick="changeFontSize('medium')" class="btn-sm" style="background:#2E4057;color:white;">وسط</button>
                                <button onclick="changeFontSize('large')" class="btn-sm">كبير</button>
                                <button onclick="changeFontSize('xlarge')" class="btn-sm">كبير جداً</button>
                            </div>
                        </div>
                        <div class="settings-section">
                            <h3 class="section-title-green">🔔 التنبيهات</h3>
                            <div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid #eee;">
                                <label>صوتية</label>
                                <label class="switch"><input type="checkbox" id="soundAlerts" checked><span class="slider round"></span></label>
                            </div>
                            <div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;">
                                <label>منبثقة</label>
                                <label class="switch"><input type="checkbox" id="popupAlerts" checked><span class="slider round"></span></label>
                            </div>
                            <div class="form-group" style="margin-top:10px;">
                                <label>صوت</label>
                                <select id="alertSound" style="width:100%;padding:10px;border:2px solid #eee;border-radius:8px;">
                                    <option value="beep">🔔 بيب</option>
                                    <option value="bell">🔔 جرس</option>
                                    <option value="notification">📱 إشعار</option>
                                </select>
                            </div>
                        </div>
                        <div class="settings-section">
                            <h3 class="section-title-red">🖨️ الطباعة</h3>
                            <div class="form-group">
                                <label>نوع الطابعة</label>
                                <select id="printerSettings" style="width:100%;padding:10px;border:2px solid #eee;border-radius:8px;">
                                    <option value="thermal">حرارية 80mm</option>
                                    <option value="thermal-58">حرارية 58mm</option>
                                    <option value="a4">A4</option>
                                </select>
                            </div>
                        </div>
                        <div class="settings-section">
                            <h3 class="section-title-blue">📊 الباركود</h3>
                            <div style="display:flex;gap:8px;flex-wrap:wrap;">
                                <button onclick="setBarcodeLibrary('barcode')" class="btn-sm" style="background:#2E4057;color:white;">باركود</button>
                                <button onclick="setBarcodeLibrary('qr')" class="btn-sm">QR</button>
                                <button onclick="setBarcodeLibrary('both')" class="btn-sm">كلاهما</button>
                            </div>
                            <div style="margin-top:10px;">
                                <label>الحجم: <span id="barcodeSizeLabel">100%</span></label>
                                <input type="range" id="barcodeSize" min="50" max="200" value="100" style="width:100%;" oninput="updateBarcodeSizeLabel()">
                            </div>
                        </div>
                        <div class="settings-section">
                            <h3 class="section-title-blue">ℹ️ معلومات</h3>
                            <div style="background:#f0f2f5;padding:15px;border-radius:8px;color:#333;">
                                <p><strong>📌 الإصدار:</strong> V31</p>
                                <p><strong>👨‍💻 المطور:</strong> نظام راشد</p>
                                <p><strong>☁️ السحابة:</strong> <span id="cloudStatus" style="color:#00B894;">🟢 متصل</span></p>
                                <p><strong>👤 المستخدم:</strong> <span id="settingsUser">admin</span></p>
                                <p><strong>📦 المنتجات:</strong> <span id="settingsProducts">0</span></p>
                                <p><strong>📋 العملاء:</strong> <span id="settingsClients">0</span></p>
                            </div>
                            <button onclick="resetAppSettings()" class="btn-red" style="width:100%;margin-top:10px;">🔄 إعادة ضبط</button>
                        </div>
                    </div>
                </div>

                <!-- ============================================================ -->
                <!-- لوحة التحكم (صفحة جديدة) -->
                <!-- ============================================================ -->
                <div id="page-admin" class="page">
                    <div class="modal-box">
                        <div class="modal-header">
                            <h2>🛡️ لوحة تحكم المدير</h2>
                            <button class="modal-close" onclick="switchPage('dashboard')">&times;</button>
                        </div>

                        <!-- إحصائيات سريعة -->
                        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:10px;margin-bottom:15px;">
                            <div style="background:#2E4057;color:white;padding:15px;border-radius:10px;text-align:center;">
                                <div style="font-size:24px;font-weight:bold;" id="adminTotalUsers">0</div>
                                <div style="font-size:12px;">إجمالي المستخدمين</div>
                            </div>
                            <div style="background:#00B894;color:white;padding:15px;border-radius:10px;text-align:center;">
                                <div style="font-size:24px;font-weight:bold;" id="adminOnlineUsers">0</div>
                                <div style="font-size:12px;">متصلون الآن</div>
                            </div>
                            <div style="background:#E17055;color:white;padding:15px;border-radius:10px;text-align:center;">
                                <div style="font-size:24px;font-weight:bold;" id="adminTodayVisits">0</div>
                                <div style="font-size:12px;">زيارات اليوم</div>
                            </div>
                        </div>

                        <!-- جدول المستخدمين -->
                        <div style="overflow-x:auto;">
                            <table style="width:100%;border-collapse:collapse;font-size:13px;">
                                <thead>
                                    <tr style="background:#2E4057;color:white;">
                                        <th style="padding:8px;text-align:right;">#</th>
                                        <th style="padding:8px;text-align:right;">اسم المستخدم</th>
                                        <th style="padding:8px;text-align:right;">الاسم الكامل</th>
                                        <th style="padding:8px;text-align:right;">الهاتف</th>
                                        <th style="padding:8px;text-align:right;">آخر دخول</th>
                                        <th style="padding:8px;text-align:right;">الدولة</th>
                                        <th style="padding:8px;text-align:right;">IP</th>
                                        <th style="padding:8px;text-align:right;">الحالة</th>
                                    </tr>
                                </thead>
                                <tbody id="adminUsersTable">
                                    <tr><td colspan="8" style="text-align:center;padding:20px;color:#999;">لا يوجد مستخدمين</td></tr>
                                </tbody>
                            </table>
                        </div>

                        <!-- سجل الدخول والخروج -->
                        <div style="margin-top:15px;">
                            <h3 style="color:#2E4057;border-bottom:2px solid #2E4057;padding-bottom:8px;">📋 سجل النشاط</h3>
                            <div id="adminActivityLog" class="list-view" style="max-height:200px;"></div>
                        </div>
                    </div>
                </div>

            </div>
        </div>

        <!-- الشريط السفلي -->
        <div class="bottom-nav">
            <button onclick="switchPage('dashboard')"><i class="fas fa-home"></i><span>الرئيسية</span></button>
            <button onclick="switchPage('sales')"><i class="fas fa-shopping-cart"></i><span>مبيعات</span></button>
            <button onclick="switchPage('purchases')"><i class="fas fa-truck"></i><span>مشتريات</span></button>
            <button onclick="switchPage('products')"><i class="fas fa-warehouse"></i><span>المخزون</span></button>
            <button onclick="switchPage('settings')"><i class="fas fa-cog"></i><span>إعدادات</span></button>
            <button onclick="switchPage('admin')" style="color:#E17055;"><i class="fas fa-user-shield"></i><span>التحكم</span></button>
            <button onclick="logout()" style="color:#E17055;"><i class="fas fa-sign-out-alt"></i><span>خروج</span></button>
        </div>
    </div>

    <div id="toast" class="toast"></div>
    <script src="script.js"></script>
</body>
</html>
