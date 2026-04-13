import type { SessionUser } from '@/lib/auth/types';

export type SubmissionStatus = 'pending' | 'completed' | 'failed';

export interface SubmissionWithDiagnosis {
  id: string;
  userId: string;
  studentName: string | null;
  studentUsername: string | null;
  problemImageUrl: string;
  solutionImageUrl: string;
  studentNote: string | null;
  problemOcrText: string | null;
  solutionOcrText: string | null;
  status: SubmissionStatus;
  createdAt: string;
  diagnosis: import('./diagnosis').Diagnosis | null;
  providerName: string | null;
  promptVersion: string | null;
  fallbackUsed: boolean;
  leakageGuardPassed: boolean;
}

export interface LinkedStudent {
  studentId: string;
  studentName: string;
  studentUsername: string;
  studentEmail: string;
  linkedAt: string;
}

export interface StudentInsight extends LinkedStudent {
  submissionCount: number;
  completedSubmissions: number;
  lastSubmissionAt: string | null;
  latestProblemType: string | null;
  latestStuckPoint: string | null;
  topMisconceptions: { tag: string; count: number }[];
  reviewConcepts: { concept: string; count: number }[];
  needsAttention: boolean;
  attentionReason: string | null;
}

export interface PendingTeacherApproval {
  id: string;
  email: string;
  username: string;
  displayName: string;
  createdAt: string;
}

export interface DashboardSummary {
  recentSubmissions: SubmissionWithDiagnosis[];
  topMisconceptions: { tag: string; count: number }[];
  problemTypeDistribution: { type: string; count: number }[];
  reviewConcepts: { concept: string; count: number }[];
  studentInsights: StudentInsight[];
  teacherSummary: string;
  attentionStudents: Array<{ studentId: string; reason: string }>;
  isTeacherAdmin: boolean;
  pendingTeacherApprovals: PendingTeacherApproval[];
}

export interface StudentDashboard {
  student: SessionUser;
  linkedAt: string | null;
  totalSubmissions: number;
  completedSubmissions: number;
  lastSubmissionAt: string | null;
  recentSubmissions: SubmissionWithDiagnosis[];
  topMisconceptions: { tag: string; count: number }[];
  problemTypeDistribution: { type: string; count: number }[];
  reviewConcepts: { concept: string; count: number }[];
  teacherRecommendation: string;
}
