import React, { useContext, useEffect } from "react";
import { Input } from "antd";
import { configContext } from "@views/ConfigurationLegacy/context";
import SettingRow from "@components/SettingRow";

const PasswordField = () => {
  const { password, setPassword, passwordError, setPasswordError } =
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
    <>
      <SettingRow label="Contraseña" description={passwordError || undefined}>
        <Input.Password
          visibilityToggle={false}
          spellCheck="false"
          status={passwordError ? "error" : ""}
          style={{ width: 320 }}
          placeholder="Ingrese una contraseña numérica para bloquear el proyecto"
          value={firstPassword}
          onChange={handleOnFirstPasswordChange}
        />
      </SettingRow>
      <SettingRow label="Repetir la contraseña">
        <Input.Password
          visibilityToggle={false}
          spellCheck="false"
          status={passwordError ? "error" : ""}
          style={{ width: 320 }}
          placeholder="Repita la contraseña numérica para bloquear el proyecto"
          value={repeatPassword}
          onChange={handleOnSecondPasswordChange}
        />
      </SettingRow>
    </>
  );
};

export default PasswordField;
