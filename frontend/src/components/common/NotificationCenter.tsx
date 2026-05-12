import React, { useState, useRef, useEffect } from 'react';
import { Bell, ShoppingBag, Package, Star, AlertCircle, CheckCheck } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationAPI } from '../../services/api';
import { timeAgo } from '../../utils';
import { useAppSelector } from '../../store';

const NotifIcon: React.FC<{ type: string }> = ({ type }) => {
  const map: Record<string, { icon: React.ReactNode; cls: string }> = {
    order:   { icon: <ShoppingBag className="w-3.5 h-3.5" />, cls: 'bg-blue-100 text-blue-600' },
    product: { icon: <Package className="w-3.5 h-3.5" />,     cls: 'bg-violet-100 text-violet-600' },
    review:  { icon: <Star className="w-3.5 h-3.5" />,        cls: 'bg-amber-100 text-amber-600' },
    general: { icon: <AlertCircle className="w-3.5 h-3.5" />, cls: 'bg-slate-100 text-slate-500' },
  };
  const { icon, cls } = map[type] ?? map.general;
  return <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${cls}`}>{icon}</div>;
};

const NotificationCenter: React.FC = () => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const qc = useQueryClient();
  const { isAuthenticated } = useAppSelector((s) => s.auth);

  const { data } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => notificationAPI.getNotifications().then((r) => r.data.data),
    enabled: isAuthenticated,
    refetchInterval: 30000,
  });

  const markAll = useMutation({
    mutationFn: () => notificationAPI.markAllAsRead(),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const notifications = data?.data || data || [];
  const unread = notifications.filter((n: any) => !n.isRead).length;

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen(!open)}
        className="relative p-2.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors">
        <Bell className="w-5 h-5" />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 bg-red-500 text-white rounded-full text-[9px] font-bold flex items-center justify-center px-1">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl shadow-card-hover border border-slate-200 z-50 overflow-hidden animate-scale-in">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
            <h3 className="text-sm font-semibold text-slate-900">Notifications</h3>
            {unread > 0 && (
              <button onClick={() => markAll.mutate()} className="text-xs text-green-600 hover:text-green-700 flex items-center gap-1">
                <CheckCheck className="w-3.5 h-3.5" /> Mark all read
              </button>
            )}
          </div>
          <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
            {notifications.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <Bell className="w-8 h-8 text-slate-200 mx-auto mb-2" />
                <p className="text-xs text-slate-400">No notifications yet</p>
              </div>
            ) : notifications.map((n: any) => (
              <div key={n._id} className={`flex gap-3 px-4 py-3 transition-colors ${!n.isRead ? 'bg-green-50/50' : 'hover:bg-slate-50'}`}>
                <NotifIcon type={n.type} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-slate-800 line-clamp-1">{n.title}</p>
                  <p className="text-xs text-slate-500 line-clamp-2 mt-0.5">{n.message}</p>
                  <p className="text-[10px] text-slate-400 mt-1">{timeAgo(n.createdAt)}</p>
                </div>
                {!n.isRead && <span className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0 mt-1" />}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationCenter;
