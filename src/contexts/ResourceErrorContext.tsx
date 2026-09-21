
import React, { createContext, useState, useCallback, ReactNode, useContext } from 'react';

interface ResourceError {
    message: string;
    detail?: string;
    onRetry?: () => void;
}

interface ResourceErrorContextType {
    resourceError: ResourceError | null;
    reportResourceError: (message: string, onRetry?: () => void, detail?: string) => void;
    clearResourceError: () => void;
}

const ResourceErrorContext = createContext<ResourceErrorContextType | undefined>(undefined);

export const ResourceErrorProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [resourceError, setResourceError] = useState<ResourceError | null>(null);

    const reportResourceError = useCallback((message: string, onRetry?: () => void, detail?: string) => {
        setResourceError({ message, onRetry, detail });
    }, []);

    const clearResourceError = useCallback(() => {
        setResourceError(null);
    }, []);

    return (
        <ResourceErrorContext.Provider value={{ resourceError, reportResourceError, clearResourceError }}>
            {children}
        </ResourceErrorContext.Provider>
    );
};

export const useResourceError = (): ResourceErrorContextType => {
    const context = useContext(ResourceErrorContext);
    if (!context) {
        throw new Error('useResourceError must be used within a ResourceErrorProvider');
    }
    return context;
};
