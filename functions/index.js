const functions = require('firebase-functions');
const admin = require('firebase-admin');
const nodemailer = require('nodemailer');

admin.initializeApp();

// إعداد البريد الإلكتروني - استخدم كلمة مرور التطبيق من Google
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'hohijok70@gmail.com',
    pass: 'sfbx oria mwxc ebwn' // يجب تغييرها لكلمة مرور التطبيق الحقيقية
  }
});

// دالة معالجة الطلبات
exports.processOrder = functions.https.onCall(async (data, context) => {
    try {
        console.log('Processing order:', data);

        // التحقق من صحة البيانات الجديدة
        const { customerInfo, items, orderSummary, couponCode, orderDate, language } = data;

        if (!customerInfo || !items || !orderSummary) {
            throw new functions.https.HttpsError('invalid-argument', 'Missing required fields');
        }

        if (!customerInfo.name || !customerInfo.phone || !customerInfo.address || !customerInfo.city) {
            throw new functions.https.HttpsError('invalid-argument', 'Missing customer information');
        }

        if (!Array.isArray(items) || items.length === 0) {
            throw new functions.https.HttpsError('invalid-argument', 'Items array is empty');
        }

        // إنشاء معرف طلب فريد
        const timestamp = Date.now();
        const orderId = `ORDER-${timestamp}`;

        // حفظ الطلب في Firestore
        const orderData = {
            orderId,
            customerInfo: {
                name: customerInfo.name.trim(),
                phone: customerInfo.phone.trim(),
                email: customerInfo.email ? customerInfo.email.trim() : '',
                address: customerInfo.address.trim(),
                city: customerInfo.city.trim()
            },
            items: items.map(item => ({
                productId: item.productId,
                productName: item.productName,
                size: item.size,
                color: item.color,
                quantity: parseInt(item.quantity),
                price: parseFloat(item.price),
                total: parseFloat(item.total)
            })),
            orderSummary: {
                subtotal: parseFloat(orderSummary.subtotal),
                shipping: parseFloat(orderSummary.shipping),
                discount: parseFloat(orderSummary.discount || 0),
                total: parseFloat(orderSummary.total)
            },
            couponCode: couponCode || null,
            status: 'pending',
            orderDate: orderDate || admin.firestore.FieldValue.serverTimestamp(),
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            language: language || 'en',
            processed: false
        };

        await admin.firestore().collection('orders').doc(orderId).set(orderData);
        console.log('Order saved to Firestore:', orderId);

        // إعداد محتوى البريد الإلكتروني
        const itemsList = items.map(item =>
            `• ${item.productName} - Size: ${item.size} - Color: ${item.color} - Quantity: ${item.quantity} - Price: ৳${item.price}`
        ).join('\n');

        const emailContent = `
New order from A.N FASHION store

Order ID: ${orderId}

Customer information:
Name: ${customerInfo.name}
Phone: ${customerInfo.phone}
Email: ${customerInfo.email || 'undefined'}
City: ${customerInfo.city}
Address: ${customerInfo.address}

Required products:
${itemsList}

Order summary:
Subtotal: ৳${orderSummary.subtotal}
Shipping: ৳${orderSummary.shipping}
Discount: ৳${orderSummary.discount || 0}
${couponCode ? `Coupon code: ${couponCode}` : ''}

Total amount: ৳${orderSummary.total}

Order date: ${new Date().toLocaleString('ar-EG')}
Language: ${language === 'bn' ? 'বাংলা' : 'English'}

Please contact the customer to confirm the order.
    `;

        // إرسال البريد الإلكتروني
        try {
            await transporter.sendMail({
                from: 'hohijok70@gmail.com',
                to: 'hohijok70@gmail.com',
                subject: `New order #${orderId} - A.N FASHION`,
                text: emailContent,
                html: emailContent.replace(/\n/g, '<br>')
            });
            console.log('Email sent successfully');
        } catch (emailError) {
            console.error('Email send failed:', emailError);
            // لا نرمي خطأ هنا لأن الطلب تم حفظه بنجاح
        }

        // تنظيف الطلبات القديمة (الاحتفاظ بآخر 20 طلب فقط)
        try {
            await cleanupOldOrders();
        } catch (cleanupError) {
            console.error('Cleanup failed:', cleanupError);
            // لا نرمي خطأ هنا أيضاً
        }

        return {
            success: true,
            orderId,
            message: 'Your request has been submitted successfully! You will be contacted soon.'
        };

    } catch (error) {
        console.error('Error processing order:', error);
        throw new functions.https.HttpsError('internal', 'An error occurred while processing the order: ' + error.message);
    }
});

// دالة تنظيف الطلبات القديمة
async function cleanupOldOrders() {
  const ordersRef = admin.firestore().collection('orders');
  const snapshot = await ordersRef
    .where('processed', '==', true)
    .orderBy('createdAt', 'desc')
    .offset(20)
    .get();

  if (!snapshot.empty) {
    const batch = admin.firestore().batch();
    snapshot.docs.forEach(doc => batch.delete(doc.ref));
    await batch.commit();
    console.log(`Cleaned up ${snapshot.docs.length} old orders`);
  }
}

// دالة تحديث حالة الطلب
exports.updateOrderStatus = functions.https.onCall(async (data, context) => {
  // التحقق من المصادقة
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const { orderId, status } = data;
  
  if (!orderId || !status) {
    throw new functions.https.HttpsError('invalid-argument', 'Missing orderId or status');
  }

  try {
    await admin.firestore().collection('orders').doc(orderId).update({
      status,
      processed: status === 'completed' || status === 'cancelled',
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    console.log(`Order ${orderId} status updated to ${status}`);
    return { success: true };
  } catch (error) {
    console.error('Error updating order status:', error);
    throw new functions.https.HttpsError('internal', 'Failed to update order status');
  }
});

// دالة جلب الطلبات للأدمن
exports.getOrders = functions.https.onCall(async (data, context) => {
  // التحقق من المصادقة
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  try {
    const { status, limit = 50 } = data;
    let query = admin.firestore().collection('orders')
      .orderBy('createdAt', 'desc')
      .limit(limit);

    if (status) {
      query = query.where('status', '==', status);
    }

    const snapshot = await query.get();
    const orders = [];

    snapshot.forEach(doc => {
      orders.push({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate()?.toISOString()
      });
    });

    return { orders };
  } catch (error) {
    console.error('Error fetching orders:', error);
    throw new functions.https.HttpsError('internal', 'Failed to fetch orders');
  }
});
