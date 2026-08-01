// FloatingWindow.tsx
import React, { createContext, useContext, useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { MdClose } from "react-icons/md";
import style from "./style.module.css";

export type FloatingWindowContextType = {
  close: () => void;
};

export const FloatingWindowContext = createContext<FloatingWindowContextType | null>(null);

export const useFloatingWindow = () => useContext(FloatingWindowContext);

type Position = { x: number; y: number };

type Props = {
  title?: string;
  width?: number;
  height?: number;
  onClose: () => void;
  children: React.ReactNode;
};

export default function FloatingWindow({
  title = "Configuración",
  width = 960,
  height = 680,
  onClose,
  children,
}: Props) {
  const [position, setPosition] = useState<Position | null>(null);
  const dragRef = useRef<{ startX: number; startY: number; originX: number; originY: number } | null>(null);

  const clampPosition = useCallback(
    (x: number, y: number) => {
      const maxX = Math.max(window.innerWidth - width, 0);
      const maxY = Math.max(window.innerHeight - height, 0);
      return { x: Math.min(Math.max(x, 0), maxX), y: Math.min(Math.max(y, 0), maxY) };
    },
    [width, height]
  );

  useEffect(() => {
    setPosition(clampPosition((window.innerWidth - width) / 2, (window.innerHeight - height) / 2));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!dragRef.current) return;
      const dx = e.clientX - dragRef.current.startX;
      const dy = e.clientY - dragRef.current.startY;
      setPosition(clampPosition(dragRef.current.originX + dx, dragRef.current.originY + dy));
    },
    [clampPosition]
  );

  const handleMouseUp = useCallback(() => {
    dragRef.current = null;
    window.removeEventListener("mousemove", handleMouseMove);
    window.removeEventListener("mouseup", handleMouseUp);
  }, [handleMouseMove]);

  const handleTitleBarMouseDown = useCallback(
    (e: React.MouseEvent) => {
      dragRef.current = {
        startX: e.clientX,
        startY: e.clientY,
        originX: position?.x ?? 0,
        originY: position?.y ?? 0,
      };
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    },
    [position, handleMouseMove, handleMouseUp]
  );

  useEffect(() => {
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  if (!position) return null;

  return createPortal(
    <div
      className={style.panel}
      style={{ left: position.x, top: position.y, width, height }}
    >
      <div className={style.titleBar} onMouseDown={handleTitleBarMouseDown}>
        <span className={style.title}>{title}</span>
        <button type="button" className={style.closeButton} onClick={onClose} aria-label="Cerrar">
          <MdClose />
        </button>
      </div>
      <div className={style.content}>
        <FloatingWindowContext.Provider value={{ close: onClose }}>
          {children}
        </FloatingWindowContext.Provider>
      </div>
    </div>,
    document.body
  );
}
