import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, Loader2, ArrowLeft, MapPin, ChevronRight, CreditCard, CheckCircle } from 'lucide-react';
import { orderAPI } from '../services/api';
import { useAppDispatch, useAppSelector } from '../store';
import { setCart } from '../store/slices/cartSlice';
import { formatCurrency, getProductImage } from '../utils';
import { pageVariants, slideUp, staggerContainer, staggerItem, buttonTap } from '../utils/motion';
import toast from 'react-hot-toast';

type Step = 'address' | 'review' | 'payment-instructions';

const CheckoutPage: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { cart } = useAppSelector((s) => s.cart);
  const [step, setStep] = useState<Step>('address');
  const [loading, setLoading] = useState(false);
  const [order, setOrder] = useState<any>(null);
  const [bankDetails, setBankDetails] = useState<any>(null);
  const [form, setForm] = useState({
    street: '', city: '', state: '', country: '', postalCode: '', notes: '',
  });

  const subtotal = cart?.items?.reduce((s, i) => s + i.price * i.quantity, 0) ?? 0;
  const shipping = subtotal >= 50 ? 0 : 9.99;
  const tax = subtotal * 0.08;
  const total = subtotal + shipping + tax;

  const handlePlaceOrder = async () => {
    setLoading(true);
    try {
      // Fetch bank details first
      const bdRes = await orderAPI.getBankDetails();
      setBankDetails(bdRes.data.data);

      const res = await orderAPI.createCheckout({
        shippingAddress: {
          street: form.street, city: form.city,
          state: form.state, country: form.country, postalCode: form.postalCode,
        },
        notes: form.notes,
      });
      setOrder(res.data.data);
      dispatch(setCart({ items: [], totalAmount: 0 } as any));
      setStep('payment-instructions');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to place order');
    } finally { setLoading(false); }
  };

  if (!cart?.items?.length && !order) return (
    <div className="page-container pt-28 pb-20 text-center">
      <p className="mb-4 text-slate-500">Your cart is empty.</p>
      <Link to="/products" className="btn-primary inline-flex">Browse Products</Link>
    </div>
  );

  return (
    <motion.div variants={pageVariants} initial="initial" animate="animate" className="page-container pt-28 pb-16">
      {/* Breadcrumb + steps */}
      <nav className="mb-6 flex items-center gap-2 text-xs font-semibold text-slate-500">
        <Link to="/" className="hover:text-brand-dark dark:hover:text-brand-primary">Home</Link>
        <span>/</span>
        <Link to="/cart" className="hover:text-brand-dark dark:hover:text-brand-primary">Cart</Link>
        <span>/</span>
        <span className="font-medium text-slate-900 dark:text-white">Checkout</span>
      </nav>

      {/* Step indicator */}
      <div className="flex items-center gap-0 mb-8 max-w-md">
        {(['address', 'review', 'payment-instructions'] as Step[]).map((s, i) => {
          const labels = ['Address', 'Review', 'Payment'];
          const idx = ['address', 'review', 'payment-instructions'].indexOf(step);
          const done = i < idx;
          const active = s === step;
          return (
            <React.Fragment key={s}>
              <div className="flex items-center gap-2">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  done ? 'bg-brand-primary text-white' : active ? 'bg-brand-primary text-white ring-4 ring-brand-primary/10' : 'bg-slate-100 text-slate-400'
                }`}>
                  {done ? <CheckCircle className="w-4 h-4" /> : i + 1}
                </div>
                <span className={`text-[12px] font-semibold ${active ? 'text-brand-dark dark:text-brand-primary' : done ? 'text-slate-600 dark:text-slate-300' : 'text-slate-400'}`}>{labels[i]}</span>
              </div>
              {i < 2 && <div className={`mx-2 h-0.5 flex-1 ${done ? 'bg-brand-primary' : 'bg-slate-200 dark:bg-white/10'}`} />}
            </React.Fragment>
          );
        })}
      </div>

      <AnimatePresence mode="wait">
        {step === 'address' && (
          <motion.div key="address" variants={slideUp} initial="initial" animate="animate"
            className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6">
            <div className="surface rounded-2xl p-6">
              <h2 className="mb-5 flex items-center gap-2 text-base font-bold text-slate-950 dark:text-white">
                <MapPin className="h-5 w-5 text-brand-dark dark:text-brand-primary" /> Shipping Address
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="label text-[12px]">Street address</label>
                  <input required value={form.street} onChange={(e) => setForm({ ...form, street: e.target.value })}
                    placeholder="123 Main Street" className="input text-[13px]" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label text-[12px]">City</label>
                    <input required value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })}
                      placeholder="New York" className="input text-[13px]" />
                  </div>
                  <div>
                    <label className="label text-[12px]">State</label>
                    <input value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })}
                      placeholder="NY" className="input text-[13px]" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label text-[12px]">Country</label>
                    <input required value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })}
                      placeholder="United States" className="input text-[13px]" />
                  </div>
                  <div>
                    <label className="label text-[12px]">Postal code</label>
                    <input value={form.postalCode} onChange={(e) => setForm({ ...form, postalCode: e.target.value })}
                      placeholder="10001" className="input text-[13px]" />
                  </div>
                </div>
                <div>
                  <label className="label text-[12px]">Order notes (optional)</label>
                  <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })}
                    rows={2} placeholder="Any special instructions..." className="input text-[13px] resize-none" />
                </div>
              </div>
              <motion.button
                onClick={() => { if (!form.street || !form.city || !form.country) { toast.error('Fill all required fields'); return; } setStep('review'); }}
                className="btn-primary w-full py-3 mt-5 text-[13px]"
                whileHover={{ scale: 1.01 }} whileTap={buttonTap}
              >
                Continue to Review <ChevronRight className="w-4 h-4" />
              </motion.button>
            </div>

            {/* Mini order summary */}
            <div className="surface h-fit rounded-2xl p-5">
              <h3 className="mb-4 text-sm font-bold text-slate-950 dark:text-white">Order Summary</h3>
              <div className="space-y-2 text-[13px]">
                <div className="flex justify-between text-slate-600"><span>Subtotal</span><span className="font-medium">{formatCurrency(subtotal)}</span></div>
                <div className="flex justify-between text-slate-600"><span>Shipping</span><span className={`font-medium ${shipping === 0 ? 'text-green-600' : ''}`}>{shipping === 0 ? 'Free' : formatCurrency(shipping)}</span></div>
                <div className="flex justify-between text-slate-600"><span>Tax (8%)</span><span className="font-medium">{formatCurrency(tax)}</span></div>
                <div className="flex justify-between font-bold text-slate-900 text-[15px] pt-2 border-t border-slate-100">
                  <span>Total</span><span>{formatCurrency(total)}</span>
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100">
                <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                  <CreditCard className="w-3.5 h-3.5" /> Manual bank transfer
                </div>
                <p className="text-[11px] text-slate-400 mt-1">Bank details shown after order placement</p>
              </div>
            </div>
          </motion.div>
        )}

        {step === 'review' && (
          <motion.div key="review" variants={slideUp} initial="initial" animate="animate"
            className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6">
            <div className="space-y-4">
              <div className="surface rounded-2xl p-5">
                <h2 className="text-[15px] font-bold text-slate-900 mb-4">Review Your Order</h2>
                <motion.div variants={staggerContainer} initial="initial" animate="animate" className="space-y-3">
                  {cart?.items?.map((item) => (
                    <motion.div key={item._id} variants={staggerItem} className="flex gap-3 items-center">
                      <img src={getProductImage(item.product.images)} alt={item.product.name}
                        className="w-14 h-14 rounded-xl object-cover bg-slate-100 border border-slate-200 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-semibold text-slate-800 truncate">{item.product.name}</p>
                        <p className="text-[12px] text-slate-500">Qty: {item.quantity}</p>
                      </div>
                      <p className="text-[13px] font-bold text-slate-900 flex-shrink-0">{formatCurrency(item.price * item.quantity)}</p>
                    </motion.div>
                  ))}
                </motion.div>
              </div>

              <div className="surface-muted rounded-2xl p-4">
                <h3 className="mb-2 flex items-center gap-2 text-[13px] font-bold text-slate-700 dark:text-slate-200">
                  <MapPin className="h-4 w-4 text-brand-dark dark:text-brand-primary" /> Shipping to
                </h3>
                <p className="text-[13px] text-slate-600">{form.street}, {form.city}{form.state ? `, ${form.state}` : ''}, {form.country} {form.postalCode}</p>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                <h3 className="text-[13px] font-bold text-amber-800 mb-1">Payment Method: Manual Bank Transfer</h3>
                <p className="text-[12px] text-amber-700">After placing your order, you will receive bank account details to complete your payment. Please upload your proof of payment within 24 hours.</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="surface h-fit rounded-2xl p-5">
                <h3 className="text-[14px] font-bold text-slate-900 mb-4">Order Total</h3>
                <div className="space-y-2 text-[13px]">
                  <div className="flex justify-between text-slate-600"><span>Subtotal</span><span>{formatCurrency(subtotal)}</span></div>
                  <div className="flex justify-between text-slate-600"><span>Shipping</span><span className={shipping === 0 ? 'text-green-600 font-medium' : ''}>{shipping === 0 ? 'Free' : formatCurrency(shipping)}</span></div>
                  <div className="flex justify-between text-slate-600"><span>Tax</span><span>{formatCurrency(tax)}</span></div>
                  <div className="flex justify-between font-bold text-[15px] text-slate-900 pt-2 border-t border-slate-100">
                    <span>Total</span><span>{formatCurrency(total)}</span>
                  </div>
                </div>
                <motion.button onClick={handlePlaceOrder} disabled={loading}
                  className="btn-primary w-full py-3 mt-4 text-[13px] disabled:opacity-60"
                  whileHover={{ scale: 1.01 }} whileTap={buttonTap}>
                  {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Placing Order...</> : `Place Order — ${formatCurrency(total)}`}
                </motion.button>
                <div className="flex items-center gap-1.5 justify-center mt-3">
                  <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
                  <p className="text-[11px] text-slate-500">Secure & encrypted</p>
                </div>
              </div>
              <button onClick={() => setStep('address')} className="w-full text-[12px] text-slate-500 hover:text-slate-700 flex items-center justify-center gap-1">
                <ArrowLeft className="w-3.5 h-3.5" /> Edit Address
              </button>
            </div>
          </motion.div>
        )}

        {step === 'payment-instructions' && order && (
          <motion.div key="payment" variants={slideUp} initial="initial" animate="animate"
            className="max-w-xl mx-auto">
            <div className="text-center mb-6">
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 200, delay: 0.1 }}
                className="w-16 h-16 bg-green-100 border-2 border-green-200 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </motion.div>
              <h2 className="text-xl font-extrabold text-slate-900 mb-1">Order Placed!</h2>
              <p className="text-[13px] text-slate-500">Order <span className="font-bold text-slate-700">#{order.orderNumber}</span></p>
            </div>

            {/* Bank details */}
            <motion.div variants={staggerContainer} initial="initial" animate="animate" className="space-y-4">
              <motion.div variants={staggerItem} className="surface rounded-2xl p-5">
                <h3 className="text-[14px] font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-green-600" /> Bank Transfer Details
                </h3>
                {bankDetails?.accounts?.map((account: any) => (
                  <div key={account.id} className="space-y-3">
                    {[
                      { label: 'Bank Name', value: account.bankName },
                      { label: 'Account Name', value: account.accountName },
                      { label: 'Account Number', value: account.accountNumber },
                      ...(account.routingNumber ? [{ label: 'Routing Number', value: account.routingNumber }] : []),
                      ...(account.swiftCode ? [{ label: 'SWIFT Code', value: account.swiftCode }] : []),
                      { label: 'Amount to Pay', value: formatCurrency(order.total), highlight: true },
                      { label: 'Reference', value: order.orderNumber, highlight: true },
                    ].map(({ label, value, highlight }) => (
                      <div key={label} className={`flex justify-between items-center py-2 border-b border-slate-100 last:border-0 ${highlight ? 'font-bold' : ''}`}>
                        <span className="text-[12px] text-slate-500">{label}</span>
                        <span className={`text-[13px] ${highlight ? 'text-green-600' : 'text-slate-800'} font-semibold select-all`}>{value}</span>
                      </div>
                    ))}
                  </div>
                ))}
                {bankDetails?.accounts?.[0]?.instructions && (
                  <div className="mt-4 p-3 bg-amber-50 border border-amber-100 rounded-lg">
                    <p className="text-[12px] text-amber-700">{bankDetails.accounts[0].instructions}</p>
                  </div>
                )}
              </motion.div>

              {/* Upload proof */}
              <motion.div variants={staggerItem}>
                <PaymentProofUpload orderId={order._id} orderNumber={order.orderNumber} />
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// ─── Payment Proof Upload Component ──────────────────────────────────────────
const PaymentProofUpload: React.FC<{ orderId: string; orderNumber: string }> = ({ orderId, orderNumber }) => {
  const navigate = useNavigate();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploaded, setUploaded] = useState(false);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 5 * 1024 * 1024) { toast.error('File too large (max 5MB)'); return; }
    setFile(f);
    setPreview(URL.createObjectURL(f));
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('proof', file);
      await orderAPI.uploadPaymentProof(orderId, formData);
      setUploaded(true);
      toast.success('Payment proof uploaded. Awaiting confirmation.');
    } catch { toast.error('Upload failed. Please try again.'); }
    finally { setUploading(false); }
  };

  if (uploaded) return (
    <div className="bg-green-50 border border-green-200 rounded-xl p-5 text-center">
      <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
      <p className="text-[14px] font-bold text-green-800 mb-1">Proof Uploaded</p>
      <p className="text-[12px] text-green-700 mb-4">We will confirm your payment within 24 hours.</p>
      <button onClick={() => navigate('/orders')} className="btn-primary btn-sm">View My Orders</button>
    </div>
  );

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5">
      <h3 className="text-[14px] font-bold text-slate-900 mb-3">Upload Payment Proof</h3>
      <p className="text-[12px] text-slate-500 mb-4">Upload a screenshot or photo of your bank transfer. Accepted: JPG, PNG, PDF (max 5MB).</p>

      <label className={`flex flex-col items-center justify-center border-2 border-dashed rounded-xl p-6 cursor-pointer transition-all ${preview ? 'border-green-300 bg-green-50' : 'border-slate-200 bg-slate-50 hover:border-green-300 hover:bg-green-50/50'}`}>
        <input type="file" accept="image/jpeg,image/png,image/webp,application/pdf" className="hidden" onChange={handleFile} />
        {preview ? (
          <img src={preview} alt="Preview" className="max-h-40 object-contain rounded-lg mb-2" />
        ) : (
          <>
            <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center mb-3">
              <CreditCard className="w-6 h-6 text-slate-400" />
            </div>
            <p className="text-[13px] font-semibold text-slate-700">Click to upload proof</p>
            <p className="text-[11px] text-slate-400 mt-1">JPG, PNG, PDF up to 5MB</p>
          </>
        )}
      </label>

      {file && !uploaded && (
        <motion.button
          onClick={handleUpload} disabled={uploading}
          className="btn-primary w-full py-2.5 mt-3 text-[13px] disabled:opacity-60"
          whileHover={{ scale: 1.01 }} whileTap={buttonTap}
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
        >
          {uploading ? <><Loader2 className="w-4 h-4 animate-spin" /> Uploading...</> : 'Submit Payment Proof'}
        </motion.button>
      )}

      <p className="text-[11px] text-slate-400 text-center mt-3">
        You can also upload later from{' '}
        <button onClick={() => navigate('/orders')} className="text-green-600 underline">My Orders</button>
      </p>
    </div>
  );
};

export default CheckoutPage;
export { PaymentProofUpload, CheckoutPage };
