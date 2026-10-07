import React, { useState, useEffect } from 'react';
import {
  IconTool,
  IconReceipt,
  IconVolume,
  IconTrash,
  IconCheck,
  IconX,
  IconBell,
} from '@tabler/icons-react';

export interface AppNotification {
  id: string;
  type: 'request' | 'bill' | 'advisory' | 'system' | 'cancellation';
  message: string;
  time: string;
  read: boolean;
}

interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
  role?: 'customer' | 'staff' | 'admin';
}

const DEFAULT_NOTIFICATIONS: Record<string, AppNotification[]> = {
  customer: [
    {
      id: 'notif-1',
      type: 'request',
      message: 'Your request AT-2026-0012 is now Assigned to Technician Juan Dela Cruz.',
      time: '15 mins ago',
      read: false,
    },
    {
      id: 'notif-2',
      type: 'bill',
      message: 'Your water bill for September 2026 (₱350.00) is ready.',
      time: '2 hours ago',
      read: false,
    },
    {
      id: 'notif-3',
      type: 'advisory',
      message: 'Water interruption advisory: Emergency pipe repair in Barangay Poblacion.',
      time: 'Yesterday',
      read: true,
    },
  ],
  staff: [
    {
      id: 's-notif-1',
      type: 'request',
      message: 'New work order AT-2026-0014 assigned to you in Barangay Poblacion.',
      time: '10 mins ago',
      read: false,
    },
    {
      id: 's-notif-2',
      type: 'cancellation',
      message: 'AT-2026-0009 was cancelled by customer.',
      time: '1 hour ago',
      read: false,
    },
    {
      id: 's-notif-3',
      type: 'advisory',
      message: 'Water interruption advisory: Mainline pressure testing scheduled for tomorrow.',
      time: '3 hours ago',
      read: true,
    },
  ],
  admin: [
    {
      id: 'a-notif-1',
      type: 'request',
      message: 'New service request AT-2026-0015 submitted from Barangay San Isidro.',
      time: '5 mins ago',
      read: false,
    },
    {
      id: 'a-notif-2',
      type: 'system',
      message: 'New customer registration pending verification: Pedro Penduko.',
      time: '30 mins ago',
      read: false,
    },
    {
      id: 'a-notif-3',
      type: 'advisory',
      message: 'Water advisory broadcast published for Barangay Poblacion.',
      time: '1 day ago',
      read: true,
    },
  ],
};

export const NotificationCenter: React.FC<NotificationCenterProps> = ({
  isOpen,
  onClose,
  role = 'customer',
}) => {
  const storageKey = `aquatrack_notifications_${role}`;
  const [notifications, setNotifications] = useState<AppNotification[]>(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return DEFAULT_NOTIFICATIONS[role] || DEFAULT_NOTIFICATIONS.customer;
  });

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(notifications));
    } catch {
      // Ignore
    }
  }, [notifications, storageKey]);

  if (!isOpen) return null;

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const toggleRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: !n.read } : n))
    );
  };

  const deleteNotif = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setNotifications((prev) => prev.filter((n) => n.id !== id));
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
      <div className="w-full max-w-sm bg-white rounded-lg border border-black shadow-2xl overflow-hidden flex flex-col text-xs text-black">
        {/* Header */}
        <div className="flex items-center justify-between px-3.5 py-3 border-b border-black/15 bg-[#F0F6FD]">
          <div className="flex items-center gap-1.5">
            <button
              onClick={onClose}
              className="p-1 hover:text-[#1E6FD9] text-black font-bold flex items-center gap-1"
              title="Close notifications"
            >
              ← <span className="uppercase tracking-wider text-xs">Notifications</span>
            </button>
            {unreadCount > 0 && (
              <span className="px-1.5 py-0.5 bg-[#1E6FD9] text-white rounded font-bold text-[10px]">
                {unreadCount} new
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={markAllRead}
              className="text-[#1E6FD9] hover:underline font-bold text-xs flex items-center gap-1"
            >
              <IconCheck size={13} />
              Mark all read
            </button>
            <button
              onClick={onClose}
              className="p-1 hover:text-[#1E6FD9] font-bold text-black"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Notifications List */}
        <div className="max-h-[420px] overflow-y-auto divide-y divide-black/10">
          {notifications.length === 0 ? (
            <div className="p-8 text-center text-black/60">
              <IconBell size={28} className="mx-auto mb-2 text-black/30" />
              <div className="font-bold text-sm">No notifications</div>
              <div className="text-xs text-black/50 mt-1">
                You are all caught up.
              </div>
            </div>
          ) : (
            notifications.map((n) => (
              <div
                key={n.id}
                onClick={() => toggleRead(n.id)}
                className={`p-3.5 flex items-start justify-between gap-3 cursor-pointer transition-colors ${
                  n.read ? 'bg-white hover:bg-[#F0F6FD]/50' : 'bg-[#F0F6FD] hover:bg-[#E3EFFD]'
                }`}
              >
                <div className="flex items-start gap-2.5 flex-1">
                  <div className="mt-0.5">{renderIcon(n.type)}</div>
                  <div className="space-y-1 flex-1">
                    <p
                      className={`text-xs leading-snug ${
                        n.read ? 'text-black/80' : 'text-black font-bold'
                      }`}
                    >
                      {n.message}
                    </p>
                    <div className="text-[11px] text-black/50 flex items-center gap-2">
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

