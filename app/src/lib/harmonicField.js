import teoria from './teoria';

const ROMAN_NUMERALS = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII'];

// Determine chord quality by stacking diatonic thirds
function getDiatonicChordQuality(scaleNotes, degreeIndex) {
  const root = scaleNotes[degreeIndex];
  const third = scaleNotes[(degreeIndex + 2) % 7];
  const fifth = scaleNotes[(degreeIndex + 4) % 7];

  const rootKey = root.key();
  const thirdSemitones = ((third.key() - rootKey) % 12 + 12) % 12;
  const fifthSemitones = ((fifth.key() - rootKey) % 12 + 12) % 12;

  if (thirdSemitones === 4 && fifthSemitones === 7) return 'major';
  if (thirdSemitones === 3 && fifthSemitones === 7) return 'minor';
  if (thirdSemitones === 3 && fifthSemitones === 6) return 'diminished';
  if (thirdSemitones === 4 && fifthSemitones === 8) return 'augmented';
  return 'major';
}

function qualitySymbol(quality) {
  switch (quality) {
    case 'major': return '';
    case 'minor': return 'm';
    case 'diminished': return 'dim';
    case 'augmented': return 'aug';
    default: return '';
  }
}

function toRoman(degree, quality) {
  const base = ROMAN_NUMERALS[degree];
  const lower = quality === 'minor' || quality === 'diminished';
  const numeral = lower ? base.toLowerCase() : base;
  const suffix = quality === 'diminished' ? '°' : quality === 'augmented' ? '+' : '';
  return numeral + suffix;
}

export function buildHarmonicField(rootNote, scaleName) {
  // Only heptatonic scales make sense as harmonic fields
  const heptatonic = ['major', 'ionian', 'dorian', 'phrygian', 'lydian', 'mixolydian', 'minor', 'aeolian', 'locrian'];
  if (!heptatonic.includes(scaleName)) {
    scaleName = 'major';
  }

  const scale = teoria.scale(rootNote + '4', scaleName);
  const scaleNotes = scale.notes;

  const nodes = [];
  const links = [];

  // Build 7 chord nodes
  for (let i = 0; i < 7; i++) {
    const noteObj = scaleNotes[i];
    const quality = getDiatonicChordQuality(scaleNotes, i);
    const symbol = qualitySymbol(quality);
    const chordName = noteObj.name.toUpperCase() + noteObj.accidental.sign + symbol;
    const roman = toRoman(i, quality);
    const chordNotes = [
      scaleNotes[i].toString(true),
      scaleNotes[(i + 2) % 7].toString(true),
      scaleNotes[(i + 4) % 7].toString(true),
    ];

    nodes.push({
      id: chordName,
      degree: i,
      quality,
      roman,
      root: noteObj.name + noteObj.accidental.sign,
      notes: chordNotes,
      symbol,
    });
  }

  // Build edges: adjacent degrees (ring)
  for (let i = 0; i < 7; i++) {
    links.push({
      source: nodes[i].id,
      target: nodes[(i + 1) % 7].id,
      type: 'adjacent',
    });
  }

  // V -> I dominant relation (degree 4 -> degree 0)
  links.push({
    source: nodes[4].id,
    target: nodes[0].id,
    type: 'dominant',
  });

  // IV -> I subdominant (degree 3 -> degree 0)
  links.push({
    source: nodes[3].id,
    target: nodes[0].id,
    type: 'subdominant',
  });

  return { nodes, links, scaleName, rootNote };
}

export const AVAILABLE_SCALES = [
  { value: 'major',      label: 'Maior (Jônico)' },
  { value: 'dorian',     label: 'Dórico' },
  { value: 'phrygian',   label: 'Frígio' },
  { value: 'lydian',     label: 'Lídio' },
  { value: 'mixolydian', label: 'Mixolídio' },
  { value: 'minor',      label: 'Menor Natural (Eólio)' },
  { value: 'locrian',    label: 'Lócrio' },
];

export const AVAILABLE_NOTES = [
  'C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'
];

// Map display note names to teoria note names
export function toTeoriaNote(displayNote) {
  return displayNote.toLowerCase().replace('#', '#').replace('b', 'b');
}
