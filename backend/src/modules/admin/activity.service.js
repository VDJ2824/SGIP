import { ActivityLog } from './activity.model.js';

export async function recordActivity(entry) {
  try {
    return await ActivityLog.create(entry);
  } catch {
    // Audit logging must never block the action being recorded.
    return null;
  }
}
