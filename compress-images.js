import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const directories = [
  'public/img',
  'public/Logo_N_Galaxy_Fill_Space',
  'public/remembrance/photos'
];

const MAX_SIZE_BYTES = 2 * 1024 * 1024; // 2MB target

async function compressImage(filePath) {
  try {
    const stats = fs.statSync(filePath);
    if (stats.size > MAX_SIZE_BYTES) {
      const buffer = fs.readFileSync(filePath);
      const image = sharp(buffer);
      const metadata = await image.metadata();
      
      // Reduce quality to keep under 2MB
      let quality = 80;
      let outputBuffer;
      
      for (let q = quality; q >= 20; q -= 20) {
        outputBuffer = await image.jpeg({ quality: q }).toBuffer();
        if (outputBuffer.length < MAX_SIZE_BYTES) break;
        quality = q;
      }
      
      fs.writeFileSync(filePath, outputBuffer);
      console.log(`Compressed: ${filePath} (${stats.size} -> ${outputBuffer.length} bytes)`);
    }
  } catch (err) {
    console.error(`Error compressing ${filePath}:`, err.message);
  }
}

async function processDirectory(dir) {
  if (!fs.existsSync(dir)) return;
  
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.png') || f.endsWith('.jpg') || f.endsWith('.jpeg'));
  for (const file of files) {
    await compressImage(path.join(dir, file));
  }
}

async function main() {
  for (const dir of directories) {
    await processDirectory(dir);
  }
  console.log('Image compression complete!');
}

main();