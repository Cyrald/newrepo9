import sharp from "sharp";
import path from "path";
import fs from "fs/promises";
import { randomUUID } from "crypto";

export interface ImageProcessingOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  format?: 'jpeg' | 'png' | 'webp';
}

export interface ProcessedImage {
  filename: string;
  path: string;
  url: string;
}

const UPLOADS_DIR = "uploads";
const PRODUCTS_DIR = path.join(UPLOADS_DIR, "products");
const TEMP_DIR = path.join(UPLOADS_DIR, "temp");

async function ensureDirectories() {
  const dirs = [UPLOADS_DIR, PRODUCTS_DIR, TEMP_DIR];
  for (const dir of dirs) {
    try {
      await fs.access(dir);
    } catch {
      await fs.mkdir(dir, { recursive: true });
    }
  }
}

export async function validateImageFile(filePath: string): Promise<void> {
  try {
    const metadata = await sharp(filePath).metadata();
    
    if (!metadata.format) {
      throw new Error("Не удалось определить формат изображения");
    }
    
    const allowedFormats = ['jpeg', 'jpg', 'png', 'webp'];
    if (!allowedFormats.includes(metadata.format)) {
      throw new Error(`Неподдерживаемый формат изображения: ${metadata.format}`);
    }
    
    if (metadata.width && metadata.width > 10000) {
      throw new Error("Изображение слишком широкое (максимум 10000px)");
    }
    
    if (metadata.height && metadata.height > 10000) {
      throw new Error("Изображение слишком высокое (максимум 10000px)");
    }
  } catch (error: any) {
    if (error.message.includes("Input buffer")) {
      throw new Error("Файл повреждён или не является изображением");
    }
    throw error;
  }
}

export async function processProductImage(
  originalFilePath: string,
  options: ImageProcessingOptions = {}
): Promise<ProcessedImage> {
  await ensureDirectories();
  
  const {
    maxWidth = 1200,
    maxHeight = 1200,
    quality = 85,
    format = 'webp'
  } = options;

  let tempFile: string | null = null;
  
  try {
    await validateImageFile(originalFilePath);
    
    const uniqueFilename = `${Date.now()}-${randomUUID()}.${format}`;
    const tempFilePath = path.join(TEMP_DIR, uniqueFilename);
    const finalFilePath = path.join(PRODUCTS_DIR, uniqueFilename);
    
    tempFile = tempFilePath;
    
    const image = sharp(originalFilePath);
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
    
    await processedImage.toFile(tempFilePath);
    
    await fs.rename(tempFilePath, finalFilePath);
    tempFile = null;
    
    try {
      if (originalFilePath !== finalFilePath) {
        await fs.unlink(originalFilePath);
      }
    } catch (unlinkError) {
      console.warn(`Не удалось удалить исходный файл: ${originalFilePath}`, unlinkError);
    }

    return {
      filename: uniqueFilename,
      path: finalFilePath,
      url: `/uploads/products/${uniqueFilename}`,
    };
  } catch (error: any) {
    if (tempFile) {
      try {
        await fs.unlink(tempFile);
      } catch {}
    }
    
    try {
      await fs.unlink(originalFilePath);
    } catch {}
    
    console.error('Ошибка обработки изображения:', error);
    throw new Error(error.message || 'Не удалось обработать изображение');
  }
}

export async function processChatImage(
  originalFilePath: string,
  options: ImageProcessingOptions = {}
): Promise<ProcessedImage> {
  const {
    maxWidth = 800,
    maxHeight = 800,
    quality = 80,
    format = 'webp'
  } = options;

  return processProductImage(originalFilePath, { maxWidth, maxHeight, quality, format });
}

export async function deleteProductImage(filename: string): Promise<void> {
  try {
    const filePath = path.join(PRODUCTS_DIR, filename);
    await fs.unlink(filePath);
  } catch (error: any) {
    if (error.code !== 'ENOENT') {
      console.error(`Ошибка удаления изображения ${filename}:`, error);
      throw new Error('Не удалось удалить изображение');
    }
  }
}

ensureDirectories().catch(console.error);
