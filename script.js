// ========== تبديل الصفحات ==========
document.querySelectorAll('nav a').forEach(link => {
    link.addEventListener('click', function(e) {
        e.preventDefault();
        
        // إزالة التفعيل من جميع الروابط
        document.querySelectorAll('nav a').forEach(a => a.classList.remove('active'));
        this.classList.add('active');
        
        // إخفاء جميع الصفحات
        document.querySelectorAll('.page').forEach(page => page.classList.remove('active'));
        
        // عرض الصفحة المطلوبة
        const pageId = this.dataset.page;
        document.getElementById(`page-${pageId}`).classList.add('active');
        
        // تحديث عنوان الصفحة
        const pageTitle = this.textContent.trim();
        document.querySelector('.page-title').textContent = pageTitle;
        
        // إغلاق القائمة الجانبية في الموبايل
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
    document.querySelector('.date-display').textContent = now.toLocaleDateString('ar-SA', options);
}
updateDate();

// ========== المودالات ==========
function showAddItemModal() {
    document.getElementById('itemModal').style.display = 'block';
}

function showAddSaleModal() {
    document.getElementById('saleModal').style.display = 'block';
}

function showAddPurchaseModal() {
    document.getElementById('purchaseModal').style.display = 'block';
}

function showAddWarehouseModal() {
    alert('سيتم فتح نموذج إضافة مخزن جديد');
}

function showAddTransactionModal() {
    document.getElementById('transactionModal').style.display = 'block';
}

function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

// إغلاق المودال عند النقر خارجها
window.onclick = function(event) {
    if (event.target.classList.contains('modal')) {
        event.target.style.display = 'none';
    }
}

// ========== إدارة الأصناف ==========
document.getElementById('itemForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const code = document.getElementById('itemCode').value;
    const name = document.getElementById('itemName').value;
    const category = document.getElementById('itemCategory').value;
    const unit = document.getElementById('itemUnit').value;
    const purchasePrice = document.getElementById('itemPurchasePrice').value;
    const salePrice = document.getElementById('itemSalePrice').value;
    
    if (!code || !name) {
        alert('يرجى إدخال الكود واسم الصنف');
        return;
    }
    
    // إضافة الصف إلى الجدول
    const tableBody = document.getElementById('itemsList');
    const newRow = document.createElement('tr');
    newRow.innerHTML = `
        <td>${code}</td>
        <td>${name}</td>
        <td>${category || 'غير مصنف'}</td>
        <td>${unit}</td>
        <td>${purchasePrice || '0'}</td>
        <td>${salePrice || '0'}</td>
        <td>
            <button class="btn-edit"><i class="fas fa-edit"></i></button>
            <button class="btn-delete" onclick="this.closest('tr').remove()"><i class="fas fa-trash"></i></button>
        </td>
    `;
    tableBody.appendChild(newRow);
    
    // إغلاق المودال وتفريغ الحقول
    closeModal('itemModal');
    this.reset();
    
    alert(`تم إضافة الصنف ${name} بنجاح`);
});

// ========== إدارة المبيعات ==========
document.getElementById('saleForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const customer = document.getElementById('saleCustomer').value;
    const item = document.getElementById('saleItem').value;
    const quantity = document.getElementById('saleQuantity').value;
    const price = document.getElementById('salePrice').value;
    const payment = document.getElementById('salePayment').value;
    
    if (!customer || !price) {
        alert('يرجى إدخال اسم العميل وسعر البيع');
        return;
    }
    
    const total = quantity * price;
    const tax = total * 0.15; // ضريبة 15%
    const grandTotal = total + tax;
    const invoiceNumber = '#' + (Math.floor(Math.random() * 9000) + 1000);
    
    // إضافة الصف إلى جدول المبيعات
    const tableBody = document.getElementById('salesList');
    const newRow = document.createElement('tr');
    newRow.innerHTML = `
        <td>${invoiceNumber}</td>
        <td>${new Date().toISOString().split('T')[0]}</td>
        <td>${customer}</td>
        <td>${total.toFixed(2)}</td>
        <td>${tax.toFixed(2)}</td>
        <td>${grandTotal.toFixed(2)}</td>
        <td><span class="status paid">مدفوعة</span></td>
    `;
    tableBody.prepend(newRow);
    
    // تحديث إحصائيات الرئيسية
    const totalSales = document.getElementById('totalSales');
    const currentTotal = parseFloat(totalSales.textContent.replace(/,/g, ''));
    totalSales.textContent = (currentTotal + grandTotal).toLocaleString();
    
    closeModal('saleModal');
    this.reset();
    
    alert(`تم إصدار الفاتورة ${invoiceNumber} بقيمة ${grandTotal.toFixed(2)} ريال`);
});

// ========== إدارة المشتريات ==========
document.getElementById('purchaseForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const supplier = document.getElementById('purchaseSupplier').value;
    const item = document.getElementById('purchaseItem').value;
    const quantity = document.getElementById('purchaseQuantity').value;
    const cost = document.getElementById('purchaseCost').value;
    const payment = document.getElementById('purchasePayment').value;
    
    if (!supplier || !cost) {
        alert('يرجى إدخال اسم المورد وسعر الشراء');
        return;
    }
    
    const total = quantity * cost;
    const tax = total * 0.15;
    const grandTotal = total + tax;
    const invoiceNumber = '#P' + (Math.floor(Math.random() * 9000) + 1000);
    
    // إضافة الصف إلى جدول المشتريات
    const tableBody = document.getElementById('purchasesList');
    const newRow = document.createElement('tr');
    newRow.innerHTML = `
        <td>${invoiceNumber}</td>
        <td>${new Date().toISOString().split('T')[0]}</td>
        <td>${supplier}</td>
        <td>${total.toFixed(2)}</td>
        <td>${tax.toFixed(2)}</td>
        <td>${grandTotal.toFixed(2)}</td>
        <td><span class="status paid">مدفوعة</span></td>
    `;
    tableBody.prepend(newRow);
    
    // تحديث إحصائيات الرئيسية
    const totalPurchases = document.getElementById('totalPurchases');
    const currentTotal = parseFloat(totalPurchases.textContent.replace(/,/g, ''));
    totalPurchases.textContent = (currentTotal + grandTotal).toLocaleString();
    
    closeModal('purchaseModal');
    this.reset();
    
    alert(`تم إصدار فاتورة الشراء ${invoiceNumber} بقيمة ${grandTotal.toFixed(2)} ريال`);
});

// ========== إدارة الخزينة ==========
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
    
    // تحديث رصيد الخزينة
    const balanceElement = document.getElementById('treasuryBalance');
    let currentBalance = parseFloat(balanceElement.textContent.replace(/,/g, ''));
    
    if (type === 'income') {
        currentBalance += amount;
        document.querySelector('.treasury-card:nth-child(2) .amount').textContent = 
            (parseFloat(document.querySelector('.treasury-card:nth-child(2) .amount').textContent.replace(/,/g, '')) + amount).toLocaleString();
    } else {
        currentBalance -= amount;
        document.querySelector('.treasury-card:nth-child(3) .amount').textContent = 
            (parseFloat(document.querySelector('.treasury-card:nth-child(3) .amount').textContent.replace(/,/g, '')) + amount).toLocaleString();
    }
    
    balanceElement.textContent = currentBalance.toLocaleString();
    
    // إضافة الحركة إلى الجدول
    const tableBody = document.querySelector('#page-treasury table tbody');
    const newRow = document.createElement('tr');
    newRow.innerHTML = `
        <td>${new Date().toISOString().split('T')[0]}</td>
        <td>${desc}</td>
        <td>${type === 'income' ? amount.toFixed(2) : '-'}</td>
        <td>${type === 'expense' ? amount.toFixed(2) : '-'}</td>
        <td>${currentBalance.toFixed(2)}</td>
    `;
    tableBody.prepend(newRow);
    
    closeModal('transactionModal');
    this.reset();
    
    alert(`تم تسجيل الحركة بنجاح`);
});

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
    
    alert(`سيتم إنشاء تقرير "${reportNames[type] || type}"\nيمكنك هنا عرض البيانات المطلوبة أو تصديرها إلى PDF/Excel`);
}

// ========== حفظ بيانات الشركة ==========
document.getElementById('companyForm').addEventListener('submit', function(e) {
    e.preventDefault();
    alert('تم حفظ بيانات الشركة بنجاح');
});

// ========== الرسم البياني (Chart.js) ==========
// يمكنك استخدام مكتبة Chart.js للرسوم البيانية
// هنا نستخدم Canvas مع رسم بسيط بالـ JS
document.addEventListener('DOMContentLoaded', function() {
    const canvas = document.getElementById('salesChart');
    if (canvas) {
        const ctx = canvas.getContext('2d');
        const width = canvas.parentElement.clientWidth - 40;
        const height = 200;
        canvas.width = width;
        canvas.height = height;
        
        // بيانات المبيعات (شهرية)
        const data = [12000, 19000, 15000, 22000, 18000, 25000];
        const maxData = Math.max(...data);
        const barWidth = (width - 60) / data.length - 10;
        const startX = 30;
        
        // رسم الخلفية
        ctx.fillStyle = '#f8f9fa';
        ctx.fillRect(0, 0, width, height);
        
        // رسم الأعمدة
        data.forEach((value, index) => {
            const x = startX + index * (barWidth + 10);
            const barHeight = (value / maxData) * (height - 60);
            const y = height - 20 - barHeight;
            
            // العمود
            const gradient = ctx.createLinearGradient(x, y, x, height - 20);
            gradient.addColorStop(0, '#4fc3f7');
            gradient.addColorStop(1, '#0288d1');
            ctx.fillStyle = gradient;
            ctx.shadowColor = 'rgba(79, 195, 247, 0.3)';
            ctx.shadowBlur = 8;
            ctx.fillRect(x, y, barWidth, barHeight);
            ctx.shadowBlur = 0;
            
            // القيمة فوق العمود
            ctx.fillStyle = '#2c3e50';
            ctx.font = '12px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(value.toLocaleString(), x + barWidth/2, y - 5);
            
            // الشهر تحت العمود
            const months = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو'];
            ctx.fillStyle = '#7f8c8d';
            ctx.font = '11px Arial';
            ctx.fillText(months[index], x + barWidth/2, height - 5);
        });
    }
});

// ========== عرض أفضل الأصناف ==========
function updateTopItems() {
    const container = document.getElementById('topItems');
    if (!container) return;
    
    const items = [
        { name: 'لاب توب', sales: 45 },
        { name: 'طابعة', sales: 32 },
        { name: 'شاشة', sales: 28 },
        { name: 'ماوس', sales: 25 },
        { name: 'كيبورد', sales: 20 }
    ];
    
    container.innerHTML = items.map(item => `
        <div class="top-item">
            <span class="item-name">${item.name}</span>
            <span class="item-sales">${item.sales} وحدة</span>
        </div>
    `).join('');
}
updateTopItems();

// ========== تحديث الإحصائيات بشكل دوري (محاكاة) ==========
console.log('✅ النظام المحاسبي المتكامل جاهز للاستخدام');
