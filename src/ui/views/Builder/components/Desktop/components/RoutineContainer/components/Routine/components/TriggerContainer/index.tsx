import React, { useContext, useEffect, useState } from "react";
import style from "./style.module.css";
import SortableList from "react-easy-sort";
import { routineContext } from "../..";
import useProject from "@hooks/useProject";
import Text from "@components/Text";
import Trigger from "../Trigger";
import { nanoid } from "nanoid";

const TriggersContainer = () => {

    const {routineData} = useContext(routineContext);
    const {project} = useProject({fetchProject: false})
    const [triggers, setTriggers] = useState(routineData?.triggers || []);

    useEffect(()=>{
        if (!project || !routineData || !project.triggers) return;
        const routineTriggers = project.triggers.filter(trigger => routineData.triggersId?.includes(trigger.id)) || [];
        setTriggers([...routineTriggers, {}])

    },[project, routineData])

    const onSortEnd = (oldIndex: number, newIndex: number) => {
        
    }   

    return (
        <div className={style.triggersContainer}>
            <Text
                color="gray"
                size={12}>
                {`Disparadores: ${triggers?.length - 1 || 0}`}
                </Text>
            <SortableList
                dir="vertical"
                className={style.triggersList}
                allowDrag={routineData.runInSync == true}
                draggedItemClassName={style.draggedItem}
                onSortEnd={onSortEnd}>
                    {
                        triggers?.map((trigger: any) => (
                            <Trigger
                                key={trigger.id || nanoid(4)}
                                triggerData={trigger}/>
                        ))
                    }
            </SortableList>
        </div>
    );
}


export default TriggersContainer;