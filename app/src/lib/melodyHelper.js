/**
 * melodyHelper.js
 * Given a chord node and the harmonic field, classifies each scale note
 * as a chord tone (safe), available tension (color), or note to avoid.
 */

// Strip octave number from note names like 'A4' → 'A', 'C#4' → 'C#', 'Eb3' → 'Eb'
function pitchClass(noteStr) {
  return noteStr.replace(/\d+$/, '').toUpperCase();
}

// Normalize enharmonic equivalents to a canonical form for comparison
const ENHARMONIC = {
  'CB': 'B', 'DB': 'C#', 'EB': 'D#', 'FB': 'E', 'GB': 'F#',
  'AB': 'G#', 'BB': 'A#', 'E#': 'F', 'B#': 'C',
};
function normalize(pc) {
  const up = pc.toUpperCase();
  return ENHARMONIC[up] || up;
}

// Avoid-note rules per chord quality (semitones above root that are avoid notes)
// These are the classic jazz avoid notes
const AVOID_SEMITONES = {
  major:      [5],          // P4 clashes with maj3
  dominant7:  [5],          // P4, also b9 against root but that's outside scale usually
  minor:      [],           // minor chords are forgiving
  minor7:     [],
  maj7:       [5],          // same as major
  halfDim7:   [],
  dim7:       [],
};

function semitonesBetween(rootPc, notePc) {
  const NOTES = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];
  const r = NOTES.indexOf(normalize(rootPc));
  const n = NOTES.indexOf(normalize(notePc));
  if (r === -1 || n === -1) return -1;
  return (n - r + 12) % 12;
}

/**
 * Get melody guidance for a chord in context of its harmonic field.
 *
 * @param {object} chordNode   - field node ({ root, notes, notes7, quality7, quality })
 * @param {object} field       - harmonic field ({ nodes })
 * @param {boolean} useTetrads
 * @returns {{ safe: string[], color: string[], avoid: string[] }}
 */
export function getMelodyGuide(chordNode, field, useTetrads = true) {
  if (!chordNode || !field) return { safe: [], color: [], avoid: [] };

  const chordNotes = useTetrads
    ? (chordNode.notes7 || chordNode.notes)
    : chordNode.notes;

  // Pitch classes in the chord
  const chordPCs = new Set(chordNotes.map(n => normalize(pitchClass(n))));

  // All 7 scale pitch classes (from field nodes' roots)
  const scaleNotes = field.nodes.map(n => normalize(n.root.toUpperCase()));

  // Avoid semitones for this chord quality
  const avoidSemi = AVOID_SEMITONES[chordNode.quality7]
    || AVOID_SEMITONES[chordNode.quality]
    || [];

  const avoidPCs = new Set(
    avoidSemi.map(s => {
      const NOTES = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];
      const rootIdx = NOTES.indexOf(normalize(chordNode.root.toUpperCase()));
      if (rootIdx === -1) return null;
      return NOTES[(rootIdx + s) % 12];
    }).filter(Boolean)
  );

  const safe  = [];
  const color = [];
  const avoid = [];

  for (const pc of scaleNotes) {
    if (chordPCs.has(pc)) {
      safe.push(pc);
    } else if (avoidPCs.has(pc)) {
      avoid.push(pc);
    } else {
      color.push(pc);
    }
  }

  return { safe, color, avoid };
}
