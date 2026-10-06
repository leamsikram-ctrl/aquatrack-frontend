import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Badge } from '../atoms/Badge';
import { Button } from '../atoms/Button';
import {
  IconBell,
  IconCheck,
  IconX,
  IconAlertTriangle,
  IconReceipt,
  IconTool,
  IconUserCheck,
  IconInfoCircle,
} from '@tabler/icons-react';

export interface AppNotification {
  id: string;
  type: 'billing' | 'request' | 'advisory' | 'system' | 'verification';
  title: string;
  message: string;
  timestamp: string;
  isRead: boolean;
  link?: string;
}

export interface NotificationCenterProps {
  userRole?: 'admin' | 'customer' | 'staff';
  isOpen: boolean;
  onClose: () => void;
  onUnreadCountChange?: (count: number) => void;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({
  userRole = 'customer',
  isOpen,
  onClose,
  onUnreadCountChange,
}) => {
  const navigate = useNavigate();

  // Initial role-based notifications matching municipal operations
  const [notifications, setNotifications] = useState<AppNotification[]>(() => {
    if (userRole === 'admin') {
      return [
        {
          id: 'n1',
          type: 'request',
          title: 'New Service Request',
          message: 'Main pipeline rupture reported at Poblacion Highway (Priority: High).',
          timestamp: '10 mins ago',
          isRead: false,
          link: '/admin/requests',
        },
        {
          id: 'n2',
          type: 'verification',
          title: 'Account Verification Pending',
          message: '2 new customer registration applications awaiting meter assignment.',
          timestamp: '45 mins ago',
          isRead: false,
          link: '/admin/verification',
        },
        {
          id: 'n3',
          type: 'advisory',
          title: 'Water Advisory Published',
          message: 'Scheduled maintenance advisory successfully sent to 142 SMS recipients.',
          timestamp: '2 hours ago',
          isRead: true,
          link: '/admin/interruptions',
        },
      ];
    } else if (userRole === 'staff') {
      return [
        {
          id: 'n1',
          type: 'request',
          title: 'Work Order Dispatched',
          message: 'Assigned to urgent leak repair in Purok 2, San Isidro. SLA: 4 hours.',
          timestamp: '5 mins ago',
          isRead: false,
          link: '/staff/tasks',
        },
        {
          id: 'n2',
          type: 'system',
          title: 'Zone Route Updated',
          message: 'Meter reading route for Zone 1 (Poblacion) is now active.',
          timestamp: '1 hour ago',
          isRead: false,
          link: '/staff/scan',
        },
        {
          id: 'n3',
          type: 'advisory',
          title: 'Low Pressure Notice',
          message: 'Scheduled pump station flushing in Southern Sector today.',
          timestamp: '3 hours ago',
          isRead: true,
          link: '/staff/tasks',
        },
      ];
    } else {
      return [
        {
          id: 'n1',
          type: 'billing',
          title: 'New Statement of Account',
          message: 'Your water bill for October 2026 is now available. Amount: ₱450.00.',
          timestamp: '20 mins ago',
          isRead: false,
          link: '/customer/bills',
        },
        {
          id: 'n2',
          type: 'request',
          title: 'Technician Dispatched',
          message: 'Field technician Juan Dela Cruz has been assigned to your service request.',
          timestamp: '1 hour ago',
          isRead: false,
          link: '/customer/requests',
        },
        {
          id: 'n3',
          type: 'advisory',
          title: 'Interruption Advisory',
          message: 'Scheduled water service interruption for Poblacion tomorrow (8AM - 12PM).',
          timestamp: 'Yesterday',
          isRead: true,
          link: '/customer/advisories',
        },
      ];
    }
  });

  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const handleMarkAllRead = () => {
    setNotifications((prev) =>
      prev.map((n) => ({ ...n, isRead: true }))
    );
    onUnreadCountChange?.(0);
  };

  const handleNotificationClick = (notif: AppNotification) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === notif.id ? { ...n, isRead: true } : n))
    );
    if (notif.link) {
      navigate(notif.link);
    }
    onClose();
  };

  const handleDeleteNotification = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  if (!isOpen) return null;

  const displayedNotifications = notifications.filter((n) =>
    filter === 'unread' ? !n.isRead : true
  );

  const getIconForType = (type: AppNotification['type']) => {
    switch (type) {
      case 'billing':
        return <IconReceipt size={14} className="text-[#1E6FD9]" />;
      case 'request':
        return <IconTool size={14} className="text-[#1E6FD9]" />;
      case 'advisory':
        return <IconAlertTriangle size={14} className="text-black" />;
      case 'verification':
        return <IconUserCheck size={14} className="text-[#1E6FD9]" />;
      default:
        return <IconInfoCircle size={14} className="text-black" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/30 flex justify-end">
      {/* Backdrop overlay */}
      <div className="flex-1" onClick={onClose} />

      {/* Drawer Container */}
      <div className="w-full max-w-sm sm:max-w-md bg-white border-l-2 border-black flex flex-col h-full shadow-2xl text-[10px]">
        {/* Drawer Header */}
        <div className="p-3.5 border-b border-black/15 flex items-center justify-between bg-white">
          <div className="flex items-center gap-2">
            <IconBell size={16} className="text-[#1E6FD9]" />
            <span className="font-bold text-black uppercase tracking-wider text-[10px]">
              Notification Center
            </span>
            {unreadCount > 0 && (
              <Badge variant="blue">{unreadCount} New</Badge>
            )}
          </div>

          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-[10px] text-[#1E6FD9] hover:underline font-bold flex items-center gap-1"
              >
                <IconCheck size={12} />
                Mark all read
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1 rounded text-black hover:bg-[#F0F6FD] transition-colors"
              aria-label="Close notifications"
            >
              <IconX size={16} />
            </button>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="p-2.5 bg-[#F0F6FD] border-b border-black/15 flex items-center justify-between">
          <div className="flex gap-1">
            <button
              onClick={() => setFilter('all')}
              className={`px-2.5 py-1 rounded text-[10px] font-bold transition-colors ${
                filter === 'all'
                  ? 'bg-[#1E6FD9] text-white'
                  : 'bg-white text-black border border-black/20 hover:bg-white/80'
              }`}
            >
              All ({notifications.length})
            </button>
            <button
              onClick={() => setFilter('unread')}
              className={`px-2.5 py-1 rounded text-[10px] font-bold transition-colors ${
                filter === 'unread'
                  ? 'bg-[#1E6FD9] text-white'
                  : 'bg-white text-black border border-black/20 hover:bg-white/80'
              }`}
            >
              Unread ({unreadCount})
            </button>
          </div>

          <span className="text-[10px] text-black/60 italic">
            Sinacaban Municipal Dispatch
          </span>
        </div>

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto divide-y divide-black/10">
          {displayedNotifications.length === 0 ? (
            <div className="p-8 text-center space-y-2">
              <div className="w-8 h-8 rounded-full bg-[#F0F6FD] text-[#1E6FD9] flex items-center justify-center mx-auto">
                <IconBell size={16} />
              </div>
              <div className="font-bold text-black uppercase">No Notifications</div>
              <p className="text-black/60">
                {filter === 'unread'
                  ? 'You have caught up with all incoming system alerts.'
                  : 'No active notifications recorded.'}
              </p>
            </div>
          ) : (
            displayedNotifications.map((notif) => (
              <div
                key={notif.id}
                onClick={() => handleNotificationClick(notif)}
                className={`p-3.5 flex gap-3 cursor-pointer transition-colors hover:bg-[#F0F6FD] relative ${
                  !notif.isRead ? 'bg-[#F0F6FD]/50' : 'bg-white'
                }`}
              >
                {/* Unread indicator dot */}
                {!notif.isRead && (
                  <span className="w-1.5 h-1.5 rounded-full bg-[#1E6FD9] absolute top-3.5 left-1.5" />
                )}

                <div className="mt-0.5 shrink-0 p-1.5 rounded border border-black/15 bg-white">
                  {getIconForType(notif.type)}
                </div>

                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-black text-[10px]">
                      {notif.title}
                    </span>
                    <span className="text-black/50 text-[9px]">
                      {notif.timestamp}
                    </span>
                  </div>

                  <p className="text-black/80 leading-normal text-[10px]">
                    {notif.message}
                  </p>

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[#1E6FD9] font-bold text-[9px] uppercase tracking-wider">
                      {notif.link ? 'View Details →' : 'Dismiss'}
                    </span>
                    <button
                      onClick={(e) => handleDeleteNotification(notif.id, e)}
                      className="text-black/40 hover:text-black p-0.5"
                      title="Remove notification"
                    >
                      <IconX size={10} />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Drawer Footer */}
        <div className="p-3 border-t border-black/15 bg-white flex items-center justify-between text-[10px] text-black/60">
          <span>AquaTrack Smart Water System</span>
          <Button variant="secondary" onClick={onClose} className="py-1 px-3">
            Close
          </Button>
        </div>
      </div>
    </div>
  );
};
