import React from 'react';
import { Outlet, NavLink, Link } from 'react-router-dom';
import { LayoutDashboard, Package, ShoppingBag, Users, Store } from 'lucide-react';
import logo from '../../logo.png';
import MainLayout from './MainLayout';

interface NavItem { label: string; path: string; icon: React.ReactNode; }

const adminNav: NavItem[] = [
  { label: 'Dashboard', path: '/admin/dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
  { label: 'Products',  path: '/admin/products',  icon: <Package className="w-4 h-4" /> },
  { label: 'Orders',    path: '/admin/orders',    icon: <ShoppingBag className="w-4 h-4" /> },
  { label: 'Customers', path: '/admin/users',     icon: <Users className="w-4 h-4" /> },
];

const DashboardLayout: React.FC = () => (
  <div className="min-h-screen bg-white text-slate-900 flex flex-col">
    {/* Admin navbar (monochrome) */}
    <div className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-slate-200">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 h-14 flex items-center gap-3">
        <Link to="/" className="flex items-center gap-3">
          <img src={logo} alt="FLOW" className="w-8 h-8 object-contain" />
          <span className="font-bold text-[15px] text-slate-900">FLOW <span className="text-slate-600">Admin</span></span>
        </Link>
        <nav className="flex items-center gap-1 ml-6">
          {adminNav.map((item) => (
            <NavLink key={item.path} to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-1.5 px-3 py-2 rounded-lg text-[13px] font-medium transition-colors ${
                  isActive ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}>
              {item.icon}{item.label}
            </NavLink>
          ))}
        </nav>
        <div className="ml-auto">
          <Link to="/" className="text-[12px] text-slate-500 hover:text-slate-900 transition-colors">
            View Store
          </Link>
        </div>
      </div>
    </div>
    <main className="flex-1 pt-14">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 py-8">
        <Outlet />
      </div>
    </main>
  </div>
);

export default DashboardLayout;
