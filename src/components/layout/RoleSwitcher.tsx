import React, { useState } from 'react';
import { UserRole } from '../../types';
import { ShieldCheck, ChevronDown, Check } from 'lucide-react';

export interface RoleSwitcherProps {
  currentRole: UserRole;
  onSelectRole: (role: UserRole) => void;
}

const ROLES: { role: UserRole; desc: string; isPlatformSuperAdmin?: boolean }[] = [
  { role: 'SIGNINN Super Admin', desc: 'Platform HQ: Multi-tenant control, all hotel clients & SaaS billing', isPlatformSuperAdmin: true },
  { role: 'Group Admin', desc: 'Full portfolio, all properties & admin control' },
  { role: 'Owner', desc: 'Portfolio performance, revenue & financials' },
  { role: 'Property Manager', desc: 'Daily operations, staff, channels & rates' },
  { role: 'Front Desk', desc: 'Arrivals, departures, check-in, folios & rooms' },
  { role: 'Housekeeping', desc: 'Mobile-first cleaning checklist & room states' },
  { role: 'Finance', desc: 'Ledger folios, billing, invoices & collections' },
  { role: 'Maintenance', desc: 'Facility repairs, room blocks & engineering' },
  { role: 'Revenue Manager', desc: 'Rates, inventory yield, OTA mappings & sync' },
];

export const RoleSwitcher: React.FC<RoleSwitcherProps> = ({ currentRole, onSelectRole }) => {
  const [isOpen, setIsOpen] = useState(false);
  const isSuperAdmin = currentRole === 'SIGNINN Super Admin';

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer ${
          isSuperAdmin
            ? 'bg-purple-100 text-purple-900 border border-purple-300 hover:bg-purple-200'
            : 'text-gray-700 bg-gray-100 hover:bg-gray-200/80 border border-gray-200'
        }`}
        title="Role Simulator (Showcases role-based navigation and permissions)"
      >
        <ShieldCheck className={`w-3.5 h-3.5 shrink-0 ${isSuperAdmin ? 'text-purple-700' : 'text-blue-600'}`} />
        <span className="truncate max-w-[70px] sm:max-w-none">{currentRole}</span>
        <ChevronDown className="w-3 h-3 text-gray-500 shrink-0" />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 mt-1.5 w-72 bg-white rounded-xl shadow-xl border border-gray-200 z-40 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-3 py-2 bg-gray-50 border-b border-gray-100 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
              Switch Role / Permission View
            </div>
            <div className="py-1 max-h-80 overflow-y-auto">
              {ROLES.map(({ role, desc, isPlatformSuperAdmin }) => {
                const isSelected = currentRole === role;
                return (
                  <button
                    key={role}
                    onClick={() => {
                      onSelectRole(role);
                      setIsOpen(false);
                    }}
                    className={`w-full flex items-start justify-between px-3 py-2.5 text-left text-xs transition-colors hover:bg-gray-50 cursor-pointer ${
                      isSelected
                        ? isPlatformSuperAdmin
                          ? 'bg-purple-50 text-purple-900 font-semibold'
                          : 'bg-blue-50/70 text-blue-700 font-semibold'
                        : isPlatformSuperAdmin
                        ? 'bg-purple-50/40 text-purple-950 hover:bg-purple-50'
                        : 'text-gray-800'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold leading-tight">{role}</span>
                        {isPlatformSuperAdmin && (
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-purple-200 text-purple-800">
                            HQ Platform
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-gray-400 font-normal leading-tight mt-0.5">{desc}</div>
                    </div>
                    {isSelected && (
                      <Check
                        className={`w-3.5 h-3.5 shrink-0 mt-0.5 ml-2 ${
                          isPlatformSuperAdmin ? 'text-purple-700' : 'text-blue-600'
                        }`}
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
