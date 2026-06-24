import { randomUUID } from 'crypto';
import { AppError, errorCodes } from '../../errors/index.js';
import { gapAnalysisRepository } from '../gap-analysis/repository.js';
import { notificationsService } from '../notifications/service.js';
import { enhanceRoadmap } from './aiEnhancement.js';
import { roadmapRepository } from './repository.js';
import { projectsFor, resourcesFor } from './resources.js';
import { recordActivity } from '../admin/activity.service.js';

function task({
  type,
  title,
  description,
  relatedSkill = '',
  priority,
  estimatedWeeks,
  estimatedHours,
  completionCriteria,
  dependsOn = [],
  resources,
  projects,
}) {
  return {
    taskId: randomUUID(),
    type,
    title,
    description,
    relatedSkill,
    priority,
    estimatedWeeks,
    estimatedHours,
    suggestedResources: resources ?? (relatedSkill ? resourcesFor(relatedSkill) : []),
    suggestedProjects: projects ?? (relatedSkill ? projectsFor(relatedSkill) : []),
    completionCriteria,
    dependsOn,
    status: 'not_started',
    completedAt: null,
  };
}

function phase(phaseNumber, title, description, priority, tasks) {
  return {
    phaseNumber,
    title,
    description,
    priority,
    estimatedWeeks: tasks.reduce((sum, item) => sum + item.estimatedWeeks, 0),
    progress: 0,
    tasks,
  };
}

function uniqueBySkill(items = []) {
  const seen = new Set();
  return items.filter((item) => {
    const name = item.skillName || item.relatedSkill || '';
    const key = String(item.normalizedName || name).toLowerCase();
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function buildPhases(report) {
  const role = report.targetRoleSnapshot?.title || 'target role';
  const missingRequired = uniqueBySkill(report.missingRequiredSkills || []);
  const partial = uniqueBySkill(report.partialMatches || []);
  const studentConfirmed = uniqueBySkill(report.studentConfirmedMatches || []);
  const pending = uniqueBySkill(report.pendingEvidenceMatches || []);
  const missingPreferred = uniqueBySkill(report.missingPreferredSkills || []);

  const phase1Tasks = missingRequired.map((item) =>
    task({
      type: 'learn_required_skill',
      title: `Learn ${item.skillName}`,
      description: item.reason || `${item.skillName} is required for ${role}.`,
      relatedSkill: item.skillName,
      priority: 'High',
      estimatedWeeks: 3,
      estimatedHours: 18,
      completionCriteria: [
        `Complete one structured ${item.skillName} learning resource`,
        `Build one ${item.skillName} mini project`,
        'Add evidence to your SGIP profile',
      ],
    }),
  );

  const phase2Tasks = partial.map((item) =>
    task({
      type: 'strengthen_skill',
      title: `Improve ${item.skillName}`,
      description: `Move from ${item.studentLevel || 'your current level'} to ${item.requiredLevel || 'the required level'}.`,
      relatedSkill: item.skillName,
      priority: 'Medium',
      estimatedWeeks: 2,
      estimatedHours: 12,
      completionCriteria: [
        `Complete intermediate ${item.skillName} topics`,
        `Build or extend one ${item.skillName} project`,
        'Update your proficiency level when the criteria are met',
      ],
    }),
  );

  const evidenceTasks = [
    ...studentConfirmed.map((item) =>
      task({
        type: 'strengthen_evidence',
        title: `Add verified evidence for ${item.skillName}`,
        description: `${item.skillName} is student confirmed. Add stronger project, certificate, or internship evidence.`,
        relatedSkill: item.skillName,
        priority: 'Medium',
        estimatedWeeks: 1,
        estimatedHours: 6,
        completionCriteria: [
          `Upload one project or certificate for ${item.skillName}`,
          'Submit the evidence for mentor review',
        ],
      }),
    ),
    ...pending.map((item) =>
      task({
        type: 'complete_evidence_review',
        title: `Complete review for ${item.skillName} evidence`,
        description: `${item.skillName} evidence is pending mentor review.`,
        relatedSkill: item.skillName,
        priority: 'Medium',
        estimatedWeeks: 1,
        estimatedHours: 2,
        completionCriteria: ['Address any mentor feedback', 'Reach mentor-approved evidence status'],
        resources: [],
        projects: [],
      }),
    ),
  ];

  const phase4Tasks = missingPreferred.map((item) =>
    task({
      type: 'learn_preferred_skill',
      title: `Learn ${item.skillName}`,
      description: item.reason || `${item.skillName} is preferred for ${role}.`,
      relatedSkill: item.skillName,
      priority: 'Low',
      estimatedWeeks: 1,
      estimatedHours: 8,
      completionCriteria: [
        `Complete foundational ${item.skillName} learning`,
        `Create one small ${item.skillName} proof of work`,
      ],
    }),
  );

  const phase5Tasks = [
    task({
      type: 'career_readiness',
      title: 'Update resume',
      description: 'Reflect completed skills, projects, and measurable outcomes.',
      priority: 'Medium',
      estimatedWeeks: 0,
      estimatedHours: 2,
      completionCriteria: ['Resume updated and uploaded to SGIP'],
      resources: [],
      projects: [],
    }),
    task({
      type: 'career_readiness',
      title: 'Complete one portfolio project',
      description: `Build a role-aligned portfolio project for ${role}.`,
      priority: 'Medium',
      estimatedWeeks: 1,
      estimatedHours: 12,
      completionCriteria: ['Project is deployed or publicly documented', 'Project is linked as skill evidence'],
      resources: [],
      projects: [`One end-to-end ${role} portfolio project`],
    }),
    task({
      type: 'career_readiness',
      title: 'Complete mock interview',
      description: `Practice technical and behavioral questions for ${role}.`,
      priority: 'Medium',
      estimatedWeeks: 0,
      estimatedHours: 2,
      completionCriteria: ['Complete one mock interview', 'Record three improvement actions'],
      resources: ['STAR interview framework'],
      projects: [],
    }),
    task({
      type: 'career_readiness',
      title: 'Run Gap Analysis again',
      description: 'Generate a new readiness score after completing roadmap work.',
      priority: 'Medium',
      estimatedWeeks: 0,
      estimatedHours: 1,
      completionCriteria: ['Generate a new Gap Analysis report', 'Review score and remaining gaps'],
      resources: [],
      projects: [],
    }),
    task({
      type: 'career_readiness',
      title: 'Achieve readiness above 85%',
      description: 'Use a newly generated Gap Analysis report to confirm placement readiness.',
      priority: 'Medium',
      estimatedWeeks: 0,
      estimatedHours: 1,
      completionCriteria: ['New Gap Analysis readiness score is above 85%'],
      resources: [],
      projects: [],
    }),
  ];

  return [
    phase(1, 'Critical Missing Skills', 'Close skills that directly block role eligibility.', 'High', phase1Tasks),
    phase(2, 'Strengthen Existing Skills', 'Raise current proficiency to the role requirement.', 'Medium', phase2Tasks),
    phase(3, 'Strengthen Evidence', 'Convert existing skills into stronger, reviewable proof.', 'Medium', evidenceTasks),
    phase(4, 'Preferred Skills', 'Add lower-priority skills that improve role compatibility.', 'Low', phase4Tasks),
    phase(5, 'Career Readiness', 'Package your progress and reassess readiness.', 'Always', phase5Tasks),
  ];
}

function calculateProgress(phases = []) {
  const allTasks = phases.flatMap((item) => item.tasks || []);
  const counted = allTasks.filter((item) => item.status !== 'skipped');
  const completed = counted.filter((item) => item.status === 'completed').length;
  return counted.length ? Math.round((completed / counted.length) * 100) : 0;
}

function recalculatePhases(phases = []) {
  return phases.map((item) => ({
    ...item,
    progress: calculateProgress([{ tasks: item.tasks }]),
  }));
}

async function notify(userId, title, body, priority = 'medium') {
  try {
    await notificationsService.create({
      studentId: userId,
      title,
      body,
      category: 'roadmap',
      priority,
      read: false,
    });
  } catch {
    // Notifications are supportive and must not block roadmap operations.
  }
}

export const roadmapService = {
  async generate({ userId, gapReportId }) {
    const report = await gapAnalysisRepository.findOwnedById(gapReportId, userId);
    if (!report) throw new AppError('Gap report not found', 404, errorCodes.NOT_FOUND);

    const plainReport = report.toObject();
    const phases = buildPhases(plainReport);
    const aiEnhancement = await enhanceRoadmap({
      targetRole: plainReport.targetRoleSnapshot?.title || 'target role',
      phases,
    });

    const roadmap = await roadmapRepository.create({
      userId,
      gapReportId: report._id,
      careerRoleId: report.careerRoleId,
      targetRoleSnapshot: {
        title: plainReport.targetRoleSnapshot?.title || '',
        category: plainReport.targetRoleSnapshot?.category || '',
        experienceLevel: plainReport.targetRoleSnapshot?.experienceLevel || '',
      },
      readinessScoreAtGeneration: report.readinessScore,
      estimatedCompletionWeeks: phases.reduce((sum, item) => sum + item.estimatedWeeks, 0),
      overallProgress: 0,
      status: 'active',
      phases,
      aiEnhancement,
    });

    await notify(userId, 'Roadmap generated', `Your ${roadmap.targetRoleSnapshot.title} action plan is ready.`);
    await recordActivity({
      actorId: userId,
      actorRole: 'student',
      action: 'student_generated_roadmap',
      targetType: 'Roadmap',
      targetId: String(roadmap._id),
      message: `Generated roadmap for ${roadmap.targetRoleSnapshot.title}`,
      metadata: { gapReportId: String(report._id) },
    });
    return roadmap;
  },

  latest(userId) {
    return roadmapRepository.findLatestForUser(userId);
  },

  async getById(id, userId) {
    const roadmap = await roadmapRepository.findOwnedById(id, userId);
    if (!roadmap) throw new AppError('Roadmap not found', 404, errorCodes.NOT_FOUND);
    return roadmap;
  },

  async history(userId, { skip = 0, limit = 10 } = {}) {
    return {
      items: await roadmapRepository.listForUser(userId, { sort: '-createdAt', skip, limit }),
      total: await roadmapRepository.countForUser(userId),
    };
  },

  async updateTask({ userId, taskId, status }) {
    const roadmap = await roadmapRepository.findLatestForUser(userId);
    if (!roadmap) throw new AppError('Active roadmap not found', 404, errorCodes.NOT_FOUND);

    let found = false;
    const previouslyComplete = new Set(
      roadmap.phases.filter((item) => item.progress === 100).map((item) => item.phaseNumber),
    );

    const phases = roadmap.phases.map((phaseDoc) => {
      const current = phaseDoc.toObject();
      current.tasks = current.tasks.map((item) => {
        if (item.taskId !== taskId) return item;
        found = true;
        return {
          ...item,
          status,
          completedAt: status === 'completed' ? new Date() : null,
        };
      });
      return current;
    });
    if (!found) throw new AppError('Roadmap task not found', 404, errorCodes.NOT_FOUND);

    const recalculated = recalculatePhases(phases);
    const overallProgress = calculateProgress(recalculated);
    roadmap.phases = recalculated;
    roadmap.overallProgress = overallProgress;
    roadmap.status = overallProgress === 100 ? 'completed' : 'active';
    await roadmap.save();

    for (const item of recalculated) {
      if (item.progress === 100 && !previouslyComplete.has(item.phaseNumber)) {
        await notify(userId, 'Roadmap phase completed', `${item.title} is complete.`, 'high');
      }
    }
    if (overallProgress === 100) {
      await notify(userId, 'Roadmap completed', 'Your action plan is complete. Run Gap Analysis again.', 'high');
    }
    return roadmap;
  },
};

export { buildPhases, calculateProgress };
