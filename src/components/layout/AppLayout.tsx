import React, { useEffect } from 'react';
import { useAppStore } from '../../stores/useAppStore';
import { useToast } from '../ui/Toast';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { CommandPalette } from './CommandPalette';
import { ReservationDetailDrawer } from '../../features/reservations/ReservationDetailDrawer';
import { CheckInModal } from '../../features/frontdesk/CheckInModal';
import { CheckOutModal } from '../../features/frontdesk/CheckOutModal';
import { NewReservationModal } from '../../features/reservations/NewReservationModal';
import { WalkInModal } from '../../features/frontdesk/WalkInModal';

import {
  useTenantsQuery,
  usePropertiesQuery,
  useRoomsQuery,
  useRoomTypesQuery,
  useReservationsQuery,
  useGuestsQuery,
  useFoliosQuery,
  useCreateReservationMutation,
  useCheckInMutation,
  useCheckOutMutation,
  useReassignRoomMutation,
} from '../../services/api/queries';
import { useQueryClient } from '@tanstack/react-query';
import { UserRole, Property } from '../../types';

interface AppLayoutProps {
  children: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  // Zustand state
  const {
    currentRole,
    currentTenantId,
    currentProperty,
    currentView,
    isSidebarCollapsed,
    mobileMenuOpen,
    detailResId,
    checkInResId,
    checkOutResId,
    walkInRoomId,
    isNewResOpen,
    isWalkInOpen,
    isCommandPaletteOpen,
    setCurrentRole,
    setCurrentTenantId,
    setCurrentProperty,
    setCurrentView,
    setIsSidebarCollapsed,
    setMobileMenuOpen,
    setDetailResId,
    setCheckInResId,
    setCheckOutResId,
    setWalkInRoomId,
    setIsNewResOpen,
    setIsWalkInOpen,
    setIsCommandPaletteOpen,
    setIsOnboardingOpen,
  } = useAppStore();

  // Queries
  const { data: tenants = [] } = useTenantsQuery();
  const { data: properties = [] } = usePropertiesQuery();
  const { data: rooms = [] } = useRoomsQuery(currentProperty?.id);
  const { data: roomTypes = [] } = useRoomTypesQuery(currentProperty?.id);
  const { data: reservations = [] } = useReservationsQuery(currentProperty?.id);
  const { data: guests = [] } = useGuestsQuery();
  const { data: folios = [] } = useFoliosQuery();

  // Mutations
  const createResMutation = useCreateReservationMutation();
  const checkInMutation = useCheckInMutation();
  const checkOutMutation = useCheckOutMutation();
  const reassignRoomMutation = useReassignRoomMutation();

  const currentTenant = tenants.find((t) => t.id === currentTenantId) || tenants[0];

  // Set default current property if not set
  useEffect(() => {
    if (!currentProperty && properties.length > 0) {
      setCurrentProperty(properties[0]);
    }
  }, [currentProperty, properties, setCurrentProperty]);

  // Global Command Palette Shortcut Listener (Cmd+K / Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setIsCommandPaletteOpen]);

  // Active reservation items for modals
  const selectedDetailRes = detailResId
    ? reservations.find((r) => r.id === detailResId) || null
    : null;
  const selectedCheckInRes = checkInResId
    ? reservations.find((r) => r.id === checkInResId) || null
    : null;
  const selectedCheckOutRes = checkOutResId
    ? reservations.find((r) => r.id === checkOutResId) || null
    : null;

  const handleSelectRole = (role: UserRole) => {
    setCurrentRole(role);
    if (role === 'SIGNINN Super Admin') {
      setCurrentView('superadmin');
      showToast({
        title: 'Switched to SIGNINN Super Admin',
        description: 'Platform HQ: Multi-tenant control & client provisioning enabled.',
        type: 'info',
      });
    } else {
      if (currentView === 'superadmin') {
        setCurrentView('dashboard');
      }
      showToast({
        title: `Role Switched: ${role}`,
        description: `Viewing hotel operations from ${role} perspective.`,
        type: 'info',
      });
    }
  };

  const handleCheckIn = async (resId: string, roomId: string, advancePaid: number) => {
    try {
      await checkInMutation.mutateAsync({ resId, roomId, advancePaid });
      showToast({
        title: 'Check-In Completed',
        description: 'Guest checked in and room status updated.',
        type: 'success',
      });
    } catch (err: any) {
      showToast({
        title: 'Check-In Failed',
        description: err.message || 'Error completing check-in',
        type: 'error',
      });
    }
  };

  const handleCheckOut = async (resId: string, finalPayment: number, method: string) => {
    try {
      await checkOutMutation.mutateAsync({ resId, finalPayment, method });
      showToast({
        title: 'Check-Out Settled',
        description: 'Guest checked out and room queued for housekeeping.',
        type: 'success',
      });
    } catch (err: any) {
      showToast({
        title: 'Check-Out Failed',
        description: err.message || 'Error completing check-out',
        type: 'error',
      });
    }
  };

  const handleCreateReservation = async (reservationData: any) => {
    try {
      const newRes = await createResMutation.mutateAsync(reservationData);
      showToast({
        title: 'Reservation Created',
        description: `Booking confirmed successfully (Ref: ${newRes.refCode || 'SGN'}).`,
        type: 'success',
      });
      return newRes;
    } catch (err: any) {
      showToast({
        title: 'Booking Failed',
        description: err.message || 'Error creating reservation',
        type: 'error',
      });
      throw err;
    }
  };

  const handleSelectProperty = (prop: Property | null) => {
    setCurrentProperty(prop);
    queryClient.invalidateQueries({ queryKey: ['rooms'] });
    queryClient.invalidateQueries({ queryKey: ['roomTypes'] });
    queryClient.invalidateQueries({ queryKey: ['reservations'] });
    queryClient.invalidateQueries({ queryKey: ['housekeeping'] });
    queryClient.invalidateQueries({ queryKey: ['maintenance'] });
    queryClient.invalidateQueries({ queryKey: ['rates'] });
    showToast({
      title: prop ? `Active Property: ${prop.name}` : 'All Properties (Portfolio View)',
      description: prop ? `Loaded operational data for ${prop.city}` : 'Consolidated portfolio view',
      type: 'info',
    });
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-50 font-sans antialiased text-gray-900">
      {/* Primary Sidebar */}
      <Sidebar
        currentView={currentView}
        onNavigate={(v) => setCurrentView(v)}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed((prev) => !prev)}
        currentRole={currentRole}
        mobileMenuOpen={mobileMenuOpen}
        onCloseMobileMenu={() => setMobileMenuOpen(false)}
        tenantFeatures={currentTenant?.features}
        tenantStatus={currentTenant?.status}
      />

      {/* Main Workspace Frame */}
      <div className="flex-1 flex flex-col h-full overflow-hidden min-w-0">
        <TopBar
          currentProperty={currentProperty}
          onSelectProperty={handleSelectProperty}
          currentRole={currentRole}
          onSelectRole={handleSelectRole}
          onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
          onOpenNewReservation={() => setIsNewResOpen(true)}
          onOpenWalkIn={() => {
            setWalkInRoomId(undefined);
            setIsWalkInOpen(true);
          }}
          onOpenOnboarding={() => setIsOnboardingOpen(true)}
          onNavigate={(v) => setCurrentView(v)}
          onToggleMobileMenu={() => setMobileMenuOpen(!mobileMenuOpen)}
          currentTenant={currentTenant}
          tenants={tenants}
          properties={properties}
          onSelectTenant={(tId) => {
            setCurrentTenantId(tId);
            const found = tenants.find((t) => t.id === tId);
            if (found) {
              const prop = properties.find((p) => p.tenant_id === tId || p.id === found.primaryPropertyId) || properties[0] || null;
              if (prop) setCurrentProperty(prop);
              showToast({
                title: `Active Tenant: ${found.name}`,
                description: `Switched operational context to ${found.subdomain}`,
                type: 'info',
              });
            }
          }}
          currentView={currentView}
        />

        {/* Super Admin Session Banner when operating inside a specific hotel client */}
        {currentRole === 'SIGNINN Super Admin' && currentView !== 'superadmin' && currentTenant && (
          <div className="bg-purple-950 text-purple-100 px-4 py-2 text-xs flex items-center justify-between border-b border-purple-800/80 shrink-0">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center justify-center px-1.5 py-0.5 rounded bg-purple-800 text-purple-200 text-[10px] font-bold uppercase tracking-wider">
                Platform Super Admin
              </span>
              <span>
                Operating inside hotel tenant:{' '}
                <strong className="text-white font-semibold">{currentTenant.name}</strong> (
                {currentTenant.subdomain}) • Plan:{' '}
                <span className="text-purple-300 font-semibold">{currentTenant.plan}</span>
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentView('superadmin')}
                className="px-2.5 py-1 rounded bg-purple-700 hover:bg-purple-600 text-white font-semibold transition-colors cursor-pointer text-xs flex items-center gap-1"
              >
                ← Return to Platform HQ
              </button>
            </div>
          </div>
        )}

        {/* Dynamic Content View Area */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-7">
          {children}
        </main>
      </div>

      {/* Global Modals & Drawers */}
      <ReservationDetailDrawer
        isOpen={!!detailResId}
        onClose={() => setDetailResId(null)}
        reservation={selectedDetailRes}
        availableRooms={rooms}
        folio={folios.find((f) => f.reservationId === detailResId)}
        onAssignRoom={async (resId, newRoomId) => {
          await reassignRoomMutation.mutateAsync({ resId, newRoomId });
          showToast({
            title: 'Room Tape Chart Updated',
            description: 'Reservation assigned to new room.',
            type: 'info',
          });
        }}
        onCheckIn={(resId) => {
          setDetailResId(null);
          setCheckInResId(resId);
        }}
        onCheckOut={(resId) => {
          setDetailResId(null);
          setCheckOutResId(resId);
        }}
        onAddPayment={(resId) => {
          setDetailResId(null);
          setCheckInResId(resId);
        }}
      />

      <CheckInModal
        isOpen={!!checkInResId}
        onClose={() => setCheckInResId(null)}
        reservation={selectedCheckInRes}
        rooms={rooms}
        onCompleteCheckIn={handleCheckIn}
      />

      <CheckOutModal
        isOpen={!!checkOutResId}
        onClose={() => setCheckOutResId(null)}
        reservation={selectedCheckOutRes}
        folio={folios.find((f) => f.reservationId === checkOutResId)}
        onCompleteCheckOut={handleCheckOut}
      />

      <NewReservationModal
        isOpen={isNewResOpen}
        onClose={() => setIsNewResOpen(false)}
        roomTypes={roomTypes}
        rooms={rooms}
        initialRoomId={walkInRoomId}
        onCreateReservation={handleCreateReservation}
      />

      <WalkInModal
        isOpen={isWalkInOpen}
        onClose={() => setIsWalkInOpen(false)}
        rooms={rooms}
        onCompleteWalkIn={handleCreateReservation}
      />

      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        onSelectReservation={(resId) => setDetailResId(resId)}
        onNavigate={(viewId) => setCurrentView(viewId)}
        onOpenNewReservation={() => setIsNewResOpen(true)}
        onOpenWalkIn={() => {
          setWalkInRoomId(undefined);
          setIsWalkInOpen(true);
        }}
      />
    </div>
  );
};
