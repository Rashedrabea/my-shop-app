// ========== رفع اللوجو ==========
document.getElementById('logoUpload').addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(event) {
            const preview = document.getElementById('logoPreview');
            preview.innerHTML = `<img src="${event.target.result}" alt="شعار الشركة">`;
        };
        reader.readAsDataURL(file);
    }
});

// ========== تبويبات العملاء والموردين ==========
function switchTab(tab) {
    // إخفاء كل التبويبات
    document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(el => el.classList.remove('active'));
    
    // إظهار التبويب المطلوب
    document.getElementById(tab + 'Tab').classList.add('active');
    // تفعيل الزر المناسب
    document.querySelectorAll('.tab-btn').forEach(el => {
        if (el.textContent.trim() === (tab === 'customers' ? 'العملاء' : 'الموردين')) {
            el.classList.add('active');
        }
    });
}

// ========== تبويبات المرتجعات ==========
function switchReturnTab(tab) {
    document.querySelectorAll('.returns-tabs + .tab-content').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.returns-tabs .tab-btn').forEach(el => el.classList.remove('active'));
    
    document.getElementById(tab).classList.add('active');
    document.querySelectorAll('.returns-tabs .tab-btn').forEach(el => {
        if (el.textContent.trim() === (tab === 'sales-returns' ? 'مرتجعات المبيعات' : 'مرتجعات المشتريات')) {
            el.classList.add('active');
        }
    });
}

// ========== إضافة عميل ==========
document.getElementById('customerForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const name = document.getElementById('customerName').value;
    const phone = document.getElementById('customerPhone').value;
    const tax = document.getElementById('customerTax').value;
    const address = document.getElementById('customerAddress').value;
    
    if (!name) {
        alert('يرجى إدخال اسم العميل');
        return;
    }
    
    const tableBody = document.getElementById('customersList');
    const newRow = document.createElement('tr');
    const code = 'C' + String(tableBody.children.length + 1).padStart(3, '0');
    newRow.innerHTML = `
        <td>${code}</td>
        <td>${name}</td>
        <td>${phone || '-'}</td>
        <td>${tax || '-'}</td>
        <td>0</td>
        <td>
            <button class="btn-edit"><i class="fas fa-edit"></i></button>
            <button class="btn-delete" onclick="this.closest('tr').remove()"><i class="fas fa-trash"></i></button>
        </td>
    `;
    tableBody.appendChild(newRow);
    
    closeModal('customerModal');
    this.reset();
    alert(`تم إضافة العميل ${name} بنجاح`);
});

// ========== إضافة مورد ==========
document.getElementById('supplierForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const name = document.getElementById('supplierName').value;
    const phone = document.getElementById('supplierPhone').value;
    const tax = document.getElementById('supplierTax').value;
    const address = document.getElementById('supplierAddress').value;
    
    if (!name) {
        alert('يرجى إدخال اسم المورد');
        return;
    }
    
    const tableBody = document.getElementById('suppliersList');
    const newRow = document.createElement('tr');
    const code = 'S' + String(tableBody.children.length + 1).padStart(3, '0');
    newRow.innerHTML = `
        <td>${code}</td>
        <td>${name}</td>
        <td>${phone || '-'}</td>
        <td>${tax || '-'}</td>
        <td>0</td>
        <td>
            <button class="btn-edit"><i class="fas fa-edit"></i></button>
            <button class="btn-delete" onclick="this.closest('tr').remove()"><i class="fas fa-trash"></i></button>
        </td>
    `;
    tableBody.appendChild(newRow);
    
    closeModal('supplierModal');
    this.reset();
    alert(`تم إضافة المورد ${name} بنجاح`);
});

// ========== فتح مودالات العملاء والموردين ==========
function showAddCustomerModal() {
    document.getElementById('customerModal').style.display = 'block';
}

function showAddSupplierModal() {
    document.getElementById('supplierModal').style.display = 'block';
}

// ========== فتح مودال المرتجعات ==========
function showReturnModal(type) {
    document.getElementById('returnModal').style.display = 'block';
    document.getElementById('returnType').value = type;
    document.getElementById('returnInvoiceNo').value = type === 'sales' ? '#101' : '#P101';
}

// ========== إضافة أصناف في فاتورة المبيعات ==========
function addSaleItem() {
    const container = document.getElementById('saleItemsContainer');
    const row = document.createElement('div');
    row.className = 'item-row';
    row.innerHTML = `
        <input type="text" placeholder="الصنف" class="item-name" onchange="calculateSaleTotal()">
        <input type="number" placeholder="الكمية" class="item-qty" value="1" onchange="calculateSaleTotal()" oninput="calculateSaleTotal()">
        <input type="number" placeholder="السعر" class="item-price" onchange="calculateSaleTotal()" oninput="calculateSaleTotal()">
        <input type="number" placeholder="الإجمالي" class="item-total" readonly>
        <button type="button" class="btn-delete" onclick="this.parentElement.remove(); calculateSaleTotal();">
            <i class="fas fa-times"></i>
        </button>
    `;
    container.appendChild(row);
    calculateSaleTotal();
}

// ========== حساب إجمالي فاتورة المبيعات ==========
function calculateSaleTotal() {
    const rows = document.querySelectorAll('#saleItemsContainer .item-row');
    let subtotal = 0;
    const taxRate = 0.14; // 14% ضريبة
    
    rows.forEach(row => {
        const qty = parseFloat(row.querySelector('.item-qty').value) || 0;
        const price = parseFloat(row.querySelector('.item-price').value) || 0;
        const total = qty * price;
        row.querySelector('.item-total').value = total.toFixed(2);
        subtotal += total;
    });
    
    const tax = subtotal * taxRate;
    const grandTotal = subtotal + tax;
    
    document.getElementById('saleSubtotal').value = subtotal.toFixed(2);
    document.getElementById('saleTax').value = tax.toFixed(2);
    document.getElementById('saleGrandTotal').value = grandTotal.toFixed(2);
}

// ========== إضافة أصناف في فاتورة المشتريات ==========
function addPurchaseItem() {
    const container = document.getElementById('purchaseItemsContainer');
    const row = document.createElement('div');
    row.className = 'item-row';
    row.innerHTML = `
        <input type="text" placeholder="الصنف" class="item-name" onchange="calculatePurchaseTotal()">
        <input type="number" placeholder="الكمية" class="item-qty" value="1" onchange="calculatePurchaseTotal()" oninput="calculatePurchaseTotal()">
        <input type="number" placeholder="سعر الشراء" class="item-price" onchange="calculatePurchaseTotal()" oninput="calculatePurchaseTotal()">
        <input type="number" placeholder="الإجمالي" class="item-total" readonly>
        <button type="button" class="btn-delete" onclick="this.parentElement.remove(); calculatePurchaseTotal();">
            <i class="fas fa-times"></i>
        </button>
    `;
    container.appendChild(row);
    calculatePurchaseTotal();
}

// ========== حساب إجمالي فاتورة المشتريات ==========
function calculatePurchaseTotal() {
    const rows = document.querySelectorAll('#purchaseItemsContainer .item-row');
    let subtotal = 0;
    const taxRate = 0.14;
    
    rows.forEach(row => {
        const qty = parseFloat(row.querySelector('.item-qty').value) || 0;
        const price = parseFloat(row.querySelector('.item-price').value) || 0;
        const total = qty * price;
        row.querySelector('.item-total').value = total.toFixed(2);
        subtotal += total;
    });
    
    const tax = subtotal * taxRate;
    const grandTotal = subtotal + tax;
    
    document.getElementById('purchaseSubtotal').value = subtotal.toFixed(2);
    document.getElementById('purchaseTax').value = tax.toFixed(2);
    document.getElementById('purchaseGrandTotal').value = grandTotal.toFixed(2);
}

// ========== تسجيل فاتورة مبيعات ==========
document.getElementById('saleForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const customer = document.getElementById('saleCustomer').value;
    const grandTotal = parseFloat(document.getElementById('saleGrandTotal').value) || 0;
    
    if (!customer || grandTotal === 0) {
        alert('يرجى إدخال العميل والمنتجات');
        return;
    }
    
    const invoiceNumber = '#' + (Math.floor(Math.random() * 9000) + 1000);
    const today = document.getElementById('saleDate').value || new Date().toISOString().split('T')[0];
    
    const tableBody = document.getElementById('salesList');
    const newRow = document.createElement('tr');
    newRow.innerHTML = `
        <td>${invoiceNumber}</td>
        <td>${today}</td>
        <td>${customer}</td>
        <td>${document.getElementById('saleSubtotal').value}</td>
        <td>${document.getElementById('saleTax').value}</td>
        <td>${grandTotal.toFixed(2)}</td>
        <td><span class="status paid">مدفوعة</span></td>
        <td>
            <button class="btn-edit"><i class="fas fa-print"></i></button>
            <button class="btn-delete"><i class="fas fa-trash"></i></button>
        </td>
    `;
    tableBody.prepend(newRow);
    
    // تحديث إجمالي المبيعات
    const totalSales = document.getElementById('totalSales');
    const currentTotal = parseFloat(totalSales.textContent.replace(/,/g, ''));
    totalSales.textContent = (currentTotal + grandTotal).toLocaleString();
    
    // تحديث الخزينة
    updateTreasury('income', grandTotal, `مبيعات - ${invoiceNumber}`);
    
    closeModal('saleModal');
    this.reset();
    document.getElementById('saleItemsContainer').innerHTML = `
        <div class="item-row">
            <input type="text" placeholder="الصنف" class="item-name" onchange="calculateSaleTotal()">
            <input type="number" placeholder="الكمية" class="item-qty" value="1" onchange="calculateSaleTotal()" oninput="calculateSaleTotal()">
            <input type="number" placeholder="السعر" class="item-price" onchange="calculateSaleTotal()" oninput="calculateSaleTotal()">
            <input type="number" placeholder="الإجمالي" class="item-total" readonly>
            <button type="button" class="btn-delete" onclick="this.parentElement.remove(); calculateSaleTotal();">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `;
    calculateSaleTotal();
    
    alert(`تم إصدار الفاتورة ${invoiceNumber} بقيمة ${grandTotal.toFixed(2)} جنيه`);
});

// ========== تسجيل فاتورة مشتريات ==========
document.getElementById('purchaseForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const supplier = document.getElementById('purchaseSupplier').value;
    const grandTotal = parseFloat(document.getElementById('purchaseGrandTotal').value) || 0;
    
    if (!supplier || grandTotal === 0) {
        alert('يرجى إدخال المورد والمنتجات');
        return;
    }
    
    const invoiceNumber = '#P' + (Math.floor(Math.random() * 9000) + 1000);
    const today = document.getElementById('purchaseDate').value || new Date().toISOString().split('T')[0];
    
    const tableBody = document.getElementById('purchasesList');
    const newRow = document.createElement('tr');
    newRow.innerHTML = `
        <td>${invoiceNumber}</td>
        <td>${today}</td>
        <td>${supplier}</td>
        <td>${document.getElementById('purchaseSubtotal').value}</td>
        <td>${document.getElementById('purchaseTax').value}</td>
        <td>${grandTotal.toFixed(2)}</td>
        <td><span class="status paid">مدفوعة</span></td>
        <td>
            <button class="btn-edit"><i class="fas fa-print"></i></button>
            <button class="btn-delete"><i class="fas fa-trash"></i></button>
        </td>
    `;
    tableBody.prepend(newRow);
    
    // تحديث إجمالي المشتريات
    const totalPurchases = document.getElementById('totalPurchases');
    const currentTotal = parseFloat(totalPurchases.textContent.replace(/,/g, ''));
    totalPurchases.textContent = (currentTotal + grandTotal).toLocaleString();
    
    // تحديث الخزينة (صرف)
    updateTreasury('expense', grandTotal, `مشتريات - ${invoiceNumber}`);
    
    closeModal('purchaseModal');
    this.reset();
    document.getElementById('purchaseItemsContainer').innerHTML = `
        <div class="item-row">
            <input type="text" placeholder="الصنف" class="item-name" onchange="calculatePurchaseTotal()">
            <input type="number" placeholder="الكمية" class="item-qty" value="1" onchange="calculatePurchaseTotal()" oninput="calculatePurchaseTotal()">
            <input type="number" placeholder="سعر الشراء" class="item-price" onchange="calculatePurchaseTotal()" oninput="calculatePurchaseTotal()">
            <input type="number" placeholder="الإجمالي" class="item-total" readonly>
            <button type="button" class="btn-delete" onclick="this.parentElement.remove(); calculatePurchaseTotal();">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `;
    calculatePurchaseTotal();
    
    alert(`تم إصدار فاتورة الشراء ${invoiceNumber} بقيمة ${grandTotal.toFixed(2)} جنيه`);
});

// ========== تحديث الخزينة تلقائياً ==========
function updateTreasury(type, amount, description) {
    const balanceElement = document.getElementById('treasuryBalance');
    let currentBalance = parseFloat(balanceElement.textContent.replace(/,/g, ''));
    
    if (type === 'income') {
        currentBalance += amount;
        const incomeEl = document.querySelector('.treasury-card:nth-child(2) .amount');
        const currentIncome = parseFloat(incomeEl.textContent.replace(/[^\d.]/g, '')) || 0;
        incomeEl.textContent = (currentIncome + amount).toLocaleString() + ' جنيه';
    } else {
        currentBalance -= amount;
        const expenseEl = document.querySelector('.treasury-card:nth-child(3) .amount');
        const currentExpense = parseFloat(expenseEl.textContent.replace(/[^\d.]/g, '')) || 0;
        expenseEl.textContent = (currentExpense + amount).toLocaleString() + ' جنيه';
    }
    
    balanceElement.textContent = currentBalance.toLocaleString();
    
    // إضافة الحركة إلى جدول الخزينة
    const tableBody = document.getElementById('treasuryTransactions');
    const newRow = document.createElement('tr');
    newRow.innerHTML = `
        <td>${new Date().toISOString().split('T')[0]}</td>
        <td>${description}</td>
        <td>${type === 'income' ? amount.toFixed(2) : '-'}</td>
        <td>${type === 'expense' ? amount.toFixed(2) : '-'}</td>
        <td>${currentBalance.toFixed(2)}</td>
    `;
    tableBody.prepend(newRow);
}

// ========== تسجيل حركة خزينة يدوية ==========
document.getElementById('transactionForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const type = document.getElementById('transactionType').value;
    const desc = document.getElementById('transactionDesc').value;
    const amount = parseFloat(document.getElementById('transactionAmount').value);
    const payment = document.getElementById('transactionPayment').value;
    
    if (!desc || !amount) {
        alert('يرجى إدخال البيان والمبلغ');
        return;
    }
    
    updateTreasury(type, amount, desc);
    
    closeModal('transactionModal');
    this.reset();
    alert(`تم تسجيل الحركة بنجاح`);
});

// ========== تسجيل مرتجع ==========
document.getElementById('returnForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const type = document.getElementById('returnType').value;
    const invoiceNo = document.getElementById('returnInvoiceNo').value;
    const party = document.getElementById('returnParty').value;
    const item = document.getElementById('returnItem').value;
    const qty = document.getElementById('returnQty').value;
    const amount = parseFloat(document.getElementById('returnAmount').value);
    const reason = document.getElementById('returnReason').value;
    
    if (!invoiceNo || !party || !item || !amount) {
        alert('يرجى ملء جميع الحقول المطلوبة');
        return;
    }
    
    const returnNo = (type === 'sales' ? 'R' : 'RP') + String(Math.floor(Math.random() * 9000) + 1000);
    const tableId = type === 'sales' ? 'sales-returns' : 'purchases-returns';
    const tableBody = document.getElementById(tableId).querySelector('tbody');
    
    const newRow = document.createElement('tr');
    newRow.innerHTML = `
        <td>${returnNo}</td>
        <td>${new Date().toISOString().split('T')[0]}</td>
        <td>${invoiceNo}</td>
        <td>${party}</td>
        <td>${amount.toFixed(2)}</td>
        <td>${reason}</td>
    `;
    tableBody.prepend(newRow);
    
    // تحديث الخزينة (مرتجع مبيعات = صرف، مرتجع مشتريات = قبض)
    const treasuryType = type === 'sales' ? 'expense' : 'income';
    updateTreasury(treasuryType, amount, `${type === 'sales' ? 'مرتجع مبيعات' : 'مرتجع مشتريات'} - ${returnNo}`);
    
    closeModal('returnModal');
    this.reset();
    alert(`تم تسجيل المرتجع ${returnNo} بنجاح`);
});

// ========== إعداد تاريخ الفاتورة تلقائياً ==========
document.addEventListener('DOMContentLoaded', function() {
    const today = new Date().toISOString().split('T')[0];
    const dateInputs = document.querySelectorAll('input[type="date"]');
    dateInputs.forEach(input => {
        if (!input.value) {
            input.value = today;
        }
    });
    
    // إعداد رقم الفاتورة تلقائياً
    const saleInvoice = document.getElementById('saleInvoiceNo');
    if (saleInvoice) {
        const count = document.getElementById('salesList').children.length + 1;
        saleInvoice.value = `INV-2026-${String(count).padStart(3, '0')}`;
    }
    
    const purchaseInvoice = document.getElementById('purchaseInvoiceNo');
    if (purchaseInvoice) {
        const count = document.getElementById('purchasesList').children.length + 1;
        purchaseInvoice.value = `PUR-2026-${String(count).padStart(3, '0')}`;
    }
});

// ========== إغلاق المودال عند النقر خارجها ==========
window.onclick = function(event) {
    if (event.target.classList.contains('modal')) {
        event.target.style.display = 'none';
    }
}

// ========== فتح المودالات ==========
function showAddItemModal() {
    document.getElementById('itemModal').style.display = 'block';
}

function showAddSaleModal() {
    document.getElementById('saleModal').style.display = 'block';
    // حساب الأرقام تلقائياً
    setTimeout(calculateSaleTotal, 100);
}

function showAddPurchaseModal() {
    document.getElementById('purchaseModal').style.display = 'block';
    setTimeout(calculatePurchaseTotal, 100);
}

function showAddTransactionModal() {
    document.getElementById('transactionModal').style.display = 'block';
}

function showAddWarehouseModal() {
    alert('سيتم فتح نموذج إضافة مخزن جديد');
}

function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

// ========== التقارير ==========
function generateReport(type) {
    const reportNames = {
        'balance': 'ميزان المراجعة',
        'income': 'قائمة الدخل',
        'financial': 'المركز المالي',
        'sales': 'تقرير المبيعات',
        'inventory': 'تقرير المخزون',
        'customers': 'تقرير العملاء'
    };
    
    alert(`📊 سيتم إنشاء تقرير "${reportNames[type] || type}"\n\nيمكنك هنا عرض البيانات المطلوبة أو تصديرها إلى PDF/Excel`);
}

// ========== الرسم البياني ==========
document.addEventListener('DOMContentLoaded', function() {
    const canvas = document.getElementById('salesChart');
    if (canvas) {
        const ctx = canvas.getContext('2d');
        const rect = canvas.parentElement.getBoundingClientRect();
        const width = rect.width - 40;
        const height = 200;
        canvas.width = width;
        canvas.height = height;
        
        const data = [12000, 19000, 15000, 22000, 18000, 25000, 21000, 28000, 24000, 30000, 27000, 33000];
        const maxData = Math.max(...data);
        const barWidth = Math.min((width - 60) / data.length - 8, 30);
        const startX = 30;
        
        ctx.fillStyle = '#f8f9fa';
        ctx.fillRect(0, 0, width, height);
        
        data.forEach((value, index) => {
            const x = startX + index * (barWidth + 8);
            const barHeight = (value / maxData) * (height - 60);
            const y = height - 20 - barHeight;
            
            const gradient = ctx.createLinearGradient(x, y, x, height - 20);
            gradient.addColorStop(0, '#4fc3f7');
            gradient.addColorStop(1, '#0288d1');
            ctx.fillStyle = gradient;
            ctx.shadowColor = 'rgba(79, 195, 247, 0.3)';
            ctx.shadowBlur = 8;
            
            const radius = 4;
            ctx.beginPath();
            ctx.moveTo(x + radius, y);
            ctx.lineTo(x + barWidth - radius, y);
            ctx.quadraticCurveTo(x + barWidth, y, x + barWidth, y + radius);
            ctx.lineTo(x + barWidth, height - 20);
            ctx.lineTo(x, height - 20);
            ctx.lineTo(x, y + radius);
            ctx.quadraticCurveTo(x, y, x + radius, y);
            ctx.fill();
            ctx.shadowBlur = 0;
            
            ctx.fillStyle = '#2c3e50';
            ctx.font = '11px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(value.toLocaleString(), x + barWidth/2, y - 5);
            
            const months = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
            ctx.fillStyle = '#7f8c8d';
            ctx.font = '10px Arial';
            ctx.fillText(months[index], x + barWidth/2, height - 3);
        });
    }
});

// ========== عرض أفضل الأصناف ==========
function updateTopItems() {
    const container = document.getElementById('topItems');
    if (!container) return;
    
    const items = [
        { name: 'منتج عام 1', sales: 45 },
        { name: 'منتج عام 2', sales: 32 },
        { name: 'منتج عام 3', sales: 28 },
        { name: 'منتج عام 4', sales: 25 },
        { name: 'منتج عام 5', sales: 20 }
    ];
    
    container.innerHTML = items.map(item => `
        <div class="top-item">
            <span class="item-name">${item.name}</span>
            <span class="item-sales">${item.sales} وحدة</span>
        </div>
    `).join('');
}
updateTopItems();

// ========== تبديل الصفحات ==========
document.querySelectorAll('nav a').forEach(link => {
    link.addEventListener('click', function(e) {
        e.preventDefault();
        
        document.querySelectorAll('nav a').forEach(a => a.classList.remove('active'));
        this.classList.add('active');
        
        document.querySelectorAll('.page').forEach(page => page.classList.remove('active'));
        
        const pageId = this.dataset.page;
        document.getElementById(`page-${pageId}`).classList.add('active');
        
        const pageTitle = this.textContent.trim();
        document.querySelector('.page-title').textContent = pageTitle;
        
        document.querySelector('.sidebar').classList.remove('open');
    });
});

// ========== قائمة الموبايل ==========
document.querySelector('.menu-toggle').addEventListener('click', function() {
    document.querySelector('.sidebar').classList.toggle('open');
});

// ========== عرض التاريخ ==========
function updateDate() {
    const now = new Date();
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    document.querySelector('.date-display').textContent = now.toLocaleDateString('ar-EG', options);
}
updateDate();

// ========== حفظ بيانات الشركة ==========
document.getElementById('companyForm').addEventListener('submit', function(e) {
    e.preventDefault();
    alert('✅ تم حفظ بيانات الشركة بنجاح');
});

console.log('✅ النظام المحاسبي المتكامل جاهز للاستخدام - عملة: جنيه مصري');
