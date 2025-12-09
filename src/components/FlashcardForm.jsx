import React from 'react';

const LANGS = [
  { value: 'pt', label: 'Português' },
  { value: 'en', label: 'Inglês' },
  { value: 'es', label: 'Espanhol' },
];

export default function FlashcardForm({ onCreate, onCancel }) {
  const [front, setFront] = React.useState('');
  const [back, setBack] = React.useState('');
  const [language, setLanguage] = React.useState('pt');
  function submit(e) {
    e.preventDefault();
    if (!front.trim() || !back.trim()) return;
    onCreate({ front: front.trim(), back: back.trim(), language });
    setFront('');
    setBack('');
    setLanguage('pt');
    if (onCancel) onCancel();
  }
  return (
    <form className="card-form" onSubmit={submit}>
      <div className="row">
        <input placeholder="Frente" value={front} onChange={(e) => setFront(e.target.value)} />
      </div>
      <div className="row">
        <input placeholder="Verso" value={back} onChange={(e) => setBack(e.target.value)} />
      </div>
      <div className="row">
        <select value={language} onChange={(e) => setLanguage(e.target.value)}>
          {LANGS.map((l) => (
            <option key={l.value} value={l.value}>{l.label}</option>
          ))}
        </select>
      </div>
      <div className="actions">
        <button type="submit">Salvar</button>
        <button type="button" onClick={onCancel}>Cancelar</button>
      </div>
    </form>
  );
}
