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

// ─── Explainability ──────────────────────────────────────────────────────────

const FUNCTION_LABEL = { T: 'Tônica', S: 'Subdominante', D: 'Dominante' };

const FUNCTION_EXPLANATION = {
  T: 'ponto de repouso e estabilidade harmônica — a "casa" da tonalidade',
  S: 'prepara o movimento para a Dominante ou retorna suavemente à Tônica',
  D: 'cria tensão que quer resolver em direção à Tônica',
};

const SCALE_EXPLANATION = {
  major:      'A escala Maior (Jônico) tem sonoridade brilhante e alegre. Seus graus são: I Maior, ii menor, iii menor, IV Maior, V Maior (dominante), vi menor, vii diminuto.',
  minor:      'A escala Menor Natural (Eólio) é melancólica e introspectiva — a mais usada no pop, rock e MPB. Seus graus: i menor, ii diminuto, bIII Maior, iv menor, v menor, bVI Maior, bVII Maior.',
  dorian:     'O modo Dórico é um menor com o 6º grau elevado, dando sonoridade jazzística e mais aberta. Muito usado no jazz, funk e música celta.',
  phrygian:   'O modo Frígio tem o 2º grau abaixado (bII), criando sonoridade tensa e dramática. Popular no flamenco, metal e música árabe.',
  lydian:     'O modo Lídio tem o 4º grau elevado (#IV), resultando em sonoridade etérea e "flutuante". Frequente em trilhas sonoras e música new age.',
  mixolydian: 'O modo Mixolídio é como uma escala Maior com o 7º grau abaixado (bVII), criando um sabor bluesy. Muito usado no rock, blues e música celta.',
  locrian:    'O modo Lócrio tem sonoridade extremamente instável, com quinta diminuta no I grau. Raramente usado como campo harmônico principal.',
};

export function generateExplanation(result) {
  const { best, topKeys } = result;
  if (!best) return null;

  const paragraphs = [];

  // 1. Tonality detection
  const pct = Math.round(best.score * 100);
  if (best.score === 1) {
    paragraphs.push(
      `Todos os ${best.total} acordes pertencem ao campo harmônico de ${best.key}, confirmando que a progressão é 100% diatônica a essa tonalidade.`
    );
  } else {
    paragraphs.push(
      `${best.diatonicCount} de ${best.total} acordes (${pct}%) pertencem ao campo harmônico de ${best.key}, tornando-a a tonalidade mais provável. Os demais acordes são não-diatônicos e explicados abaixo.`
    );
  }

  // 2. Alternatives
  const alts = topKeys.filter(k => k.key !== best.key);
  if (alts.length > 0) {
    const altNames = alts.map(k => k.key).join(', ');
    paragraphs.push(
      `A progressão também encaixa perfeitamente em ${altNames}. Isso ocorre porque tonalidades relativas ou paralelas compartilham os mesmos acordes diatônicos — a escolha final depende do contexto melódico e do acorde de repouso.`
    );
  }

  // 3. Scale/mode explanation
  const scaleExp = SCALE_EXPLANATION[best.scaleName];
  if (scaleExp) {
    paragraphs.push(`Sobre o modo ${SCALE_LABELS[best.scaleName]}: ${scaleExp}`);
  }

  // 4. Chord-by-chord
  const chordLines = [];
  for (const cr of best.chordResults) {
    const name = cr.chord.original;
    if (cr.isDiatonic) {
      const fn = cr.function;
      const fnLabel = fn ? FUNCTION_LABEL[fn] : 'Passagem';
      const fnExp = fn ? FUNCTION_EXPLANATION[fn] : 'acorde de passagem dentro do campo harmônico';
      chordLines.push(`${name} (${cr.roman}) — ${fnLabel}: ${fnExp}.`);
    } else {
      const ann = cr.annotation ?? 'não-diatônico';
      if (ann.startsWith('V/')) {
        const target = ann.slice(2);
        chordLines.push(
          `${name} — Dominante Secundário ${ann}: acorde maior que resolve um quinto abaixo para o grau ${target} do campo. Esse recurso cria tensão cromática temporária sem sair da tonalidade principal — é como uma "mini-cadência" interna.`
        );
      } else if (ann.includes('emp.')) {
        const fromScale = ann.replace('emp. de ', '');
        chordLines.push(
          `${name} — Empréstimo modal (${ann}): acorde diatônico na tonalidade paralela de ${best.rootNote} ${fromScale}. O empréstimo modal é uma técnica comum para adicionar cor harmônica e emocional sem perder o centro tonal.`
        );
      } else {
        chordLines.push(
          `${name} — Acorde não-diatônico: não pertence ao campo de ${best.key} nem foi identificado como dominante secundário ou empréstimo modal. Pode ser uma modulação passageira ou uma substituição tritonante.`
        );
      }
    }
  }
  if (chordLines.length > 0) {
    paragraphs.push('Análise acorde por acorde:\n' + chordLines.map(l => '• ' + l).join('\n'));
  }

  return paragraphs;
}
