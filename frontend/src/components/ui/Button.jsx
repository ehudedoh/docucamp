import { forwardRef } from 'react'

const Button = forwardRef(function Button(
  { variant = 'primary', className = '', children, ...props },
  ref
) {
  const variants = {
    primary: 'btn-primary',
    secondary: 'btn-secondary',
    danger: 'btn-danger',
    ghost: 'btn hover:bg-slate-100 text-slate-700'
  }
  return (
    <button ref={ref} className={`${variants[variant] || variants.primary} ${className}`} {...props}>
      {children}
    </button>
  )
})

export default Button