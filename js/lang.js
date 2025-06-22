let currentLang = "en";

// cache للنصوص المحملة من Firebase
const contentCache = {
  hero: {},
  products: {}
};

async function loadLanguage(lang) {
  try {
    console.log(`🌐 Start downloading the language: ${lang}`);
    
    // أولاً: تحديث النصوص الديناميكية من Firebase
    await updateDynamicContent(lang);
    
    // ثانياً: تحميل وتطبيق النصوص الثابتة من ملفات JSON
    const response = await fetch(`assets/lang/${lang}.json`);
    const translations = await response.json();

    // تحديث النصوص الثابتة فقط (تجنب الكتابة فوق النصوص الديناميكية)
    document.querySelectorAll("[data-i18n]").forEach((el) => {
      const keys = el.getAttribute("data-i18n").split(".");
      let value = translations;
      for (const key of keys) {
        value = value[key];
      }
      if (value) {
        // تحقق من أن العنصر ليس من العناصر الديناميكية (الهيرو)
        const isHeroElement = keys[0] === 'hero';
        const isProductNameOrDesc = el.closest('.card-title, .product-description, .full-text');
        
        // إذا كان عنصر الهيرو أو نص منتج ديناميكي، تجاهله
        if (!isHeroElement && !isProductNameOrDesc) {
          if (el.tagName === "INPUT" || el.tagName === "TEXTAREA") {
            el.placeholder = value;
          } else {
            el.textContent = value;
          }
        }
      }
    });

    // تحديث placeholder
    document.querySelectorAll("[data-placeholder]").forEach((el) => {
      const keys = el.getAttribute("data-placeholder").split(".");
      let value = translations;
      for (const key of keys) {
        value = value[key];
      }
      if (value) {
        el.setAttribute("placeholder", value);
      }
    });

    currentLang = lang;
    window.currentLang = lang;    // حفظ اللغة المختارة في التخزين المحلي
    localStorage.setItem('lang', lang);

    // مهم: تحديث عرض السلة بعد تغيير اللغة
    if (typeof updateCartDisplay === 'function') {
      updateCartDisplay();
    }

    // إطلاق حدث مخصص لإعلام باقي أجزاء التطبيق بتغيير اللغة
    const languageChangeEvent = new CustomEvent('languageChanged', {
      detail: { newLanguage: lang, oldLanguage: currentLang }
    });
    document.dispatchEvent(languageChangeEvent);

    console.log(`✅ Language loaded ${lang} successfully`);

  } catch (error) {
    console.error("Error loading language file:", error);
  }
}

// دالة لتحديث المحتوى الديناميكي من Firebase عند تغيير اللغة
async function updateDynamicContent(lang) {
  try {
    console.log(`🔄 Start updating the dynamic language content: ${lang}`);
    
    // انتظار تهيئة Firebase مع timeout أقصر
    if (!window.db) {
      console.warn('⚠️ Firebase not ready yet, will try later...');

      // انتظار حتى 2 ثانية لتهيئة Firebase
      let attempts = 0;
      const maxAttempts = 20; // 2 ثانية (20 * 100ms)
      
      while (!window.db && attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 100));
        attempts++;
      }
      
      if (!window.db) {
        console.error('❌ Firebase was not initialized in time, skipping the dynamic update');
        return;
      }
    }

    console.log(`✅ Firebase is ready, continuing with content update for language: ${lang}`);

    // تحديث محتوى الهيرو والمنتجات بشكل متوازي لتسريع العملية
    await Promise.all([
      updateHeroContent(lang),
      updateProductsContent(lang)
    ]);

    console.log(`🎉 All dynamic content updated for language: ${lang}`);

  } catch (error) {
    console.error('❌ Error updating dynamic content:', error);
  }
}

// دالة تحديث محتوى الهيرو حسب اللغة
async function updateHeroContent(lang) {
  try {
    console.log(`🎭 Start updating hero content for language: ${lang}`);
    
    let heroData = null;
    
    // تحقق من الـ cache أولاً
    if (contentCache.hero && Object.keys(contentCache.hero).length > 0) {
      heroData = contentCache.hero[lang];
      console.log(`💾 Using data from Cache for language: ${lang}`);
    }
    
    // إذا لم تكن البيانات محفوظة في الـ cache، قم بتحميلها
    if (!heroData) {
      console.log(`🌐 Loading hero data from Firebase for language: ${lang}`);
      const heroDoc = await window.db.collection('content').doc('hero').get();
      
      if (!heroDoc.exists()) {
        console.warn('⚠️ No hero data found in database');
        return;
      }
      
      const fullHeroData = heroDoc.data();
      
      // حفظ جميع اللغات في الـ cache
      contentCache.hero = fullHeroData;
      heroData = fullHeroData[lang];
      
      console.log(`📝 Hero data is saved in cache`, Object.keys(fullHeroData));
    }
    
    if (heroData) {
      const content = heroData;
      
      // تحديث عناصر الهيرو
      const elements = {
        offerBadge: document.querySelector('[data-i18n="hero.offerBadge"]'),
        heading: document.querySelector('[data-i18n="hero.heading"]'),
        description: document.querySelector('[data-i18n="hero.description"]'),
        viewCollectionButton: document.querySelector('[data-i18n="hero.viewCollectionButton"]')
      };

      let updated = 0;
      
      if (elements.offerBadge && content.offerBadge) {
        elements.offerBadge.textContent = content.offerBadge;
        updated++;
      }
      if (elements.heading && content.heading) {
        elements.heading.textContent = content.heading;
        updated++;
      }
      if (elements.description && content.description) {
        elements.description.textContent = content.description;
        updated++;
      }
      if (elements.viewCollectionButton && content.viewCollectionButton) {
        elements.viewCollectionButton.textContent = content.viewCollectionButton;
        updated++;
      }

      console.log(`✅ تم تحديث ${updated} عنصر من الهيرو للغة ${lang}`);
    } else {
      console.warn(`⚠️ لا توجد ترجمة للغة ${lang} في بيانات الهيرو`);
      
      // تجربة اللغة الإنجليزية كبديل
      if (lang !== 'en' && contentCache.hero && contentCache.hero.en) {
        console.log('🔄 Using English as an alternative...');
        await updateHeroContent('en');
      }
    }
  } catch (error) {
    console.error('❌ Error updating hero content:', error);
  }
}

// دالة تحديث محتوى المنتجات حسب اللغة
async function updateProductsContent(lang) {
  try {
    console.log(`🛍️ Start updating product content for the language: ${lang}`);
    const productIds = ['PNJ001', 'PNJ002', 'PNJ003', 'PNJ004', 'PNJ005', 'PNJ006'];
    
    // تحميل جميع المنتجات بشكل متوازي لتسريع العملية
    const productPromises = productIds.map(async (productId) => {
      try {
        let productData = null;
        
        // تحقق من الـ cache أولاً
        if (contentCache.products[productId]) {
          productData = contentCache.products[productId];
          console.log(`💾 Use of product data ${productId} from Cache`);
        } else {
          // تحميل من Firebase
          console.log(`🌐 Loading product data ${productId} from Firebase`);
          const productDoc = await window.db.collection('products').doc(productId).get();
          
          if (productDoc.exists()) {
            productData = productDoc.data();
            // حفظ في الـ cache
            contentCache.products[productId] = productData;
          }
        }
        
        if (productData) {
          const productContainer = document.getElementById(`product-${productId}`);
          
          if (productContainer) {
            // تحديث النصوص في البطاقة الموجودة
            const card = productContainer.querySelector('.card');
            if (card) {
              updateProductCardTexts(card, productData, lang);
              return { success: true, productId };
            } else {
              console.warn(`⚠️ Product card not found ${productId}`);
              return { success: false, productId };
            }
          } else {
            console.warn(`⚠️ Product container not found ${productId}`);
            return { success: false, productId };
          }
        } else {
          console.warn(`⚠️ Product ${productId} not found in database`);
          return { success: false, productId };
        }
      } catch (productError) {
        console.error(`❌ Error updating product ${productId}:`, productError);
        return { success: false, productId };
      }
    });
    
    // انتظار تحديث جميع المنتجات
    const results = await Promise.all(productPromises);
    const successCount = results.filter(result => result.success).length;

    console.log(`🎉 Updated ${successCount} out of ${productIds.length} products for language ${lang}`);
  } catch (error) {
    console.error('❌ Error updating product content:', error);
  }
}

// دالة تحديث نصوص بطاقة المنتج
function updateProductCardTexts(card, productData, lang) {
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
}

// تحديث شكل وحالة الزر
function updateButtonState() {
  const btn = document.getElementById("langToggleBtn");
  btn.textContent = currentLang === "en" ? "BN" : "EN";
  btn.classList.toggle("active", currentLang === "bn");
}

// زر تغيير اللغة
document.getElementById("langToggleBtn").addEventListener("click", async () => {
  const newLang = currentLang === "en" ? "bn" : "en";
  console.log(`🌐 Change language from ${currentLang} to ${newLang}`);

  // إضافة مؤشر تحميل
  const btn = document.getElementById("langToggleBtn");
  const originalText = btn.textContent;
  btn.disabled = true;
  btn.innerHTML = '⌛ Loading...';
  
  try {
    // حفظ اللغة الجديدة في التخزين المحلي
    currentLang = newLang;
    window.currentLang = newLang;
    localStorage.setItem('lang', newLang);

    console.log(`✅ Language ${newLang} saved successfully. The page will reload...`);

    // إعادة تحميل الصفحة لضمان تطبيق جميع التغييرات بشكل كامل
    window.location.reload();
    
  } catch (error) {
    console.error('❌ Error changing language:', error);
    btn.textContent = originalText;
    btn.disabled = false;
  }
});

// تحميل اللغة الافتراضية
document.addEventListener("DOMContentLoaded", async () => {
  // قراءة اللغة المحفوظة أو استخدام الافتراضي
  const savedLang = localStorage.getItem('lang') || 'en';
  currentLang = savedLang;
  window.currentLang = savedLang;

  console.log(`🚀 Start loading initial language: ${savedLang}`);

  await loadLanguage(savedLang);
  updateButtonState();

  console.log(`🎉 Initial language loaded successfully: ${savedLang}`);
});

// تصدير الدالة والمتغير ليكونا متاحين في index.js
window.currentLang = currentLang;
window.loadLanguage = loadLanguage;
window.updateDynamicContent = updateDynamicContent;
window.updateHeroContent = updateHeroContent;
window.updateProductsContent = updateProductsContent;