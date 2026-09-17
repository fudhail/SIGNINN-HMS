import React from 'react';
import {
  LayoutDashboard,
  CalendarRange,
  DoorOpen,
  BedDouble,
  Sparkles,
  Wrench,
  Tag,
  Layers,
  Radio,
  Globe,
  Users,
  MessageSquare,
  Receipt,
  CreditCard,
  FileText,
  BarChart3,
  Settings,
  UserCheck,
  History,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
  Shield,
  Building,
  Database,
  LogOut,
  KeyRound,
  X,
  Lock,
} from 'lucide-react';
import { UserRole, Tenant } from '../../types';
import { cn } from '../../utils/formatters';

export interface SidebarProps {
  currentView: string;
  onNavigate: (viewId: string) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  currentRole: UserRole;
  mobileMenuOpen?: boolean;
  onCloseMobileMenu?: () => void;
  tenantFeatures?: Tenant['features'];
  tenantStatus?: string;
}

interface NavItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number | string;
  allowedRoles?: UserRole[];
  featureFlag?: keyof Tenant['features'];
}

interface NavSection {
  title: string;
  items: NavItem[];
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  onNavigate,
  isCollapsed,
  onToggleCollapse,
  currentRole,
  mobileMenuOpen = false,
  onCloseMobileMenu,
  tenantFeatures,
  tenantStatus,
}) => {
  const sections: NavSection[] = [
    {
      title: 'Platform HQ',
      items: [
        {
          id: 'superadmin',
          label: 'Hotel Clients (SaaS)',
          icon: Shield,
          badge: 'HQ',
          allowedRoles: ['SIGNINN Super Admin'],
        },
      ],
    },
    {
      title: 'Operations',
      items: [
        {
          id: 'dashboard',
          label: 'Dashboard',
          icon: LayoutDashboard,
        },
        {
          id: 'reservations',
          label: 'Reservations',
          icon: CalendarRange,
          allowedRoles: ['Group Admin', 'Owner', 'Property Manager', 'Front Desk', 'Revenue Manager', 'Finance'],
        },
        {
          id: 'frontdesk',
          label: 'Front Desk',
          icon: DoorOpen,
          badge: '4',
          allowedRoles: ['Group Admin', 'Owner', 'Property Manager', 'Front Desk'],
        },
        {
          id: 'records',
          label: 'Master Records',
          icon: Database,
        },
        {
          id: 'rooms',
          label: 'Rooms',
          icon: BedDouble,
        },
        {
          id: 'housekeeping',
          label: 'Housekeeping',
          icon: Sparkles,
          badge: '6',
        },
        {
          id: 'maintenance',
          label: 'Maintenance',
          icon: Wrench,
          badge: '3',
        },
      ],
    },
    {
      title: 'Revenue',
      items: [
        {
          id: 'rates',
          label: 'Rates',
          icon: Tag,
          allowedRoles: ['Group Admin', 'Owner', 'Property Manager', 'Revenue Manager'],
        },
        {
          id: 'availability',
          label: 'Availability',
          icon: Layers,
          allowedRoles: ['Group Admin', 'Owner', 'Property Manager', 'Revenue Manager', 'Front Desk'],
        },
        {
          id: 'channels',
          label: 'Channels (OTA)',
          icon: Radio,
          allowedRoles: ['Group Admin', 'Owner', 'Property Manager', 'Revenue Manager'],
        },
        {
          id: 'booking-engine',
          label: 'Booking Engine',
          icon: Globe,
          allowedRoles: ['Group Admin', 'Owner', 'Property Manager', 'Revenue Manager'],
        },
      ],
    },
    {
      title: 'Guests',
      items: [
        {
          id: 'guests',
          label: 'Guest Profiles',
          icon: Users,
          allowedRoles: ['Group Admin', 'Owner', 'Property Manager', 'Front Desk', 'Finance'],
        },
        {
          id: 'messages',
          label: 'Messages',
          icon: MessageSquare,
          badge: '1',
          allowedRoles: ['Group Admin', 'Owner', 'Property Manager', 'Front Desk', 'Housekeeping'],
        },
      ],
    },
    {
      title: 'Finance',
      items: [
        {
          id: 'folios',
          label: 'Folios',
          icon: Receipt,
          allowedRoles: ['Group Admin', 'Owner', 'Property Manager', 'Front Desk', 'Finance'],
        },
        {
          id: 'payments',
          label: 'Payments',
          icon: CreditCard,
          allowedRoles: ['Group Admin', 'Owner', 'Property Manager', 'Front Desk', 'Finance'],
        },
        {
          id: 'invoices',
          label: 'Invoices',
          icon: FileText,
          allowedRoles: ['Group Admin', 'Owner', 'Property Manager', 'Front Desk', 'Finance'],
        },
      ],
    },
    {
      title: 'Analytics',
      items: [
        {
          id: 'reports',
          label: 'Reports',
          icon: BarChart3,
          allowedRoles: ['Group Admin', 'Owner', 'Property Manager', 'Revenue Manager', 'Finance'],
        },
      ],
    },
    {
      title: 'Admin',
      items: [
        {
          id: 'settings-property',
          label: 'Property Settings',
          icon: Settings,
          allowedRoles: ['Group Admin', 'Owner', 'Property Manager'],
        },
        {
          id: 'settings-staff',
          label: 'Staff & Roles',
          icon: UserCheck,
          allowedRoles: ['Group Admin', 'Owner', 'Property Manager'],
        },
        {
          id: 'settings-audit',
          label: 'Audit Log',
          icon: History,
          allowedRoles: ['Group Admin', 'Owner', 'Property Manager', 'Finance'],
        },
      ],
    },
  ];

  const filterItem = (item: NavItem) => {
    // Super Admin has global access to all features
    if (currentRole === 'SIGNINN Super Admin') return true;

    // Platform HQ is strictly for Super Admin
    if (item.id === 'superadmin') return false;

    // Check Role Restrictions
    if (item.allowedRoles && !item.allowedRoles.includes(currentRole)) {
      return false;
    }

    return true;
  };

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-40 md:hidden transition-opacity duration-200"
          onClick={onCloseMobileMenu}
        />
      )}

      <aside
        className={cn(
          'bg-[#172033] text-gray-300 flex flex-col transition-all duration-200 ease-in-out border-r border-slate-800 select-none shrink-0',
          // Desktop behavior
          'hidden md:flex',
          isCollapsed ? 'md:w-16' : 'md:w-60',
          // Mobile Drawer behavior
          mobileMenuOpen && 'flex fixed inset-y-0 left-0 z-50 w-64 shadow-2xl'
        )}
      >
        {/* Brand Header */}
        <div className="h-14 px-4 flex items-center justify-between border-b border-slate-800/80">
          {!isCollapsed || mobileMenuOpen ? (
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="w-7 h-7 rounded-md bg-blue-600 flex items-center justify-center font-bold text-white tracking-wider text-xs shadow-xs">
                S
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-sm tracking-wide text-white font-sans">
                  SIGNINN <span className="text-blue-400 font-semibold text-xs ml-0.5">HMS</span>
                </span>
                <span className="text-[10px] text-slate-400 tracking-tight leading-none">
                  Hotel Operating System
                </span>
              </div>
            </div>
          ) : (
            <div className="w-7 h-7 mx-auto rounded-md bg-blue-600 flex items-center justify-center font-bold text-white text-xs shadow-xs">
              S
            </div>
          )}

          {/* Close button on Mobile Drawer */}
          {mobileMenuOpen && (
            <button
              onClick={onCloseMobileMenu}
              className="md:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              aria-label="Close navigation"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Tenant Suspended Warning in Sidebar */}
        {tenantStatus === 'Suspended' && currentRole !== 'SIGNINN Super Admin' && (!isCollapsed || mobileMenuOpen) && (
          <div className="mx-2 mt-2 px-2.5 py-1.5 rounded-md bg-rose-950/80 border border-rose-700/60 text-[10px] text-rose-300 flex items-center gap-1.5">
            <Lock className="w-3 h-3 text-rose-400 shrink-0" />
            <span>Account Suspended by HQ</span>
          </div>
        )}

        {/* Navigation Sections */}
        <div className="flex-1 overflow-y-auto py-3 px-2 space-y-4">
          {sections.map((sec) => {
            const visibleItems = sec.items.filter(filterItem);
            if (visibleItems.length === 0) return null;

            return (
              <div key={sec.title} className="space-y-0.5">
                {(!isCollapsed || mobileMenuOpen) && (
                  <div className="px-2.5 py-1 text-[10px] font-semibold tracking-wider text-slate-400 uppercase">
                    {sec.title}
                  </div>
                )}
                {visibleItems.map((item) => {
                  const isActive = currentView === item.id;
                  const Icon = item.icon;
                  const isFeatureDisabled =
                    currentRole !== 'SIGNINN Super Admin' &&
                    tenantFeatures &&
                    item.featureFlag &&
                    tenantFeatures[item.featureFlag] === false;

                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        onNavigate(item.id);
                        if (onCloseMobileMenu) onCloseMobileMenu();
                      }}
                      title={isCollapsed && !mobileMenuOpen ? item.label : undefined}
                      className={cn(
                        'w-full flex items-center gap-3 px-2.5 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer group',
                        isActive
                          ? 'bg-blue-600 text-white shadow-xs font-semibold'
                          : isFeatureDisabled
                          ? 'text-slate-400/80 hover:text-slate-200 hover:bg-slate-800/40'
                          : 'text-slate-300 hover:text-white hover:bg-slate-800/70',
                        isCollapsed && !mobileMenuOpen && 'justify-center px-0'
                      )}
                    >
                      <Icon
                        className={cn(
                          'w-4 h-4 shrink-0 transition-colors',
                          isActive
                            ? 'text-white'
                            : isFeatureDisabled
                            ? 'text-slate-400'
                            : 'text-slate-400 group-hover:text-slate-200'
                        )}
                      />
                      {(!isCollapsed || mobileMenuOpen) && (
                        <span className="truncate flex-1 text-left">{item.label}</span>
                      )}
                      {(!isCollapsed || mobileMenuOpen) && isFeatureDisabled && (
                        <span className="text-[9px] px-1.5 py-0.2 rounded font-semibold bg-amber-500/20 text-amber-300 border border-amber-400/30">
                          Disabled
                        </span>
                      )}
                      {(!isCollapsed || mobileMenuOpen) && !isFeatureDisabled && item.badge && (
                        <span
                          className={cn(
                            'text-[10px] px-1.5 py-0.2 rounded-full font-medium',
                            isActive
                              ? 'bg-white/20 text-white'
                              : 'bg-slate-800 text-slate-300 border border-slate-700'
                          )}
                        >
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>

        {/* Auth Flow Quick Link */}
        <div className="px-2 pt-2 pb-1 border-t border-slate-800/80">
          <button
            onClick={() => {
              onNavigate('auth');
              if (onCloseMobileMenu) onCloseMobileMenu();
            }}
            title={isCollapsed && !mobileMenuOpen ? 'Authentication Flow' : undefined}
            className={cn(
              'w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer text-slate-400 hover:text-white hover:bg-slate-800/70',
              currentView === 'auth' && 'bg-indigo-600 text-white font-semibold',
              isCollapsed && !mobileMenuOpen && 'justify-center px-0'
            )}
          >
            <KeyRound className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
            {(!isCollapsed || mobileMenuOpen) && (
              <span className="truncate flex-1 text-left">Switch User / Login</span>
            )}
          </button>
        </div>

        {/* Footer Tagline & Collapse toggle */}
        <div className="p-3 border-t border-slate-800/80 flex items-center justify-between text-slate-400">
          {(!isCollapsed || mobileMenuOpen) && (
            <div className="flex flex-col">
              <span className="text-[10px] text-slate-400 font-medium italic">
                "Run the hotel. Not the software."
              </span>
              <span className="text-[9px] text-slate-400 mt-0.5">SIGNINN HMS v2.4</span>
            </div>
          )}
          <button
            onClick={onToggleCollapse}
            className="hidden md:block p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer ml-auto"
            title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>
      </aside>
    </>
  );
};
