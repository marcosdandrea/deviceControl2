import { useState, useEffect } from 'react';
import { Logger } from '@helpers/logger';

interface PreloadedImage {
  dataUrl: string | null;
  isLoaded: boolean;
}

const usePreloadImage = (imagePath: string): PreloadedImage => {
  const [preloadedImage, setPreloadedImage] = useState<PreloadedImage>({
    dataUrl: null,
    isLoaded: false,
  });

  useEffect(() => {
    const preloadImage = async () => {
      try {
        Logger.info(`Iniciando precarga de imagen: ${imagePath}`);
        
        // Si la imagen es importada directamente (como un SVG), usar directamente la URL
        if (imagePath.startsWith('data:') || imagePath.includes('blob:') || imagePath.startsWith('/assets/')) {
          Logger.info(`Usando imagen importada directamente: ${imagePath}`);
          setPreloadedImage({
            dataUrl: imagePath,
            isLoaded: true,
          });
          return;
        }
        
        // Para otras rutas, intentar cargar normalmente
        const img = new Image();
        
        const loadImage = new Promise<string>((resolve, reject) => {
          img.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            if (!ctx) {
              reject(new Error('No se pudo obtener el contexto del canvas'));
              return;
            }
            
            canvas.width = img.naturalWidth;
            canvas.height = img.naturalHeight;
            ctx.drawImage(img, 0, 0);
            
            const dataUrl = canvas.toDataURL();
            resolve(dataUrl);
          };
          
          img.onerror = () => {
            reject(new Error(`Error al cargar la imagen: ${imagePath}`));
          };
        });
        
        img.src = imagePath;
        const dataUrl = await loadImage;
        
        Logger.info(`Imagen precargada exitosamente: ${imagePath}`);
        
        setPreloadedImage({
          dataUrl,
          isLoaded: true,
        });
      } catch (error) {
        Logger.error('Error precargando imagen:', error);
        
        // Usar imagen SVG de fallback si falla todo
        const fallbackSvg = `data:image/svg+xml;base64,${btoa(`
          <svg width="400" height="400" viewBox="0 0 400 400" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="200" cy="200" r="180" fill="#f0f0f0" stroke="#d9d9d9" stroke-width="2"/>
            <g stroke="#ff4d4f" stroke-width="4" stroke-linecap="round">
              <line x1="150" y1="150" x2="250" y2="250"/>
              <line x1="250" y1="150" x2="150" y2="250"/>
            </g>
            <text x="200" y="320" text-anchor="middle" font-family="Arial, sans-serif" font-size="24" font-weight="bold" fill="#ff4d4f">
              DESCONECTADO
            </text>
          </svg>
        `)}`;
        
        setPreloadedImage({
          dataUrl: fallbackSvg,
          isLoaded: true,
        });
      }
    };

    preloadImage();
  }, [imagePath]);

  return preloadedImage;
};

export default usePreloadImage;
