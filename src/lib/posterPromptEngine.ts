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

export type TextStyle = '3d_pop' | 'neon_glow' | 'metallic' | 'ribbon_banner' | 'flat_bold' | 'elegant';

export interface BrandProfile {
  id: string;
  brand_name: string;
  logo_url?: string;
  logo_image?: string;         // base64 thumbnail of logo
  product_images?: string[];   // base64 thumbnails of products (max 3)
  primary_color: string;
  secondary_color: string;
  detected_colors?: string[];  // additional colors detected from logo
  industry: string;
  style_keywords: string;
  font_suggestion?: string;    // AI-suggested font style
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
  text_style: TextStyle;
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

export const TEXT_STYLES: Record<TextStyle, { label: string; desc: string; prompt: string }> = {
  '3d_pop': {
    label: '3D nổi',
    desc: 'Chữ 3D nổi khối, bóng đổ sâu — như JD, Tmall',
    prompt: `MANDATORY 3D EXTRUDED TEXT EFFECT for the headline:
- The headline text MUST be rendered as thick 3D extruded block letters with visible depth/thickness on the sides and bottom edges
- Apply a color gradient on the front face (e.g. from bright to slightly darker shade of the brand primary color)
- The extrusion/depth sides should be a darker shade, creating a strong 3D pop-out effect
- Add a soft drop shadow beneath the 3D text to ground it in the scene
- The text should appear to physically jump out of the poster, like signage or a storefront header
- Reference style: Chinese e-commerce promotional posters (JD.com 京东, Tmall 天猫) where headlines are large 3D block text`,
  },
  neon_glow: {
    label: 'Neon phát sáng',
    desc: 'Chữ phát sáng neon, hiệu ứng đèn LED',
    prompt: `NEON GLOW TEXT EFFECT for the headline:
- Render headline as glowing neon-tube-style letters
- Add bright outer glow and subtle inner glow matching the brand color
- Include light bloom/halo effect around each letter
- Text should look like illuminated LED signage at night
- Subtle light reflection on nearby surfaces`,
  },
  metallic: {
    label: 'Metallic / Vàng',
    desc: 'Chữ ánh kim, vàng gold, bạc',
    prompt: `METALLIC/GOLD TEXT EFFECT for the headline:
- Render headline with glossy metallic gold or chrome finish
- Include specular highlights and reflections on letter surfaces
- Add subtle emboss/bevel effect creating depth
- Gold gradient from warm yellow to deeper amber
- Light sparkle/glint effects on key letter edges`,
  },
  ribbon_banner: {
    label: 'Banner / Ribbon',
    desc: 'Chữ trên nền ribbon, banner trang trí',
    prompt: `DECORATIVE BANNER/RIBBON TEXT TREATMENT for the headline:
- Place the headline text INSIDE a decorative banner/ribbon shape
- The banner should have folded edges and 3D depth, looking like a physical ribbon
- Banner color should use the brand primary color with a gradient
- Text on the banner should be white or contrasting, bold, and clearly readable
- Add subtle shadow behind the banner to give it dimension
- Subheadline can use a smaller matching ribbon or badge shape`,
  },
  flat_bold: {
    label: 'Flat Bold',
    desc: 'Phẳng nhưng đậm, viền outline',
    prompt: `BOLD FLAT TEXT WITH STRONG OUTLINE for the headline:
- Use extra-bold/black weight typography
- Add a thick contrasting outline/stroke around each letter (white outline on dark text or vice versa)
- Include a subtle drop shadow for depth
- Text should be large, filling a significant portion of the poster width
- Clean and impactful, easy to read at a glance`,
  },
  elegant: {
    label: 'Thanh lịch',
    desc: 'Script font, thanh lịch, mỏng',
    prompt: `ELEGANT TYPOGRAPHY for the headline:
- Use a combination of serif/script fonts for an upscale feel
- Thin elegant strokes with subtle serif details
- Add delicate ornamental elements (thin lines, small flourishes)
- Generous letter spacing for sophistication
- Subtle gold or metallic accent on key words`,
  },
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

HEADLINE (MUST be the largest, most visually dominant element — treated as a design centerpiece, not just text): "${headline}"
${subheadline ? `SUBHEADLINE (smaller but still stylized, placed below headline): "${subheadline}"` : ''}
${product_name ? `FEATURED PRODUCT: ${product_name}` : ''}

${pointsList ? `KEY SELLING POINTS (each displayed inside its own decorative badge, rounded rectangle, or ribbon element with icon):\n${pointsList}` : ''}
${cta ? `CALL TO ACTION (inside a prominent button-shaped banner at bottom): "${cta}"` : ''}

DESIGN DIRECTION: Create urgency and excitement. Product should be prominently displayed with dynamic floating/flying effect. Selling point badges should be arranged in a row or grid. Overall composition should feel like a premium e-commerce promotional poster.`;

    case 'product_launch':
      return `PURPOSE: New product launch/introduction poster.

HEADLINE (large, dominant, treated as hero text with visual effects): "${headline}"
${subheadline ? `SUBHEADLINE (stylized, complementary to headline): "${subheadline}"` : ''}
${product_name ? `PRODUCT: ${product_name} — make it the hero element, large and centered with dramatic lighting` : ''}

${pointsList ? `UNIQUE SELLING POINTS (display as elegant labeled badges):\n${pointsList}` : ''}
${cta ? `CALL TO ACTION (inside a prominent styled button/banner): "${cta}"` : ''}

DESIGN DIRECTION: Focus on product beauty shot. Premium commercial feel. Product should look appetizing and high-quality with spotlight, glow, or radial light burst behind it.`;

    case 'minigame':
      return `PURPOSE: Facebook MiniGame/Interactive post.

GAME TITLE (large, 3D extruded block text with playful colors and thick outline — this is the focal point): "${headline}"
${subheadline ? `GAME DESCRIPTION (fun styled subtitle): "${subheadline}"` : ''}

${pointsList ? `GAME DETAILS (display as fun callout bubbles or game-UI style panels):\n${pointsList}` : ''}
${cta ? `CALL TO ACTION (bright button style with arrow): "${cta}"` : ''}

DESIGN DIRECTION: Fun, engaging, game-like design. Use playful elements like stars, confetti, gift boxes, arrows. Title text MUST look like a game logo — chunky, colorful, with depth. Overall feel: mobile game promotional art quality.`;

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
  if (brand.detected_colors?.length) {
    sections.push(`ACCENT COLORS: ${brand.detected_colors.map(c => `${hexToColorName(c)} (${c})`).join(', ')} — use sparingly for decorative elements, badges, or highlights`);
  }
  sections.push(`DESIGN STYLE: ${styleInfo.label} — ${styleInfo.keywords}`);
  if (brand.font_suggestion) {
    sections.push(`RECOMMENDED FONT STYLE: ${brand.font_suggestion} — apply this to the headline and key text elements`);
  }
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
  
  // Typography section — the most important upgrade
  const textStyleInfo = TEXT_STYLES[data.text_style || '3d_pop'];
  sections.push('');
  sections.push('=== TYPOGRAPHY & TEXT DESIGN (CRITICAL — THIS IS THE MOST IMPORTANT SECTION) ===');
  sections.push('');
  sections.push(textStyleInfo.prompt);
  sections.push('');
  sections.push(`TEXT HIERARCHY AND COMPOSITION RULES:`);
  sections.push(`- The HEADLINE is THE most important visual element of the entire poster — it should occupy 20-30% of the poster area`);
  sections.push(`- Headline text must NOT look like plain typed text — it must be DESIGNED with effects (3D, glow, metallic, etc.)`);
  sections.push(`- Subheadline should complement the headline style but be smaller and less dramatic`);
  sections.push(`- Selling points / benefits should each be inside decorative shapes (rounded rectangles, badges, ribbons, or shield icons)`);
  sections.push(`- CTA text should be inside a prominent button-like shape at the bottom`);
  sections.push(`- NEVER render text as plain flat single-color text — every text element needs visual treatment`);
  sections.push(`- Use proper Vietnamese font rendering — no broken diacritics`);
  sections.push('');
  
  // Quality rules
  sections.push('CRITICAL REQUIREMENTS:');
  sections.push('- HEADLINE must appear EXACTLY ONCE on the poster — NEVER duplicate or repeat the headline text in any other location');
  sections.push(`- BRAND LOGO "${brand.brand_name}" must appear in EXACTLY 1 corner — do NOT put the brand name on products, boxes, containers, or decorations`);
  sections.push('- ALL selling point badges MUST use the SAME consistent visual style — same shape, same color scheme, same size. Do NOT mix ribbons with seals with circles. Pick ONE badge style and apply it to ALL selling points.');
  sections.push('- Do NOT add ANY text that is not explicitly listed in this prompt — no extra labels, annotations, floating descriptive words, or placeholder text');
  sections.push('- All Vietnamese text must be spelled correctly with proper diacritics (ă, â, đ, ê, ô, ơ, ư and all tone marks)');
  sections.push('- PREMIUM commercial-quality design — must look like it was made by a professional design agency, not a template');
  sections.push('- Text must be clearly readable with proper contrast, but also visually impressive');
  sections.push('- Overall design should match the quality level of e-commerce promotional posters from JD.com, Tmall, Shopee');
  sections.push('- No watermarks, no stock photo indicators, no placeholder text');
  sections.push('- The final output should look like a poster you would see on a professional brand\'s official Facebook page');
  sections.push('');
  
  // Text inventory — explicit list of allowed text
  const allowedTexts: string[] = [`Headline: "${data.headline}"`];
  if (data.subheadline) allowedTexts.push(`Subheadline: "${data.subheadline}"`);
  if (data.selling_points?.filter(p => p.trim()).length) {
    allowedTexts.push(`Selling points: ${data.selling_points.filter(p => p.trim()).map(p => `"${p}"`).join(', ')}`);
  }
  if (data.cta) allowedTexts.push(`CTA: "${data.cta}"`);
  allowedTexts.push(`Brand logo: "${brand.brand_name}"`);
  
  sections.push('TEXT INVENTORY — The poster must contain ONLY these text elements:');
  allowedTexts.forEach(t => sections.push(`  • ${t}`));
  sections.push('⛔ Any text NOT in this list is FORBIDDEN. Do not invent, add, or hallucinate extra text.');
  
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

/**
 * Generate a "design by reference" prompt — replicate a reference image's style
 * with the user's own content. The reference image is uploaded separately in AI Studio.
 */
export interface ReferenceFormData {
  brand: BrandProfile;
  aspect_ratio: AspectRatio;
  headline: string;
  subheadline?: string;
  product_name?: string;
  selling_points?: string[];
  cta?: string;
  product_description?: string;
  has_character: boolean;
  character_description?: string;
  reference_notes?: string;  // What the user likes about the reference
  extra_instructions?: string;
}

export function generateReferencePrompt(data: ReferenceFormData): string {
  const { brand, aspect_ratio, headline, subheadline, product_name, selling_points, cta, product_description, has_character, character_description, reference_notes, extra_instructions } = data;
  
  const primaryColor = hexToColorName(brand.primary_color);
  const secondaryColor = hexToColorName(brand.secondary_color);
  const pointsList = selling_points?.filter(p => p.trim()).map(p => `  - "${p}"`).join('\n') || '';
  
  const sections: string[] = [];
  
  // Reference instruction — REDESIGNED to prevent literal copying
  sections.push(`=== DESIGN BY REFERENCE — STYLE ONLY ===`);
  sections.push(`Look at the ATTACHED IMAGE as a DESIGN STYLE REFERENCE.`);
  sections.push('');
  sections.push(`COPY THESE DESIGN TECHNIQUES from the reference:`);
  sections.push(`✅ Typography technique — how the headline text is styled (3D depth, gradients, outlines, shadows, metallic effects, etc.)`);
  sections.push(`✅ Layout structure — general arrangement: where headline sits, where products are placed, where badges go`);
  sections.push(`✅ Quality level — same level of polish, detail, and professionalism`);
  sections.push(`✅ How selling points are presented — badge shapes, ribbon styles, icon usage`);
  sections.push(`✅ How the CTA button/banner looks`);
  sections.push(`✅ Product display technique — how products are arranged and lit`);
  sections.push('');
  sections.push(`🚫 DO NOT COPY these specific elements from the reference:`);
  sections.push(`❌ DO NOT copy any mascots, cartoon characters, or animals from the reference — they belong to another brand`);
  sections.push(`❌ DO NOT copy the reference's brand name, logo, or any text from the reference image`);
  sections.push(`❌ DO NOT copy holiday-specific decorations (lanterns, red envelopes, lucky charms, fireworks) UNLESS the user's content is about that same holiday`);
  sections.push(`❌ DO NOT copy the reference's color scheme literally — ADAPT to the brand colors specified below`);
  sections.push(`❌ DO NOT copy specific decorative objects that are unique to the reference's theme`);
  sections.push('');
  
  if (reference_notes) {
    sections.push(`USER NOTES ABOUT THE REFERENCE: ${reference_notes}`);
    sections.push('');
  }
  
  sections.push(`=== NEW CONTENT (replace EVERYTHING from the reference with this) ===`);
  sections.push('');
  
  // Brand
  sections.push(`BRAND: "${brand.brand_name}" — ${brand.industry}`);
  sections.push(`COLOR SCHEME: Use ${primaryColor} (${brand.primary_color}) as primary and ${secondaryColor} (${brand.secondary_color}) as secondary. Adapt background and decorative colors to match these brand colors instead of the reference's colors.`);
  if (brand.detected_colors?.length) {
    sections.push(`ACCENT COLORS: ${brand.detected_colors.map(c => `${hexToColorName(c)} (${c})`).join(', ')} — use for decorative accents`);
  }
  if (brand.font_suggestion) {
    sections.push(`RECOMMENDED FONT STYLE: ${brand.font_suggestion}`);
  }
  if (brand.default_instructions) {
    sections.push(`BRAND DETAILS: ${brand.default_instructions}`);
  }
  sections.push(`FORMAT: ${getAspectDescription(aspect_ratio)}`);
  sections.push('');
  
  // Content
  sections.push(`HEADLINE (apply the reference's text styling technique to this text): "${headline}"`);
  if (subheadline) sections.push(`SUBHEADLINE: "${subheadline}"`);
  if (product_name) sections.push(`FEATURED PRODUCT: ${product_name}`);
  if (pointsList) sections.push(`SELLING POINTS (each in a decorative badge/ribbon, same style as reference):\n${pointsList}`);
  if (cta) sections.push(`CTA (in a button/banner shape at the bottom): "${cta}"`);
  sections.push('');
  
  // Visual elements
  if (product_description) {
    sections.push(`PRODUCT VISUAL: ${product_description}`);
  }
  
  // Character — EXPLICIT about what kind
  if (has_character && character_description) {
    sections.push(`CHARACTER: ${character_description}`);
    sections.push(`⚠️ The character MUST be a realistic photographic-style human (NOT a 3D cartoon, NOT an animated character, NOT a mascot). Real person, professional photo quality.`);
  } else if (!has_character) {
    sections.push(`CHARACTER: No human character or mascot in this poster. Do NOT add any characters or mascots from the reference.`);
  }
  sections.push('');
  
  // Branding — STRICT LIMIT
  sections.push(`LOGO: Place the "${brand.brand_name}" logo in EXACTLY 1 location — bottom-right corner. Do NOT repeat the logo or brand name elsewhere on the poster. Do NOT put the brand name on boxes, products, or decorative elements.`);
  sections.push('');
  
  // Extra
  if (extra_instructions) {
    sections.push(`ADDITIONAL INSTRUCTIONS: ${extra_instructions}`);
    sections.push('');
  }
  
  // Auto-detect poster purpose for better context
  const hasPromotionalSP = selling_points?.some(p => 
    /sale|giảm|free|tặng|khuyến|ưu đãi|mua/i.test(p)
  );
  if (hasPromotionalSP) {
    sections.push('POSTER PURPOSE: This is a PROMOTIONAL/SALE poster — design should convey urgency and excitement.');
    sections.push('');
  }
  
  // Quality + Anti-copy rules
  sections.push('=== FINAL RULES ===');
  sections.push('');
  sections.push('STRICT ELEMENT COUNT RULES (violations will ruin the design):');
  sections.push(`1. HEADLINE TEXT "${headline}": Must appear EXACTLY ONCE on the poster. Do NOT duplicate, repeat, or echo the headline anywhere else.`);
  sections.push(`2. BRAND LOGO "${brand.brand_name}": Must appear in EXACTLY 1 position (bottom-right corner). Do NOT show the brand name or logo on any product boxes, containers, decorative elements, or other areas.`);
  sections.push('3. SELLING POINT BADGES: Must ALL use the SAME visual style — same shape, same color scheme, same size. Do NOT mix different badge types (e.g. ribbon + seal + circle). Pick ONE consistent badge design and apply it to ALL selling points.');
  sections.push('');
  
  // Text inventory for reference mode
  const refAllowedTexts: string[] = [`Headline: "${headline}"`];
  if (subheadline) refAllowedTexts.push(`Subheadline: "${subheadline}"`);
  if (selling_points?.filter(p => p.trim()).length) {
    refAllowedTexts.push(`Selling points: ${selling_points.filter(p => p.trim()).map(p => `"${p}"`).join(', ')}`);
  }
  if (cta) refAllowedTexts.push(`CTA: "${cta}"`);
  refAllowedTexts.push(`Brand logo: "${brand.brand_name}"`);
  
  sections.push('4. TEXT INVENTORY — The poster must contain ONLY these text elements and NOTHING ELSE:');
  refAllowedTexts.forEach(t => sections.push(`   • ${t}`));
  sections.push('   ⛔ Do NOT add ANY other text, labels, descriptions, annotations, floating words, or placeholder text (no "tags", no product flavor descriptions, no extra decorative text).');
  sections.push('');
  sections.push('BACKGROUND RULE: Use a clean, simple gradient background (e.g. teal-to-dark-teal, or brand-color gradient). Do NOT create a 3D room, store interior, shelf display, or elaborate scene. Keep the background SIMPLE and let the products and text be the focus.');
  sections.push('');
  sections.push('GENERAL QUALITY RULES:');
  sections.push('- The poster is for a REGULAR promotional sale, NOT a holiday/festival — do NOT add holiday decorations unless specifically requested');
  sections.push('- All Vietnamese text must be spelled correctly with proper diacritics (ă, â, đ, ê, ô, ơ, ư and all tone marks)');
  sections.push('- Match the QUALITY and POLISH of the reference, not its specific content');
  sections.push('- The final output should look like it was designed by the SAME designer who made the reference, but for a COMPLETELY DIFFERENT brand and campaign');
  
  return sections.join('\n');
}
