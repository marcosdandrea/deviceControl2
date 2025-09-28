import React from "react";
import useProject from "@hooks/useProject";
import { Input, message, Modal } from "antd";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

const PasswordProtection = ({ children }) => {
  const unlockMasterKey = "9999999999999999";

  const navigate = useNavigate();
  const { project, unloadProject } = useProject({ fetchProject: true });
  const [isModalOpen, setIsModalOpen] = useState(true);
  const [allowed, setAllowed] = useState(false);
  const [password, setPassword] = useState("");

  const handleOnChangePassword = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Solo permitir números
    if (/^\d*$/.test(value)) {
      setPassword(value);
    }
  };

  const handleCancel = () => {
    setIsModalOpen(false);
    navigate("/notAllowed");
  };

  const handleOk = async () => {
    if (password === unlockMasterKey) {
      await unloadProject();
      setAllowed(true);
      message.success("Proyecto desbloqueado, por favor vuelva a cargarlo");
      return;
    } else if (password === project.password) {
      setAllowed(true);
      message.success("Proyecto desbloqueado");
      setIsModalOpen(false);
    } else {
      handleCancel();
      message.error("Contraseña incorrecta");
    }
  };

  if (!project) return children;

  if (allowed) return children;

  if (!project.password) return children;

  return (
    <Modal
      title="Proyecto Protegido"
      closable={{ "aria-label": "Custom Close Button" }}
      open={isModalOpen}
      onOk={handleOk}
      onCancel={handleCancel}
    >
      <p>
        Este proyecto ha sido protegido con una contraseña y para acceder a él
        debe escribir su contraseña.
      </p>
      <Input.Password
        value={password}
        placeholder="Contraseña"
        onChange={handleOnChangePassword}
      />
    </Modal>
  );
};

export default PasswordProtection;
