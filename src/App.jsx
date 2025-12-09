// App component: define routes
import React from 'react';
import Flashcard from './components/Flashcard.jsx';
import FlashcardForm from './components/FlashcardForm.jsx';
import { loadFlashcards, addFlashcard } from './utils/storage.js';

export default function App() {
  const [cards, setCards] = React.useState(() => loadFlashcards());
  const [showForm, setShowForm] = React.useState(false);
  const [filter, setFilter] = React.useState('all');
  const [index, setIndex] = React.useState(0);
  function create(card) {
    const saved = addFlashcard(card);
    setCards((prev) => [saved, ...prev]);
    setIndex(0);
  }
  const grouped = React.useMemo(() => {
    const by = cards.reduce((acc, c) => {
      const k = c.language || 'outros';
      acc[k] = acc[k] || [];
      acc[k].push(c);
      return acc;
    }, {});
    return by;
  }, [cards]);
  const langs = Object.keys(grouped);
  const visible = filter === 'all' ? cards : cards.filter((c) => c.language === filter);
  React.useEffect(() => {
    if (visible.length === 0) { setIndex(0); return; }
    if (index >= visible.length) setIndex(0);
  }, [filter, cards]);
  function prev() {
    if (visible.length === 0) return;
    setIndex((i) => (i - 1 + visible.length) % visible.length);
  }
  function next() {
    if (visible.length === 0) return;
    setIndex((i) => (i + 1) % visible.length);
  }
  function random() {
    if (visible.length === 0) return;
    const r = Math.floor(Math.random() * visible.length);
    setIndex(r);
  }
  return (
    <div className="page">
      <header className="topbar">
        <h1>Flashcards</h1>
        <div className="tools">
          <button onClick={() => setShowForm(true)}>Criar Flashcard</button>
          <select value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="all">Todos</option>
            {langs.map((l) => (
              <option key={l} value={l}>{l}</option>
            ))}
          </select>
        </div>
      </header>
      {showForm && (
        <div className="panel">
          <FlashcardForm onCreate={create} onCancel={() => setShowForm(false)} />
        </div>
      )}
      <main className="viewer">
        {visible.length === 0 ? (
          <div className="empty">Nenhum flashcard</div>
        ) : (
          <Flashcard key={visible[index].id} card={visible[index]} />
        )}
        <div className="controls">
          <button onClick={prev} disabled={visible.length === 0}>Anterior</button>
          <button onClick={random} disabled={visible.length === 0}>Aleatório</button>
          <button onClick={next} disabled={visible.length === 0}>Próximo</button>
        </div>
      </main>
    </div>
  );
}
