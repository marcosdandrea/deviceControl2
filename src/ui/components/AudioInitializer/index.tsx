import React, { useEffect } from 'react';

interface AudioInitializerProps {
  children: React.ReactNode;
}

export const AudioInitializer: React.FC<AudioInitializerProps> = ({ children }) => {
  useEffect(() => {
    let hasInteracted = false;

    const initializeAudio = async () => {
      if (hasInteracted) return;
      
      hasInteracted = true;

      // Activar contexto de audio global
      if (window.AudioContext || (window as any).webkitAudioContext) {
        try {
          const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
          if (audioContext.state === 'suspended') {
            await audioContext.resume();
            console.log('Global AudioContext activated on user interaction');
          }
          // Cerrar el contexto temporal después de activar
          setTimeout(() => {
            if (audioContext.state !== 'closed') {
              audioContext.close();
            }
          }, 1000);
        } catch (error) {
          console.warn('Error initializing global AudioContext:', error);
        }
      }

      // Remover listeners una vez activado
      document.removeEventListener('touchstart', initializeAudio);
      document.removeEventListener('touchend', initializeAudio);
      document.removeEventListener('click', initializeAudio);
      document.removeEventListener('keydown', initializeAudio);
    };

    // Escuchar múltiples tipos de interacción
    document.addEventListener('touchstart', initializeAudio, { once: false, passive: true });
    document.addEventListener('touchend', initializeAudio, { once: false, passive: true });
    document.addEventListener('click', initializeAudio, { once: false, passive: true });
    document.addEventListener('keydown', initializeAudio, { once: false, passive: true });

    // Cleanup
    return () => {
      document.removeEventListener('touchstart', initializeAudio);
      document.removeEventListener('touchend', initializeAudio);
      document.removeEventListener('click', initializeAudio);
      document.removeEventListener('keydown', initializeAudio);
    };
  }, []);

  return <>{children}</>;
};

export default AudioInitializer;