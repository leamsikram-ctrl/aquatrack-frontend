import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { notificationsApi } from '../../api/notifications';
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
} from '@tabler/icons-react';

export type { AppNotification };

interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
  role?: 'customer' | 'staff' | 'admin';
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({
  isOpen,
  onClose,
  role = 'customer',
}) => {
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
          else if (n.related_type === 'billing') type = 'bill';
          else if (n.related_type === 'interruption') type = 'advisory';

          const d = new Date(n.created_at);
          const time = isNaN(d.getTime()) ? 'Recently' : d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

          return {
            id: `api-notif-${n.id}`,
            type,
            message: n.message,
            time,
            read: Boolean(n.read_at),
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

  const toggleRead = (id: string) => {
    saveNotifications(
      notifications.map((n) => (n.id === id ? { ...n, read: !n.read } : n))
    );
    if (id.startsWith('api-notif-')) {
      const realId = id.replace('api-notif-', '');
      notificationsApi?.markAsRead?.(realId).catch(() => {});
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
        return <IconTool size={13} className="text-[#1E6FD9] shrink-0" />;
      case 'bill':
        return <IconReceipt size={13} className="text-black shrink-0" />;
      case 'advisory':
        return <IconVolume size={13} className="text-[#1E6FD9] shrink-0" />;
      case 'cancellation':
        return <IconX size={13} className="text-black shrink-0" />;
      default:
        return <IconBell size={15} className="text-black shrink-0" />;
    }
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-end bg-black/40 p-2 sm:p-4 animate-fade-in">
      <div className="w-full max-w-sm bg-white rounded-lg border border-black shadow-2xl overflow-hidden flex flex-col text-[14px] text-black max-h-[calc(100vh-1rem)] sm:max-h-[calc(100vh-2rem)]">
        {/* Header */}
        <div className="flex items-center justify-between px-3.5 py-3 border-b border-black/15 bg-white">
          <div className="flex items-center gap-1.5">
            <button
              onClick={onClose}
              className="p-1 hover:text-[#1E6FD9] text-black font-medium flex items-center gap-1"
              title="Close notifications"
            >
              ← <span className="uppercase tracking-wider text-[14px]">Notifications</span>
            </button>
            {unreadCount > 0 && (
              <span className="px-1.5 py-0.5 bg-[#1E6FD9] text-white rounded font-medium text-xs">
                {unreadCount} new
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={markAllRead}
              className="text-[#1E6FD9] hover:underline font-medium text-[14px] flex items-center gap-1"
            >
              <IconCheck size={13} />
              Mark all read
            </button>
            <button
              onClick={onClose}
              className="p-1 hover:text-[#1E6FD9] font-normal text-black"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Notifications List */}
        <div className="flex-1 max-h-[calc(100vh-7rem)] overflow-y-auto divide-y divide-black/10">
          {notifications.length === 0 ? (
            <div className="p-8 text-center text-black/60">
              <IconBell size={28} className="mx-auto mb-2 text-black/30" />
              <div className="font-medium text-[14px] uppercase tracking-wider">No notifications</div>
              <div className="text-[14px] font-normal text-black/50 mt-1">
                You are all caught up.
              </div>
            </div>
          ) : (
            notifications.map((n) => (
              <div
                key={n.id}
                onClick={() => toggleRead(n.id)}
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
                        <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#1E6FD9]" />
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
            ))
          )}
        </div>
      </div>
    </div>
  );
};

