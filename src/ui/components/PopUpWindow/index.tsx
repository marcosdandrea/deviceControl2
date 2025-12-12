// PopoutWindow.tsx
import React, { useEffect, useRef, useState, createContext, useContext } from "react";
import { createPortal } from "react-dom";
import { StyleProvider } from "@ant-design/cssinjs";

// Context para proporcionar la referencia de la ventana popup
export const PopupWindowContext = createContext<Window | null>(null);

// Hook para acceder a la ventana popup desde componentes hijos
export const usePopupWindow = () => useContext(PopupWindowContext);

type Props = {
  title?: string;
  features?: string;
  addressPath?: string; // URL que querés que aparezca en la barra
  onClose?: () => void;
  children: React.ReactNode;
};

export default function PopoutWindow({
  title = "Configuración",
  features = "width=900,height=650,left=200,top=100,resizable=yes",
  addressPath = "/popout/configuracion",
  onClose,
  children,
}: Props) {
  const [container, setContainer] = useState<HTMLElement | null>(null);
  const winRef = useRef<Window | null>(null);

  useEffect(() => {
    const w = window.open("", title, features);
    if (!w) return;
    winRef.current = w;

    // Documento base con <title>
    w.document.open();
    w.document.write(`<!doctype html><html><head>
      <meta charset="utf-8" />
      <title>${title}</title>
      <meta name="viewport" content="width=device-width, initial-scale=1" />
    </head><body></body></html>`);
    w.document.close();

    // Cambiar barra de direcciones (sólo si es mismo origin)
    try {
      w.history.replaceState(null, "", addressPath);
    } catch {
      /* ignorar si no se puede */
    }

    // Base href para que funcionen rutas relativas
    const base = w.document.createElement("base");
    base.href = document.baseURI;
    w.document.head.appendChild(base);

    // Clonar CSS global (Tailwind, reset, etc.)
    document.querySelectorAll('link[rel="stylesheet"], style').forEach((n) => {
      const clone = n.cloneNode(true) as Element;
      if (clone.tagName !== "BASE") w.document.head.appendChild(clone);
    });

    // Contenedor del portal
    const mount = w.document.createElement("div");
    w.document.body.appendChild(mount);
    setContainer(mount);

    const handleBeforeUnload = () => onClose?.();
    w.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      w.removeEventListener("beforeunload", handleBeforeUnload);
      try {
        w.close();
      } catch {}
      winRef.current = null;
      setContainer(null);
    };
  }, [title, features, addressPath, onClose]);

  if (!container || !winRef.current) return null;

  return createPortal(
    <StyleProvider container={winRef.current.document.head} hashPriority="high">
      <PopupWindowContext.Provider value={winRef.current}>
        {children}
      </PopupWindowContext.Provider>
    </StyleProvider>,
    container
  );
}