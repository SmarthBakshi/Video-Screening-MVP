import { Outlet, Link } from 'react-router-dom'


export default function App() {
return (
    <div style={{ padding: 16, fontFamily: 'system-ui, sans-serif' }}>
        <header style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
            <Link to="/admin">Admin</Link>
        </header>
        <Outlet />
    </div>
)
}