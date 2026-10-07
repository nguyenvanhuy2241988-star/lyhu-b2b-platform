import { VideoClip } from "../types";

export interface ActiveClipInfo {
    activeClip: VideoClip;
    clipIdx: number;
    localT: number;
    clipStartTime: number;
    clipDuration: number;
    progressInClip: number; // 0.0 to 1.0
}

/** Seconds a clip stays on the timeline. `duration` is the SOURCE length and must never drive pacing. */
export function getClipDisplayDuration(clip: VideoClip, defaultInterval: number = 2.5): number {
    const d = clip.displayDuration;
    if (typeof d === "number" && isFinite(d) && d > 0) return Math.max(0.5, d);
    return Math.max(1.5, defaultInterval || 2.5);
}

/** Total timeline length contributed by all clips (one pass, no looping). */
export function getTimelineLength(clips: VideoClip[], defaultInterval: number = 2.5): number {
    return clips.reduce((sum, c) => sum + getClipDisplayDuration(c, defaultInterval), 0);
}

function buildInfo(clips: VideoClip[], idx: number, start: number, dur: number, timeInClip: number): ActiveClipInfo {
    const clip = clips[idx];
    const trimStart = clip.trimStart || 0;
    let localT = trimStart + timeInClip;
    // Keep the playhead inside the source video: loop the usable part instead of freezing on the last frame
    if (clip.mediaType !== "image" && clip.duration > 0) {
        const usable = Math.max(0.5, clip.duration - trimStart);
        localT = trimStart + (timeInClip % usable);
    }
    return {
        activeClip: clip,
        clipIdx: idx,
        localT,
        clipStartTime: start,
        clipDuration: dur,
        progressInClip: Math.min(1, Math.max(0, timeInClip / dur))
    };
}

/**
 * Which clip is active at time `t`. Clips occupy their DISPLAY duration (pacing), the timeline
 * cycles when voice is longer than the sum of clips.
 */
export function getActiveClipAtTime(
    clips: VideoClip[],
    t: number,
    defaultInterval: number = 2.5
): ActiveClipInfo | null {
    if (!clips || clips.length === 0) return null;
    const validT = Math.max(0, isFinite(t) ? t : 0);
    const total = getTimelineLength(clips, defaultInterval);
    const loopedT = total > 0 ? validT % total : 0;

    let acc = 0;
    for (let i = 0; i < clips.length; i++) {
        const dur = getClipDisplayDuration(clips[i], defaultInterval);
        if (loopedT >= acc && loopedT < acc + dur) {
            return buildInfo(clips, i, acc, dur, loopedT - acc);
        }
        acc += dur;
    }
    return buildInfo(clips, 0, 0, getClipDisplayDuration(clips[0], defaultInterval), 0);
}
