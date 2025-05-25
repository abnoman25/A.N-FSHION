document.addEventListener("DOMContentLoaded", function () {
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
  const SHIPPING_COST = 120;

  // دالة إضافة المنتج للسلة
  function addToCart(btn, isBuyNow = false) {
    const card = btn.closest(".card");
    const productId = card.dataset.productId;
    const title = card.querySelector(".card-title").textContent;
    const price = parseFloat(card.querySelector(".product-price").dataset.price);
    const sale = parseFloat(card.querySelector(".product-price").dataset.sale);
    const size = card.querySelector(".size-select").value;
    const color = card.querySelector(".color-select").value;
    const qty = parseInt(card.querySelector(".qty-input").value) || 1;

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
    let total = 0;

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
      total += itemTotal;

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
    });

    // إضافة تكلفة الشحن
    total += SHIPPING_COST;

    // عرض المجموع النهائي
    document.getElementById("total-price").innerText = `৳${total}`;

    // تحديث حقل المنتجات (لـ Formsubmit)
    const productInput = document.getElementById("product-input");
    if (productInput) {
      const orderSummary = cart.map(item =>
        `Product ID: ${item.productId}\n` +
        `${t.product}: ${item.title}\n` +
        `${t.size}: ${item.size}\n` +
        `${t.color}: ${item.color}\n` +
        `${t.quantity}: ${item.qty}\n` +
        `${t.price}: ৳${item.sale}\n` +
        `${t.subtotal}: ৳${item.sale * item.qty}`
      ).join("\n\n---\n\n");

      productInput.value = orderSummary + "\n\n" +
        `${t.shipping}: ৳${SHIPPING_COST}\n` +
        `${t.total}: ৳${total}`;
    }

    const totalPriceInput = document.getElementById("total-price-input");
    if (totalPriceInput) {
      totalPriceInput.value = `৳${total} (${t.shipping}: ৳${SHIPPING_COST})`;
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


  // تغيير الكمية
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

  // عرض إشعار مؤقت
  function showAlert(message) {
    const alert = document.createElement("div");
    alert.className = "alert alert-success position-fixed top-0 start-50 translate-middle-x mt-3";
    alert.style.zIndex = "9999";
    alert.innerHTML = message;
    document.body.appendChild(alert);
    setTimeout(() => alert.remove(), 2500);
  }

  // Example starter JavaScript for disabling form submissions if there are invalid fields
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


});