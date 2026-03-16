import { useEffect, useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { LayoutDashboard, List, BarChart2, Settings, Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function Layout() {
  const location = useLocation();
  const [isDark, setIsDark] = useState(false);

  const navItems = [
    { href: '/', label: 'Painel', icon: LayoutDashboard },
    { href: '/entries', label: 'Registros', icon: List },
    { href: '/analysis', label: 'Análise IA', icon: BarChart2 },
    { href: '/settings', label: 'Configurações', icon: Settings },
  ];

  useEffect(() => {
    const stored = localStorage.getItem('theme');
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    const nextIsDark = stored ? stored === 'dark' : prefersDark;
    setIsDark(nextIsDark);
    document.documentElement.classList.toggle('dark', nextIsDark);
  }, []);

  const toggleTheme = () => {
    const next = !isDark;
    setIsDark(next);
    document.documentElement.classList.toggle('dark', next);
    localStorage.setItem('theme', next ? 'dark' : 'light');
  };

  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/40 lg:flex-row">
      <aside className="fixed inset-y-0 left-0 z-10 hidden w-64 flex-col border-r bg-background lg:flex">
        <div className="flex h-14 items-center justify-between border-b px-6">
          <Link to="/" className="flex items-center gap-2 font-semibold">
            <span className="">Brag Docs</span>
          </Link>
          <Button variant="ghost" size="icon" onClick={toggleTheme} aria-label="Alternar tema">
            {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
        </div>
        <nav className="flex-1 overflow-y-auto py-4">
          <ul className="grid gap-1 px-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.href;
              return (
                <li key={item.href}>
                  <Link
                    to={item.href}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all hover:text-primary",
                      isActive
                        ? "bg-muted text-primary"
                        : "text-muted-foreground"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </aside>
      <main className="flex-1 lg:pl-64">
        <div className="p-4 lg:p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
