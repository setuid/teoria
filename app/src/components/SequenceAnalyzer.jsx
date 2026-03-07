import { useState } from 'react';
import { parseSequence, analyzeSequence, SCALE_LABELS } from '../lib/chordAnalysis';

const FUNCTION_LABEL = { T: 'Tônica', S: 'Subdominante', D: 'Dominante' };
const FUNCTION_CLASS = { T: 'tonic', S: 'subdominant', D: 'dominant' };

const EXAMPLES = [
  'Am F C G',
  'Dm G C Am',
  'Cm Ab Eb Bb',
  'Dm7 G7 Cmaj7',
  'Am E Am Dm E Am',
];

export default function SequenceAnalyzer() {
  const [input, setInput] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  function handleAnalyze() {
    setError('');
    const chords = parseSequence(input);
    if (chords.length === 0) {
      setError('Nenhum acorde reconhecido. Tente "Am F C G" ou "Dm7 G7 Cmaj7".');
      setResult(null);
      return;
    }
    const analysis = analyzeSequence(chords);
    setResult(analysis);
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter') handleAnalyze();
  }

  function handleExample(ex) {
    setInput(ex);
    setError('');
    setResult(null);
  }

  return (
    <div className="analyzer">
      <div className="analyzer-input-area">
        <div className="analyzer-input-row">
          <input
            className="analyzer-input"
            type="text"
            placeholder="Ex: Am F C G   ou   Dm7 G7 Cmaj7"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            spellCheck={false}
          />
          <button className="analyzer-btn" onClick={handleAnalyze}>
            Analisar
          </button>
        </div>

        <div className="analyzer-examples">
          <span className="analyzer-examples-label">Exemplos:</span>
          {EXAMPLES.map(ex => (
            <button key={ex} className="example-chip" onClick={() => handleExample(ex)}>
              {ex}
            </button>
          ))}
        </div>

        {error && <div className="analyzer-error">{error}</div>}
      </div>

      {result && <AnalysisResult result={result} />}
    </div>
  );
}

function AnalysisResult({ result }) {
  const { best, topKeys, others } = result;

  if (!best) {
    return <div className="analyzer-empty">Nenhuma tonalidade encontrada.</div>;
  }

  const confidence =
    best.score === 1
      ? '100% diatônico'
      : `${best.diatonicCount}/${best.total} acordes diatônicos`;

  // Multiple keys share the best score (e.g. relative major/minor)
  const alternatives = topKeys.filter(k => k.key !== best.key);

  return (
    <div className="analysis-result">
      {/* ── Best key header ── */}
      <div className="analysis-key-header">
        <div className="analysis-key-name">{best.key}</div>
        <div className="analysis-key-confidence">{confidence}</div>
        {alternatives.length > 0 && (
          <div className="analysis-key-alts">
            Também encaixa perfeitamente em:{' '}
            {alternatives.map(k => (
              <span key={k.key} className="alt-key-tag">{k.key}</span>
            ))}
          </div>
        )}
      </div>

      {/* ── Chord sequence table ── */}
      <div className="analysis-sequence">
        {best.chordResults.map((cr, i) => (
          <ChordCell key={i} cr={cr} />
        ))}
      </div>

      {/* ── Other possible keys ── */}
      {others.length > 0 && (
        <div className="analysis-others">
          <div className="analysis-others-title">Outras possibilidades</div>
          <div className="analysis-others-list">
            {others.map(k => (
              <OtherKey key={k.key} result={k} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ChordCell({ cr }) {
  const isDiatonic = cr.isDiatonic;
  return (
    <div className={`chord-cell ${isDiatonic ? '' : 'non-diatonic'}`}>
      <div className="chord-cell-name">{cr.chord.original}</div>
      <div className="chord-cell-roman">{cr.roman ?? '—'}</div>
      {cr.function && (
        <div className={`chord-cell-function function-tag ${FUNCTION_CLASS[cr.function]}`}>
          {FUNCTION_LABEL[cr.function]}
        </div>
      )}
      {!isDiatonic && cr.annotation && (
        <div className="chord-cell-annotation">{cr.annotation}</div>
      )}
    </div>
  );
}

function OtherKey({ result }) {
  const romans = result.chordResults.map(cr => cr.roman ?? '?').join(' — ');
  const pct = Math.round(result.score * 100);
  return (
    <div className="other-key-row">
      <span className="other-key-name">{result.key}</span>
      <span className="other-key-romans">{romans}</span>
      <span className="other-key-score">{pct}%</span>
    </div>
  );
}
