import teoria from './teoria';

const ROMAN_NUMERALS = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII'];

// Determine triad quality by stacking diatonic thirds
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

// Determine tetrad (7th chord) quality by combining triad quality + 7th interval
function getDiatonicChord7Quality(scaleNotes, degreeIndex, triadQuality) {
  const root = scaleNotes[degreeIndex];
  const seventh = scaleNotes[(degreeIndex + 6) % 7];

  const rootKey = root.key();
  const seventhSemitones = ((seventh.key() - rootKey) % 12 + 12) % 12;

  if (triadQuality === 'major'     && seventhSemitones === 11) return 'maj7';
  if (triadQuality === 'major'     && seventhSemitones === 10) return 'dominant7';
  if (triadQuality === 'minor'     && seventhSemitones === 10) return 'minor7';
  if (triadQuality === 'minor'     && seventhSemitones === 11) return 'minMaj7';
  if (triadQuality === 'diminished'&& seventhSemitones === 10) return 'halfDim7';
  if (triadQuality === 'diminished'&& seventhSemitones === 9)  return 'dim7';
  if (triadQuality === 'augmented' && seventhSemitones === 11) return 'augMaj7';
  if (triadQuality === 'augmented' && seventhSemitones === 10) return 'aug7';
  return triadQuality;
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

function quality7Symbol(quality7) {
  switch (quality7) {
    case 'maj7':      return 'maj7';
    case 'dominant7': return '7';
    case 'minor7':    return 'm7';
    case 'minMaj7':   return 'mMaj7';
    case 'halfDim7':  return 'm7b5';
    case 'dim7':      return 'dim7';
    case 'augMaj7':   return 'augMaj7';
    case 'aug7':      return 'aug7';
    default:          return '';
  }
}

function toRoman(degree, quality) {
  const base = ROMAN_NUMERALS[degree];
  const lower = quality === 'minor' || quality === 'diminished';
  const numeral = lower ? base.toLowerCase() : base;
  const suffix = quality === 'diminished' ? '°' : quality === 'augmented' ? '+' : '';
  return numeral + suffix;
}

function toRoman7(degree, quality, quality7) {
  const base = ROMAN_NUMERALS[degree];
  const lower = quality === 'minor' || quality === 'diminished';
  const numeral = lower ? base.toLowerCase() : base;

  switch (quality7) {
    case 'maj7':      return numeral + 'maj7';
    case 'dominant7': return numeral + '7';
    case 'minor7':    return numeral + '7';
    case 'minMaj7':   return numeral + 'Maj7';
    case 'halfDim7':  return numeral + 'ø7';
    case 'dim7':      return numeral + '°7';
    case 'augMaj7':   return numeral + '+Maj7';
    case 'aug7':      return numeral + '+7';
    default:          return toRoman(degree, quality);
  }
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

  // Build 7 chord nodes (triads + tetrads)
  for (let i = 0; i < 7; i++) {
    const noteObj = scaleNotes[i];
    const quality = getDiatonicChordQuality(scaleNotes, i);
    const quality7 = getDiatonicChord7Quality(scaleNotes, i, quality);

    const symbol = qualitySymbol(quality);
    const symbol7 = quality7Symbol(quality7);

    const chordName = noteObj.name.toUpperCase() + noteObj.accidental.sign + symbol;
    const chordName7 = noteObj.name.toUpperCase() + noteObj.accidental.sign + symbol7;

    const roman = toRoman(i, quality);
    const roman7 = toRoman7(i, quality, quality7);

    const chordNotes = [
      scaleNotes[i].toString(true),
      scaleNotes[(i + 2) % 7].toString(true),
      scaleNotes[(i + 4) % 7].toString(true),
    ];
    const chordNotes7 = [
      ...chordNotes,
      scaleNotes[(i + 6) % 7].toString(true),
    ];

    nodes.push({
      id: chordName,
      name7: chordName7,
      degree: i,
      quality,
      quality7,
      roman,
      roman7,
      root: noteObj.name + noteObj.accidental.sign,
      notes: chordNotes,
      notes7: chordNotes7,
      symbol,
      symbol7,
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
