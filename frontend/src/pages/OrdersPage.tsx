import { motion } from 'framer-motion';
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Package, ChevronRight, LayoutDashboard, Heart, MapPin, CreditCard, Settings, LogOut, ShoppingBag } from 'lucide-react';
import { orderAPI } from '../services/api';
import { Order } from '../types';
import { formatCurrency, formatDate, getProductImage } from '../utils';
import { useAppDispatch, useAppSelector } from '../store';
import { logout } from '../store/slices/authSlice';
import { useNavigate, NavLink } from 'react-router-dom';
import toast from 'react-hot-toast';

// Sidebar matching the reference screenshot
const AccountSidebar: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { user } = useAppSelector((s) => s.auth);

  const links = [
    { to: '/profile', icon: <LayoutDashboard className="w-4 h-4" />, label: 'Dashboard' },
    { to: '/orders', icon: <ShoppingBag className="w-4 h-4" />, label: 'Orders' },
    { to: '/wishlist', icon: <Heart className="w-4 h-4" />, label: 'Wishlist' },
    { to: '/profile/addresses', icon: <MapPin className="w-4 h-4" />, label: 'Addresses' },
    { to: '/profile/payment', icon: <CreditCard className="w-4 h-4" />, label: 'Payment Methods' },
    { to: '/profile', icon: <Settings className="w-4 h-4" />, label: 'Settings' },
  ];

  return (
    <aside className="w-[200px] flex-shrink-0">
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-100">
          <p className="text-[13px] font-semibold text-slate-800">{user?.firstName} {user?.lastName}</p>
          <p className="text-[11px] text-slate-500 truncate">{user?.email}</p>
        </div>
        <nav className="py-1">
          {links.map((l) => (
            <NavLink key={l.to + l.label} to={l.to}
              className={({ isActive }) =>
                `flex items-center gap-2.5 px-4 py-2.5 text-[13px] font-medium transition-colors ${
                  isActive && l.label === 'Orders'
                    ? 'text-green-600 bg-green-50 border-r-2 border-green-600'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`
              }>
              <span className="text-slate-400">{l.icon}</span>
              {l.label}
            </NavLink>
          ))}
          <button onClick={() => { dispatch(logout()); navigate('/auth/login'); toast.success('Logged out'); }}
            className="flex items-center gap-2.5 px-4 py-2.5 text-[13px] font-medium text-slate-600 hover:bg-red-50 hover:text-red-500 transition-colors w-full">
            <LogOut className="w-4 h-4 text-slate-400" />
            Logout
          </button>
        </nav>
      </div>
    </aside>
  );
};

const STATUS_COLORS: Record<string, string> = {
  pending:    'bg-amber-100 text-amber-700',
  processing: 'bg-blue-100 text-blue-700',
  shipped:    'bg-violet-100 text-violet-700',
  delivered:  'bg-green-100 text-green-700',
  cancelled:  'bg-red-100 text-red-600',
  refunded:   'bg-slate-100 text-slate-600',
};

const OrdersPage: React.FC = () => {
  const { data, isLoading } = useQuery({
    queryKey: ['my-orders'],
    queryFn: () => orderAPI.getMyOrders({}).then((r) => r.data.data),
  });
  const orders: Order[] = Array.isArray(data) ? data : data?.data || [];

  return (
    <div className="max-w-[1100px] mx-auto px-4 sm:px-6 py-8">
      <nav className="flex items-center gap-2 text-[12px] text-slate-500 mb-6">
        <Link to="/" className="hover:text-green-600">Home</Link>
        <span className="text-slate-300">/</span>
        <span className="text-slate-800 font-medium">My Orders</span>
      </nav>

      <div className="flex gap-6">
        <AccountSidebar />

        <div className="flex-1 min-w-0">
          <h1 className="text-[18px] font-bold text-slate-900 mb-5">My Orders</h1>

          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => <div key={i} className="skeleton h-24 rounded-xl" />)}
            </div>
          ) : orders.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-xl p-16 text-center">
              <Package className="w-12 h-12 text-slate-200 mx-auto mb-3" />
              <p className="text-slate-500 text-sm">No orders yet.</p>
              <Link to="/products" className="btn-primary mt-4 inline-flex">Browse Products</Link>
            </div>
          ) : (
            <div className="space-y-3">
              {orders.map((order) => (
                <div key={order._id} className="bg-white border border-slate-200 rounded-xl p-4 flex items-center gap-4 hover:shadow-[0_2px_12px_rgba(0,0,0,0.06)] transition-shadow">
                  {/* Product thumbnail */}
                  <div className="flex-shrink-0">
                    <img
                      src={getProductImage(order.items?.[0]?.product?.images)}
                      alt=""
                      className="w-16 h-16 rounded-xl object-cover bg-slate-100 border border-slate-200"
                    />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-0.5">
                      <span className="text-[13px] font-bold text-slate-900">{order.orderNumber}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${STATUS_COLORS[order.status] || STATUS_COLORS.pending}`}>
                        {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                      </span>
                    </div>
                    <p className="text-[12px] text-slate-500">{formatDate(order.createdAt)}</p>
                    {order.items?.length > 1 && (
                      <p className="text-[12px] text-slate-400 mt-0.5">{order.items.length} items</p>
                    )}
                  </div>

                  {/* Price + action */}
                  <div className="flex flex-col items-end gap-2 flex-shrink-0">
                    <span className="text-[15px] font-bold text-slate-900">{formatCurrency(order.totalAmount)}</span>
                    <Link to={`/orders/${order.orderNumber}`}
                      className="text-[12px] font-semibold text-green-600 hover:text-green-700 border border-green-200 hover:border-green-400 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1">
                      View Details <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrdersPage;
export { AccountSidebar, STATUS_COLORS };
