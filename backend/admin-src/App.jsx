import React, { useState, useEffect } from 'react';
import Login from './components/Login';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Blogs from './pages/Blogs';
import Tunnel from './pages/Tunnel';
import Users from './pages/Users';
import ToastContainer from './components/Toast';
import { getAccessToken, apiFetch, clearTokens } from './hooks/useApi';

const PAGES = { dashboard: Dashboard, blogs: Blogs, tunnel: Tunnel, users: Users };

const ADMIN_ONLY_PAGES = ['dashboard', 'tunnel', 'users'];

export default function App() {
  const [user, setUser] = useState(null);
  const [page, setPage] = useState('dashboard');
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const token = getAccessToken();
    if (!token) { setChecking(false); return; }
    apiFetch('/auth/me')
      .then(async res => {
        if (res?.ok) setUser(await res.json());
        else clearTokens();
      })
      .catch(() => clearTokens())
      .finally(() => setChecking(false));
  }, []);

  // Redirect editors away from admin-only pages
  useEffect(() => {
    if (user?.role === 'editor' && ADMIN_ONLY_PAGES.includes(page)) {
      setPage('blogs');
    }
  }, [user?.role, page]);

  function handleNavigate(newPage) {
    if (user?.role === 'editor' && ADMIN_ONLY_PAGES.includes(newPage)) return;
    setPage(newPage);
  }

  if (checking) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <span className="spinner" style={{ width: 22, height: 22, borderWidth: 2.5 }} />
      </div>
    );
  }

  if (!user) return <><Login onLogin={u => { setUser(u); if (u.role === 'editor') setPage('blogs'); }} /><ToastContainer /></>;

  const PageComponent = PAGES[page] || (user.role === 'editor' ? Blogs : Dashboard);

  return (
    <>
      <div style={{ display: 'flex', minHeight: '100vh' }}>
        <Sidebar user={user} page={page} onPageChange={handleNavigate} onLogout={() => setUser(null)} />
        <main
          key={page}
          className="page-fade"
          style={{
            marginLeft: 'var(--sidebar-w)',
            padding: '2rem 2.25rem',
            flex: 1, minWidth: 0,
            maxWidth: 1200,
          }}
        >
          <PageComponent onNavigate={handleNavigate} />
        </main>
      </div>
      <ToastContainer />
    </>
  );
}
