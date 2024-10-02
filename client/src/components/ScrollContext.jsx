import React, { createContext, useRef } from 'react';

// Create a context
export const ScrollContext = createContext();

const ScrollProvider = ({ children }) => {
    
    const textRef = useRef(null); // Reference for the text display component

    return (
        <ScrollContext.Provider value={textRef}>
            {children}
        </ScrollContext.Provider>
    );
};

export default ScrollProvider;
