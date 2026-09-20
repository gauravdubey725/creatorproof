import React from 'react';
import { 
  ShieldCheck, 
  LayoutDashboard, 
  UploadCloud, 
  CheckCircle2, 
  FolderLock, 
  Settings, 
  LogOut, 
  X,
  Layers,
  Cpu,
  FileCheck,
  Scale
} from 'lucide-react';
import { UserProfile } from '../types';

interface SidebarProps {
  currentPage: string;
  onNavigate: (page: string) => void;
  user: UserProfile;
  onLogout: () => void;
  currentBlock: number;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentPage,
  onNavigate,
  user,
  onLogout,
  currentBlock,
  isOpenMobile,
  onCloseMobile
}) => {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'register', label: 'Register Content', icon: UploadCloud },
    { id: 'verify', label: 'Verify Content', icon: CheckCircle2 },
    { id: 'my-content', label: 'My Content', icon: FolderLock },
    { id: 'licenses', label: 'Licenses', icon: FileCheck },
    { id: 'disputes', label: 'Disputes', icon: Scale },
    { id: 'settings', label: 'Settings & Profile', icon: Settings }
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div 
          id="sidebar-backdrop"
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-sm lg:hidden transition-opacity"
        />
      )}

      {/* Sidebar Container */}
      <aside 
        id="main-sidebar"
        className={`fixed lg:sticky top-0 left-0 z-50 h-screen w-72 bg-slate-950 text-slate-100 flex flex-col border-r border-slate-800/80 transition-transform duration-300 ease-in-out ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Brand Header */}
        <div className="p-6 border-b border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-violet-500/25 border border-violet-400/30">
              <ShieldCheck className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xl font-bold tracking-tight text-white font-sans">
                  Creator<span className="text-violet-400">Proof</span>
                </span>
                <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-violet-500/20 text-violet-300 border border-violet-500/30 rounded">
                  v2.6
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium tracking-wide">
                Blockchain Content Protection
              </p>
            </div>
          </div>

          <button 
            id="close-sidebar-mobile-btn"
            onClick={onCloseMobile}
            className="lg:hidden p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation links */}
        <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
          <div className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Main Navigation
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;
            return (
              <button
                key={item.id}
                id={`nav-item-${item.id}`}
                onClick={() => {
                  onNavigate(item.id);
                  onCloseMobile();
                }}
                className={`w-full flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 text-left ${
                  isActive
                    ? 'bg-violet-600 text-white shadow-md shadow-violet-600/30 font-semibold'
                    : 'text-slate-300 hover:text-white hover:bg-slate-900/90'
                }`}
              >
                <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span className="flex-1">{item.label}</span>
                {isActive && (
                  <span className="w-1.5 h-4 rounded-full bg-violet-200 animate-pulse" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Blockchain Status Indicator */}
        <div className="p-4 mx-4 mb-3 rounded-xl bg-slate-900/90 border border-slate-800/90">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
              <span className="text-xs font-semibold text-emerald-400">
                Connected to Blockchain
              </span>
            </div>
            <Cpu className="w-3.5 h-3.5 text-slate-500" />
          </div>

          <div className="space-y-1 text-xs">
            <div className="flex items-center justify-between text-slate-400">
              <span className="flex items-center gap-1">
                <Layers className="w-3 h-3 text-violet-400" /> Network:
              </span>
              <span className="font-medium text-slate-200 truncate max-w-[120px]" title={user.network}>
                {user.network || 'Polygon PoS'}
              </span>
            </div>
            <div className="flex items-center justify-between text-slate-400">
              <span>Last Block:</span>
              <span className="font-mono text-violet-300 font-medium">
                #{currentBlock.toLocaleString()}
              </span>
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-800">
              <span>Avg Confirmation:</span>
              <span className="text-slate-300">~2.1 sec</span>
            </div>
          </div>
        </div>

        {/* User Profile & Logout Section */}
        <div className="p-4 border-t border-slate-800/90 bg-slate-950">
          <div className="flex items-center justify-between gap-3">
            <div 
              onClick={() => onNavigate('settings')}
              className="flex items-center gap-3 cursor-pointer group flex-1 min-w-0"
              title="View profile settings"
            >
              <img
                src={user.avatar}
                alt={user.name}
                className="w-9 h-9 rounded-full object-cover ring-2 ring-violet-500/50 group-hover:ring-violet-400 transition"
              />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-white truncate group-hover:text-violet-300 transition">
                  {user.name}
                </p>
                <p className="text-xs text-slate-400 truncate flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-violet-400"></span>
                  {user.role}
                </p>
              </div>
            </div>

            <button
              id="logout-btn"
              onClick={onLogout}
              title="Logout"
              className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
