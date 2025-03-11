import React, { useState } from 'react';
import './App.css';

function App() {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const simulateAIResponse = (userMessage) => {
    const responses = [
      "To ciekawe pytanie. Pozwól, że wyjaśnię...",
      "Rozumiem twoje pytanie. Oto odpowiedź...",
      "Dziękuję za pytanie. Postaram się pomóc...",
      "Interesujący temat. Oto co wiem na ten temat...",
      "Pozwól, że przedstawię to w jasny sposób..."
    ];
    
    const randomResponse = responses[Math.floor(Math.random() * responses.length)] +
      " Twoja wiadomość brzmiała: " + userMessage;
    
    setIsTyping(true);
    
    // Symulacja opóźnienia odpowiedzi jak w ChatGPT
    setTimeout(() => {
      setMessages(prev => [...prev, { text: randomResponse, sender: 'ai' }]);
      setIsTyping(false);
    }, 1500);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (newMessage.trim()) {
      // Dodaj wiadomość użytkownika
      setMessages([...messages, { text: newMessage, sender: 'user' }]);
      const userMessage = newMessage;
      setNewMessage('');
      
      // Generuj odpowiedź AI
      simulateAIResponse(userMessage);
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
            AI pisze...
          </div>
        )}
      </div>
      <form onSubmit={handleSubmit} className="input-container">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Napisz wiadomość..."
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
