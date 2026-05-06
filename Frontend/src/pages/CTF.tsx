import DashboardLayout from '@/components/DashboardLayout';

export default function CTF() {
  return (
    <DashboardLayout title="CTF" description="Capture the flag challenges and practice">
      <div className="w-full rounded-xl border border-border/50 bg-card/30 p-10 text-center">
        <h2 className="text-2xl font-semibold text-gradient sm:text-3xl">Welcome to CTF</h2>
        <p className="mt-3 text-sm text-muted-foreground">
          CTF content and challenges will appear here.
        </p>
      </div>
    </DashboardLayout>
  );
}
