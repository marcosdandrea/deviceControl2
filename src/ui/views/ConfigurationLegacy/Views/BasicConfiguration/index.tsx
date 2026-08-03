import React from "react";
import ProjectAppVersion from "./components/ProjectAppVersion";
import ProjectName from "./components/ProjectName";
import Description from "./components/Description";
import CreatedBy from "./components/CreatedBy";
import CreatedAt from "./components/CreatedAt";
import LastModified from "./components/LastModified";
import PasswordField from "./components/Password";
import style from "./style.module.css";
import Footer from "./components/Footer";
import ShowGroupsInControlView from "./components/ShowGroupsInControlView";
import SettingsSection from "@components/SettingsSection";

const BasicConfiguration = () => {
    const onSaved = () => {
        // Placeholder for save action
    }

    return (
        <div className={style.basicConfiguration}>
            <div className={style.body}>
                <SettingsSection title="Información del Proyecto">
                    <ProjectName />
                    <Description />
                    <ShowGroupsInControlView />
                    <PasswordField />
                    <CreatedBy />
                    <CreatedAt />
                    <LastModified />
                    <ProjectAppVersion />
                </SettingsSection>
            </div>
            <Footer onSaved={onSaved} />
        </div>
    );
}

export default BasicConfiguration;