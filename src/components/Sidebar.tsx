'use client';
import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { AdminUser } from '@/lib/auth';
import {
  FileText,
  CheckSquare,
  ChevronLeft,
  ChevronRight,
  LogOut,
  User,
  Clipboard,
  Mail,
} from 'lucide-react';

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  badge?: number;
}

const NAV_ITEMS: NavItem[] = [
  {
    label: 'Tracker Hasil SO',
    href: '/',
    icon: <FileText size={18} />,
  },
  {
    label: 'Tracker Approval',
    href: '/tracker-approval',
    icon: <CheckSquare size={18} />,
  },
  {
    label: 'Tracker Form Scan Pickup',
    href: '/tracker-form-scan-pickup',
    icon: <Clipboard size={18} />,
  },
  {
    label: 'Tracker Email Supplier',
    href: '/email-supplier',
    icon: <Mail size={18} />,
  },
];

interface SidebarProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
  activeRoute: string;
  user: AdminUser;
  onLogout: () => void;
  onMobileClose: () => void;
}

export default function Sidebar({
  collapsed,
  onToggleCollapse,
  activeRoute,
  user,
  onLogout,
  onMobileClose,
}: SidebarProps) {
  return (
    <div
      className={`
        flex flex-col h-full bg-primary text-primary-foreground
        sidebar-transition overflow-hidden
        ${collapsed ? 'w-16' : 'w-64'}
      `}
    >
      {/* Logo */}
      <div className={`flex items-center gap-3 px-4 py-4 border-b border-white/10 ${collapsed ? 'justify-center' : ''}`}>
        <div onClick={onMobileClose} className="flex items-center gap-3 flex-1 min-w-0">
          <Image
            src="/assets/images/IMG_1662-removebg-preview-1789132101535.png"
            alt="Cycle Count Logo"
            width={32}
            height={32}
            className="flex-shrink-0 object-contain"
          />
          {!collapsed && (
            <span className="font-bold text-base tracking-tight text-primary-foreground truncate">
              Cycle Count
            </span>
          )}
        </div>
        <button
          onClick={onToggleCollapse}
          className="hidden lg:flex p-1 rounded-lg hover:bg-white/10 transition-colors flex-shrink-0"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      {/* Nav section label */}
      {!collapsed && (
        <div className="px-4 pt-5 pb-2">
          <span className="text-xs font-semibold uppercase tracking-widest text-white/40">
            Menu Tracker
          </span>
        </div>
      )}

      {/* Nav items */}
      <nav className="flex-1 px-2 py-2 space-y-1">
        {NAV_ITEMS.map((item) => {
          const isActive = activeRoute === item.href;
          return (
            <Link
              key={`nav-${item.href}`}
              href={item.href}
              onClick={onMobileClose}
              title={collapsed ? item.label : undefined}
              className={`
                flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium
                transition-all duration-150 group relative
                ${isActive
                  ? 'bg-white/20 text-white shadow-sm'
                  : 'text-white/70 hover:bg-white/10 hover:text-white'
                }
                ${collapsed ? 'justify-center' : ''}
              `}
            >
              <span className="flex-shrink-0">{item.icon}</span>
              {!collapsed && (
                <span className="truncate">{item.label}</span>
              )}
              {collapsed && (
                <div className="
                  absolute left-full ml-2 px-2.5 py-1.5 bg-foreground text-background
                  text-xs font-medium rounded-lg whitespace-nowrap opacity-0
                  group-hover:opacity-100 pointer-events-none transition-opacity duration-150
                  shadow-modal z-50
                ">
                  {item.label}
                </div>
              )}
              {item.badge && !collapsed && (
                <span className="ml-auto bg-accent text-accent-foreground text-xs font-bold px-1.5 py-0.5 rounded-full">
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* User info + logout */}
      <div className="border-t border-white/10 p-3">
        <div className={`flex items-center gap-3 ${collapsed ? 'justify-center' : ''}`}>
          <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center flex-shrink-0">
            <User size={14} className="text-white" />
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-white truncate">{user.name}</p>
              <p className="text-xs text-white/50 truncate">{user.role}</p>
            </div>
          )}
          {!collapsed && (
            <button
              onClick={onLogout}
              className="p-1.5 rounded-lg hover:bg-white/10 transition-colors text-white/60 hover:text-white"
              title="Keluar"
            >
              <LogOut size={15} />
            </button>
          )}
        </div>
        {collapsed && (
          <button
            onClick={onLogout}
            className="mt-2 w-full flex justify-center p-2 rounded-lg hover:bg-white/10 transition-colors text-white/60 hover:text-white"
            title="Keluar"
          >
            <LogOut size={15} />
          </button>
        )}
      </div>
    </div>
  );
}