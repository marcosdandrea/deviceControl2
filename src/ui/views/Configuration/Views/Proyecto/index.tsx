import React, { useEffect, useState } from "react";
import { message } from "antd";
import useProject from "@hooks/useProject";
import SectionCard from "../../components/SectionCard";
import ScreenTitle from "../../components/ScreenTitle";
import Input from "../../components/Input";
import Textarea from "../../components/Textarea";
import Switch from "../../components/Switch";
import Button from "../../components/Button";
import Footer from "../../components/Footer";
import style from "./style.module.css";

type ProyectoProps = {
    onSaved: () => void;
};

const Proyecto = ({ onSaved }: ProyectoProps) => {
    const { project, setProject } = useProject({ fetchProject: false });

    const [name, setName] = useState(project?.name ?? "");
    const [description, setDescription] = useState(project?.description ?? "");
    const [passwordA, setPasswordA] = useState("");
    const [passwordB, setPasswordB] = useState("");

    useEffect(() => {
        setName(project?.name ?? "");
        setDescription(project?.description ?? "");
        setPasswordA(project?.password ?? "");
        setPasswordB(project?.password ?? "");
    }, [project?.id]);

    const matchColor = !passwordA && !passwordB ? "#8b8b90" : passwordA === passwordB ? "#28a745" : "#dc3545";
    const matchText = !passwordA && !passwordB
        ? "Ingresa la contraseña dos veces."
        : passwordA === passwordB
            ? "Coinciden ✓"
            : "No coinciden.";

    const handlePasswordChange = (setter: (v: string) => void) => (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        if (/^\d*$/.test(value)) setter(value);
    };

    const handleToggleShowGroups = (checked: boolean) => {
        setProject((prev) => (prev ? { ...prev, showGroupsInControlView: checked } : prev));
    };

    const handleSave = () => {
        if (name.trim().length < 3) {
            message.error("El nombre del proyecto debe tener al menos 3 caracteres.");
            return;
        }
        if (passwordA !== passwordB) {
            message.error("Las contraseñas no coinciden.");
            return;
        }

        setProject((prev) =>
            prev
                ? {
                    ...prev,
                    name,
                    description,
                    password: passwordA,
                    updatedAt: new Date(),
                }
                : prev
        );
        message.success("Configuración guardada correctamente.");
        onSaved();
    };

    if (!project) return null;

    const createdAt = project.createdAt ? new Date(project.createdAt) : null;
    const updatedAt = project.updatedAt ? new Date(project.updatedAt) : null;

    return (
        <div className={style.wrapper}>
            <SectionCard>
                <ScreenTitle
                    title="Información del Proyecto"
                    description="Datos generales y credenciales de acceso al proyecto."
                    spacing="card"
                />
                <div className={style.columns}>
                    <div className={style.left}>
                        <div>
                            <div className={style.fieldLabel}>Nombre del proyecto</div>
                            <Input value={name} onChange={(e) => setName(e.target.value)} invalid={name.trim().length < 3} />
                            <div className={style.hint}>Mínimo 3 caracteres.</div>
                        </div>
                        <div>
                            <div className={style.fieldLabel}>Descripción</div>
                            <Textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                rows={2}
                                maxLength={200}
                            />
                            <div className={style.hint}>Máx. 200 caracteres.</div>
                        </div>
                        <div>
                            <div className={style.fieldLabel}>Contraseña</div>
                            <div className={style.passwordRow}>
                                <Input
                                    type="password"
                                    placeholder="Contraseña"
                                    value={passwordA}
                                    onChange={handlePasswordChange(setPasswordA)}
                                    style={{ flex: 1 }}
                                />
                                <Input
                                    type="password"
                                    placeholder="Repetir"
                                    value={passwordB}
                                    onChange={handlePasswordChange(setPasswordB)}
                                    style={{ flex: 1 }}
                                />
                            </div>
                            <div className={style.hint} style={{ color: matchColor }}>{matchText}</div>
                        </div>
                    </div>
                    <div className={style.divider} />
                    <div className={style.right}>
                        <div className={style.metaHeading}>METADATOS</div>
                        <div className={style.metaRow}>
                            <span className={style.metaLabel}>Creado el</span>
                            <span className={style.metaValue}>{createdAt ? createdAt.toLocaleDateString() : "N/A"}</span>
                        </div>
                        <div className={style.metaRow}>
                            <span className={style.metaLabel}>Creado por</span>
                            <span className={style.metaValue}>{project.createdBy || "Desconocido"}</span>
                        </div>
                        <div className={style.metaRow}>
                            <span className={style.metaLabel}>Última modificación</span>
                            <span className={style.metaValue}>{updatedAt ? updatedAt.toLocaleDateString() : "N/A"}</span>
                        </div>
                        <div className={style.metaRow}>
                            <span className={style.metaLabel}>Creado con la versión</span>
                            <span className={style.metaValue}>{project.appVersion || "N/A"}</span>
                        </div>
                        <div className={style.metaDivider} />
                        <div className={style.groupsRow}>
                            <div>
                                <div className={style.metaLabel}>Mostrar grupos en vista de Control</div>
                                <div className={style.groupsHint}>Agrupa los dispositivos por zona en la vista principal.</div>
                            </div>
                            <Switch checked={!!project.showGroupsInControlView} onChange={handleToggleShowGroups} />
                        </div>
                    </div>
                </div>
                <Footer>
                    <Button variant="primary" onClick={handleSave}>Guardar</Button>
                </Footer>
            </SectionCard>
        </div>
    );
};

export default Proyecto;
