import React from 'react';
import clsx from 'clsx';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'ghost' | 'default';
  size?: 'sm' | 'md' | 'lg';
}

export const Button: React.FC<ButtonProps> = ({ variant = 'default', size = 'md', className, children, ...props }) => {
  const baseStyles = 'rounded px-4 py-2 font-medium focus:outline-none';
  const variants = {
    default: 'bg-green-600 text-white hover:bg-green-700',
    ghost: 'bg-transparent text-green-600 hover:text-green-700',
  };
  const sizes = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
  };

  return (
    <button
      className={clsx(baseStyles, variants[variant], sizes[size], className)}
      {...props}
    >
      {children}
    </button>
  );
};