import React from 'react';
import { Outlet, NavLink, Link } from 'react-router-dom';
import { LayoutDashboard, Package, ShoppingBag, Users, ExternalLink } from 'lucide-react';
import logo from '../../logo.png';

interface NavItem { label: string; path: string; icon: React.ReactNode; }

const adminNav: NavItem[] = [
  { label: 'Dashboard', path: '/admin/dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
  { label: 'Products',  path: '/admin/products',  icon: <Package className="w-4 h-4" /> },
  { label: 'Orders',    path: '/admin/orders',    icon: <ShoppingBag className="w-4 h-4" /> },
  { label: 'Customers', path: '/admin/users',     icon: <Users className="w-4 h-4" /> },
];

const DashboardLayout: React.FC = () => (
  <div className="min-h-screen bg-[#f7f8fb] text-slate-900">
    <div className="fixed inset-x-0 top-0 z-50 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-[1280px] items-center gap-3 px-4 sm:px-6">
        <Link to="/" className="flex items-center gap-3">
          <img src={logo} alt="FLOW" className="h-9 w-9 object-contain" />
          <span className="text-[15px] font-extrabold text-slate-950">FLOW <span className="font-semibold text-slate-500">Admin</span></span>
        </Link>
        <nav className="ml-6 hidden items-center gap-1 md:flex">
          {adminNav.map((item) => (
            <NavLink key={item.path} to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-2 rounded-xl px-3 py-2 text-[13px] font-semibold transition-colors ${
                  isActive ? 'bg-slate-950 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-950'
                }`}>
              {item.icon}{item.label}
            </NavLink>
          ))}
        </nav>
        <div className="ml-auto">
          <Link to="/" className="btn-secondary btn-sm">
            View Store <ExternalLink className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </div>
    <main className="pt-16">
      <div className="mx-auto max-w-[1280px] px-4 py-8 sm:px-6">
        <nav className="mb-6 flex gap-2 overflow-x-auto md:hidden">
          {adminNav.map((item) => (
            <NavLink key={item.path} to={item.path}
              className={({ isActive }) =>
                `flex shrink-0 items-center gap-2 rounded-xl px-3 py-2 text-[13px] font-semibold ${
                  isActive ? 'bg-slate-950 text-white' : 'surface-muted text-slate-600'
                }`}>
              {item.icon}{item.label}
            </NavLink>
          ))}
        </nav>
        <Outlet />
      </div>
    </main>
  </div>
);

export default DashboardLayout;
