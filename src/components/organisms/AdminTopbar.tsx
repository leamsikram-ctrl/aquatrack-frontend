import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { notificationsApi } from '../../api/notifications';
import { EmptyState } from '../molecules/EmptyState';
import { AllCaughtUpIllustration } from '../illustrations';
import {
  NOTIFICATIONS_UPDATED_EVENT,
  dispatchNotificationsUpdated,
} from '../../services/notificationService';
import {
  IconMenu2,
  IconMail,
  IconChecklist,
  IconBell,
  IconChevronDown,
  IconUser,
  IconSettings,
  IconHistory,
  IconLogout,
  IconAlertTriangle,
  IconClipboardList,
  IconShieldCheck,
  IconTool,
  IconX,
} from '@tabler/icons-react';

export interface AdminTopbarProps {
  title?: string;
  subtitle?: string;
  isSidebarCollapsed?: boolean;
  onToggleSidebar?: () => void;
  onNavigate?: (path: string) => void;
  className?: string;
}

interface AdminNotificationItem {
  id: string;
  type: 'request' | 'system' | 'advisory' | 'bill' | 'cancellation';
  message: string;
  time: string;
  read: boolean;
  link?: string;
}

const DEFAULT_ADMIN_NOTIFICATIONS: AdminNotificationItem[] = [
  {
    id: 'a-notif-1',
    type: 'request',
    message: 'New service request AT-2026-0015 submitted from Barangay San Isidro.',
    time: '5 mins ago',
    read: false,
    link: '/admin/requests',
  },
  {
    id: 'a-notif-2',
    type: 'system',
    message: 'New customer registration pending verification: Pedro Penduko.',
    time: '30 mins ago',
    read: false,
    link: '/admin/verification',
  },
  {
    id: 'a-notif-3',
    type: 'advisory',
    message: 'Water advisory broadcast published for Barangay Poblacion.',
    time: '1 day ago',
    read: true,
    link: '/admin/interruptions',
  },
];

export const AdminTopbar: React.FC<AdminTopbarProps> = ({
  isSidebarCollapsed = false,
  onToggleSidebar,
  onNavigate,
  className = '',
}) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [isMessagesOpen, setIsMessagesOpen] = useState(false);
  const [isTasksOpen, setIsTasksOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const messagesRef = useRef<HTMLDivElement>(null);
  const tasksRef = useRef<HTMLDivElement>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  const [notifications, setNotifications] = useState<AdminNotificationItem[]>(() => {
    try {
      const saved = localStorage.getItem('aquatrack_notifications_admin');
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return DEFAULT_ADMIN_NOTIFICATIONS;
  });

  useEffect(() => {
    let isMounted = true;
    if (typeof notificationsApi?.list === 'function') {
      notificationsApi.list({ per_page: 25 }).then((res) => {
        if (!isMounted || !res?.data) return;
        const mapped: AdminNotificationItem[] = res.data.map((n) => ({
          id: `api-notif-${n.id}`,
          title: n.title,
          message: n.message,
          time: new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          read: Boolean(n.read_at),
          type: n.related_type === 'service_request' ? 'request' : n.related_type === 'interruption' ? 'advisory' : 'system',
        }));

        if (mapped.length > 0) {
          setNotifications((prev) => {
            const seen = new Set(mapped.map((m) => m.id));
            const filteredPrev = prev.filter((p) => !seen.has(p.id));
            return [...mapped, ...filteredPrev];
          });
        }
      }).catch(() => {});
    }

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    const handleSync = () => {
      try {
        const saved = localStorage.getItem('aquatrack_notifications_admin');
        if (saved) {
          setNotifications(JSON.parse(saved));
        }
      } catch {
        // fallback
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener(NOTIFICATIONS_UPDATED_EVENT, handleSync);
      window.addEventListener('storage', handleSync);
    }
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener(NOTIFICATIONS_UPDATED_EVENT, handleSync);
        window.removeEventListener('storage', handleSync);
      }
    };
  }, []);

  const saveNotifications = (newNotifs: AdminNotificationItem[]) => {
    setNotifications(newNotifs);
    try {
      localStorage.setItem('aquatrack_notifications_admin', JSON.stringify(newNotifs));
    } catch {
      // ignore
    }
    dispatchNotificationsUpdated();
  };

  const markAllRead = () => {
    saveNotifications(notifications.map((n) => ({ ...n, read: true })));
    notificationsApi?.markAllAsRead?.().catch(() => {});
  };

  const dismissNotif = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    saveNotifications(notifications.filter((n) => n.id !== id));
    if (id.startsWith('api-notif-')) {
      const realId = id.replace('api-notif-', '');
      notificationsApi?.delete?.(realId).catch(() => {});
    }
  };

  const handleNotifClick = (id: string, link?: string) => {
    saveNotifications(notifications.map((n) => (n.id === id ? { ...n, read: true } : n)));
    if (link) {
      handleNav(link);
    }
  };

  const renderNotifIcon = (type: AdminNotificationItem['type']) => {
    switch (type) {
      case 'request':
        return <IconTool size={15} className="text-brand-blue shrink-0 mt-0.5" />;
      case 'system':
        return <IconShieldCheck size={15} className="text-brand-blue shrink-0 mt-0.5" />;
      case 'advisory':
        return <IconAlertTriangle size={15} className="text-brand-blue shrink-0 mt-0.5" />;
      default:
        return <IconBell size={15} className="text-black/70 shrink-0 mt-0.5" />;
    }
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (messagesRef.current && !messagesRef.current.contains(target)) {
        setIsMessagesOpen(false);
      }
      if (tasksRef.current && !tasksRef.current.contains(target)) {
        setIsTasksOpen(false);
      }
      if (notificationsRef.current && !notificationsRef.current.contains(target)) {
        setIsNotificationsOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(target)) {
        setIsProfileOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    setIsProfileOpen(false);
    await logout();
    navigate('/login');
  };

  const handleNav = (path: string) => {
    setIsMessagesOpen(false);
    setIsTasksOpen(false);
    setIsNotificationsOpen(false);
    setIsProfileOpen(false);
    if (onNavigate) {
      onNavigate(path);
    } else {
      navigate(path);
    }
  };

  const userName =
    user?.role === 'admin'
      ? (user.name && user.name.toLowerCase() !== 'account user' && user.name.toLowerCase() !== 'maria santos'
          ? user.name
          : 'SIWASS Administrator')
      : user?.name || 'Administrator';
  const userAvatar =
    user?.avatar && user.avatar !== '/default-avatar.svg' ? user.avatar : null;
  const userInitials =
    user?.role === 'admin' ? 'A' : userName.trim().charAt(0).toUpperCase() || 'A';

  return (
    <header
      className={`h-16 bg-white shadow-sm sticky top-0 z-30 select-none text-[14px] ${className}`}
    >
      <div className="w-full px-4 sm:px-6 flex items-center justify-between h-full">
        {/* Left side: Sidebar Toggle Button (matches target layout arrangement) */}
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleSidebar}
            className={`p-2 rounded bg-white border border-black/10 shadow-[0_2px_0_0_rgba(0,0,0,0.08)] hover:bg-black/5 hover:border-black/20 active:translate-y-0.5 active:shadow-[0_1px_0_0_rgba(0,0,0,0.08)] text-black transition-all flex items-center justify-center cursor-pointer ${
              isSidebarCollapsed ? 'bg-black/10' : ''
            }`}
            aria-label={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            title={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <IconMenu2 size={18} />
          </button>
        </div>

        {/* Right side: Messages, Tasks, Notifications, User Profile dropdown (exact sequence from picture) */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* 1. Messages Dropdown */}
          <div className="relative" ref={messagesRef}>
            <button
              onClick={() => {
                setIsMessagesOpen(!isMessagesOpen);
                setIsTasksOpen(false);
                setIsNotificationsOpen(false);
                setIsProfileOpen(false);
              }}
              title="Messages & Communication"
              className="flex items-center gap-1 p-2 rounded bg-white border border-black/10 shadow-[0_2px_0_0_rgba(0,0,0,0.08)] hover:border-black/20 active:translate-y-0.5 active:shadow-[0_1px_0_0_rgba(0,0,0,0.08)] text-black hover:bg-black/5 transition-all cursor-pointer"
            >
              <div className="relative">
                <IconMail size={16} />
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-brand-blue rounded-full" />
              </div>
              <IconChevronDown size={12} className="text-black/60 hidden sm:inline" />
            </button>

            {isMessagesOpen && (
              <div className="absolute right-0 mt-2 w-72 bg-white border border-black/10 rounded-lg shadow-[0_6px_0_0_rgba(0,0,0,0.1)] py-2 z-50 text-[13px] animate-hero-entrance">
                <div className="px-3 py-1.5 border-b border-black/10 flex items-center justify-between font-semibold text-black">
                  <span>Communications</span>
                  <span className="text-[11px] text-brand-blue font-medium bg-black/5 px-1.5 py-0.5 rounded">
                    Gateway active
                  </span>
                </div>
                <div className="divide-y divide-black/10 max-h-60 overflow-y-auto">
                  <button
                    onClick={() => handleNav('/admin/interruptions')}
                    className="w-full text-left p-2.5 hover:bg-black/5 transition-colors flex items-start gap-2 text-black"
                  >
                    <IconAlertTriangle size={15} className="text-brand-blue shrink-0 mt-0.5" />
                    <div>
                      <div className="font-medium text-black">Advisory Broadcast</div>
                      <div className="text-[12px] text-black/60">Publish water interruption notices</div>
                    </div>
                  </button>
                  <button
                    onClick={() => handleNav('/admin/settings')}
                    className="w-full text-left p-2.5 hover:bg-black/5 transition-colors flex items-start gap-2 text-black"
                  >
                    <IconMail size={15} className="text-black/70 shrink-0 mt-0.5" />
                    <div>
                      <div className="font-medium text-black">SMS Gateway Settings</div>
                      <div className="text-[12px] text-black/60">Sinacaban utility SMS gateway configuration</div>
                    </div>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* 2. Tasks / Operations Dropdown */}
          <div className="relative" ref={tasksRef}>
            <button
              onClick={() => {
                setIsTasksOpen(!isTasksOpen);
                setIsMessagesOpen(false);
                setIsNotificationsOpen(false);
                setIsProfileOpen(false);
              }}
              title="Operations Tasks"
              className="flex items-center gap-1 p-2 rounded bg-white border border-black/10 shadow-[0_2px_0_0_rgba(0,0,0,0.08)] hover:border-black/20 active:translate-y-0.5 active:shadow-[0_1px_0_0_rgba(0,0,0,0.08)] text-black hover:bg-black/5 transition-all cursor-pointer"
            >
              <div className="relative">
                <IconChecklist size={16} />
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-brand-blue rounded-full" />
              </div>
              <IconChevronDown size={12} className="text-black/60 hidden sm:inline" />
            </button>

            {isTasksOpen && (
              <div className="absolute right-0 mt-2 w-72 bg-white border border-black/10 rounded-lg shadow-[0_6px_0_0_rgba(0,0,0,0.1)] py-2 z-50 text-[13px] animate-hero-entrance">
                <div className="px-3 py-1.5 border-b border-black/10 flex items-center justify-between font-semibold text-black">
                  <span>Operations Tasks</span>
                  <span className="text-[11px] text-black/60 font-normal">Active queues</span>
                </div>
                <div className="divide-y divide-black/10 max-h-60 overflow-y-auto">
                  <button
                    onClick={() => handleNav('/admin/requests')}
                    className="w-full text-left p-2.5 hover:bg-black/5 transition-colors flex items-start gap-2 text-black"
                  >
                    <IconClipboardList size={15} className="text-brand-blue shrink-0 mt-0.5" />
                    <div>
                      <div className="font-medium text-black">Service Requests</div>
                      <div className="text-[12px] text-black/60">Review dispatch and repair queue</div>
                    </div>
                  </button>
                  <button
                    onClick={() => handleNav('/admin/verification')}
                    className="w-full text-left p-2.5 hover:bg-black/5 transition-colors flex items-start gap-2 text-black"
                  >
                    <IconShieldCheck size={15} className="text-brand-blue shrink-0 mt-0.5" />
                    <div>
                      <div className="font-medium text-black">Customer Verification</div>
                      <div className="text-[12px] text-black/60">Pending meter accounts & QR tags</div>
                    </div>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* 3. Notifications Bell Dropdown */}
          <div className="relative" ref={notificationsRef}>
            <button
              onClick={() => {
                setIsNotificationsOpen(!isNotificationsOpen);
                setIsMessagesOpen(false);
                setIsTasksOpen(false);
                setIsProfileOpen(false);
              }}
              title={unreadCount > 0 ? `Notifications (${unreadCount} unread)` : 'Notifications'}
              aria-label={unreadCount > 0 ? `Notifications (${unreadCount} unread)` : 'Notifications'}
              aria-expanded={isNotificationsOpen}
              className="flex items-center gap-1 p-2 rounded bg-white border border-black/10 shadow-[0_2px_0_0_rgba(0,0,0,0.08)] hover:border-black/20 active:translate-y-0.5 active:shadow-[0_1px_0_0_rgba(0,0,0,0.08)] text-black hover:bg-black/5 transition-all cursor-pointer relative"
            >
              <div className="relative flex items-center justify-center">
                <IconBell size={16} />
                {unreadCount > 0 && (
                  <span
                    data-testid="notification-badge"
                    className="absolute -top-2 -right-2.5 min-w-[17px] h-[17px] px-1 bg-red-600 text-white text-[10px] font-bold rounded-full border-2 border-white flex items-center justify-center leading-none shadow-xs pointer-events-none"
                  >
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </div>
              <IconChevronDown size={12} className="text-black/60 hidden sm:inline" />
            </button>

            {isNotificationsOpen && (
              <div className="absolute right-0 mt-2 w-80 bg-white border border-black/10 rounded-lg shadow-[0_6px_0_0_rgba(0,0,0,0.1)] py-2 z-50 text-[13px] animate-hero-entrance">
                <div className="px-3 py-1.5 border-b border-black/10 flex items-center justify-between font-semibold text-black">
                  <div className="flex items-center gap-1.5">
                    <span>Notifications</span>
                    {unreadCount > 0 && (
                      <span className="text-[11px] text-white font-bold bg-red-600 px-1.5 py-0.5 rounded-full">
                        {unreadCount} new
                      </span>
                    )}
                  </div>
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllRead}
                      className="text-[11px] text-brand-blue hover:underline font-normal cursor-pointer"
                    >
                      Mark all read
                    </button>
                  )}
                </div>

                <div className="divide-y divide-black/10 max-h-72 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <EmptyState
                      illustration={<AllCaughtUpIllustration className="h-24 w-auto" />}
                      title="All caught up"
                      description="You have no notifications."
                      className="border-none shadow-none py-4 bg-transparent"
                    />
                  ) : (
                    notifications.map((notif) => (
                      <div
                        key={notif.id}
                        onClick={() => handleNotifClick(notif.id, notif.link)}
                        className={`w-full text-left p-2.5 hover:bg-black/5 transition-colors flex items-start gap-2.5 cursor-pointer ${
                          !notif.read ? 'bg-brand-blue/5' : ''
                        }`}
                      >
                        <div className="shrink-0 mt-0.5">
                          {renderNotifIcon(notif.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div
                            className={`text-[12px] leading-snug ${
                              !notif.read ? 'font-medium text-black' : 'text-black/80'
                            }`}
                          >
                            {notif.message}
                          </div>
                          <div className="text-[11px] text-black/50 mt-1 flex items-center gap-1.5">
                            <span>{notif.time}</span>
                            {!notif.read && (
                              <span className="w-1.5 h-1.5 rounded-full bg-brand-blue" />
                            )}
                          </div>
                        </div>
                        <button
                          onClick={(e) => dismissNotif(e, notif.id)}
                          title="Dismiss notification"
                          className="p-1 text-black/40 hover:text-black rounded hover:bg-black/10 shrink-0 transition-colors cursor-pointer"
                        >
                          <IconX size={12} />
                        </button>
                      </div>
                    ))
                  )}
                </div>

                <div className="px-3 pt-2 mt-1 border-t border-black/10 text-center">
                  <button
                    onClick={() => handleNav('/admin/activity-log')}
                    className="text-[12px] text-brand-blue hover:underline font-medium cursor-pointer"
                  >
                    View Activity Log →
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* 4. User Profile Dropdown */}
          <div className="relative" ref={profileRef}>
            <button
              onClick={() => {
                setIsProfileOpen(!isProfileOpen);
                setIsMessagesOpen(false);
                setIsTasksOpen(false);
                setIsNotificationsOpen(false);
              }}
              className="flex items-center gap-2 px-2.5 py-1.5 rounded bg-white border border-black/10 shadow-[0_2px_0_0_rgba(0,0,0,0.08)] hover:border-black/20 active:translate-y-0.5 active:shadow-[0_1px_0_0_rgba(0,0,0,0.08)] hover:bg-black/5 transition-all cursor-pointer"
              title="Account menu"
            >
              {userAvatar ? (
                <img
                  src={userAvatar}
                  alt={userName}
                  className="w-6 h-6 rounded-full object-cover border border-black/20 shrink-0"
                />
              ) : (
                <div className="w-6 h-6 rounded-full bg-black text-white flex items-center justify-center font-bold text-[11px] shrink-0 shadow-[0_1px_0_0_rgba(0,0,0,0.2)]">
                  {userInitials || <IconUser size={13} />}
                </div>
              )}
              <span className="font-medium text-black text-[13px] hidden sm:inline max-w-[120px] truncate">
                {userName}
              </span>
              <IconChevronDown size={12} className="text-black/60" />
            </button>

            {isProfileOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white border border-black/10 rounded-lg shadow-[0_6px_0_0_rgba(0,0,0,0.1)] py-1 z-50 text-[13px] animate-hero-entrance">
                <div className="px-3.5 py-2.5 border-b border-black/10">
                  <div className="font-semibold text-black truncate">{userName}</div>
                  <div className="text-[12px] text-black/60 truncate">
                    {user?.role === 'admin' ? 'admin@siwass.gov' : (user?.email || 'admin@siwass.gov')}
                  </div>
                  <div className="text-[10px] uppercase font-semibold text-brand-blue mt-1">
                    Municipal Administrator
                  </div>
                </div>

                <div className="py-1">
                  <button
                    onClick={() => handleNav('/admin/settings')}
                    className="w-full text-left px-3.5 py-2 hover:bg-black/5 flex items-center gap-2 text-black transition-colors"
                  >
                    <IconSettings size={15} className="text-black/70" />
                    <span>Settings</span>
                  </button>
                  <button
                    onClick={() => handleNav('/admin/activity-log')}
                    className="w-full text-left px-3.5 py-2 hover:bg-black/5 flex items-center gap-2 text-black transition-colors"
                  >
                    <IconHistory size={15} className="text-black/70" />
                    <span>Activity Log</span>
                  </button>
                </div>

                <div className="border-t border-black/10 pt-1">
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-3.5 py-2 hover:bg-black/5 flex items-center gap-2 text-black font-medium transition-colors"
                  >
                    <IconLogout size={15} className="text-black/70" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

