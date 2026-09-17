import React, { useState, useEffect, useMemo } from 'react';
import {
  Lock,
  ShieldAlert,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  KeyRound,
  Sparkles,
  Building,
} from 'lucide-react';
import { ToastProvider, useToast } from './components/ui/Toast';
import { Sidebar } from './components/layout/Sidebar';
import { TopBar } from './components/layout/TopBar';
import { CommandPalette } from './components/layout/CommandPalette';

// Feature Views
import { DashboardView } from './features/dashboard/DashboardView';
import { ReservationCalendar } from './features/reservations/ReservationCalendar';
import { ReservationDetailDrawer } from './features/reservations/ReservationDetailDrawer';
import { NewReservationModal } from './features/reservations/NewReservationModal';
import { FrontDeskView } from './features/frontdesk/FrontDeskView';
import { CheckInModal } from './features/frontdesk/CheckInModal';
import { CheckOutModal } from './features/frontdesk/CheckOutModal';
import { WalkInModal } from './features/frontdesk/WalkInModal';
import { RoomManagementView } from './features/rooms/RoomManagementView';
import { HousekeepingView } from './features/housekeeping/HousekeepingView';
import { MaintenanceView } from './features/maintenance/MaintenanceView';
import { GuestProfilesView } from './features/guests/GuestProfilesView';
import { FoliosView } from './features/folios/FoliosView';
import { PaymentsView } from './features/payments/PaymentsView';
import { InvoicesView } from './features/invoices/InvoicesView';
import { ChannelsView } from './features/channels/ChannelsView';
import { RatesView } from './features/rates/RatesView';
import { AvailabilityView } from './features/rates/AvailabilityView';
import { BookingEngineView } from './features/bookingengine/BookingEngineView';
import { MessagesView } from './features/messages/MessagesView';
import { ReportsView } from './features/reports/ReportsView';
import { SettingsView } from './features/settings/SettingsView';
import { StaffRolesView } from './features/settings/StaffRolesView';
import { AuditLogView } from './features/settings/AuditLogView';
import { OnboardingWizard } from './features/onboarding/OnboardingWizard';
import { SuperAdminView } from './features/superadmin/SuperAdminView';
import { AuthView } from './features/auth/AuthView';
import { DataManagementView } from './features/data/DataManagementView';

// Service API
import {
  getInitialData,
  createReservation,
  updateReservationStatus,
  reassignRoom,
  updateHousekeepingStatus,
  updateMaintenanceStatus,
  addFolioCharge,
  recordPayment,
  forceChannelSync,
  toggleChannelStatus,
  updateChannelMarkup,
  sendMessage,
  toggleChecklistItem,
  updateTaskStatus,
  addMaintenanceTicket,
  updateTicketStatus,
  addStaffMember,
  updateStaffStatus,
  updateProperty,
  updateRatePlan,
  provisionTenant,
  updateTenantStatus,
  updateTenantPlan,
  updateTenantFeatures,
} from './services';

import { Property, UserRole, Reservation, Tenant } from './types';

function MainApp() {
  const { showToast } = useToast();

  // Core Data State from mock service
  const [data, setData] = useState(getInitialData());
  const refreshData = () => setData(getInitialData());

  // Layout & Navigation State
  const [currentView, setCurrentView] = useState<string>('dashboard');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Active Multi-Tenant Property & RBAC Role Simulation
  const [currentProperty, setCurrentProperty] = useState<Property | null>(data.property);
  const [currentRole, setCurrentRole] = useState<UserRole>('Owner');
  const [currentTenantId, setCurrentTenantId] = useState<string>('tenant-1');
  const currentTenant = data.tenants?.find((t) => t.id === currentTenantId) || data.tenants?.[0];

  // Property & Tenant Scoped Data (Strict isolation for Front Desk & Property Staff)
  const scopedRooms = useMemo(() => {
    if (!currentProperty) return data.rooms;
    return data.rooms.filter((r) => !r.propertyId || r.propertyId === currentProperty.id);
  }, [data.rooms, currentProperty]);

  const scopedReservations = useMemo(() => {
    if (!currentProperty) return data.reservations;
    return data.reservations.filter((res) => !res.propertyId || res.propertyId === currentProperty.id);
  }, [data.reservations, currentProperty]);

  const scopedRoomTypes = useMemo(() => {
    if (!currentProperty) return data.roomTypes;
    return data.roomTypes.filter((rt) => !rt.propertyId || rt.propertyId === currentProperty.id);
  }, [data.roomTypes, currentProperty]);

  const isSuperAdmin = currentRole === 'SIGNINN Super Admin';
  const isFrontDesk = currentRole === 'Front Desk';

  // Front Desk restricted views:
  const frontDeskRestrictedViews = ['superadmin', 'settings-property', 'settings-staff', 'settings-audit', 'rates', 'channels'];
  const isCurrentViewRestricted =
    (!isSuperAdmin && currentView === 'superadmin') ||
    (isFrontDesk && frontDeskRestrictedViews.includes(currentView));

  // Feature Flag disabled views for non-superadmin:
  const isOtaDisabled = !isSuperAdmin && currentView === 'channels' && currentTenant?.features?.otaChannelManager === false;
  const isBookingEngineDisabled = !isSuperAdmin && currentView === 'booking-engine' && currentTenant?.features?.directBookingEngine === false;
  const isReportsDisabled = !isSuperAdmin && currentView === 'reports' && currentTenant?.features?.advancedAnalytics === false;
  const isTenantSuspended = currentTenant?.status === 'Suspended' && !isSuperAdmin;

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

  // Modal / Drawer Active States
  const [detailResId, setDetailResId] = useState<string | null>(null);
  const [checkInResId, setCheckInResId] = useState<string | null>(null);
  const [checkOutResId, setCheckOutResId] = useState<string | null>(null);
  const [isNewResModalOpen, setIsNewResModalOpen] = useState(false);
  const [isWalkInModalOpen, setIsWalkInModalOpen] = useState(false);
  const [walkInRoomId, setWalkInRoomId] = useState<string | undefined>(undefined);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);

  // Command Palette Keyboard Shortcut Listener (Cmd+K / Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Handlers for Operations
  const handleCheckIn = async (resId: string, roomId: string, advancePaid: number) => {
    await updateReservationStatus(resId, 'Checked In', roomId);
    if (advancePaid > 0) {
      const folio = data.folios.find((f) => f.reservationId === resId);
      if (folio) {
        await recordPayment(folio.id, advancePaid, 'UPI', `CKIN-ADV-${Date.now()}`);
      }
    }
    refreshData();
  };

  const handleCheckOut = async (resId: string, finalPayment: number, method: string) => {
    await updateReservationStatus(resId, 'Checked Out');
    if (finalPayment > 0) {
      const folio = data.folios.find((f) => f.reservationId === resId);
      if (folio) {
        await recordPayment(folio.id, finalPayment, method, `CKOUT-SETTLE-${Date.now()}`);
      }
    }
    refreshData();
  };

  const handleCreateReservation = async (reservationData: Partial<Reservation>) => {
    const newRes = await createReservation(reservationData);
    refreshData();
    return newRes;
  };

  // Selected reservation objects for modals
  const selectedDetailRes = detailResId
    ? data.reservations.find((r) => r.id === detailResId) || null
    : null;
  const selectedCheckInRes = checkInResId
    ? data.reservations.find((r) => r.id === checkInResId) || null
    : null;
  const selectedCheckOutRes = checkOutResId
    ? data.reservations.find((r) => r.id === checkOutResId) || null
    : null;

  if (currentView === 'auth') {
    return (
      <AuthView
        initialRole={currentRole}
        onCancel={() => setCurrentView('dashboard')}
        onLoginSuccess={(user) => {
          handleSelectRole(user.role);
          setCurrentView(user.role === 'SIGNINN Super Admin' ? 'superadmin' : 'dashboard');
          showToast({
            title: `Welcome, ${user.name}`,
            description: `Signed in as ${user.role} • ${user.hotelName || 'SIGNINN HMS'}`,
            type: 'success',
          });
        }}
      />
    );
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-50 font-sans text-slate-900 antialiased">
      {/* Primary Sidebar */}
      <Sidebar
        currentView={currentView}
        onNavigate={(viewId) => {
          setCurrentView(viewId);
          setMobileMenuOpen(false);
        }}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
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
          onSelectProperty={setCurrentProperty}
          currentRole={currentRole}
          onSelectRole={handleSelectRole}
          onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
          onOpenNewReservation={() => setIsNewResModalOpen(true)}
          onOpenWalkIn={() => {
            setWalkInRoomId(undefined);
            setIsWalkInModalOpen(true);
          }}
          onOpenOnboarding={() => setIsOnboardingOpen(true)}
          onNavigate={(v) => setCurrentView(v)}
          onToggleMobileMenu={() => setMobileMenuOpen(!mobileMenuOpen)}
          currentTenant={currentTenant}
          tenants={data.tenants}
          onSelectTenant={(tId) => {
            setCurrentTenantId(tId);
            const found = data.tenants?.find((t) => t.id === tId);
            if (found) {
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
                Operating inside hotel tenant: <strong className="text-white font-semibold">{currentTenant.name}</strong> ({currentTenant.subdomain}) • Plan: <span className="text-purple-300 font-semibold">{currentTenant.plan}</span>
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
          {isOnboardingOpen ? (
            <OnboardingWizard onComplete={() => setIsOnboardingOpen(false)} />
          ) : isTenantSuspended ? (
            <div className="max-w-xl mx-auto my-12 p-8 bg-white border border-rose-200 rounded-2xl shadow-sm text-center">
              <div className="w-14 h-14 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Lock className="w-7 h-7" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Hotel Organization Suspended</h2>
              <p className="text-gray-600 text-sm mb-5 leading-relaxed">
                Operational access for <strong className="text-gray-900">{currentTenant?.name || 'this hotel'}</strong> ({currentTenant?.subdomain}) has been suspended by the SIGNINN Platform HQ due to administrative review or pending billing.
              </p>
              <div className="bg-rose-50 border border-rose-100 rounded-xl p-4 text-xs text-rose-800 mb-6 text-left space-y-1.5">
                <div className="font-bold flex items-center gap-1.5 text-rose-900">
                  <ShieldAlert className="w-4 h-4 text-rose-700" /> Platform Security & Billing Notice
                </div>
                <div>• Support Desk: <span className="font-mono font-semibold">billing@signinn.com</span> / +91 (800) 555-0199</div>
                <div>• Tenant Organization ID: <code className="bg-white/80 px-1 py-0.5 rounded font-mono">{currentTenant?.id}</code></div>
                <div>• Active Hotel Property: <span className="font-semibold">{currentProperty?.name}</span></div>
              </div>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <button
                  onClick={() => handleSelectRole('SIGNINN Super Admin')}
                  className="w-full sm:w-auto px-4 py-2 bg-purple-700 hover:bg-purple-800 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                >
                  Open as Platform Super Admin
                </button>
                <button
                  onClick={() => setCurrentRole('Owner')}
                  className="w-full sm:w-auto px-4 py-2 border border-gray-300 hover:bg-gray-50 text-gray-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                >
                  Check Status
                </button>
              </div>
            </div>
          ) : isCurrentViewRestricted ? (
            <div className="max-w-lg mx-auto my-14 p-8 bg-white border border-amber-200 rounded-2xl shadow-sm text-center">
              <div className="w-14 h-14 bg-amber-100 text-amber-700 rounded-full flex items-center justify-center mx-auto mb-4">
                <ShieldAlert className="w-7 h-7" />
              </div>
              <h2 className="text-lg font-bold text-gray-900 mb-2">Access Restricted</h2>
              <p className="text-gray-600 text-xs mb-4 leading-relaxed">
                Your current role <span className="font-semibold text-gray-900">({currentRole})</span> does not have permission to access the <strong>{currentView}</strong> module.
              </p>
              <div className="p-3 bg-amber-50 rounded-xl text-xs text-amber-800 mb-6 text-left">
                <span className="font-semibold">Role Permissions:</span> Front Desk operators have access to Arrivals, Departures, Tape Chart, Walk-ins, Folio Settlements, and Guest Profiles. Property configuration, rates, staff permissions, and Platform HQ are restricted to Hotel Owners and Managers.
              </div>
              <button
                onClick={() => setCurrentView('dashboard')}
                className="px-4 py-2 bg-gray-900 hover:bg-gray-800 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
              >
                Return to Front Desk Dashboard
              </button>
            </div>
          ) : isOtaDisabled || isBookingEngineDisabled || isReportsDisabled ? (
            <div className="max-w-lg mx-auto my-14 p-8 bg-white border border-slate-200 rounded-2xl shadow-sm text-center">
              <div className="w-14 h-14 bg-purple-50 text-purple-700 rounded-full flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-7 h-7" />
              </div>
              <h2 className="text-lg font-bold text-gray-900 mb-2">Module Not Enabled</h2>
              <p className="text-gray-600 text-xs mb-6 leading-relaxed">
                This feature module ({currentView === 'channels' ? 'OTA Channel Manager' : currentView === 'booking-engine' ? 'Direct Booking Engine' : 'Advanced Reports & Financial Analytics'}) is turned OFF for <strong>{currentTenant?.name}</strong> by the Platform Super Admin.
              </p>
              <div className="flex items-center justify-center gap-3">
                {currentRole === 'SIGNINN Super Admin' ? (
                  <button
                    onClick={() => setCurrentView('superadmin')}
                    className="px-4 py-2 bg-purple-700 hover:bg-purple-800 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                  >
                    Configure Feature in HQ
                  </button>
                ) : (
                  <button
                    onClick={() => setCurrentView('dashboard')}
                    className="px-4 py-2 bg-gray-900 hover:bg-gray-800 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                  >
                    Back to Dashboard
                  </button>
                )}
              </div>
            </div>
          ) : (
            <>
              {currentView === 'dashboard' && (
                <DashboardView
                  reservations={scopedReservations}
                  rooms={scopedRooms}
                  channels={data.channels}
                  onOpenNewReservation={() => setIsNewResModalOpen(true)}
                  onOpenWalkIn={() => {
                    setWalkInRoomId(undefined);
                    setIsWalkInModalOpen(true);
                  }}
                  onOpenCheckIn={(resId) => setCheckInResId(resId)}
                  onOpenCheckOut={(resId) => setCheckOutResId(resId)}
                  onOpenReservationDetail={(resId) => setDetailResId(resId)}
                  onOpenNightAudit={() => {
                    showToast({
                      title: 'Night Audit Roll Executed',
                      description: 'System day rolled to 17 Sept 2026. Room rates posted to folios.',
                      type: 'success',
                    });
                  }}
                />
              )}

              {currentView === 'reservations' && (
                <ReservationCalendar
                  rooms={scopedRooms}
                  roomTypes={scopedRoomTypes}
                  reservations={scopedReservations}
                  onSelectReservation={(res) => setDetailResId(res.id)}
                  onNewReservationClick={(roomId, date) => {
                    setWalkInRoomId(roomId);
                    setIsNewResModalOpen(true);
                  }}
                  onRoomMove={async (resId, newRoomId, newStartDate) => {
                    await reassignRoom(resId, newRoomId);
                    refreshData();
                    showToast({
                      title: 'Room Tape Chart Updated',
                      description: `Reservation moved to room successfully.`,
                      type: 'info',
                    });
                  }}
                />
              )}

              {currentView === 'frontdesk' && (
                <FrontDeskView
                  reservations={scopedReservations}
                  rooms={scopedRooms}
                  onOpenCheckIn={(resId) => setCheckInResId(resId)}
                  onOpenCheckOut={(resId) => setCheckOutResId(resId)}
                  onOpenReservationDetail={(resId) => setDetailResId(resId)}
                  onOpenWalkIn={() => {
                    setWalkInRoomId(undefined);
                    setIsWalkInModalOpen(true);
                  }}
                  onOpenNewReservation={() => setIsNewResModalOpen(true)}
                />
              )}

              {currentView === 'rooms' && (
                <RoomManagementView
                  rooms={scopedRooms}
                  roomTypes={scopedRoomTypes}
                  onUpdateHousekeepingStatus={async (roomId, status) => {
                    await updateHousekeepingStatus(roomId, status);
                    refreshData();
                  }}
                  onUpdateMaintenanceStatus={async (roomId, status) => {
                    await updateMaintenanceStatus(roomId, status);
                    refreshData();
                  }}
                  onOpenWalkInForRoom={(roomId) => {
                    setWalkInRoomId(roomId);
                    setIsWalkInModalOpen(true);
                  }}
                  onOpenReservationDetail={(resId) => setDetailResId(resId)}
                />
              )}

              {currentView === 'records' && (
                <DataManagementView
                  reservations={scopedReservations}
                  rooms={scopedRooms}
                  onOpenReservationDetail={(resId) => setDetailResId(resId)}
                  onOpenNewReservation={() => setIsNewResModalOpen(true)}
                  onOpenCheckIn={(resId) => setCheckInResId(resId || scopedReservations[0]?.id)}
                />
              )}

              {currentView === 'housekeeping' && (
                <HousekeepingView
                  tasks={data.housekeepingTasks}
                  onToggleChecklistItem={async (taskId, itemId) => {
                    await toggleChecklistItem(taskId, itemId);
                    refreshData();
                  }}
                  onUpdateTaskStatus={async (taskId, status) => {
                    await updateTaskStatus(taskId, status);
                    refreshData();
                  }}
                  onReportMaintenance={async (roomNumber, issue, priority) => {
                    const room = data.rooms.find((r) => r.roomNumber === roomNumber);
                    addMaintenanceTicket({
                      roomId: room?.id || `rm-${roomNumber}`,
                      roomNumber,
                      title: issue,
                      description: issue,
                      priority: priority === 'Urgent' ? 'Emergency' : priority === 'Medium' ? 'Medium' : 'Low',
                      reportedBy: 'Housekeeping Attendant',
                      category: 'HVAC/AC',
                    });
                    if (room) {
                      await updateMaintenanceStatus(room.id, 'Maintenance Required');
                    }
                    refreshData();
                  }}
                />
              )}

              {currentView === 'maintenance' && (
                <MaintenanceView
                  tickets={data.maintenanceTickets}
                  rooms={scopedRooms}
                  onAddTicket={(ticket) => {
                    addMaintenanceTicket(ticket);
                    refreshData();
                  }}
                  onUpdateTicketStatus={(ticketId, status) => {
                    updateTicketStatus(ticketId, status);
                    refreshData();
                  }}
                />
              )}

              {currentView === 'rates' && (
                <RatesView
                  ratePlans={data.ratePlans}
                  roomTypes={scopedRoomTypes}
                  onUpdateRatePlan={async (plan) => {
                    await updateRatePlan(plan);
                    refreshData();
                  }}
                />
              )}

              {currentView === 'availability' && (
                <AvailabilityView roomTypes={scopedRoomTypes} rooms={scopedRooms} />
              )}

              {currentView === 'channels' && (
                <ChannelsView
                  channels={data.channels}
                  onForceSync={async () => {
                    await forceChannelSync();
                    refreshData();
                  }}
                  onToggleChannelStatus={async (id) => {
                    await toggleChannelStatus(id);
                    refreshData();
                  }}
                  onUpdateMarkup={async (id, markup) => {
                    await updateChannelMarkup(id, markup);
                    refreshData();
                  }}
                />
              )}

              {currentView === 'booking-engine' && (
                <BookingEngineView
                  roomTypes={scopedRoomTypes}
                  onCreateDirectBooking={handleCreateReservation}
                />
              )}

              {currentView === 'guests' && (
                <GuestProfilesView
                  guests={data.guests}
                  reservations={scopedReservations}
                  onBookForGuest={(guest) => {
                    setIsNewResModalOpen(true);
                  }}
                  onOpenReservationDetail={(resId) => setDetailResId(resId)}
                />
              )}

              {currentView === 'messages' && (
                <MessagesView
                  threads={data.messageThreads}
                  onSendMessage={async (threadId, content) => {
                    await sendMessage(threadId, content);
                    refreshData();
                  }}
                />
              )}

              {currentView === 'folios' && (
                <FoliosView
                  folios={data.folios}
                  onAddCharge={async (folioId, item) => {
                    await addFolioCharge(folioId, item);
                    refreshData();
                  }}
                  onRecordPayment={async (folioId, amount, method, ref) => {
                    await recordPayment(folioId, amount, method, ref);
                    refreshData();
                  }}
                  onOpenReservationDetail={(resId) => setDetailResId(resId)}
                />
              )}

              {currentView === 'payments' && (
                <PaymentsView
                  payments={data.payments}
                  onRecordPayment={async (payment) => {
                    // Quick payment
                    const newP = {
                      ...payment,
                      id: `pay-${Date.now()}`,
                      date: new Date().toISOString(),
                      status: 'Success' as const,
                    };
                    refreshData();
                    return newP;
                  }}
                />
              )}

              {currentView === 'invoices' && <InvoicesView invoices={data.invoices} />}

              {currentView === 'reports' && (
                <ReportsView
                  reservations={scopedReservations}
                  rooms={scopedRooms}
                  payments={data.payments}
                />
              )}

              {currentView === 'settings-property' && (
                <SettingsView
                  property={data.property}
                  roomTypes={scopedRoomTypes}
                  onUpdateProperty={(prop) => {
                    updateProperty(prop);
                    refreshData();
                  }}
                />
              )}

              {currentView === 'settings-staff' && (
                <StaffRolesView
                  staffList={data.staff}
                  onAddStaff={(staff) => {
                    addStaffMember(staff);
                    refreshData();
                  }}
                  onUpdateStaffStatus={(staffId, status) => {
                    updateStaffStatus(staffId, status);
                    refreshData();
                  }}
                />
              )}

              {currentView === 'settings-audit' && <AuditLogView logs={data.auditLogs} />}

              {currentView === 'superadmin' && (
                <SuperAdminView
                  tenants={data.tenants || []}
                  currentTenantId={currentTenantId}
                  onSelectTenant={(tenantId) => {
                    setCurrentTenantId(tenantId);
                    const tenant = data.tenants?.find((t) => t.id === tenantId);
                    if (tenant) {
                      const prop = data.properties?.find((p) => p.id === tenant.primaryPropertyId) || data.properties?.[0] || null;
                      if (prop) setCurrentProperty(prop);
                    }
                    setCurrentView('dashboard');
                    showToast({
                      title: `Active Hotel: ${tenant?.name || 'Client'}`,
                      description: `Context switched to ${tenant?.subdomain || tenantId}`,
                      type: 'info',
                    });
                  }}
                  onEnterTenant={(tenant) => {
                    setCurrentTenantId(tenant.id);
                    const prop = data.properties?.find((p) => p.id === tenant.primaryPropertyId) || data.properties?.[0] || null;
                    if (prop) setCurrentProperty(prop);
                    setCurrentView('dashboard');
                    showToast({
                      title: `Entered ${tenant.name}`,
                      description: `Switched operational context to ${tenant.subdomain}`,
                      type: 'info',
                    });
                  }}
                  onProvisionTenant={(newTenantData) => {
                    provisionTenant(newTenantData);
                    refreshData();
                    showToast({
                      title: 'Hotel Tenant Provisioned',
                      description: `${newTenantData.name} has been provisioned on ${newTenantData.plan} tier.`,
                      type: 'success',
                    });
                  }}
                  onUpdateTenantStatus={(tenantId, status) => {
                    updateTenantStatus(tenantId, status);
                    refreshData();
                    showToast({
                      title: 'Tenant Status Changed',
                      description: `Organization status set to ${status}.`,
                      type: status === 'Active' ? 'info' : 'warning',
                    });
                  }}
                  onUpdateTenantPlan={(tenantId, plan) => {
                    updateTenantPlan(tenantId, plan);
                    refreshData();
                    showToast({
                      title: 'Tenant Plan Updated',
                      description: `SaaS subscription changed to ${plan}.`,
                      type: 'success',
                    });
                  }}
                  onUpdateTenantFeatures={(tenantId, features) => {
                    updateTenantFeatures(tenantId, features);
                    refreshData();
                    showToast({
                      title: 'Tenant Features Updated',
                      description: 'Feature modules have been updated for this client.',
                      type: 'success',
                    });
                  }}
                />
              )}
            </>
          )}
        </main>
      </div>

      {/* Global Modals & Drawers */}
      <ReservationDetailDrawer
        isOpen={!!detailResId}
        onClose={() => setDetailResId(null)}
        reservation={selectedDetailRes}
        rooms={data.rooms}
        folio={data.folios.find((f) => f.reservationId === detailResId)}
        onReassignRoom={async (resId, newRoomId) => {
          await reassignRoom(resId, newRoomId);
          refreshData();
        }}
        onCheckIn={async (resId) => {
          setDetailResId(null);
          setCheckInResId(resId);
        }}
        onCheckOut={async (resId) => {
          setDetailResId(null);
          setCheckOutResId(resId);
        }}
        onCancelReservation={async (resId) => {
          await updateReservationStatus(resId, 'Cancelled');
          refreshData();
        }}
      />

      <CheckInModal
        isOpen={!!checkInResId}
        onClose={() => setCheckInResId(null)}
        reservation={selectedCheckInRes}
        rooms={data.rooms}
        onCompleteCheckIn={handleCheckIn}
      />

      <CheckOutModal
        isOpen={!!checkOutResId}
        onClose={() => setCheckOutResId(null)}
        reservation={selectedCheckOutRes}
        folio={data.folios.find((f) => f.reservationId === checkOutResId)}
        onCompleteCheckOut={handleCheckOut}
      />

      <NewReservationModal
        isOpen={isNewResModalOpen}
        onClose={() => setIsNewResModalOpen(false)}
        roomTypes={data.roomTypes}
        rooms={data.rooms}
        initialRoomId={walkInRoomId}
        onCreateReservation={handleCreateReservation}
      />

      <WalkInModal
        isOpen={isWalkInModalOpen}
        onClose={() => setIsWalkInModalOpen(false)}
        rooms={data.rooms}
        onCompleteWalkIn={handleCreateReservation}
      />

      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        reservations={data.reservations}
        rooms={data.rooms}
        guests={data.guests}
        onSelectReservation={(resId) => setDetailResId(resId)}
        onSelectRoom={(roomId) => setCurrentView('rooms')}
        onSelectGuest={(guestId) => setCurrentView('guests')}
        onNavigate={(viewId) => setCurrentView(viewId)}
        onOpenNewReservation={() => setIsNewResModalOpen(true)}
        onOpenWalkIn={() => {
          setWalkInRoomId(undefined);
          setIsWalkInModalOpen(true);
        }}
      />
    </div>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <MainApp />
    </ToastProvider>
  );
}
