/**
 * audioEngine.js — Web Audio chord playback + loop scheduler
 * Uses TeoriaNote.fq() from teoria.js for note → frequency conversion.
 * No external dependencies.
 */

import teoria from './teoria.js';

let ctx = null;
let loopTimer = null;
let scheduledStop = null;

const LOOKAHEAD = 0.2;   // seconds to schedule ahead
const TICK_MS   = 50;    // scheduler poll interval

function getCtx() {
  if (!ctx || ctx.state === 'closed') {
    ctx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

function noteFreq(noteStr) {
  try {
    // teoria note names use lowercase + octave, e.g. 'a4', 'c#4', 'eb3'
    const t = new teoria.TeoriaNote(noteStr.toLowerCase());
    return t.fq(440);
  } catch {
    return null;
  }
}

function scheduleNote(freq, startTime, duration) {
  const ac = getCtx();
  const osc  = ac.createOscillator();
  const gain = ac.createGain();

  osc.type = 'triangle';
  osc.frequency.value = freq;
  osc.connect(gain);
  gain.connect(ac.destination);

  // ADSR envelope
  const attack  = 0.01;
  const release = 0.35;
  const peak    = 0.22;

  gain.gain.setValueAtTime(0, startTime);
  gain.gain.linearRampToValueAtTime(peak, startTime + attack);
  gain.gain.setValueAtTime(peak, startTime + duration - release);
  gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

  osc.start(startTime);
  osc.stop(startTime + duration);
}

/**
 * Play a chord immediately.
 * @param {string[]} notes  e.g. ['A4', 'C4', 'E4', 'G4']
 * @param {number}   duration  seconds (default 1.5)
 */
export function playChord(notes, duration = 1.5) {
  const ac = getCtx();
  const now = ac.currentTime;
  let played = 0;
  for (const n of notes) {
    const freq = noteFreq(n);
    if (freq) { scheduleNote(freq, now, duration); played++; }
  }
  return played > 0;
}

// ---- Loop scheduler --------------------------------------------------------

let _loopState = null;

/**
 * Start looping a section's chord progression.
 * @param {object[]} chords       Array of chord nodes ({ notes7, notes, id })
 * @param {number}   bpm
 * @param {number}   beatsPerChord
 * @param {boolean}  useTetrads
 * @param {function} onChordStart  (index) → called each time a chord starts
 */
export function startLoop(chords, bpm, beatsPerChord = 4, useTetrads = true, onChordStart = null) {
  stopLoop();
  if (!chords || chords.length === 0) return;

  const ac = getCtx();
  const secPerBeat  = 60 / bpm;
  const chordDur    = secPerBeat * beatsPerChord;

  _loopState = {
    chords,
    bpm,
    beatsPerChord,
    useTetrads,
    onChordStart,
    chordDur,
    nextChordTime: ac.currentTime,
    chordIndex:    0,
  };

  _tick();
  loopTimer = setInterval(_tick, TICK_MS);
}

function _tick() {
  if (!_loopState) return;
  const ac = getCtx();
  const { chords, chordDur, useTetrads, onChordStart } = _loopState;

  while (_loopState.nextChordTime < ac.currentTime + LOOKAHEAD) {
    const idx   = _loopState.chordIndex % chords.length;
    const chord = chords[idx];
    const notes = useTetrads ? (chord.notes7 || chord.notes) : chord.notes;

    if (notes && notes.length > 0) {
      for (const n of notes) {
        const freq = noteFreq(n);
        if (freq) scheduleNote(freq, _loopState.nextChordTime, chordDur * 0.92);
      }
    }

    if (onChordStart) {
      // Fire callback near the scheduled time (best-effort via setTimeout)
      const delay = Math.max(0, (_loopState.nextChordTime - ac.currentTime) * 1000);
      const capturedIdx = idx;
      setTimeout(() => onChordStart(capturedIdx), delay);
    }

    _loopState.nextChordTime += chordDur;
    _loopState.chordIndex++;
  }
}

export function stopLoop() {
  if (loopTimer) { clearInterval(loopTimer); loopTimer = null; }
  if (scheduledStop) { clearTimeout(scheduledStop); scheduledStop = null; }
  _loopState = null;
}

export function isLooping() {
  return loopTimer !== null;
}
