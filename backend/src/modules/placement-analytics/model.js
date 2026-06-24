import mongoose from 'mongoose';

const PlacementAnalyticsSchema = new mongoose.Schema(
  {
    studentId: { type: String, index: true },
    readinessTrend: [
      {
        label: String,
        readiness: Number,
        evidence: Number,
        roadmap: Number,
        assessment: Number,
      },
    ],
    roleReadinessScore: Number,
    evidenceCoverage: Number,
    roadmapCompletion: Number,
    assessmentImprovement: Number,
    placementConversion: Number,
  },
  { timestamps: true },
);

export const PlacementAnalytics = mongoose.model('PlacementAnalytics', PlacementAnalyticsSchema);
