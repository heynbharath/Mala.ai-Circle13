// Phonetic Intent Detection Logic — one regex per mantra, tolerant of the
// misheard variants speech recognizers commonly produce.

const HARE = "(hare|hari|harey|hurry)";
const KRISHNA = "(krishna|krisna|krsna|krushna)";
const RAMA = "(rama|ram|raama)";

// The full 16-word Hare Krishna maha-mantra, matched as one block:
// "Hare Krishna Hare Krishna Krishna Krishna Hare Hare
//  Hare Rama Hare Rama Rama Rama Hare Hare"
export const HARE_KRISHNA_REGEX = new RegExp(
    `${HARE}.*?${KRISHNA}.*?${HARE}.*?${KRISHNA}.*?${KRISHNA}.*?${KRISHNA}.*?${HARE}.*?${HARE}.*?` +
    `${HARE}.*?${RAMA}.*?${HARE}.*?${RAMA}.*?${RAMA}.*?${RAMA}.*?${HARE}.*?${HARE}`,
    "gi"
);

// Radha Naam — a single name, repeated. Each occurrence is its own count.
export const RADHA_NAAM_REGEX = /(radhe|radha|radey|radhey|radharani)/gi;

/**
 * Counts how many non-overlapping matches of `regex` appear in `buffer`,
 * starting from the beginning, and returns the unmatched tail so the caller
 * can keep it as the next buffer (preserving a partial word mid-utterance).
 */
export const countMatches = (buffer: string, regex: RegExp): { count: number; remainder: string } => {
    const r = new RegExp(regex.source, regex.flags.includes('g') ? regex.flags : regex.flags + 'g');
    let count = 0;
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = r.exec(buffer)) !== null) {
        count++;
        lastIndex = r.lastIndex;
        if (match.index === r.lastIndex) r.lastIndex++; // guard against zero-length matches
    }

    return { count, remainder: lastIndex > 0 ? buffer.substring(lastIndex) : buffer };
};
