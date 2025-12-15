import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  icon?: React.ReactNode;
}

export const Input: React.FC<InputProps> = ({ label, icon, className = '', ...props }) => {
  return (
    <div className="w-full">
      {label && <label className="block text-sm text-gray-400 mb-1.5 ml-1">{label}</label>}
      <div className="relative group">
        <input 
          className={`w-full bg-dark-800 border border-dark-700 focus:border-primary-500 text-white rounded-xl px-4 py-3 outline-none transition-all placeholder:text-gray-600 ${icon ? 'pl-11' : ''} ${className}`}
          {...props}
        />
        {icon && (
          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-primary-400 transition-colors">
            {icon}
          </div>
        )}
      </div>
    </div>
  );
};