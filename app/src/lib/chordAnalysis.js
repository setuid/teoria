import { buildHarmonicField, AVAILABLE_NOTES, toTeoriaNote } from './harmonicField';

// Semitone index for every common note spelling (0 = C)
const NOTE_SEMITONES = {
  'C': 0,  'C#': 1,  'Db': 1,
  'D': 2,  'D#': 3,  'Eb': 3,
  'E': 4,  'Fb': 4,  'E#': 5,
  'F': 5,  'F#': 6,  'Gb': 6,
  'G': 7,  'G#': 8,  'Ab': 8,
  'A': 9,  'A#': 10, 'Bb': 10,
  'B': 11, 'Cb': 11, 'B#': 0,
};

export const SCALE_LABELS = {
  major:      'Maior',
  dorian:     'Dórico',
  phrygian:   'Frígio',
  lydian:     'Lídio',
  mixolydian: 'Mixolídio',
  minor:      'Menor Natural',
  locrian:    'Lócrio',
};

// Functional label per diatonic degree (works for all modes as approximation)
const DEGREE_FUNCTION = ['T', 'S', 'T', 'S', 'D', 'T', 'D'];

function noteSemitone(name) {
  const n = name[0].toUpperCase() + name.slice(1);
  return NOTE_SEMITONES[n] ?? -1;
}

// Parse a single chord name like "Am", "F#m7", "Bbmaj7", "G7", "Cdim"
// Returns { root, quality, original } or null
export function parseChordName(raw) {
  const name = raw.trim();
  if (!name) return null;

  // Strip slash-chord bass note ("/E", "/G#") at the end
  const withoutBass = name.replace(/\/[A-Ga-g][#b]?$/, '');

  const match = withoutBass.match(/^([A-Ga-g])([#b]?)(.*)?$/);
  if (!match) return null;

  const root = match[1].toUpperCase() + match[2];
  const suffix = (match[3] || '').trim();

  let quality = 'major';

  // Order matters: check "min"/"mi" before "m", check "dim" before anything else
  if (/^(dim|°)/i.test(suffix) || /m7b5|ø/i.test(suffix)) {
    quality = 'diminished';
  } else if (/^(aug|\+)/i.test(suffix)) {
    quality = 'augmented';
  } else if (/^(m|min|mi)(?!aj)/i.test(suffix)) {
    quality = 'minor';
  }
  // else: major (covers "", "7", "maj7", "M7", "6", "9", "sus2", "sus4", etc.)

  return { root, quality, original: name };
}

// Parse a free-form sequence string into an array of chord objects.
// Supports separators: spaces, commas, pipes, dashes, em-dashes.
export function parseSequence(input) {
  // Split on whitespace and common chord-sequence separators
  const tokens = input.split(/[\s,|—–]+/).map(t => t.trim()).filter(Boolean);
  return tokens.map(t => parseChordName(t)).filter(Boolean);
}

// Check if a parsed chord matches a field node (compare by semitone + quality)
function chordMatchesNode(chord, node) {
  const cs = noteSemitone(chord.root);
  const ns = noteSemitone(node.root);
  if (cs < 0 || ns < 0) return false;
  return cs === ns && chord.quality === node.quality;
}

// Try to identify a non-diatonic chord's role in the given field:
// - Secondary dominant: major chord whose root resolves a P4 down to a diatonic root
// - Borrowed chord: appears diatonically in the parallel key
function annotateNonDiatonic(chord, field) {
  const chordSemi = noteSemitone(chord.root);

  // Secondary dominant: V/x — chord is major and resolves (P5 down = P4 up) to a diatonic root
  if (chord.quality === 'major' || chord.quality === 'augmented') {
    for (const node of field.nodes) {
      const nodeSemi = noteSemitone(node.root);
      const diff = ((nodeSemi - chordSemi) + 12) % 12;
      if (diff === 5) {
        // This chord resolves to `node` — it's V/node.roman
        return `V/${node.roman}`;
      }
    }
  }

  // Borrowed chord: check parallel major/minor
  const isMinorScale = ['minor', 'dorian', 'phrygian', 'locrian'].includes(field.scaleName);
  const parallelScale = isMinorScale ? 'major' : 'minor';
  try {
    const parallelField = buildHarmonicField(toTeoriaNote(field.rootNote), parallelScale);
    const match = parallelField.nodes.find(n => chordMatchesNode(chord, n));
    if (match) {
      return `emp. de ${SCALE_LABELS[parallelScale].toLowerCase()}`;
    }
  } catch (_) {
    // ignore parallel field errors
  }

  return 'não-diatônico';
}

const ANALYZE_SCALES = ['major', 'dorian', 'phrygian', 'lydian', 'mixolydian', 'minor', 'locrian'];

// Analyze a chord sequence against all 12×7 possible keys.
// Returns an array of match results sorted by score (best first).
export function analyzeSequence(chords) {
  if (!chords.length) return [];

  const allResults = [];

  for (const note of AVAILABLE_NOTES) {
    for (const scale of ANALYZE_SCALES) {
      let field;
      try {
        field = buildHarmonicField(toTeoriaNote(note), scale);
      } catch (_) {
        continue;
      }

      const chordResults = chords.map(chord => {
        const node = field.nodes.find(n => chordMatchesNode(chord, n));
        return {
          chord,
          node: node || null,
          isDiatonic: !!node,
          roman: node ? node.roman : null,
          function: node ? DEGREE_FUNCTION[node.degree] : null,
          annotation: null, // filled in below for non-diatonic
        };
      });

      const diatonicCount = chordResults.filter(r => r.isDiatonic).length;
      const score = diatonicCount / chords.length;

      allResults.push({
        key: `${note} ${SCALE_LABELS[scale]}`,
        rootNote: note,
        scaleName: scale,
        score,
        diatonicCount,
        total: chords.length,
        chordResults,
        field,
      });
    }
  }

  // Sort: highest score first; ties broken by preferring major/minor
  allResults.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    const simpleA = a.scaleName === 'major' || a.scaleName === 'minor' ? 0 : 1;
    const simpleB = b.scaleName === 'major' || b.scaleName === 'minor' ? 0 : 1;
    return simpleA - simpleB;
  });

  // Annotate non-diatonic chords in the best result
  const best = allResults[0];
  if (best) {
    for (const cr of best.chordResults) {
      if (!cr.isDiatonic) {
        cr.annotation = annotateNonDiatonic(cr.chord, best.field);
      }
    }
  }

  // Return: all keys with max score + top 5 others with score > 0
  const maxScore = best?.score ?? 0;
  const topKeys = allResults.filter(r => r.score === maxScore);
  const others = allResults
    .filter(r => r.score < maxScore && r.score > 0)
    .slice(0, 8);

  return { best, topKeys, others };
}
