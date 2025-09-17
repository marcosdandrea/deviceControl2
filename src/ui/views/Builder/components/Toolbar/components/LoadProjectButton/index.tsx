import React from "react";
import ToolbarButton from "../ToolbarButton";
import useProject from "@hooks/useProject";
import { HiFolderOpen } from "react-icons/hi2";

const LoadProjectButton = () => {

    const { loadProjectFile } = useProject({ fetchProject: false });

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

    return (
        <ToolbarButton 
            icon={<HiFolderOpen size={20}/>} 
            onClick={handleOnLoad} />
    );
}
 
export default LoadProjectButton;