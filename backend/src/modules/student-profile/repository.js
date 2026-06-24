import { createBaseRepository } from '../../common/baseRepository.js';
import { StudentProfile } from './model.js';

const baseRepository = createBaseRepository(StudentProfile);

export const studentProfileRepository = {
  ...baseRepository,
  populateMentor: (profile) =>
    profile
      ? StudentProfile.populate(profile, {
          path: 'mentorId',
          select: 'name email department isActive',
        })
      : null,
  findByStudentId: (studentId) => StudentProfile.findOne({ studentId }),
  findByUserId: (userId) => StudentProfile.findOne({ userId }),
  list: (filter = {}, options = {}) => baseRepository.find(filter, options),
  count: (filter = {}) => baseRepository.countDocuments(filter),
  createProfile: (payload) => baseRepository.create(payload),
  upsertProfileByStudentId: async (studentId, payload) => {
    const { studentId: _ignoredStudentId, userId: _ignoredUserId, ...updatePayload } = payload || {};
    const resolvedStudentId = String(studentId || payload?.studentId || payload?.userId || '').trim();
    const resolvedUserId = String(payload?.userId || resolvedStudentId || '').trim();

    const existing = await StudentProfile.findOne({ studentId: resolvedStudentId });
    if (existing) {
      return StudentProfile.findByIdAndUpdate(
        existing._id,
        {
          $set: {
            userId: resolvedUserId,
            ...updatePayload,
          },
        },
        {
          new: true,
          runValidators: true,
        },
      );
    }

    return StudentProfile.create({
      studentId: resolvedStudentId,
      userId: resolvedUserId,
      ...updatePayload,
    });
  },
  updateProfile: (id, payload) => baseRepository.updateById(id, payload),
  deleteProfile: (id) => baseRepository.deleteById(id),
};
