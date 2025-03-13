import React, { useState } from 'react';
import './App.css';

function App() {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  // Funkcje pomocnicze
  const utilities = {
    // Funkcje matematyczne
    math: {
      add: (a, b) => a + b,
      subtract: (a, b) => a - b,
      multiply: (a, b) => a * b,
      divide: (a, b) => b !== 0 ? a / b : "Nie można dzielić przez zero",
      power: (a, b) => Math.pow(a, b),
      sqrt: (a) => a >= 0 ? Math.sqrt(a) : "Pierwiastek z liczby ujemnej nie jest liczbą rzeczywistą",
      percent: (a, b) => (a * b) / 100,
      average: (numbers) => numbers.reduce((a, b) => a + b, 0) / numbers.length,
      min: (numbers) => Math.min(...numbers),
      max: (numbers) => Math.max(...numbers)
    },

    // Funkcje do formatowania tekstu
    text: {
      countWords: (text) => text.trim().split(/\s+/).length,
      countChars: (text) => text.length,
      toUpper: (text) => text.toUpperCase(),
      toLower: (text) => text.toLowerCase(),
      capitalize: (text) => text.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ')
    },

    // Funkcje daty i czasu
    datetime: {
      getCurrentTime: () => {
        const now = new Date();
        return now.toLocaleTimeString('pl-PL');
      },
      getCurrentDate: () => {
        const now = new Date();
        return now.toLocaleDateString('pl-PL');
      },
      getDayOfWeek: () => {
        const days = ['niedziela', 'poniedziałek', 'wtorek', 'środa', 'czwartek', 'piątek', 'sobota'];
        return days[new Date().getDay()];
      }
    },

    // Konwersje jednostek
    convert: {
      kmToMiles: (km) => km * 0.621371,
      milesToKm: (miles) => miles * 1.60934,
      celsiusToFahrenheit: (celsius) => (celsius * 9/5) + 32,
      fahrenheitToCelsius: (fahrenheit) => (fahrenheit - 32) * 5/9,
      kgToLbs: (kg) => kg * 2.20462,
      lbsToKg: (lbs) => lbs * 0.453592
    },

    // Wikipedia API
    wiki: {
      search: async (query) => {
        try {
          // Wyszukiwanie artykułów
          const searchUrl = `https://pl.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&format=json&origin=*`;
          const searchResponse = await fetch(searchUrl);
          const searchData = await searchResponse.json();

          if (searchData.query.search.length === 0) {
            return "Przepraszam, nie znalazłem informacji na ten temat.";
          }

          // Pobieranie treści pierwszego znalezionego artykułu
          const pageId = searchData.query.search[0].pageid;
          const contentUrl = `https://pl.wikipedia.org/w/api.php?action=query&pageids=${pageId}&prop=extracts&exintro=true&format=json&origin=*`;
          const contentResponse = await fetch(contentUrl);
          const contentData = await contentResponse.json();

          const page = contentData.query.pages[pageId];
          const extract = page.extract
            .replace(/<\/?[^>]+(>|$)/g, "") // Usuń tagi HTML
            .substring(0, 500); // Ogranicz długość odpowiedzi

          return `${extract}...\n\nŹródło: https://pl.wikipedia.org/?curid=${pageId}`;
        } catch (error) {
          console.error('Błąd podczas pobierania danych z Wikipedii:', error);
          return "Przepraszam, wystąpił błąd podczas pobierania informacji z Wikipedii.";
        }
      }
    }
  };

  // Funkcja do rozpoznawania poleceń
  const parseCommand = async (text) => {
    text = text.toLowerCase().trim();

    // Wzorce matematyczne
    const mathPatterns = {
      add: /(\d+(?:\.\d+)?)\s*(\+|plus|dodać)\s*(\d+(?:\.\d+)?)/,
      subtract: /(\d+(?:\.\d+)?)\s*(\-|minus|odjąć)\s*(\d+(?:\.\d+)?)/,
      multiply: /(\d+(?:\.\d+)?)\s*(\*|x|razy|pomnożyć przez)\s*(\d+(?:\.\d+)?)/,
      divide: /(\d+(?:\.\d+)?)\s*(\:|\/|dzielić przez|podzielić przez)\s*(\d+(?:\.\d+)?)/,
      power: /(\d+(?:\.\d+)?)\s*(do potęgi|potęga)\s*(\d+(?:\.\d+)?)/,
      sqrt: /pierwiastek z\s*(\d+(?:\.\d+)?)/,
      percent: /(\d+(?:\.\d+)?)\s*procent z\s*(\d+(?:\.\d+)?)/,
      average: /średnia z (\d+(?:\.\d+)?(?:\s*[,i]?\s*\d+(?:\.\d+)?)+)/,
      min: /najmniejsza z (\d+(?:\.\d+)?(?:\s*[,i]?\s*\d+(?:\.\d+)?)+)/,
      max: /największa z (\d+(?:\.\d+)?(?:\s*[,i]?\s*\d+(?:\.\d+)?)+)/
    };

    // Wzorce konwersji
    const conversionPatterns = {
      kmToMiles: /przelicz (\d+(?:\.\d+)?)\s*km na mile/,
      milesToKm: /przelicz (\d+(?:\.\d+)?)\s*mil na kilometry/,
      celsiusToFahrenheit: /przelicz (\d+(?:\.\d+)?)\s*stopni celsjusza na fahrenheity/,
      fahrenheitToCelsius: /przelicz (\d+(?:\.\d+)?)\s*stopni fahrenheita na celsjusze/,
      kgToLbs: /przelicz (\d+(?:\.\d+)?)\s*kg na funty/,
      lbsToKg: /przelicz (\d+(?:\.\d+)?)\s*funtów na kilogramy/
    };

    // Wzorce tekstu
    const textPatterns = {
      wordCount: /policz słowa w "([^"]*)"/,
      charCount: /policz znaki w "([^"]*)"/,
      toUpper: /zamień na wielkie litery "([^"]*)"/,
      toLower: /zamień na małe litery "([^"]*)"/,
      capitalize: /zamień pierwsze litery na wielkie "([^"]*)"/
    };

    // Wzorce Wikipedii
    const wikiPatterns = {
      who: /kim (był|była|jest|są) ([^?]+)/,
      what: /co to (jest|był|była|były|są) ([^?]+)/,
      describe: /(opisz|opowiedz o) ([^?]+)/,
      info: /informacje o ([^?]+)/
    };

    // Sprawdź wzorce Wikipedii
    for (const [operation, pattern] of Object.entries(wikiPatterns)) {
      const match = text.match(pattern);
      if (match) {
        const query = match[2].trim();
        return await utilities.wiki.search(query);
      }
    }

    // Wzorce daty i czasu
    if (text.match(/która (jest )?godzina/)) {
      return `Aktualna godzina: ${utilities.datetime.getCurrentTime()}`;
    }
    if (text.match(/jaki (jest )?dzień/)) {
      return `Dzisiaj jest: ${utilities.datetime.getDayOfWeek()}, ${utilities.datetime.getCurrentDate()}`;
    }

    // Sprawdź wzorce matematyczne
    for (const [operation, pattern] of Object.entries(mathPatterns)) {
      const match = text.match(pattern);
      if (match) {
        if (['average', 'min', 'max'].includes(operation)) {
          const numbers = match[1].split(/(?:\s*[,i]?\s*)/).map(Number);
          const result = utilities.math[operation](numbers);
          return `Wynik: ${result}`;
        } else if (operation === 'sqrt') {
          const result = utilities.math[operation](Number(match[1]));
          return `Wynik: ${result}`;
        } else {
          const num1 = Number(match[1]);
          const num2 = Number(match[3]);
          const result = utilities.math[operation](num1, num2);
          return `Wynik: ${result}`;
        }
      }
    }

    // Sprawdź wzorce konwersji
    for (const [operation, pattern] of Object.entries(conversionPatterns)) {
      const match = text.match(pattern);
      if (match) {
        const value = Number(match[1]);
        const result = utilities.convert[operation](value);
        return `Wynik: ${result.toFixed(2)}`;
      }
    }

    // Sprawdź wzorce tekstu
    for (const [operation, pattern] of Object.entries(textPatterns)) {
      const match = text.match(pattern);
      if (match) {
        const text = match[1];
        const result = utilities.text[operation](text);
        return `Wynik: ${result}`;
      }
    }

    return null;
  };

  const generateResponse = async (prompt) => {
    try {
      console.log('Analizuję polecenie...');

      // Sprawdź, czy to konkretne polecenie
      const commandResult = await parseCommand(prompt);
      if (commandResult) {
        return commandResult;
      }

      const responses = {
        greeting: [
          "Witaj! Jestem asystentem, który może pomóc Ci w różnych zadaniach. Potrafię wykonywać obliczenia, konwersje jednostek, operacje na tekście i wyszukiwać informacje w Wikipedii.",
          "Dzień dobry! Chętnie pomogę w obliczeniach, konwersjach jednostek lub wyszukam informacje na interesujący Cię temat.",
          "Cześć! Jestem do Twojej dyspozycji. Powiedz, w czym mogę pomóc."
        ],
        help: [
          `Oto co potrafię:

1. Obliczenia matematyczne:
   - Podstawowe działania (np. "2 plus 3", "10 minus 5")
   - Potęgowanie (np. "2 do potęgi 3")
   - Pierwiastkowanie (np. "pierwiastek z 16")
   - Procenty (np. "50 procent z 200")
   - Średnia, minimum, maksimum (np. "średnia z 2, 4, 6")

2. Konwersje jednostek:
   - Kilometry na mile (np. "przelicz 10 km na mile")
   - Mile na kilometry (np. "przelicz 5 mil na kilometry")
   - Stopnie Celsjusza na Fahrenheity
   - Kilogramy na funty

3. Operacje na tekście:
   - Liczenie słów (np. "policz słowa w "To jest przykład"")
   - Liczenie znaków (np. "policz znaki w "Hello"")
   - Zmiana wielkości liter

4. Data i czas:
   - Aktualna godzina (np. "która godzina")
   - Aktualny dzień (np. "jaki dzień")

5. Wyszukiwanie informacji:
   - Pytania o osoby (np. "Kim był Mikołaj Kopernik?")
   - Pytania o pojęcia (np. "Co to jest fotosynteza?")
   - Prośby o opis (np. "Opisz Wawel")`,
          `Mogę Ci pomóc w następujących zadaniach:

1. Matematyka: działania arytmetyczne, potęgowanie, pierwiastkowanie, procenty
2. Konwersje: jednostki długości, wagi, temperatury
3. Tekst: liczenie słów/znaków, zmiana wielkości liter
4. Czas: aktualna godzina, data, dzień tygodnia
5. Wiedza: informacje z Wikipedii o osobach, miejscach, pojęciach

Wpisz "przykłady" aby zobaczyć przykładowe polecenia.`
        ],
        examples: [
          `Przykładowe polecenia:

1. Matematyka:
   - "2 plus 2"
   - "10 razy 5"
   - "pierwiastek z 16"
   - "średnia z 2, 4, 6"

2. Konwersje:
   - "przelicz 5 km na mile"
   - "przelicz 20 stopni celsjusza na fahrenheity"

3. Tekst:
   - "policz słowa w "To jest przykład""
   - "zamień na wielkie litery "hello world""

4. Czas:
   - "która godzina"
   - "jaki dzień"

5. Wyszukiwanie informacji:
   - "Kim był Fryderyk Chopin?"
   - "Co to jest DNA?"
   - "Opisz Morskie Oko"
   - "Informacje o Warszawie"`
        ],
        default: [
          "Przepraszam, nie rozumiem polecenia. Wpisz 'pomoc' aby zobaczyć listę dostępnych funkcji.",
          "Nie jestem pewien, co mam zrobić. Napisz 'przykłady' aby zobaczyć przykładowe polecenia.",
          "Przepraszam, ale nie rozpoznaję tego polecenia. Wpisz 'pomoc' aby zobaczyć, co potrafię zrobić."
        ]
      };

      const classifyMessage = (message) => {
        message = message.toLowerCase();
        
        if (message.match(/^(cześć|witaj|hej|dzień dobry|siema)/)) {
          return 'greeting';
        }
        
        if (message.match(/(pomoc|pomocy|help|co umiesz|jakie funkcje|co potrafisz)/)) {
          return 'help';
        }

        if (message.match(/(przykład|przykłady|pokaż przykłady)/)) {
          return 'examples';
        }
        
        return 'default';
      };

      const category = classifyMessage(prompt);
      const categoryResponses = responses[category];
      const randomIndex = Math.floor(Math.random() * categoryResponses.length);

      return categoryResponses[randomIndex];

    } catch (error) {
      console.error('Błąd:', error);
      return "Przepraszam, wystąpił błąd podczas przetwarzania polecenia. Spróbuj jeszcze raz.";
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (newMessage.trim()) {
      setMessages(prev => [...prev, { text: newMessage, sender: 'user' }]);
      const userMessage = newMessage;
      setNewMessage('');
      
      setIsTyping(true);

      try {
        const aiResponse = await generateResponse(userMessage);
        setMessages(prev => [...prev, { text: aiResponse, sender: 'ai' }]);
      } catch (error) {
        console.error('Błąd:', error);
        setMessages(prev => [...prev, { 
          text: "Przepraszam, wystąpił błąd. Spróbuj ponownie.", 
          sender: 'ai' 
        }]);
      } finally {
        setIsTyping(false);
      }
    }
  };

  return (
    <div className="chat-container">
      <div className="messages">
        {messages.map((message, index) => (
          <div key={index} className={`message ${message.sender}`}>
            {message.text}
          </div>
        ))}
        {isTyping && (
          <div className="message ai typing">
            Przetwarzam polecenie...
          </div>
        )}
      </div>
      <form onSubmit={handleSubmit} className="input-container">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Wpisz polecenie lub pytanie..."
          className="message-input"
        />
        <button type="submit" className="send-button">
          Wyślij
        </button>
      </form>
    </div>
  );
}

export default App;
