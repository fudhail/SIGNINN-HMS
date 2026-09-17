import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, currency: string = 'INR'): string {
  if (currency === 'INR') {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
  }).format(amount);
}

export function formatDate(dateString: string | Date, options?: Intl.DateTimeFormatOptions): string {
  const d = typeof dateString === 'string' ? new Date(dateString) : dateString;
  if (isNaN(d.getTime())) return dateString.toString();
  return new Intl.DateTimeFormat('en-IN', options || {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(d);
}

export function formatTime(timeString: string | Date): string {
  const d = typeof timeString === 'string' ? new Date(timeString) : timeString;
  if (isNaN(d.getTime())) return timeString.toString();
  return new Intl.DateTimeFormat('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }).format(d);
}

export function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.round(diffMs / 1000);
  const diffMin = Math.round(diffSec / 60);
  const diffHr = Math.round(diffMin / 60);
  const diffDays = Math.round(diffHr / 24);

  if (diffSec < 60) return `${Math.max(1, diffSec)}s ago`;
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  if (diffDays === 1) return 'Yesterday';
  return `${diffDays}d ago`;
}

export function getStatusColor(status: string): { bg: string; text: string; border: string; dot: string } {
  const normalized = status.toLowerCase().replace(/[\s-_]/g, '');
  
  // Reservation statuses
  if (normalized === 'confirmed') {
    return { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', dot: 'bg-blue-500' };
  }
  if (normalized === 'checkedin' || normalized === 'inhouse') {
    return { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', dot: 'bg-emerald-500' };
  }
  if (normalized === 'checkedout') {
    return { bg: 'bg-slate-50', text: 'text-slate-700', border: 'border-slate-200', dot: 'bg-slate-400' };
  }
  if (normalized === 'cancelled' || normalized === 'noshow' || normalized === 'failed') {
    return { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', dot: 'bg-red-500' };
  }
  if (normalized === 'provisional' || normalized === 'inquiry') {
    return { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', dot: 'bg-amber-500' };
  }

  // Housekeeping statuses
  if (normalized === 'ready' || normalized === 'clean' || normalized === 'inspected') {
    return { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', dot: 'bg-emerald-500' };
  }
  if (normalized === 'cleaning') {
    return { bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200', dot: 'bg-indigo-500' };
  }
  if (normalized === 'dirty') {
    return { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200', dot: 'bg-rose-500' };
  }
  if (normalized === 'assigned') {
    return { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200', dot: 'bg-purple-500' };
  }

  // Room occupancy
  if (normalized === 'vacant') {
    return { bg: 'bg-teal-50', text: 'text-teal-700', border: 'border-teal-200', dot: 'bg-teal-500' };
  }
  if (normalized === 'occupied') {
    return { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', dot: 'bg-blue-500' };
  }
  if (normalized === 'reserved') {
    return { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', dot: 'bg-amber-500' };
  }
  if (normalized === 'outoforder' || normalized === 'maintenancerequired') {
    return { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200', dot: 'bg-orange-500' };
  }

  // Payment statuses
  if (normalized === 'paid') {
    return { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', dot: 'bg-emerald-500' };
  }
  if (normalized === 'partiallypaid' || normalized === 'pending') {
    return { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', dot: 'bg-amber-500' };
  }
  if (normalized === 'unpaid') {
    return { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', dot: 'bg-red-500' };
  }
  if (normalized === 'refunded') {
    return { bg: 'bg-slate-50', text: 'text-slate-600', border: 'border-slate-200', dot: 'bg-slate-400' };
  }

  // Channel statuses
  if (normalized === 'connected') {
    return { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', dot: 'bg-emerald-500' };
  }
  if (normalized === 'attention' || normalized === 'syncing') {
    return { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', dot: 'bg-amber-500' };
  }
  if (normalized === 'disconnected') {
    return { bg: 'bg-slate-100', text: 'text-slate-600', border: 'border-slate-200', dot: 'bg-slate-400' };
  }

  return { bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-200', dot: 'bg-gray-400' };
}

export function getChannelBadgeStyle(channel: string): { bg: string; text: string; border: string; name: string } {
  const norm = channel.toLowerCase();
  if (norm.includes('booking')) {
    return { bg: 'bg-blue-50', text: 'text-blue-800', border: 'border-blue-200', name: 'Booking.com' };
  }
  if (norm.includes('makemytrip') || norm.includes('mmt')) {
    return { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', name: 'MakeMyTrip' };
  }
  if (norm.includes('goibibo')) {
    return { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200', name: 'Goibibo' };
  }
  if (norm.includes('agoda')) {
    return { bg: 'bg-sky-50', text: 'text-sky-800', border: 'border-sky-200', name: 'Agoda' };
  }
  if (norm.includes('airbnb')) {
    return { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200', name: 'Airbnb' };
  }
  if (norm.includes('expedia')) {
    return { bg: 'bg-yellow-50', text: 'text-yellow-800', border: 'border-yellow-200', name: 'Expedia' };
  }
  if (norm.includes('direct') || norm.includes('website')) {
    return { bg: 'bg-emerald-50', text: 'text-emerald-800', border: 'border-emerald-200', name: 'Direct Web' };
  }
  if (norm.includes('walk') || norm.includes('walkin')) {
    return { bg: 'bg-purple-50', text: 'text-purple-800', border: 'border-purple-200', name: 'Walk-in' };
  }
  return { bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-200', name: channel };
}
