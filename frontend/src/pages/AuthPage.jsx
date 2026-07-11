import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Mail,
  Lock,
  User,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  Loader2,
  Info,
} from "lucide-react";
import "../styles/auth.css";
import SystemPanel from "../components/SystemPanel";
import { useAuth } from "../context/AuthContext.jsx";

/** Input dùng chung cho cả 2 form: icon, lỗi validate, toggle ẩn/hiện mật khẩu. */
function FormField({
  label,
  icon: Icon,
  type = "text",
  name,
  value,
  onChange,
  placeholder,
  error,
  autoComplete,
  required,
}) {
  const [visible, setVisible] = useState(false);
  const isPassword = type === "password";
  const inputType = isPassword ? (visible ? "text" : "password") : type;

  return (
    <div className="avc-field">
      <label className="avc-label">{label}</label>
      <div className="avc-input-wrap">
        {Icon && <Icon size={15} className="avc-input-icon" />}
        <input
          className={`avc-input ${error ? "avc-field-error" : ""}`}
          type={inputType}
          name={name}
          placeholder={placeholder}
          required={required}
          value={value}
          onChange={onChange}
          autoComplete={autoComplete}
        />
        {isPassword && (
          <button
            type="button"
            className="avc-input-toggle"
            onClick={() => setVisible((v) => !v)}
            aria-label="Toggle password visibility"
          >
            {visible ? <EyeOff size={15} /> : <Eye size={15} />}
          </button>
        )}
      </div>
      {error && <span className="avc-error-text">{error}</span>}
    </div>
  );
}

function LoginForm({ onSwitchToRegister }) {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [form, setForm] = useState({ email: "", password: "" });
  const [remember, setRemember] = useState(true);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  }

  function validate() {
    const next = {};
    if (!form.email.trim()) next.email = "Vui lòng nhập email đăng nhập.";
    else if (!/^\S+@\S+\.\S+$/.test(form.email)) next.email = "Email chưa đúng định dạng.";
    if (!form.password) next.password = "Vui lòng nhập mật khẩu.";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    try {
      // TODO: thay bằng lệnh gọi API đăng nhập thực tế.
      await new Promise((r) => setTimeout(r, 700));

      const result = login(form.email, form.password);
      if (!result.ok) {
        setErrors({ password: "Email hoặc mật khẩu không đúng." });
        return;
      }

      // Vai trò do context/backend xác định sau khi xác thực,
      // không phải do người dùng tự chọn ở giao diện.
      navigate(result.user.role === "admin" ? "/admin/users" : "/dashboard");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <FormField
        label="Email"
        name="email"
        type="email"
        icon={Mail}
        placeholder="ten@congty.com"
        value={form.email}
        onChange={handleChange}
        error={errors.email}
        autoComplete="email"
      />
      <FormField
        label="Mật khẩu"
        name="password"
        type="password"
        icon={Lock}
        placeholder="••••••••"
        value={form.password}
        onChange={handleChange}
        error={errors.password}
        autoComplete="current-password"
      />

      <div className="avc-row-between">
        <label className="avc-check">
          <input
            type="checkbox"
            checked={remember}
            onChange={(e) => setRemember(e.target.checked)}
          />
          Ghi nhớ đăng nhập
        </label>
        <a className="avc-link" href="#!">
          Quên mật khẩu?
        </a>
      </div>

      <button className="avc-submit" type="submit" disabled={submitting}>
        {submitting ? (
          <>
            <Loader2 size={16} className="avc-spin" /> Đang xác thực…
          </>
        ) : (
          <>
            Đăng nhập <ArrowRight size={16} />
          </>
        )}
      </button>

      {import.meta.env.DEV && (
        <div className="avc-demo-hint">
          <Info size={14} />
          <span>
            Tài khoản demo — Người dùng: <strong>user@autox.vn</strong> / user123 · Quản trị:{" "}
            <strong>admin@autox.vn</strong> / admin123
          </span>
        </div>
      )}

      <div className="avc-footer">
        Chưa có tài khoản?{" "}
        <a className="avc-link" onClick={onSwitchToRegister}>
          Đăng ký ngay
        </a>
      </div>
    </form>
  );
}

function RegisterForm({ onSwitchToLogin }) {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [agree, setAgree] = useState(false);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  }

  function validate() {
    const next = {};
    if (!form.fullName.trim()) next.fullName = "Vui lòng nhập họ và tên.";
    if (!form.email.trim()) next.email = "Vui lòng nhập email.";
    else if (!/^\S+@\S+\.\S+$/.test(form.email)) next.email = "Email chưa đúng định dạng.";
    if (!form.password) next.password = "Vui lòng nhập mật khẩu.";
    else if (form.password.length < 8) next.password = "Mật khẩu cần tối thiểu 8 ký tự.";
    if (form.confirmPassword !== form.password)
      next.confirmPassword = "Mật khẩu nhập lại không khớp.";
    if (!agree) next.agree = "Vui lòng đồng ý điều khoản để tiếp tục.";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    try {
      // TODO: thay bằng lệnh gọi API đăng ký thực tế.
      await new Promise((r) => setTimeout(r, 900));

      // Đăng ký luôn tạo tài khoản role "user" — tài khoản admin được cấp
      // sẵn, không có lựa chọn nào trên form này tạo ra được admin.
      const result = register({
        fullName: form.fullName,
        email: form.email,
        password: form.password,
        role: "user",
      });

      if (!result.ok) {
        setErrors({ email: result.error });
        return;
      }

      navigate("/dashboard");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <FormField
        label="Họ và tên"
        name="fullName"
        icon={User}
        placeholder="Nguyễn Văn A"
        value={form.fullName}
        onChange={handleChange}
        error={errors.fullName}
        autoComplete="name"
      />
      <FormField
        label="Email"
        name="email"
        type="email"
        icon={Mail}
        placeholder="ten@congty.com"
        value={form.email}
        onChange={handleChange}
        error={errors.email}
        autoComplete="email"
      />
      <FormField
        label="Mật khẩu"
        name="password"
        type="password"
        icon={Lock}
        placeholder="Tối thiểu 8 ký tự"
        value={form.password}
        onChange={handleChange}
        error={errors.password}
        autoComplete="new-password"
      />
      <FormField
        label="Nhập lại mật khẩu"
        name="confirmPassword"
        type="password"
        icon={Lock}
        placeholder="••••••••"
        value={form.confirmPassword}
        onChange={handleChange}
        error={errors.confirmPassword}
        autoComplete="new-password"
      />

      <div className="avc-terms">
        <label className={`avc-check avc-check-start ${errors.agree ? "avc-check-error" : ""}`}>
          <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} />
          <span>
            Tôi đồng ý với <a className="avc-link" href="#!">Điều khoản dịch vụ</a> &amp;{" "}
            <a className="avc-link" href="#!">Chính sách bảo mật</a>
          </span>
        </label>
        {errors.agree && <span className="avc-error-text">{errors.agree}</span>}
      </div>

      <button className="avc-submit" type="submit" disabled={submitting}>
        {submitting ? (
          <>
            <Loader2 size={16} className="avc-spin" /> Đang tạo tài khoản…
          </>
        ) : (
          <>
            Đăng ký <ArrowRight size={16} />
          </>
        )}
      </button>

      <div className="avc-footer">
        Đã có tài khoản?{" "}
        <a className="avc-link" onClick={onSwitchToLogin}>
          Đăng nhập
        </a>
      </div>
    </form>
  );
}

/** Panel phải: thẻ đăng nhập/đăng ký với tab chuyển đổi. */
function AuthCard() {
  const [mode, setMode] = useState("login");

  return (
    <div className="avc-card">
      <div className="avc-card-kicker">
        <ShieldCheck size={13} />
        Truy cập bảo mật
      </div>
      <h2 className="avc-card-title">
        {mode === "login" ? "Đăng nhập hệ thống" : "Tạo tài khoản mới"}
      </h2>
      <p className="avc-card-desc">
        {mode === "login"
          ? "Truy cập bảng điều khiển để giám sát và điều phối đội xe tự hành theo thời gian thực."
          : "Đăng ký để đặt chuyến hoặc giám sát vận hành trong hệ thống xe tự hành AUTOX."}
      </p>

      <div className="avc-tabs">
        <div className={`avc-tab-indicator ${mode === "register" ? "right" : ""}`} />
        <button
          className={`avc-tab ${mode === "login" ? "active" : ""}`}
          onClick={() => setMode("login")}
          type="button"
        >
          Đăng nhập
        </button>
        <button
          className={`avc-tab ${mode === "register" ? "active" : ""}`}
          onClick={() => setMode("register")}
          type="button"
        >
          Đăng ký
        </button>
      </div>

      {mode === "login" ? (
        <LoginForm onSwitchToRegister={() => setMode("register")} />
      ) : (
        <RegisterForm onSwitchToLogin={() => setMode("login")} />
      )}

      <div className="avc-shield">
        <ShieldCheck size={13} /> Mã hoá 256-bit · SOC 2 Type II
      </div>
    </div>
  );
}

/**
 * Trang đăng nhập / đăng ký cho hệ thống điều khiển xe tự hành AUTOX.
 * Thay thế Login.jsx + Register.jsx cũ — cùng một component, chuyển
 * đổi bằng tab thay vì đổi route.
 *
 * Import ở router, ví dụ:
 *   <Route path="/login" element={<AuthPage />} />
 *   <Route path="/register" element={<Navigate to="/login" replace />} />
 */
export default function AuthPage() {
  return (
    <div className="avc-root">
      <div className="avc-grid-overlay" />
      <SystemPanel />
      <div className="avc-right">
        <AuthCard />
      </div>
    </div>
  );
}
