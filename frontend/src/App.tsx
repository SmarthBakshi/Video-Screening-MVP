import { Link, Outlet } from 'react-router-dom'

export default function App() {
  return (
    <div style={{ padding: 16, fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, sans-serif' }}>
      <header style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
        <Link to="/admin" style={{ textDecoration: 'none' }}>Admin</Link>
      </header>

      {/* Route content renders here (Admin, Record, Video, etc.) */}
      <Outlet />
    </div>
  )
}
