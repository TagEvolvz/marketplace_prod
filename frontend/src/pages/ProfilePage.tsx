import { motion } from 'framer-motion';
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Camera, Save, Loader2, Lock, Mail, Phone, User } from 'lucide-react';
import { authAPI } from '../services/api';
import { useAppDispatch, useAppSelector } from '../store';
import { updateUser } from '../store/slices/authSlice';
import { getAvatarFallback } from '../utils';
import { AccountSidebar } from './OrdersPage';
import toast from 'react-hot-toast';

const ProfilePage: React.FC = () => {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((s) => s.auth);
  const [firstName, setFirstName] = useState(user?.firstName || '');
  const [lastName, setLastName] = useState(user?.lastName || '');
  const [phone, setPhone] = useState('');
  const [saving, setSaving] = useState(false);
  const [curPw, setCurPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [changingPw, setChangingPw] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true);
    try { const r = await authAPI.updateProfile({ firstName, lastName, phone }); dispatch(updateUser(r.data.data)); toast.success('Profile updated'); }
    catch { toast.error('Failed to update'); } finally { setSaving(false); }
  };

  const handlePwChange = async (e: React.FormEvent) => {
    e.preventDefault(); if (!curPw || !newPw) return; setChangingPw(true);
    try { await authAPI.changePassword({ currentPassword: curPw, newPassword: newPw }); toast.success('Password changed'); setCurPw(''); setNewPw(''); }
    catch { toast.error('Incorrect current password'); } finally { setChangingPw(false); }
  };

  return (
    <div className="page-container pt-28 pb-16">
      <nav className="mb-6 flex items-center gap-2 text-xs font-semibold text-slate-500">
        <Link to="/" className="hover:text-brand-dark">Home</Link>
        <span className="text-slate-300">/</span>
        <span className="font-medium text-slate-900">Profile</span>
      </nav>

      <div className="flex gap-6">
        <AccountSidebar />

        <div className="flex-1 min-w-0 space-y-4">
          <p className="eyebrow mb-2">Account</p>
          <h1 className="heading-1">Account Settings</h1>

          {/* Avatar card */}
          <div className="surface flex items-center gap-4 rounded-2xl p-5">
            <div className="relative">
              {user?.avatar ? (
                <img src={user.avatar} alt="" className="w-16 h-16 rounded-full object-cover ring-4 ring-green-100" />
              ) : (
                <div className="w-16 h-16 rounded-full bg-green-100 border-2 border-green-200 flex items-center justify-center text-xl font-bold text-green-700">
                  {user ? getAvatarFallback(`${user.firstName} ${user.lastName}`) : 'U'}
                </div>
              )}
              <button className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-600 rounded-full flex items-center justify-center shadow-sm">
                <Camera className="w-3 h-3 text-white" />
              </button>
            </div>
            <div>
              <p className="font-bold text-slate-900">{user?.firstName} {user?.lastName}</p>
              <p className="text-[12px] text-slate-500">{user?.email}</p>
              <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 bg-green-100 text-green-700 text-[11px] font-semibold rounded-full capitalize">{user?.role}</span>
            </div>
          </div>

          {/* Profile form */}
          <div className="surface rounded-2xl p-5">
            <h3 className="text-[14px] font-bold text-slate-900 mb-4">Personal Information</h3>
            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label text-[12px]">First name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                    <input value={firstName} onChange={(e) => setFirstName(e.target.value)} className="input pl-9 text-[13px]" />
                  </div>
                </div>
                <div>
                  <label className="label text-[12px]">Last name</label>
                  <input value={lastName} onChange={(e) => setLastName(e.target.value)} className="input text-[13px]" />
                </div>
              </div>
              <div>
                <label className="label text-[12px]">Email address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  <input value={user?.email || ''} disabled className="input pl-9 text-[13px] opacity-60 cursor-not-allowed bg-slate-50" />
                </div>
              </div>
              <div>
                <label className="label text-[12px]">Phone number</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+1 234 567 8900" className="input pl-9 text-[13px]" />
                </div>
              </div>
              <button type="submit" disabled={saving} className="btn-primary py-2.5 text-[13px]">
                {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : <><Save className="w-4 h-4" /> Save Changes</>}
              </button>
            </form>
          </div>

          {/* Password */}
          <div className="surface rounded-2xl p-5">
            <h3 className="text-[14px] font-bold text-slate-900 mb-4">Change Password</h3>
            <form onSubmit={handlePwChange} className="space-y-4">
              <div>
                <label className="label text-[12px]">Current password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  <input type="password" value={curPw} onChange={(e) => setCurPw(e.target.value)} className="input pl-9 text-[13px]" />
                </div>
              </div>
              <div>
                <label className="label text-[12px]">New password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  <input type="password" value={newPw} onChange={(e) => setNewPw(e.target.value)} placeholder="Min 8 characters" className="input pl-9 text-[13px]" />
                </div>
              </div>
              <button type="submit" disabled={changingPw || !curPw || !newPw} className="btn-primary py-2.5 text-[13px]">
                {changingPw ? <><Loader2 className="w-4 h-4 animate-spin" /> Updating...</> : 'Update Password'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
