import sharp from "sharp";
import path from "path";
import fs from "fs";

export interface ImageProcessingOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  format?: 'jpeg' | 'png' | 'webp';
}

export async function processProductImage(
  filePath: string,
  options: ImageProcessingOptions = {}
): Promise<void> {
  const {
    maxWidth = 1200,
    maxHeight = 1200,
    quality = 85,
    format = 'webp'
  } = options;

  try {
    const image = sharp(filePath);
    const metadata = await image.metadata();

    let processedImage = image;

    if (metadata.width && metadata.height) {
      if (metadata.width > maxWidth || metadata.height > maxHeight) {
        processedImage = processedImage.resize(maxWidth, maxHeight, {
          fit: 'inside',
          withoutEnlargement: true,
        });
      }
    }

    processedImage = processedImage[format]({ quality });

    const dir = path.dirname(filePath);
    const ext = path.extname(filePath);
    const basename = path.basename(filePath, ext);
    const newFilePath = path.join(dir, `${basename}.${format}`);

    await processedImage.toFile(newFilePath);

    if (filePath !== newFilePath && fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    return;
  } catch (error) {
    console.error('Error processing image:', error);
    throw new Error('Не удалось обработать изображение');
  }
}

export async function processChatImage(
  filePath: string,
  options: ImageProcessingOptions = {}
): Promise<void> {
  const {
    maxWidth = 800,
    maxHeight = 800,
    quality = 80,
    format = 'webp'
  } = options;

  return processProductImage(filePath, { maxWidth, maxHeight, quality, format });
}
