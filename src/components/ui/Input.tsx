import { type InputHTMLAttributes, type TextareaHTMLAttributes, type SelectHTMLAttributes, forwardRef } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className = '', ...props }, ref) => (
    <div className="space-y-1.5">
      {label && <label className="block text-sm font-medium text-slate-700">{label}</label>}
      <input
        ref={ref}
        className={`w-full px-3.5 py-2.5 text-sm border rounded-lg transition-colors bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 ${error ? 'border-red-300' : 'border-slate-300'} ${className}`}
        {...props}
      />
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  ),
);
Input.displayName = 'Input';

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, className = '', ...props }, ref) => (
    <div className="space-y-1.5">
      {label && <label className="block text-sm font-medium text-slate-700">{label}</label>}
      <textarea
        ref={ref}
        className={`w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg transition-colors bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 resize-y ${className}`}
        {...props}
      />
    </div>
  ),
);
Textarea.displayName = 'Textarea';

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, className = '', children, ...props }, ref) => (
    <div className="space-y-1.5">
      {label && <label className="block text-sm font-medium text-slate-700">{label}</label>}
      <select
        ref={ref}
        className={`w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg transition-colors bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 ${className}`}
        {...props}
      >
        {children}
      </select>
    </div>
  ),
);
Select.displayName = 'Select';
