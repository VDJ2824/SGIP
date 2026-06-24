import { User } from '../../models/User.js';
import { CareerRole } from '../career-role/model.js';
import { GapAnalysisReport } from '../gap-analysis/model.js';
import { Roadmap } from '../roadmap/model.js';
import { SkillEvidence } from '../skill-evidence/model.js';
import { Skill } from '../skill/model.js';
import { StudentProfile } from '../student-profile/model.js';
import { ActivityLog } from './activity.model.js';

export const adminRepository = {
  users: User,
  profiles: StudentProfile,
  evidence: SkillEvidence,
  skills: Skill,
  roles: CareerRole,
  gaps: GapAnalysisReport,
  roadmaps: Roadmap,
  activity: ActivityLog,

  logActivity(entry) {
    return ActivityLog.create(entry);
  },

  latestGapFor(userId) {
    return GapAnalysisReport.findOne({ userId, status: 'generated' }).sort({ createdAt: -1 }).lean();
  },

  activeRoadmapFor(userId) {
    return Roadmap.findOne({ userId, status: 'active' }).sort({ createdAt: -1 }).lean();
  },
};
