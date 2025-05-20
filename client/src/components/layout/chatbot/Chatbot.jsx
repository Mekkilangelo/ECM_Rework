import React, { useState, useRef, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCommentDots, faComments, faTimes } from '@fortawesome/free-solid-svg-icons';
import chatbotService from '../../../services/chatbotService';
import '../../../styles/chatbot.css';

const Chatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { type: 'bot', content: 'Bonjour, je suis DB Sentinel. Comment puis-je vous aider?' }
  ]);
  const [userInput, setUserInput] = useState('');
  const [threshold, setThreshold] = useState(80);
  const [isTyping, setIsTyping] = useState(false);
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
    setThreshold(Number(e.target.value));
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSendMessage(e);
    }
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    
    if (userInput.trim() === '') return;

    // Ajouter le message de l'utilisateur
    const updatedMessages = [...messages, { type: 'user', content: userInput }];
    setMessages(updatedMessages);
    setUserInput('');
    
    // Indiquer que le bot est en train de taper
    setIsTyping(true);

    // Utiliser le service au lieu d'axios directement
    chatbotService.sendMessage(userInput, threshold)
      .then(data => {
        setIsTyping(false);
        if (data && data.response) {
          setMessages([
            ...updatedMessages,
            { type: 'bot', content: data.response }
          ]);
        } else {
          // Gérer les réponses vides ou incorrectes
          setMessages([
            ...updatedMessages,
            { type: 'bot', content: "Désolé, je n'ai pas pu traiter votre demande." }
          ]);
        }
      })
      .catch(error => {
        setIsTyping(false);
        setMessages([
          ...updatedMessages,
          { type: 'bot', content: "Désolé, une erreur s'est produite. Veuillez réessayer." }
        ]);
        console.error('Erreur lors de l\'envoi du message:', error);
      });
  };

  // Fonction pour fermer le chatbot avec la touche Echap
  useEffect(() => {
    const handleEscapeKey = (e) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    window.addEventListener('keydown', handleEscapeKey);
    return () => {
      window.removeEventListener('keydown', handleEscapeKey);
    };
  }, [isOpen]);

  return (
    <>
      {/* Icône de chatbot flottant */}
      <div 
        id="chatbot-icon" 
        className={isOpen ? "hidden" : ""}
      >
        <button 
          className="btn btn-warning chatbot-toggle" 
          onClick={toggleChatbot}
          aria-label="Ouvrir le chatbot"
        >
          <FontAwesomeIcon icon={faCommentDots} />
        </button>
      </div>

      {/* Fenêtre du Chatbot */}
      <div id="chatbot-window" className={`chatbot-window ${isOpen ? 'open' : ''}`}>
        <div className="chatbot-container">
          <div className="chat-header">
            <h4 className="m-0">
              <FontAwesomeIcon icon={faComments} className="mr-2" /> 
              Parlez avec DB Sentinel
            </h4>
            <button 
              type="button" 
              className="close close-btn" 
              aria-label="Fermer"
              onClick={toggleChatbot}
            >
              <FontAwesomeIcon icon={faTimes} />
            </button>
          </div>

          <div id="chatbox" ref={chatboxRef}>
            {messages.map((msg, index) => (
              <div key={index} className={`message ${msg.type}-message`}>
                <div className="message-content" dangerouslySetInnerHTML={{ __html: msg.content }} />
              </div>
            ))}
            
            {isTyping && (
              <div className="message bot-message">
                <div className="message-content typing-indicator">...</div>
              </div>
            )}
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
                onKeyPress={handleKeyPress}
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