import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { User, Mail, Lock, ArrowRight, Car, UserRound } from 'lucide-react'
import AuthLayout from '../components/AuthLayout.jsx'
import FormField from '../components/FormField.jsx'
import { useAuth } from '../context/AuthContext.jsx'

export default function Register() {
  const navigate = useNavigate()
  const { register } = useAuth()
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
  })
  const [role, setRole] = useState('passenger') // 'passenger' | 'operator'
  const [agree, setAgree] = useState(false)
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((f) => ({ ...f, [name]: value }))
  }

  const validate = () => {
    const next = {}
    if (!form.fullName.trim()) next.fullName = 'Vui lòng nhập họ và tên.'
    if (!form.email.trim()) next.email = 'Vui lòng nhập email.'
    else if (!/^\S+@\S+\.\S+$/.test(form.email)) next.email = 'Email chưa đúng định dạng.'
    if (!form.password) next.password = 'Vui lòng nhập mật khẩu.'
    else if (form.password.length < 8) next.password = 'Mật khẩu cần tối thiểu 8 ký tự.'
    if (form.confirmPassword !== form.password)
      next.confirmPassword = 'Mật khẩu nhập lại không khớp.'
    if (!agree) next.agree = 'Vui lòng đồng ý điều khoản để tiếp tục.'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return

    setSubmitting(true)
    try {
      // TODO: thay bằng lệnh gọi API đăng ký thực tế, ví dụ:
      // const res = await fetch('/api/auth/register', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ ...form, role }),
      // })
      await new Promise((r) => setTimeout(r, 900))

      const result = register({
        fullName: form.fullName,
        email: form.email,
        password: form.password,
        role,
      })

      if (!result.ok) {
        setErrors({ email: result.error })
        return
      }

      // Đăng ký chỉ tạo tài khoản người dùng (Hành khách/Người vận hành) —
      // tài khoản admin được cấp sẵn, không đăng ký qua trang này.
      navigate('/dashboard')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthLayout
      eyebrow="THAM GIA MẠNG LƯỚI"
      title="Tạo tài khoản mới"
      subtitle="Đăng ký để đặt chuyến hoặc giám sát vận hành trong hệ thống xe tự hành AUTOX."
    >
      <form className="auth-form" onSubmit={handleSubmit} noValidate>
        <div className="role-switch" role="radiogroup" aria-label="Vai trò tài khoản">
          <button
            type="button"
            role="radio"
            aria-checked={role === 'passenger'}
            className={`role-option ${role === 'passenger' ? 'is-active' : ''}`}
            onClick={() => setRole('passenger')}
          >
            <UserRound size={16} strokeWidth={1.75} />
            Hành khách
          </button>
          <button
            type="button"
            role="radio"
            aria-checked={role === 'operator'}
            className={`role-option ${role === 'operator' ? 'is-active' : ''}`}
            onClick={() => setRole('operator')}
          >
            <Car size={16} strokeWidth={1.75} />
            Người vận hành
          </button>
        </div>

        <FormField
          label="Họ và tên"
          name="fullName"
          icon={User}
          value={form.fullName}
          onChange={handleChange}
          placeholder="Nguyễn Văn A"
          error={errors.fullName}
          autoComplete="name"
        />
        <FormField
          label="Email"
          name="email"
          type="email"
          icon={Mail}
          value={form.email}
          onChange={handleChange}
          placeholder="ten@congty.com"
          error={errors.email}
          autoComplete="email"
        />
        <FormField
          label="Mật khẩu"
          name="password"
          type="password"
          icon={Lock}
          value={form.password}
          onChange={handleChange}
          placeholder="Tối thiểu 8 ký tự"
          error={errors.password}
          autoComplete="new-password"
        />
        <FormField
          label="Nhập lại mật khẩu"
          name="confirmPassword"
          type="password"
          icon={Lock}
          value={form.confirmPassword}
          onChange={handleChange}
          placeholder="••••••••"
          error={errors.confirmPassword}
          autoComplete="new-password"
        />

        <div>
          <label className={`checkbox agree ${errors.agree ? 'checkbox-error' : ''}`}>
            <input
              type="checkbox"
              checked={agree}
              onChange={(e) => setAgree(e.target.checked)}
            />
            <span className="checkbox-box" />
            <span>
              Tôi đồng ý với <a href="#!">Điều khoản dịch vụ</a> &amp;{' '}
              <a href="#!">Chính sách bảo mật</a>
            </span>
          </label>
          {errors.agree && <span className="field-error-text">{errors.agree}</span>}
        </div>

        <button className="btn-primary" type="submit" disabled={submitting}>
          {submitting ? 'Đang tạo tài khoản…' : 'Đăng ký'}
          <ArrowRight size={18} strokeWidth={2} />
        </button>
      </form>

      <p className="switch-text">
        Đã có tài khoản? <Link to="/login">Đăng nhập</Link>
      </p>
    </AuthLayout>
  )
}
