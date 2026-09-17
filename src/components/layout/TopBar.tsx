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
}) => {
  const [isTenantMenuOpen, setIsTenantMenuOpen] = useState(false);

  return (
    <header className="h-14 bg-white border-b border-gray-200 px-4 flex items-center justify-between gap-3 shrink-0 z-20">
      {/* Left side: Mobile menu toggle + Tenant / Property Switcher */}
      <div className="flex items-center gap-2.5">
        {onToggleMobileMenu && (
          <button
            onClick={onToggleMobileMenu}
            className="md:hidden p-1.5 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors cursor-pointer"
            aria-label="Toggle Menu"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        {/* Tenant Selector (for multi-tenancy) */}
        {currentTenant && (
          <div className="relative">
            <button
              onClick={() => setIsTenantMenuOpen(!isTenantMenuOpen)}
              className="hidden lg:flex items-center gap-2 px-2.5 py-1.5 rounded-lg border border-purple-200 bg-purple-50/50 hover:bg-purple-100/60 transition-colors cursor-pointer text-left"
              title="SaaS Tenant Context"
            >
              <div className="w-5 h-5 rounded bg-purple-700 text-white flex items-center justify-center font-bold text-[10px] shrink-0">
                {currentTenant.name.slice(0, 1)}
              </div>
              <div className="flex flex-col min-w-0 pr-1">
                <span className="text-[11px] font-bold text-purple-950 truncate leading-tight">
                  {currentTenant.name}
                </span>
                <span className="text-[9px] font-mono text-purple-600 truncate leading-tight">
                  {currentTenant.subdomain}
                </span>
              </div>
              <ChevronDown className="w-3 h-3 text-purple-500 shrink-0" />
            </button>

            {isTenantMenuOpen && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setIsTenantMenuOpen(false)} />
                <div className="absolute left-0 mt-1.5 w-72 bg-white rounded-xl shadow-xl border border-gray-200 z-40 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                  <div className="px-3 py-2 bg-purple-50/60 border-b border-purple-100 text-[11px] font-semibold text-purple-900 uppercase tracking-wider flex items-center justify-between">
                    <span>SaaS Hotel Tenants</span>
                    <span className="text-[10px] font-normal text-purple-600">Multi-tenant</span>
                  </div>

                  <div className="py-1 max-h-64 overflow-y-auto">
                    {tenants.map((t) => {
                      const isSelected = currentTenant.id === t.id;
                      return (
                        <button
                          key={t.id}
                          onClick={() => {
                            if (onSelectTenant) onSelectTenant(t.id);
                            setIsTenantMenuOpen(false);
                          }}
                          className={`w-full flex items-center justify-between px-3 py-2 text-left text-xs transition-colors hover:bg-gray-50 cursor-pointer ${
                            isSelected ? 'bg-purple-50 text-purple-900 font-semibold' : 'text-gray-800'
                          }`}
                        >
                          <div className="min-w-0">
                            <div className="font-semibold truncate">{t.name}</div>
                            <div className="text-[10px] text-gray-400 font-mono truncate">{t.subdomain}</div>
                          </div>
                          {isSelected && <Check className="w-3.5 h-3.5 text-purple-700 shrink-0 ml-2" />}
                        </button>
                      );
                    })}
                  </div>

                  <div className="p-2 border-t border-gray-100 bg-gray-50">
                    <button
                      onClick={() => {
                        setIsTenantMenuOpen(false);
                        onNavigate('superadmin');
                      }}
                      className="w-full flex items-center justify-center gap-1.5 py-1.5 text-xs font-semibold text-purple-700 hover:bg-purple-100/50 rounded-lg transition-colors cursor-pointer"
                    >
                      <Shield className="w-3.5 h-3.5" />
                      <span>Manage All Tenants in HQ</span>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* Property Switcher */}
        <PropertySwitcher
          currentProperty={currentProperty}
          onSelectProperty={onSelectProperty}
          onOpenOnboarding={onOpenOnboarding}
        />
      </div>

      {/* Center: Search / Command Palette shortcut bar */}
      <div className="flex-1 max-w-md hidden sm:block">
        <button
          onClick={onOpenCommandPalette}
          className="w-full flex items-center justify-between px-3 py-1.5 rounded-lg border border-gray-200 bg-gray-50 hover:bg-gray-100/80 text-gray-500 text-xs transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-2 truncate">
            <Search className="w-3.5 h-3.5 text-gray-400 shrink-0" />
            <span className="truncate">Search guest, reservation, room...</span>
          </div>
          <kbd className="inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-mono text-gray-500 bg-white rounded border border-gray-200 shadow-2xs">
            <Command className="w-2.5 h-2.5" /> K
          </kbd>
        </button>
      </div>

      {/* Right side: Quick Action + Notifications + Sleek User Menu */}
      <div className="flex items-center gap-2 sm:gap-2.5">
        {/* New Reservation button */}
        <Button
          variant="primary"
          size="sm"
          onClick={onOpenNewReservation}
          leftIcon={<Plus className="w-3.5 h-3.5" />}
          className="text-xs"
        >
          <span className="hidden sm:inline">New</span> Reservation
        </Button>

        {/* Notifications */}
        <NotificationCenter onNavigate={onNavigate} />

        <div className="h-5 w-px bg-gray-200" />

        {/* Unified User & Account Menu (includes Role Switching, Profile, Settings, & Sign Out) */}
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
