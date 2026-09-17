import React, { useState } from 'react';
import {
  Bell,
  CheckCircle2,
  AlertTriangle,
  Info,
  Sparkles,
  Calendar,
  CreditCard,
  Wrench,
  Check,
} from 'lucide-react';
import { mockNotifications } from '../../mocks/mockData';
import { OperationalNotification } from '../../types';

export interface NotificationCenterProps {
  onNavigate: (viewId: string) => void;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({ onNavigate }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<OperationalNotification[]>(mockNotifications);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const getIcon = (type: OperationalNotification['type']) => {
    switch (type) {
      case 'reservation':
        return <Calendar className="w-4 h-4 text-blue-600" />;
      case 'ota_failure':
        return <AlertTriangle className="w-4 h-4 text-amber-600" />;
      case 'payment_due':
        return <CreditCard className="w-4 h-4 text-rose-600" />;
      case 'housekeeping':
        return <Sparkles className="w-4 h-4 text-emerald-600" />;
      case 'maintenance':
        return <Wrench className="w-4 h-4 text-indigo-600" />;
      default:
        return <Info className="w-4 h-4 text-gray-500" />;
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors cursor-pointer"
        aria-label="Operational Notifications"
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-blue-600 rounded-full ring-2 ring-white animate-pulse" />
        )}
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 mt-2 w-84 sm:w-96 bg-white rounded-xl shadow-xl border border-gray-200 z-40 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="px-4 py-3 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-gray-900">Notifications</span>
                {unreadCount > 0 && (
                  <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-700">
                    {unreadCount} new
                  </span>
                )}
              </div>
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-[11px] font-medium text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
                >
                  <Check className="w-3 h-3" /> Mark all read
                </button>
              )}
            </div>

            {/* List */}
            <div className="max-h-80 overflow-y-auto divide-y divide-gray-100">
              {notifications.length === 0 ? (
                <div className="p-8 text-center text-xs text-gray-500">No notifications</div>
              ) : (
                notifications.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => {
                      markAsRead(item.id);
                      if (item.link) {
                        onNavigate(item.link);
                        setIsOpen(false);
                      }
                    }}
                    className={`p-3.5 flex items-start gap-3 transition-colors cursor-pointer ${
                      item.read ? 'bg-white hover:bg-gray-50' : 'bg-blue-50/30 hover:bg-blue-50/60'
                    }`}
                  >
                    <div className="p-1.5 rounded-md bg-gray-50 border border-gray-200/60 shrink-0 mt-0.5">
                      {getIcon(item.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <h5 className="text-xs font-semibold text-gray-900 truncate">{item.title}</h5>
                        <span className="text-[10px] text-gray-400 shrink-0">{item.timestamp}</span>
                      </div>
                      <p className="text-[11px] text-gray-600 mt-0.5 leading-snug line-clamp-2">
                        {item.message}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            <div className="px-4 py-2 bg-gray-50 border-t border-gray-100 text-center text-[11px] text-gray-500">
              Operational system logs & automated OTA alerts
            </div>
          </div>
        </>
      )}
    </div>
  );
};
