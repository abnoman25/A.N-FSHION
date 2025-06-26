document.addEventListener("DOMContentLoaded", async function () {
  // Firebase initialization check
  const waitForFirebase = () => {
    return new Promise((resolve) => {
      const checkFirebase = () => {
        if (window.db && window.storage) {
          console.log('Firebase is ready in index.js');
          resolve({ db: window.db, storage: window.storage });
        } else {
          console.log('Waiting for Firebase initialization...');
          setTimeout(checkFirebase, 100);
        }
      };
      checkFirebase();
    });
  };
  // Load hero content from Firebase
  async function loadHeroContent() {
    try {
      console.log('Starting to load hero content...');
      
      // التأكد من وجود العناصر أولاً
      const heroElements = {
        offerBadge: document.querySelector('[data-i18n="hero.offerBadge"]'),
        heading: document.querySelector('[data-i18n="hero.heading"]'),
        description: document.querySelector('[data-i18n="hero.description"]'),
        viewCollectionButton: document.querySelector('[data-i18n="hero.viewCollectionButton"]'),
        carousel: document.querySelector('.carousel-inner')
      };
      
      console.log('Hero elements found:', {
        offerBadge: !!heroElements.offerBadge,
        heading: !!heroElements.heading,
        description: !!heroElements.description,
        button: !!heroElements.viewCollectionButton,
        carousel: !!heroElements.carousel
      });
      
      const { storage, db } = await waitForFirebase();
      
      // Load hero images from Storage and Firestore
      const heroCarouselInner = document.querySelector('.carousel-inner');
      if (heroCarouselInner) {
        // أولاً نحاول تحميل الصور من heroImages collection
        try {
          const imagesDocRef = db.doc('heroImages/order');
          const imagesDoc = await db.getDoc(imagesDocRef);
          
          if (imagesDoc.exists()) {
            const imagesData = imagesDoc.data();
            console.log('Hero images data from Firestore:', imagesData);
            
            for (let i = 1; i <= 3; i++) {
              const imageData = imagesData[`image${i}`];
              if (imageData?.url) {
                const carouselItem = heroCarouselInner.children[i - 1];
                if (carouselItem) {
                  const img = carouselItem.querySelector('img');
                  if (img) {
                    img.src = imageData.url;
                    console.log(`Hero image ${i} loaded from Firestore successfully`);
                  }
                }
              }
            }
          } else {
            console.log('No hero images document found in heroImages collection, trying Storage directly');
            
            // إذا لم توجد بيانات في Firestore، نحاول التحميل من Storage مباشرة
            for (let i = 1; i <= 3; i++) {
              try {
                const heroRef = storage.ref(`hero/hero${i}.jpg`);
                const imageUrl = await storage.getDownloadURL(heroRef);
                const carouselItem = heroCarouselInner.children[i - 1];
                if (carouselItem) {
                  const img = carouselItem.querySelector('img');
                  if (img) {
                    img.src = imageUrl;
                    console.log(`Hero image ${i} loaded from Storage successfully`);
                  }
                }
              } catch (error) {
                console.warn(`Failed to load hero${i} image from Storage:`, error.message);
              }
            }
          }
        } catch (error) {
          console.error('Error loading hero images:', error);
        }
      }

      // Load hero text content from Firestore
      try {
        const heroDocRef = db.doc('content/hero');
        const heroDoc = await db.getDoc(heroDocRef);
        
        if (heroDoc.exists()) {
          const heroData = heroDoc.data();
          console.log('Hero text data loaded:', heroData);
          
          // استخدام اللغة الحالية أو الافتراضية
          const currentLang = window.currentLang || localStorage.getItem('lang') || 'en';
          const content = heroData[currentLang] || heroData.en; // Fallback to English
          
          if (content) {
            // Update hero text content only if elements exist
            if (heroElements.offerBadge && content.offerBadge) {
              heroElements.offerBadge.textContent = content.offerBadge;
              console.log('Updated offer badge:', content.offerBadge);
            }
            if (heroElements.heading && content.heading) {
              heroElements.heading.textContent = content.heading;
              console.log('Updated heading:', content.heading);
            }
            if (heroElements.description && content.description) {
              heroElements.description.textContent = content.description;
              console.log('Updated description:', content.description);
            }
            if (heroElements.viewCollectionButton && content.viewCollectionButton) {
              heroElements.viewCollectionButton.textContent = content.viewCollectionButton;
              console.log('Updated button text:', content.viewCollectionButton);
            }

            console.log(`Hero content loaded and applied for language ${currentLang}`);
          } else {
            console.log('No content found for language:', currentLang);
          }
        } else {
          console.log('Hero document does not exist in Firestore');
        }
      } catch (error) {
        console.error('Error loading hero text content:', error);
      }
      
    } catch (error) {
      console.error('Error loading hero content:', error);
    }
  }

  // Load hero content on page load
  loadHeroContent();

  // إعادة تحميل محتوى الهيرو كل 3 ثوانٍ للتأكد من التحميل
  setTimeout(() => {
    console.log('Retrying hero content load after 3 seconds...');
    loadHeroContent();
  }, 3000);

  // اختبار مباشر للـ Firebase
  setTimeout(async () => {
    console.log('=== FIREBASE DIRECT TEST ===');
    try {
      const { db } = await waitForFirebase();
      console.log('Firebase ready for test');
      
      // اختبار مباشر للوصول للوثيقة
      const heroDocRef = db.doc('content/hero');
      console.log('Document reference created:', heroDocRef);
      
      const heroDoc = await db.getDoc(heroDocRef);
      console.log('Document fetched. Exists:', heroDoc.exists());
      
      if (heroDoc.exists()) {
        const data = heroDoc.data();
        console.log('Document data:', data);
      }
      
      // اختبار الصور
      const imagesDocRef = db.doc('heroImages/order');
      const imagesDoc = await db.getDoc(imagesDocRef);
      console.log('Images document exists:', imagesDoc.exists());
      
      if (imagesDoc.exists()) {
        const imagesData = imagesDoc.data();
        console.log('Images data:', imagesData);
      }
      
    } catch (error) {
      console.error('Direct Firebase test failed:', error);
    }
    console.log('=== END FIREBASE TEST ===');
  }, 5000);
  
  document.querySelectorAll(".card-body").forEach(card => {
    const seeMore = card.querySelector(".see-more-link");
    const seeLess = card.querySelector(".see-less-link");
    const popup = card.querySelector(".full-description-popup");

    seeMore?.addEventListener("click", (e) => {
      e.preventDefault();
      // إضافة الصف show للحصول على التأثير الحركي
      popup.classList.add("show");
      seeMore.style.opacity = "0";
    });

    seeLess?.addEventListener("click", (e) => {
      e.preventDefault();
      // إزالة الصف show للحصول على التأثير الحركي
      popup.classList.remove("show");
      setTimeout(() => {
        seeMore.style.opacity = "1";
      }, 300);
    });

    // إغلاق النافذة عند الضغط خارجها
    document.addEventListener("click", (e) => {
      if (popup && !popup.contains(e.target) && !seeMore.contains(e.target)) {
        popup.classList.remove("show");
        setTimeout(() => {
          seeMore.style.opacity = "1";
        }, 300);
      }
    });
  });
  const cart = [];
  // متغير لتخزين تكلفة الشحن (سيتم تحديثها من Firebase)
  let SHIPPING_COST = 120; // القيمة الافتراضية
  let appliedCoupon = null;

  
  // تهيئة خيارات الألوان والمقاسات
  function initializeProductOptions() {
    // تهيئة خيارات المقاسات
    document.querySelectorAll('.size-select').forEach(container => {
      // إزالة الclass selected من جميع الأزرار في البداية
      container.querySelectorAll('.size-btn').forEach(btn => btn.classList.remove('selected'));
      
      container.querySelectorAll('.size-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          // إزالة التحديد من جميع الأزرار في نفس المجموعة
          container.querySelectorAll('.size-btn').forEach(b => b.classList.remove('selected'));
          // تحديد الزر المختار
          btn.classList.add('selected');
        });
      });
    });

    // تهيئة خيارات الألوان
    document.querySelectorAll('.color-select').forEach(container => {
      // إزالة الclass selected من جميع الأزرار في البداية
      container.querySelectorAll('.color-swatch').forEach(swatch => swatch.classList.remove('selected'));
      
      container.querySelectorAll('.color-swatch').forEach(swatch => {
        swatch.addEventListener('click', () => {
          // إزالة التحديد من جميع الألوان في نفس المجموعة
          container.querySelectorAll('.color-swatch').forEach(s => s.classList.remove('selected'));
          // تحديد اللون المختار
          swatch.classList.add('selected');
        });
      });
    });
  }
  // استدعاء الدالة عند تحميل الصفحة
  initializeProductOptions();

  // تحديث وظيفة إضافة المنتج للسلة
  function addToCart(btn, isBuyNow = false) {
    const card = btn.closest(".card");
    const productId = card.dataset.productId;    const title = card.querySelector(".card-title").textContent;
    const price = parseFloat(card.querySelector(".product-price").dataset.price);
    const sale = parseFloat(card.querySelector(".product-price").dataset.sale);
    // تحديث للحصول على القيم المختارة من الأزرار
    const sizeBtn = card.querySelector(".size-btn.selected");
    const colorSwatch = card.querySelector(".color-swatch.selected");
    const size = sizeBtn ? sizeBtn.textContent : null;
    const color = colorSwatch ? colorSwatch.getAttribute('title') : null;
    const qty = parseInt(card.querySelector(".qty-input").value) || 1;

    if (!size || !color) {
      showAlert("Please select size and color first");
      return;
    }

    const existingProduct = cart.find(
      (item) => item.productId === productId && item.size === size && item.color === color
    );

    if (existingProduct) {
      existingProduct.qty += qty;
    } else {
      cart.push({ productId, title, price, sale, size, color, qty });
    }

    updateCartDisplay();
    
    if (isBuyNow) {
      document.getElementById("order-form").scrollIntoView({ 
        behavior: "smooth",
        block: "start"
      });
    }
    
    showAlert(`✅ Added ${qty} × ${title} to cart`);
  }
  // تحديث معالجات الأحداث للأزرار
  document.querySelectorAll(".buy-now-btn").forEach((btn) => {
    btn.addEventListener("click", () => addToCart(btn, true));
  });

  document.querySelectorAll(".add-to-cart-btn").forEach((btn) => {
    btn.addEventListener("click", () => addToCart(btn, false));
  });

  // تحديث عرض السلة
  function updateCartDisplay() {
    const container = document.getElementById("cart-items");
    container.innerHTML = "";
    let subtotal = 0;

    // تحضير النصوص حسب اللغة الحالية
    const texts = {
      en: {
        product: "Product",
        size: "Size",
        color: "Color",
        quantity: "Quantity",
        price: "Price",
        subtotal: "Subtotal",
        shipping: "Shipping",
        total: "Total"
      },
      bn: {
        product: "পণ্য",
        size: "সাইজ",
        color: "রং",
        quantity: "পরিমাণ",
        price: "মূল্য",
        subtotal: "উপমোট",
        shipping: "শিপিং",
        total: "মোট"
      }
    };

    const t = texts[window.currentLang || 'en'];

    cart.forEach((item, index) => {
      const itemTotal = item.sale * item.qty;
      subtotal += itemTotal;

      const div = document.createElement("div");
      div.className = "border rounded bg-white shadow-sm p-3 mb-3";

      div.innerHTML = `
      <div class="row align-items-center gy-2">
        <div class="col-12 col-md-8">
          <strong class="d-block">${item.title}</strong>
          <small class="text-muted d-block">${t.size}: ${item.size}, ${t.color}: ${item.color}</small>
          <small class="text-muted d-block">৳${item.sale} × ${item.qty} = <strong>৳${itemTotal}</strong></small>
        </div>
        <div class="col-12 col-md-4 text-md-end">
          <div class="btn-group btn-group-sm mt-2 mt-md-0" role="group">
            <button class="btn btn-outline-secondary" onclick="changeQty(${index}, -1)">-</button>
            <button class="btn btn-outline-secondary" onclick="changeQty(${index}, 1)">+</button>
            <button class="btn btn-danger" onclick="removeFromCart(${index})">
              <i class="bi bi-trash"></i>
            </button>
          </div>
        </div>
      </div>
    `;

      container.appendChild(div);
    });    // حساب وعرض الخصم إذا وجد كوبون
    let discount = 0;
    if (appliedCoupon) {
      discount = calculateDiscount(subtotal, appliedCoupon);
      console.log('قيمة الخصم المحسوبة:', discount, 'من الكوبون:', appliedCoupon);
      
      // التأكد من أن الخصم رقم صحيح
      if (!isNaN(discount) && discount > 0) {
        document.getElementById('discount-price').textContent = `-৳${Math.round(discount)}`;
        document.getElementById('discount-row').style.display = 'flex';
      } else {
        console.warn('قيمة الخصم غير صالحة:', discount);
        discount = 0;
        document.getElementById('discount-row').style.display = 'none';
      }
    } else {
      document.getElementById('discount-row').style.display = 'none';
    }

    // إضافة تكلفة الشحن وحساب المجموع النهائي
    const shippingCost = window.SHIPPING_COST || SHIPPING_COST || 120;
    const total = Math.round(subtotal + shippingCost - discount);
    
    // التأكد من أن جميع القيم أرقام صحيحة
    const displaySubtotal = isNaN(subtotal) ? 0 : Math.round(subtotal);
    const displayShipping = isNaN(shippingCost) ? 120 : Math.round(shippingCost);
    const displayTotal = isNaN(total) ? displaySubtotal + displayShipping : Math.round(total);
    
    console.log('تفاصيل الحساب:', {
      subtotal: displaySubtotal,
      shipping: displayShipping,
      discount: discount,
      total: displayTotal
    });
    
    document.getElementById('subtotal-price').innerText = `৳${displaySubtotal}`;
    document.getElementById('shipping-cost').innerText = `৳${displayShipping}`;
    document.getElementById('total-price').innerText = `৳${displayTotal}`;    // تحديث حقول النموذج
    const productInput = document.getElementById('product-input');
    if (productInput) {
      const orderDetails = cart.map(item => 
        `${item.title} (${item.size}, ${item.color}) × ${item.qty}`
      ).join('\n');
      productInput.value = orderDetails;
    }

    const totalPriceInput = document.getElementById('total-price-input');
    if (totalPriceInput) {
      totalPriceInput.value = displayTotal;
    }

    // تحديث زر السلة العائم
    const floatingCartBtn = document.getElementById("floating-cart-btn");
    const cartCountBadge = document.getElementById("cart-count-badge");
    const orderFormSection = document.getElementById("order-form");

    // تحديث عدد المنتجات
    const totalQty = cart.reduce((sum, item) => sum + item.qty, 0);
    cartCountBadge.textContent = totalQty;

    // إظهار أو إخفاء زر السلة حسب العرض
    if (window.innerWidth <= 768) {
      floatingCartBtn.style.display = totalQty > 0 ? "block" : "none";
    }

    floatingCartBtn.addEventListener("click", function () {
      orderFormSection.scrollIntoView({ behavior: "smooth" });
    });

    // إعداد ملاحظة ظهور قسم الطلبات
    const observerOptions = {
      root: null,
      threshold: 0.2
    };

    const orderObserver = new IntersectionObserver(function (entries) {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          floatingCartBtn.style.display = "none";
        } else {
          if (cart.length > 0 && window.innerWidth <= 768) {
            floatingCartBtn.style.display = "block";
          }
        }
      });
    }, observerOptions);

    if (orderFormSection) {
      orderObserver.observe(orderFormSection);
    }
  }


  // ==================== أكواد نموذج الطلب ====================

  // إضافة التحقق من صحة النموذج باستخدام Bootstrap
  (function () {
    'use strict'

    // Fetch all the forms we want to apply custom Bootstrap validation styles to
    var forms = document.querySelectorAll('.needs-validation')

    // Loop over them and prevent submission
    Array.prototype.slice.call(forms)
      .forEach(function (form) {
        form.addEventListener('submit', function (event) {
          if (!form.checkValidity()) {
            event.preventDefault()
            event.stopPropagation()
          }

          form.classList.add('was-validated')
        }, false)
      })
  })();
  // -------------- أكواد كوبون الخصم --------------
  // متغير لتخزين الكوبون المطبق حالياً
  // دالة حساب قيمة الخصم
  
  function calculateDiscount(subtotal, coupon) {
    if (!coupon || !coupon.type || subtotal <= 0) {
      console.log('The coupon data is invalid or the order value is zero.');
      return 0;
    }
    
    let discount = 0;
    
    try {
      if (coupon.type === 'percentage') {
        // التأكد من أن القيمة رقم
        const percentage = parseFloat(coupon.value) || 0;
        discount = (subtotal * percentage) / 100;
        console.log(`حساب خصم نسبة: ${percentage}% على ${subtotal} = ${discount}`);
      } else {
        // خصم قيمة ثابتة
        const fixedValue = parseFloat(coupon.value) || 0;
        discount = Math.min(fixedValue, subtotal); // لا يمكن أن يتجاوز الخصم قيمة الطلب
        console.log(`حساب خصم ثابت: ${fixedValue} على ${subtotal} = ${discount}`);
      }
    } catch (error) {
      console.error('خطأ في حساب قيمة الخصم:', error);
      discount = 0;
    }
      // تقريب الخصم إلى رقمين عشريين
    return Math.round(discount);
  }
  
  // معالج زر تطبيق الكوبون
  document.getElementById('apply-coupon')?.addEventListener('click', async function() {
    const couponInput = document.getElementById('coupon-code');
    const couponMessage = document.getElementById('coupon-message');
    const discountRow = document.getElementById('discount-row');
    const discountPrice = document.getElementById('discount-price');
    const code = couponInput.value.trim();
    
    // عرض حالة التحميل
    couponMessage.className = 'form-text text-info';
    couponMessage.textContent = 'Coupon is being verified...';

    if (!code) {
      couponMessage.className = 'form-text text-danger';
      couponMessage.textContent = 'Please enter a coupon code.';
      return;
    }

    try {
      // انتظار نتيجة التحقق من الكوبون
      const result = await validateCoupon(code);
      console.log('Coupon verification result:', result);
      
      if (!result.valid) {
        couponMessage.className = 'form-text text-danger';
        couponMessage.textContent = result.message;
        appliedCoupon = null;
        discountRow.style.display = 'none';
        updateCartDisplay();
        return;
      }

      // تطبيق الكوبون الصحيح
      appliedCoupon = result.coupon;
      couponMessage.className = 'form-text text-success';
      couponMessage.textContent = 'Coupon applied successfully!';
      
      // عرض صف الخصم
      discountRow.style.display = 'flex';
      
      // تحديث عرض السلة
      updateCartDisplay();
    } catch (error) {
      console.error('Error applying coupon:', error);
      couponMessage.className = 'form-text text-danger';
      couponMessage.textContent = 'Error verifying coupon';
    }
  });

  // تغيير كمية المنتج في السلة
  window.changeQty = function (index, delta) {
    cart[index].qty += delta;
    if (cart[index].qty <= 0) {
      cart.splice(index, 1);
    }
    updateCartDisplay();
  };

  // إزالة المنتج من السلة
  window.removeFromCart = function (index) {
    cart.splice(index, 1);
    updateCartDisplay();
  };

  // عرض إشعار مؤقت للمستخدم
  function showAlert(message) {
    const alert = document.createElement("div");
    alert.className = "alert alert-success position-fixed top-0 start-50 translate-middle-x mt-3";
    alert.style.zIndex = "9999";
    alert.innerHTML = message;
    document.body.appendChild(alert);
    setTimeout(() => alert.remove(), 2500);
  }

  // منع إرسال النموذج إذا كانت السلة فارغة
  document.getElementById("order-form").addEventListener("submit", function (e) {
    if (cart.length === 0) {
      e.preventDefault();

      // ❗ إشعار: لا يمكن إرسال الطلب بدون منتجات
      const alert = document.createElement("div");
      alert.className = "alert alert-danger position-fixed top-0 start-50 translate-middle-x mt-3 shadow";
      alert.style.zIndex = "9999";
      alert.innerHTML = "🛒 Please add at least one product before submitting the order.";
      document.body.appendChild(alert);
      setTimeout(() => alert.remove(), 3000);
      return;
    }

    // ✅ تجميع كل تفاصيل الطلب
    const orderSummary = cart.map(item =>
      `Product ID: ${item.productId}\n` +
      `Product: ${item.title}\n` +
      `Size: ${item.size}\n` +
      `Color: ${item.color}\n` +
      `Quantity: ${item.qty}\n` +
      `Price: ৳${item.sale}\n` +
      `Subtotal: ৳${item.sale * item.qty}`
    ).join("\n\n---\n\n");

    // ✅ تحديث الحقول المخفية قبل الإرسال
    const productInput = document.getElementById("product-input");
    const totalPriceInput = document.getElementById("total-price-input");

    if (productInput) {
      productInput.value = orderSummary + "\n\n" +
        "Shipping: ৳" + SHIPPING_COST + "\n" +
        "Total: " + document.getElementById("total-price").textContent;
    }

    if (totalPriceInput) {
      totalPriceInput.value = document.getElementById("total-price").textContent;
    }

    // ✅ عرض إشعار مؤقت للمستخدم (لكن بدون منع الإرسال)
    const alert = document.createElement("div");
    alert.className = "alert alert-success position-fixed top-0 start-50 translate-middle-x mt-3 shadow";
    alert.style.zIndex = "9999";
    alert.innerHTML = "✅ Your request has been sent.";
    document.body.appendChild(alert);
    setTimeout(() => alert.remove(), 3000);

    // ❌ لا تفرغ السلة ولا تعيد ضبط النموذج هنا
    // ✅ خله يتوجه تلقائيًا إلى صفحة الشكر عبر Formsubmit
  });

  // التحقق من وجود قفز في الرابط
  if (window.location.hash) {
    const productId = window.location.hash;
    const targetProduct = document.querySelector(productId);
    
    if (targetProduct) {
      // انتظر قليلاً للتأكد من تحميل الصفحة بالكامل
      setTimeout(() => {
        targetProduct.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'center'
        });
        
        // إضافة تأثير لتمييز المنتج المحدد
        targetProduct.classList.add('highlight');
        setTimeout(() => {
          targetProduct.classList.remove('highlight');
        }, 2000);
      }, 500);
    }
  }
  // -------------------- ربط قسم المنتجات ب Firebase --------------------  // دالة تحميل بيانات المنتجات من فايربيس
  async function loadProductsFromFirebase() {
    try {
      console.log('Start loading product data from Firebase...');
      const { db } = await waitForFirebase();
      
      // تخزين وقت بدء التحميل للقياس
      const startTime = Date.now();
      
      // معرفات المنتجات التي نريد تحميلها
      const productIds = ['PNJ001', 'PNJ002', 'PNJ003', 'PNJ004', 'PNJ005', 'PNJ006'];
      console.log(`Loading ${productIds.length} products...`);

      // محاولة جلب كل المنتجات
      const productPromises = productIds.map(async (productId) => {
        try {
          console.log(`Loading data for product ${productId}...`);
          const productRef = db.doc(`products/${productId}`);
          const productDoc = await db.getDoc(productRef);
          
          if (productDoc.exists()) {
            const productData = productDoc.data();
            console.log(`Product data uploaded successfully for ${productId}:`, productData);

            // التأكد من وجود صفوف للمنتج
            productData.images = productData.images || [];
            if (Array.isArray(productData.images) && productData.images.length > 0) {
              console.log(`Product ${productId} has ${productData.images.length} images:`, productData.images);
            } else {
              console.warn(`Product ${productId} has no images!`);
            }
            
            return { id: productId, data: productData };
          } else {
            console.warn(`No data found for product ${productId} in Firestore`);
            return null;
          }
        } catch (error) {
          console.error(`Error loading product ${productId}:`, error);
          return null;
        }
      });
      
      // انتظار حل جميع الوعود
      const loadedProducts = (await Promise.all(productPromises)).filter(product => product !== null);

      console.log(`Loaded ${loadedProducts.length} products out of ${productIds.length} in ${Date.now() - startTime}ms`);
      // تحديث واجهة المنتجات
      loadedProducts.forEach(product => {
        updateProductUI(product.id, product.data);
      });
      
      // تحديث النصوص حسب اللغة الحالية إذا كانت متاحة
      if (window.updateProductsContent && window.currentLang) {
        console.log('Updating product texts for current language:', window.currentLang);
        setTimeout(() => {
          window.updateProductsContent(window.currentLang);
        }, 500);
      }
      
    } catch (error) {
      console.error('Error loading products:', error);
    }
  }// دالة تحديث واجهة المنتج بالبيانات المستلمة من فايربيس
  function updateProductUI(productId, productData) {
    const productContainer = document.getElementById(`product-${productId}`);
    if (!productContainer) {
      console.log(`Product container not found ${productId}`);
      return;
    }
    
    // استخدام اللغة الحالية أو الافتراضية
    const lang = window.currentLang || localStorage.getItem('lang') || 'en';
    
    // إنشاء بطاقة المنتج إذا لم تكن موجودة
    if (!productContainer.querySelector('.card')) {
      productContainer.innerHTML = createProductCardHtml(productId, productData, lang);
      
      // إضافة معالجات الأحداث للبطاقة الجديدة
      const card = productContainer.querySelector('.card');
      const seeMoreLink = card.querySelector('.see-more-link');
      const seeLessLink = card.querySelector('.see-less-link');
      const popup = card.querySelector('.full-description-popup');
      
      if (seeMoreLink) {
        seeMoreLink.addEventListener('click', (e) => {
          e.preventDefault();
          popup.classList.add("show");
          seeMoreLink.style.opacity = "0";
        });
      }
      
      if (seeLessLink) {
        seeLessLink.addEventListener('click', (e) => {
          e.preventDefault();
          popup.classList.remove("show");
          setTimeout(() => {
            seeMoreLink.style.opacity = "1";
          }, 300);
        });
      }
      
      // إضافة المزيد من معالجات الأحداث حسب الحاجة
      const addToCartBtn = card.querySelector('.add-to-cart-btn');
      const buyNowBtn = card.querySelector('.buy-now-btn');
      
      if (addToCartBtn) {
        addToCartBtn.addEventListener('click', () => addToCart(addToCartBtn, false));
      }
      
      if (buyNowBtn) {
        buyNowBtn.addEventListener('click', () => addToCart(buyNowBtn, true));
      }
      
      // تهيئة أزرار المقاسات
      const sizeButtons = card.querySelectorAll('.size-btn');
      sizeButtons.forEach(btn => {
        btn.addEventListener('click', () => {
          // إزالة الاختيار من جميع الأزرار
          sizeButtons.forEach(b => b.classList.remove('selected'));
          // إضافة الاختيار للزر المضغوط
          btn.classList.add('selected');
        });
      });
      
      // تهيئة أزرار الألوان
      const colorButtons = card.querySelectorAll('.color-swatch');
      colorButtons.forEach(btn => {
        btn.addEventListener('click', () => {
          // إزالة الاختيار من جميع الأزرار
          colorButtons.forEach(b => b.classList.remove('selected'));
          // إضافة الاختيار للزر المضغوط
          btn.classList.add('selected');
        });
      });
      
      // تهيئة أزرار الكمية
      const minusBtn = card.querySelector('.minus-btn');
      const plusBtn = card.querySelector('.plus-btn');
      const qtyInput = card.querySelector('.qty-input');
      
      if (minusBtn && plusBtn && qtyInput) {
        minusBtn.addEventListener('click', () => {
          if (qtyInput.value > 1) {
            qtyInput.value = parseInt(qtyInput.value) - 1;
          }
        });
        
        plusBtn.addEventListener('click', () => {
          if (qtyInput.value < 10) {
            qtyInput.value = parseInt(qtyInput.value) + 1;
          }
        });
      }
    } else {
      // تحديث البطاقة الموجودة بالبيانات الجديدة
      updateExistingProductCard(productContainer, productData, lang);
    }
    
    // تحديث صور المنتج
    updateProductImages(productId, productData.images || []);
  }
  // دالة إنشاء HTML لبطاقة المنتج
  function createProductCardHtml(productId, productData, lang) {
    // استخراج بيانات المنتج بالبديل الافتراضي إذا لم تكن موجودة
    const name = productData.name?.[lang] || productData.name?.en || 'Product Name';
    const shortDesc = productData.shortDescription?.[lang] || productData.shortDescription?.en || '';
    const fullDesc = productData.fullDescription?.[lang] || productData.fullDescription?.en || '';
    const regularPrice = productData.prices?.regular || 0;
    const salePrice = productData.prices?.sale || regularPrice;
    
    // إنشاء HTML لعرض السعر (عادي أو تخفيض)
    const priceHtml = salePrice < regularPrice ? 
      `<p class="text-muted mb-3 product-price" data-price="${regularPrice}" data-sale="${salePrice}">
        <del>৳${regularPrice}</del> <span class="text-danger fw-bold">৳${salePrice}</span>
      </p>` :
      `<p class="text-muted mb-3 product-price" data-price="${regularPrice}" data-sale="${regularPrice}">
        <span class="fw-bold">৳${regularPrice}</span>
      </p>`;
    
    // طباعة معلومات المقاسات والألوان للتصحيح
    console.log(`Product ${productId} - Sizes:`, productData.sizes);
    console.log(`Product ${productId} - Colors:`, productData.colors);
    
    // إنشاء بطاقة المنتج كاملة
    return `
      <div class="card product-card h-100" data-product-id="${productId}">
        <!-- كاروسل صور المنتج -->
        <div id="carousel${productId}" class="carousel slide" data-bs-ride="carousel" data-bs-interval="2000">
          <div class="carousel-inner">
            <!-- الصور ستضاف ديناميكيًا -->
          </div>
          <div class="carousel-indicators">
            <!-- المؤشرات ستضاف ديناميكيًا -->
          </div>
        </div>
        
        <!-- معلومات المنتج -->
        <div class="card-body d-flex flex-column">
          <h5 class="card-title">${name}</h5>
          
          <!-- وصف المنتج والوصف المختصر -->
          <div class="description-container">
            <p class="product-description">${shortDesc}</p>
            <a href="#" class="see-more-link">see more</a>
            <div class="full-description-popup">
              <p class="full-text">${fullDesc}</p>
              <a href="#" class="see-less-link">Show less</a>
            </div>
          </div>
          
          <!-- السعر -->
          ${priceHtml}
          
          <!-- المقاسات والألوان في صف واحد -->
          <div class="row mb-2">
            <!-- المقاسات -->
            <div class="col">
              <label class="form-label" data-i18n="products.size">Size:</label>
              <div class="size-select">
                ${createSizeButtons(productData.sizes || [])}
              </div>
            </div>
            
            <!-- الألوان -->
            <div class="col">
              <label class="form-label" data-i18n="products.color">Color:</label>
              <div class="color-select">
                ${createColorButtons(productData.colors || [])}
              </div>
            </div>
          </div>
          
          <!-- الكمية -->
          <div class="mb-3">
            <label class="form-label" data-i18n="products.quantity">Quantity:</label>
            <div class="input-group input-group-sm" style="max-width: 150px">
              <button class="btn btn-outline-secondary qty-btn minus-btn" type="button">-</button>
              <input type="number" class="form-control text-center qty-input" value="1" min="1" max="10">
              <button class="btn btn-outline-secondary qty-btn plus-btn" type="button">+</button>
            </div>
          </div>
          
          <!-- أزرار الإضافة إلى السلة والشراء -->
          <div class="d-flex gap-2 mt-auto">
            <button class="btn btn-warning flex-grow-1 add-to-cart-btn">
              <i class="bi bi-cart-plus"></i> <span data-i18n="products.addToCartButton">Add to Cart</span>
            </button>
            <button class="btn btn-warning flex-grow-1 buy-now-btn">
              <i class="bi bi-lightning-fill"></i> <span data-i18n="products.buyNowButton">Buy Now</span>
            </button>
          </div>
        </div>
      </div>
    `;
  }
  // دالة تحديث بطاقة منتج موجودة
  function updateExistingProductCard(container, productData, lang) {
    const card = container.querySelector('.card');
    if (!card) return;
    
    console.log(`Update an existing product card:`, productData);
    
    // تحديث عنوان المنتج
    const titleElement = card.querySelector('.card-title');
    if (titleElement && productData.name) {
      titleElement.textContent = productData.name[lang] || productData.name.en;
    }
    
    // تحديث الوصف المختصر
    const descriptionElement = card.querySelector('.product-description');
    if (descriptionElement && productData.shortDescription) {
      descriptionElement.textContent = productData.shortDescription[lang] || productData.shortDescription.en;
    }
    
    // تحديث الوصف الكامل
    const fullDescriptionElement = card.querySelector('.full-text');
    if (fullDescriptionElement && productData.fullDescription) {
      fullDescriptionElement.textContent = productData.fullDescription[lang] || productData.fullDescription.en;
    }
    
    // تحديث الأسعار
    const priceElement = card.querySelector('.product-price');
    if (priceElement && productData.prices) {
      if (productData.prices.sale && productData.prices.sale < productData.prices.regular) {
        priceElement.innerHTML = `<del>৳${productData.prices.regular}</del> <span class="text-danger fw-bold">৳${productData.prices.sale}</span>`;
        priceElement.dataset.price = productData.prices.regular;
        priceElement.dataset.sale = productData.prices.sale;
      } else {
        priceElement.innerHTML = `<span class="fw-bold">৳${productData.prices.regular}</span>`;
        priceElement.dataset.price = productData.prices.regular;
        priceElement.dataset.sale = productData.prices.regular;
      }
    }
    
    // تحديث المقاسات
    const sizeSelect = card.querySelector('.size-select');
    if (sizeSelect && productData.sizes && productData.sizes.length > 0) {
      sizeSelect.innerHTML = createSizeButtons(productData.sizes);
      
      // إعادة إضافة معالجات الأحداث لأزرار المقاسات
      const sizeButtons = sizeSelect.querySelectorAll('.size-btn');
      sizeButtons.forEach(btn => {
        btn.addEventListener('click', () => {
          sizeButtons.forEach(b => b.classList.remove('selected'));
          btn.classList.add('selected');
        });
      });
    }
    
    // تحديث الألوان
    const colorSelect = card.querySelector('.color-select');
    if (colorSelect && productData.colors && productData.colors.length > 0) {
      colorSelect.innerHTML = createColorButtons(productData.colors);
      
      // إعادة إضافة معالجات الأحداث لأزرار الألوان
      const colorButtons = colorSelect.querySelectorAll('.color-swatch');
      colorButtons.forEach(btn => {
        btn.addEventListener('click', () => {
          colorButtons.forEach(b => b.classList.remove('selected'));
          btn.classList.add('selected');
        });
      });
    }
    
    // تحديث أزرار الكمية
    const minusBtn = card.querySelector('.minus-btn');
    const plusBtn = card.querySelector('.plus-btn');
    const qtyInput = card.querySelector('.qty-input');
    
    if (minusBtn && plusBtn && qtyInput) {
      // إزالة معالجات الأحداث القديمة
      const newMinusBtn = minusBtn.cloneNode(true);
      const newPlusBtn = plusBtn.cloneNode(true);
      
      minusBtn.parentNode.replaceChild(newMinusBtn, minusBtn);
      plusBtn.parentNode.replaceChild(newPlusBtn, plusBtn);
      
      // إضافة معالجات الأحداث الجديدة
      newMinusBtn.addEventListener('click', () => {
        if (qtyInput.value > 1) {
          qtyInput.value = parseInt(qtyInput.value) - 1;
        }
      });
      
      newPlusBtn.addEventListener('click', () => {
        if (qtyInput.value < 10) {
          qtyInput.value = parseInt(qtyInput.value) + 1;
        }
      });
    }
  }
  // دالة إنشاء أزرار المقاسات
  function createSizeButtons(sizes) {
    console.log('Create size buttons:', sizes);
    
    // التحقق من وجود مقاسات
    if (!sizes || !Array.isArray(sizes) || sizes.length === 0) {
      console.warn('No sizes available, using default sizes');
      // استخدام مقاسات افتراضية إذا لم تتوفر مقاسات
      const defaultSizes = ['M', 'L', 'XL'];
      return defaultSizes.map((size, index) => `
        <button type="button" class="size-btn ${index === 0 ? 'selected' : ''}">${size}</button>
      `).join('');
    }
    
    // إنشاء أزرار للمقاسات المتوفرة
    return sizes.map((size, index) => {
      if (typeof size === 'object' && size.name) {
        // دعم هيكل البيانات المركب للحجم
        return `<button type="button" class="size-btn ${index === 0 ? 'selected' : ''}" 
                        data-size="${size.value || size.name}">${size.name}</button>`;
      } else {
        // دعم أنواع البيانات البسيطة (نصوص)
        return `<button type="button" class="size-btn ${index === 0 ? 'selected' : ''}">${size}</button>`;
      }
    }).join('');
  }

  // دالة إنشاء أزرار الألوان
  function createColorButtons(colors) {
    console.log('Create color buttons:', colors);

    // التحقق من وجود ألوان
    if (!colors || !Array.isArray(colors) || colors.length === 0) {
      console.warn('No colors available, using default colors');
      // استخدام ألوان افتراضية إذا لم تتوفر ألوان
      const defaultColors = [
        { name: 'Black', hex: '#000000' },
        { name: 'Blue', hex: '#2196F3' }
      ];
      return defaultColors.map((color, index) => `
        <button type="button" 
                class="color-swatch ${index === 0 ? 'selected' : ''}" 
                style="--color: ${color.hex}" 
                title="${color.name}"
                data-color="${color.name}">
        </button>
      `).join('');
    }
    
    // إنشاء أزرار للألوان المتوفرة
    return colors.map((color, index) => {
      // دعم صيغ البيانات المختلفة للألوان
      const colorName = color.name || color.label || 'Color';
      const colorHex = color.hex || color.color || color.value || '#000000';
      
      return `
        <button type="button" 
                class="color-swatch ${index === 0 ? 'selected' : ''}" 
                style="--color: ${colorHex}" 
                title="${colorName}"
                data-color="${colorName}">
        </button>
      `;
    }).join('');
  }  // دالة تحديث صور المنتج بشكل ديناميكي
  async function updateProductImages(productId, images) {
    try {
      const { storage } = await waitForFirebase();
      
      // تحويل معرف المنتج إلى رقم لاستخدامه مع carouselProduct
      const productNumber = productId.replace('PNJ00', '');
      const carouselId = `carouselProduct${productNumber}`;
      const carousel = document.getElementById(carouselId);
      
      if (!carousel) {
        console.log(`Carousel element not found for product ${productId} (looking for ${carouselId})`);
        return;
      }
      
      const carouselInner = carousel.querySelector('.carousel-inner');
      const indicators = carousel.querySelector('.carousel-indicators');
      
      if (!carouselInner || !indicators) {
        console.log(`Carousel inner or indicators not found for product ${productId}`);
        return;
      }
      
      console.log(`Updating images for product ${productId}`, images);
      
      // مسح المحتوى الحالي
      carouselInner.innerHTML = '';
      indicators.innerHTML = '';
      
      // إذا لم تكن هناك صور، عرض صورة افتراضية
      if (!images || images.length === 0) {
        console.log(`No images found for product ${productId}, using default`);
        carouselInner.innerHTML = `
          <div class="carousel-item active">
            <img src="assets/images/logo.jpg" class="d-block w-100" alt="No image available">
          </div>
        `;
        indicators.style.display = 'none';
        return;
      }
      
      // تحويل مسارات الصور إلى روابط قابلة للتحميل
      const imagePromises = images.map(async (imagePath, index) => {
        try {
          // التحقق مما إذا كان المسار هو URL كامل بالفعل
          if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
            return { url: imagePath, index };
          }
          
          // إذا كان مسار نسبي في التخزين، قم بجلب URL التحميل
          const imageRef = storage.ref(imagePath);
          const url = await storage.getDownloadURL(imageRef);
          console.log(`Loaded image URL for ${imagePath}:`, url);
          return { url, index };
        } catch (error) {
          console.error(`Failed to load image ${imagePath}:`, error);
          return null;
        }
      });
      
      const loadedImages = (await Promise.all(imagePromises)).filter(img => img !== null);
      console.log(`Loaded ${loadedImages.length} images for product ${productId}`);
      
      // إذا لم يتم تحميل أي صور بنجاح، عرض الصورة الافتراضية
      if (loadedImages.length === 0) {
        carouselInner.innerHTML = `
          <div class="carousel-item active">
            <img src="assets/images/logo.jpg" class="d-block w-100" alt="No image available">
          </div>
        `;
        indicators.style.display = 'none';
        return;
      }
      
      // إذا كانت هناك صورة واحدة فقط، عرضها بدون عناصر التحكم في الكاروسل
      if (loadedImages.length === 1) {
        carouselInner.innerHTML = `
          <div class="carousel-item active">
            <img src="${loadedImages[0].url}" class="d-block w-100" alt="Product image">
          </div>
        `;
        
        // إخفاء عناصر التحكم في الكاروسل
        carousel.setAttribute('data-bs-interval', 'false');
        indicators.style.display = 'none';
        return;
      }
      
      // إضافة الصور إلى الكاروسل
      loadedImages.forEach((image, i) => {
        // إضافة عنصر الكاروسل
        const item = document.createElement('div');
        item.className = `carousel-item ${i === 0 ? 'active' : ''}`;
        item.innerHTML = `<img src="${image.url}" class="d-block w-100" alt="Product image ${i + 1}">`;
        carouselInner.appendChild(item);
        
        // إضافة مؤشر
        const indicator = document.createElement('button');
        indicator.type = 'button';
        indicator.dataset.bsTarget = `#${carouselId}`;
        indicator.dataset.bsSlideTo = i.toString();
        if (i === 0) {
          indicator.classList.add('active');
          indicator.setAttribute('aria-current', 'true');
        }
        indicators.appendChild(indicator);
      });
      
      // التأكد من أن الكاروسل نشط
      carousel.setAttribute('data-bs-interval', '3000');
      indicators.style.display = 'flex';
    } catch (error) {
      console.error(`Error updating images for product ${productId}:`, error);
    }
  }  // إضافة معالج أحداث للغة لتحديث واجهة المنتجات عند تغيير اللغة
  document.addEventListener('languageChanged', function(e) {
    const newLang = e.detail.newLanguage;
    console.log(`📱 Language change event received: ${newLang}`);
    
    // إعادة تحميل محتوى الهيرو باللغة الجديدة
    console.log('Reloading hero content for new language...');
    loadHeroContent();
    
    // لا نحتاج لإعادة تحميل البيانات، فقط تحديث النصوص إذا كانت البيانات موجودة بالفعل
    if (window.updateProductsContent) {
      console.log('Updating existing product texts...');
      window.updateProductsContent(newLang);
    }
  });

  // تحميل بيانات المنتجات عند تحميل الصفحة
  console.log('Initializing products...');
  loadProductsFromFirebase();

  // -------------------- ربط قسم نموذج الطلب ب Firebase --------------------  // استرجاع قيمة الشحن من Firestore
  async function loadShippingCost() {
    try {
      const { db } = await waitForFirebase();
      const shippingDoc = await db.getDoc(db.doc('settings/shipping'));
      
      if (shippingDoc.exists()) {
        const data = shippingDoc.data();
        if (data && data.cost) {
          window.SHIPPING_COST = data.cost;
          SHIPPING_COST = data.cost; // تحديث المتغير المحلي أيضاً
          console.log('Shipping cost has been uploaded:', data.cost);
          
          // تحديث عرض السلة إذا كانت متاحة
          if (typeof updateCartDisplay === 'function') {
            updateCartDisplay();
          }
          
          // تحديث عرض قيمة الشحن في النموذج
          const shippingCostElement = document.getElementById('shipping-cost');
          if (shippingCostElement) {
            shippingCostElement.textContent = `৳${data.cost}`;
          }
        }
      }
    } catch (error) {
      console.error('Error loading shipping cost:', error);
    }
  }

  // استرجاع كوبون خصم  
  async function validateCoupon(code) {
    try {
      console.log('🔍 Start validating coupon:', code);
      const { db } = await waitForFirebase();
      const couponsRef = db.collection('coupons');
      const couponsQuery = db.query(couponsRef, db.where('code', '==', code.toUpperCase()), db.where('active', '==', true));
      const querySnapshot = await db.getDocs(couponsQuery);
      
      if (querySnapshot.empty) {
        console.log('❌ No coupon found with code:', code);
        return { valid: false, message: 'Invalid coupon code' };
      }
      
      const couponDoc = querySnapshot.docs[0];
      const coupon = couponDoc.data();
      console.log('✅ Coupon found:', coupon);

      // التحقق من انتهاء صلاحية الكوبون
      const now = new Date();
      const validUntil = new Date(coupon.validUntil);
      
      if (validUntil < now) {
        console.log('⏰ Coupon expired:', validUntil);
        return { valid: false, message: 'This coupon has expired' };
      }
      
      const result = { 
        valid: true, 
        coupon: {
          code: coupon.code,
          type: coupon.type,
          value: Number(coupon.value) // تأكد من أن القيمة رقم
        }
      };

      console.log('✅ Coupon valid:', result);
      return result;
    } catch (error) {
      console.error('❌ Error validating coupon:', error);
      return { valid: false, message: 'Error validating coupon' };
    }
  }

  // تحميل قيمة الشحن عند تحميل الصفحة
  loadShippingCost();

  // دالة تحديث نصوص بطاقة المنتج - يتم استدعاؤها من lang.js
  function updateProductCardTexts(card, productData, lang) {
    try {
      const name = productData.name?.[lang] || productData.name?.en || 'Product Name';
      const shortDesc = productData.shortDescription?.[lang] || productData.shortDescription?.en || '';
      const fullDesc = productData.fullDescription?.[lang] || productData.fullDescription?.en || '';

      // تحديث عنوان المنتج
      const titleElement = card.querySelector('.card-title');
      if (titleElement) {
        titleElement.textContent = name;
      }

      // تحديث الوصف المختصر
      const shortDescElement = card.querySelector('.product-description');
      if (shortDescElement) {
        shortDescElement.textContent = shortDesc;
      }

      // تحديث الوصف الكامل في النافذة المنبثقة
      const fullDescElement = card.querySelector('.full-text');
      if (fullDescElement) {
        fullDescElement.textContent = fullDesc;
      }

      console.log(`Product texts updated for language ${lang}`);
    } catch (error) {
      console.error('Error updating product card texts:', error);
    }
  }

  // تصدير الدالة ليتم استخدامها في lang.js
  window.updateProductCardTexts = updateProductCardTexts;

  // إضافة دالة اختبار عامة
  window.testHeroSection = async function() {
    console.log('=== Manual Hero Section Test ===');
    await loadHeroContent();
    console.log('=== Hero Test Complete ===');
  };

  // آخر محاولة لتحميل الهيرو
  setTimeout(() => {
    console.log('Final attempt to load hero content...');
    if (typeof loadHeroContent === 'function') {
      loadHeroContent();
    }
  }, 8000);

  // دالة اختبار مباشرة للتأكد من Firebase
  window.debugFirebase = async function() {
    console.log('--- بدء اختبار Firebase ---');
    
    try {
      console.log('1. التحقق من توفر db و storage...');
      console.log('db:', window.db);
      console.log('storage:', window.storage);
      
      if (!window.db || !window.storage) {
        console.error('❌ db أو storage غير متاح');
        return;
      }
      
      console.log('2. اختبار قراءة content/hero...');
      const heroDocRef = window.db.doc('content/hero');
      console.log('heroDocRef:', heroDocRef);
      
      const heroDoc = await window.db.getDoc(heroDocRef);
      console.log('heroDoc:', heroDoc);
      console.log('heroDoc.exists():', heroDoc.exists());
      
      if (heroDoc.exists()) {
        console.log('✓ تم العثور على content/hero');
        console.log('البيانات:', heroDoc.data());
      } else {
        console.log('⚠️ لم يتم العثور على content/hero');
      }
      
      console.log('3. اختبار قراءة heroImages/order...');
      const imagesDocRef = window.db.doc('heroImages/order');
      const imagesDoc = await window.db.getDoc(imagesDocRef);
      
      if (imagesDoc.exists()) {
        console.log('✓ تم العثور على heroImages/order');
        console.log('البيانات:', imagesDoc.data());
      } else {
        console.log('⚠️ لم يتم العثور على heroImages/order');
      }
      
    } catch (error) {
      console.error('❌ خطأ في اختبار Firebase:', error);
    }
    
    console.log('--- انتهاء اختبار Firebase ---');
  };
});