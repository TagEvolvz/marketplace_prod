import React from 'react';

// ─── Badge ────────────────────────────────────────────────────────────────────

type BadgeVariant = 'primary' | 'success' | 'warning' | 'error' | 'info' | 'neutral';

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  dot?: boolean;
  className?: string;
}

const variantMap: Record<BadgeVariant, string> = {
  primary: 'badge-primary',
  success: 'badge-success',
  warning: 'badge-warning',
  error:   'badge-error',
  info:    'badge-info',
  neutral: 'badge-neutral',
};

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'neutral',
  dot = false,
  className = '',
}) => (
  <span className={[variantMap[variant], className].filter(Boolean).join(' ')}>
    {dot && (
      <span
        className={`w-1.5 h-1.5 rounded-full ${
          variant === 'success'
            ? 'bg-emerald-400'
            : variant === 'warning'
            ? 'bg-amber-400'
            : variant === 'error'
            ? 'bg-red-400'
            : variant === 'primary'
            ? 'bg-green-400'
            : 'bg-slate-400'
        }`}
      />
    )}
    {children}
  </span>
);

// ─── Empty State ──────────────────────────────────────────────────────────────

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
  className = '',
}) => (
  <div className={`flex flex-col items-center justify-center py-16 text-center ${className}`}>
    {icon && (
      <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-4 text-slate-500">
        {icon}
      </div>
    )}
    <h3 className="text-base font-semibold text-slate-700 mb-1">{title}</h3>
    {description && <p className="text-sm text-slate-500 mb-6 max-w-xs">{description}</p>}
    {action && <div>{action}</div>}
  </div>
);

// ─── Spinner ──────────────────────────────────────────────────────────────────

export const Spinner: React.FC<{ size?: number; className?: string }> = ({
  size = 24,
  className = '',
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    className={`animate-spin ${className}`}
  >
    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-20" />
    <path
      d="M12 2a10 10 0 0 1 10 10"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
    />
  </svg>
);

// ─── Divider ─────────────────────────────────────────────────────────────────

export const Divider: React.FC<{ label?: string; className?: string }> = ({
  label,
  className = '',
}) => (
  <div className={`flex items-center gap-3 ${className}`}>
    <hr className="flex-1 border-slate-200" />
    {label && <span className="text-xs text-slate-500 shrink-0">{label}</span>}
    <hr className="flex-1 border-slate-200" />
  </div>
);

// ─── Avatar ───────────────────────────────────────────────────────────────────

interface AvatarProps {
  src?: string;
  name?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const avatarSize = { xs: 'w-6 h-6 text-xs', sm: 'w-8 h-8 text-sm', md: 'w-10 h-10 text-sm', lg: 'w-12 h-12 text-base', xl: 'w-16 h-16 text-lg' };

export const Avatar: React.FC<AvatarProps> = ({ src, name, size = 'md', className = '' }) => {
  const initials = name
    ? name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()
    : '?';

  return src ? (
    <img
      src={src}
      alt={name || 'avatar'}
      className={`${avatarSize[size]} rounded-full object-cover border border-slate-200 ${className}`}
    />
  ) : (
    <div
      className={`${avatarSize[size]} rounded-full bg-green-500/20 border border-green-500/30 flex items-center justify-center font-semibold text-green-400 ${className}`}
    >
      {initials}
    </div>
  );
};
