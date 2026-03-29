import { useState, useMemo, useCallback } from 'react';
import SessionHeader from './components/SessionHeader';
import SongStructure from './components/SongStructure';
import ChordPalette from './components/ChordPalette';
import MelodyHelper from './components/MelodyHelper';
import { buildHarmonicField, toTeoriaNote } from './lib/harmonicField';
import { MOODS } from './lib/moodPresets';
import { stopLoop } from './lib/audioEngine';
import './App.css';

let _nextId = 1;
function uid() { return `s${_nextId++}`; }

function makeSection(name) {
  return { id: uid(), name, chords: [], beatsPerChord: 4 };
}

const DEFAULT_MOOD = MOODS[0]; // Melancólico

export default function App() {
  const [rootNote, setRootNote]   = useState(DEFAULT_MOOD.root);
  const [scaleName, setScaleName] = useState(DEFAULT_MOOD.scale);
  const [bpm, setBpm]             = useState(DEFAULT_MOOD.bpm);
  const [useTetrads, setUseTetrads] = useState(true);
  const [looping, setLooping]     = useState(false);

  const [sections, setSections]       = useState(() => [makeSection('Verso'), makeSection('Refrão')]);
  const [activeSectionId, setActiveSectionId] = useState(() => sections[0]?.id ?? null);
  const [activeChord, setActiveChord] = useState(null);  // chord selected for melody guide

  const field = useMemo(() => {
    try {
      return buildHarmonicField(toTeoriaNote(rootNote), scaleName);
    } catch {
      return null;
    }
  }, [rootNote, scaleName]);

  // When field changes (key/scale), clear chord selections
  const handleFieldChange = useCallback((newRoot, newScale) => {
    stopLoop();
    setLooping(false);
    setRootNote(newRoot);
    setScaleName(newScale);
    setActiveChord(null);
  }, []);

  const handleMoodSelect = useCallback((mood) => {
    stopLoop();
    setLooping(false);
    setRootNote(mood.root);
    setScaleName(mood.scale);
    setBpm(mood.bpm);
    setActiveChord(null);
  }, []);

  const handleLoopChange = useCallback((isLooping) => {
    setLooping(isLooping);
  }, []);

  // Add a chord to the active section
  const handleAddChord = useCallback((chordNode) => {
    setSections(secs => secs.map(s =>
      s.id === activeSectionId
        ? { ...s, chords: [...s.chords, chordNode] }
        : s
    ));
    setActiveChord(chordNode);
  }, [activeSectionId]);

  // Replace progression of a section
  const handleUpdateSection = useCallback((sectionId, updatedSection) => {
    setSections(secs => secs.map(s => s.id === sectionId ? updatedSection : s));
  }, []);

  const handleAddSection = useCallback((name) => {
    const section = makeSection(name);
    setSections(secs => [...secs, section]);
    setActiveSectionId(section.id);
  }, []);

  const handleRemoveSection = useCallback((sectionId) => {
    setSections(secs => {
      const next = secs.filter(s => s.id !== sectionId);
      if (activeSectionId === sectionId && next.length > 0) {
        setActiveSectionId(next[0].id);
      }
      return next;
    });
  }, [activeSectionId]);

  const activeSection = sections.find(s => s.id === activeSectionId) ?? null;

  return (
    <div className="app session-app">
      <SessionHeader
        rootNote={rootNote}
        scaleName={scaleName}
        bpm={bpm}
        useTetrads={useTetrads}
        looping={looping}
        sections={sections}
        activeSectionId={activeSectionId}
        field={field}
        onMoodSelect={handleMoodSelect}
        onFieldChange={handleFieldChange}
        onBpmChange={setBpm}
        onToggleTetrads={() => setUseTetrads(t => !t)}
        onLoopChange={handleLoopChange}
      />

      <div className="session-body">
        <div className="session-main">
          <SongStructure
            sections={sections}
            activeSectionId={activeSectionId}
            activeChord={activeChord}
            bpm={bpm}
            useTetrads={useTetrads}
            onSelectSection={setActiveSectionId}
            onUpdateSection={handleUpdateSection}
            onRemoveSection={handleRemoveSection}
            onAddSection={handleAddSection}
            onSelectChord={setActiveChord}
            onLoopChange={handleLoopChange}
          />
        </div>

        <div className="session-sidebar">
          <MelodyHelper
            activeChord={activeChord}
            field={field}
            useTetrads={useTetrads}
          />
        </div>
      </div>

      <div className="session-palette">
        <ChordPalette
          field={field}
          activeChord={activeChord}
          useTetrads={useTetrads}
          hasActiveSection={!!activeSection}
          onAddChord={handleAddChord}
        />
      </div>
    </div>
  );
}
