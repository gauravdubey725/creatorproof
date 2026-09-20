import React, { useState } from 'react';
import { Menu, Bell, Shield, ArrowUpRight, Search, Sun, Moon } from 'lucide-react';
import { UserProfile, NotificationItem } from '../types';
import { NotificationsPopover } from './NotificationsPopover';

interface NavbarProps {
  onOpenMobileSidebar: () => void;
  currentPageTitle: string;
  onNavigate: (page: string) => void;
  user: UserProfile;
  searchTerm?: string;
  onSearchChange?: (term: string) => void;
  showSearch?: boolean;
  notifications: NotificationItem[];
  onMarkAllAsRead: () => void;
  onClearAllNotifications: () => void;
  onSelectNotification: (item: NotificationItem) => void;
  isDarkMode?: boolean;
  onToggleDarkMode?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenMobileSidebar,
  currentPageTitle,
  onNavigate,
  user,
  searchTerm = '',
  onSearchChange,
  showSearch = false,
  notifications = [],
  onMarkAllAsRead = () => {},
  onClearAllNotifications = () => {},
  onSelectNotification = () => {},
  isDarkMode = false,
  onToggleDarkMode
}) => {
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const safeNotifications = Array.isArray(notifications) ? notifications : [];
  const unreadCount = safeNotifications.filter(n => !n.read).length;

  return (
    <header className="sticky top-0 z-30 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 px-4 sm:px-8 py-3.5 flex items-center justify-between transition-all">
      <div className="flex items-center gap-3">
        <button
          id="mobile-sidebar-toggle"
          onClick={onOpenMobileSidebar}
          className="lg:hidden p-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          aria-label="Toggle navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div>
          <h1 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white tracking-tight">
            {currentPageTitle}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 hidden sm:block">
            Decentralized Proof of Authenticity & Ownership
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2.5 sm:gap-4 relative">
        {showSearch && onSearchChange && (
          <div className="relative hidden md:block w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              id="navbar-search-input"
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search content or ID..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500"
            />
          </div>
        )}

        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/40 rounded-full text-xs font-semibold">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>{user.network || 'Polygon PoS'}</span>
        </div>

        <button
          id="quick-register-btn"
          onClick={() => onNavigate('register')}
          className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-violet-600 hover:bg-violet-700 text-white rounded-lg text-xs font-semibold shadow-sm transition cursor-pointer"
        >
          <Shield className="w-3.5 h-3.5" />
          <span>Register New</span>
          <ArrowUpRight className="w-3.5 h-3.5 opacity-80" />
        </button>

        <div className="flex items-center gap-2 pl-2 border-l border-slate-200 dark:border-slate-800 relative">
          {/* Quick theme toggle in Navbar */}
          {onToggleDarkMode && (
            <button
              id="navbar-theme-toggle-btn"
              title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              onClick={onToggleDarkMode}
              className="p-2 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-100 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              aria-label="Toggle theme mode"
            >
              {isDarkMode ? (
                <Sun className="w-4 h-4 text-amber-400 hover:text-amber-300 transition" />
              ) : (
                <Moon className="w-4 h-4 text-slate-600 hover:text-slate-900 transition" />
              )}
            </button>
          )}

          <button
            id="navbar-notifications-btn"
            title="System notifications"
            onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
            className="p-2 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-100 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 relative transition cursor-pointer"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-violet-600 text-white text-[9px] font-extrabold flex items-center justify-center ring-2 ring-white dark:ring-slate-900">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Notifications Popover */}
          <NotificationsPopover
            isOpen={isNotificationsOpen}
            onClose={() => setIsNotificationsOpen(false)}
            notifications={safeNotifications}
            onMarkAllAsRead={onMarkAllAsRead}
            onClearAll={onClearAllNotifications}
            onSelectNotification={onSelectNotification}
          />

          <img
            src={user.avatar}
            alt={user.name}
            onClick={() => onNavigate('settings')}
            className="w-8 h-8 rounded-full object-cover ring-1 ring-slate-200 dark:ring-slate-700 cursor-pointer hover:ring-violet-500 transition"
          />
        </div>
      </div>
    </header>
  );
};
