import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { ArrowLeft, Package, CreditCard, CheckCircle, XCircle, Clock, Truck, Loader2, Upload } from 'lucide-react';
import { orderAPI } from '../services/api';
import { formatCurrency, formatDate, formatDateTime, getProductImage } from '../utils';
import { pageVariants, staggerContainer, staggerItem, buttonTap } from '../utils/motion';
import toast from 'react-hot-toast';

const PAYMENT_STATUS_STYLES: Record<string, { label: string; cls: string; icon: React.ReactNode }> = {
  awaiting_confirmation: { label: 'Awaiting Confirmation', cls: 'bg-amber-50 text-amber-700 border-amber-200', icon: <Clock className="w-3.5 h-3.5" /> },
  confirmed:             { label: 'Confirmed',             cls: 'bg-green-50 text-green-700 border-green-200', icon: <CheckCircle className="w-3.5 h-3.5" /> },
  paid:                  { label: 'Paid',                  cls: 'bg-green-50 text-green-700 border-green-200', icon: <CheckCircle className="w-3.5 h-3.5" /> },
  rejected:              { label: 'Rejected',              cls: 'bg-red-50 text-red-600 border-red-200',       icon: <XCircle className="w-3.5 h-3.5" /> },
  pending:               { label: 'Pending',               cls: 'bg-slate-50 text-slate-600 border-slate-200', icon: <Clock className="w-3.5 h-3.5" /> },
};

const ORDER_STATUS_STYLES: Record<string, string> = {
  pending:    'bg-amber-50 text-amber-700 border border-amber-200',
  confirmed:  'bg-blue-50 text-blue-700 border border-blue-200',
  processing: 'bg-indigo-50 text-indigo-700 border border-indigo-200',
  shipped:    'bg-violet-50 text-violet-700 border border-violet-200',
  delivered:  'bg-green-50 text-green-700 border border-green-200',
  cancelled:  'bg-red-50 text-red-600 border border-red-200',
};

const OrderDetailPage: React.FC = () => {
  const { orderNumber } = useParams<{ orderNumber: string }>();
  const qc = useQueryClient();
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [proofPreview, setProofPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const { data: order, isLoading } = useQuery({
    queryKey: ['order', orderNumber],
    queryFn: () => orderAPI.getOrderByNumber(orderNumber!).then((r) => r.data.data),
    enabled: !!orderNumber,
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 5 * 1024 * 1024) { toast.error('Max 5MB'); return; }
    setProofFile(f);
    setProofPreview(URL.createObjectURL(f));
  };

  const handleUploadProof = async () => {
    if (!proofFile || !order) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('proof', proofFile);
      await orderAPI.uploadPaymentProof(order._id, fd);
      qc.invalidateQueries({ queryKey: ['order', orderNumber] });
      toast.success('Payment proof uploaded');
      setProofFile(null);
      setProofPreview(null);
    } catch { toast.error('Upload failed'); }
    finally { setUploading(false); }
  };

  if (isLoading) return <div className="page-container pt-28 pb-16"><div className="skeleton mx-auto h-96 max-w-3xl" /></div>;

  if (!order) return (
    <div className="page-container pt-28 pb-20 text-center">
      <p className="text-slate-500 mb-4">Order not found.</p>
      <Link to="/orders" className="btn-primary inline-flex">My Orders</Link>
    </div>
  );

  const paymentStatusInfo = PAYMENT_STATUS_STYLES[order.paymentStatus] || PAYMENT_STATUS_STYLES.pending;
  const canUploadProof = order.paymentMethod === 'manual' && ['awaiting_confirmation', 'rejected', 'pending'].includes(order.paymentStatus) && order.status !== 'cancelled';

  return (
    <motion.div variants={pageVariants} initial="initial" animate="animate"
      className="page-container pt-28 pb-16">
      <div className="mx-auto max-w-3xl">
      <Link to="/orders" className="mb-6 inline-flex items-center gap-1.5 text-[13px] font-semibold text-slate-500 transition-colors hover:text-brand-dark">
        <ArrowLeft className="w-4 h-4" /> Back to Orders
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-6 flex-wrap">
        <div>
          <p className="eyebrow mb-2">Order details</p>
          <h1 className="heading-1">{order.orderNumber}</h1>
          <p className="mt-2 text-sm text-slate-500">Placed {formatDate(order.createdAt)}</p>
        </div>
        <span className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-semibold border ${ORDER_STATUS_STYLES[order.status] || ORDER_STATUS_STYLES.pending}`}>
          {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
        </span>
      </div>

      <motion.div variants={staggerContainer} initial="initial" animate="animate" className="space-y-4">
        {/* Payment status banner */}
        {order.paymentMethod === 'manual' && (
          <motion.div variants={staggerItem}
            className={`rounded-2xl border p-4 shadow-soft ${paymentStatusInfo.cls}`}>
            <div className="flex items-center gap-3">
            <div className="flex-shrink-0">{paymentStatusInfo.icon}</div>
            <div className="flex-1">
              <p className="text-[13px] font-bold">Payment: {paymentStatusInfo.label}</p>
              {order.paymentStatus === 'rejected' && order.paymentRejectionReason && (
                <p className="text-[12px] mt-0.5 opacity-80">Reason: {order.paymentRejectionReason}</p>
              )}
              {order.paymentStatus === 'awaiting_confirmation' && (
                <p className="text-[12px] mt-0.5 opacity-80">We are reviewing your payment. Usually within 24 hours.</p>
              )}
            </div>
            </div>
          </motion.div>
        )}

        {/* Upload proof panel */}
        {canUploadProof && (
          <motion.div variants={staggerItem} className="surface rounded-2xl p-5">
            <h3 className="text-[14px] font-bold text-slate-900 mb-3 flex items-center gap-2">
              <Upload className="w-4 h-4 text-brand-dark" />
              {order.paymentProof ? 'Re-upload Payment Proof' : 'Upload Payment Proof'}
            </h3>
            {order.paymentProof && (
              <div className="mb-3 flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <div>
                  <p className="text-[12px] font-medium text-slate-700">Proof uploaded {order.paymentProofUploadedAt ? formatDate(order.paymentProofUploadedAt) : ''}</p>
                  {order.paymentProof.match(/\.(jpg|jpeg|png|webp)$/i) && (
                    <a href={order.paymentProof} target="_blank" rel="noreferrer" className="text-[11px] text-green-600 underline">View image</a>
                  )}
                </div>
              </div>
            )}
            <label className={`flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-5 transition-all ${proofPreview ? 'border-brand-primary bg-brand-primary/10' : 'border-slate-200 bg-slate-50 hover:border-brand-primary/50'}`}>
              <input type="file" accept="image/*,application/pdf" className="hidden" onChange={handleFileSelect} />
              {proofPreview ? (
                <img src={proofPreview} alt="Preview" className="max-h-32 object-contain rounded-lg" />
              ) : (
                <>
                  <CreditCard className="w-8 h-8 text-slate-300 mb-2" />
                  <p className="text-[12px] font-semibold text-slate-600">Click to select file</p>
                  <p className="text-[11px] text-slate-400">JPG, PNG, PDF — max 5MB</p>
                </>
              )}
            </label>
            {proofFile && (
              <motion.button onClick={handleUploadProof} disabled={uploading}
                className="btn-primary w-full py-2.5 mt-3 text-[13px] disabled:opacity-60"
                initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                whileTap={buttonTap}>
                {uploading ? <><Loader2 className="w-4 h-4 animate-spin" /> Uploading...</> : 'Upload Proof'}
              </motion.button>
            )}
          </motion.div>
        )}

        {/* Items */}
        <motion.div variants={staggerItem} className="surface rounded-2xl p-5">
          <h3 className="text-[14px] font-bold text-slate-900 mb-4">Items</h3>
          <div className="space-y-3">
            {order.items?.map((item: any, i: number) => (
              <div key={i} className="flex gap-3 items-center">
                <img src={getProductImage(item.product?.images)} alt={item.name} loading="lazy"
                  className="w-14 h-14 rounded-xl object-cover bg-slate-100 border border-slate-200 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-semibold text-slate-800 truncate">{item.name}</p>
                  <p className="text-[12px] text-slate-500">Qty: {item.quantity}</p>
                </div>
                <p className="text-[13px] font-bold text-slate-900 flex-shrink-0">{formatCurrency(item.price * item.quantity)}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Summary */}
        <motion.div variants={staggerItem} className="surface rounded-2xl p-5">
          <h3 className="text-[14px] font-bold text-slate-900 mb-4">Order Summary</h3>
          <div className="space-y-2 text-[13px]">
            <div className="flex justify-between text-slate-600"><span>Subtotal</span><span>{formatCurrency(order.subtotal)}</span></div>
            <div className="flex justify-between text-slate-600"><span>Shipping</span><span>{order.shippingFee === 0 ? <span className="font-medium text-emerald-600">Free</span> : formatCurrency(order.shippingFee)}</span></div>
            <div className="flex justify-between text-slate-600"><span>Tax</span><span>{formatCurrency(order.tax)}</span></div>
            {order.discount > 0 && <div className="flex justify-between text-green-600"><span>Discount</span><span>-{formatCurrency(order.discount)}</span></div>}
            <div className="flex justify-between font-bold text-slate-900 text-[15px] pt-2 border-t border-slate-100">
              <span>Total</span><span>{formatCurrency(order.total)}</span>
            </div>
          </div>
        </motion.div>
      </motion.div>
      </div>
    </motion.div>
  );
};

export default OrderDetailPage;
