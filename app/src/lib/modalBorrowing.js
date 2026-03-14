import { buildHarmonicField, toTeoriaNote, AVAILABLE_SCALES } from './harmonicField';

// Short labels for the timeline badge
export const SCALE_SHORT = {
  major:      'Jôn',
  ionian:     'Jôn',
  dorian:     'Dór',
  phrygian:   'Frí',
  lydian:     'Líd',
  mixolydian: 'Mix',
  minor:      'Eól',
  aeolian:    'Eól',
  locrian:    'Lóc',
};

// Scales that are aliases of each other (don't show both)
const ALIASES = { major: 'ionian', ionian: 'major', minor: 'aeolian', aeolian: 'minor' };

/**
 * Returns borrowed chord groups for all parallel modes.
 * Each group: { scale, label, shortLabel, nodes[] }
 * Each node has:
 *   isBorrowed: true
 *   borrowedFrom: scale value
 *   borrowedFromLabel: scale label
 *   borrowedFromShort: short label for badges
 *   isExclusive: true if the chord id is NOT in the current field
 */
export function getBorrowedGroups(rootNote, currentScale) {
  const currentField = buildHarmonicField(toTeoriaNote(rootNote), currentScale);
  const currentIds = new Set(currentField.nodes.map(n => n.id));

  const otherScales = AVAILABLE_SCALES.filter(
    s => s.value !== currentScale && s.value !== ALIASES[currentScale]
  );

  return otherScales.map(scale => {
    const field = buildHarmonicField(toTeoriaNote(rootNote), scale.value);
    const nodes = field.nodes.map(node => ({
      ...node,
      isBorrowed: true,
      borrowedFrom: scale.value,
      borrowedFromLabel: scale.label,
      borrowedFromShort: SCALE_SHORT[scale.value] || scale.label,
      isExclusive: !currentIds.has(node.id),
    }));

    return {
      scale: scale.value,
      label: scale.label,
      shortLabel: SCALE_SHORT[scale.value] || scale.label,
      nodes,
      exclusiveCount: nodes.filter(n => n.isExclusive).length,
    };
  });
}
