import { ReactNode, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import AppSidebar from '@/components/AppSidebar';
import Footer from '@/components/Footer';
import NotificationBell from '@/components/NotificationBell';

interface DashboardLayoutProps {
  children: ReactNode;
  title: string;
  description?: string;
}

export default function DashboardLayout({ children, title, description }: DashboardLayoutProps) {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated) navigate('/login');
  }, [isAuthenticated, navigate]);

  if (!isAuthenticated) return null;

  return (
    <div className="flex min-h-screen w-full bg-background">
      <AppSidebar />
      <div className="flex-1 flex flex-col min-w-0">

        {/* Header */}
        <header className="sticky top-0 z-40 border-b border-border/50 bg-background/80 backdrop-blur-xl">
          <div className="flex items-center justify-between gap-3 px-3 py-3 sm:px-5 sm:py-4 lg:px-8">
            <div className="min-w-0 pl-10 md:pl-0">
              <h1 className="text-xl font-bold truncate sm:text-2xl">{title}</h1>
              {description && (
                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2 sm:text-sm sm:line-clamp-none">{description}</p>
              )}
            </div>

            {/* ← NotificationBell standalone, NO DropdownMenu wrapper */}
            <div className="flex shrink-0 items-center gap-3">
              <NotificationBell />
            </div>
          </div>
        </header>

        {/* Main content — full width of column; pages should not add extra side gutters unless needed */}
        <main className="flex-1 min-w-0 w-full overflow-auto px-3 py-4 sm:px-5 sm:py-5 lg:px-8 lg:py-6">
          {children}
        </main>

        <Footer />
      </div>
    </div>
  );
}
