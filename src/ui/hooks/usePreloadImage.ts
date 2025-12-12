import { useState, useEffect } from 'react';

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
        // Crear una nueva imagen
        const img = new Image();
        
        // Crear una promesa para manejar la carga de la imagen
        const loadImage = new Promise<string>((resolve, reject) => {
          img.onload = () => {
            // Crear un canvas para convertir la imagen a data URL
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            if (!ctx) {
              reject(new Error('No se pudo obtener el contexto del canvas'));
              return;
            }
            
            canvas.width = img.naturalWidth;
            canvas.height = img.naturalHeight;
            
            // Dibujar la imagen en el canvas
            ctx.drawImage(img, 0, 0);
            
            // Convertir a data URL
            const dataUrl = canvas.toDataURL();
            resolve(dataUrl);
          };
          
          img.onerror = () => {
            reject(new Error(`Error al cargar la imagen: ${imagePath}`));
          };
        });
        
        // Establecer la fuente de la imagen
        img.src = imagePath;
        
        // Esperar a que se cargue y convertir a data URL
        const dataUrl = await loadImage;
        
        setPreloadedImage({
          dataUrl,
          isLoaded: true,
        });
      } catch (error) {
        Logger.error('Error precargando imagen:', error);
        setPreloadedImage({
          dataUrl: null,
          isLoaded: false,
        });
      }
    };

    preloadImage();
  }, [imagePath]);

  return preloadedImage;
};

export default usePreloadImage;