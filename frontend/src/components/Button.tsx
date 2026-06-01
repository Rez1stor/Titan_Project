import React from 'react';

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'ghost' };

export default function Button({ variant = 'primary', className = '', children, ...rest }: Props) {
  const baseClasses = "p-3 rounded-xl font-bold cursor-pointer transition-all duration-200";
  const variantClasses = variant === 'primary' 
    ? "bg-text-main text-white hover:bg-black hover:shadow-md hover:-translate-y-0.5" 
    : "bg-transparent text-brand-color hover:bg-orange-50";

  return (
    <button {...rest} className={`${baseClasses} ${variantClasses} ${className}`}>
      {children}
    </button>
  );
}
