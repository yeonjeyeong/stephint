import type { SessionUser } from './types';

type TeacherAccessUser = Pick<SessionUser, 'role' | 'teacherApproved' | 'isTeacherAdmin'>;

export function canAccessTeacherFeatures(user: TeacherAccessUser | null | undefined) {
  return Boolean(
    user &&
      user.role === 'teacher' &&
      (user.teacherApproved || user.isTeacherAdmin)
  );
}

export function isPendingTeacher(user: TeacherAccessUser | null | undefined) {
  return Boolean(user && user.role === 'teacher' && !canAccessTeacherFeatures(user));
}

export function getDefaultRedirectForUser(user: TeacherAccessUser) {
  if (user.role === 'teacher') {
    return canAccessTeacherFeatures(user) ? '/teacher/dashboard' : '/teacher/pending';
  }

  return '/student/upload';
}
