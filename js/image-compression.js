/**
 * مكتبة ضغط الصور التلقائي لتحسين الأداء
 * تقوم بضغط الصور قبل رفعها إلى Firebase
 */

class ImageCompressor {
  constructor() {
    this.maxWidth = 1200;        // أقصى عرض للصورة
    this.maxHeight = 1200;       // أقصى ارتفاع للصورة
    this.quality = 0.8;          // جودة الضغط (80%)
    this.format = 'image/jpeg';  // صيغة الإخراج
  }

  /**
   * ضغط صورة واحدة
   * @param {File} file - ملف الصورة
   * @param {Object} options - خيارات الضغط
   * @returns {Promise<File>} - الصورة المضغوطة
   */
  async compressImage(file, options = {}) {
    return new Promise((resolve, reject) => {
      // التحقق من نوع الملف
      if (!file.type.startsWith('image/')) {
        reject(new Error('The uploaded file is not an image.'));
        return;
      }

      // دمج الخيارات مع القيم الافتراضية
      const config = {
        maxWidth: options.maxWidth || this.maxWidth,
        maxHeight: options.maxHeight || this.maxHeight,
        quality: options.quality || this.quality,
        format: options.format || this.format
      };

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        // حساب الأبعاد الجديدة مع الحفاظ على النسبة
        const { width, height } = this.calculateDimensions(
          img.width, 
          img.height, 
          config.maxWidth, 
          config.maxHeight
        );

        // تحديد أبعاد اللوحة
        canvas.width = width;
        canvas.height = height;

        // رسم الصورة مع الحجم الجديد
        ctx.drawImage(img, 0, 0, width, height);

        // تحويل إلى Blob مضغوط
        canvas.toBlob((blob) => {
          if (blob) {
            // إنشاء ملف جديد بالبيانات المضغوطة
            const compressedFile = new File([blob], file.name, {
              type: config.format,
              lastModified: Date.now()
            });

            console.log(`🗜️ Starting compression for image ${file.name}:`);
            console.log(`   Original size: ${this.formatFileSize(file.size)}`);
            console.log(`   Compressed size: ${this.formatFileSize(compressedFile.size)}`);
            console.log(`   Savings: ${Math.round((1 - compressedFile.size / file.size) * 100)}%`);

            resolve(compressedFile);
          } else {
            reject(new Error('Failed to compress image'));
          }
        }, config.format, config.quality);
      };

      img.onerror = () => {
        reject(new Error('Failed to load image'));
      };

      // تحميل الصورة
      img.src = URL.createObjectURL(file);
    });
  }

  /**
   * ضغط عدة صور
   * @param {FileList|Array} files - قائمة الملفات
   * @param {Object} options - خيارات الضغط
   * @returns {Promise<Array>} - قائمة الصور المضغوطة
   */
  async compressMultipleImages(files, options = {}) {
    const fileArray = Array.from(files);
    const compressionPromises = fileArray.map(file => this.compressImage(file, options));
    
    try {
      const compressedFiles = await Promise.all(compressionPromises);
      console.log(`✅ Successfully compressed ${compressedFiles.length} images.`);
      return compressedFiles;
    } catch (error) {
      console.error('❌ Error compressing images:', error);
      throw error;
    }
  }

  /**
   * حساب الأبعاد الجديدة مع الحفاظ على النسبة
   */
  calculateDimensions(originalWidth, originalHeight, maxWidth, maxHeight) {
    let { width, height } = { width: originalWidth, height: originalHeight };

    // تحديد النسبة
    const aspectRatio = originalWidth / originalHeight;

    // تقليل الحجم إذا كان أكبر من الحد الأقصى
    if (width > maxWidth) {
      width = maxWidth;
      height = width / aspectRatio;
    }

    if (height > maxHeight) {
      height = maxHeight;
      width = height * aspectRatio;
    }

    return {
      width: Math.round(width),
      height: Math.round(height)
    };
  }

  /**
   * تنسيق حجم الملف للعرض
   */
  formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * إنشاء معاينة للصورة
   */
  createImagePreview(file, container) {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = document.createElement('img');
      img.src = e.target.result;
      img.style.maxWidth = '200px';
      img.style.maxHeight = '200px';
      img.style.objectFit = 'cover';
      img.className = 'img-thumbnail';
      
      container.appendChild(img);
    };
    reader.readAsDataURL(file);
  }
}

// إنشاء مثيل عام للاستخدام في جميع أنحاء التطبيق
window.imageCompressor = new ImageCompressor();

// خيارات مختلفة للاستخدامات المختلفة
window.compressionPresets = {
  // للصور الرئيسية (الهيرو)
  hero: {
    maxWidth: 1920,
    maxHeight: 1080,
    quality: 0.85,
    format: 'image/jpeg'
  },
  
  // لصور المنتجات
  product: {
    maxWidth: 800,
    maxHeight: 800,
    quality: 0.8,
    format: 'image/jpeg'
  },
  
  // للصور المصغرة
  thumbnail: {
    maxWidth: 300,
    maxHeight: 300,
    quality: 0.7,
    format: 'image/jpeg'
  }
};

console.log('✅ Image compression library loaded successfully');
