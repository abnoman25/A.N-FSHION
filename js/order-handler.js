// معالج الطلبات باستخدام Firebase Functions
// filepath: c:\Users\Use pc\Desktop\MyProjects\A.N FASHION\A.N FASHION Dv environment - firebase\js\order-handler.js


// التأكد من تحميل Firebase
function waitForFirebase() {
  return new Promise((resolve) => {
    if (window.firebase && window.firebase.functions) {
      resolve(window.firebase);
    } else {
      const checkFirebase = setInterval(() => {
        if (window.firebase && window.firebase.functions) {
          clearInterval(checkFirebase);
          resolve(window.firebase);
        }
      }, 100);
    }
  });
}

// دالة إرسال الطلب
async function submitOrderToFirebase(orderData) {
  try {
    console.log('Submitting order to Firebase:', orderData);
    
    // انتظار تحميل Firebase
    await waitForFirebase();
    
    // استدعاء Cloud Function
    const processOrder = firebase.functions().httpsCallable('processOrder');
    const result = await processOrder(orderData);
    
    console.log('Order submitted successfully:', result.data);
    return result.data;
    
  } catch (error) {
    console.error('Error submitting order:', error);
    throw error;
  }
}

// تحديث معالج نموذج الطلب
document.addEventListener('DOMContentLoaded', function() {
  const orderForm = document.getElementById('checkout-form');
  if (!orderForm) {
    console.log('Order form not found');
    return;
  }

  console.log('Order form found, setting up handler');

  // إزالة action و method القديمين
  orderForm.removeAttribute('action');
  orderForm.removeAttribute('method');
  
  orderForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    // التحقق من وجود منتجات في السلة
    const cart = getCartFromLocalStorage();
    if (!cart || cart.length === 0) {
      showAlert('Please add products to cart first.', 'warning');
      return;
    }

    // جمع بيانات النموذج
    const formData = new FormData(this);
    
    // التحقق من الحقول المطلوبة
    const name = formData.get('customer-name')?.trim();
    const phone = formData.get('customer-phone')?.trim();
    const address = formData.get('customer-address')?.trim();
    const city = formData.get('customer-city')?.trim();
    
    if (!name || !phone || !address || !city) {
      showAlert('Please fill in all required fields.', 'warning');
      return;
    }

    // تحضير بيانات الطلب
    const orderData = {
      customerInfo: {
        name,
        phone,
        email: formData.get('customer-email')?.trim() || '',
        address,
        city
      },
      items: cart.map(item => ({
        productId: item.id || item.productId,
        productName: item.name,
        size: item.size,
        color: item.color,
        quantity: item.quantity,
        price: item.price,
        total: item.price * item.quantity
      })),
      orderSummary: {
        subtotal: calculateSubtotal(cart),
        shipping: getShippingCost(),
        discount: getDiscountAmount(),
        total: calculateOrderTotal()
      },
      couponCode: getAppliedCouponCode(),
      orderDate: new Date().toISOString(),
      language: getCurrentLanguage()
    };

    console.log('Order data prepared:', orderData);

    try {
      // إظهار مؤشر التحميل
      const submitBtn = this.querySelector('button[type="submit"]');
      const originalText = submitBtn.textContent;
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>The request is being sent...';

      // إرسال الطلب
      const result = await submitOrderToFirebase(orderData);

      if (result.success) {
        // مسح السلة
        clearCart();
        
        // إظهار رسالة نجاح
        showAlert(result.message, 'success');
        
        // إعادة توجيه لصفحة الشكر مع معرف الطلب
        setTimeout(() => {
          const baseUrl = window.location.origin + window.location.pathname.replace('index.html', '');
          window.location.href = `${baseUrl}thanks.html?order=${result.orderId}`;
        }, 2000);
      }

    } catch (error) {
      console.error('Error submitting order:', error);
      
      let errorMessage = 'An error occurred while submitting the order. Please try again.';
      
      if (error.code === 'functions/invalid-argument') {
        errorMessage = 'Invalid order data. Please check the information entered.';
      } else if (error.code === 'functions/unauthenticated') {
        errorMessage = 'Authentication error. Please reload the page and try again.';
      }
      
      showAlert(errorMessage, 'danger');
      
    } finally {
      // استعادة الزر
      const submitBtn = this.querySelector('button[type="submit"]');
      submitBtn.disabled = false;
      submitBtn.textContent = originalText;
    }
  });
});

// الحصول على السلة من localStorage أو متغير عام
function getCartFromLocalStorage() {
  try {
    const cart = localStorage.getItem('cart');
    if (cart) {
      return JSON.parse(cart);
    }
    
    // العودة للمتغير العام إذا لم توجد في localStorage
    return window.cart || [];
  } catch (error) {
    console.error('Error getting cart from localStorage:', error);
    return window.cart || [];
  }
}

// حساب المجموع الفرعي
function calculateSubtotal(cart) {
  return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
}

// الحصول على تكلفة الشحن
function getShippingCost() {
  const shippingElement = document.getElementById('shipping-cost');
  if (shippingElement) {
    const shippingText = shippingElement.textContent.replace(/[^\d]/g, '');
    return parseInt(shippingText) || window.SHIPPING_COST || 120;
  }
  return window.SHIPPING_COST || 120;
}

// الحصول على قيمة الخصم
function getDiscountAmount() {
  const discountElement = document.getElementById('discount-price');
  if (discountElement && discountElement.parentElement.style.display !== 'none') {
    const discountText = discountElement.textContent.replace(/[^\d]/g, '');
    return parseInt(discountText) || 0;
  }
  return 0;
}

// الحصول على رمز الكوبون المطبق
function getAppliedCouponCode() {
  const couponInput = document.getElementById('coupon-code');
  const discountRow = document.getElementById('discount-row');
  
  if (couponInput && couponInput.value.trim() && 
      discountRow && discountRow.style.display !== 'none') {
    return couponInput.value.trim();
  }
  return null;
}

// حساب الإجمالي النهائي
function calculateOrderTotal() {
  const cart = getCartFromLocalStorage();
  if (!cart || cart.length === 0) return 0;
  
  const subtotal = calculateSubtotal(cart);
  const shipping = getShippingCost();
  const discount = getDiscountAmount();
  
  return Math.round(subtotal + shipping - discount);
}

// الحصول على اللغة الحالية
function getCurrentLanguage() {
  return localStorage.getItem('preferredLanguage') || 'en';
}

// مسح السلة
function clearCart() {
  try {
    localStorage.removeItem('cart');
    if (window.cart) {
      window.cart.length = 0;
    }
    if (typeof updateCartDisplay === 'function') {
      updateCartDisplay();
    }
  } catch (error) {
    console.error('Error clearing cart:', error);
  }
}

// دالة حساب إجمالي الطلب
function calculateOrderTotal() {
  const cart = getCartFromLocalStorage();
  if (!cart || cart.length === 0) return 0;
  
  const subtotal = calculateSubtotal(cart);
  const shipping = getShippingCost();
  const discount = getDiscountAmount();
  
  return Math.round(subtotal + shipping - discount);
}

// دالة حساب المجموع الفرعي
function calculateSubtotal(cart) {
  if (!cart || cart.length === 0) return 0;
  return cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
}

// دالة الحصول على تكلفة الشحن
function getShippingCost() {
  const shippingElement = document.getElementById('shipping-cost');
  if (shippingElement) {
    const shippingText = shippingElement.textContent.replace(/[^\d]/g, '');
    return parseInt(shippingText) || 120;
  }
  return window.SHIPPING_COST || 120;
}

// دالة الحصول على قيمة الخصم
function getDiscountAmount() {
  const discountElement = document.getElementById('discount-price');
  const discountRow = document.getElementById('discount-row');
  
  if (discountElement && discountRow && discountRow.style.display !== 'none') {
    const discountText = discountElement.textContent.replace(/[^\d]/g, '');
    return parseInt(discountText) || 0;
  }
  return 0;
}

// دالة الحصول على رمز الكوبون المطبق
function getAppliedCouponCode() {
  const couponInput = document.getElementById('coupon-code');
  const discountRow = document.getElementById('discount-row');
  
  if (couponInput && discountRow && discountRow.style.display !== 'none') {
    return couponInput.value.trim();
  }
  return null;
}

// دالة الحصول على اللغة الحالية
function getCurrentLanguage() {
  return localStorage.getItem('preferredLanguage') || 'en';
}

// دالة الحصول على السلة من localStorage
function getCartFromLocalStorage() {
  try {
    const cartData = localStorage.getItem('cart');
    if (cartData) {
      return JSON.parse(cartData);
    }
  } catch (error) {
    console.error('Error reading cart from localStorage:', error);
  }
  return [];
}

// دالة حساب الخصم (إذا كانت موجودة)
function calculateDiscount(subtotal, coupon) {
  if (!coupon) return 0;
  
  if (coupon.type === 'percentage') {
    return Math.round(subtotal * (coupon.value / 100));
  } else {
    return Math.min(coupon.value, subtotal);
  }
}

// دالة إظهار التنبيهات
function showAlert(message, type = 'info') {
  // إزالة التنبيهات السابقة
  const existingAlerts = document.querySelectorAll('.custom-alert');
  existingAlerts.forEach(alert => alert.remove());
  
  // إنشاء تنبيه جديد
  const alert = document.createElement('div');
  alert.className = `alert alert-${type} alert-dismissible fade show custom-alert position-fixed`;
  alert.style.cssText = `
    top: 20px;
    left: 50%;
    transform: translateX(-50%);
    z-index: 9999;
    min-width: 300px;
    text-align: center;
  `;
  
  alert.innerHTML = `
    ${message}
    <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
  `;
  
  document.body.appendChild(alert);
  
  // إزالة التنبيه تلقائياً بعد 5 ثوان
  setTimeout(() => {
    if (alert && alert.parentNode) {
      alert.remove();
    }
  }, 5000);
}

console.log('✅ Order handler loaded successfully');
