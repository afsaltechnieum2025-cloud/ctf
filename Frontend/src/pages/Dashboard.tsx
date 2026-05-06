import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { API } from '@/utils/api';
import { PRODUCT_COUNT } from '@/data/productCatalog';
import { Loader2, Package, Users } from 'lucide-react';

export default function Dashboard() {
  const { username, token } = useAuth();
  const [userCount, setUserCount] = useState<number | null>(null);
  const [statsError, setStatsError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      if (!token) return;
      setStatsError(false);
      try {
        const res = await fetch(`${API}/stats/dashboard`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error('bad status');
        const data = await res.json();
        if (!cancelled && typeof data.userCount === 'number') {
          setUserCount(data.userCount);
        }
      } catch {
        if (!cancelled) {
          setStatsError(true);
          setUserCount(null);
        }
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [token]);

  return (
    <DashboardLayout
      title={`Welcome back, ${username || 'User'}`}
      description="Here's an overview of your pentest operations"
    >
      <div className="grid w-full gap-4 sm:grid-cols-2">
        <Card className="border-border/60 bg-card/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Users</CardTitle>
            <Users className="h-4 w-4 text-primary" aria-hidden />
          </CardHeader>
          <CardContent>
            {userCount === null && !statsError ? (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
                <span className="text-sm">Loading…</span>
              </div>
            ) : statsError ? (
              <p className="text-2xl font-bold text-muted-foreground">—</p>
            ) : (
              <p className="text-3xl font-bold tabular-nums tracking-tight">{userCount}</p>
            )}
            <p className="mt-1 text-xs text-muted-foreground">Registered accounts in the portal</p>
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-card/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Products</CardTitle>
            <Package className="h-4 w-4 text-primary" aria-hidden />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold tabular-nums tracking-tight">{PRODUCT_COUNT}</p>
            <p className="mt-1 text-xs text-muted-foreground">Vendor profiles on the Products page</p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
