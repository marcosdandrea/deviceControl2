// Script para ocultar el cursor completamente en el kiosco
(function() {
    'use strict';
    
    // Agregar CSS para ocultar el cursor
    const style = document.createElement('style');
    style.innerHTML = `
        * {
            cursor: none !important;
            -webkit-user-select: none;
            -moz-user-select: none;
            -ms-user-select: none;
            user-select: none;
        }
        
        *:hover, *:focus, *:active, *:visited {
            cursor: none !important;
        }
        
        html, body, div, span, button, input, textarea, select, a, img, svg, canvas {
            cursor: none !important;
        }
    `;
    
    // Insertar el estilo al cargar la página
    if (document.head) {
        document.head.appendChild(style);
    } else {
        document.addEventListener('DOMContentLoaded', function() {
            document.head.appendChild(style);
        });
    }
    
    // También interceptar cualquier intento de cambiar el cursor via JavaScript
    let originalSetProperty = CSSStyleDeclaration.prototype.setProperty;
    CSSStyleDeclaration.prototype.setProperty = function(property, value, priority) {
        if (property === 'cursor' || property === '-webkit-user-select' || property === 'user-select') {
            value = property === 'cursor' ? 'none' : 'none';
        }
        return originalSetProperty.call(this, property, value, priority);
    };
    
    // Interceptar cambios de estilo directo
    Object.defineProperty(HTMLElement.prototype, 'style', {
        get: function() {
            return this._style || (this._style = new Proxy(this.style || {}, {
                set: function(target, property, value) {
                    if (property === 'cursor') {
                        value = 'none';
                    }
                    target[property] = value;
                    return true;
                }
            }));
        },
        set: function(value) {
            // No permitir cambios de estilo que muestren el cursor
        }
    });
    
    // Habilitar reproducción automática de audio sin interacción del usuario
    const enableAudioAutoplay = () => {
        // Crear un contexto de audio dummy y resumirlo
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (AudioContext) {
            const audioCtx = new AudioContext();
            if (audioCtx.state === 'suspended') {
                audioCtx.resume().then(() => {
                    console.log('Audio context resumed for autoplay');
                }).catch(e => {
                    console.warn('Could not resume audio context:', e);
                });
            }
        }
        
        // Interceptar y habilitar automáticamente todos los elementos de audio/video
        const mediaElements = document.querySelectorAll('audio, video');
        mediaElements.forEach(element => {
            element.muted = false;
            element.autoplay = true;
            element.setAttribute('autoplay', '');
            element.removeAttribute('controls');
            
            // Remover cualquier restricción de gesto
            element.addEventListener('loadstart', () => {
                element.play().catch(() => {});
            });
        });
        
        // Observer para nuevos elementos multimedia
        const observer = new MutationObserver(mutations => {
            mutations.forEach(mutation => {
                mutation.addedNodes.forEach(node => {
                    if (node.nodeType === 1) { // Element node
                        if (node.matches && node.matches('audio, video')) {
                            node.muted = false;
                            node.autoplay = true;
                            node.setAttribute('autoplay', '');
                            node.removeAttribute('controls');
                            node.addEventListener('loadstart', () => {
                                node.play().catch(() => {});
                            });
                        }
                        
                        // También buscar en los hijos
                        const mediaChildren = node.querySelectorAll && node.querySelectorAll('audio, video');
                        if (mediaChildren) {
                            mediaChildren.forEach(element => {
                                element.muted = false;
                                element.autoplay = true;
                                element.setAttribute('autoplay', '');
                                element.removeAttribute('controls');
                                element.addEventListener('loadstart', () => {
                                    element.play().catch(() => {});
                                });
                            });
                        }
                    }
                });
            });
        });
        
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    };
    
    // Ejecutar optimizaciones de audio al cargar la página
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', enableAudioAutoplay);
    } else {
        enableAudioAutoplay();
    }
    
    console.log('Cursor hiding script loaded for kiosk mode');
})();