import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, CheckCircle, XCircle, Eye, Clock, CreditCard, Loader2, X, ExternalLink } from 'lucide-react';
import { adminAPI } from '../../services/api';
import { formatCurrency, formatDate } from '../../utils';
import { staggerContainer, staggerItem, buttonTap, scaleIn } from '../../utils/motion';
import toast from 'react-hot-toast';

const PAYMENT_STATUS: Record<string, { label: string; cls: string }> = {
  awaiting_confirmation: { label: 'Awaiting Proof',  cls: 'bg-amber-100 text-amber-700' },
  confirmed:             { label: 'Confirmed',        cls: 'bg-slate-100 text-slate-700' },
  paid:                  { label: 'Paid',             cls: 'bg-slate-100 text-slate-700' },
  rejected:              { label: 'Rejected',         cls: 'bg-red-100 text-red-600' },
  pending:               { label: 'Pending',          cls: 'bg-slate-100 text-slate-600' },
};

const ORDER_STATUS: Record<string, string> = {
  pending:    'bg-amber-100 text-amber-700',
  processing: 'bg-blue-100 text-blue-700',
  shipped:    'bg-violet-100 text-violet-700',
  delivered:  'bg-slate-100 text-slate-700',
  cancelled:  'bg-red-100 text-red-600',
};

interface RejectModalProps {
  orderId: string;
  orderNumber: string;
  onClose: () => void;
  onConfirm: (reason: string) => void;
  loading: boolean;
}

const RejectModal: React.FC<RejectModalProps> = ({ orderNumber, onClose, onConfirm, loading }) => {
  const [reason, setReason] = useState('');
  return (
    <motion.div variants={scaleIn} initial="initial" animate="animate" exit="exit"
      className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
        <h3 className="text-[15px] font-bold text-slate-900 mb-1">Reject Payment</h3>
        <p className="text-[12px] text-slate-500 mb-4">Order #{orderNumber}</p>
        <label className="label text-[12px]">Rejection reason (shown to customer)</label>
        <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={3}
          placeholder="e.g. Incorrect amount, blurry image, wrong reference..."
          className="input resize-none text-[13px] mb-4" />
        <div className="flex gap-3">
          <button onClick={onClose} className="btn-secondary flex-1 py-2.5 text-[13px]">Cancel</button>
          <button onClick={() => reason.trim() && onConfirm(reason)} disabled={!reason.trim() || loading}
            className="flex-1 btn-danger flex items-center justify-center gap-2 py-2.5 text-[13px] bg-red-500 hover:bg-red-600 text-white rounded-lg font-semibold transition-colors disabled:opacity-50">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
            Reject
          </button>
        </div>
      </div>
    </motion.div>
  );
};

const AdminOrders: React.FC = () => {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('');
  const [rejectTarget, setRejectTarget] = useState<{ id: string; number: string } | null>(null);
  const [proofModal, setProofModal] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-orders', paymentFilter],
    queryFn: () => adminAPI.getAllOrders({ paymentStatus: paymentFilter || undefined, limit: 50 }).then((r) => r.data.data),
  });

  const confirmMutation = useMutation({
    mutationFn: (orderId: string) => adminAPI.confirmPayment(orderId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-orders'] });
      toast.success('Payment confirmed');
    },
    onError: () => toast.error('Failed to confirm'),
  });

  const rejectMutation = useMutation({
    mutationFn: ({ orderId, reason }: { orderId: string; reason: string }) =>
      adminAPI.rejectPayment(orderId, reason),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-orders'] });
      setRejectTarget(null);
      toast.success('Payment rejected');
    },
    onError: () => toast.error('Failed to reject'),
  });

  const orders = (data?.data || data?.orders || data || []).filter((o: any) => {
    if (!search) return true;
    return o.orderNumber?.includes(search) || o.user?.email?.includes(search);
  });

  const pendingProofCount = (data?.data || data?.orders || data || []).filter((o: any) =>
    o.paymentStatus === 'awaiting_confirmation' && o.paymentProof
  ).length;

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="eyebrow mb-2">Fulfilment</p>
          <h1 className="heading-1">Orders</h1>
          {pendingProofCount > 0 && (
            <p className="mt-2 text-sm font-semibold text-amber-600">
              {pendingProofCount} order(s) awaiting payment review
            </p>
          )}
        </div>
        <div className="flex gap-2 flex-wrap">
          {['', 'awaiting_confirmation', 'confirmed', 'rejected'].map((s) => (
            <button key={s} onClick={() => setPaymentFilter(s)}
              className={`rounded-full border px-3 py-1.5 text-[12px] font-semibold transition-all ${
                paymentFilter === s ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
              }`}>
              {s === '' ? 'All' : s === 'awaiting_confirmation' ? 'Awaiting Review' : s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Search */}
      <div className="admin-card relative mb-5 p-3">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input type="text" placeholder="Search order number or email..." value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input pl-9 text-[13px]" />
      </div>

      {isLoading ? (
        <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="skeleton h-20 rounded-xl" />)}</div>
      ) : orders.length === 0 ? (
        <div className="surface-muted rounded-2xl border border-dashed border-slate-300 py-16 text-center">
          <p className="text-slate-500">No orders found.</p>
        </div>
      ) : (
        <motion.div variants={staggerContainer} initial="initial" animate="animate" className="space-y-2">
          {orders.map((order: any) => {
            const ps = PAYMENT_STATUS[order.paymentStatus] || PAYMENT_STATUS.pending;
            const needsAction = order.paymentProof && order.paymentStatus === 'awaiting_confirmation';
            return (
              <motion.div key={order._id} variants={staggerItem}
                className={`flex flex-wrap items-center gap-4 rounded-2xl border p-4 shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-lift ${needsAction ? 'border-amber-300 bg-amber-50/70' : 'border-slate-200 bg-white'}`}>
                {/* Order info */}
                <div className="flex-1 min-w-[180px]">
                  <div className="flex items-center gap-2 flex-wrap mb-0.5">
                    <span className="text-[13px] font-bold text-slate-900">{order.orderNumber}</span>
                    {needsAction && <span className="badge-amber text-[10px]">Action Required</span>}
                  </div>
                  <p className="text-[12px] text-slate-500">{order.user?.firstName} {order.user?.lastName} — {order.user?.email}</p>
                  <p className="text-[11px] text-slate-400">{formatDate(order.createdAt)}</p>
                </div>

                {/* Status */}
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold ${ORDER_STATUS[order.status] || 'bg-slate-100 text-slate-600'}`}>
                    {order.status}
                  </span>
                  <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold flex items-center gap-1 ${ps.cls}`}>
                    {ps.label}
                  </span>
                </div>

                {/* Total */}
                <span className="text-[14px] font-bold text-slate-900 w-20 text-right">{formatCurrency(order.total)}</span>

                {/* Actions */}
                <div className="flex items-center gap-2 flex-wrap">
                  {/* View proof */}
                  {order.paymentProof && (
                    <motion.button
                      onClick={() => setProofModal(order.paymentProof)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[12px] font-medium transition-colors"
                      whileTap={buttonTap}>
                      <Eye className="w-3.5 h-3.5" /> Proof
                    </motion.button>
                  )}

                  {/* Confirm */}
                  {needsAction && (
                    <motion.button
                      onClick={() => confirmMutation.mutate(order._id)}
                      disabled={confirmMutation.isPending}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-[12px] font-semibold transition-colors disabled:opacity-60"
                      whileTap={buttonTap}>
                      {confirmMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />}
                      Confirm
                    </motion.button>
                  )}

                  {/* Reject */}
                  {['awaiting_confirmation'].includes(order.paymentStatus) && (
                    <motion.button
                      onClick={() => setRejectTarget({ id: order._id, number: order.orderNumber })}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-lg text-[12px] font-semibold transition-colors"
                      whileTap={buttonTap}>
                      <XCircle className="w-3.5 h-3.5" /> Reject
                    </motion.button>
                  )}
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      )}

      {/* Proof image modal */}
      <AnimatePresence>
        {proofModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60"
            onClick={() => setProofModal(null)}>
            <motion.div variants={scaleIn} initial="initial" animate="animate" exit="exit"
              className="relative bg-white rounded-2xl p-4 max-w-lg w-full" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-slate-900 text-[14px]">Payment Proof</h3>
                <div className="flex gap-2">
                  <a href={proofModal} target="_blank" rel="noreferrer"
                    className="p-2 text-slate-400 hover:text-slate-900 transition-colors">
                    <ExternalLink className="w-4 h-4" />
                  </a>
                  <button onClick={() => setProofModal(null)} className="p-2 text-slate-400 hover:text-slate-700">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
              {proofModal.match(/\.(jpg|jpeg|png|webp)$/i) || proofModal.includes('cloudinary') ? (
                <img src={proofModal} alt="Payment Proof" className="w-full rounded-xl object-contain max-h-96" />
              ) : (
                <div className="text-center py-8">
                  <CreditCard className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-[13px] text-slate-500 mb-3">PDF file uploaded</p>
                  <a href={proofModal} target="_blank" rel="noreferrer" className="btn-secondary btn-sm">View Document</a>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Reject modal */}
      <AnimatePresence>
        {rejectTarget && (
          <RejectModal
            orderId={rejectTarget.id}
            orderNumber={rejectTarget.number}
            onClose={() => setRejectTarget(null)}
            onConfirm={(reason) => rejectMutation.mutate({ orderId: rejectTarget.id, reason })}
            loading={rejectMutation.isPending}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminOrders;
