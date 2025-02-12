

import React, { createContext, useContext, useState } from 'react';

const ChatContext = createContext();

export const useChat = () => useContext(ChatContext);

export const ChatProvider = ({ children }) => {

  const [systemMessages, setSystemMessages] = useState([]);
  const [messageCounter, setMessageCounter] = useState(1);

  const appendSystemMessage = (message) => {
    
    const taggedMessage = { ...message, number: messageCounter };  
    setSystemMessages((currentMessages) => [...currentMessages, taggedMessage]);  
    setMessageCounter(messageCounter + 1);

  };

  return (
    <div>
    <ChatContext.Provider value={{ systemMessages, appendSystemMessage }}>
      {children}
    </ChatContext.Provider>
    </div>
  );
};
