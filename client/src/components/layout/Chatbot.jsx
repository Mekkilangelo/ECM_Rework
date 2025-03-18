import React, { useState, useRef, useEffect } from 'react';

const Chatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { type: 'bot', content: 'Bonjour, je suis DB Sentinel. Comment puis-je vous aider?' }
  ]);
  const [userInput, setUserInput] = useState('');
  const [threshold, setThreshold] = useState(90);
  const chatboxRef = useRef(null);

  // Faire défiler automatiquement vers le bas lorsque de nouveaux messages sont ajoutés
  useEffect(() => {
    if (chatboxRef.current) {
      chatboxRef.current.scrollTop = chatboxRef.current.scrollHeight;
    }
  }, [messages]);

  const toggleChatbot = () => {
    setIsOpen(!isOpen);
  };

  const handleUserInput = (e) => {
    setUserInput(e.target.value);
  };

  const handleThresholdChange = (e) => {
    setThreshold(e.target.value);
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    
    if (userInput.trim() === '') return;

    // Ajouter le message de l'utilisateur
    const updatedMessages = [...messages, { type: 'user', content: userInput }];
    setMessages(updatedMessages);
    setUserInput('');

    // Simuler une réponse du chatbot (à remplacer par l'API réelle)
    setTimeout(() => {
      setMessages([
        ...updatedMessages,
        { 
          type: 'bot', 
          content: `Je suis désolé, je suis encore en développement. Le seuil de pertinence est actuellement défini à ${threshold}%.` 
        }
      ]);
    }, 1000);
  };

  return (
    <>
      {/* Icône de chatbot flottant */}
      <div id="chatbot-icon" style={{ display: isOpen ? 'none' : 'block' }}>
        <button className="btn btn-warning" id="chatbot-toggle" onClick={toggleChatbot}>
          <i className="fas fa-comment-dots"></i>
        </button>
      </div>

      {/* Fenêtre du Chatbot */}
      <div id="chatbot-window" className={`chatbot-window ${isOpen ? 'open' : ''}`}>
        <div className="chatbot-container">
          <div className="chat-header">
            <h4 className="m-0"><i className="fas fa-comments mr-2"></i> Parlez avec DB Sentinel</h4>
            <button 
              type="button" 
              className="close close-btn" 
              id="close-chatbot" 
              aria-label="Fermer"
              onClick={toggleChatbot}
            >
              <span aria-hidden="true">&times;</span>
            </button>
          </div>
          <div id="chatbox" ref={chatboxRef}>
            {messages.map((msg, index) => (
              <div key={index} className={`message ${msg.type}-message`}>
                <div className="message-content">{msg.content}</div>
              </div>
            ))}
          </div>
          <div className="chat-footer">
            <div className="threshold-container">
              <label htmlFor="relevance-threshold">Seuil de pertinence:</label>
              <div className="threshold-input-wrapper">
                <input 
                  type="range" 
                  id="relevance-threshold" 
                  min="10" 
                  max="100" 
                  value={threshold} 
                  onChange={handleThresholdChange}
                  step="5"
                />
                <span id="threshold-value">{threshold}%</span>
              </div>
            </div>
            <form className="chat-input-container" onSubmit={handleSendMessage}>
              <input 
                type="text" 
                id="user-input" 
                className="form-control" 
                placeholder="Tapez un message..." 
                value={userInput}
                onChange={handleUserInput}
                autoFocus
              />
              <button 
                id="send-message" 
                className="btn" 
                type="submit"
              >
                Envoyer
              </button>
            </form>
          </div>
        </div>
      </div>
    </>
  );
};

export default Chatbot;