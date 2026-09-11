import { forwardRef, type ButtonHTMLAttributes, type HTMLAttributes, type InputHTMLAttributes, type ReactNode } from 'react';
import { classes } from '../../utils/classes';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost';
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', className, type = 'button', ...props },
  ref,
) {
  return <button ref={ref} type={type} className={classes('ui-button', `ui-button--${variant}`, className)} {...props} />;
});

export interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  'aria-label': string;
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  { className, type = 'button', ...props },
  ref,
) {
  return <button ref={ref} type={type} className={classes('ui-icon-button', className)} {...props} />;
});

export interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  id: string;
  label?: string;
  leadingIcon?: ReactNode;
}

export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(function TextField(
  { id, label, leadingIcon, className, ...props },
  ref,
) {
  return (
    <div className="ui-field">
      {label && <label className="ui-field__label" htmlFor={id}>{label}</label>}
      <div className={classes('ui-field__control', Boolean(leadingIcon) && 'ui-field__control--with-icon')}>
        {leadingIcon && <span className="ui-field__icon" aria-hidden="true">{leadingIcon}</span>}
        <input ref={ref} id={id} className={classes('ui-input', className)} {...props} />
      </div>
    </div>
  );
});

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: 'neutral' | 'accent';
}

export function Badge({ tone = 'neutral', className, ...props }: BadgeProps) {
  return <span className={classes('ui-badge', `ui-badge--${tone}`, className)} {...props} />;
}

export interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description: string;
  children?: ReactNode;
}

export function EmptyState({ icon, title, description, children }: EmptyStateProps) {
  return (
    <div className="ui-empty-state">
      {icon && <div className="ui-empty-state__icon" aria-hidden="true">{icon}</div>}
      <h3 className="ui-empty-state__title">{title}</h3>
      <p className="ui-empty-state__description">{description}</p>
      {children && <div className="ui-empty-state__actions">{children}</div>}
    </div>
  );
}
