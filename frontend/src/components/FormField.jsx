import { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'

export default function FormField({
  label,
  type = 'text',
  icon: Icon,
  value,
  onChange,
  placeholder,
  error,
  name,
  autoComplete,
}) {
  const [show, setShow] = useState(false)
  const isPassword = type === 'password'
  const inputType = isPassword ? (show ? 'text' : 'password') : type

  return (
    <label className={`field ${error ? 'field-error' : ''}`}>
      <span className="field-label">{label}</span>
      <span className="field-control">
        {Icon && <Icon size={17} strokeWidth={1.75} className="field-icon" />}
        <input
          name={name}
          type={inputType}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          autoComplete={autoComplete}
        />
        {isPassword && (
          <button
            type="button"
            className="field-toggle"
            onClick={() => setShow((s) => !s)}
            aria-label={show ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
          >
            {show ? <EyeOff size={17} strokeWidth={1.75} /> : <Eye size={17} strokeWidth={1.75} />}
          </button>
        )}
      </span>
      {error && <span className="field-error-text">{error}</span>}
    </label>
  )
}
