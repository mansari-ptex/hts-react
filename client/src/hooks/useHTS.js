import { useContext } from 'react';
import { HTSContext } from '../state/HTSContext';

export const useHTS = () => {
    const context = useContext(HTSContext);
    
    if (context === undefined) {
        throw new Error('useHTS must be used within an HTSProvider');
    }
    
    return context;
};
