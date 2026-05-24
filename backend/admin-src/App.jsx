import React, { useState, useEffect } from 'react';
import Login from './components/Login';
import Sidebar from './components/Sidebar';
import Topbar from './components/Topbar';
import Dashboard from './pages/Dashboard';
import Blogs from './pages/Blogs';
import Inquiries from './pages/Inquiries';
import Tunnel from './pages/Tunnel';
import Users from './pages/Users';
import Logs from './pages/Logs';
import Seo from './pages/Seo';
import ToastContainer from './components/Toast';
import { getAccessToken, apiFetch, clearTokens } from './hooks/useApi';

const PAGES = { dashboard: Dashboard, blogs: Blogs, inquiries: Inquiries, tunnel: Tunnel, users: Users, logs: Logs, seo: Seo };
const ADMIN_ONLY_PAGES = ['dashboard', 'inquiries', 'tunnel', 'users', 'logs', 'seo'];

export default function App() {
  const [user, setUser] = useState(null);
  const [page, setPage] = useState('dashboard');
  const [checking, setChecking] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

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

  useEffect(() => {
    if (user?.role === 'editor' && ADMIN_ONLY_PAGES.includes(page)) {
      setPage('blogs');
    }
  }, [user?.role, page]);

  // Close sidebar on desktop resize
  useEffect(() => {
    function onResize() {
      if (window.innerWidth > 768) setSidebarOpen(false);
    }
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  function handleNavigate(newPage) {
    if (user?.role === 'editor' && ADMIN_ONLY_PAGES.includes(newPage)) return;
    setPage(newPage);
    setSidebarOpen(false);
  }

  if (checking) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner" />
      </div>
    );
  }

  if (!user) return (
    <>
      <Login onLogin={u => { setUser(u); if (u.role === 'editor') setPage('blogs'); }} />
      <ToastContainer />
    </>
  );

  const PageComponent = PAGES[page] || (user.role === 'editor' ? Blogs : Dashboard);

  return (
    <>
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />
      )}

      <div style={{ display: 'flex', minHeight: '100vh' }}>
        <Sidebar
          user={user}
          page={page}
          onPageChange={handleNavigate}
          onLogout={() => setUser(null)}
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />

        <div className="main-layout" style={{ marginLeft: 'var(--sidebar-w)' }}>
          <Topbar
            page={page}
            user={user}
            onMenuToggle={() => setSidebarOpen(s => !s)}
          />
          <main
            key={page}
            className="page-fade page-content"
            style={{
              padding: '1.875rem 2rem',
              flex: 1,
              maxWidth: 1280,
            }}
          >
            <PageComponent onNavigate={handleNavigate} />
          </main>
        </div>
      </div>

      <ToastContainer />
    </>
  );
}
