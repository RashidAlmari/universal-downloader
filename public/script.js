// ============================================
// أداة تحميل الوسائط - Main Script
// ============================================

// العناصر من الـ HTML
const urlInput = document.getElementById('url-input');
const analyzeBtn = document.getElementById('analyze-btn');
const spinner = document.getElementById('spinner');
const errorMessage = document.getElementById('error-message');
const previewSection = document.getElementById('preview-section');
const downloadBtn = document.getElementById('download-btn');
const closePreviewBtn = document.getElementById('close-preview');
const successMessage = document.getElementById('success-message');
const errorToast = document.getElementById('error-toast');
const progressWrapper = document.getElementById('progress-wrapper');
const progressFill = document.getElementById('progress-fill');
const progressText = document.getElementById('progress-text');
const historySection = document.getElementById('history-section');
const historyList = document.getElementById('history-list');
const clearHistoryBtn = document.getElementById('clear-history-btn');

// متغيرات عامة
let currentMediaData = null;

// تحديد API_URL بناءً على البيئة
const API_URL = (() => {
    if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
        return 'https://universal-downloader-backend.onrender.com/api';
    }
    return 'http://localhost:3000/api';
})();

console.log('🔗 API URL:', API_URL);

// ============================================
// 1. نظام إدارة السجل
// ============================================
class HistoryManager {
    constructor() {
        this.history = this.loadHistory();
    }

    loadHistory() {
        const user = authManager.getCurrentUser();
        if (!user) return [];
        
        const allHistory = JSON.parse(localStorage.getItem('downloadHistory') || '{}');
        return allHistory[user.id] || [];
    }

    saveHistory() {
        const user = authManager.getCurrentUser();
        if (!user) return;

        const allHistory = JSON.parse(localStorage.getItem('downloadHistory') || '{}');
        allHistory[user.id] = this.history;
        localStorage.setItem('downloadHistory', JSON.stringify(allHistory));
    }

    addDownload(mediaData) {
        const download = {
            id: Date.now().toString(),
            title: mediaData.title,
            platform: mediaData.platform,
            url: mediaData.url,
            thumbnail: mediaData.thumbnail,
            downloadTime: new Date().toLocaleString('ar-SA'),
            timestamp: Date.now()
        };

        this.history.unshift(download);
        this.saveHistory();
        this.displayHistory();
        return download;
    }

    clearHistory() {
        const user = authManager.getCurrentUser();
        if (!user) return;

        if (confirm('هل تريد حذف كل السجل؟')) {
            this.history = [];
            this.saveHistory();
            this.displayHistory();
        }
    }

    displayHistory() {
        const user = authManager.getCurrentUser();
        
        if (!user) {
            historySection.style.display = 'none';
            return;
        }

        if (this.history.length === 0) {
            historyList.innerHTML = '<p class="empty-message">لا توجد تحميلات بعد</p>';
            historySection.style.display = 'block';
            return;
        }

        historyList.innerHTML = this.history.map(item => `
            <div class="history-item">
                <div class="history-item-info">
                    <div class="history-item-title">📥 ${item.title}</div>
                    <div class="history-item-date">
                        🌐 ${item.platform} • ⏰ ${item.downloadTime}
                    </div>
                </div>
                <button class="history-item-delete" onclick="historyManager.deleteItem('${item.id}')">
                    حذف
                </button>
            </div>
        `).join('');

        historySection.style.display = 'block';
    }

    deleteItem(id) {
        this.history = this.history.filter(item => item.id !== id);
        this.saveHistory();
        this.displayHistory();
    }
}

const historyManager = new HistoryManager();

// ============================================
// 2. دالة تحليل الرابط من الخادم
// ============================================
async function analyzeLink(url) {
    try {
        const response = await fetch(`${API_URL}/analyze`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ url }),
            mode: 'cors'
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'فشل التحليل');
        }

        return data;

    } catch (error) {
        console.error('❌ خطأ في تحليل الرابط:', error);
        throw new Error(error.message || 'خطأ في الاتصال بالخادم');
    }
}

// ============================================
// 3. دالة تنسيق الأرقام
// ============================================
function formatNumber(num) {
    if (!num) return '0';
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

// ============================================
// 4. دالة عرض المعاينة
// ============================================
function displayPreview(mediaData) {
    currentMediaData = mediaData;

    // ملء البيانات
    document.getElementById('preview-image').src = mediaData.thumbnail || 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="320" height="180"%3E%3Crect fill="%23FF6B9D" width="320" height="180"/%3E%3Ctext x="50%" y="50%" font-size="24" fill="white" text-anchor="middle" dy=".3em"%3E🎬 معاينة%3C/text%3E%3C/svg%3E';
    document.getElementById('media-title').textContent = mediaData.title || 'بدون عنوان';
    document.getElementById('media-platform').textContent = mediaData.platform || 'Unknown';
    document.getElementById('media-size').textContent = mediaData.filesize || 'Unknown';
    document.getElementById('media-quality').textContent = mediaData.quality || 'Unknown';
    document.getElementById('media-duration').textContent = mediaData.duration || '0:00';
    document.getElementById('media-views').textContent = formatNumber(mediaData.viewCount) || '0';

    // إظهار قسم المعاينة
    previewSection.style.display = 'block';
    downloadBtn.disabled = false;

    // تمرير سلس للأسفل
    setTimeout(() => {
        previewSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
}

// ============================================
// 5. دالة محاكاة شريط التقدم
// ============================================
function simulateProgress() {
    return new Promise((resolve) => {
        progressWrapper.style.display = 'block';
        let progress = 0;

        const interval = setInterval(() => {
            progress += Math.random() * 15;
            if (progress > 95) progress = 95;

            progressFill.style.width = progress + '%';
            progressText.textContent = `جاري التحميل: ${Math.floor(progress)}%`;

            if (progress >= 95) {
                clearInterval(interval);
                resolve();
            }
        }, 200);
    });
}

// ============================================
// 6. دالة تحميل الملف من الخادم
// ============================================
async function downloadMedia(mediaData) {
    try {
        // محاكاة شريط التقدم
        await simulateProgress();

        // طلب التحميل من الخادم
        const response = await fetch(`${API_URL}/download`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                url: mediaData.url || currentMediaData.url,
            }),
            mode: 'cors'
        });

        const data = await response.json();

        if (!response.ok) {
            console.error('❌ خطأ في التحميل:', data);
            throw new Error(data.error || 'فشل التحميل');
        }

        // تحديث شريط التقدم
        progressFill.style.width = '100%';
        progressText.textContent = 'جاري التحميل: 100%';

        // انتظر قليلاً ثم ابدأ التحميل الفعلي
        setTimeout(() => {
            // إنشاء رابط التحميل
            const downloadLink = document.createElement('a');
            downloadLink.href = data.downloadUrl;
            downloadLink.download = data.filename || 'download';
            document.body.appendChild(downloadLink);
            downloadLink.click();
            document.body.removeChild(downloadLink);

            // إضافة إلى السجل
            historyManager.addDownload(mediaData);

            console.log('✅ تم التحميل:', data.filename);
        }, 500);

        return data;

    } catch (error) {
        throw new Error(error.message || 'خطأ في التحميل');
    }
}

// ============================================
// 7. دالة عرض رسالة الخطأ
// ============================================
function showError(message) {
    errorMessage.textContent = message;
    errorMessage.style.display = 'block';
    
    errorToast.textContent = '❌ ' + message;
    errorToast.style.display = 'block';
    
    setTimeout(() => {
        errorToast.style.display = 'none';
    }, 4000);
}

// ============================================
// 8. دالة إخفاء رسالة الخطأ
// ============================================
function hideError() {
    errorMessage.style.display = 'none';
}

// ============================================
// 9. دالة عرض رسالة النجاح
// ============================================
function showSuccess() {
    successMessage.style.display = 'block';
    
    setTimeout(() => {
        successMessage.style.display = 'none';
    }, 3000);
}

// ============================================
// 10. دالة إغلاق المعاينة
// ============================================
function closePreview() {
    previewSection.style.display = 'none';
    progressWrapper.style.display = 'none';
    progressFill.style.width = '0%';
    progressText.textContent = 'جاري التحميل: 0%';
    currentMediaData = null;
    urlInput.value = '';
    hideError();
}

// ============================================
// 11. دالة التحقق من الخادم
// ============================================
async function checkServer() {
    try {
        const response = await fetch(`${API_URL}/health`, {
            mode: 'cors'
        });
        console.log('✅ الخادم متاح');
        return response.ok;
    } catch (error) {
        console.warn('⚠️ تحذير: الخادم غير متاح', error.message);
        return false;
    }
}

// ============================================
// 12. Event Listeners
// ============================================

// زر التحليل
analyzeBtn.addEventListener('click', async () => {
    const url = urlInput.value.trim();

    if (!url) {
        showError('الرجاء إدخال رابط صحيح');
        return;
    }

    try {
        hideError();
        analyzeBtn.disabled = true;
        spinner.style.display = 'inline-block';

        // التحقق من الخادم
        const serverOk = await checkServer();
        if (!serverOk) {
            throw new Error('الخادم غير متاح. تأكد من تشغيل الخادم على Render');
        }

        const mediaData = await analyzeLink(url);
        displayPreview(mediaData);

    } catch (error) {
        showError(error.message);
    } finally {
        analyzeBtn.disabled = false;
        spinner.style.display = 'none';
    }
});

// زر التحميل
downloadBtn.addEventListener('click', async () => {
    if (!currentMediaData) return;

    try {
        downloadBtn.disabled = true;

        await downloadMedia(currentMediaData);

        // عرض رسالة النجاح
        showSuccess();

        // إغلاق المعاينة بعد ثانية
        setTimeout(() => {
            closePreview();
        }, 2000);

    } catch (error) {
        showError('خطأ: ' + error.message);
    } finally {
        downloadBtn.disabled = false;
    }
});

// زر إغلاق المعاينة
closePreviewBtn.addEventListener('click', closePreview);

// زر مسح السجل
if (clearHistoryBtn) {
    clearHistoryBtn.addEventListener('click', () => historyManager.clearHistory());
}

// الضغط على Enter في حقل الإدخال
urlInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        analyzeBtn.click();
    }
});

// التحقق من صحة الرابط أثناء الكتابة
urlInput.addEventListener('input', () => {
    if (errorMessage.style.display === 'block') {
        hideError();
    }
});

// ============================================
// 13. معلومات في Console
// ============================================
console.log('%c🎬 أداة تحميل الوسائط', 'font-size: 20px; font-weight: bold; color: #FF6B9D;');
console.log('%cالإصدار 2.0 - مع Supabase', 'font-size: 14px; color: #A8E6CF;');
console.log('%cالخادم: ' + API_URL, 'font-size: 12px; color: #FFD93D;');

// ============================================
// 14. فحص الخادم عند التحميل
// ============================================
window.addEventListener('load', async () => {
    const serverOk = await checkServer();
    
    if (!serverOk) {
        console.warn('⚠️ تحذير: الخادم غير متاح');
    } else {
        console.log('✅ الخادم متاح وجاهز');
    }

    // عرض السجل إذا كان المستخدم مسجل دخول
    historyManager.displayHistory();
});
