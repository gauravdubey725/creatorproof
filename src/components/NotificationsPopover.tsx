import React from 'react';
import { Bell, Check, CheckCheck, Trash2, X, AlertTriangle, ShieldCheck, Info } from 'lucide-react';
import { NotificationItem } from '../types';

interface NotificationsPopoverProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: NotificationItem[];
  onMarkAllAsRead: () => void;
  onClearAll: () => void;
  onSelectNotification: (item: NotificationItem) => void;
}

export const NotificationsPopover: React.FC<NotificationsPopoverProps> = ({
  isOpen,
  onClose,
  notifications = [],
  onMarkAllAsRead,
  onClearAll,
  onSelectNotification
}) => {
  if (!isOpen) return null;

  const safeNotifications = Array.isArray(notifications) ? notifications : [];
  const unreadCount = safeNotifications.filter(n => !n.read).length;

  const getIcon = (type: NotificationItem['type']) => {
    switch (type) {
      case 'alert':
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-rose-600" />;
      case 'success':
        return <ShieldCheck className="w-4 h-4 text-emerald-600" />;
      default:
        return <Info className="w-4 h-4 text-violet-600" />;
    }
  };

  return (
    <>
      {/* Invisible backdrop to capture outside clicks */}
      <div 
        className="fixed inset-0 z-40" 
        onClick={onClose} 
      />

      <div 
        id="notifications-popover"
        className="absolute right-0 top-12 z-50 w-80 sm:w-96 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200/90 dark:border-slate-800 overflow-hidden animate-scaleIn"
      >
        {/* Header */}
        <div className="p-4 bg-slate-900 dark:bg-slate-950 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-violet-400" />
            <h3 className="font-bold text-sm">System Notifications</h3>
            {unreadCount > 0 && (
              <span className="px-1.5 py-0.5 rounded-full bg-violet-500 text-[10px] font-extrabold text-white">
                {unreadCount} new
              </span>
            )}
          </div>

          <div className="flex items-center gap-1">
            {unreadCount > 0 && (
              <button
                onClick={onMarkAllAsRead}
                title="Mark all as read"
                className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition text-xs flex items-center gap-1 cursor-pointer"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span className="text-[11px]">Read all</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* List */}
        <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
          {safeNotifications.length > 0 ? (
            safeNotifications.map((item) => (
              <div
                key={item.id}
                onClick={() => {
                  onSelectNotification(item);
                  onClose();
                }}
                className={`p-3.5 transition flex items-start gap-3 cursor-pointer ${
                  item.read
                    ? 'bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/70'
                    : 'bg-violet-50/50 dark:bg-violet-950/40 hover:bg-violet-50/80 dark:hover:bg-violet-900/50'
                }`}
              >
                <div className={`p-2 rounded-xl flex-shrink-0 ${
                  item.type === 'alert' || item.type === 'warning'
                    ? 'bg-rose-100 dark:bg-rose-950/60'
                    : item.type === 'success'
                    ? 'bg-emerald-100 dark:bg-emerald-950/60'
                    : 'bg-violet-100 dark:bg-violet-950/60'
                }`}>
                  {getIcon(item.type)}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className={`text-xs font-bold truncate ${item.read ? 'text-slate-800 dark:text-slate-200' : 'text-slate-900 dark:text-white'}`}>
                      {item.title}
                    </h4>
                    {!item.read && (
                      <span className="w-1.5 h-1.5 rounded-full bg-violet-600 dark:bg-violet-400 flex-shrink-0" />
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2 leading-relaxed">
                    {item.message}
                  </p>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium block mt-1">
                    {item.timestamp}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className="p-8 text-center text-slate-400 dark:text-slate-500 text-xs">
              No notifications yet.
            </div>
          )}
        </div>

        {/* Footer */}
        {notifications.length > 0 && (
          <div className="p-2.5 bg-slate-50 dark:bg-slate-900/90 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
            <span className="text-slate-400 dark:text-slate-500 text-[11px] pl-1">
              Blockchain audit log alerts
            </span>
            <button
              onClick={onClearAll}
              className="text-[11px] text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 font-medium flex items-center gap-1 transition px-2 py-1 rounded hover:bg-slate-200/60 dark:hover:bg-slate-800 cursor-pointer"
            >
              <Trash2 className="w-3 h-3" />
              <span>Clear all</span>
            </button>
          </div>
        )}
      </div>
    </>
  );
};
