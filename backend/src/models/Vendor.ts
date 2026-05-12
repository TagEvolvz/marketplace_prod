import mongoose, { Schema } from 'mongoose';

const VendorSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    storeName: { type: String, required: true },
    storeSlug: { type: String, required: true, unique: true },
    description: String,
    businessEmail: String,
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  },
  { timestamps: true }
);

export const Vendor = mongoose.model('Vendor', VendorSchema);
export default Vendor;
