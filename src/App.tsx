import React, { useState, useEffect, useRef } from 'react';
import './App.css';
import DOMPurify from 'dompurify';

interface Message {
  text: string;
  sender: 'user' | 'bot';
}

interface BasicMathFunction {
  (a: number, b: number): number | string;
}

interface ArrayMathFunction {
  (numbers: number[]): number;
}

interface Utilities {
  math: {
    add: BasicMathFunction;
    subtract: BasicMathFunction;
    multiply: BasicMathFunction;
    divide: BasicMathFunction;
    power: BasicMathFunction;
    sqrt: (a: number) => number | string;
    percent: BasicMathFunction;
    average: ArrayMathFunction;
    min: ArrayMathFunction;
    max: ArrayMathFunction;
  };
  text: {
    countWords: (text: string) => number;
    countChars: (text: string) => number;
    toUpper: (text: string) => string;
    toLower: (text: string) => string;
    capitalize: (text: string) => string;
  };
  datetime: {
    getCurrentTime: () => string;
    getCurrentDate: () => string;
    getDayOfWeek: () => string;
  };
  convert: {
    kmToMiles: (km: number) => number;
    milesToKm: (miles: number) => number;
    celsiusToFahrenheit: (celsius: number) => number;
    fahrenheitToCelsius: (fahrenheit: number) => number;
    kgToLbs: (kg: number) => number;
    lbsToKg: (lbs: number) => number;
  };
  wiki: {
    search: (query: string) => Promise<string>;
  };
}

function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState<string>('');
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const MAX_MESSAGES = 50; // Limit historii czatu

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Funkcja do sanityzacji tekstu
  const sanitizeText = (text: string): string => {
    return DOMPurify.sanitize(text, { ALLOWED_TAGS: [] });
  };

  // Funkcje pomocnicze
  const utilities: Utilities = {
    // Funkcje matematyczne
    math: {
      add: (a: number, b: number) => a + b,
      subtract: (a: number, b: number) => a - b,
      multiply: (a: number, b: number) => a * b,
      divide: (a: number, b: number) => b !== 0 ? a / b : "Nie można dzielić przez zero",
      power: (a: number, b: number) => Math.pow(a, b),
      sqrt: (a: number) => a >= 0 ? Math.sqrt(a) : "Pierwiastek z liczby ujemnej nie jest liczbą rzeczywistą",
      percent: (a: number, b: number) => (a * b) / 100,
      average: (numbers: number[]) => numbers.reduce((sum, num) => sum + num, 0) / numbers.length,
      min: (numbers: number[]) => Math.min(...numbers),
      max: (numbers: number[]) => Math.max(...numbers)
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
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 sekund timeout

          const searchUrl = `https://pl.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&format=json&origin=*`;
          const searchResponse = await fetch(searchUrl, { signal: controller.signal });
          const searchData = await searchResponse.json();

          clearTimeout(timeoutId);

          if (!searchData?.query?.search?.length) {
            return "Przepraszam, nie znalazłem informacji na ten temat.";
          }

          const pageId = searchData.query.search[0].pageid;
          const contentUrl = `https://pl.wikipedia.org/w/api.php?action=query&pageids=${pageId}&prop=extracts&exintro=true&format=json&origin=*`;
          const contentResponse = await fetch(contentUrl, { signal: controller.signal });
          const contentData = await contentResponse.json();

          if (!contentData?.query?.pages?.[pageId]?.extract) {
            return "Przepraszam, nie udało się pobrać treści artykułu.";
          }

          const page = contentData.query.pages[pageId];
          const extract = page.extract
            .replace(/<\/?[^>]+(>|$)/g, "")
            .substring(0, 500);

          return `${extract}...\n\nŹródło: https://pl.wikipedia.org/?curid=${pageId}`;
        } catch (error: unknown) {
          if (error instanceof Error && error.name === 'AbortError') {
            return "Przepraszam, zapytanie przekroczyło limit czasu.";
          }
          console.error('Błąd podczas pobierania danych z Wikipedii:', error);
          return "Przepraszam, wystąpił błąd podczas pobierania informacji z Wikipedii.";
        }
      }
    }
  };

  // Funkcja do rozpoznawania poleceń
  const parseCommand = async (text: string): Promise<string> => {
    text = text.toLowerCase().trim();

    // Wzorce matematyczne
    const mathPatterns: { [key: string]: RegExp } = {
      add: /(\d+(?:\.\d+)?)\s*(\+|plus|dodać)\s*(\d+(?:\.\d+)?)/,
      subtract: /(\d+(?:\.\d+)?)\s*(-|minus|odjąć)\s*(\d+(?:\.\d+)?)/,
      multiply: /(\d+(?:\.\d+)?)\s*(\*|x|razy|pomnożyć przez)\s*(\d+(?:\.\d+)?)/,
      divide: /(\d+(?:\.\d+)?)\s*(:|\/|dzielić przez|podzielić przez)\s*(\d+(?:\.\d+)?)/,
      power: /(\d+(?:\.\d+)?)\s*(do potęgi|potęga)\s*(\d+(?:\.\d+)?)/,
      sqrt: /pierwiastek z\s*(\d+(?:\.\d+)?)/,
      percent: /(\d+(?:\.\d+)?)\s*procent z\s*(\d+(?:\.\d+)?)/,
      average: /średnia z (\d+(?:\.\d+)?(?:\s*[,i]?\s*\d+(?:\.\d+)?)+)/,
      min: /najmniejsza z (\d+(?:\.\d+)?(?:\s*[,i]?\s*\d+(?:\.\d+)?)+)/,
      max: /największa z (\d+(?:\.\d+)?(?:\s*[,i]?\s*\d+(?:\.\d+)?)+)/
    };

    // Wzorce konwersji
    const conversionPatterns: { [key: string]: RegExp } = {
      kmToMiles: /przelicz (\d+(?:\.\d+)?)\s*km na mile/,
      milesToKm: /przelicz (\d+(?:\.\d+)?)\s*mil na kilometry/,
      celsiusToFahrenheit: /przelicz (\d+(?:\.\d+)?)\s*stopni celsjusza na fahrenheity/,
      fahrenheitToCelsius: /przelicz (\d+(?:\.\d+)?)\s*stopni fahrenheita na celsjusze/,
      kgToLbs: /przelicz (\d+(?:\.\d+)?)\s*kg na funty/,
      lbsToKg: /przelicz (\d+(?:\.\d+)?)\s*funtów na kilogramy/
    };

    // Wzorce tekstu
    const textPatterns: { [key: string]: RegExp } = {
      wordCount: /policz słowa w "([^"]*)"/,
      charCount: /policz znaki w "([^"]*)"/,
      toUpper: /zamień na wielkie litery "([^"]*)"/,
      toLower: /zamień na małe litery "([^"]*)"/,
      capitalize: /zamień pierwsze litery na wielkie "([^"]*)"/
    };

    // Wzorce Wikipedii
    const wikiPatterns: { [key: string]: RegExp } = {
      who: /kim (był|była|jest|są) ([^?]+)/,
      what: /co to (jest|był|była|były|są) ([^?]+)/,
      describe: /(opisz|opowiedz o) ([^?]+)/,
      info: /informacje o ([^?]+)/,
      general: /(jak|dlaczego|kiedy|gdzie|po co|w jaki sposób|jakie|jaki|jaka|czym|kto) ([^?]+)/
    };

    // Sprawdź wzorce Wikipedii
    for (const [operation, pattern] of Object.entries(wikiPatterns)) {
      const match = text.match(pattern);
      if (match) {
        const query = operation === 'general' ? text : match[2].trim();
        return await utilities.wiki.search(query);
      }
    }

    // Sprawdź wzorce matematyczne
    for (const [operation, pattern] of Object.entries(mathPatterns)) {
      const match = text.match(pattern);
      if (match) {
        if (['average', 'min', 'max'].includes(operation)) {
          const numbers = match[1].split(/(?:\s*[,i]?\s*)/).map(Number);
          const mathFunction = utilities.math[operation as keyof typeof utilities.math] as ArrayMathFunction;
          const result = mathFunction(numbers);
          return `Wynik: ${result}`;
        } else if (operation === 'sqrt') {
          const result = utilities.math.sqrt(Number(match[1]));
          return `Wynik: ${result}`;
        } else {
          const num1 = Number(match[1]);
          const num2 = Number(match[3]);
          const mathFunction = utilities.math[operation as keyof typeof utilities.math] as BasicMathFunction;
          const result = mathFunction(num1, num2);
          return `Wynik: ${result}`;
        }
      }
    }

    // Sprawdź wzorce konwersji
    for (const [operation, pattern] of Object.entries(conversionPatterns)) {
      const match = text.match(pattern);
      if (match) {
        const value = Number(match[1]);
        const result = utilities.convert[operation as keyof typeof utilities.convert](value);
        return `Wynik: ${result.toFixed(2)}`;
      }
    }

    // Sprawdź wzorce tekstu
    for (const [operation, pattern] of Object.entries(textPatterns)) {
      const match = text.match(pattern);
      if (match) {
        const text = match[1];
        const result = utilities.text[operation as keyof typeof utilities.text](text);
        return `Wynik: ${result}`;
      }
    }

    // Wzorce daty i czasu
    if (text.match(/która (jest )?godzina/)) {
      return `Aktualna godzina: ${utilities.datetime.getCurrentTime()}`;
    }
    if (text.match(/jaki (jest )?dzień/)) {
      return `Dzisiaj jest: ${utilities.datetime.getDayOfWeek()}, ${utilities.datetime.getCurrentDate()}`;
    }

    // Jeśli żaden wzorzec nie pasuje, wyszukaj w Wikipedii
    return await utilities.wiki.search(text);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const sanitizedMessage = sanitizeText(newMessage.trim());
    if (sanitizedMessage) {
      setMessages(prev => [...prev.slice(-MAX_MESSAGES + 1), { text: sanitizedMessage, sender: 'user' }]);
      setNewMessage('');
      setIsTyping(true);

      try {
        const response = await parseCommand(sanitizedMessage);
        setMessages(prev => [...prev.slice(-MAX_MESSAGES + 1), { text: response, sender: 'bot' }]);
      } catch (error) {
        setMessages(prev => [...prev.slice(-MAX_MESSAGES + 1), { text: "Przepraszam, wystąpił błąd podczas przetwarzania zapytania.", sender: 'bot' }]);
      }

      setIsTyping(false);
    }
  };

  return (
    <div className="App">
      <div className="chat-container">
        <div className="messages">
          {messages.map((message, index) => (
            <div key={index} className={`message ${message.sender}`}>
              {message.text}
            </div>
          ))}
          {isTyping && (
            <div className="message bot typing">
              Przetwarzam...
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
        <form onSubmit={handleSubmit} className="input-form">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Napisz wiadomość..."
            maxLength={1000}
          />
          <button type="submit" disabled={isTyping}>Wyślij</button>
        </form>
      </div>
    </div>
  );
}

export default App;
