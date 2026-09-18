import React, { useState } from 'react';
import { Building2, ChevronDown, Check, Plus, Lock } from 'lucide-react';
import { Property } from '../../types';

export interface PropertySwitcherProps {
  currentProperty: Property | null; // null represents "All Properties"
  properties: Property[];
  onSelectProperty: (property: Property | null) => void;
  onOpenOnboarding?: () => void;
  isMultiPropertyEnabled?: boolean;
}

export const PropertySwitcher: React.FC<PropertySwitcherProps> = ({
  currentProperty,
  properties,
  onSelectProperty,
  onOpenOnboarding,
  isMultiPropertyEnabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showLockedTooltip, setShowLockedTooltip] = useState(false);

  const getRoomsCount = (p?: Property | null): number => {
    if (!p) return 0;
    return (p as any).total_rooms ?? (p as any).totalRooms ?? 0;
  };

  const getSubtitle = (p: Property): string => {
    const rooms = getRoomsCount(p);
    const location = p.city || '';
    if (location && rooms > 0) {
      return `${location} • ${rooms} Rooms`;
    }
    if (location) return location;
    if (rooms > 0) return `${rooms} Rooms`;
    return 'Hotel Property';
  };

  // If client does not have multiProperty entitlement
  if (!isMultiPropertyEnabled) {
    const singleProp = currentProperty || properties[0];
    return (
      <div className="relative">
        <button
          onClick={() => setShowLockedTooltip(!showLockedTooltip)}
          className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50/80 text-gray-900 transition-all cursor-pointer shadow-2xs group text-left"
          title="Single Property Account (Multi-property disabled)"
        >
          <div className="w-6 h-6 rounded-lg bg-[#172033] flex items-center justify-center text-white shrink-0">
            <Building2 className="w-3.5 h-3.5 text-blue-400" />
          </div>
          <div className="flex flex-col min-w-0 pr-1 max-w-[120px] sm:max-w-[170px] md:max-w-[200px] lg:max-w-[260px] xl:max-w-[360px]">
            <span className="text-xs font-semibold text-gray-900 truncate leading-tight">
              {singleProp ? singleProp.name : 'Primary Hotel'}
            </span>
            <span className="text-[10px] text-slate-500 truncate leading-tight hidden sm:block">
              {singleProp ? getSubtitle(singleProp) : 'Single Property'}
            </span>
          </div>
          <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-slate-100 border border-slate-200 text-[10px] font-medium text-slate-500 shrink-0">
            <Lock className="w-2.5 h-2.5 text-slate-400" />
            <span className="hidden md:inline">Single</span>
          </div>
        </button>

        {showLockedTooltip && (
          <>
            <div className="fixed inset-0 z-30" onClick={() => setShowLockedTooltip(false)} />
            <div className="absolute left-0 mt-1.5 w-76 sm:w-80 bg-white rounded-xl shadow-xl border border-slate-200 z-40 p-3.5 animate-in fade-in zoom-in-95 duration-150 text-xs">
              <div className="flex items-start gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center shrink-0 mt-0.5">
                  <Lock className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h4 className="font-semibold text-slate-900 text-xs">Single-Property License</h4>
                  <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                    This client organization is licensed for a single hotel property. Multi-property switching and group portfolio rollups are available in the <strong>Enterprise Plan</strong> or as a <strong>Multi-Property Add-on</strong>.
                  </p>
                </div>
              </div>
              <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
                <span>Contact Super Admin to upgrade</span>
                <button
                  onClick={() => setShowLockedTooltip(false)}
                  className="text-blue-600 hover:underline font-medium cursor-pointer"
                >
                  Got it
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    );
  }

  // Full multi-property switcher for authorized clients
  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl border border-slate-200/90 bg-white hover:bg-slate-50/90 text-gray-900 transition-all cursor-pointer shadow-2xs group text-left"
        aria-label="Select Property"
      >
        <div className="w-6 h-6 rounded-lg bg-[#172033] flex items-center justify-center text-white shrink-0">
          <Building2 className="w-3.5 h-3.5 text-blue-400" />
        </div>
        <div className="flex flex-col min-w-0 pr-1 max-w-[120px] sm:max-w-[170px] md:max-w-[200px] lg:max-w-[260px] xl:max-w-[360px]">
          <span className="text-xs font-semibold text-gray-900 truncate leading-tight">
            {currentProperty ? currentProperty.name : 'All Properties (Portfolio)'}
          </span>
          <span className="text-[10px] text-slate-500 truncate leading-tight hidden sm:block">
            {currentProperty ? getSubtitle(currentProperty) : `${properties.length} Properties Active`}
          </span>
        </div>
        <ChevronDown className="w-3.5 h-3.5 text-gray-400 group-hover:text-gray-600 shrink-0 ml-0.5" />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setIsOpen(false)} />
          <div className="absolute left-0 mt-1.5 w-76 sm:w-84 bg-white rounded-xl shadow-xl border border-slate-200 z-40 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-3.5 py-2 bg-slate-50 border-b border-slate-100 text-[11px] font-semibold text-slate-500 uppercase tracking-wider flex items-center justify-between">
              <span>Multi-Property Portfolio</span>
              <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-[9px] font-bold">Group Portfolio</span>
            </div>

            <div className="py-1 max-h-[320px] overflow-y-auto">
              {/* All Properties option */}
              <button
                onClick={() => {
                  onSelectProperty(null);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 text-left text-xs transition-colors hover:bg-slate-50 cursor-pointer ${
                  currentProperty === null ? 'bg-blue-50/70 text-blue-700 font-semibold' : 'text-slate-800'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-6 h-6 rounded-lg bg-slate-200 text-slate-700 flex items-center justify-center text-[10px] font-bold shrink-0">
                    ★
                  </div>
                  <div>
                    <div className="font-medium text-slate-900">All Properties (Portfolio View)</div>
                    <div className="text-[10px] text-slate-400 font-normal">Consolidated metrics & reporting across {properties.length} properties</div>
                  </div>
                </div>
                {currentProperty === null && <Check className="w-4 h-4 text-blue-600 shrink-0 ml-2" />}
              </button>

              <div className="h-px bg-slate-100 my-1" />

              {/* Individual properties */}
              {properties.map((prop) => {
                const isSelected = currentProperty?.id === prop.id;
                const rooms = getRoomsCount(prop);
                return (
                  <button
                    key={prop.id}
                    onClick={() => {
                      onSelectProperty(prop);
                      setIsOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 text-left text-xs transition-colors hover:bg-slate-50 cursor-pointer ${
                      isSelected ? 'bg-blue-50/70 text-blue-700 font-semibold' : 'text-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-6 h-6 rounded-lg bg-blue-100 text-blue-800 flex items-center justify-center text-[10px] font-bold shrink-0">
                        {prop.code || 'HTL'}
                      </div>
                      <div className="min-w-0">
                        <div className="truncate font-medium text-slate-900">{prop.name}</div>
                        <div className="text-[10px] text-slate-400 font-normal truncate">
                          {prop.city}{prop.state && !prop.city?.includes(prop.state) ? `, ${prop.state}` : ''}{rooms > 0 ? ` • ${rooms} Rooms` : ''}
                        </div>
                      </div>
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-blue-600 shrink-0 ml-2" />}
                  </button>
                );
              })}
            </div>

            {onOpenOnboarding && (
              <div className="p-2 border-t border-slate-100 bg-slate-50/60">
                <button
                  onClick={() => {
                    setIsOpen(false);
                    onOpenOnboarding();
                  }}
                  className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Onboard New Property</span>
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};
