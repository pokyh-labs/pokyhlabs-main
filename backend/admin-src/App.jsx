import React, { useState, useEffect, useRef } from 'react';
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

const gsap = window.gsap;

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
  const mainRef = useRef(null);

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
    if (gsap && mainRef.current) {
      gsap.to(mainRef.current, {
        opacity: 0, y: 8, duration: 0.15, ease: 'power2.in',
        onComplete: () => {
          setPage(newPage);
          setSidebarOpen(false);
        },
      });
    } else {
      setPage(newPage);
      setSidebarOpen(false);
    }
  }

  useEffect(() => {
    if (!mainRef.current || !gsap) return;
    gsap.fromTo(mainRef.current,
      { opacity: 0, y: 14, filter: 'blur(1.5px)' },
      {
        opacity: 1, y: 0, filter: 'blur(0px)', duration: 0.38, ease: 'power2.out',
        // Leftover inline transform/filter would make <main> the containing block
        // for position:fixed modals, trapping them inside the content area. Clear
        // them once the entrance finishes so modals anchor to the viewport again.
        onComplete: () => gsap.set(mainRef.current, { clearProps: 'transform,filter' }),
      }
    );
  }, [page]);

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
            ref={mainRef}
            className="page-content"
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
