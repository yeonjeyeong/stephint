import type { SupabaseClient } from '@supabase/supabase-js';

export const SUBMISSION_IMAGE_BUCKET = 'submission-images';
const DEFAULT_SIGNED_URL_TTL = 60 * 60;

const MIME_EXTENSION_MAP: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/heic': 'heic',
  'image/heif': 'heif',
};

interface UploadSubmissionImageParams {
  supabase: SupabaseClient;
  userId: string;
  submissionId: string;
  file: File;
  kind: 'problem' | 'solution';
}

export interface UploadedSubmissionImage {
  path: string;
  signedUrl: string;
}

export interface UploadedSubmissionImages {
  problem: UploadedSubmissionImage;
  solution: UploadedSubmissionImage | null;
}

function getFileExtension(file: File) {
  const extensionFromName = file.name.split('.').pop()?.trim().toLowerCase();
  if (extensionFromName && extensionFromName !== file.name.toLowerCase()) {
    return extensionFromName === 'jpeg' ? 'jpg' : extensionFromName;
  }

  return MIME_EXTENSION_MAP[file.type] || 'png';
}

function buildSubmissionImagePath(
  userId: string,
  submissionId: string,
  kind: 'problem' | 'solution',
  file: File
) {
  return `${userId}/${submissionId}/${kind}.${getFileExtension(file)}`;
}

export async function createSignedSubmissionImageUrl(
  supabase: SupabaseClient,
  pathOrUrl: string | null,
  expiresIn = DEFAULT_SIGNED_URL_TTL
) {
  if (!pathOrUrl) {
    return null;
  }

  if (/^https?:\/\//i.test(pathOrUrl) || pathOrUrl.startsWith('data:')) {
    return pathOrUrl;
  }

  const { data, error } = await supabase.storage
    .from(SUBMISSION_IMAGE_BUCKET)
    .createSignedUrl(pathOrUrl, expiresIn);

  if (error || !data?.signedUrl) {
    console.warn('[Storage] Failed to create signed URL:', error);
    return null;
  }

  return data.signedUrl;
}

async function uploadSubmissionImage({
  supabase,
  userId,
  submissionId,
  file,
  kind,
}: UploadSubmissionImageParams): Promise<UploadedSubmissionImage> {
  const path = buildSubmissionImagePath(userId, submissionId, kind, file);
  const buffer = Buffer.from(await file.arrayBuffer());

  const { error } = await supabase.storage.from(SUBMISSION_IMAGE_BUCKET).upload(path, buffer, {
    contentType: file.type || 'image/png',
    upsert: true,
  });

  if (error) {
    throw error;
  }

  const signedUrl = await createSignedSubmissionImageUrl(supabase, path);
  if (!signedUrl) {
    throw new Error(`Failed to create signed URL for ${kind} image.`);
  }

  return { path, signedUrl };
}

export async function uploadSubmissionImages(
  supabase: SupabaseClient,
  userId: string,
  submissionId: string,
  problemImage: File,
  solutionImage?: File | null
): Promise<UploadedSubmissionImages> {
  const problem = await uploadSubmissionImage({
    supabase,
    userId,
    submissionId,
    file: problemImage,
    kind: 'problem',
  });

  const solution = solutionImage
    ? await uploadSubmissionImage({
        supabase,
        userId,
        submissionId,
        file: solutionImage,
        kind: 'solution',
      })
    : null;

  return { problem, solution };
}
