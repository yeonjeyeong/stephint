import { NextRequest, NextResponse } from 'next/server';
import { analyzeSolution } from '@/lib/ai/analyzer';
import { requireRouteSession } from '@/lib/auth/session';
import { extractTextsFromImages } from '@/lib/ocr/vision-ocr';
import { uploadSubmissionImages } from '@/lib/storage/submission-images';

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ALLOWED_MIME_TYPES = ['image/png', 'image/jpeg', 'image/webp'];

const globalStore = globalThis as typeof globalThis & {
  __stephintAnalyzeLimit?: Map<string, { count: number; timestamp: number }>;
};
const analyzeRateLimit = globalStore.__stephintAnalyzeLimit ?? new Map();
globalStore.__stephintAnalyzeLimit = analyzeRateLimit;

function checkAnalyzeRateLimit(userId: string) {
  const now = Date.now();
  const userData = analyzeRateLimit.get(userId);

  if (!userData || now - userData.timestamp > 60000) {
    analyzeRateLimit.set(userId, { count: 1, timestamp: now });
    return true;
  }

  if (userData.count >= 3) {
    return false;
  }

  userData.count += 1;
  return true;
}

function isInvalidImage(file: File | null) {
  if (!file) {
    return false;
  }

  return file.size > MAX_FILE_SIZE || !ALLOWED_MIME_TYPES.includes(file.type);
}

export async function POST(request: NextRequest) {
  const auth = await requireRouteSession(['student']);
  if ('response' in auth) {
    return auth.response;
  }

  let submissionId: string | null = null;

  try {
    const contentType = request.headers.get('content-type') || '';
    if (!contentType.includes('multipart/form-data')) {
      return NextResponse.json(
        { error: '이미지 업로드 형식이 올바르지 않습니다.' },
        { status: 400 }
      );
    }

    const formData = await request.formData();
    const problemImage = formData.get('problemImage') as File | null;
    const solutionImage = formData.get('solutionImage') as File | null;
    const studentNote = formData.get('studentNote') as string | null;

    if (!problemImage) {
      return NextResponse.json(
        { error: '문제 이미지는 꼭 올려 주세요.' },
        { status: 400 }
      );
    }

    if (isInvalidImage(problemImage) || isInvalidImage(solutionImage)) {
      return NextResponse.json(
        { error: '이미지는 PNG, JPEG, WEBP 형식이며 10MB 이하여야 합니다.' },
        { status: 400 }
      );
    }

    if (!checkAnalyzeRateLimit(auth.session.user.id)) {
      return NextResponse.json(
        { error: '요청이 너무 많습니다. 잠시 후 다시 시도해 주세요.' },
        { status: 429 }
      );
    }

    submissionId = crypto.randomUUID();

    const uploadedImages = await uploadSubmissionImages(
      auth.supabase,
      auth.session.user.id,
      submissionId,
      problemImage,
      solutionImage
    );

    const problemBuffer = Buffer.from(await problemImage.arrayBuffer());
    const problemImageBase64 = problemBuffer.toString('base64');
    const problemImageMime = problemImage.type || 'image/png';

    const solutionBuffer = solutionImage ? Buffer.from(await solutionImage.arrayBuffer()) : null;
    const solutionImageBase64 = solutionBuffer?.toString('base64');
    const solutionImageMime = solutionImage?.type || undefined;

    let problemOcrText: string | undefined;
    let solutionOcrText: string | undefined;

    try {
      const ocrResults = await extractTextsFromImages(
        problemImageBase64,
        solutionImageBase64,
        problemImageMime,
        solutionImageMime
      );
      problemOcrText = ocrResults.problemText;
      solutionOcrText = ocrResults.solutionText;
    } catch (ocrError) {
      console.warn('[API] OCR failed:', ocrError);
    }

    const { data: insertedSubmission, error: submissionError } = await auth.supabase
      .from('submissions')
      .insert({
        id: submissionId,
        user_id: auth.session.user.id,
        problem_image_url: uploadedImages.problem.path,
        solution_image_url: uploadedImages.solution?.path || '',
        student_note: studentNote,
        problem_ocr_text: problemOcrText || null,
        solution_ocr_text: solutionOcrText || null,
        status: 'pending',
      })
      .select('id, created_at')
      .single();

    if (submissionError || !insertedSubmission) {
      throw submissionError || new Error('Submission insert failed');
    }

    const result = await analyzeSolution({
      problemImageUrl: uploadedImages.problem.path,
      solutionImageUrl: uploadedImages.solution?.path || null,
      studentNote,
      problemImageBase64,
      problemImageMime,
      solutionImageBase64,
      solutionImageMime,
      problemOcrText,
      solutionOcrText,
    });

    const { error: diagnosisError } = await auth.supabase.from('diagnoses').insert({
      submission_id: insertedSubmission.id,
      problem_type: result.diagnosis.problemType,
      progress_summary: result.diagnosis.progressSummary,
      stuck_point: result.diagnosis.stuckPoint,
      misconception_tags: result.diagnosis.misconceptionTags,
      concepts_to_review: result.diagnosis.conceptsToReview,
      next_hint: result.diagnosis.nextHint,
      retry_question: result.diagnosis.retryQuestion,
      answer_revealed: false,
      provider_name: result.providerName,
      prompt_version: result.promptVersion,
      leakage_guard_passed: result.leakageGuardPassed,
      fallback_used: result.fallbackUsed,
    });

    if (diagnosisError) {
      throw diagnosisError;
    }

    await auth.supabase
      .from('submissions')
      .update({ status: 'completed' })
      .eq('id', insertedSubmission.id);

    return NextResponse.json({
      submissionId: insertedSubmission.id,
      status: 'completed',
      createdAt: insertedSubmission.created_at,
      diagnosis: result.diagnosis,
      problemImageUrl: uploadedImages.problem.signedUrl,
      solutionImageUrl: uploadedImages.solution?.signedUrl || null,
      ocrUsed: Boolean(problemOcrText || solutionOcrText),
      problemOcrText: problemOcrText || null,
      solutionOcrText: solutionOcrText || null,
      providerName: result.providerName,
      promptVersion: result.promptVersion,
      fallbackUsed: result.fallbackUsed,
      leakageGuardPassed: result.leakageGuardPassed,
    });
  } catch (error) {
    console.error('[API] analyze error:', error);

    if (submissionId) {
      await auth.supabase
        .from('submissions')
        .update({ status: 'failed' })
        .eq('id', submissionId);
    }

    return NextResponse.json(
      { error: '분석 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
