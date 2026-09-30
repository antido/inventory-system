// The page frame: sidebar on the left, top bar, and the current page (<Outlet />).
// On tablets and phones the sidebar slides in from the left (menu button).
import { Boxes, LogOut, Menu } from 'lucide-react';
import { useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { NAVIGATION } from '../navigation';
import { ThemeToggle } from './ThemeToggle';

export function Layout() {
  const { user, logout, can } = useAuth();
  const { pathname } = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  // Title of the current page for the top bar, taken from the menu.
  const currentPage = NAVIGATION.flatMap((section) => section.items).find((item) => pathname.startsWith(item.to));

  return (
    <div className="app-shell">
      <aside className={`sidebar ${menuOpen ? 'open' : ''}`}>
        <div className="brand">
          <span className="brand-mark">
            <Boxes size={18} />
          </span>
          StockFlow
        </div>

        <nav>
          {NAVIGATION.map((section) => {
            const items = section.items.filter((item) => can(item.privilege));
            if (items.length === 0) return null;
            return (
              <div key={section.title} className="nav-section">
                <p className="nav-title">{section.title}</p>
                {items.map((item) => (
                  <NavLink key={item.to} to={item.to} className="nav-link" onClick={() => setMenuOpen(false)}>
                    <item.icon size={18} />
                    {item.label}
                  </NavLink>
                ))}
              </div>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          <div className="avatar">{user?.name.charAt(0)}</div>
          <div className="sidebar-user">
            <p className="user-name">{user?.name}</p>
            <p className="user-role">{user?.role.name}</p>
          </div>
          <button className="icon-button" onClick={logout} title="Log out" aria-label="Log out">
            <LogOut size={18} />
          </button>
        </div>
      </aside>

      {menuOpen && <div className="sidebar-backdrop" onClick={() => setMenuOpen(false)} />}

      <div className="main">
        <header className="topbar">
          <button className="icon-button menu-button" onClick={() => setMenuOpen(true)} aria-label="Open menu">
            <Menu size={20} />
          </button>
          <p className="topbar-title">{currentPage?.label ?? 'StockFlow'}</p>
          <ThemeToggle />
        </header>

        <main className="content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
