import {
  ArrowUpRight,
  BarChart3,
  ChevronDown,
  CircleDollarSign,
  LayoutDashboard,
  Settings,
  Tags,
} from 'lucide-react';
import type { PageId } from '../types';

type NavigationProps = {
  activePage: PageId;
  onNavigate: (page: PageId) => void;
};

const pages: { id: PageId; label: string; icon: typeof LayoutDashboard }[] = [
  { id: 'dashboard', label: 'Áttekintés', icon: LayoutDashboard },
  { id: 'transactions', label: 'Tranzakciók', icon: ArrowUpRight },
  { id: 'categories', label: 'Kategóriák', icon: Tags },
  { id: 'budgets', label: 'Keretek', icon: BarChart3 },
];

export function Navigation({ activePage, onNavigate }: NavigationProps) {
  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="logo"><CircleDollarSign size={23} /></div>
        <span>FinTrack</span>
      </div>
      <nav aria-label="Fő navigáció">
        {pages.map(({ id, label, icon: Icon }) => (
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
          <div className="avatar">VK</div>
          <div><b>Valkenzzo</b><span>Prototípus</span></div>
          <ChevronDown size={16} />
        </div>
      </div>
    </aside>
  );
}