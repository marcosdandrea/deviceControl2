import React, { useContext, useEffect, useState } from "react";
import style from "./style.module.css";
import SortableList from "react-easy-sort";
import { routineContext } from "../..";
import useProject from "@hooks/useProject";
import Text from "@components/Text";
import Trigger from "../Trigger";
import { nanoid } from "nanoid";
import { TriggerInstance } from "@common/types/routine.type";

const TriggersContainer = () => {

    const {routineData} = useContext(routineContext);
    const {project} = useProject({fetchProject: false})
    const [triggers, setTriggers] = useState<any[]>(routineData?.triggers || []);

    useEffect(()=>{
        if (!project || !routineData || !project.triggers) return;
        const routineTriggers = (routineData.triggersId as TriggerInstance[] | undefined)?.map((triggerInstance) => {
            const trigger = project.triggers.find(t => t.id === triggerInstance.triggerId);
            if (!trigger) return null;
            return { ...trigger, instanceId: triggerInstance.id };
        }).filter(trigger => trigger !== null) || [];

        setTriggers([...routineTriggers, { instanceId: nanoid(8), isPlaceholder: true }])

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
                                key={trigger?.instanceId || trigger?.id || nanoid(4)}
                                triggerData={trigger}/>
                        ))
                    }
            </SortableList>
        </div>
    );
}


export default TriggersContainer;