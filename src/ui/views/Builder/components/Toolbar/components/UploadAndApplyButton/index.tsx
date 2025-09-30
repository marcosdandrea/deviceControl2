import React from "react";
import ToolbarButton from "../ToolbarButton";
import useProject from "@hooks/useProject";
import { Badge, Tooltip } from "antd";
import { HiDocumentArrowUp } from "react-icons/hi2";

const UploadAndApplyButton = () => {

    const { loadProject, project, unsavedChanges } = useProject({ fetchProject: false });

    const handleOnUploadAndApply = async () => {
        loadProject(JSON.stringify(project));
    }

    return (
        <Tooltip
            title={unsavedChanges ? "Subir y aplicar proyecto (tienes cambios sin guardar)" : "Subir y aplicar proyecto"}>
            <Badge
                size="default"
                status="processing"
                color="var(--secondary)"
                count={unsavedChanges ? 1 : 0}
                dot>
                <ToolbarButton
                    icon={<HiDocumentArrowUp size={20} />}
                    disabled={!project}
                    onClick={handleOnUploadAndApply} />
            </Badge>
        </Tooltip>
    );
}

export default UploadAndApplyButton;