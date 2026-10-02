import { VideoClip } from "../types";

export interface ActiveClipInfo {
    activeClip: VideoClip;
    clipIdx: number;
    localT: number;
    clipStartTime: number;
    clipDuration: number;
    progressInClip: number; // 0.0 to 1.0
}

/**
 * Calculates which clip is active at time `t`, factoring in custom clip durations,
 * in-point (`trimStart`), and transitions.
 */
export function getActiveClipAtTime(
    clips: VideoClip[],
    t: number,
    defaultInterval: number = 2.5
): ActiveClipInfo | null {
    if (!clips || clips.length === 0) return null;
    const validT = Math.max(0, isFinite(t) ? t : 0);

    // Calculate cumulative timeline durations
    let accumulated = 0;
    for (let i = 0; i < clips.length; i++) {
        const clip = clips[i];
        const dur = Math.max(0.5, clip.duration || defaultInterval);
        if (validT >= accumulated && validT < accumulated + dur) {
            const timeInClip = validT - accumulated;
            const trimStart = clip.trimStart || 0;
            return {
                activeClip: clip,
                clipIdx: i,
                localT: trimStart + timeInClip,
                clipStartTime: accumulated,
                clipDuration: dur,
                progressInClip: Math.min(1, Math.max(0, timeInClip / dur))
            };
        }
        accumulated += dur;
    }

    // If beyond accumulated duration, cycle or return the last clip
    if (accumulated > 0) {
        const loopedT = validT % accumulated;
        let loopAcc = 0;
        for (let i = 0; i < clips.length; i++) {
            const clip = clips[i];
            const dur = Math.max(0.5, clip.duration || defaultInterval);
            if (loopedT >= loopAcc && loopedT < loopAcc + dur) {
                const timeInClip = loopedT - loopAcc;
                const trimStart = clip.trimStart || 0;
                return {
                    activeClip: clip,
                    clipIdx: i,
                    localT: trimStart + timeInClip,
                    clipStartTime: loopAcc,
                    clipDuration: dur,
                    progressInClip: Math.min(1, Math.max(0, timeInClip / dur))
                };
            }
            loopAcc += dur;
        }
    }

    const first = clips[0];
    return {
        activeClip: first,
        clipIdx: 0,
        localT: first.trimStart || 0,
        clipStartTime: 0,
        clipDuration: defaultInterval,
        progressInClip: 0
    };
}
