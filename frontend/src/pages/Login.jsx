import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Mail, Lock, ArrowRight, Info } from 'lucide-react'
import AuthLayout from '../components/AuthLayout.jsx'
import FormField from '../components/FormField.jsx'
import { useAuth } from '../context/AuthContext.jsx'

export default function Login() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [form, setForm] = useState({ email: '', password: '' })
  const [errors, setErrors] = useState({})
  const [remember, setRemember] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((f) => ({ ...f, [name]: value }))
  }

  const validate = () => {
    const next = {}
    if (!form.email.trim()) next.email = 'Vui lòng nhập email đăng nhập.'
    else if (!/^\S+@\S+\.\S+$/.test(form.email)) next.email = 'Email chưa đúng định dạng.'
    if (!form.password) next.password = 'Vui lòng nhập mật khẩu.'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return

    setSubmitting(true)
    try {
      // TODO: thay bằng lệnh gọi API đăng nhập thực tế, ví dụ:
      // const res = await fetch('/api/auth/login', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ ...form, remember }),
      // })
      // const account = await res.json()
      await new Promise((r) => setTimeout(r, 700))

      const result = login(form.email, form.password)

      if (!result.ok) {
        setErrors({ password: 'Email hoặc mật khẩu không đúng.' })
        return
      }

      // Chỉ tài khoản có role admin mới được vào khu quản trị — quyền này
      // do backend xác định khi đăng nhập, không phải do người dùng chọn.
      navigate(result.user.role === 'admin' ? '/admin/users' : '/dashboard')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthLayout
      eyebrow="TRUNG TÂM ĐIỀU HÀNH"
      title="Đăng nhập hệ thống"
      subtitle="Truy cập bảng điều khiển để giám sát và điều phối đội xe tự hành theo thời gian thực."
    >
      <form className="auth-form" onSubmit={handleSubmit} noValidate>
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
          placeholder="••••••••"
          error={errors.password}
          autoComplete="current-password"
        />

        <div className="form-row-between">
          <label className="checkbox">
            <input
              type="checkbox"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
            />
            <span className="checkbox-box" />
            Ghi nhớ đăng nhập
          </label>
          <a className="link-muted" href="#!">
            Quên mật khẩu?
          </a>
        </div>

        <button className="btn-primary" type="submit" disabled={submitting}>
          {submitting ? 'Đang xác thực…' : 'Đăng nhập'}
          <ArrowRight size={18} strokeWidth={2} />
        </button>
      </form>

      <div className="demo-hint">
        <Info size={14} strokeWidth={1.75} />
        <span>
          Tài khoản demo — Người dùng: <strong>user@autox.vn</strong> / user123 · Quản trị:{' '}
          <strong>admin@autox.vn</strong> / admin123
        </span>
      </div>

      <p className="switch-text">
        Chưa có tài khoản vận hành? <Link to="/register">Đăng ký ngay</Link>
      </p>
    </AuthLayout>
  )
}
