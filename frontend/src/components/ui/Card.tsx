import React from 'react';

// ─── Base Card ────────────────────────────────────────────────────────────────

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  onClick?: () => void;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

const paddingClass = {
  none: '',
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
};

export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  hover = false,
  onClick,
  padding = 'md',
}) => (
  <div
    className={[
      hover ? 'card-hover' : 'card',
      paddingClass[padding],
      onClick ? 'cursor-pointer' : '',
      className,
    ]
      .filter(Boolean)
      .join(' ')}
    onClick={onClick}
  >
    {children}
  </div>
);

// ─── Stat Card ────────────────────────────────────────────────────────────────

interface StatCardProps {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
  change?: number;      // percentage change (positive = good, negative = bad)
  color?: 'primary' | 'success' | 'warning' | 'danger' | 'info';
  className?: string;
}

const colorMap = {
  primary: 'bg-green-500/20 text-green-400',
  success: 'bg-emerald-500/20 text-emerald-400',
  warning: 'bg-amber-500/20 text-amber-400',
  danger:  'bg-red-500/20 text-red-400',
  info:    'bg-blue-500/20 text-blue-400',
};

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  icon,
  change,
  color = 'primary',
  className = '',
}) => (
  <Card className={className}>
    <div className="flex items-start justify-between">
      <div>
        <p className="text-sm text-slate-500 mb-1">{label}</p>
        <p className="text-2xl font-bold text-slate-900">{value}</p>
        {change !== undefined && (
          <p
            className={`text-xs mt-1 font-medium ${
              change >= 0 ? 'text-emerald-400' : 'text-red-400'
            }`}
          >
            {change >= 0 ? '▲' : '▼'} {Math.abs(change)}% vs last period
          </p>
        )}
      </div>
      {icon && (
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${colorMap[color]}`}>
          {icon}
        </div>
      )}
    </div>
  </Card>
);

// ─── Section Card ─────────────────────────────────────────────────────────────

interface SectionCardProps {
  title?: string;
  description?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export const SectionCard: React.FC<SectionCardProps> = ({
  title,
  description,
  action,
  children,
  className = '',
}) => (
  <Card className={className}>
    {(title || action) && (
      <div className="flex items-center justify-between mb-4">
        <div>
          {title && <h3 className="text-base font-semibold text-slate-900">{title}</h3>}
          {description && <p className="text-sm text-slate-500 mt-0.5">{description}</p>}
        </div>
        {action && <div>{action}</div>}
      </div>
    )}
    {children}
  </Card>
);
