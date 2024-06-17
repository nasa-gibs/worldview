export default function calculateBlackPixelRatio(blobUrl) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.src = blobUrl;
    img.onload = ({ target }) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      canvas.width = target.width;
      canvas.height = target.height;
      ctx.drawImage(target, 0, 0, target.width, target.height);
      const imgData = ctx.getImageData(0, 0, target.width, target.height).data;

      let blackPixelsCount = 0;
      for (let i = 0; i < imgData.length; i += 4) {
        // Check if pixel is black
        if (imgData[i] === 0 && imgData[i + 1] === 0 && imgData[i + 2] === 0 && (imgData[i + 3] === 255 || imgData[i + 3] === 0)) {
          blackPixelsCount += 1;
        }
      }

      const totalPixels = target.width * target.height;
      const blackPixelRatio = blackPixelsCount / totalPixels;
      resolve(blackPixelRatio);
    };
    img.onerror = (e) => {
      console.error('Image loading error:', e);
      reject(e);
    };
  });
}
