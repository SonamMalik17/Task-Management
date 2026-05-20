import { forwardRef, type InputHTMLAttributes } from 'react';
import { cn } from '@/shared/lib/cn';

interface Props extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, Props>(function Input(
  { className, label, error, id, ...rest },
  ref,
) {
  return (
    <label htmlFor={id} className="flex flex-col gap-1.5 text-sm">
      {label ? <span className="text-slate-300">{label}</span> : null}
      <input
        ref={ref}
        id={id}
        className={cn(
          'rounded-lg bg-slate-900 border border-slate-700 px-3 py-2 text-slate-100 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20',
          error && 'border-red-500',
          className,
        )}
        {...rest}
      />
      {error ? <span className="text-xs text-red-400">{error}</span> : null}
    </label>
  );
});
