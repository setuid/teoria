// Maps semitones for secondary dominant computation
const NOTE_TO_SEMITONE = {
  'c': 0, 'c#': 1, 'db': 1, 'd': 2, 'd#': 3, 'eb': 3, 'e': 4,
  'f': 5, 'f#': 6, 'gb': 6, 'g': 7, 'g#': 8, 'ab': 8, 'a': 9,
  'a#': 10, 'bb': 10, 'b': 11,
};
const SEMITONE_TO_NOTE = ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'];

// Labeled functional movements per source degree (0=I, 1=ii, 2=iii, 3=IV, 4=V, 5=vi, 6=vii)
const FUNCTIONAL_MOVEMENTS = {
  0: [
    { to: 4, label: 'Movimento para Dominante', style: 'strong' },
    { to: 3, label: 'Movimento para Subdominante', style: 'strong' },
    { to: 5, label: 'Movimento para Submediante (relativa)', style: 'medium' },
    { to: 1, label: 'Progressão I → ii (pré-dominante)', style: 'medium' },
    { to: 2, label: 'Progressão I → iii', style: 'weak' },
    { to: 6, label: 'Progressão I → vii', style: 'weak' },
  ],
  1: [
    { to: 4, label: 'Progressão ii → V (clássica/jazz)', style: 'strong' },
    { to: 0, label: 'Resolução ii → I', style: 'medium' },
    { to: 3, label: 'Movimento ii → IV', style: 'medium' },
    { to: 5, label: 'Movimento ii → vi', style: 'weak' },
  ],
  2: [
    { to: 5, label: 'Progressão iii → vi', style: 'strong' },
    { to: 3, label: 'Progressão iii → IV', style: 'medium' },
    { to: 0, label: 'Retorno à Tônica', style: 'medium' },
    { to: 4, label: 'Progressão iii → V', style: 'weak' },
  ],
  3: [
    { to: 0, label: 'Cadência Plagal (IV → I)', style: 'strong' },
    { to: 4, label: 'Subdominante → Dominante', style: 'strong' },
    { to: 1, label: 'Regressão IV → ii', style: 'medium' },
    { to: 5, label: 'Progressão IV → vi', style: 'weak' },
    { to: 6, label: 'Progressão IV → vii', style: 'weak' },
  ],
  4: [
    { to: 0, label: 'Cadência Autêntica (V → I)', style: 'strong' },
    { to: 5, label: 'Cadência Deceptiva (V → vi)', style: 'medium' },
    { to: 3, label: 'Retorno à Subdominante', style: 'weak' },
    { to: 1, label: 'Movimento V → ii', style: 'weak' },
  ],
  5: [
    { to: 3, label: 'Progressão Eólia vi → IV', style: 'strong' },
    { to: 1, label: 'Progressão vi → ii', style: 'strong' },
    { to: 4, label: 'Progressão vi → V', style: 'medium' },
    { to: 0, label: 'Resolução vi → I', style: 'weak' },
    { to: 2, label: 'Progressão vi → iii', style: 'weak' },
  ],
  6: [
    { to: 0, label: 'Resolução da Sensível (vii → I)', style: 'strong' },
    { to: 5, label: 'Progressão vii → vi', style: 'medium' },
    { to: 1, label: 'Progressão vii → ii', style: 'weak' },
  ],
};

// Common named progressions for labeling context
const NAMED_PROGRESSIONS = [
  { degrees: [0, 4, 5, 3], name: 'I-V-vi-IV (Pop)' },
  { degrees: [0, 3, 4, 0], name: 'I-IV-V-I (Blues/Rock)' },
  { degrees: [1, 4, 0], name: 'ii-V-I (Jazz)' },
  { degrees: [0, 5, 3, 4], name: 'I-vi-IV-V (Doo-wop)' },
  { degrees: [5, 3, 4, 0], name: 'vi-IV-V-I' },
  { degrees: [0, 5, 1, 4], name: 'I-vi-ii-V (Jazz turnaround)' },
  { degrees: [0, 4, 1, 4], name: 'I-V-ii-V' },
  { degrees: [5, 3, 0, 4], name: 'vi-IV-I-V' },
  { degrees: [5, 4, 3, 4], name: 'vi-V-IV-V (Andaluz)' },
];

function computeSecondaryDominant(targetNode) {
  const rootKey = targetNode.root.toLowerCase();
  const semitone = NOTE_TO_SEMITONE[rootKey];
  if (semitone === undefined) return null;

  const domSemitone = (semitone + 7) % 12;
  const domRoot = SEMITONE_TO_NOTE[domSemitone];

  return {
    id: domRoot + '7',
    degree: -1,
    quality: 'dominant7',
    roman: 'V7/' + targetNode.roman,
    root: domRoot,
    notes: [],
    symbol: '7',
    isSecondary: true,
    resolvesToDegree: targetNode.degree,
    resolvesToId: targetNode.id,
    label: `Dominante secundário → resolve em ${targetNode.id}`,
  };
}

/**
 * Returns suggestion groups for a given active chord.
 * @param {object} activeChord - the chord we're suggesting next chords FROM
 * @param {object} field - the harmonic field (nodes, links, scaleName, rootNote)
 * @param {object[]} previousChords - chords already in the progression
 * @returns {{ functional, diatonic, secondary, progressionHints }}
 */
export function getSuggestions(activeChord, field, previousChords = []) {
  const { nodes } = field;

  // If the active chord is a secondary dominant, suggest its resolution first
  const degree = activeChord.isSecondary
    ? activeChord.resolvesToDegree
    : activeChord.degree;

  // Functional labeled movements
  const functional = [];

  if (activeChord.isSecondary) {
    functional.push({
      node: nodes[activeChord.resolvesToDegree],
      label: `Resolução natural de ${activeChord.id} → ${nodes[activeChord.resolvesToDegree].id}`,
      style: 'strong',
    });
  }

  (FUNCTIONAL_MOVEMENTS[degree] || []).forEach(m => {
    functional.push({
      node: nodes[m.to],
      label: m.label,
      style: m.style,
    });
  });

  // All other diatonic chords
  const diatonic = nodes.filter(n => n.degree !== degree);

  // Secondary dominants (V7 of each diatonic chord except current)
  const secondary = nodes
    .filter(n => n.degree !== degree)
    .map(n => computeSecondaryDominant(n))
    .filter(Boolean);

  // Detect if we're inside a known named progression
  const progressionHints = detectProgressionHints(previousChords, degree);

  return { functional, diatonic, secondary, progressionHints };
}

function detectProgressionHints(previousChords, nextDegree) {
  if (previousChords.length === 0) return [];

  const hints = [];
  const prevDegrees = previousChords.map(c => c.isSecondary ? -1 : c.degree);

  for (const prog of NAMED_PROGRESSIONS) {
    const { degrees, name } = prog;
    // Check if the tail of prevDegrees matches the start of this progression
    for (let matchLen = Math.min(prevDegrees.length, degrees.length - 1); matchLen >= 1; matchLen--) {
      const prevTail = prevDegrees.slice(-matchLen);
      const progStart = degrees.slice(0, matchLen);
      if (prevTail.every((d, i) => d === progStart[i])) {
        const nextInProg = degrees[matchLen];
        if (nextInProg === nextDegree) {
          hints.push({ name, nextDegree });
        } else if (nextInProg !== undefined) {
          hints.push({ name, suggestedDegree: nextInProg });
        }
      }
    }
  }

  return hints;
}
