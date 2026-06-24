import { Report } from './model.js';
import { StudentProfile } from '../student-profile/model.js';
import { Resume } from '../resume/resume.model.js';
import { Skill } from '../skill/model.js';
import { SkillEvidence } from '../skill-evidence/model.js';
import { GapAnalysisReport } from '../gap-analysis/model.js';
import { Roadmap } from '../roadmap/model.js';

export const reportsRepository = {
  profile: (studentId) => StudentProfile.findOne({ userId: studentId }).lean(),
  latestResume: (studentId) => Resume.findOne({ userId: studentId }).sort({ createdAt: -1 }).lean(),
  skills: (studentId) => Skill.find({ userId: studentId }).sort({ createdAt: 1 }).lean(),
  evidence: (studentId) => SkillEvidence.find({ userId: studentId }).sort({ createdAt: 1 }).lean(),
  latestGap: (studentId) => GapAnalysisReport.findOne({ userId: studentId, status: 'generated' }).sort({ createdAt: -1 }).lean(),
  gapHistory: (studentId) => GapAnalysisReport.find({ userId: studentId, status: 'generated' }).sort({ createdAt: -1 }).lean(),
  gapById: (studentId, id) => GapAnalysisReport.findOne({ _id: id, userId: studentId, status: 'generated' }).lean(),
  latestRoadmap: (studentId) => Roadmap.findOne({ userId: studentId, status: { $ne: 'archived' } }).sort({ createdAt: -1 }).lean(),
  roadmapHistory: (studentId) => Roadmap.find({ userId: studentId, status: { $ne: 'archived' } }).sort({ createdAt: 1 }).lean(),
  snapshots: (studentId, type) => Report.find({ studentId, type }).sort({ createdAt: -1 }).lean(),
  createSnapshot: (payload) => Report.create(payload),
};
