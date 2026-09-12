const convertToWebP = (file: File, quality: number = 0.8): Promise<string> => {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      reject(new Error('Failed to get canvas context'));
      return;
    }
    
    const img = new Image();
    
    img.onload = () => {
      // Set canvas dimensions to match image
      canvas.width = img.width;
      canvas.height = img.height;
      
      // Draw image to canvas
      ctx.drawImage(img, 0, 0);
      
      // Convert to WebP base64
      try {
        const webpBase64 = canvas.toDataURL('image/webp', quality);
        resolve(webpBase64);
      } catch (error) {
        reject(error);
      } finally {
        // Clean up object URL
        URL.revokeObjectURL(img.src);
      }
    };
    
    img.onerror = () => {
      URL.revokeObjectURL(img.src);
      reject(new Error('Failed to load image'));
    };
    
    // Create object URL from file and load into image
    img.src = URL.createObjectURL(file);
  });
};

export default convertToWebP;