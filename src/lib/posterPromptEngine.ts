/**
 * AI Poster Prompt Engine
 * Converts structured form inputs into professional English design prompts
 * for Gemini / AI image generation.
 */

// ============ TYPES ============

export type PosterType = 
  | 'promotion'
  | 'product_launch'
  | 'minigame'
  | 'brand_awareness'
  | 'event'
  | 'recruitment'
  | 'holiday'
  | 'custom';

export type AspectRatio = '1:1' | '9:16' | '21:9' | '4:5' | '16:9';

export type DesignStyle = 'modern' | 'minimalist' | 'vibrant' | 'professional' | 'playful' | 'luxury';

export interface BrandProfile {
  id: string;
  brand_name: string;
  logo_url?: string;
  primary_color: string;
  secondary_color: string;
  industry: string;
  style_keywords: string;
  default_instructions: string;
}

export interface PosterFormData {
  // Brand
  brand: BrandProfile;
  
  // Poster type
  type: PosterType;
  
  // Content
  headline: string;
  subheadline?: string;
  product_name?: string;
  selling_points?: string[];  // Key benefits/offers
  cta?: string;               // Call to action text
  
  // Visual
  aspect_ratio: AspectRatio;
  style: DesignStyle;
  has_character: boolean;
  character_description?: string;
  product_description?: string;   // What the product looks like
  background_description?: string;
  
  // Extra
  extra_instructions?: string;   // Free-form additions
  reference_image_desc?: string; // Description of uploaded reference
}

// ============ POSTER TYPE METADATA ============

export const POSTER_TYPES: Record<PosterType, { label: string; icon: string; description: string }> = {
  promotion: {
    label: 'Khuyến mãi',
    icon: '🏷️',
    description: 'Sale, giảm giá, chương trình ưu đãi',
  },
  product_launch: {
    label: 'Sản phẩm mới',
    icon: '🚀',
    description: 'Ra mắt, giới thiệu sản phẩm mới',
  },
  minigame: {
    label: 'MiniGame',
    icon: '🎮',
    description: 'Trò chơi, tương tác fanpage',
  },
  brand_awareness: {
    label: 'Thương hiệu',
    icon: '💎',
    description: 'Nhận diện, giới thiệu thương hiệu',
  },
  event: {
    label: 'Sự kiện',
    icon: '📅',
    description: 'Hội chợ, triển lãm, workshop',
  },
  recruitment: {
    label: 'Tuyển dụng',
    icon: '🤝',
    description: 'Tuyển nhân viên, đại lý, NPP',
  },
  holiday: {
    label: 'Lễ / Tết',
    icon: '🎊',
    description: 'Chúc mừng ngày lễ, sự kiện đặc biệt',
  },
  custom: {
    label: 'Tùy chỉnh',
    icon: '✨',
    description: 'Tự nhập nội dung theo ý muốn',
  },
};

export const ASPECT_RATIOS: Record<AspectRatio, { label: string; desc: string; px: string }> = {
  '1:1':  { label: '1:1',  desc: 'Facebook Post',   px: '1080×1080' },
  '9:16': { label: '9:16', desc: 'Story / Reels',    px: '1080×1920' },
  '4:5':  { label: '4:5',  desc: 'Facebook Feed',    px: '1080×1350' },
  '16:9': { label: '16:9', desc: 'Landscape',        px: '1920×1080' },
  '21:9': { label: '21:9', desc: 'Cover Fanpage',    px: '1640×720'  },
};

export const DESIGN_STYLES: Record<DesignStyle, { label: string; desc: string; keywords: string }> = {
  modern:       { label: 'Modern',       desc: 'Hiện đại, sạch sẽ',         keywords: 'clean lines, geometric shapes, contemporary layout, sans-serif typography' },
  minimalist:   { label: 'Minimalist',   desc: 'Tối giản, tinh tế',         keywords: 'lots of white space, simple composition, elegant, understated' },
  vibrant:      { label: 'Vibrant',      desc: 'Rực rỡ, bắt mắt',          keywords: 'bold colors, dynamic composition, eye-catching, energetic, high contrast' },
  professional: { label: 'Professional', desc: 'Chuyên nghiệp, uy tín',     keywords: 'corporate quality, trustworthy, polished, structured layout' },
  playful:      { label: 'Playful',      desc: 'Vui nhộn, trẻ trung',       keywords: 'fun, colorful, cartoon-like elements, rounded shapes, casual' },
  luxury:       { label: 'Luxury',       desc: 'Sang trọng, cao cấp',       keywords: 'gold accents, dark background, elegant serif fonts, premium feel' },
};

// ============ DEFAULT BRAND PROFILES ============

export const DEFAULT_BRANDS: BrandProfile[] = [
  {
    id: 'lyhu',
    brand_name: 'LYHU',
    primary_color: '#00B8A9',
    secondary_color: '#4CAF50',
    industry: 'Food distribution - snacks, seasonings, candies, taro chips',
    style_keywords: 'modern, vibrant, professional',
    default_instructions: 'Company uniform is a teal polo shirt with collar, LYHU logo on left chest. Products include taro chips, snacks, rice paper, seasoning.',
  },
];

// ============ COLOR UTILITIES ============

function hexToColorName(hex: string): string {
  const colors: Record<string, string> = {
    '#00B8A9': 'teal', '#4CAF50': 'green', '#FF5722': 'deep orange',
    '#2196F3': 'blue', '#FFC107': 'amber/yellow', '#E91E63': 'pink',
    '#9C27B0': 'purple', '#FF9800': 'orange', '#795548': 'brown',
    '#607D8B': 'blue-grey', '#F44336': 'red', '#000000': 'black',
    '#FFFFFF': 'white', '#FFEB3B': 'yellow', '#00BCD4': 'cyan',
  };
  const upper = hex.toUpperCase();
  if (colors[upper]) return colors[upper];
  // Parse hex to rough color name
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  if (r > 200 && g < 100 && b < 100) return 'red';
  if (r < 100 && g > 200 && b < 100) return 'green';
  if (r < 100 && g < 100 && b > 200) return 'blue';
  if (r > 200 && g > 200 && b < 100) return 'yellow';
  if (r > 200 && g > 100 && b < 100) return 'orange';
  if (r > 150 && g < 100 && b > 150) return 'purple';
  if (r < 100 && g > 150 && b > 150) return 'teal/cyan';
  return hex;
}

// ============ PROMPT BUILDER ============

function getAspectDescription(ratio: AspectRatio): string {
  const map: Record<AspectRatio, string> = {
    '1:1': 'Square (1:1) format, 1080×1080px, optimized for Facebook post',
    '9:16': 'Vertical (9:16) format, 1080×1920px, optimized for Stories/Reels',
    '4:5': 'Portrait (4:5) format, 1080×1350px, optimized for Facebook feed',
    '16:9': 'Landscape (16:9) format, 1920×1080px, wide format',
    '21:9': 'Ultra-wide (21:9) format, 1640×720px, optimized for Facebook cover photo',
  };
  return map[ratio];
}

function buildTypeSpecificPrompt(data: PosterFormData): string {
  const { type, headline, subheadline, product_name, selling_points, cta } = data;
  
  const pointsList = selling_points?.filter(p => p.trim()).map(p => `  - "${p}"`).join('\n') || '';
  
  switch (type) {
    case 'promotion':
      return `PURPOSE: Promotional/Sales poster for a food distribution company.

HEADLINE (large, bold, eye-catching): "${headline}"
${subheadline ? `SUBHEADLINE: "${subheadline}"` : ''}
${product_name ? `FEATURED PRODUCT: ${product_name}` : ''}

${pointsList ? `KEY SELLING POINTS (display as badges, ribbons, or callout elements):\n${pointsList}` : ''}
${cta ? `CALL TO ACTION: "${cta}"` : ''}

DESIGN DIRECTION: Create urgency and excitement. Use bold typography for the main offer. Product should be prominently displayed with dynamic floating/flying effect.`;

    case 'product_launch':
      return `PURPOSE: New product launch/introduction poster.

HEADLINE (large, bold): "${headline}"
${subheadline ? `SUBHEADLINE: "${subheadline}"` : ''}
${product_name ? `PRODUCT: ${product_name} — make it the hero element, large and centered` : ''}

${pointsList ? `UNIQUE SELLING POINTS:\n${pointsList}` : ''}
${cta ? `CALL TO ACTION: "${cta}"` : ''}

DESIGN DIRECTION: Focus on product beauty shot. Clean, premium feel. Product should look appetizing and high-quality. Use spotlight or glow effect on the product.`;

    case 'minigame':
      return `PURPOSE: Facebook MiniGame/Interactive post.

GAME TITLE (large, fun typography): "${headline}"
${subheadline ? `GAME DESCRIPTION: "${subheadline}"` : ''}

${pointsList ? `GAME DETAILS:\n${pointsList}` : ''}
${cta ? `CALL TO ACTION: "${cta}"` : ''}

DESIGN DIRECTION: Fun, engaging, game-like design. Use playful elements like stars, confetti, gift boxes, arrows. Make it clear this is an interactive game post. Include visual element suggesting "comment to play".`;

    case 'brand_awareness':
      return `PURPOSE: Brand awareness / brand identity poster.

MAIN MESSAGE (elegant typography): "${headline}"
${subheadline ? `SUPPORTING MESSAGE: "${subheadline}"` : ''}

${pointsList ? `BRAND VALUES:\n${pointsList}` : ''}

DESIGN DIRECTION: Sophisticated, memorable. Focus on brand identity and emotional connection. Logo should be prominent. Less text, more visual impact.`;

    case 'event':
      return `PURPOSE: Event announcement poster.

EVENT NAME (bold, attention-grabbing): "${headline}"
${subheadline ? `EVENT DETAILS: "${subheadline}"` : ''}

${pointsList ? `INFORMATION:\n${pointsList}` : ''}
${cta ? `CALL TO ACTION: "${cta}"` : ''}

DESIGN DIRECTION: Informative yet exciting. Clear hierarchy of information: event name > date/time > location > details. Use event-specific visual elements.`;

    case 'recruitment':
      return `PURPOSE: Recruitment / business partnership poster.

POSITION/OPPORTUNITY: "${headline}"
${subheadline ? `SUBTITLE: "${subheadline}"` : ''}

${pointsList ? `BENEFITS & REQUIREMENTS:\n${pointsList}` : ''}
${cta ? `CALL TO ACTION: "${cta}"` : ''}

DESIGN DIRECTION: Professional and inviting. Show growth opportunity. Include imagery suggesting teamwork, career advancement, or business partnership.`;

    case 'holiday':
      return `PURPOSE: Holiday/Special occasion greeting poster.

GREETING MESSAGE (festive typography): "${headline}"
${subheadline ? `SECONDARY MESSAGE: "${subheadline}"` : ''}

${pointsList ? `ADDITIONAL ELEMENTS:\n${pointsList}` : ''}

DESIGN DIRECTION: Warm, festive atmosphere appropriate to the occasion. Use holiday-specific decorative elements (lanterns for Tet, flowers for 8/3, etc.).`;

    case 'custom':
    default:
      return `PURPOSE: Marketing poster.

MAIN TEXT: "${headline}"
${subheadline ? `SECONDARY TEXT: "${subheadline}"` : ''}

${pointsList ? `KEY MESSAGES:\n${pointsList}` : ''}
${cta ? `CALL TO ACTION: "${cta}"` : ''}`;
  }
}

/**
 * Main function: Generate a professional design prompt from form data
 */
export function generatePosterPrompt(data: PosterFormData): string {
  const { brand, aspect_ratio, style, has_character, character_description, product_description, background_description, extra_instructions, reference_image_desc } = data;
  
  const primaryColor = hexToColorName(brand.primary_color);
  const secondaryColor = hexToColorName(brand.secondary_color);
  const styleInfo = DESIGN_STYLES[style];
  
  const sections: string[] = [];
  
  // Opening
  sections.push(`Create a high-quality Vietnamese marketing poster for "${brand.brand_name}" — a ${brand.industry} company.`);
  sections.push(`FORMAT: ${getAspectDescription(aspect_ratio)}`);
  sections.push('');
  
  // Type-specific content
  sections.push(buildTypeSpecificPrompt(data));
  sections.push('');
  
  // Visual composition
  sections.push('VISUAL COMPOSITION:');
  
  if (product_description) {
    sections.push(`- Product: ${product_description}`);
  }
  
  if (has_character && character_description) {
    sections.push(`- Character/Person: ${character_description}`);
  }
  
  if (background_description) {
    sections.push(`- Background: ${background_description}`);
  }
  
  sections.push('');
  
  // Color & Style
  sections.push(`COLOR PALETTE: Primary ${primaryColor} (${brand.primary_color}), Secondary ${secondaryColor} (${brand.secondary_color}), with white text for readability`);
  sections.push(`DESIGN STYLE: ${styleInfo.label} — ${styleInfo.keywords}`);
  sections.push('');
  
  // Branding
  sections.push(`BRANDING: ${brand.brand_name} logo placement in a visible but non-intrusive position (bottom-right or top-left corner)`);
  
  // Brand default instructions
  if (brand.default_instructions) {
    sections.push(`BRAND SPECIFICS: ${brand.default_instructions}`);
  }
  
  sections.push('');
  
  // Reference
  if (reference_image_desc) {
    sections.push(`REFERENCE: ${reference_image_desc}`);
  }
  
  // Extra
  if (extra_instructions) {
    sections.push(`ADDITIONAL INSTRUCTIONS: ${extra_instructions}`);
  }
  
  // Quality rules
  sections.push('');
  sections.push('CRITICAL REQUIREMENTS:');
  sections.push('- All Vietnamese text must be spelled correctly with proper diacritics');
  sections.push('- Commercial-quality design suitable for professional social media marketing');
  sections.push('- Text must be clearly readable with proper contrast against background');
  sections.push('- Clean layout with proper visual hierarchy (headline > subheadline > details)');
  sections.push('- No watermarks, no stock photo indicators');
  
  return sections.join('\n');
}

/**
 * Generate a refinement prompt (for iterating on existing output)
 */
export function generateRefinementPrompt(originalPrompt: string, feedback: string): string {
  return `Based on the previous poster design, please make these adjustments:

CHANGES REQUESTED:
${feedback}

Keep everything else from the original design the same. Here was the original prompt:
---
${originalPrompt}
---

Apply the requested changes while maintaining the overall design quality and brand consistency.`;
}
