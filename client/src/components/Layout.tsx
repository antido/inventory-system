// The page frame: sidebar on the left, top bar, and the current page (<Outlet />).
import { Boxes, LogOut, Menu } from 'lucide-react';
import { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { NAVIGATION } from '../navigation';

export function Layout() {
  const { user, logout, can } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="app-shell">
      <aside className={`sidebar ${menuOpen ? 'open' : ''}`}>
        <div className="brand">
          <Boxes size={22} />
          <span>StockFlow</span>
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
      </aside>

      {menuOpen && <div className="sidebar-backdrop" onClick={() => setMenuOpen(false)} />}

      <div className="main">
        <header className="topbar">
          <button className="icon-button menu-button" onClick={() => setMenuOpen(true)} aria-label="Open menu">
            <Menu size={20} />
          </button>
          <div className="topbar-user">
            <div className="avatar">{user?.name.charAt(0)}</div>
            <div>
              <p className="user-name">{user?.name}</p>
              <p className="user-role">{user?.role.name}</p>
            </div>
            <button className="icon-button" onClick={logout} title="Log out" aria-label="Log out">
              <LogOut size={18} />
            </button>
          </div>
        </header>

        <main className="content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
