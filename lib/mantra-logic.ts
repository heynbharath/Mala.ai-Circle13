// Phonetic Intent Detection Logic

const HARE = "(hare|hari|harey|hurry)";
const KRISHNA = "(krishna|krisna|krsna|krushna)";
const RAMA = "(rama|ram|raama)";

// This regex matches the full 16-word sequence regardless of spaces or minor noise
// "Hare Krishna Hare Krishna Krishna Krishna Hare Hare / Hare Rama Hare Rama Rama Rama Hare Hare"
export const MANTRA_REGEX = new RegExp(
    `${HARE}.*?${KRISHNA}.*?${HARE}.*?${KRISHNA}.*?${KRISHNA}.*?${KRISHNA}.*?${HARE}.*?${HARE}.*?` +
    `${HARE}.*?${RAMA}.*?${HARE}.*?${RAMA}.*?${RAMA}.*?${RAMA}.*?${HARE}.*?${HARE}`,
    "gi"
);

/**
 * Validates if the transcript contains the full mantra.
 * Returns true if a match is found.
 */
export const validateChant = (transcript: string): boolean => {
    return MANTRA_REGEX.test(transcript);
};

/**
 * Strips the buffer up to the end of the last match to prevent double counting.
 * Returns the remaining buffer string.
 */
export const cleanBufferAfterMatch = (transcript: string): string => {
    // Determine the last match index
    // RegExp.exec is stateful if global, so allow fresh check
    const regex = new RegExp(MANTRA_REGEX.source, "gi");
    let lastIndex = 0;

    // Find last full match
    while (regex.exec(transcript) !== null) {
        lastIndex = regex.lastIndex;
    }

    if (lastIndex > 0) {
        return transcript.substring(lastIndex);
    }
    return transcript;
};
