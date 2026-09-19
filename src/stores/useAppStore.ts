import { create } from 'zustand';
import { UserRole, Property } from '../types';

export function normalizeUserRole(role: unknown, isPlatformUser = false): UserRole {
  if (isPlatformUser) return 'SIGNINN Super Admin';

  const value = String(role || '').trim().toLowerCase();
  if (value.includes('owner')) return 'Owner';
  if (value.includes('group admin')) return 'Group Admin';
  if (value.includes('property manager') || value.includes('general manager') || value === 'property_manager') {
    return 'Property Manager';
  }
  if (value.includes('front desk')) return 'Front Desk';
  if (value.includes('night auditor')) return 'Night Auditor';
  if (value.includes('housekeeping')) return 'Housekeeping';
  if (value.includes('maintenance')) return 'Maintenance';
  if (value.includes('revenue')) return 'Revenue Manager';
  if (value.includes('finance')) return 'Finance';
  return 'Owner';
}

interface AppState {
  // Authentication and Multi-Tenant Context
  token: string | null;
  currentUser: {
    id: string;
    email: string;
    name: string;
    phone?: string;
    avatarUrl?: string;
  } | null;
  isPlatformUser: boolean;
  platformRole?: string;
  currentRole: UserRole;
  currentTenantId: string;
  currentTenant: any | null;
  currentPropertyId: string | null;
  currentProperty: Property | null;
  permittedProperties: Property[];
  permissions: string[];

  // Navigation
  currentView: string;
  isSidebarCollapsed: boolean;
  mobileMenuOpen: boolean;

  // Active Modals and Drawers
  detailResId: string | null;
  checkInResId: string | null;
  checkOutResId: string | null;
  walkInRoomId: string | undefined;
  isNewResOpen: boolean;
  isWalkInOpen: boolean;
  isCommandPaletteOpen: boolean;
  isOnboardingOpen: boolean;

  // Actions
  setAuthSession: (session: {
    token: string;
    user: any;
    isPlatformUser: boolean;
    platformRole?: string;
    tenant?: any;
    role?: any;
    permittedProperties?: Property[];
    permissions?: string[];
  }) => void;
  logout: () => void;
  setCurrentRole: (role: UserRole) => void;
  setCurrentTenantId: (tenantId: string) => void;
  setCurrentProperty: (property: Property | null) => void;
  setPermittedProperties: (props: Property[]) => void;
  setCurrentView: (view: string) => void;
  setIsSidebarCollapsed: (collapsed: boolean | ((prev: boolean) => boolean)) => void;
  setMobileMenuOpen: (open: boolean) => void;

  // Modal Actions
  setDetailResId: (resId: string | null) => void;
  setCheckInResId: (resId: string | null) => void;
  setCheckOutResId: (resId: string | null) => void;
  setWalkInRoomId: (roomId: string | undefined) => void;
  setIsNewResOpen: (open: boolean) => void;
  setIsWalkInOpen: (open: boolean) => void;
  setIsCommandPaletteOpen: (open: boolean | ((prev: boolean) => boolean)) => void;
  setIsOnboardingOpen: (open: boolean) => void;
}

export const useAppStore = create<AppState>((set) => ({
  token: localStorage.getItem('signinn_token'),
  currentUser: null,
  isPlatformUser: false,
  platformRole: undefined,
  currentRole: 'Owner',
  currentTenantId: 'tenant-1',
  currentTenant: null,
  currentPropertyId: 'prop-1',
  currentProperty: null,
  permittedProperties: [],
  permissions: [],

  currentView: 'dashboard',
  isSidebarCollapsed: false,
  mobileMenuOpen: false,

  detailResId: null,
  checkInResId: null,
  checkOutResId: null,
  walkInRoomId: undefined,
  isNewResOpen: false,
  isWalkInOpen: false,
  isCommandPaletteOpen: false,
  isOnboardingOpen: false,

  setAuthSession: (session) => {
    if (session.token) {
      localStorage.setItem('signinn_token', session.token);
    }
    const roleName = normalizeUserRole(
      session.role?.name || session.role?.code,
      session.isPlatformUser
    );
    const firstProp = session.permittedProperties && session.permittedProperties.length > 0
      ? (session.permittedProperties[0] as Property)
      : null;

    set({
      token: session.token,
      currentUser: session.user,
      isPlatformUser: session.isPlatformUser,
      platformRole: session.platformRole,
      currentRole: roleName as UserRole,
      currentTenantId: session.tenant?.id || 'tenant-1',
      currentTenant: session.tenant || null,
      permittedProperties: (session.permittedProperties as Property[]) || [],
      currentProperty: firstProp,
      currentPropertyId: firstProp?.id || null,
      permissions: session.permissions || [],
      currentView: session.isPlatformUser ? 'superadmin' : 'dashboard',
    });
  },

  logout: () => {
    localStorage.removeItem('signinn_token');
    set({
      token: null,
      currentUser: null,
      isPlatformUser: false,
      platformRole: undefined,
      currentRole: 'Owner',
      currentTenant: null,
      permittedProperties: [],
      permissions: [],
      currentView: 'auth',
    });
  },

  setCurrentRole: (role) => set({ currentRole: role }),
  setCurrentTenantId: (tenantId) => set({ currentTenantId: tenantId }),
  setCurrentProperty: (property) =>
    set({
      currentProperty: property,
      currentPropertyId: property?.id || null,
    }),
  setPermittedProperties: (props) => set({ permittedProperties: props }),
  setCurrentView: (view) => set({ currentView: view, mobileMenuOpen: false }),
  setIsSidebarCollapsed: (collapsed) =>
    set((state) => ({
      isSidebarCollapsed:
        typeof collapsed === 'function' ? collapsed(state.isSidebarCollapsed) : collapsed,
    })),
  setMobileMenuOpen: (open) => set({ mobileMenuOpen: open }),

  setDetailResId: (resId) => set({ detailResId: resId }),
  setCheckInResId: (resId) => set({ checkInResId: resId }),
  setCheckOutResId: (resId) => set({ checkOutResId: resId }),
  setWalkInRoomId: (roomId) => set({ walkInRoomId: roomId }),
  setIsNewResOpen: (open) => set({ isNewResOpen: open }),
  setIsWalkInOpen: (open) => set({ isWalkInOpen: open }),
  setIsCommandPaletteOpen: (open) =>
    set((state) => ({
      isCommandPaletteOpen:
        typeof open === 'function' ? open(state.isCommandPaletteOpen) : open,
    })),
  setIsOnboardingOpen: (open) => set({ isOnboardingOpen: open }),
}));
