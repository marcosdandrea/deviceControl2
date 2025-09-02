import React from 'react';
import useProject from '@hooks/useProject';
import Button from '@components/Button';
import { dummyProjectData } from '@helpers/dummy-project';

const Builder = () => {

    console.log (JSON.stringify(dummyProjectData))

    const { loadProjectFile, unloadProject, getProjectFile, project } = useProject();

    const openFile = () => {
        return new Promise<ArrayBuffer | String>((resolve, reject) => {
            const input = document.createElement("input");
            input.type = "file";
            input.accept = ".dc2";
            input.onchange = (event: Event) => {
                const target = event.target as HTMLInputElement;
                if (target.files && target.files.length > 0) {
                    const file = target.files[0];
                    const reader = new FileReader();
                    reader.onload = () => {
                        resolve(reader.result);
                    };
                    reader.onerror = () => {
                        reject(new Error("Error reading file"));
                    };
                    reader.readAsText(file);
                } else {
                    reject(new Error("No file selected"));
                }
            };
            input.click();
        });
    }

    const handleOnLoad = async () => {
        try {
            const file = await openFile();
            loadProjectFile(file);
        } catch (error) {
            console.error("Error loading file:", error);
        }
    }

    const handleOnDownload = async () => {
        try {
            const projectContent = await getProjectFile();
            if (projectContent) {
                const blob = new Blob([projectContent], { type: "application/json" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `${project.name}.dc2`
                a.click();
                URL.revokeObjectURL(url);
            }
        } catch (error) {
            console.error("Error downloading project:", error);
        }
    }

    return (
        <div style={{
            position: "absolute",
            width: "100%",
            height: "100%",
            display: "flex",
            columnGap: "1rem",
            justifyContent: "center",
            alignItems: "center"
        }}>
            <Button
                text='Load Project'
                onClick={handleOnLoad} />

            <Button
                text='Unload Project'
                onClick={unloadProject} />

            <Button
                text='Download Project'
                onClick={handleOnDownload} />
        </div>
    );
}

export default Builder;