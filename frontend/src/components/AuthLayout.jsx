import TelemetryPanel from './TelemetryPanel.jsx'

export default function AuthLayout({ eyebrow, title, subtitle, children }) {
  return (
    <div className="auth-shell">
      <TelemetryPanel />

      <main className="form-panel">
        <div className="form-panel-inner">
          <span className="eyebrow">{eyebrow}</span>
          <h1 className="form-title">{title}</h1>
          <p className="form-subtitle">{subtitle}</p>
          {children}
        </div>
      </main>
    </div>
  )
}
