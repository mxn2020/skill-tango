// ═══════════════════════════════════════════════════
// Skill-Tango — Shared UI Components
// Hand-built, no external libraries
// ═══════════════════════════════════════════════════

import { type ReactNode, type CSSProperties } from 'react';
import { motion, type HTMLMotionProps } from 'framer-motion';
import './SharedUI.css';

// ─── GlassCard ────────────────────────────────────
export function GlassCard({
  children,
  className = '',
  style,
  hover = true,
  glow,
  ...props
}: {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  hover?: boolean;
  glow?: 'primary' | 'secondary' | 'accent';
} & Omit<HTMLMotionProps<'div'>, 'style'>) {
  return (
    <motion.div
      className={`glass-card ${hover ? 'glass-card--hover' : ''} ${glow ? `glass-card--glow-${glow}` : ''} ${className}`}
      style={style}
      whileHover={hover ? { y: -3, boxShadow: 'var(--shadow-md)' } : undefined}
      whileTap={hover ? { scale: 0.98 } : undefined}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      {...props}
    >
      {children}
    </motion.div>
  );
}

// ─── Badge ────────────────────────────────────────
export function Badge({
  children,
  variant = 'default',
  size = 'sm',
}: {
  children: ReactNode;
  variant?: 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'accent';
  size?: 'xs' | 'sm' | 'md';
}) {
  return (
    <span className={`badge badge--${variant} badge--${size}`}>
      {children}
    </span>
  );
}

// ─── ProgressRing ─────────────────────────────────
export function ProgressRing({
  value,
  size = 60,
  strokeWidth = 4,
  color = 'var(--color-primary)',
  trackColor = 'var(--bg-elevated-3)',
  label,
  animate = true,
}: {
  value: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  trackColor?: string;
  label?: string;
  animate?: boolean;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;

  return (
    <div className="progress-ring" style={{ width: size, height: size }}>
      <svg viewBox={`0 0 ${size} ${size}`} className="progress-ring__svg">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={trackColor}
          strokeWidth={strokeWidth}
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={animate ? { strokeDashoffset: circumference } : { strokeDashoffset: offset }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.5, ease: 'easeOut' }}
          style={{ transform: 'rotate(-90deg)', transformOrigin: '50% 50%' }}
        />
      </svg>
      <div className="progress-ring__label">
        {label ?? <span className="progress-ring__value">{Math.round(value)}%</span>}
      </div>
    </div>
  );
}

// ─── ProgressBar ──────────────────────────────────
export function ProgressBar({
  value,
  color = 'var(--color-primary)',
  height = 4,
  animate = true,
}: {
  value: number;
  color?: string;
  height?: number;
  animate?: boolean;
}) {
  return (
    <div className="progress-bar" style={{ height }}>
      <motion.div
        className="progress-bar__fill"
        style={{ background: color }}
        initial={animate ? { width: '0%' } : { width: `${value}%` }}
        animate={{ width: `${Math.min(100, Math.max(0, value))}%` }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
      />
    </div>
  );
}

// ─── Avatar ───────────────────────────────────────
export function Avatar({
  name,
  src,
  size = 40,
  showStatus,
  status = 'online',
}: {
  name: string;
  src?: string;
  size?: number;
  showStatus?: boolean;
  status?: 'online' | 'offline';
}) {
  const initials = name
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <div className="avatar" style={{ width: size, height: size, fontSize: size * 0.36 }}>
      {src ? (
        <img src={src} alt={name} className="avatar__img" />
      ) : (
        <div className="avatar__initials">{initials}</div>
      )}
      {showStatus && <div className={`avatar__status avatar__status--${status}`} />}
    </div>
  );
}

// ─── SkeletonLoader ───────────────────────────────
export function SkeletonLoader({
  width,
  height = 16,
  borderRadius,
  className = '',
}: {
  width?: string | number;
  height?: string | number;
  borderRadius?: string | number;
  className?: string;
}) {
  return (
    <div
      className={`skeleton ${className}`}
      style={{
        width: width ?? '100%',
        height,
        borderRadius: borderRadius ?? 'var(--radius-sm)',
      }}
    />
  );
}

// ─── EmptyState ───────────────────────────────────
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  actionLabel,
}: {
  icon: React.ComponentType<{ size: number; className?: string }>;
  title: string;
  description: string;
  action?: () => void;
  actionLabel?: string;
}) {
  return (
    <motion.div
      className="empty-state"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
    >
      <motion.div
        className="empty-state__icon"
        animate={{ y: [0, -6, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
      >
        <Icon size={48} />
      </motion.div>
      <h3 className="empty-state__title">{title}</h3>
      <p className="empty-state__desc">{description}</p>
      {action && actionLabel && (
        <motion.button
          className="btn btn--primary"
          onClick={action}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
        >
          {actionLabel}
        </motion.button>
      )}
    </motion.div>
  );
}

// ─── ErrorState ───────────────────────────────────
export function ErrorState({
  message = 'Something went wrong.',
  onRetry,
}: {
  message?: string;
  onRetry?: () => void;
}) {
  return (
    <motion.div
      className="error-state"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className="error-state__icon">⚠️</div>
      <p className="error-state__message">{message}</p>
      {onRetry && (
        <motion.button
          className="btn btn--outline"
          onClick={onRetry}
          whileTap={{ scale: 0.97 }}
        >
          Retry
        </motion.button>
      )}
    </motion.div>
  );
}

// ─── Modal ────────────────────────────────────────
export function Modal({
  isOpen,
  onClose,
  title,
  children,
  maxWidth = 520,
}: {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  maxWidth?: number;
}) {
  if (!isOpen) return null;

  return (
    <motion.div
      className="modal-backdrop"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="modal-content"
        style={{ maxWidth }}
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        onClick={(e) => e.stopPropagation()}
      >
        {title && (
          <div className="modal-header">
            <h3>{title}</h3>
            <button className="modal-close" onClick={onClose} aria-label="Close modal">
              ✕
            </button>
          </div>
        )}
        <div className="modal-body">{children}</div>
      </motion.div>
    </motion.div>
  );
}

// ─── Tabs ─────────────────────────────────────────
export function Tabs({
  tabs,
  activeTab,
  onChange,
}: {
  tabs: { id: string; label: string }[];
  activeTab: string;
  onChange: (id: string) => void;
}) {
  return (
    <div className="tabs">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          className={`tabs__tab ${activeTab === tab.id ? 'tabs__tab--active' : ''}`}
          onClick={() => onChange(tab.id)}
        >
          {tab.label}
          {activeTab === tab.id && (
            <motion.div className="tabs__indicator" layoutId="tab-indicator" />
          )}
        </button>
      ))}
    </div>
  );
}
