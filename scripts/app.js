document.addEventListener("DOMContentLoaded", () => {
  const flashcardsContainer = document.getElementById("flashcards-container");
  const nextButton = document.getElementById("next-button");
  let flashcards = [];
  let currentIndex = 0;

  async function loadFlashcards() {
    const response = await fetch("./data/words.json");
    flashcards = await response.json();
    displayFlashcard();
  }

  function displayFlashcard() {
    if (currentIndex < flashcards.length) {
      const flashcard = flashcards[currentIndex];
      flashcardsContainer.innerHTML = `
                <div class="flashcard">
                    <h2>${flashcard.word}</h2>
                    <p>${flashcard.definition}</p>
                </div>
            `;

      // Adiciona o event listener após inserir o HTML
      const cardElement = flashcardsContainer.querySelector(".flashcard");
      const result = document.getElementById("result");

      cardElement.addEventListener("click", () => {
        result.innerHTML = `
                <div>
                    <p>${flashcard.translation}</p>
                </div>
            `;
      });
    } else {
      flashcardsContainer.innerHTML = "<h2>No more flashcards!</h2>";
      //   nextButton.disabled = true;
    }
  }

  nextButton.addEventListener("click", () => {
    currentIndex++;
    if (currentIndex >= flashcards.length) {
      currentIndex = 0; // volta ao início
    }
    document.getElementById("result").innerHTML = ""; // limpa o resultado ao mudar de flashcard
    displayFlashcard();
  });

  loadFlashcards();
});
