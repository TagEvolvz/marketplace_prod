import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { ArrowUpRight, CheckCircle, Clock, DollarSign, Package, ShoppingBag, Store, TrendingUp, Users } from 'lucide-react';
import { adminAPI } from '../../services/api';
import { formatCurrency, formatDate } from '../../utils';

const StatCard: React.FC<{
  title: string;
  value: string | number;
  sub?: string;
  icon: React.ReactNode;
}> = ({ title, value, sub, icon }) => (
  <div className="admin-card">
    <div className="mb-4 flex items-center justify-between">
      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
        {icon}
      </div>
      <TrendingUp className="h-4 w-4 text-emerald-500" />
    </div>
    <p className="mb-1 text-2xl font-extrabold tracking-tight text-slate-950">{value}</p>
    <p className="text-sm font-bold text-slate-700">{title}</p>
    {sub && <p className="mt-1 text-xs font-medium text-slate-500">{sub}</p>}
  </div>
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
      <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="eyebrow mb-2">Operations</p>
          <h1 className="heading-1">Admin Dashboard</h1>
          <p className="body-copy mt-2">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <Link to="/admin/orders" className="btn-primary">
          Review Orders <ArrowUpRight className="h-4 w-4" />
        </Link>
      </div>

      {isLoading ? (
        <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => <div key={i} className="skeleton h-36" />)}
        </div>
      ) : (
        <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard title="Total Revenue" value={formatCurrency(stats.totalRevenue || 0)} sub="Confirmed orders" icon={<DollarSign className="h-5 w-5" />} />
          <StatCard title="Total Orders" value={stats.totalOrders || 0} sub={`${stats.pendingOrders || 0} pending`} icon={<ShoppingBag className="h-5 w-5" />} />
          <StatCard title="Total Users" value={stats.totalUsers || 0} sub="Registered" icon={<Users className="h-5 w-5" />} />
          <StatCard title="Customers" value={stats.totalCustomers || 0} sub="Active accounts" icon={<Store className="h-5 w-5" />} />
        </div>
      )}

      <div className="admin-card mb-6 p-0">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-amber-500" />
            <h2 className="text-sm font-bold text-slate-950">Awaiting Payment Review</h2>
            {pendingOrders.length > 0 && <span className="badge-warning">{pendingOrders.length}</span>}
          </div>
          <Link to="/admin/orders" className="flex items-center gap-1 text-xs font-bold text-slate-600 hover:text-slate-950">
            View all <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {pendingOrders.length === 0 ? (
          <div className="px-5 py-12 text-center">
            <CheckCircle className="mx-auto mb-3 h-10 w-10 text-emerald-500" />
            <p className="text-sm font-medium text-slate-500">No orders awaiting review</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {pendingOrders.map((order: any) => (
              <div key={order._id} className="flex items-center gap-4 px-5 py-4 transition-colors hover:bg-slate-50">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600 ring-1 ring-amber-200">
                  <Package className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-slate-900">{order.orderNumber}</p>
                  <p className="truncate text-xs text-slate-500">{order.user?.firstName} {order.user?.lastName} · {formatDate(order.createdAt)}</p>
                </div>
                <span className="text-sm font-extrabold text-slate-950">{formatCurrency(order.total)}</span>
                <Link to="/admin/orders" className="btn-secondary btn-sm">Review</Link>
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <h2 className="mb-3 text-sm font-bold text-slate-950">Quick Actions</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: 'Products', href: '/admin/products', icon: <Package className="h-5 w-5" /> },
            { label: 'Orders', href: '/admin/orders', icon: <ShoppingBag className="h-5 w-5" /> },
            { label: 'Customers', href: '/admin/users', icon: <Users className="h-5 w-5" /> },
            { label: 'Storefront', href: '/', icon: <Store className="h-5 w-5" /> },
          ].map((item) => (
            <Link key={item.label} to={item.href} className="admin-card flex items-center gap-3 p-4 hover:-translate-y-0.5 hover:shadow-lift">
              <span className="text-slate-600">{item.icon}</span>
              <span className="text-sm font-bold text-slate-800">{item.label}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
