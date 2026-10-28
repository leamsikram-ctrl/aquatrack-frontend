import { useState, useEffect, useCallback } from 'react';
import { notificationsApi } from '../api/notifications';

export interface AppNotification {
  id: string;
  type: 'request' | 'bill' | 'advisory' | 'system' | 'cancellation' | 'payment';
  message: string;
  time: string;
  read: boolean;
  link?: string;
  created_at?: string;
  related_type?: string | null;
  related_id?: number | null;
}

export const NOTIFICATIONS_UPDATED_EVENT = 'aquatrack:notifications_updated';

export const DEFAULT_NOTIFICATIONS: Record<string, AppNotification[]> = {
  customer: [
    {
      id: 'notif-1',
      type: 'request',
      message: 'Your request AT-2026-0012 is now Assigned to Technician Juan Dela Cruz.',
      time: '15 mins ago',
      read: false,
      link: '/customer/requests',
    },
    {
      id: 'notif-2',
      type: 'bill',
      message: 'Your water bill for September 2026 (₱350.00) is ready.',
      time: '2 hours ago',
      read: false,
      link: '/customer/bills',
    },
    {
      id: 'notif-3',
      type: 'advisory',
      message: 'Water interruption advisory: Emergency pipe repair in Barangay Poblacion.',
      time: 'Yesterday',
      read: true,
      link: '/customer/advisories',
    },
  ],
  staff: [
    {
      id: 's-notif-1',
      type: 'request',
      message: 'New work order AT-2026-0014 assigned to you in Barangay Poblacion.',
      time: '10 mins ago',
      read: false,
      link: '/staff/tasks',
    },
    {
      id: 's-notif-2',
      type: 'cancellation',
      message: 'AT-2026-0009 was cancelled by customer.',
      time: '1 hour ago',
      read: false,
      link: '/staff/tasks',
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
      link: '/admin/requests',
    },
    {
      id: 'a-notif-2',
      type: 'system',
      message: 'New customer registration pending verification: Pedro Penduko.',
      time: '30 mins ago',
      read: false,
      link: '/admin/users?verification=pending',
    },
    {
      id: 'a-notif-3',
      type: 'advisory',
      message: 'Water advisory broadcast published for Barangay Poblacion.',
      time: '1 day ago',
      read: true,
      link: '/admin/interruptions',
    },
  ],
};

export function deduplicateNotifications(list: AppNotification[], currentMeterNo?: string): AppNotification[] {
  const seen = new Set<string>();
  const result: AppNotification[] = [];
  for (const item of list) {
    const rawMsg = (item.message || '').trim();
    // If it's an account verification notification for a specific meter, check if it matches current customer
    if (currentMeterNo && /Your AquaTrack account \(([^)]+)\) has been verified/i.test(rawMsg)) {
      const match = rawMsg.match(/Your AquaTrack account \(([^)]+)\) has been verified/i);
      if (match && match[1] && match[1].toUpperCase() !== currentMeterNo.toUpperCase()) {
        continue; // Belongs to another consumer meter, skip
      }
    }
    const key = `${item.type}:${rawMsg.replace(/\s+/g, ' ')}`;
    if (!seen.has(key)) {
      seen.add(key);
      result.push(item);
    }
  }
  return result;
}

export function dispatchNotificationsUpdated(): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(NOTIFICATIONS_UPDATED_EVENT));
  }
}

export function getStoredNotifications(
  role: 'customer' | 'staff' | 'admin' = 'customer',
  userId?: number | string,
  currentMeterNo?: string
): AppNotification[] {
  if (typeof window === 'undefined' || !window.localStorage) {
    return DEFAULT_NOTIFICATIONS[role] || DEFAULT_NOTIFICATIONS.customer;
  }

  const userKey = userId ? `aquatrack_notifications_${role}_${userId}` : null;
  const globalKey = `aquatrack_notifications_${role}`;

  try {
    const userSaved = userKey ? localStorage.getItem(userKey) : null;
    const globalSaved = localStorage.getItem(globalKey);

    // If both are completely unset in localStorage, return defaults
    if (userSaved === null && globalSaved === null) {
      return DEFAULT_NOTIFICATIONS[role] || DEFAULT_NOTIFICATIONS.customer;
    }

    const combined: AppNotification[] = [];
    if (userSaved) {
      combined.push(...JSON.parse(userSaved));
    }
    if (globalSaved) {
      combined.push(...JSON.parse(globalSaved));
    }

    return deduplicateNotifications(combined, currentMeterNo);
  } catch {
    return DEFAULT_NOTIFICATIONS[role] || DEFAULT_NOTIFICATIONS.customer;
  }
}

export function getStoredUnreadNotificationsCount(
  role: 'customer' | 'staff' | 'admin' = 'customer',
  userId?: number | string,
  currentMeterNo?: string
): number {
  const notifs = getStoredNotifications(role, userId, currentMeterNo);
  return notifs.filter((n) => !n.read).length;
}

export function useNotificationBadge(
  role: 'customer' | 'staff' | 'admin' = 'customer',
  userId?: number | string,
  currentMeterNo?: string
) {
  const [unreadCount, setUnreadCount] = useState<number>(() =>
    getStoredUnreadNotificationsCount(role, userId, currentMeterNo)
  );

  const refresh = useCallback(() => {
    setUnreadCount(getStoredUnreadNotificationsCount(role, userId, currentMeterNo));
  }, [role, userId, currentMeterNo]);

  useEffect(() => {
    refresh();

    let isMounted = true;
    if (typeof notificationsApi?.list === 'function') {
      notificationsApi
        .list({ per_page: 25 })
        .then((res) => {
          if (!isMounted || !res) return;
          // Refresh after potential sync
          refresh();
        })
        .catch(() => {});
    }

    if (typeof window !== 'undefined') {
      window.addEventListener(NOTIFICATIONS_UPDATED_EVENT, refresh);
      window.addEventListener('storage', refresh);
    }

    return () => {
      isMounted = false;
      if (typeof window !== 'undefined') {
        window.removeEventListener(NOTIFICATIONS_UPDATED_EVENT, refresh);
        window.removeEventListener('storage', refresh);
      }
    };
  }, [refresh]);

  return { unreadCount, refresh };
}
