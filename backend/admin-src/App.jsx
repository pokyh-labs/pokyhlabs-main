import React, { useState, useEffect } from 'react';
import Login from './components/Login';
import Sidebar from './components/Sidebar';
import Topbar from './components/Topbar';
import BottomNav from './components/BottomNav';
import Dashboard from './pages/Dashboard';
import Blogs from './pages/Blogs';
import Inquiries from './pages/Inquiries';
import Users from './pages/Users';
import Logs from './pages/Logs';
import Seo from './pages/Seo';
import Projects from './pages/Projects';
import ToastContainer from './components/Toast';
import { getAccessToken, apiFetch, clearTokens } from './hooks/useApi';

const PAGES = {
  dashboard: Dashboard,
  blogs: Blogs,
  projects: Projects,
  inquiries: Inquiries,
  users: Users,
  logs: Logs,
  seo: Seo,
};
const ADMIN_ONLY = ['dashboard', 'projects', 'inquiries', 'users', 'logs', 'seo'];

export default function App() {
  const [user, setUser]               = useState(null);
  const [page, setPage]               = useState('dashboard');
  const [checking, setChecking]       = useState(true);
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
    if (user?.role === 'editor' && ADMIN_ONLY.includes(page)) setPage('blogs');
  }, [user?.role, page]);

  useEffect(() => {
    function onResize() {
      if (window.innerWidth > 768) setSidebarOpen(false);
    }
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  function handleNavigate(newPage) {
    if (user?.role === 'editor' && ADMIN_ONLY.includes(newPage)) return;
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

        <div className="main-layout" style={{ marginLeft: 'var(--sb-w)' }}>
          <Topbar
            page={page}
            user={user}
            onMenuToggle={() => setSidebarOpen(s => !s)}
          />
          <main
            key={page}
            className="page-fade page-content"
          >
            <PageComponent onNavigate={handleNavigate} />
          </main>
        </div>
      </div>

      <BottomNav user={user} page={page} onNavigate={handleNavigate} />
      <ToastContainer />
    </>
  );
}
