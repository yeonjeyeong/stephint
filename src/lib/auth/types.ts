export type AppRole = 'student' | 'teacher';

export interface SessionUser {
  id: string;
  email: string;
  username: string;
  displayName: string;
  role: AppRole;
  teacherApproved: boolean;
  isTeacherAdmin: boolean;
}

export interface AuthSession {
  user: SessionUser;
  expiresAt: string | null;
}

export interface ProfileRecord {
  id: string;
  email: string;
  username: string;
  display_name: string;
  role: AppRole;
  created_at: string;
  updated_at: string;
}

export interface TeacherStudentLinkRecord {
  teacher_id: string;
  student_id: string;
  created_at: string;
}
