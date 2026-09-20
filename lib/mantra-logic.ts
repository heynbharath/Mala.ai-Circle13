// Phonetic Intent Detection Logic — one regex per mantra, tolerant of the
// misheard variants speech recognizers commonly produce.

const HARE = "(hare|hari|harey|hurry)";
const KRISHNA = "(krishna|krisna|krsna|krushna)";
const RAMA = "(rama|ram|raama)";

// The full 16-word Hare Krishna maha-mantra, matched as one block:
export const HARE_KRISHNA_REGEX = new RegExp(
    `${HARE}.*?${KRISHNA}.*?${HARE}.*?${KRISHNA}.*?${KRISHNA}.*?${KRISHNA}.*?${HARE}.*?${HARE}.*?` +
    `${HARE}.*?${RAMA}.*?${HARE}.*?${RAMA}.*?${RAMA}.*?${RAMA}.*?${HARE}.*?${HARE}`,
    "gi"
);

// Radha Naam — a single name, repeated.
export const RADHA_NAAM_REGEX = /(radhe|radha|radey|radhey|radharani)/gi;

// Shiva Panchakshari Mantra: Om Namah Shivaya
export const OM_NAMAH_SHIVAYA_REGEX = /(om\s*namah?\s*shiva?ya?|namah?\s*shiva?ya?|shiva\s*shiva)/gi;

// Maha Mrityunjaya Mantra
export const MAHAMRITYUNJAYA_REGEX = /(tryambakam|mrityunjay|sugandhim|pushti\s*vardhanam)/gi;

// Gayatri Mantra
export const GAYATRI_REGEX = /(bhur\s*bhuva|tat\s*savitur|bhargo\s*devasya|dhiyo\s*yo\s*nah)/gi;

// Primordial Sound: Om / Aum
export const OM_REGEX = /\b(om|aum|ohm)\b/gi;

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
