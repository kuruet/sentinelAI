import type { HTMLAttributes, PropsWithChildren } from 'react';

type BadgeVariant = 'neutral' | 'info' | 'success' | 'warning' | 'danger';

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

function Badge({
  variant = 'neutral',
  className = '',
  children,
  ...props
}: PropsWithChildren<BadgeProps>) {
  return (
    <span className={`ui-badge ui-badge--${variant} ${className}`.trim()} {...props}>
      {children}
    </span>
  );
}

export default Badge;
