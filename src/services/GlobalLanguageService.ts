export interface GlobalLanguageConfig {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
  defaultPhrase: string;
  sampleSpoken: string;
  targetPhonemes: string[];
  ipaPhonemes: string[];
  icfCode: string; // WHO ICF classification code
}

export const GLOBAL_LANGUAGES: GlobalLanguageConfig[] = [
  {
    code: 'en-US',
    name: 'English (US / Global)',
    nativeName: 'English',
    flag: '🌐',
    defaultPhrase: 'The red rabbit runs through the green grass',
    sampleSpoken: 'The ... wed wabbit wuns ... thwoo the gween gwaass',
    targetPhonemes: ['/r/', '/θ/', '/gr/'],
    ipaPhonemes: ['[ɹʷ]', '[θ]', '[ɡɹ]'],
    icfCode: 'ICF b320: Articulation Functions'
  },
  {
    code: 'es-ES',
    name: 'Spanish (Español)',
    nativeName: 'Español',
    flag: '🇪🇸',
    defaultPhrase: 'El rápido perro corre por el campo verde',
    sampleSpoken: 'El ... wápido pewo cowe ... pow el campo vewde',
    targetPhonemes: ['/rr/ (Alveolar Trill)', '/r/ (Tap)', '/k/'],
    ipaPhonemes: ['[r]', '[ɾ]', '[k]'],
    icfCode: 'ICF b330: Fluency and Rhythm of Speech'
  },
  {
    code: 'hi-IN',
    name: 'Hindi (हिन्दी)',
    nativeName: 'हिन्दी',
    flag: '🇮🇳',
    defaultPhrase: 'लाल खरगोश हरी घास पर तेजी से दौड़ता है',
    sampleSpoken: 'लाल ... खलगोश हली घास ... दौड़ता है',
    targetPhonemes: ['/kh/ (Aspirated)', '/r/ (Retroflex flap)', '/gh/'],
    ipaPhonemes: ['[kʰ]', '[ɽ]', '[ɡʱ]'],
    icfCode: 'ICF b310: Voice and Resonation'
  },
  {
    code: 'zh-CN',
    name: 'Mandarin (普通话)',
    nativeName: '中文',
    flag: '🇨🇳',
    defaultPhrase: '红色的兔子在绿色的草地上奔跑',
    sampleSpoken: '红色的 ... 兔子在 ... 绿色的草地上 ... 奔跑',
    targetPhonemes: ['/r/ (Retroflex Approximant)', '/zh/', '/ch/'],
    ipaPhonemes: ['[ʐ]', '[ʈʂ]', '[ʈʂʰ]'],
    icfCode: 'ICF b320.2: Moderate Articulation Deficit'
  },
  {
    code: 'fr-FR',
    name: 'French (Français)',
    nativeName: 'Français',
    flag: '🇫🇷',
    defaultPhrase: 'Le rapide renard roux traverse la prairie verte',
    sampleSpoken: 'Le ... wapide wenard woux ... twaverse la pwaiwie',
    targetPhonemes: ['/ʁ/ (Uvular Fricative)', '/tr/', '/v/'],
    ipaPhonemes: ['[ʁ]', '[tʁ]', '[v]'],
    icfCode: 'ICF b330.1: Mild Rhythm Instability'
  },
  {
    code: 'de-DE',
    name: 'German (Deutsch)',
    nativeName: 'Deutsch',
    flag: '🇩🇪',
    defaultPhrase: 'Der rote Frosch springt über das grüne Moos',
    sampleSpoken: 'Der ... wote Fwosch spwingt ... übew das gwüne',
    targetPhonemes: ['/ʁ/', '/ʃp/ (Consonant Cluster)', '/pf/'],
    ipaPhonemes: ['[ʁ]', '[ʃp]', '[p͡f]'],
    icfCode: 'ICF b320: Motor Coordination'
  },
  {
    code: 'ar-SA',
    name: 'Arabic (العربية)',
    nativeName: 'العربية',
    flag: '🇸🇦',
    defaultPhrase: 'الأرنب السريع يركض في الحقل الأخضر',
    sampleSpoken: 'الألنب ... السليع يلكض ... في الحقل الأخضل',
    targetPhonemes: ['/r/ (Trill)', '/q/ (Uvular)', '/ħ/ (Pharyngeal)'],
    ipaPhonemes: ['[r]', '[q]', '[ħ]'],
    icfCode: 'ICF b310.2: Pharyngeal Coordination'
  },
  {
    code: 'ja-JP',
    name: 'Japanese (日本語)',
    nativeName: '日本語',
    flag: '🇯🇵',
    defaultPhrase: '赤いウサギが緑の草原を速く走る',
    sampleSpoken: 'あかい ... ウサギが ... みどりの ... はしる',
    targetPhonemes: ['/r/ (Alveolar Lateral Flap)', '/ts/', '/sh/'],
    ipaPhonemes: ['[ɺ]', '[t͡s]', '[ɕ]'],
    icfCode: 'ICF b330: Syllabic Timing'
  }
];
