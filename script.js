// ============================================
// دوال الإعدادات (Settings)
// ============================================

// تغيير السمة (Theme)
function changeTheme(theme) {
    const body = document.body;
    // إزالة كل السمات السابقة
    body.className = '';
    if (theme !== 'default') {
        body.classList.add('theme-' + theme);
    }
    // حفظ الإعدادات
    const settings = getSettings();
    settings.theme = theme;
    saveSettings(settings);
    showToast('✅ تم تغيير السمة');
}

// تغيير حجم الخط
function changeFontSize(size) {
    const body = document.body;
    let fontSize = '16px';
    switch(size) {
        case 'small': fontSize = '13px'; break;
        case 'medium': fontSize = '16px'; break;
        case 'large': fontSize = '19px'; break;
        case 'xlarge': fontSize = '22px'; break;
    }
    body.style.fontSize = fontSize;
    const settings = getSettings();
    settings.fontSize = size;
    saveSettings(settings);
    showToast('✅ تم تغيير حجم الخط');
}

// تفعيل/إلغاء التنبيهات الصوتية
function toggleSoundAlerts() {
    const checked = document.getElementById('soundAlerts').checked;
    const settings = getSettings();
    settings.soundAlerts = checked;
    saveSettings(settings);
    showToast(checked ? '✅ تم تفعيل التنبيهات الصوتية' : '⛔ تم إلغاء التنبيهات الصوتية');
}

// تفعيل/إلغاء التنبيهات المنبثقة
function togglePopupAlerts() {
    const checked = document.getElementById('popupAlerts').checked;
    const settings = getSettings();
    settings.popupAlerts = checked;
    saveSettings(settings);
    showToast(checked ? '✅ تم تفعيل التنبيهات المنبثقة' : '⛔ تم إلغاء التنبيهات المنبثقة');
}

// تغيير صوت التنبيه
function changeAlertSound() {
    const sound = document.getElementById('alertSound').value;
    const settings = getSettings();
    settings.alertSound = sound;
    saveSettings(settings);
    // تشغيل الصوت للتجربة
    playAlertSound(sound);
    showToast('✅ تم تغيير صوت التنبيه');
}

// تشغيل صوت التنبيه
function playAlertSound(type) {
    const sounds = {
        beep: [440, 0.1, 880, 0.1],
        bell: [660, 0.15, 880, 0.15],
        notification: [523, 0.1, 659, 0.1, 784, 0.15],
        chime: [523, 0.2, 659, 0.2, 784, 0.3]
    };
    const notes = sounds[type] || sounds.beep;
    try {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        let time = audioCtx.currentTime;
        notes.forEach((freq, i) => {
            if (i % 2 === 0) {
                const osc = audioCtx.createOscillator();
                const gain = audioCtx.createGain();
                osc.connect(gain);
                gain.connect(audioCtx.destination);
                osc.frequency.value = freq;
                gain.gain.setValueAtTime(0.3, time);
                gain.gain.exponentialRampToValueAtTime(0.01, time + (notes[i+1] || 0.1));
                osc.start(time);
                osc.stop(time + (notes[i+1] || 0.1));
                time += (notes[i+1] || 0.1) + 0.05;
            }
        });
    } catch(e) {
        console.warn('صوت غير مدعوم');
    }
}

// حفظ إعدادات الطابعة
function savePrinterSettings() {
    const printer = document.getElementById('printerSettings').value;
    const settings = getSettings();
    settings.printer = printer;
    saveSettings(settings);
    showToast('✅ تم حفظ إعدادات الطابعة');
}

// تغيير مكتبة الباركود
function setBarcodeLibrary(type) {
    const settings = getSettings();
    settings.barcodeLibrary = type;
    saveSettings(settings);
    const labels = {
        barcode: 'باركود عادي',
        qr: 'QR Code',
        both: 'كلاهما'
    };
    document.getElementById('barcodeLibraryStatus').textContent = 'المكتبة الحالية: ' + (labels[type] || 'باركود عادي');
    showToast('✅ تم تغيير مكتبة الباركود إلى: ' + (labels[type] || 'باركود عادي'));
}

// تحديث حجم الباركود
function updateBarcodeSize() {
    const size = document.getElementById('barcodeSize').value;
    document.getElementById('barcodeSizeLabel').textContent = size + '%';
    const settings = getSettings();
    settings.barcodeSize = parseInt(size);
    saveSettings(settings);
}

// الحصول على إعدادات التطبيق
function getSettings() {
    const data = getData();
    if (!data.settings) {
        data.settings = {
            theme: 'default',
            fontSize: 'medium',
            soundAlerts: true,
            popupAlerts: true,
            alertSound: 'beep',
            printer: 'thermal',
            barcodeLibrary: 'barcode',
            barcodeSize: 100
        };
    }
    return data.settings;
}

// حفظ الإعدادات
function saveSettings(settings) {
    const data = getData();
    data.settings = settings;
    saveLocal();
}

// تحميل الإعدادات عند فتح صفحة الإعدادات
function loadSettings() {
    const settings = getSettings();
    
    // السمات
    if (settings.theme && settings.theme !== 'default') {
        document.body.className = 'theme-' + settings.theme;
    } else {
        document.body.className = '';
    }
    
    // حجم الخط
    const sizeMap = { small: '13px', medium: '16px', large: '19px', xlarge: '22px' };
    document.body.style.fontSize = sizeMap[settings.fontSize] || '16px';
    
    // التنبيهات
    document.getElementById('soundAlerts').checked = settings.soundAlerts !== false;
    document.getElementById('popupAlerts').checked = settings.popupAlerts !== false;
    document.getElementById('alertSound').value = settings.alertSound || 'beep';
    
    // الطابعة
    document.getElementById('printerSettings').value = settings.printer || 'thermal';
    
    // الباركود
    const labels = { barcode: 'باركود عادي', qr: 'QR Code', both: 'كلاهما' };
    document.getElementById('barcodeLibraryStatus').textContent = 'المكتبة الحالية: ' + (labels[settings.barcodeLibrary] || 'باركود عادي');
    document.getElementById('barcodeSize').value = settings.barcodeSize || 100;
    document.getElementById('barcodeSizeLabel').textContent = (settings.barcodeSize || 100) + '%';
}

// إعادة ضبط الإعدادات
function resetAppSettings() {
    if (!confirm('هل أنت متأكد من إعادة ضبط جميع الإعدادات؟')) return;
    const data = getData();
    data.settings = {
        theme: 'default',
        fontSize: 'medium',
        soundAlerts: true,
        popupAlerts: true,
        alertSound: 'beep',
        printer: 'thermal',
        barcodeLibrary: 'barcode',
        barcodeSize: 100
    };
    saveLocal();
    loadSettings();
    showToast('✅ تم إعادة ضبط الإعدادات');
}

// تعديل دالة switchPage لتشغيل loadSettings عند فتح الإعدادات
// ابحث عن دالة switchPage وأضف هذا السطر داخلها:
// if(page === 'settings') loadSettings();

// ============================================
// تعديل دالة showToast لتشغيل التنبيهات الصوتية
// ============================================
const originalShowToast = showToast;
showToast = function(msg) {
    originalShowToast(msg);
    const settings = getSettings();
    if (settings.soundAlerts !== false) {
        playAlertSound(settings.alertSound || 'beep');
    }
};
