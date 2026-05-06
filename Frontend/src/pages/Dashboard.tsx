import DashboardLayout from '@/components/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';

export default function Dashboard() {
  const { username } = useAuth();

  return (
    <DashboardLayout
      title={`Welcome back, ${username || 'User'}`}
      description="Here's an overview of your pentest operations"
    >
      <div className="space-y-6" />
    </DashboardLayout>
  );
}