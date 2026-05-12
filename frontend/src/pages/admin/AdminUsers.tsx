import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Search, UserX, UserCheck, Mail, Phone } from 'lucide-react';
import { adminAPI } from '../../services/api';
import { formatDate } from '../../utils';
import { staggerContainer, staggerItem, buttonTap } from '../../utils/motion';
import toast from 'react-hot-toast';

const AdminUsers: React.FC = () => {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['admin-users', search],
    queryFn: () => adminAPI.getAllUsers({ search: search || undefined, limit: 50 }).then((r) => r.data.data),
  });

  const toggleMutation = useMutation({
    mutationFn: (userId: string) => adminAPI.toggleUserStatus(userId),
    onSuccess: () => { qc.invalidateQueries(['admin-users']); toast.success('User status updated'); },
    onError:   () => toast.error('Failed to update user'),
  });

  const users: any[] = data?.data || data || [];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-[18px] font-bold text-slate-900">Customers</h1>
          <p className="text-[12px] text-slate-500 mt-0.5">{users.length} registered customers</p>
        </div>
      </div>

      <div className="relative mb-5">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input type="text" placeholder="Search by name or email..." value={search}
          onChange={(e) => setSearch(e.target.value)} className="input pl-9 text-[13px]" />
      </div>

      {isLoading ? (
        <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="skeleton h-16 rounded-xl" />)}</div>
      ) : users.length === 0 ? (
        <div className="text-center py-16 border border-slate-200 rounded-xl bg-slate-50">
          <p className="text-slate-500 text-sm">No customers found</p>
        </div>
      ) : (
        <motion.div variants={staggerContainer} initial="initial" animate="animate" className="space-y-2">
          {users.map((user: any) => (
            <motion.div key={user._id} variants={staggerItem}
              className="bg-white border border-slate-200 rounded-xl px-4 py-3 flex items-center gap-4 flex-wrap">
              <div className="w-9 h-9 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center flex-shrink-0">
                <span className="text-xs font-bold text-slate-700">
                  {user.firstName?.[0]}{user.lastName?.[0]}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-semibold text-slate-800">{user.firstName} {user.lastName}</p>
                <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                  <span className="flex items-center gap-1 text-[11px] text-slate-500">
                    <Mail className="w-3 h-3" />{user.email}
                  </span>
                  {user.phone && (
                    <span className="flex items-center gap-1 text-[11px] text-slate-500">
                      <Phone className="w-3 h-3" />{user.phone}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                <div className="text-right hidden sm:block">
                  <p className="text-[11px] text-slate-400">Joined {formatDate(user.createdAt)}</p>
                  <span className={`text-[11px] font-semibold ${user.isEmailVerified ? 'text-slate-600' : 'text-amber-600'}`}>
                    {user.isEmailVerified ? 'Verified' : 'Unverified'}
                  </span>
                </div>
                <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold ${
                  user.isActive ? 'bg-slate-100 text-slate-700' : 'bg-red-100 text-red-600'
                }`}>
                  {user.isActive ? 'Active' : 'Disabled'}
                </span>
                <motion.button
                  onClick={() => toggleMutation.mutate(user._id)}
                  disabled={toggleMutation.isLoading}
                  whileTap={buttonTap}
                  title={user.isActive ? 'Disable account' : 'Enable account'}
                  className={`p-2 rounded-lg border transition-colors ${
                    user.isActive
                      ? 'border-red-200 text-red-500 hover:bg-red-50'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}>
                  {user.isActive ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                </motion.button>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
};

export default AdminUsers;
