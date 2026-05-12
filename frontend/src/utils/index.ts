import { format, formatDistanceToNow, parseISO } from 'date-fns';
import { OrderStatus } from '../types';

export const formatCurrency = (amount: number, currency = 'USD'): string =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount);

export const formatNumber = (num: number): string =>
  new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 }).format(num);

export const formatDate = (date: string | Date): string => {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, 'MMM d, yyyy');
};

export const formatDateTime = (date: string | Date): string => {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, 'MMM d, yyyy · h:mm a');
};

export const timeAgo = (date: string | Date): string => {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return formatDistanceToNow(d, { addSuffix: true });
};

// Light-theme status colours
export const getOrderStatusColor = (status: OrderStatus): string => {
  const map: Record<OrderStatus, string> = {
    pending:    'text-amber-700  bg-amber-50   border border-amber-200',
    awaiting_payment: 'text-amber-700 bg-amber-50 border border-amber-200',
    paid:       'text-blue-700   bg-blue-50    border border-blue-200',
    processing: 'text-indigo-700 bg-indigo-50  border border-indigo-200',
    out_for_delivery: 'text-violet-700 bg-violet-50 border border-violet-200',
    delivered:  'text-emerald-700 bg-emerald-50 border border-emerald-200',
    cancelled:  'text-red-700    bg-red-50     border border-red-200',
    refunded:   'text-slate-600  bg-slate-100  border border-slate-200',
  };
  return map[status] ?? 'text-slate-600 bg-slate-100 border border-slate-200';
};

export const getPaymentStatusColor = (status: string): string => {
  const map: Record<string, string> = {
    paid:    'text-emerald-700 bg-emerald-50 border border-emerald-200',
    pending: 'text-amber-700  bg-amber-50   border border-amber-200',
    failed:  'text-red-700    bg-red-50     border border-red-200',
    refunded:'text-slate-600  bg-slate-100  border border-slate-200',
  };
  return map[status] ?? 'text-slate-600 bg-slate-100 border border-slate-200';
};

export const getProductImage = (images?: { url: string; isPrimary?: boolean }[]): string => {
  if (!images?.length) return 'https://placehold.co/400x400/f1f5f9/94a3b8?text=No+Image';
  const primary = images.find((i) => i.isPrimary);
  return primary?.url ?? images[0].url;
};

export const getAvatarFallback = (name: string): string => {
  const parts = name.trim().split(' ');
  return parts.length >= 2
    ? `${parts[0][0]}${parts[1][0]}`.toUpperCase()
    : parts[0].slice(0, 2).toUpperCase();
};

export const truncate = (str: string, len: number): string =>
  str.length <= len ? str : `${str.slice(0, len)}…`;

export const slugify = (str: string): string =>
  str.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');
