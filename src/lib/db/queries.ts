import type { SupabaseClient } from '@supabase/supabase-js';
import type { Diagnosis } from '@/types/diagnosis';
import type {
  DashboardSummary,
  LinkedStudent,
  StudentDashboard,
  StudentInsight,
  SubmissionWithDiagnosis,
} from '@/types/submission';
import type { ProfileRecord } from '@/lib/auth/types';
import { createSignedSubmissionImageUrl } from '@/lib/storage/submission-images';
import { sanitizeDiagnosisText } from '@/lib/ai/format-ai-text';
import { filterVisibleMisconceptionTags } from '@/lib/diagnosis/misconception-tags';

interface DiagnosisRow {
  problem_type: string;
  progress_summary: string;
  stuck_point: string;
  misconception_tags: string[];
  concepts_to_review: string[];
  next_hint: string;
  retry_question: string;
  answer_revealed: boolean;
  provider_name: string;
  prompt_version: string;
  leakage_guard_passed: boolean;
  fallback_used: boolean;
}

interface SubmissionRow {
  id: string;
  user_id: string;
  problem_image_url: string;
  solution_image_url: string;
  student_note: string | null;
  problem_ocr_text: string | null;
  solution_ocr_text: string | null;
  status: 'pending' | 'completed' | 'failed';
  created_at: string;
  diagnoses: DiagnosisRow | DiagnosisRow[] | null;
}

type SubmissionProfileMap = Record<
  string,
  Pick<ProfileRecord, 'display_name' | 'username'> | undefined
>;

function getDiagnosisRow(row: SubmissionRow['diagnoses']): DiagnosisRow | null {
  if (!row) {
    return null;
  }

  return Array.isArray(row) ? row[0] ?? null : row;
}

function mapDiagnosis(row: SubmissionRow['diagnoses']): Diagnosis | null {
  const diagnosis = getDiagnosisRow(row);
  if (!diagnosis) {
    return null;
  }

  return sanitizeDiagnosisText({
    problemType: diagnosis.problem_type,
    progressSummary: diagnosis.progress_summary,
    stuckPoint: diagnosis.stuck_point,
    misconceptionTags: diagnosis.misconception_tags,
    conceptsToReview: diagnosis.concepts_to_review,
    nextHint: diagnosis.next_hint,
    retryQuestion: diagnosis.retry_question,
    answerRevealed: false,
  });
}

function getDiagnosisMetadata(row: SubmissionRow['diagnoses']) {
  const diagnosis = getDiagnosisRow(row);
  if (!diagnosis) {
    return {
      providerName: null,
      promptVersion: null,
      fallbackUsed: false,
      leakageGuardPassed: true,
    };
  }

  return {
    providerName: diagnosis.provider_name,
    promptVersion: diagnosis.prompt_version,
    fallbackUsed: diagnosis.fallback_used,
    leakageGuardPassed: diagnosis.leakage_guard_passed,
  };
}

async function mapSubmission(
  supabase: SupabaseClient,
  row: SubmissionRow,
  profileMap: SubmissionProfileMap
): Promise<SubmissionWithDiagnosis> {
  const student = profileMap[row.user_id];
  const diagnosis = mapDiagnosis(row.diagnoses);
  const metadata = getDiagnosisMetadata(row.diagnoses);
  const [problemImageUrl, solutionImageUrl] = await Promise.all([
    createSignedSubmissionImageUrl(supabase, row.problem_image_url),
    createSignedSubmissionImageUrl(supabase, row.solution_image_url),
  ]);

  return {
    id: row.id,
    userId: row.user_id,
    studentName: student?.display_name ?? null,
    studentUsername: student?.username ?? null,
    problemImageUrl: problemImageUrl ?? row.problem_image_url,
    solutionImageUrl: solutionImageUrl ?? row.solution_image_url,
    studentNote: row.student_note,
    problemOcrText: row.problem_ocr_text,
    solutionOcrText: row.solution_ocr_text,
    status: row.status,
    createdAt: row.created_at,
    diagnosis,
    providerName: metadata.providerName,
    promptVersion: metadata.promptVersion,
    fallbackUsed: metadata.fallbackUsed,
    leakageGuardPassed: metadata.leakageGuardPassed,
  };
}

function summarizeSubmissions(source: SubmissionWithDiagnosis[]) {
  const completed = source.filter(
    (submission) => submission.status === 'completed' && submission.diagnosis
  );
  const tagCounts: Record<string, number> = {};
  const typeCounts: Record<string, number> = {};
  const conceptCounts: Record<string, number> = {};

  for (const submission of completed) {
    const diagnosis = submission.diagnosis!;

    for (const tag of filterVisibleMisconceptionTags(diagnosis.misconceptionTags)) {
      tagCounts[tag] = (tagCounts[tag] || 0) + 1;
    }

    typeCounts[diagnosis.problemType] = (typeCounts[diagnosis.problemType] || 0) + 1;

    for (const concept of diagnosis.conceptsToReview) {
      conceptCounts[concept] = (conceptCounts[concept] || 0) + 1;
    }
  }

  return {
    completed,
    topMisconceptions: Object.entries(tagCounts)
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count),
    problemTypeDistribution: Object.entries(typeCounts)
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count),
    reviewConcepts: Object.entries(conceptCounts)
      .map(([concept, count]) => ({ concept, count }))
      .sort((a, b) => b.count - a.count),
  };
}

function buildAttentionState(submissions: SubmissionWithDiagnosis[]) {
  const summary = summarizeSubmissions(submissions);
  const latestCompleted = summary.completed[0];
  const topMisconception = summary.topMisconceptions[0];

  if (submissions.length > 0 && summary.completed.length === 0) {
    return {
      needsAttention: true,
      attentionReason: '완료된 진단이 아직 없어 첫 분석 결과를 점검할 필요가 있습니다.',
    };
  }

  if (topMisconception && topMisconception.count >= 2) {
    return {
      needsAttention: true,
      attentionReason: `${topMisconception.tag} 오개념이 ${topMisconception.count}회 반복되어 개별 개입이 필요합니다.`,
    };
  }

  if (latestCompleted?.fallbackUsed) {
    return {
      needsAttention: true,
      attentionReason: '최근 진단이 fallback으로 생성되어 원본 풀이를 직접 확인하는 편이 좋습니다.',
    };
  }

  return {
    needsAttention: false,
    attentionReason: null,
  };
}

function buildTeacherSummary(
  studentInsights: StudentInsight[],
  summary: ReturnType<typeof summarizeSubmissions>
) {
  if (studentInsights.length === 0) {
    return '아직 연결된 학생이 없어 진단 요약을 만들 수 없습니다.';
  }

  const attentionCount = studentInsights.filter((student) => student.needsAttention).length;
  const topMisconception = summary.topMisconceptions[0];
  const topProblemType = summary.problemTypeDistribution[0];
  const parts = [`연결된 학생 ${studentInsights.length}명 중 ${attentionCount}명에게 개입이 필요합니다.`];

  if (topMisconception) {
    parts.push(`가장 자주 반복된 오개념은 "${topMisconception.tag}"입니다.`);
  }

  if (topProblemType) {
    parts.push(`최근 가장 많이 제출된 유형은 "${topProblemType.type}"입니다.`);
  }

  return parts.join(' ');
}

function buildTeacherRecommendation(
  studentName: string,
  submissions: SubmissionWithDiagnosis[],
  attentionReason: string | null
) {
  const summary = summarizeSubmissions(submissions);
  const topMisconception = summary.topMisconceptions[0];
  const topConcept = summary.reviewConcepts[0];

  if (attentionReason) {
    return `${attentionReason} ${studentName} 학생의 최근 풀이 이미지와 OCR 텍스트를 함께 보며 직전 단계 설명을 요청해 보세요.`;
  }

  if (topMisconception && topConcept) {
    return `현재 가장 두드러진 오개념은 "${topMisconception.tag}"입니다. 다음 지도에서는 "${topConcept.concept}" 개념을 먼저 짚어 주는 편이 좋습니다.`;
  }

  return '현재 진단 데이터가 많지 않습니다. 다음 풀이 제출을 유도해 학생의 사고 패턴을 더 수집해 보세요.';
}

async function loadProfilesByIds(
  supabase: SupabaseClient,
  userIds: string[]
): Promise<SubmissionProfileMap> {
  if (userIds.length === 0) {
    return {};
  }

  const { data, error } = await supabase
    .from('profiles')
    .select('id, display_name, username')
    .in('id', userIds);

  if (error || !data) {
    return {};
  }

  return Object.fromEntries(
    data.map((profile) => [profile.id, profile as SubmissionProfileMap[string]])
  );
}

export async function getSessionProfile(
  supabase: SupabaseClient,
  userId: string
): Promise<ProfileRecord | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, email, username, display_name, role, created_at, updated_at')
    .eq('id', userId)
    .single();

  if (error || !data) {
    return null;
  }

  return data as ProfileRecord;
}

export async function getStudentHistory(supabase: SupabaseClient, studentId: string) {
  const { data, error } = await supabase
    .from('submissions')
    .select(
      'id, user_id, problem_image_url, solution_image_url, student_note, problem_ocr_text, solution_ocr_text, status, created_at, diagnoses(problem_type, progress_summary, stuck_point, misconception_tags, concepts_to_review, next_hint, retry_question, answer_revealed, provider_name, prompt_version, leakage_guard_passed, fallback_used)'
    )
    .eq('user_id', studentId)
    .order('created_at', { ascending: false });

  if (error) {
    throw error;
  }

  const rows = (data ?? []) as SubmissionRow[];
  const profileMap = await loadProfilesByIds(supabase, [studentId]);
  return Promise.all(rows.map((row) => mapSubmission(supabase, row, profileMap)));
}

export async function getSubmissionById(
  supabase: SupabaseClient,
  submissionId: string
) {
  const { data, error } = await supabase
    .from('submissions')
    .select(
      'id, user_id, problem_image_url, solution_image_url, student_note, problem_ocr_text, solution_ocr_text, status, created_at, diagnoses(problem_type, progress_summary, stuck_point, misconception_tags, concepts_to_review, next_hint, retry_question, answer_revealed, provider_name, prompt_version, leakage_guard_passed, fallback_used)'
    )
    .eq('id', submissionId)
    .single();

  if (error || !data) {
    return null;
  }

  const row = data as SubmissionRow;
  const profileMap = await loadProfilesByIds(supabase, [row.user_id]);
  return mapSubmission(supabase, row, profileMap);
}

async function getLinkedStudents(supabase: SupabaseClient): Promise<LinkedStudent[]> {
  const { data, error } = await supabase
    .from('teacher_student_links')
    .select(
      'student_id, created_at, student:profiles!teacher_student_links_student_id_fkey(id, email, username, display_name)'
    )
    .order('created_at', { ascending: true });

  if (error) {
    throw error;
  }

  return (data ?? []).map((row) => {
    const student = Array.isArray(row.student) ? row.student[0] : row.student;

    return {
      studentId: row.student_id,
      studentName: student.display_name,
      studentUsername: student.username,
      studentEmail: student.email,
      linkedAt: row.created_at,
    };
  });
}

async function getSubmissionsForStudents(
  supabase: SupabaseClient,
  studentIds: string[]
) {
  if (studentIds.length === 0) {
    return [];
  }

  const { data, error } = await supabase
    .from('submissions')
    .select(
      'id, user_id, problem_image_url, solution_image_url, student_note, problem_ocr_text, solution_ocr_text, status, created_at, diagnoses(problem_type, progress_summary, stuck_point, misconception_tags, concepts_to_review, next_hint, retry_question, answer_revealed, provider_name, prompt_version, leakage_guard_passed, fallback_used)'
    )
    .in('user_id', studentIds)
    .order('created_at', { ascending: false });

  if (error) {
    throw error;
  }

  const rows = (data ?? []) as SubmissionRow[];
  const profileMap = await loadProfilesByIds(supabase, studentIds);
  return Promise.all(rows.map((row) => mapSubmission(supabase, row, profileMap)));
}

export async function getTeacherDashboardSummary(
  supabase: SupabaseClient
): Promise<DashboardSummary> {
  const linkedStudents = await getLinkedStudents(supabase);
  const submissions = await getSubmissionsForStudents(
    supabase,
    linkedStudents.map((student) => student.studentId)
  );
  const summary = summarizeSubmissions(submissions);

  const studentInsights: StudentInsight[] = linkedStudents.map((student) => {
    const studentSubmissions = submissions.filter(
      (submission) => submission.userId === student.studentId
    );
    const studentSummary = summarizeSubmissions(studentSubmissions);
    const latestWithDiagnosis = studentSubmissions.find((submission) => submission.diagnosis);
    const attention = buildAttentionState(studentSubmissions);

    return {
      ...student,
      submissionCount: studentSubmissions.length,
      completedSubmissions: studentSummary.completed.length,
      lastSubmissionAt: studentSubmissions[0]?.createdAt ?? null,
      latestProblemType: latestWithDiagnosis?.diagnosis?.problemType ?? null,
      latestStuckPoint: latestWithDiagnosis?.diagnosis?.stuckPoint ?? null,
      topMisconceptions: studentSummary.topMisconceptions.slice(0, 3),
      reviewConcepts: studentSummary.reviewConcepts.slice(0, 3),
      needsAttention: attention.needsAttention,
      attentionReason: attention.attentionReason,
    };
  });

  const attentionStudents = studentInsights
    .filter((student) => student.needsAttention && student.attentionReason)
    .map((student) => ({
      studentId: student.studentId,
      reason: student.attentionReason!,
    }));

  return {
    recentSubmissions: submissions.slice(0, 10),
    topMisconceptions: summary.topMisconceptions,
    problemTypeDistribution: summary.problemTypeDistribution,
    reviewConcepts: summary.reviewConcepts,
    studentInsights,
    teacherSummary: buildTeacherSummary(studentInsights, summary),
    attentionStudents,
    isTeacherAdmin: false,
    pendingTeacherApprovals: [],
  };
}

export async function getTeacherStudentDashboard(
  supabase: SupabaseClient,
  studentId: string
): Promise<StudentDashboard | null> {
  const linkedStudents = await getLinkedStudents(supabase);
  const linkedStudent = linkedStudents.find((student) => student.studentId === studentId);

  if (!linkedStudent) {
    return null;
  }

  const profile = await getSessionProfile(supabase, studentId);
  if (!profile) {
    return null;
  }

  const submissions = await getSubmissionsForStudents(supabase, [studentId]);
  const summary = summarizeSubmissions(submissions);
  const attention = buildAttentionState(submissions);

  return {
    student: {
      id: profile.id,
      email: profile.email,
      username: profile.username,
      displayName: profile.display_name,
      role: profile.role,
      teacherApproved: profile.role !== 'teacher',
      isTeacherAdmin: false,
    },
    linkedAt: linkedStudent.linkedAt,
    totalSubmissions: submissions.length,
    completedSubmissions: summary.completed.length,
    lastSubmissionAt: submissions[0]?.createdAt ?? null,
    recentSubmissions: submissions.slice(0, 10),
    topMisconceptions: summary.topMisconceptions,
    problemTypeDistribution: summary.problemTypeDistribution,
    reviewConcepts: summary.reviewConcepts,
    teacherRecommendation: buildTeacherRecommendation(
      profile.display_name,
      submissions,
      attention.attentionReason
    ),
  };
}
