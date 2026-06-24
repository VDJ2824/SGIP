import { format } from 'date-fns';

export function formatPercent(value) {
  return `${Math.round(value)}%`;
}

export function formatDateTime(value) {
  return format(new Date(value), 'MMM d, yyyy');
}

export function formatDateTimeDetailed(value) {
  return format(new Date(value), 'MMM d, yyyy • h:mm a');
}

export function formatNumber(value) {
  return new Intl.NumberFormat('en-US').format(value);
}

export function statusTone(status) {
  const map = {
    complete: 'success',
    active: 'info',
    pending: 'warning',
    blocked: 'danger',
    draft: 'neutral',
  };

  return map[status] || 'neutral';
}
