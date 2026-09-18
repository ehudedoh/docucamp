import { forwardRef } from 'react'

const Select = forwardRef(function Select(
  { label, error, id, options = [], placeholder, className = '', children, ...props },
  ref
) {
  const selectId = id || props.name
  return (
    <div>
      {label && <label htmlFor={selectId} className="label">{label}</label>}
      <select
        ref={ref}
        id={selectId}
        className={`input ${error ? 'border-red-400' : ''} ${className}`}
        {...props}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((o) => (
          <option key={o.value ?? o.id} value={o.value ?? o.id}>
            {o.label ?? o.name}
          </option>
        ))}
        {children}
      </select>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  )
})

export default Select