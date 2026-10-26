import {
  ArrowUpRight,
  BarChart3,
  LogOut,
  CircleDollarSign,
  LayoutDashboard,
  Settings,
  ShieldCheck,
  Tags,
} from 'lucide-react';
import type { AuthUser, PageId } from '../types';

type NavigationProps = {
  activePage: PageId;
  onNavigate: (page: PageId) => void;
  user: AuthUser;
  onLogout: () => void;
};

const pages: { id: PageId; label: string; icon: typeof LayoutDashboard }[] = [
  { id: 'dashboard', label: 'Áttekintés', icon: LayoutDashboard },
  { id: 'transactions', label: 'Tranzakciók', icon: ArrowUpRight },
  { id: 'categories', label: 'Kategóriák', icon: Tags },
  { id: 'budgets', label: 'Keretek', icon: BarChart3 },
  { id: 'approvals', label: 'Jóváhagyások', icon: ShieldCheck },
];

export function Navigation({ activePage, onNavigate, user, onLogout }: NavigationProps) {
  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="logo"><CircleDollarSign size={23} /></div>
        <span>FinTrack</span>
      </div>
      <nav aria-label="Fő navigáció">
        {pages.filter(({ id }) => id !== 'approvals' || user.role === 'FamilyAdmin').map(({ id, label, icon: Icon }) => (
          <button
            aria-current={activePage === id ? 'page' : undefined}
            className={`nav ${activePage === id ? 'active' : ''}`}
            key={id}
            onClick={() => onNavigate(id)}
            type="button"
          >
            <Icon />
            <span>{label}</span>
          </button>
        ))}
      </nav>
      <div className="side-bottom">
        <button className="nav" type="button" disabled>
          <Settings />
          <span>Beállítások</span>
        </button>
        <div className="profile">
          <div className="avatar">{user.displayName.slice(0, 2).toUpperCase()}</div>
          <div><b>{user.displayName}</b><span>{user.role === 'FamilyAdmin' ? 'Családi admin' : 'Felhasználó'}</span></div>
          <button aria-label="Kijelentkezés" className="icon-button" onClick={onLogout} type="button"><LogOut size={16} /></button>
        </div>
      </div>
    </aside>
  );
}