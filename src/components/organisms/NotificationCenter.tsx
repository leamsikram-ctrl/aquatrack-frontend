import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { notificationsApi } from '../../api/notifications';
import { EmptyState } from '../molecules/EmptyState';
import { AllCaughtUpIllustration } from '../illustrations';
import type { AppNotification } from '../../services/notificationService';
import {
  DEFAULT_NOTIFICATIONS,
  deduplicateNotifications,
  dispatchNotificationsUpdated,
} from '../../services/notificationService';
import {
  IconTool,
  IconReceipt,
  IconVolume,
  IconTrash,
  IconCheck,
  IconX,
  IconBell,
  IconCash,
} from '@tabler/icons-react';

export type { AppNotification };

interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
  role?: 'customer' | 'staff' | 'admin';
}

export function groupNotificationsByDay(notifications: AppNotification[]): Record<string, AppNotification[]> {
  const groups: Record<string, AppNotification[]> = {};

  for (const n of notifications) {
    let day = 'Today';

    if (n.created_at) {
      const d = new Date(n.created_at);
      if (!isNaN(d.getTime())) {
        const today = new Date();
        const yesterday = new Date();
        yesterday.setDate(today.getDate() - 1);

        if (
          d.getDate() === today.getDate() &&
          d.getMonth() === today.getMonth() &&
          d.getFullYear() === today.getFullYear()
        ) {
          day = 'Today';
        } else if (
          d.getDate() === yesterday.getDate() &&
          d.getMonth() === yesterday.getMonth() &&
          d.getFullYear() === yesterday.getFullYear()
        ) {
          day = 'Yesterday';
        } else {
          day = d.toLocaleDateString('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric',
          });
        }
      }
    } else if (n.time) {
      const lower = n.time.toLowerCase();
      if (
        lower.includes('min') ||
        lower.includes('hour') ||
        lower.includes('now') ||
        lower.includes('today')
      ) {
        day = 'Today';
      } else if (lower.includes('yesterday') || lower.includes('1 day')) {
        day = 'Yesterday';
      } else {
        day = 'Earlier';
      }
    }

    if (!groups[day]) {
      groups[day] = [];
    }
    groups[day].push(n);
  }

  return groups;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({
  isOpen,
  onClose,
  role = 'customer',
}) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const currentMeterNo =
    user?.customer_profile?.meter?.meter_number ||
    (user as any)?.meter_number ||
    (user as any)?.meter?.meter_number;

  const userKey = user?.id ? `aquatrack_notifications_${role}_${user.id}` : null;
  const globalKey = `aquatrack_notifications_${role}`;

  const loadCleanNotifications = (): AppNotification[] => {
    try {
      let combined: AppNotification[] = [];
      if (userKey) {
        const userSaved = localStorage.getItem(userKey);
        if (userSaved) {
          combined.push(...JSON.parse(userSaved));
        }
      }
      const globalSaved = localStorage.getItem(globalKey);
      if (globalSaved) {
        combined.push(...JSON.parse(globalSaved));
      }
      if (combined.length === 0) {
        combined = DEFAULT_NOTIFICATIONS[role] || DEFAULT_NOTIFICATIONS.customer;
      }
      const deduped = deduplicateNotifications(combined, currentMeterNo);
      // Clean up local storage so duplicate items are immediately purged
      if (globalSaved) {
        const cleanGlobal = deduplicateNotifications(JSON.parse(globalSaved), currentMeterNo);
        localStorage.setItem(globalKey, JSON.stringify(cleanGlobal));
      }
      return deduped;
    } catch {
      return DEFAULT_NOTIFICATIONS[role] || DEFAULT_NOTIFICATIONS.customer;
    }
  };

  const [notifications, setNotifications] = useState<AppNotification[]>(() => loadCleanNotifications());

  // Sync notifications whenever role or user changes
  useEffect(() => {
    setNotifications(loadCleanNotifications());
  }, [role, user?.id, currentMeterNo]);

  // Synchronize live notifications from backend API when opened
  useEffect(() => {
    if (!isOpen) return;
    if (typeof notificationsApi?.list !== 'function') return;

    let isMounted = true;
    const fetchApiNotifs = async () => {
      try {
        const res = await notificationsApi.list({ per_page: 50 });
        if (!isMounted || !res?.data) return;

        const mapped: AppNotification[] = res.data.map((n) => {
          let type: AppNotification['type'] = 'system';
          if (n.related_type === 'service_request') type = 'request';
          else if (n.related_type === 'billing') {
            type = n.message?.toLowerCase().includes('payment') ? 'payment' : 'bill';
          }
          else if (n.related_type === 'interruption') type = 'advisory';

          const d = new Date(n.created_at);
          const time = isNaN(d.getTime()) ? 'Recently' : d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

          return {
            id: `api-notif-${n.id}`,
            type,
            message: n.message,
            time,
            read: Boolean(n.read_at),
            created_at: n.created_at,
            related_type: n.related_type,
            related_id: n.related_id,
          };
        });

        if (mapped.length > 0) {
          setNotifications((prev) => deduplicateNotifications([...mapped, ...prev], currentMeterNo));
        }
      } catch {
        // Fall back gracefully to local storage
      }
    };

    fetchApiNotifs();
    return () => {
      isMounted = false;
    };
  }, [isOpen, currentMeterNo]);

  if (!isOpen) return null;

  const saveNotifications = (newNotifs: AppNotification[]) => {
    const deduped = deduplicateNotifications(newNotifs, currentMeterNo);
    setNotifications(deduped);
    try {
      if (userKey) {
        localStorage.setItem(userKey, JSON.stringify(deduped));
      }
      localStorage.setItem(globalKey, JSON.stringify(deduped));
    } catch {
      // Ignore
    }
    dispatchNotificationsUpdated();
  };

  const markAllRead = () => {
    saveNotifications(notifications.map((n) => ({ ...n, read: true })));
    notificationsApi?.markAllAsRead?.().catch(() => {});
  };

  const handleItemClick = (n: AppNotification) => {
    // 1. Mark notification as read
    if (!n.read) {
      saveNotifications(
        notifications.map((item) => (item.id === n.id ? { ...item, read: true } : item))
      );
      if (n.id.startsWith('api-notif-')) {
        const realId = n.id.replace('api-notif-', '');
        notificationsApi?.markAsRead?.(realId).catch(() => {});
      }
    }

    // 2. Determine target route based on explicit link, notification type, and user role
    let targetLink = n.link;
    if (!targetLink) {
      const type = n.type;
      const relType = n.related_type;

      if (type === 'request' || relType === 'service_request') {
        if (role === 'customer') targetLink = '/customer/requests';
        else if (role === 'staff') targetLink = '/staff/tasks';
        else targetLink = '/admin/maintenance';
      } else if (type === 'bill' || relType === 'billing') {
        if (role === 'customer') targetLink = '/customer/bills';
        else targetLink = '/admin/billing';
      } else if (type === 'advisory' || relType === 'interruption') {
        if (role === 'customer') targetLink = '/customer/advisories';
        else if (role === 'staff') targetLink = '/staff/tasks';
        else targetLink = '/admin/interruptions';
      } else if (type === 'cancellation') {
        if (role === 'customer') targetLink = '/customer/requests';
        else if (role === 'staff') targetLink = '/staff/tasks';
        else targetLink = '/admin/maintenance';
      } else if (type === 'payment') {
        if (role === 'customer') targetLink = '/customer/bills';
        else targetLink = '/admin/billing';
      } else if (type === 'system' || relType === 'customer_registration' || relType === 'customer_profile') {
        if (role === 'admin') targetLink = '/admin/users?verification=pending';
        else if (role === 'staff') targetLink = '/staff/profile';
        else targetLink = '/customer/profile';
      }
    }

    // 3. Close the drawer
    onClose();

    // 4. Navigate to destination
    if (targetLink) {
      navigate(targetLink);
    }
  };

  const deleteNotif = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    saveNotifications(notifications.filter((n) => n.id !== id));
    if (id.startsWith('api-notif-')) {
      const realId = id.replace('api-notif-', '');
      notificationsApi?.delete?.(realId).catch(() => {});
    }
  };

  const renderIcon = (type: AppNotification['type']) => {
    switch (type) {
      case 'request':
        return <IconTool size={15} className="text-brand-blue shrink-0" />;
      case 'bill':
        return <IconReceipt size={15} className="text-black shrink-0" />;
      case 'advisory':
        return <IconVolume size={15} className="text-brand-blue shrink-0" />;
      case 'payment':
        return <IconCash size={15} className="text-emerald-600 shrink-0" />;
      case 'cancellation':
        return <IconX size={15} className="text-red-600 shrink-0" />;
      default:
        return <IconBell size={15} className="text-black shrink-0" />;
    }
  };

  const unreadCount = notifications.filter((n) => !n.read).length;
  const groupedNotifications = groupNotificationsByDay(notifications);

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-end bg-black/40 p-2 sm:p-4 animate-fade-in">
      <div className="w-full max-w-sm bg-white rounded-lg border border-black shadow-2xl overflow-hidden flex flex-col text-[14px] text-black max-h-[calc(100vh-1rem)] sm:max-h-[calc(100vh-2rem)]">
        {/* Header */}
        <div className="flex items-center justify-between px-3.5 py-3 border-b border-black/15 bg-white">
          <div className="flex items-center gap-1.5">
            <button
              onClick={onClose}
              className="p-1 hover:text-brand-blue text-black font-medium flex items-center gap-1"
              title="Close notifications"
            >
              ← <span className="uppercase tracking-wider text-[14px]">Notifications</span>
            </button>
            {unreadCount > 0 && (
              <span className="px-1.5 py-0.5 bg-red-600 text-white rounded font-medium text-xs">
                {unreadCount} new
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={markAllRead}
              className="text-brand-blue hover:underline font-medium text-[14px] flex items-center gap-1"
            >
              <IconCheck size={13} />
              Mark all read
            </button>
            <button
              onClick={onClose}
              className="p-1 hover:text-brand-blue font-normal text-black"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Notifications List Grouped by Day */}
        <div className="flex-1 max-h-[calc(100vh-7rem)] overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="p-4">
              <EmptyState
                illustration={<AllCaughtUpIllustration />}
                title="All caught up"
                description="You have no notifications."
                className="border-none shadow-none py-8 bg-transparent"
              />
            </div>
          ) : (
            Object.entries(groupedNotifications).map(([dayLabel, items]) => (
              <div key={dayLabel} className="space-y-0">
                <div className="bg-gray-100/95 sticky top-0 z-10 px-3.5 py-1 text-xs font-semibold text-black/60 uppercase tracking-wider border-b border-black/10">
                  {dayLabel}
                </div>
                <div className="divide-y divide-black/10">
                  {items.map((n) => (
                    <div
                      key={n.id}
                      data-testid={`notification-item-${n.id}`}
                      onClick={() => handleItemClick(n)}
                      className={`p-3.5 flex items-start justify-between gap-3 cursor-pointer transition-colors ${
                        n.read ? 'bg-white hover:bg-black/5' : 'bg-black/[0.03] hover:bg-black/5'
                      }`}
                    >
                      <div className="flex items-start gap-2.5 flex-1">
                        <div className="mt-0.5">{renderIcon(n.type)}</div>
                        <div className="space-y-1 flex-1">
                          <p
                            className={`text-[14px] leading-snug ${
                              n.read ? 'text-black/80 font-normal' : 'text-black font-medium'
                            }`}
                          >
                            {n.message}
                          </p>
                          <div className="text-[14px] font-normal text-black/50 flex items-center gap-2">
                            <span>{n.time}</span>
                            {!n.read && (
                              <span
                                data-testid="unread-dot"
                                className="inline-block w-2 h-2 rounded-full bg-brand-blue shrink-0"
                                title="Unread notification"
                              />
                            )}
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={(e) => deleteNotif(e, n.id)}
                        className="p-1 text-black/40 hover:text-black rounded transition-colors"
                        title="Delete notification"
                      >
                        <IconTrash size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
