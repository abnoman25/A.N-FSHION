/* 
=== تحسينات A.N FASHION - للنشر في الإنتاج ===
هذا الملف يحتوي على تحسينات يمكن تطبيقها قبل النشر
*/

// 1. تحسين الأداء - تقليل console.log في الإنتاج
const isDevelopment = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

// دالة console محسّنة
const debugLog = isDevelopment ? console.log : () => {};
const debugError = console.error; // نبقي الأخطاء دائماً

// 2. تحسين تحميل الصور
function optimizeImages() {
    const images = document.querySelectorAll('img');
    images.forEach(img => {
        // إضافة lazy loading
        img.setAttribute('loading', 'lazy');
        
        // إضافة placeholder للصور
        img.addEventListener('error', function() {
            this.src = 'assets/images/logo.jpg'; // صورة افتراضية
        });
    });
}

// 3. تحسين الشبكة - إضافة retry logic
async function retryRequest(requestFn, maxRetries = 3) {
    for (let i = 0; i < maxRetries; i++) {
        try {
            return await requestFn();
        } catch (error) {
            if (i === maxRetries - 1) throw error;
            
            // انتظار قبل المحاولة التالية
            await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
        }
    }
}

// 4. تحسين تجربة المستخدم - loading states
function showLoadingState(element, loadingText = 'Loading...') {
    const originalText = element.innerHTML;
    element.innerHTML = `<span class="spinner-border spinner-border-sm me-2"></span>${loadingText}`;
    element.disabled = true;
    
    return () => {
        element.innerHTML = originalText;
        element.disabled = false;
    };
}

// 5. تحسين معالجة الأخطاء
function handleError(error, userMessage = 'An unexpected error occurred') {
    debugError('Error:', error);
    
    // إظهار رسالة مناسبة للمستخدم
    if (typeof showAlert === 'function') {
        if (error.code === 'network-error') {
            showAlert('Network issue. Please check your internet connection and try again.', 'warning');
        } else if (error.code === 'timeout') {
            showAlert('Connection timed out. Please try again.', 'warning');
        } else {
            showAlert(userMessage, 'danger');
        }
    }
}

// 6. تحسين السلة - حفظ تلقائي
function autoSaveCart() {
    if (typeof cart !== 'undefined' && typeof saveCartToStorage === 'function') {
        // حفظ السلة كل 30 ثانية
        setInterval(() => {
            if (cart.length > 0) {
                saveCartToStorage();
                debugLog('Cart auto-saved');
            }
        }, 30000);
    }
}

// 7. تحسين الأداء - debounce للبحث والتصفية
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// 8. تحسين الذاكرة - تنظيف event listeners
function setupCleanup() {
    const controllers = [];
    
    window.addEventListener('beforeunload', () => {
        controllers.forEach(controller => controller.abort());
    });
    
    return (controller) => {
        controllers.push(controller);
    };
}

// 9. تحسين SEO - structured data
function addStructuredData() {
    const structuredData = {
        "@context": "https://schema.org",
        "@type": "Store",
        "name": "A.N FASHION",
        "description": "متجر الأزياء الحديثة والتقليدية",
        "url": window.location.origin,
        "logo": window.location.origin + "/assets/images/logo.jpg",
        "contactPoint": {
            "@type": "ContactPoint",
            "telephone": "+8801730831676",
            "contactType": "customer service"
        }
    };
    
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify(structuredData);
    document.head.appendChild(script);
}

// 10. تحسين الأمان - تنظيف البيانات
function sanitizeInput(input) {
    if (typeof input !== 'string') return input;
    
    return input
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/javascript:/gi, '')
        .trim();
}

// تطبيق التحسينات عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', () => {
    debugLog('🚀 Applying A.N FASHION optimizations...');
    
    // تطبيق التحسينات
    optimizeImages();
    autoSaveCart();
    addStructuredData();
    
    debugLog('✅ Optimizations applied successfully');
});

// تصدير الدوال للاستخدام العام
window.ANFashionOptimizations = {
    debugLog,
    debugError,
    retryRequest,
    showLoadingState,
    handleError,
    debounce,
    setupCleanup,
    sanitizeInput
};
