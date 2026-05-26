import React from 'react';

const ADMIN_TABS = [
  { id: 'dashboard',  icon: 'bi-squares-fill',   iconOut: 'bi-squares',       label: 'Dashboard' },
  { id: 'blogs',      icon: 'bi-journal-text',   iconOut: 'bi-journal',       label: 'Blogs' },
  { id: 'inquiries',  icon: 'bi-envelope-fill',  iconOut: 'bi-envelope',      label: 'Anfragen' },
  { id: 'users',      icon: 'bi-person-2-fill',  iconOut: 'bi-person-2',      label: 'Benutzer' },
  { id: 'seo',        icon: 'bi-search',         iconOut: 'bi-search',        label: 'SEO' },
];

const EDITOR_TABS = [
  { id: 'blogs',  icon: 'bi-journal-text', iconOut: 'bi-journal', label: 'Blogs' },
];

export default function BottomNav({ user, page, onNavigate }) {
  if (!user) return null;
  const tabs = user.role === 'admin' ? ADMIN_TABS : EDITOR_TABS;

  return (
    <nav className="bottom-nav" role="tablist" aria-label="Navigation">
      {tabs.map(tab => {
        const active = page === tab.id;
        return (
          <button
            key={tab.id}
            role="tab"
            aria-selected={active}
            className={`bottom-nav-item${active ? ' active' : ''}`}
            onClick={() => onNavigate(tab.id)}
          >
            <i className={`bi ${active ? tab.icon : tab.iconOut} tab-icon`} />
            {tab.label}
          </button>
        );
      })}
    </nav>
  );
}
