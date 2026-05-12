import { v2 as cloudinary } from 'cloudinary';
import multer from 'multer';
import { CloudinaryStorage } from 'multer-storage-cloudinary';

cloudinary.config({
  cloud_name:  process.env.CLOUDINARY_CLOUD_NAME!,
  api_key:     process.env.CLOUDINARY_API_KEY!,
  api_secret:  process.env.CLOUDINARY_API_SECRET!,
});

const createStorage = (folder: string) =>
  new CloudinaryStorage({
    cloudinary,
    params: {
      folder: `flow/${folder}`,
      allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
      resource_type: 'auto',
    } as Record<string, unknown>,
  });

// Product images
export const uploadProductImages = multer({
  storage: createStorage('products'),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    cb(null, ['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype));
  },
});

// User avatars
export const uploadAvatar = multer({
  storage: createStorage('avatars'),
  limits: { fileSize: 2 * 1024 * 1024 },
});

// Payment proof (image or PDF)
export const uploadPaymentProof = multer({
  storage: new CloudinaryStorage({
    cloudinary,
    params: {
      folder: 'flow/payment-proofs',
      allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'pdf'],
      resource_type: 'auto',
    } as Record<string, unknown>,
  }),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    cb(null, allowed.includes(file.mimetype));
  },
});

// Category images
export const uploadCategoryImage = multer({
  storage: createStorage('categories'),
  limits: { fileSize: 2 * 1024 * 1024 },
});

// Delete a Cloudinary asset
export const deleteCloudinaryImage = async (publicId: string): Promise<void> => {
  if (!publicId) return;
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch { /* non-fatal */ }
};
