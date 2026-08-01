import { useContext } from "react";
import { UpdateContext } from "@contexts/UpdateContextProvider";

const useUpdates = () => useContext(UpdateContext);

export default useUpdates;
