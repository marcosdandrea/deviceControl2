import React, { createContext, useContext, ReactNode } from 'react';
import usePreloadImage from '@hooks/usePreloadImage';

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
  const disconnectedImage = usePreloadImage('/resources/images/404.gif');

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