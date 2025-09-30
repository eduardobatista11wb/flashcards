class FlashcardApp {
  constructor() {
    this.allFlashcards = [];
    this.flashcards = [];
    this.currentIndex = 0;
    this.currentLanguage = "english";
    this.currentCategory = "all";
    this.isFlipped = false;
    this.studiedCards = new Set();
    this.categoryStudiedCards = new Map();

    // Sistema de internacionalização
    this.currentUILanguage = localStorage.getItem("uiLanguage") || "pt";
    this.translations = {};

    // Sistema de definições localizadas
    this.definitions = {
      pt: {},
      en: {},
      id: {},
    };

    // Sistema de categorias localizadas
    this.categoryTranslations = {
      pt: {},
      en: {},
      id: {},
    };

    this.loadTranslations().then(() => {
      this.loadDefinitions().then(() => {
        this.loadCategoryTranslations().then(() => {
          this.initializeElements();
          this.bindEvents();
          this.loadFlashcards();
          this.updateUI();
        });
      });
    });
  }

  // Carregar traduções
  async loadTranslations() {
    try {
      const response = await fetch(
        `translations/${this.currentUILanguage}.json`
      );
      this.translations = await response.json();
    } catch (error) {
      console.error("Erro ao carregar traduções:", error);
      this.translations = {};
    }
  }

  t(key) {
    const keys = key.split(".");
    let value = this.translations;

    for (const k of keys) {
      if (value && typeof value === "object" && k in value) {
        value = value[k];
      } else {
        return key;
      }
    }

    return value;
  }

  // Carregar definições localizadas
  async loadDefinitions() {
    try {
      const languages = ["pt", "en", "id"];
      for (const lang of languages) {
        const response = await fetch(`data/definitions/${lang}.json`);
        if (response.ok) {
          this.definitions[lang] = await response.json();
        }
      }
    } catch (error) {
      console.error("Erro ao carregar definições:", error);
    }
  }

  // Carregar traduções de categorias
  async loadCategoryTranslations() {
    try {
      const languages = ["pt", "en", "id"];
      for (const lang of languages) {
        const response = await fetch(`data/categories/${lang}.json`);
        if (response.ok) {
          this.categoryTranslations[lang] = await response.json();
        }
      }
    } catch (error) {
      console.error("Erro ao carregar traduções de categorias:", error);
    }
  }

  // Obter definição localizada
  getLocalizedDefinition(word, originalDefinition) {
    const definitions = this.definitions[this.currentUILanguage];
    return definitions && definitions[word]
      ? definitions[word]
      : originalDefinition;
  }

  // Obter categoria localizada
  getLocalizedCategory(category, originalCategory) {
    const categoryTranslations =
      this.categoryTranslations[this.currentUILanguage];
    return categoryTranslations && categoryTranslations[category]
      ? categoryTranslations[category]
      : originalCategory;
  }

  // Atualizar idioma da interface
  async changeUILanguage(language) {
    this.currentUILanguage = language;
    localStorage.setItem("uiLanguage", language);
    await this.loadTranslations();
    await this.loadDefinitions();
    await this.loadCategoryTranslations();
    this.updateUI();
    // Força atualização das categorias após mudança de idioma
    this.updateCategoryOptionsWithTranslations();
    // Atualizar também o select de idioma dos flashcards com as novas traduções
    this.updateLanguageSelector();
    this.displayFlashcard();
  }

  // Atualizar toda a interface com as traduções
  updateUI() {
    // Atualizar título da página
    document.title = `${this.t("app.title")} - ${this.t("app.subtitle")}`;

    // Atualizar elementos da interface
    const elements = {
      "language-selector": this.t("interface.language"),
      "category-selector": this.t("interface.category"),
      "shuffle-button": this.t("interface.shuffle"),
      "prev-button": this.t("interface.previous"),
      "next-button": this.t("interface.next"),
      "flip-button": this.t("interface.showWordAgain"),
      "feedback-section": this.t("feedback.title"),
    };

    Object.entries(elements).forEach(([id, text]) => {
      const element = document.getElementById(id);
      if (element) {
        if (element.tagName === "BUTTON" || element.tagName === "SELECT") {
          element.textContent = text;
        } else {
          element.innerHTML = text;
        }
      }
    });

    // Atualizar labels específicas
    const languageLabel = document.querySelector(
      'label[for="language-select"]'
    );
    if (languageLabel) {
      languageLabel.textContent = this.t("interface.language");
    }

    const categoryLabel = document.querySelector(
      'label[for="category-select"]'
    );
    if (categoryLabel) {
      categoryLabel.textContent = this.t("interface.category");
    }

    // Atualizar seletor de idioma da UI
    const uiLanguageSelector = document.getElementById("ui-language-select");
    if (uiLanguageSelector) {
      uiLanguageSelector.value = this.currentUILanguage;
    }

    // Atualizar opções de categoria com traduções - SEMPRE após mudança de idioma
    this.updateCategoryOptionsWithTranslations();

    // Atualizar também o seletor de idioma dos flashcards
    this.updateLanguageSelector();

    // Atualizar estatísticas com traduções
    this.updateStats();
  }

  updateCategoryOptionsWithTranslations() {
    const categorySelector = document.getElementById("category-selector");
    if (!categorySelector) return;

    // Salvar categoria atual
    const currentCategory = categorySelector.value;

    // Limpar opções existentes
    categorySelector.innerHTML = "";

    // Adicionar opção "Todas"
    const allOption = document.createElement("option");
    allOption.value = "all";
    allOption.textContent = this.t("interface.allCategories");
    categorySelector.appendChild(allOption);

    // Obter categorias únicas
    const categories = [
      ...new Set(
        this.allFlashcards.map((card) => card.category).filter(Boolean)
      ),
    ];

    // Adicionar opções de categoria com traduções
    categorySelector.innerHTML = `<option value="all">${this.t(
      "interface.allCategories"
    )}</option>`;

    categories.forEach((category) => {
      const option = document.createElement("option");
      option.value = category;
      option.textContent = this.getLocalizedCategory(category, category);
      categorySelector.appendChild(option);
    });

    // Restaurar categoria selecionada
    categorySelector.value = currentCategory;
  }

  initializeElements() {
    this.elements = {
      flashcard: document.getElementById("flashcard"),
      word: document.getElementById("word"),
      definition: document.getElementById("definition"),
      translation: document.getElementById("translation"),
      category: document.getElementById("category"),
      languageSelector: document.getElementById("language-select"),
      uiLanguageSelector: document.getElementById("ui-language-select"),
      categorySelector: document.getElementById("category-select"),
      shuffleButton: document.getElementById("shuffle-button"),
      prevButton: document.getElementById("prev-button"),
      nextButton: document.getElementById("next-button"),
      flipButton: document.getElementById("flip-button"),
      progress: document.getElementById("progress-fill"),
      cardCounter: document.getElementById("progress-text"),
      totalCards: document.getElementById("total-cards"),
      studiedCards: document.getElementById("studied-cards"),
      categoryProgress: document.getElementById("category-progress"),
      difficultyButtons: document.querySelectorAll(".difficulty-btn"),
    };
  }

  bindEvents() {
    // Seletor de idioma dos flashcards
    this.elements.languageSelector?.addEventListener("change", (e) => {
      this.currentLanguage = e.target.value;
      this.loadFlashcards();
    });

    // Seletor de idioma da interface
    this.elements.uiLanguageSelector?.addEventListener("change", (e) => {
      this.changeUILanguage(e.target.value);
    });

    // Seletor de categoria
    this.elements.categorySelector?.addEventListener("change", () => {
      this.filterByCategory();
    });

    // Botões de navegação
    this.elements.shuffleButton?.addEventListener("click", () => {
      this.shuffleCards();
    });

    this.elements.prevButton?.addEventListener("click", () => {
      this.prevCard();
    });

    this.elements.nextButton?.addEventListener("click", () => {
      this.nextCard();
    });

    this.elements.flipButton?.addEventListener("click", () => {
      this.flipCard();
    });

    // Clique no flashcard para virar
    this.elements.flashcard?.addEventListener("click", () => {
      this.flipCard();
    });

    // Botões de dificuldade
    this.elements.difficultyButtons?.forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const difficulty = e.target.dataset.difficulty;
        this.saveFeedback(difficulty);
      });
    });

    // Teclas de atalho
    document.addEventListener("keydown", (e) => {
      if (e.code === "Space") {
        e.preventDefault();
        this.flipCard();
      } else if (e.code === "ArrowLeft") {
        e.preventDefault();
        this.prevCard();
      } else if (e.code === "ArrowRight") {
        e.preventDefault();
        this.nextCard();
      }
    });
  }

  async loadFlashcards() {
    try {
      this.showLoading(true);

      let filename;
      switch (this.currentLanguage) {
        case "english":
          filename = "english.json";
          break;
        case "portuguese":
          filename = "portuguese-to-english.json";
          break;
        case "indonesian":
          filename = "indonesian.json";
          break;
        case "portuguese-to-indonesian":
          filename = "portuguese-to-indonesian.json";
          break;
        case "indonesian-to-portuguese":
          filename = "indonesian-to-portuguese.json";
          break;
        default:
          filename = "english.json";
      }

      const response = await fetch(`data/${filename}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      this.allFlashcards = await response.json();
      this.filterByCategory();
      this.updateCategoryOptions();
      this.updateCategoryOptionsWithTranslations();
    } catch (error) {
      console.error("Erro ao carregar flashcards:", error);
      this.showError(this.t("errors.loadFailed"));
    } finally {
      this.showLoading(false);
    }
  }

  updateCategoryOptions() {
    const categorySelector = this.elements.categorySelector;
    const currentCategory = categorySelector.value;

    const categories = [
      ...new Set(
        this.allFlashcards.map((card) => card.category).filter(Boolean)
      ),
    ];

    categorySelector.innerHTML = `<option value="all">${this.t(
      "interface.allCategories"
    )}</option>`;

    categories.forEach((category) => {
      const option = document.createElement("option");
      option.value = category;
      option.textContent = this.getCategoryIcon(category) + " " + category;
      categorySelector.appendChild(option);
    });

    categorySelector.value = currentCategory;
  }

  getCategoryIcon(category) {
    const icons = {
      Pronomes: "👤",
      Adjetivos: "🎨",
      Verbos: "⚡",
      Substantivos: "📦",
      Advérbios: "🔄",
      Preposições: "🔗",
      Conjunções: "🤝",
      Interjeições: "❗",
      Artigos: "📄",
      Numerais: "🔢",
      "Possessive Adjectives": "🏠",
      "Personal Pronouns": "👥",
      "Demonstrative Pronouns": "👉",
      "Interrogative Pronouns": "❓",
      "Relative Pronouns": "🔗",
      "Indefinite Pronouns": "❔",
      "Reflexive Pronouns": "🪞",
      "Reciprocal Pronouns": "🤝",
      "Intensive Pronouns": "💪",
      "Distributive Pronouns": "📊",
    };
    return icons[category] || "📚";
  }

  filterByCategory() {
    const selectedCategory = this.elements.categorySelector?.value || "all";
    this.currentCategory = selectedCategory;

    if (selectedCategory === "all") {
      this.flashcards = [...this.allFlashcards];
    } else {
      this.flashcards = this.allFlashcards.filter(
        (card) => card.category === selectedCategory
      );
    }

    this.currentIndex = 0;
    this.updateCategoryInfo();
    this.displayFlashcard();
    this.updateProgress();
    this.updateStats();
  }

  updateCategoryInfo() {
    const categoryInfo = document.getElementById("category-info");
    if (categoryInfo && this.flashcards.length > 0) {
      const category =
        this.currentCategory === "all"
          ? this.t("interface.allCategories")
          : this.getLocalizedCategory(
              this.currentCategory,
              this.currentCategory
            );
      const icon =
        this.currentCategory === "all"
          ? "📚"
          : this.getCategoryIcon(this.currentCategory);
      categoryInfo.innerHTML = `${icon} ${category}`;

      // Atualizar contador de palavras
      const categoryCount = document.getElementById("category-count");
      if (categoryCount) {
        categoryCount.textContent = `${this.flashcards.length} ${this.t(
          "interface.words"
        )}`;
      }
    }
  }

  getCategoryTranslationKey(category) {
    const categoryMap = {
      // Categorias em português
      "Pronomes Pessoais": "categories.personalPronouns",
      "Pronomes Possessivos": "categories.possessivePronouns",
      "Pronomes Demonstrativos": "categories.demonstrativePronouns",
      Pronomes: "categories.pronouns",
      Números: "categories.numbers",
      Adjetivos: "categories.adjectives",
      "Advérbios de Tempo": "categories.timeAdverbs",
      "Advérbios de Frequência": "categories.frequencyAdverbs",
      "Advérbios de Lugar": "categories.placeAdverbs",
      "Advérbios de Modo": "categories.mannerAdverbs",
      Substantivos: "categories.nouns",
      "Substantivos comuns": "categories.commonNouns",
      "Verbos Essenciais": "categories.essentialVerbs",
      "Verbos mais comuns": "categories.mostCommonVerbs",
      "Verbos de Movimento": "categories.movementVerbs",
      "Verbos de Comunicação": "categories.communicationVerbs",
      "Verbos de Percepção": "categories.perceptionVerbs",
      "Verbos Mentais": "categories.mentalVerbs",
      "Verbos de Ação": "categories.actionVerbs",
      Preposições: "categories.prepositions",
      Conjunções: "categories.conjunctions",
      Artigos: "categories.articles",
      "Artigos e preposições": "categories.articlesAndPrepositions",
      "Conectores e auxiliares": "categories.connectorsAndAuxiliaries",
      Casa: "categories.house",
      Família: "categories.family",
      Cores: "categories.colors",
      Comida: "categories.food",
      Tempo: "categories.weather",
      Emoções: "categories.emotions",

      // Categorias em inglês
      "Personal Pronouns": "categories.personalPronouns",
      "Possessive Pronouns": "categories.possessivePronouns",
      "Demonstrative Pronouns": "categories.demonstrativePronouns",
      Pronouns: "categories.pronouns",
      Numbers: "categories.numbers",
      Adjectives: "categories.adjectives",
      "Time Adverbs": "categories.timeAdverbs",
      "Frequency Adverbs": "categories.frequencyAdverbs",
      "Place Adverbs": "categories.placeAdverbs",
      "Manner Adverbs": "categories.mannerAdverbs",
      Nouns: "categories.nouns",
      "Common Nouns": "categories.commonNouns",
      "Essential Verbs": "categories.essentialVerbs",
      "Most Common Verbs": "categories.mostCommonVerbs",
      "Movement Verbs": "categories.movementVerbs",
      "Communication Verbs": "categories.communicationVerbs",
      "Perception Verbs": "categories.perceptionVerbs",
      "Mental Verbs": "categories.mentalVerbs",
      "Action Verbs": "categories.actionVerbs",
      Prepositions: "categories.prepositions",
      Conjunctions: "categories.conjunctions",
      Articles: "categories.articles",
      "Articles and Prepositions": "categories.articlesAndPrepositions",
      "Connectors and Auxiliaries": "categories.connectorsAndAuxiliaries",
      Home: "categories.house",
      Family: "categories.family",
      Colors: "categories.colors",
      Food: "categories.food",
      Weather: "categories.weather",
      Emotions: "categories.emotions",

      // Categorias em indonésio
      "Kata Ganti Orang": "categories.personalPronouns",
      "Kata Ganti Kepunyaan": "categories.possessivePronouns",
      "Kata Ganti Penunjuk": "categories.demonstrativePronouns",
      "Kata Ganti": "categories.pronouns",
      Angka: "categories.numbers",
      "Kata Sifat": "categories.adjectives",
      "Kata Keterangan Waktu": "categories.timeAdverbs",
      "Kata Keterangan Frekuensi": "categories.frequencyAdverbs",
      "Kata Keterangan Tempat": "categories.placeAdverbs",
      "Kata Keterangan Cara": "categories.mannerAdverbs",
      "Kata Benda": "categories.nouns",
      "Kata Benda Umum": "categories.commonNouns",
      "Kata Kerja Penting": "categories.essentialVerbs",
      "Kata Kerja Paling Umum": "categories.mostCommonVerbs",
      "Kata Kerja Gerakan": "categories.movementVerbs",
      "Kata Kerja Komunikasi": "categories.communicationVerbs",
      "Kata Kerja Persepsi": "categories.perceptionVerbs",
      "Kata Kerja Mental": "categories.mentalVerbs",
      "Kata Kerja Aksi": "categories.actionVerbs",
      "Kata Depan": "categories.prepositions",
      "Kata Sambung": "categories.conjunctions",
      Artikel: "categories.articles",
      "Artikel dan Kata Depan": "categories.articlesAndPrepositions",
      "Penghubung dan Pembantu": "categories.connectorsAndAuxiliaries",
      Rumah: "categories.house",
      Keluarga: "categories.family",
      Warna: "categories.colors",
      Makanan: "categories.food",
      Cuaca: "categories.weather",
      Emosi: "categories.emotions",
    };

    return categoryMap[category] || "categories.other";
  }

  displayFlashcard() {
    if (this.flashcards.length === 0) {
      this.elements.word.textContent = this.t("errors.noCards");
      this.elements.definition.textContent = "";
      this.elements.translation.textContent = "";
      this.elements.category.textContent = "";
      return;
    }

    const card = this.flashcards[this.currentIndex];

    // Reset flip state
    this.isFlipped = false;
    this.elements.flashcard.classList.remove("flipped");

    // Palavra permanece no idioma original
    this.elements.word.textContent = card.word;

    // Definição traduzida baseada no idioma da interface
    this.elements.definition.textContent = this.getLocalizedDefinition(
      card.word,
      card.definition
    );

    // Tradução permanece no idioma original
    this.elements.translation.textContent = card.translation;

    // Categoria traduzida baseada no idioma da interface
    if (card.category) {
      this.elements.category.textContent = this.getLocalizedCategory(
        card.category,
        card.category
      );
      this.elements.category.setAttribute("data-category", card.category);
      this.elements.category.style.display = "inline-block";
    } else {
      this.elements.category.style.display = "none";
    }

    // Update progress
    this.updateProgress();

    // Update navigation buttons
    this.elements.prevButton.disabled = this.currentIndex === 0;
    this.elements.nextButton.disabled =
      this.currentIndex === this.flashcards.length - 1;

    // Load saved feedback
    this.loadFeedback();

    // Add animation
    this.elements.flashcard.style.animation = "none";
    setTimeout(() => {
      this.elements.flashcard.style.animation = "fadeIn 0.5s ease-out";
    }, 10);
  }

  showError(message) {
    const errorDiv = document.createElement("div");
    errorDiv.className = "error-message";
    errorDiv.textContent = message;
    document.body.appendChild(errorDiv);

    setTimeout(() => {
      errorDiv.remove();
    }, 5000);
  }

  shuffleCards() {
    for (let i = this.flashcards.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.flashcards[i], this.flashcards[j]] = [
        this.flashcards[j],
        this.flashcards[i],
      ];
    }

    this.currentIndex = 0;
    this.displayFlashcard();

    // Feedback visual
    this.elements.shuffleButton.innerHTML =
      '<i class="fas fa-check"></i> ' + this.t("interface.shuffled");
    setTimeout(() => {
      this.elements.shuffleButton.innerHTML =
        '<i class="fas fa-random"></i> ' + this.t("interface.shuffle");
    }, 1500);
  }

  flipCard() {
    this.isFlipped = !this.isFlipped;
    this.elements.flashcard.classList.toggle("flipped");

    if (this.isFlipped) {
      this.studiedCards.add(this.currentIndex);
      this.updateStats();
    }
  }

  nextCard() {
    if (this.currentIndex < this.flashcards.length - 1) {
      this.currentIndex++;
      this.displayFlashcard();
      this.updateStats();
    }
  }

  prevCard() {
    if (this.currentIndex > 0) {
      this.currentIndex--;
      this.displayFlashcard();
      this.updateStats();
    }
  }

  updateProgress() {
    if (this.elements.progress && this.elements.cardCounter) {
      const progress = ((this.currentIndex + 1) / this.flashcards.length) * 100;
      this.elements.progress.style.width = `${progress}%`;
      this.elements.cardCounter.textContent = `${this.currentIndex + 1} / ${
        this.flashcards.length
      }`;
    }
    this.updateStats();
  }

  updateStats() {
    // Atualizar Total de Cards
    if (this.elements.totalCards) {
      this.elements.totalCards.textContent = this.allFlashcards.length;
    }

    // Atualizar Cards Estudados
    if (this.elements.studiedCards) {
      this.elements.studiedCards.textContent = this.studiedCards.size;
    }

    // Atualizar Progresso da Categoria
    if (this.elements.categoryProgress) {
      const categoryStudied = Array.from(this.studiedCards).filter((index) => {
        const card = this.allFlashcards[index];
        return (
          this.currentCategory === "all" ||
          card?.category === this.currentCategory
        );
      }).length;

      const categoryTotal = this.flashcards.length;
      const progressPercentage =
        categoryTotal > 0
          ? Math.round((categoryStudied / categoryTotal) * 100)
          : 0;

      this.elements.categoryProgress.textContent = `${progressPercentage}%`;
    }

    // Atualizar labels das estatísticas com traduções
    const statLabels = document.querySelectorAll(".stat-label");
    if (statLabels.length >= 3) {
      statLabels[0].textContent = this.t("stats.totalCards");
      statLabels[1].textContent = this.t("stats.studied");
      statLabels[2].textContent = this.t("stats.categoryProgress");
    }
  }

  saveFeedback(difficulty) {
    const cardId = `${this.currentLanguage}-${this.currentIndex}`;
    const feedback = {
      difficulty,
      timestamp: Date.now(),
      word: this.flashcards[this.currentIndex].word,
    };

    localStorage.setItem(`feedback-${cardId}`, JSON.stringify(feedback));
    this.loadFeedback();
  }

  loadFeedback() {
    const cardId = `${this.currentLanguage}-${this.currentIndex}`;
    const feedback = localStorage.getItem(`feedback-${cardId}`);

    this.elements.difficultyButtons?.forEach((btn) => {
      btn.classList.remove("selected");
    });

    if (feedback) {
      const data = JSON.parse(feedback);
      const selectedBtn = document.querySelector(
        `[data-difficulty="${data.difficulty}"]`
      );
      selectedBtn?.classList.add("selected");
    }
  }

  showLoading(show) {
    const loader = document.getElementById("loader");
    if (loader) {
      loader.style.display = show ? "block" : "none";
    }
  }

  updateLanguageSelector() {
    const languageSelector = this.elements.languageSelector;
    const currentLanguage = languageSelector.value;

    // Limpar opções existentes
    languageSelector.innerHTML = "";

    // Adicionar opções de idioma com traduções atualizadas
    const languageOptions = [
      {
        value: "english",
        flag: "🇺🇸",
        text: this.t("languages.englishToPortuguese"),
      },
      {
        value: "indonesian",
        flag: "🇮🇩",
        text: this.t("languages.indonesianToPortuguese"),
      },
      {
        value: "portuguese-to-english",
        flag: "🇧🇷",
        text: this.t("languages.portugueseToEnglish"),
      },
      {
        value: "portuguese-to-indonesian",
        flag: "🇧🇷",
        text: this.t("languages.portugueseToIndonesian"),
      },
    ];

    languageOptions.forEach((option) => {
      const optionElement = document.createElement("option");
      optionElement.value = option.value;
      optionElement.textContent = `${option.flag} ${option.text}`;
      languageSelector.appendChild(optionElement);
    });

    // Restaurar o idioma selecionado
    languageSelector.value = currentLanguage;
  }
}

// Inicializar aplicação
document.addEventListener("DOMContentLoaded", () => {
  new FlashcardApp();
});

// Salvar progresso antes de sair
window.addEventListener("beforeunload", () => {
  // Salvar estado atual se necessário
});
