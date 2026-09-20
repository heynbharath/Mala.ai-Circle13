import { HARE_KRISHNA_REGEX, RADHA_NAAM_REGEX } from './mantra-logic';

export type MantraId = 'hare_krishna' | 'radha_naam';

export interface MantraDef {
    id: MantraId;
    name: string;
    subtitle: string;
    /** The words shown on screen while chanting. */
    displayText: string;
    /** Beads per round — the traditional count for both practices here. */
    roundLength: number;
    /** Matches one complete unit of this mantra in a streaming voice buffer. */
    regex: RegExp;
}

export const MANTRAS: Record<MantraId, MantraDef> = {
    hare_krishna: {
        id: 'hare_krishna',
        name: 'Hare Krishna Maha Mantra',
        subtitle: 'The great chant for deliverance',
        displayText: 'Hare Krishna Hare Krishna Krishna Krishna Hare Hare\nHare Rama Hare Rama Rama Rama Hare Hare',
        roundLength: 108,
        regex: HARE_KRISHNA_REGEX,
    },
    radha_naam: {
        id: 'radha_naam',
        name: 'Radha Naam',
        subtitle: 'Calling the name of Radha Rani',
        displayText: 'Radhe Radhe',
        roundLength: 108,
        regex: RADHA_NAAM_REGEX,
    },
};

export const DEFAULT_MANTRA: MantraId = 'hare_krishna';

export const isMantraId = (value: string | null): value is MantraId =>
    value === 'hare_krishna' || value === 'radha_naam';
