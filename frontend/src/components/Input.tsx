import React from 'react';

type Props = React.InputHTMLAttributes<HTMLInputElement> & { icon?: React.ReactNode };

export default function Input({ icon, className = '', ...rest }: Props) {
  return (
    <div className="relative">
      {icon && (
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 flex items-center justify-center">
          {icon}
        </div>
      )}
      <input 
        {...rest} 
        className={`w-full py-3 pr-3.5 rounded-xl border border-border-color bg-bg-main focus:outline-none focus:ring-2 focus:ring-brand-color/50 focus:border-brand-color transition-shadow ${icon ? 'pl-10' : 'pl-3.5'} ${className}`} 
      />
    </div>
  );
}
