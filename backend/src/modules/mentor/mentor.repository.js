import { User } from '../../models/User.js';
import { GapAnalysisReport } from '../gap-analysis/model.js';
import { Roadmap } from '../roadmap/model.js';
import { SkillEvidence } from '../skill-evidence/model.js';
import { Skill } from '../skill/model.js';
import { StudentProfile } from '../student-profile/model.js';

export const mentorRepository = {
  users: User,
  profiles: StudentProfile,
  skills: Skill,
  evidence: SkillEvidence,
  gaps: GapAnalysisReport,
  roadmaps: Roadmap,

  assignedProfiles(mentorId) {
    return StudentProfile.find({ mentorId }).lean();
  },

  assignedProfile(mentorId, studentId) {
    return StudentProfile.findOne({ mentorId, userId: String(studentId) }).lean();
  },

  latestGap(studentId) {
    return GapAnalysisReport.findOne({ userId: String(studentId), status: 'generated' }).sort({ createdAt: -1 }).lean();
  },

  latestRoadmap(studentId) {
    return Roadmap.findOne({ userId: String(studentId), status: { $ne: 'archived' } }).sort({ createdAt: -1 }).lean();
  },
};
