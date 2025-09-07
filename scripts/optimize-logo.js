import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function optimizeLogo() {
  const inputPath = path.join(__dirname, '../public/logo.png');
  const outputPath = path.join(__dirname, '../public/logo_optimized.png');

  try {
    // 檢查輸入文件是否存在
    if (!fs.existsSync(inputPath)) {
      console.error('Logo file not found:', inputPath);
      return;
    }

    // 獲取原始文件大小
    const originalStats = fs.statSync(inputPath);
    console.log(`Original size: ${Math.round(originalStats.size / 1024)} KB`);

    // 壓縮圖片
    await sharp(inputPath)
      .resize(128, 128, {
        fit: 'contain',
        background: { r: 255, g: 255, b: 255, alpha: 0 }
      })
      .png({
        quality: 85,
        compressionLevel: 9
      })
      .toFile(outputPath);

    // 獲取壓縮後的文件大小
    const optimizedStats = fs.statSync(outputPath);
    console.log(`Optimized size: ${Math.round(optimizedStats.size / 1024)} KB`);
    console.log(`Compression ratio: ${Math.round((1 - optimizedStats.size / originalStats.size) * 100)}%`);

    console.log('✅ Logo optimization completed!');
    console.log('📁 Optimized logo saved as: public/logo_optimized.png');

  } catch (error) {
    console.error('❌ Error optimizing logo:', error);
  }
}

optimizeLogo();
