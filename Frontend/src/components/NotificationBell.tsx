import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Bell, CheckCheck, Search, FolderOpen, User } from 'lucide-react';
import { NOTIFY_EVENT } from '@/utils/notifyRefresh';
import { API } from '@/utils/api';


type Notification = {
  id: number;
  title: string;
  message: string;
  type: string;
  is_read: number;
  created_at: string;
};

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)  return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

const TYPE_CONFIG: Record<string, {
  IconComponent: React.ElementType;
  bg: string;
  border: string;
  iconColor: string;
  dot: string;
}> = {
  finding: {
    IconComponent: Search,
    bg: 'hsl(var(--destructive) / 0.12)',
    border: 'hsl(var(--destructive) / 0.22)',
    iconColor: 'hsl(var(--destructive))',
    dot: 'hsl(var(--destructive))',
  },
  project: {
    IconComponent: FolderOpen,
    bg: 'hsl(var(--info) / 0.12)',
    border: 'hsl(var(--info) / 0.22)',
    iconColor: 'hsl(var(--info))',
    dot: 'hsl(var(--info))',
  },
  user: {
    IconComponent: User,
    bg: 'hsl(var(--primary) / 0.12)',
    border: 'hsl(var(--primary) / 0.22)',
    iconColor: 'var(--color-brand)',
    dot: 'var(--color-brand)',
  },
  general: {
    IconComponent: Bell,
    bg: 'hsl(var(--primary) / 0.08)',
    border: 'hsl(var(--primary) / 0.18)',
    iconColor: 'var(--color-brand)',
    dot: 'var(--color-brand-strong)',
  },
};

const DEFAULT_CFG = TYPE_CONFIG.general;

function NotificationList({ notifications }: { notifications: Notification[] }) {
  if (notifications.length === 0) {
    return (
      <div style={{
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: '48px 16px',
        color: 'hsl(var(--muted-foreground))',
      }}>
        <Bell size={36} style={{ opacity: 0.25, marginBottom: '12px', color: 'hsl(var(--muted-foreground))' }} />
        <p style={{ fontSize: '13px', margin: 0 }}>No notifications yet</p>
        <p style={{ fontSize: '11px', margin: '4px 0 0', opacity: 0.6, textAlign: 'center', maxWidth: 260, lineHeight: 1.45 }}>
          Admins and managers see activity across the portal. Testers see their assigned projects and their own actions.
        </p>
      </div>
    );
  }

  return (
    <>
      {notifications.map((n, i) => {
        const cfg = TYPE_CONFIG[n.type] ?? DEFAULT_CFG;
        const { IconComponent } = cfg;
        return (
          <div
            key={n.id}
            style={{
              display: 'flex',
              gap: '12px',
              padding: '12px 16px',
              borderBottom: i < notifications.length - 1
                ? '1px solid hsl(var(--border))' : 'none',
              background: !n.is_read ? 'hsl(var(--primary) / 0.06)' : 'transparent',
            }}
          >
            <div style={{
              width: '36px', height: '36px',
              borderRadius: '10px',
              background: cfg.bg,
              border: `1px solid ${cfg.border}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>
              <IconComponent size={15} color={cfg.iconColor} />
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <p style={{
                  margin: 0,
                  fontSize: '13px',
                  fontWeight: !n.is_read ? 600 : 400,
                  color: !n.is_read ? 'var(--color-heading)' : 'hsl(var(--muted-foreground))',
                  lineHeight: 1.3,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical' as const,
                }}>
                  {n.title}
                </p>
                {!n.is_read && (
                  <div style={{
                    width: '7px', height: '7px',
                    borderRadius: '50%',
                    background: cfg.dot,
                    flexShrink: 0,
                    marginTop: '4px', marginLeft: '8px',
                    boxShadow: `0 0 6px ${cfg.dot}`,
                  }} />
                )}
              </div>
              <p style={{
                margin: '3px 0 0', fontSize: '11px',
                color: 'var(--color-on-light-muted)', lineHeight: 1.45,
                overflow: 'hidden',
                display: '-webkit-box',
                WebkitLineClamp: 3,
                WebkitBoxOrient: 'vertical' as const,
              }}>
                {n.message}
              </p>
              <p style={{ margin: '4px 0 0', fontSize: '10px', color: 'hsl(var(--muted-foreground) / 0.85)' }}>
                {timeAgo(n.created_at)}
              </p>
            </div>
          </div>
        );
      })}
    </>
  );
}

function PanelHeader({ count }: { count: number }) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '14px 16px',
      borderBottom: '1px solid hsl(var(--border))',
      background: 'hsl(var(--primary) / 0.06)',
      flexShrink: 0,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div style={{
          width: '3px', height: '16px',
          background: 'linear-gradient(180deg, var(--color-brand), var(--color-brand-strong))',
          borderRadius: '2px',
        }} />
        <Bell size={14} color="var(--color-brand)" />
        <span id="notification-panel-title" style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-heading)' }}>
          Notifications
        </span>
        <span style={{
          fontSize: '10px', color: 'hsl(var(--muted-foreground))',
          background: 'hsl(var(--muted-foreground) / 0.1)',
          padding: '1px 6px', borderRadius: '999px',
        }}>
          {count}
        </span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
        <CheckCheck size={12} color="#22c55e" />
        <span style={{ fontSize: '11px', color: '#22c55e' }}>All read</span>
      </div>
    </div>
  );
}

function PanelFooter({ count, isMobile }: { count: number; isMobile: boolean }) {
  if (count === 0) return null;
  return (
    <div style={{
      padding: '10px 16px',
      paddingBottom: isMobile ? 'max(10px, env(safe-area-inset-bottom))' : '10px',
      borderTop: '1px solid hsl(var(--border))',
      background: 'hsl(var(--primary) / 0.04)',
      textAlign: 'center',
      flexShrink: 0,
    }}>
      <span style={{ fontSize: '11px', color: 'hsl(var(--muted-foreground))' }}>
        Showing last {count} notifications
      </span>
    </div>
  );
}

export default function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen]                   = useState(false);
  const [isMobile, setIsMobile]           = useState(false);
  const bellRef                           = useRef<HTMLDivElement>(null);
  const desktopDropRef                    = useRef<HTMLDivElement>(null);
  const token                             = localStorage.getItem('token');
  const unreadCount                       = notifications.filter(n => !n.is_read).length;

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 640);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const fetchNotifications = async () => {
    try {
      const res = await fetch(`${API}/notifications`, {
        cache: 'no-store',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return;
      const data = await res.json();
      if (Array.isArray(data)) setNotifications(data);
    } catch (err) {
      console.error('[Notify] fetch error:', err);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const id = setInterval(fetchNotifications, 30_000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    window.addEventListener(NOTIFY_EVENT, fetchNotifications);
    return () => window.removeEventListener(NOTIFY_EVENT, fetchNotifications);
  }, []);

  // Desktop only: close on outside click
  useEffect(() => {
    if (isMobile) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      const outsideBell = bellRef.current && !bellRef.current.contains(target);
      const outsideDrop = desktopDropRef.current && !desktopDropRef.current.contains(target);
      if (outsideBell && outsideDrop) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [isMobile]);

  // Lock body scroll when mobile sheet is open
  useEffect(() => {
    if (isMobile && open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isMobile, open]);

  const handleOpen = async () => {
    const opening = !open;
    setOpen(opening);
    if (opening && unreadCount > 0) {
      setNotifications(prev => prev.map(n => ({ ...n, is_read: 1 })));
      await fetch(`${API}/notifications/read-all`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      }).catch(() => {});
    }
  };

  // ── Mobile centered modal via portal — bypasses parent clipping ──
  const mobileSheet = (open && isMobile) ? createPortal(
    <>
      <div
        onClick={() => setOpen(false)}
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 99998,
          background: 'rgba(0,0,0,0.65)',
          backdropFilter: 'blur(6px)',
          WebkitBackdropFilter: 'blur(6px)',
        }}
      />

      {/* Full-screen flex centers the panel; pointer-events none so taps outside the card hit the backdrop */}
      <div
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 99999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          paddingTop: 'max(16px, env(safe-area-inset-top))',
          paddingRight: 'max(16px, env(safe-area-inset-right))',
          paddingBottom: 'max(16px, env(safe-area-inset-bottom))',
          paddingLeft: 'max(16px, env(safe-area-inset-left))',
          pointerEvents: 'none',
        }}
      >
        <div
          onClick={(e) => e.stopPropagation()}
          role="dialog"
          aria-modal="true"
          aria-labelledby="notification-panel-title"
          style={{
            pointerEvents: 'auto',
            width: '100%',
            maxWidth: 400,
            maxHeight: 'min(85dvh, calc(100vh - 32px))',
            background: 'hsl(var(--popover))',
            borderRadius: 16,
            border: '1px solid hsl(var(--border))',
            boxShadow: 'var(--shadow-dropdown)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          <PanelHeader count={notifications.length} />
          <div
            style={{
              flex: 1,
              minHeight: 0,
              overflowY: 'auto',
              overflowX: 'hidden',
              WebkitOverflowScrolling: 'touch',
              overscrollBehavior: 'contain',
            } as React.CSSProperties}
          >
            <NotificationList notifications={notifications} />
          </div>
          <PanelFooter count={notifications.length} isMobile={true} />
        </div>
      </div>
    </>,
    document.body,
  ) : null;

  return (
    <>
      <div style={{ position: 'relative' }} ref={bellRef}>
        {/* Bell button */}
        <button
          onClick={handleOpen}
          style={{
            position: 'relative',
            padding: '8px',
            borderRadius: '10px',
            background: open ? 'hsl(var(--primary) / 0.14)' : 'transparent',
            border: open ? '1px solid hsl(var(--primary) / 0.35)' : '1px solid transparent',
            cursor: 'pointer',
            color: open ? 'var(--color-brand)' : 'hsl(var(--muted-foreground))',
            transition: 'all 0.2s',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Bell size={20} />
          {unreadCount > 0 && (
            <span style={{
              position: 'absolute',
              top: '-4px', right: '-4px',
              minWidth: '18px', height: '18px',
              padding: '0 4px',
              fontSize: '10px', fontWeight: 700,
              background: 'var(--gradient-primary)',
              color: 'var(--color-heading)',
              borderRadius: '999px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 0 0 2px var(--color-page)',
            }}>
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </button>

        {/* Desktop dropdown — stays in normal DOM flow */}
        {open && !isMobile && (
          <div
            ref={desktopDropRef}
            style={{
              position: 'absolute',
              right: 0,
              top: 'calc(100% + 8px)',
              width: '380px',
              background: 'hsl(var(--popover))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '14px',
              boxShadow: 'var(--shadow-dropdown)',
              zIndex: 9999,
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <PanelHeader count={notifications.length} />
            <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
              <NotificationList notifications={notifications} />
            </div>
            <PanelFooter count={notifications.length} isMobile={false} />
          </div>
        )}
      </div>

      {/* Mobile centered modal via portal */}
      {mobileSheet}
    </>
  );
}