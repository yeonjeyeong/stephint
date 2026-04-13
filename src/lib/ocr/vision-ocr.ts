interface VisionResponse {
  responses: Array<{
    textAnnotations?: Array<{
      description: string;
      locale?: string;
    }>;
    fullTextAnnotation?: {
      text: string;
    };
    error?: {
      code: number;
      message: string;
    };
  }>;
}

export interface OcrResult {
  text: string;
  success: boolean;
  error?: string;
}

export async function extractTextFromImage(
  imageBase64: string,
  mimeType: string = 'image/png'
): Promise<OcrResult> {
  void mimeType;

  const apiKey = process.env.GOOGLE_CLOUD_VISION_API_KEY;

  if (!apiKey) {
    console.warn('[OCR] GOOGLE_CLOUD_VISION_API_KEY not set, skipping OCR');
    return { text: '', success: false, error: 'API key not configured' };
  }

  try {
    const response = await fetch(
      `https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requests: [
            {
              image: { content: imageBase64 },
              features: [
                { type: 'TEXT_DETECTION', maxResults: 1 },
                { type: 'DOCUMENT_TEXT_DETECTION', maxResults: 1 },
              ],
              imageContext: {
                languageHints: ['ko', 'en'],
              },
            },
          ],
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[OCR] Vision API error:', errorText);
      return { text: '', success: false, error: `API returned ${response.status}` };
    }

    const data: VisionResponse = await response.json();
    const result = data.responses?.[0];

    if (result?.error) {
      return { text: '', success: false, error: result.error.message };
    }

    const text = result?.fullTextAnnotation?.text || result?.textAnnotations?.[0]?.description || '';

    return {
      text: text.trim(),
      success: !!text.trim(),
    };
  } catch (error) {
    console.error('[OCR] Error:', error);
    return {
      text: '',
      success: false,
      error: error instanceof Error ? error.message : 'Unknown OCR error',
    };
  }
}

export async function extractTextsFromImages(
  problemBase64: string,
  solutionBase64?: string,
  problemMime?: string,
  solutionMime?: string
): Promise<{ problemText: string; solutionText: string }> {
  const problemResult = await extractTextFromImage(problemBase64, problemMime);
  const solutionResult = solutionBase64
    ? await extractTextFromImage(solutionBase64, solutionMime)
    : { text: '', success: false };

  if (problemResult.success) {
    console.log(`[OCR] Problem text extracted: ${problemResult.text.length} chars`);
  }
  if (solutionResult.success) {
    console.log(`[OCR] Solution text extracted: ${solutionResult.text.length} chars`);
  }

  return {
    problemText: problemResult.text,
    solutionText: solutionResult.text,
  };
}
