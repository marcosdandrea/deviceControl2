import React, { createContext, useContext, ReactNode } from 'react';
import usePreloadImage from '@hooks/usePreloadImage';
// Importar la imagen SVG directamente
import disconnectedImageSrc from '../assets/disconnected.svg';

interface PreloadedImagesContextType {
  disconnectedImage: {
    dataUrl: string | null;
    isLoaded: boolean;
  };
}

const PreloadedImagesContext = createContext<PreloadedImagesContextType | undefined>(undefined);

export const usePreloadedImages = () => {
  const context = useContext(PreloadedImagesContext);
  if (!context) {
    throw new Error('usePreloadedImages debe ser usado dentro de un PreloadedImagesProvider');
  }
  return context;
};

interface PreloadedImagesProviderProps {
  children: ReactNode;
}

export const PreloadedImagesProvider: React.FC<PreloadedImagesProviderProps> = ({ children }) => {
  // Usar la imagen SVG importada que siempre estará disponible
  const disconnectedImage = usePreloadImage(disconnectedImageSrc);

  const value: PreloadedImagesContextType = {
    disconnectedImage,
  };

  return (
    <PreloadedImagesContext.Provider value={value}>
      {children}
    </PreloadedImagesContext.Provider>
  );
};

export default PreloadedImagesProvider;