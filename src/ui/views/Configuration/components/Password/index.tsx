import React, { useContext, useEffect } from "react";
import style from "./style.module.css";
import { Input, Space } from "antd";
import { configContext } from "@views/Configuration";

const PasswordField = () => {
  const { password, setPassword, passwordError, setPasswordError, inputFlex, labelFlex } =
    useContext(configContext);

    const [firstPassword, setFirstPassword] = React.useState<string>(password);
    const [repeatPassword, setRepeatPassword] = React.useState<string>(password);

  const handleOnFirstPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Solo permitir números
    if (/^\d*$/.test(value)) {
      setFirstPassword(value);
    }
  };

  const handleOnSecondPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Solo permitir números
    if (/^\d*$/.test(value)) {
      setRepeatPassword(value);
    }
  };

  useEffect(() => {
    if (firstPassword !== repeatPassword) {
      setPasswordError("Las contraseñas no coinciden");
    } else {
      setPasswordError("");
      setPassword(firstPassword);
    }
  }, [firstPassword, repeatPassword]);

  return (
    <div className={style.passwordField}>
      <Space.Compact style={{ flex: 1 }}>
        <Input value="Contraseña" disabled style={{ flex: labelFlex, color: "inherit" }} />
        <Input.Password
          visibilityToggle={false}
          spellCheck="false"
          status={passwordError ? "error" : ""}
          style={{ flex: inputFlex }}
          placeholder="Ingrese una contraseña numérica para bloquear el proyecto"
          value={firstPassword}
          onChange={handleOnFirstPasswordChange}
        />
      </Space.Compact>
      <Space.Compact style={{ flex: 1 }}>
        <Input value="Repetir la contraseña" disabled style={{ flex: labelFlex, color: "inherit" }} />
        <Input.Password
          visibilityToggle={false}
          spellCheck="false"
          status={passwordError ? "error" : ""}
          style={{ flex: inputFlex }}
          placeholder="Repita la contraseña numérica para bloquear el proyecto"
          value={repeatPassword}
          onChange={handleOnSecondPasswordChange}
        />
      </Space.Compact>
    </div>
  );
};

export default PasswordField;
