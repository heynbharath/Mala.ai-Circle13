"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import { db } from '@/lib/db';
import { validateChant, cleanBufferAfterMatch } from '@/lib/mantra-logic';
import { triggerHapticFeedback, triggerMalaCompletion } from '@/lib/haptics';
import { SpatialAudio } from '@/lib/SpatialAudio';

// Minimal Web Speech API surface — not part of the standard TS lib.dom types.
interface SpeechRecognitionResultLike {
    isFinal: boolean;
    [index: number]: { transcript: string };
}
interface SpeechRecognitionEventLike {
    resultIndex: number;
    results: { length: number; [index: number]: SpeechRecognitionResultLike };
}
interface SpeechRecognitionErrorEventLike {
    error: string;
}
interface SpeechRecognitionLike {
    continuous: boolean;
    interimResults: boolean;
    lang: string;
    start: () => void;
    stop: () => void;
    onresult: ((event: SpeechRecognitionEventLike) => void) | null;
    onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null;
    onend: (() => void) | null;
}
type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;
interface IWindow extends Window {
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
    SpeechRecognition?: SpeechRecognitionConstructor;
}

export type VoiceStatus = 'idle' | 'listening' | 'unsupported' | 'denied' | 'error';

export const useMantraEngine = () => {
    // Persisted State (Lazy Init from localStorage for speed, Dexie for logs)
    const [count, setCount] = useState(() => {
        if (typeof window !== 'undefined') return parseInt(localStorage.getItem('nitya_count') || '0');
        return 0;
    });
    const [round, setRound] = useState(() => {
        if (typeof window !== 'undefined') return parseInt(localStorage.getItem('nitya_round') || '0');
        return 0;
    });
    const [lifetimeCount, setLifetimeCount] = useState(() => {
        if (typeof window !== 'undefined') return parseInt(localStorage.getItem('nitya_lifetime') || '0');
        return 0;
    });

    const [voiceStatus, setVoiceStatus] = useState<VoiceStatus>('idle');
    const isListening = voiceStatus === 'listening';
    const isListeningRef = useRef(false);
    const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
    const transcriptBuffer = useRef("");

    // --- Persistence Sync ---
    useEffect(() => {
        localStorage.setItem('nitya_count', count.toString());
        localStorage.setItem('nitya_round', round.toString());
        localStorage.setItem('nitya_lifetime', lifetimeCount.toString());
    }, [count, round, lifetimeCount]);

    // --- Core Increment Logic ---
    const increment = useCallback((source: 'voice' | 'touch' | 'keyboard') => {
        const now = Date.now();

        setCount(prev => {
            const newCount = prev + 1;

            if (newCount === 1) SpatialAudio.startAmbience();

            if (newCount % 108 === 0) {
                triggerMalaCompletion();
                SpatialAudio.playBell('deep');
                setRound(r => r + 1);

                db.milestones.add({
                    date: new Date().toISOString().split('T')[0],
                    total_count: newCount
                });

                return 0;
            } else if (newCount % 27 === 0) {
                SpatialAudio.playBell('medium');
                triggerHapticFeedback('medium');
                return newCount;
            } else {
                triggerHapticFeedback('soft');
                return newCount;
            }
        });

        setLifetimeCount(prev => prev + 1);

        // Log Session to Dexie (Fire & Forget)
        db.sessions.add({
            timestamp: now,
            count: 1,
            duration: 0,
            type: source
        });
    }, []);

    // --- Voice Engine (Regex Stream) ---
    const handleVoiceInput = useCallback((text: string) => {
        transcriptBuffer.current += " " + text;
        const buffer = transcriptBuffer.current;

        if (validateChant(buffer)) {
            increment('voice');
            transcriptBuffer.current = cleanBufferAfterMatch(buffer);

            if (typeof navigator !== 'undefined' && navigator.vibrate) {
                navigator.vibrate([10, 30, 10, 30, 50]);
            }
        }

        if (transcriptBuffer.current.length > 500) {
            transcriptBuffer.current = transcriptBuffer.current.slice(-200);
        }
    }, [increment]);

    const stopListening = useCallback(() => {
        isListeningRef.current = false;
        if (recognitionRef.current) {
            recognitionRef.current.stop();
            recognitionRef.current = null;
        }
        setVoiceStatus('idle');
    }, []);

    const startListening = useCallback(() => {
        if (typeof window === 'undefined') return;
        const { webkitSpeechRecognition, SpeechRecognition } = window as unknown as IWindow;
        const Recognition = SpeechRecognition || webkitSpeechRecognition;

        if (!Recognition) {
            setVoiceStatus('unsupported');
            return;
        }

        const recognition = new Recognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onresult = (event: SpeechRecognitionEventLike) => {
            for (let i = event.resultIndex; i < event.results.length; ++i) {
                if (event.results[i].isFinal) {
                    handleVoiceInput(event.results[i][0].transcript);
                }
            }
        };

        recognition.onerror = (event: SpeechRecognitionErrorEventLike) => {
            if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
                isListeningRef.current = false;
                setVoiceStatus('denied');
            }
        };

        // Some browsers stop the stream periodically even in continuous mode.
        // Restart automatically as long as the user hasn't turned voice mode off.
        recognition.onend = () => {
            if (isListeningRef.current) {
                try {
                    recognition.start();
                } catch {
                    // Already started or transient error; ignore.
                }
            }
        };

        recognitionRef.current = recognition;
        isListeningRef.current = true;
        try {
            recognition.start();
            setVoiceStatus('listening');
        } catch {
            setVoiceStatus('error');
        }
    }, [handleVoiceInput]);

    const toggleMode = useCallback(() => {
        if (isListeningRef.current) stopListening();
        else startListening();
    }, [startListening, stopListening]);

    // --- Keyboard Engine (Spacebar) — desktop convenience only ---
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.code === 'Space' && !(e.target as HTMLElement)?.closest('input, textarea, button')) {
                e.preventDefault();
                increment('keyboard');
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [increment]);

    useEffect(() => () => stopListening(), [stopListening]);

    return {
        count,
        round,
        lifetimeCount,
        isListening,
        voiceStatus,
        toggleMode,
        increment: () => increment('touch') // Exposed manual trigger for tap/drag
    };
};
