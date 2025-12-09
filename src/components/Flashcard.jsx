import React from 'react';

export default function Flashcard({ card }) {
  const [flipped, setFlipped] = React.useState(false);
  return (
    <div className="flashcard" data-lang={card.language} onClick={() => setFlipped((v) => !v)}>
      <div className={flipped ? 'inner flipped' : 'inner'}>
        <div className="face front">
          <div className="text">{card.front}</div>
          <div className="meta">{card.language}</div>
        </div>
        <div className="face back">
          <div className="text">{card.back}</div>
          <div className="meta">{card.language}</div>
        </div>
      </div>
    </div>
  );
}
