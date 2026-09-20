import {
    HARE_KRISHNA_REGEX,
    RADHA_NAAM_REGEX,
    OM_NAMAH_SHIVAYA_REGEX,
    MAHAMRITYUNJAYA_REGEX,
    GAYATRI_REGEX,
    OM_REGEX
} from './mantra-logic';
import type { BeadMaterialType } from './BeadTextures';

export type MantraId =
    | 'hare_krishna'
    | 'radha_naam'
    | 'om_namah_shivaya'
    | 'mahamrityunjaya'
    | 'gayatri'
    | 'om';

export interface MantraDef {
    id: MantraId;
    name: string;
    sanskrit: string;
    subtitle: string;
    translation: string;
    displayText: string;
    roundLength: number;
    recommendedBead: BeadMaterialType;
    glyph: string;
    regex: RegExp;
}

export const MANTRAS: Record<MantraId, MantraDef> = {
    hare_krishna: {
        id: 'hare_krishna',
        name: 'Maha Mantra',
        sanskrit: 'हरे कृष्ण हरे कृष्ण कृष्ण कृष्ण हरे हरे । हरे राम हरे राम राम राम हरे हरे ॥',
        subtitle: 'The Great Chant for Deliverance & Supreme Bliss',
        translation: 'O Divine Energy (Hare), O All-Attractive Lord (Krishna), O Source of All Pleasure (Rama), please engage me in Your devotional service.',
        displayText: 'Hare Krishna Hare Krishna Krishna Krishna Hare Hare\nHare Rama Hare Rama Rama Rama Hare Hare',
        roundLength: 108,
        recommendedBead: 'tulsi',
        glyph: 'हरे कृष्ण',
        regex: HARE_KRISHNA_REGEX,
    },
    radha_naam: {
        id: 'radha_naam',
        name: 'Radha Naam',
        sanskrit: 'राधे राधे श्री राधे',
        subtitle: 'Calling the Supreme Name of Divine Love',
        translation: 'Glory unto Sri Radha Rani, the embodiment of unconditional divine love and grace.',
        displayText: 'Radhe Radhe',
        roundLength: 108,
        recommendedBead: 'tulsi',
        glyph: 'श्री राधे',
        regex: RADHA_NAAM_REGEX,
    },
    om_namah_shivaya: {
        id: 'om_namah_shivaya',
        name: 'Om Namah Shivaya',
        sanskrit: 'ॐ नमः शिवाय',
        subtitle: 'Panchakshari Mantra of Inner Transformation',
        translation: 'I bow with reverence to Shiva, the supreme auspicious consciousness within all beings.',
        displayText: 'Om Namah Shivaya',
        roundLength: 108,
        recommendedBead: 'rudraksha',
        glyph: 'ॐ नमः शिवाय',
        regex: OM_NAMAH_SHIVAYA_REGEX,
    },
    mahamrityunjaya: {
        id: 'mahamrityunjaya',
        name: 'Maha Mrityunjaya',
        sanskrit: 'ॐ त्र्यम्बकं यजामहे सुगन्धिं पुष्टिवर्धनम् । उर्वारुकमिव बन्धनान्मृत्योर्मुक्षीय मामृतात् ॥',
        subtitle: 'The Great Death-Defying Mantra for Healing & Liberation',
        translation: 'We adore the fragrant Three-Eyed Lord who nourishes all life. Free us from mortality as a ripe fruit drops effortlessly from the vine.',
        displayText: 'Om Tryambakam Yajamahe Sugandhim Pushtivardhanam\nUrvarukamiva Bandhanan Mrityor Mukshiya Mamritat',
        roundLength: 108,
        recommendedBead: 'rudraksha',
        glyph: 'ॐ त्र्यम्बकम्',
        regex: MAHAMRITYUNJAYA_REGEX,
    },
    gayatri: {
        id: 'gayatri',
        name: 'Gayatri Mantra',
        sanskrit: 'ॐ भूर्भुवः स्वः तत्सवितुर्वरेण्यं भर्गो देवस्य धीमहि धियो यो नः प्रचोदयात् ॥',
        subtitle: 'The Universal Prayer for Divine Illumination',
        translation: 'We meditate upon the supreme effulgence of the divine solar light. May that luminous presence illuminate our intellect and guide our hearts.',
        displayText: 'Om Bhur Bhuvaḥ Swaḥ Tat Savitur Vareṇyam\nBhargo Devasya Dheemahi Dhiyo Yo Naḥ Prachodayat',
        roundLength: 108,
        recommendedBead: 'sandalwood',
        glyph: 'गायत्री',
        regex: GAYATRI_REGEX,
    },
    om: {
        id: 'om',
        name: 'Cosmic Om (Pranava)',
        sanskrit: 'ॐ',
        subtitle: 'The Primordial Vibration of Pure Creation',
        translation: 'The uncreated, eternal sound in which the cosmos originates, resides, and dissolves.',
        displayText: 'Om • Aum',
        roundLength: 108,
        recommendedBead: 'sphatik',
        glyph: 'ॐ',
        regex: OM_REGEX,
    },
};

export const DEFAULT_MANTRA: MantraId = 'hare_krishna';

export const isMantraId = (value: string | null): value is MantraId =>
    value !== null && value in MANTRAS;
