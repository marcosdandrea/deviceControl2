import React, { useState } from "react";


export const DndContextProvider = ({ children }) => {

  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  const [activeTaskContainer, setActiveTaskContainer] = useState<string | null>(null);


  return (
    <div className="dndContextProvider">
      {children}
    </div>
  );
}

export default DndContextProvider;