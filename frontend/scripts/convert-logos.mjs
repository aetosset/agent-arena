import sharp from 'sharp';
import { readdir } from 'fs/promises';
import { join } from 'path';

const LOGOS_DIR = './public/logos';

async function removeWhiteBackground(inputPath, outputPath) {
  const image = sharp(inputPath);
  const { data, info } = await image
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { width, height, channels } = info;
  
  // Create a new buffer with alpha channel
  const newData = Buffer.alloc(width * height * 4);
  
  for (let i = 0; i < width * height; i++) {
    const srcIdx = i * channels;
    const dstIdx = i * 4;
    
    const r = data[srcIdx];
    const g = data[srcIdx + 1];
    const b = data[srcIdx + 2];
    
    // Copy RGB
    newData[dstIdx] = r;
    newData[dstIdx + 1] = g;
    newData[dstIdx + 2] = b;
    
    // Set alpha: if pixel is white (or near white), make transparent
    const isWhite = r > 250 && g > 250 && b > 250;
    newData[dstIdx + 3] = isWhite ? 0 : 255;
  }
  
  await sharp(newData, {
    raw: {
      width,
      height,
      channels: 4
    }
  })
    .png()
    .toFile(outputPath);
  
  console.log(`Converted: ${inputPath} -> ${outputPath}`);
}

async function main() {
  const files = await readdir(LOGOS_DIR);
  const jpgFiles = files.filter(f => f.endsWith('.jpg'));
  
  for (const file of jpgFiles) {
    const inputPath = join(LOGOS_DIR, file);
    const outputPath = join(LOGOS_DIR, file.replace('.jpg', '.png'));
    await removeWhiteBackground(inputPath, outputPath);
  }
  
  console.log('Done! Now update theme.ts to use .png extensions');
}

main().catch(console.error);
