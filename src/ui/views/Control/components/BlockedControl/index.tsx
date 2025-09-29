import React from "react";
import styles from "./style.module.css";
import { MdLock } from "react-icons/md";
import useBlockControl from "@hooks/useBlockControl";

const BlockedControl = ({disabled, children }) => {

  const { blocked } = useBlockControl();

  return (
    <div className={styles.blockedControl}>
      {blocked && !disabled && (
        <div className={styles.blockedOverlay}>
          <MdLock size={64} color="#fff" />
          <h1 className={styles.title}>El control está bloqueado</h1>
          <p className={styles.paragraph}>Un administrador ha bloqueado temporalmente el acceso a este control.</p>
        </div>
      )}
      {children}
    </div>
  );
};

export default BlockedControl;
