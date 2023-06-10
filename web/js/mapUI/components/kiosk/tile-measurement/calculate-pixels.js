export default function calculateBlackPixelRatio(blobUrl) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.src = blobUrl;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0, img.width, img.height);
      const imgData = ctx.getImageData(0, 0, img.width, img.height).data;

      let blackPixelsCount = 0;
      for(let i = 0; i < imgData.length; i += 4) {
        // Check if pixel is black
        if(imgData[i] === 0 && imgData[i + 1] === 0 && imgData[i + 2] === 0 && imgData[i + 3] === 255) {
          blackPixelsCount++;
        }
      }

      const totalPixels = img.width * img.height;
      const blackPixelRatio = blackPixelsCount / totalPixels;
      resolve(blackPixelRatio);
    };
    img.onerror = reject;
  });
}
