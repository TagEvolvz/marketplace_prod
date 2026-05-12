import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Users, Store, ShoppingBag, DollarSign, TrendingUp, Clock, CheckCircle, XCircle, Package, ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { adminAPI } from '../../services/api';
import { formatCurrency, formatDate } from '../../utils';
import { staggerContainer, staggerItem, buttonTap } from '../../utils/motion';

const StatCard: React.FC<{
  title: string;
  value: string | number;
  sub?: string;
  icon: React.ReactNode;
  color: string;
  delay?: number;
}> = ({ title, value, sub, icon, color, delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, y: 20, scale: 0.96 }}
    animate={{ opacity: 1, y: 0, scale: 1 }}
    transition={{ duration: 0.35, delay, ease: [0.25, 0.1, 0.25, 1] }}
    whileHover={{ y: -2, boxShadow: '0 8px 24px rgba(0,0,0,0.08)' }}
    className="bg-white border border-slate-200 rounded-xl p-5"
  >
    <div className="flex items-center justify-between mb-3">
      <div className={`w-10 h-10 rounded-xl ${color} flex items-center justify-center`}>
        {icon}
      </div>
      <TrendingUp className="w-4 h-4 text-slate-500" />
    </div>
    <p className="text-[24px] font-extrabold text-slate-900 leading-none mb-1">{value}</p>
    <p className="text-[12px] font-semibold text-slate-600">{title}</p>
    {sub && <p className="text-[11px] text-slate-400 mt-0.5">{sub}</p>}
  </motion.div>
);

const AdminDashboard: React.FC = () => {
  const { data, isLoading } = useQuery({
    queryKey: ['admin-dashboard'],
    queryFn: () => adminAPI.getDashboard().then((r) => r.data.data),
  });

  const { data: ordersData } = useQuery({
    queryKey: ['admin-orders-pending'],
    queryFn: () => adminAPI.getAllOrders({ paymentStatus: 'awaiting_confirmation', limit: 5 }).then((r) => r.data.data),
  });

  const stats = data?.stats || data || {};
  const pendingOrders = ordersData?.data || ordersData?.orders || ordersData || [];

  return (
    <div>
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}
        className="mb-6">
        <h1 className="text-[20px] font-extrabold text-slate-900">Admin Dashboard</h1>
        <p className="text-[13px] text-slate-500 mt-0.5">{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
      </motion.div>

      {/* Stats */}
      {isLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {Array.from({ length: 4 }).map((_, i) => <div key={i} className="skeleton h-28 rounded-xl" />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard title="Total Revenue" value={formatCurrency(stats.totalRevenue || 0)} sub="All confirmed orders"
            icon={<DollarSign className="w-5 h-5 text-slate-700" />} color="bg-slate-50" delay={0} />
          <StatCard title="Total Orders" value={stats.totalOrders || 0} sub={`${stats.pendingOrders || 0} pending`}
            icon={<ShoppingBag className="w-5 h-5 text-slate-700" />} color="bg-slate-50" delay={0.07} />
          <StatCard title="Total Users" value={stats.totalUsers || 0} sub="Registered"
            icon={<Users className="w-5 h-5 text-slate-700" />} color="bg-slate-50" delay={0.14} />
          <StatCard title="Total Customers" value={stats.totalCustomers || 0} sub={"Registered accounts"}
            icon={<Store className="w-5 h-5 text-slate-700" />} color="bg-slate-50" delay={0.21} />
        </div>
      )}

      {/* Pending payment approvals */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.3 }}
        className="bg-white border border-slate-200 rounded-xl mb-6"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-500" />
            <h2 className="text-[14px] font-bold text-slate-900">Awaiting Payment Review</h2>
            {pendingOrders.length > 0 && (
              <span className="bg-amber-100 text-amber-700 text-[11px] font-bold px-2 py-0.5 rounded-full">
                {pendingOrders.length}
              </span>
            )}
          </div>
          <Link to="/admin/orders" className="text-[12px] text-slate-600 hover:text-slate-900 font-semibold flex items-center gap-1">
            View all <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {pendingOrders.length === 0 ? (
          <div className="px-5 py-10 text-center">
            <CheckCircle className="w-10 h-10 text-slate-200 mx-auto mb-2" />
            <p className="text-[13px] text-slate-500">No orders awaiting review</p>
          </div>
        ) : (
          <motion.div variants={staggerContainer} initial="initial" animate="animate">
            {pendingOrders.map((order: any) => (
              <motion.div key={order._id} variants={staggerItem}
                className="flex items-center gap-4 px-5 py-3.5 border-b border-slate-100 last:border-0 hover:bg-slate-50/60 transition-colors">
                <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
                  <Package className="w-4 h-4 text-amber-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-semibold text-slate-800">{order.orderNumber}</p>
                  <p className="text-[11px] text-slate-500">{order.user?.firstName} {order.user?.lastName} · {formatDate(order.createdAt)}</p>
                </div>
                <span className="text-[13px] font-bold text-slate-900">{formatCurrency(order.total)}</span>
                <div className="flex gap-2">
                  {order.paymentProof && (
                    <span className="flex items-center gap-1 text-[11px] text-amber-600 bg-amber-50 border border-amber-200 px-2 py-1 rounded-lg font-semibold">
                      <Clock className="w-3 h-3" /> Has Proof
                    </span>
                  )}
                  <Link to="/admin/orders"
                    className="text-[12px] text-slate-600 hover:text-slate-900 font-semibold border border-slate-200 hover:border-slate-300 px-2.5 py-1 rounded-lg transition-colors">
                    Review
                  </Link>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </motion.div>

      {/* Quick links */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.4 }}>
        <h2 className="text-[14px] font-bold text-slate-900 mb-3">Quick Actions</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Manage Products', href: '/admin/products', icon: <Package className="w-5 h-5 text-slate-600" />, color: 'bg-slate-50' },
            { label: 'Customers', href: '/admin/users', icon: <Users className="w-5 h-5 text-violet-600" />, color: 'bg-violet-50' },
            { label: 'All Orders', href: '/admin/orders', icon: <ShoppingBag className="w-5 h-5 text-blue-600" />, color: 'bg-blue-50' },
            { label: 'Users', href: '/admin/users', icon: <Users className="w-5 h-5 text-violet-600" />, color: 'bg-violet-50' },
          ].map((item, i) => (
            <motion.div key={item.href}
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.45 + i * 0.06 }}
              whileHover={{ y: -2 }} whileTap={buttonTap}>
              <Link to={item.href}
                className={`${item.color} border border-slate-200 rounded-xl p-4 flex flex-col items-start gap-2 hover:shadow-md transition-all`}>
                {item.icon}
                <span className="text-[13px] font-semibold text-slate-700">{item.label}</span>
              </Link>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
};

export default AdminDashboard;

// Note: inventory insights widget is lazy-loaded separately in admin
// The AI insights button lives in AdminDashboard header row
