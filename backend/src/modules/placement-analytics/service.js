import { placementAnalyticsRepository } from './repository.js';
import { sgipService } from '../sgip/service.js';

export const placementAnalyticsService = {
  async getOverview(studentId, roleId = null) {
    let overview = await placementAnalyticsRepository.findByStudentId(studentId);
    if (!overview) {
      await sgipService.generateGapAnalysis({ studentId, roleId });
      overview = await placementAnalyticsRepository.findByStudentId(studentId);
    }
    return overview || {
      studentId,
      readinessTrend: [],
      evidenceCoverage: 0,
      roadmapCompletion: 0,
      assessmentImprovement: 0,
      placementConversion: 0,
      roleReadinessScore: 0,
    };
  },
};
