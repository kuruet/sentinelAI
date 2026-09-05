import type { HTMLAttributes, PropsWithChildren } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  elevated?: boolean;
}

function Card({
  elevated = false,
  className = '',
  children,
  ...props
}: PropsWithChildren<CardProps>) {
  return (
    <div
      className={`ui-card ${elevated ? 'ui-card--elevated' : ''} ${className}`.trim()}
      {...props}
    >
      {children}
    </div>
  );
}

export default Card;
