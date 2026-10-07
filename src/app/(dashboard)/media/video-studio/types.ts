export interface VideoClip {
    id: string;
    file?: File;
    url: string;
    name: string;
    duration: number; // in seconds
    width: number;
    height: number;
    muted: boolean;
    mediaType?: "video" | "image";
    trimStart?: number; // in-point in seconds for raw video
    trimEnd?: number;   // out-point in seconds
    displayDuration?: number; // seconds this clip stays on the timeline (falls back to pacing interval). `duration` is always the SOURCE length.
    role?: string;      // e.g. "Hook 3s đầu", "Chứng minh chất lượng", "CTA"
    matchedSentence?: string; // Dialogue sentence this clip illustrates
    isAiSelected?: boolean;   // Whether AI curated this scene for timeline
}

export interface SubtitleCue {
    start: number; // seconds
    end: number;   // seconds
    text: string;
    words?: {
        word: string;
        start: number;
        end: number;
    }[];
}

export interface LyhuTemplate {
    id: string;
    badge: string;
    title: string;
    hookTitle: string;
    script: string;
    pacing: number;
    transition: "auto" | "crossfade" | "slide_left" | "white_flash" | "hard_cut";
    bgm: string;
    textColor: string;
    subtitleStyle: "tiktok_stroke" | "neon_glow" | "pill_dark" | "clean_shadow";
}

export interface TikTokTrendingSound {
    id: string;
    title: string;
    author: string;
    tag: string;
    url: string;
    duration: string;
    useCase: string;
    isHot?: boolean;
}

export interface BgmPreset {
    id: string;
    name: string;
    url: string;
}

export interface BRollItem {
    id: string;
    name: string;
    url: string;
    tag: string;
    duration: number;
    width: number;
    height: number;
}

export type StudioStep = "step_script" | "step_clips" | "step_visuals" | "step_audio_export" | "copilot";

export interface CopilotMessage {
    id: string;
    role: "user" | "ai";
    content: string;
    actionsApplied?: string[];
    timestamp: number;
}

export interface ViralityScore {
    overall: number;
    hook: number;
    pacing: number;
    conversion: number;
    estimatedViews: string;
    insights: string[];
}
