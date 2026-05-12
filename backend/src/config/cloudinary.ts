import { v2 as cloudinary } from 'cloudinary';
import multer from 'multer';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import path from 'path';
import fs from 'fs';

const CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME;
const CLOUD_KEY = process.env.CLOUDINARY_API_KEY;
const CLOUD_SECRET = process.env.CLOUDINARY_API_SECRET;

const uploadsRoot = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsRoot)) fs.mkdirSync(uploadsRoot, { recursive: true });

let cloudinaryEnabled = false;
if (CLOUD_NAME && CLOUD_KEY && CLOUD_SECRET) {
  cloudinary.config({
    cloud_name: CLOUD_NAME,
    api_key: CLOUD_KEY,
    api_secret: CLOUD_SECRET,
  });
  cloudinaryEnabled = true;
}

const diskStorageFor = (folder: string) => multer.diskStorage({
  destination: (_req, _file, cb) => {
    const dest = path.join(uploadsRoot, folder);
    if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
    cb(null, dest);
  },
  filename: (_req, file, cb) => {
    const name = `${Date.now()}-${file.originalname.replace(/[^a-zA-Z0-9._-]/g, '')}`;
    cb(null, name);
  },
});

const createCloudinaryStorage = (folder: string) => new CloudinaryStorage({
  cloudinary,
  params: {
    folder: `flow/${folder}`,
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'pdf'],
    resource_type: 'auto',
  } as Record<string, unknown>,
});

const createStorage = (folder: string) => (cloudinaryEnabled ? createCloudinaryStorage(folder) : diskStorageFor(folder));

export const uploadProductImages = multer({
  storage: createStorage('products'),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    cb(null, ['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype));
  },
});

export const uploadAvatar = multer({
  storage: createStorage('avatars'),
  limits: { fileSize: 2 * 1024 * 1024 },
});

export const uploadPaymentProof = multer({
  storage: createStorage('payment-proofs'),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    cb(null, allowed.includes(file.mimetype));
  },
});

export const uploadCategoryImage = multer({
  storage: createStorage('categories'),
  limits: { fileSize: 2 * 1024 * 1024 },
});

export const isCloudinaryEnabled = (): boolean => cloudinaryEnabled;

export const deleteCloudinaryImage = async (publicId: string): Promise<void> => {
  if (!publicId) return;
  try {
    if (cloudinaryEnabled) {
      await cloudinary.uploader.destroy(publicId);
    } else {
      // If using disk fallback, `publicId` may be the filename; attempt to delete from uploads
      const files = fs.readdirSync(uploadsRoot, { withFileTypes: true });
      // Try to find the file in subfolders
      for (const dirent of files) {
        if (dirent.isDirectory()) {
          const candidate = path.join(uploadsRoot, dirent.name, publicId);
          if (fs.existsSync(candidate)) {
            try { fs.unlinkSync(candidate); } catch {};
            return;
          }
        }
      }
    }
  } catch { /* non-fatal */ }
};
