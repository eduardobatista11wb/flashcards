const KEY = 'flashcards';

function loadFlashcards() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed;
    return [];
  } catch (_) {
    return [];
  }
}

function saveFlashcards(list) {
  localStorage.setItem(KEY, JSON.stringify(list));
}

function addFlashcard(card) {
  const list = loadFlashcards();
  const id = crypto.randomUUID ? crypto.randomUUID() : String(Date.now());
  const next = { id, ...card };
  const updated = [next, ...list];
  saveFlashcards(updated);
  return next;
}

export { loadFlashcards, saveFlashcards, addFlashcard };
