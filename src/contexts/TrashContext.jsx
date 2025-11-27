// src/contexts/TrashContext.jsx

import React, { createContext, useContext } from 'react';
import { useTrash } from '../hooks/useTrash';

const TrashContext = createContext(null);

export const TrashProvider = ({ children, autoDeleteDays = 30, trashedItems, setTrashedItems }) => {
    // trashedItems와 setTrashedItems를 props로 받아서 useTrash에 전달
    const trashMethods = useTrash(autoDeleteDays, trashedItems, setTrashedItems);

    return (
        <TrashContext.Provider value={trashMethods}>
            {children}
        </TrashContext.Provider>
    );
};

export const useTrashContext = () => {
    const context = useContext(TrashContext);
    if (!context) {
        throw new Error('useTrashContext must be used within TrashProvider');
    }
    return context;
};
