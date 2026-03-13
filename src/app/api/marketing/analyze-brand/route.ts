/**
 * POST /api/marketing/analyze-brand
 * Analyze logo + product images using Gemini Vision
 * Returns: colors, design style, font suggestion, industry guess
 */
import { NextRequest, NextResponse } from 'next/server';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = 'gemini-2.5-flash-lite';

interface AnalyzeBrandRequest {
  logo_image: string;        // base64 data URI
  product_image?: string;    // optional base64 data URI
}

interface AnalyzeBrandResponse {
  primary_color: string;
  secondary_color: string;
  additional_colors: string[];
  design_style: string;
  font_suggestion: string;
  industry_guess: string;
  style_keywords: string;
  brand_description: string;
}

function extractBase64(dataUri: string): { mimeType: string; data: string } {
  // data:image/png;base64,iVBOR... → { mimeType, data }
  const match = dataUri.match(/^data:(image\/\w+);base64,(.+)$/);
  if (!match) {
    // Already raw base64 without prefix
    return { mimeType: 'image/png', data: dataUri };
  }
  return { mimeType: match[1], data: match[2] };
}

export async function POST(req: NextRequest) {
  if (!GEMINI_API_KEY) {
    return NextResponse.json({ error: 'GEMINI_API_KEY not configured' }, { status: 500 });
  }

  try {
    const body: AnalyzeBrandRequest = await req.json();

    if (!body.logo_image) {
      return NextResponse.json({ error: 'logo_image is required' }, { status: 400 });
    }

    const logo = extractBase64(body.logo_image);

    const imageParts: any[] = [
      {
        inlineData: {
          mimeType: logo.mimeType,
          data: logo.data,
        },
      },
    ];

    if (body.product_image) {
      const product = extractBase64(body.product_image);
      imageParts.push({
        inlineData: {
          mimeType: product.mimeType,
          data: product.data,
        },
      });
    }

    const analysisPrompt = `You are a brand identity analyst. Analyze the uploaded image(s).

${body.product_image ? 'Image 1 is the LOGO. Image 2 is a PRODUCT photo.' : 'The image is a LOGO.'}

Extract and return a JSON object with these fields:
{
  "primary_color": "<hex color code of the most dominant/important color in the logo>",
  "secondary_color": "<hex color code of the second most important color>",
  "additional_colors": ["<hex>", "<hex>"],  // up to 3 more colors found
  "design_style": "<one of: modern, minimalist, vibrant, professional, playful, luxury>",
  "font_suggestion": "<describe the font style used or suggested: e.g. 'Bold sans-serif with rounded edges' or 'Elegant serif with thin strokes'>",
  "industry_guess": "<guess the industry in English, e.g. 'Food & Snacks distribution', 'Fashion retail'>",
  "style_keywords": "<3-5 design keywords separated by comma, e.g. 'modern, vibrant, friendly, bold'>",
  "brand_description": "<1-2 sentence description of the brand identity and visual style, in English. Include: uniform/packaging details if visible from product photo>"
}

RULES:
- All colors MUST be valid 6-digit hex codes starting with #
- For primary_color, pick the color that represents the brand identity most (logo main color)
- For design_style, choose the single best match from the 6 options listed
- For font_suggestion, describe what you SEE in the logo text (if any), or recommend a suitable font style
- Be concise and precise
- Return ONLY the JSON object, no markdown, no explanation`;

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [
              ...imageParts,
              { text: analysisPrompt },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 500,
          topP: 0.8,
        },
      }),
    });

    const data = await res.json();

    if (data.error) {
      console.error('Gemini Vision Error:', JSON.stringify(data.error));
      return NextResponse.json({ error: 'AI analysis failed', details: data.error.message }, { status: 502 });
    }

    const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

    // Parse JSON from response (strip markdown fences if present)
    let cleaned = rawText.trim();
    if (cleaned.startsWith('```')) {
      cleaned = cleaned.replace(/^```(?:json)?\s*/, '').replace(/\s*```$/, '');
    }

    const result: AnalyzeBrandResponse = JSON.parse(cleaned);

    return NextResponse.json(result);
  } catch (err: any) {
    console.error('analyze-brand error:', err.message);
    return NextResponse.json({ error: 'Failed to analyze brand', details: err.message }, { status: 500 });
  }
}
