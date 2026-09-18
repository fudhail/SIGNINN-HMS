import React, { useState } from 'react';
import {
  Search,
  Plus,
  Menu,
  Command,
  Shield,
  ChevronDown,
  Check,
} from 'lucide-react';
import { Property, UserRole, Tenant } from '../../types';
import { PropertySwitcher } from './PropertySwitcher';
import { UserMenu } from './UserMenu';
import { NotificationCenter } from './NotificationCenter';
import { Button } from '../ui/Button';

export interface TopBarProps {
  currentProperty: Property | null;
  onSelectProperty: (prop: Property | null) => void;
  currentRole: UserRole;
  onSelectRole: (role: UserRole) => void;
  onOpenCommandPalette: () => void;
  onOpenNewReservation: () => void;
  onOpenWalkIn: () => void;
  onOpenOnboarding: () => void;
  onNavigate: (viewId: string) => void;
  onToggleMobileMenu?: () => void;
  currentTenant?: Tenant;
  tenants?: Tenant[];
  onSelectTenant?: (tenantId: string) => void;
  currentView?: string;
  properties?: Property[];
}

export const TopBar: React.FC<TopBarProps> = ({
  currentProperty,
  onSelectProperty,
  currentRole,
  onSelectRole,
  onOpenCommandPalette,
  onOpenNewReservation,
  onOpenWalkIn,
  onOpenOnboarding,
  onNavigate,
  onToggleMobileMenu,
  currentTenant,
  tenants = [],
  onSelectTenant,
  currentView,
  properties = [],
}) => {
  const [isTenantMenuOpen, setIsTenantMenuOpen] = useState(false);

  return (
    <header className="h-16 bg-white/90 backdrop-blur-md border-b border-slate-200/80 px-3 sm:px-5 flex items-center justify-between gap-2.5 sm:gap-4 shrink-0 z-20 sticky top-0 shadow-[0_1px_3px_rgba(15,23,42,0.03)]">
      {/* Left side: Mobile menu toggle + Tenant / Property Switcher */}
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        {onToggleMobileMenu && (
          <button
            onClick={onToggleMobileMenu}
            className="md:hidden p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer shrink-0"
            aria-label="Toggle Menu"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        {currentRole === 'SIGNINN Super Admin' ? (
          <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl border border-purple-200 bg-purple-50/80 text-purple-950 font-semibold text-xs shadow-xs">
            <div className="w-6 h-6 rounded-lg bg-purple-600 text-white flex items-center justify-center shrink-0">
              <Shield className="w-3.5 h-3.5" />
            </div>
            <span className="truncate">SIGNINN HQ</span>
            <span className="hidden sm:inline-block px-2 py-0.5 rounded-md text-[10px] font-bold bg-purple-200/70 text-purple-900 shrink-0">
              Admin Mode
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-2.5 min-w-0">
            {/* Hotel Organization Badge */}
            {currentTenant && (
              <div
                className="hidden xl:flex items-center gap-2.5 px-3 py-1.5 rounded-xl border border-slate-200/90 bg-slate-50/80 text-left select-none shadow-2xs shrink-0 max-w-[190px]"
                title={`Subscribed Hotel Organization: ${currentTenant.name} (${currentTenant.plan} Plan)`}
              >
                <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold text-xs shadow-xs shrink-0">
                  {currentTenant.name.slice(0, 1)}
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-xs font-bold text-slate-900 truncate leading-tight">
                    {currentTenant.name}
                  </span>
                  <span className="text-[10px] font-medium text-slate-500 truncate leading-tight">
                    {currentTenant.plan} SaaS Plan
                  </span>
                </div>
              </div>
            )}

            {/* Property Switcher */}
            <PropertySwitcher
              currentProperty={currentProperty}
              properties={properties}
              onSelectProperty={onSelectProperty}
              onOpenOnboarding={onOpenOnboarding}
              isMultiPropertyEnabled={Boolean(
                currentTenant?.plan === 'Enterprise' || currentTenant?.features?.multiProperty
              )}
            />
          </div>
        )}
      </div>

      {/* Center: Search / Command Palette shortcut bar */}
      <div className="flex-1 max-w-[180px] lg:max-w-xs xl:max-w-md hidden md:block min-w-0 mx-2">
        <button
          onClick={onOpenCommandPalette}
          className="w-full flex items-center justify-between px-3 py-1.5 rounded-xl border border-slate-200/90 bg-slate-50/80 hover:bg-slate-100/90 hover:border-slate-300 text-slate-500 text-xs transition-all duration-150 cursor-pointer shadow-2xs min-w-0"
        >
          <div className="flex items-center gap-2 truncate min-w-0">
            <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="truncate font-medium">
              {currentRole === 'SIGNINN Super Admin'
                ? 'Search clients, plans...'
                : 'Search guest, booking, room...'}
            </span>
          </div>
          <kbd className="hidden xl:inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-mono text-slate-500 bg-white rounded-md border border-slate-200 shadow-2xs shrink-0 ml-1">
            <Command className="w-2.5 h-2.5" /> K
          </kbd>
        </button>
      </div>

      {/* Right side: Quick Action + Notifications + Sleek User Menu */}
      <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
        {/* Mobile quick search button */}
        <button
          onClick={onOpenCommandPalette}
          className="md:hidden p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
          aria-label="Search"
          title="Search (Cmd+K)"
        >
          <Search className="w-4 h-4" />
        </button>

        {/* New Reservation button - strictly for Hotel operational staff, hidden for SuperAdmin */}
        {currentRole !== 'SIGNINN Super Admin' && (
          <button
            onClick={onOpenNewReservation}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-semibold shadow-xs hover:shadow-md hover:shadow-blue-500/20 transition-all active:scale-[0.98] cursor-pointer shrink-0"
          >
            <Plus className="w-3.5 h-3.5 shrink-0" />
            <span className="hidden sm:inline">New</span> Reservation
          </button>
        )}

        {/* Notifications */}
        <NotificationCenter onNavigate={onNavigate} />

        <div className="h-6 w-px bg-slate-200/80" />

        {/* Unified User & Account Menu */}
        <UserMenu
          currentRole={currentRole}
          onSelectRole={onSelectRole}
          onNavigate={onNavigate}
          onOpenOnboarding={onOpenOnboarding}
        />
      </div>
    </header>
  );
};
