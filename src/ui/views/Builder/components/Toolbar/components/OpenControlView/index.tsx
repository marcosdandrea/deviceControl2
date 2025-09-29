import React from "react";
import ToolbarButton from "../ToolbarButton";
import { MdOutlineViewList } from "react-icons/md";
import { Tooltip } from "antd";

const OpenControlView = () => {
  const handleOnClick = () => {
    window.open(
      "/controlPreview",
      "controlWindow",
      "width=800,height=500,location=no"
    );
  };

  return (
    <Tooltip placement="bottom" title="Abrir vista previa de control" arrow>
      <div>
        <ToolbarButton
          onClick={handleOnClick}
          icon={<MdOutlineViewList size={20} />}
        />
      </div>
    </Tooltip>
  );
};

export default OpenControlView;
