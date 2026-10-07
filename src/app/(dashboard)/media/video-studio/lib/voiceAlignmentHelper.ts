import { SubtitleCue } from "../types";

export interface SpeechSegment {
    start: number; // in seconds
    end: number;   // in seconds
}

/**
 * Phân tích Waveform âm thanh (RMS Energy Envelope) để trích xuất các mốc tiếng nói thật và khoảng lặng
 */
export async function analyzeVoiceSilenceAndSpeech(
    audioUrl: string
): Promise<{ duration: number; segments: SpeechSegment[]; rmsValues: number[] }> {
    const res = await fetch(audioUrl);
    const arrayBuffer = await res.arrayBuffer();

    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    const audioCtx = new AudioContextClass();
    const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
    const channelData = audioBuffer.getChannelData(0);
    const sampleRate = audioBuffer.sampleRate;
    const duration = audioBuffer.duration;

    // Window size: 40ms, hop: 20ms
    const windowSize = Math.floor(sampleRate * 0.04);
    const hopSize = Math.floor(sampleRate * 0.02);
    const numFrames = Math.floor((channelData.length - windowSize) / hopSize);

    const rmsValues: number[] = [];
    let maxRms = 0;

    for (let i = 0; i < numFrames; i++) {
        let sum = 0;
        const offset = i * hopSize;
        for (let j = 0; j < windowSize; j++) {
            const val = channelData[offset + j];
            sum += val * val;
        }
        const rms = Math.sqrt(sum / windowSize);
        rmsValues.push(rms);
        if (rms > maxRms) maxRms = rms;
    }

    // Ngưỡng năng lượng nhận diện tiếng nói thực tế (adaptive speech threshold)
    const silenceThreshold = Math.max(0.006, maxRms * 0.08);

    const isSpeechFrame = rmsValues.map((r) => r > silenceThreshold);
    const segments: SpeechSegment[] = [];
    let inSpeech = false;
    let segStart = 0;

    for (let i = 0; i < isSpeechFrame.length; i++) {
        const timeSec = (i * hopSize) / sampleRate;
        if (isSpeechFrame[i] && !inSpeech) {
            inSpeech = true;
            segStart = timeSec;
        } else if (!isSpeechFrame[i] && inSpeech) {
            // Khoảng lặng tối thiểu 160ms (8 frame x 20ms) mới coi là ngắt câu
            let sustainedSilence = true;
            for (let k = 1; k < 8 && i + k < isSpeechFrame.length; k++) {
                if (isSpeechFrame[i + k]) {
                    sustainedSilence = false;
                    break;
                }
            }
            if (sustainedSilence) {
                inSpeech = false;
                const segEnd = timeSec;
                if (segEnd - segStart >= 0.15) {
                    segments.push({
                        start: Math.max(0, segStart - 0.04),
                        end: Math.min(duration, segEnd + 0.04)
                    });
                }
            }
        }
    }

    if (inSpeech) {
        segments.push({ start: segStart, end: duration });
    }

    try {
        await audioCtx.close();
    } catch (_) {}

    return { duration, segments, rmsValues };
}

function mapSpeechTimeToTimeline(speechT: number, segments: SpeechSegment[]): number {
    let accumulated = 0;
    for (const seg of segments) {
        const segDur = seg.end - seg.start;
        if (accumulated + segDur >= speechT) {
            const remainder = speechT - accumulated;
            return seg.start + remainder;
        }
        accumulated += segDur;
    }
    const lastSeg = segments[segments.length - 1];
    return lastSeg ? lastSeg.end : speechT;
}

/**
 * Căn khớp chữ hiển thị theo khoảng lặng và cao độ giọng đọc thật (Forced Alignment nhẹ)
 * Giúp phụ đề ăn khớp 100% với giọng đọc AI, không bị lệch hoặc trôi chữ.
 */
export async function alignSubtitlesWithVoiceWaveform(
    audioUrl: string,
    scriptText: string,
    speedMultiplier = 1.0,
    offset = 0
): Promise<SubtitleCue[]> {
    if (!scriptText.trim() || !audioUrl) return [];

    try {
        const { duration, segments } = await analyzeVoiceSilenceAndSpeech(audioUrl);
        if (segments.length === 0) {
            segments.push({ start: 0, end: duration });
        }

        const effectiveDuration = duration / (speedMultiplier || 1.0);

        // Tách câu và cụm từ tự nhiên theo dấu câu (khoảng 3-4 từ mỗi cụm)
        const sentences = scriptText.split(/(?<=[.!?,;:\n])\s+/).filter((s) => s.trim().length > 0);
        const phrases: { text: string; words: string[]; charCount: number }[] = [];

        sentences.forEach((s) => {
            const rawWords = s.trim().split(/\s+/).filter(Boolean);
            if (rawWords.length <= 4) {
                phrases.push({
                    text: rawWords.join(" "),
                    words: rawWords,
                    charCount: s.trim().length
                });
            } else {
                for (let i = 0; i < rawWords.length; i += 4) {
                    const chunk = rawWords.slice(i, i + 4);
                    phrases.push({
                        text: chunk.join(" "),
                        words: chunk,
                        charCount: chunk.join(" ").length
                    });
                }
            }
        });

        if (phrases.length === 0) return [];

        const totalSpeechTime = segments.reduce((sum, seg) => sum + (seg.end - seg.start), 0);
        const totalChars = phrases.reduce((sum, p) => sum + p.charCount, 0);

        let currentSpeechTime = 0;
        const cues: SubtitleCue[] = [];

        for (let i = 0; i < phrases.length; i++) {
            const phrase = phrases[i];
            const phraseSpeechDur = (phrase.charCount / Math.max(1, totalChars)) * totalSpeechTime;

            const startSpeechT = currentSpeechTime;
            const endSpeechT = currentSpeechTime + phraseSpeechDur;
            currentSpeechTime = endSpeechT;

            const realStart = mapSpeechTimeToTimeline(startSpeechT, segments) / (speedMultiplier || 1.0) + offset;
            const realEnd = mapSpeechTimeToTimeline(endSpeechT, segments) / (speedMultiplier || 1.0) + offset;

            const cueStart = Math.max(0, realStart);
            const cueEnd = Math.min(effectiveDuration, Math.max(cueStart + 0.2, realEnd));
            const cueDur = cueEnd - cueStart;
            const wordSlice = cueDur / Math.max(1, phrase.words.length);

            const words = phrase.words.map((w, wIdx) => ({
                word: w,
                start: cueStart + wIdx * wordSlice,
                end: cueStart + (wIdx + 1) * wordSlice
            }));

            cues.push({
                start: cueStart,
                end: cueEnd,
                text: phrase.text,
                words
            });
        }

        return cues;
    } catch (err) {
        console.warn("[VoiceAlignment] Khong the phan tich waveform, fallback ve uoc luong:", err);
        return [];
    }
}
