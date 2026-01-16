import React, { useEffect, useMemo } from 'react';
import style from './style.module.css';
import { Collapse, ConfigProvider } from 'antd';
import useProject from '@hooks/useProject';
import RoutineList from '../RoutineList';
import GroupMonitorDetails from '../GroupMonitorDetails';

const RoutineGroups = React.memo(() => {
    const { project } = useProject({ fetchProject: true });
    const [activeKey, setActiveKey] = React.useState<string | string[]>([]);

    console.log ({project})

    const groups = useMemo(() => {
        if (!project) return [];

        const projectGroups = project.groups;

        const mappedGroups = projectGroups.map((group) => {
            const isGroupHidden = project.routines
                .filter((r) => r.groupId === group.id)
                .filter((r) => !r.hidden);

            if (isGroupHidden.length === 0) 
                return null; // Omitir grupos sin rutinas visibles
            
            return ({
                key: group.id,
                label: group.name,
                extra: <GroupMonitorDetails groupId={group.id} />,
                children: <RoutineList groupId={group.id} />
            })
        });

        return mappedGroups.filter(group => group !== null);
    }, [project]);

    useEffect(() => {
        // Abrir el primer grupo por defecto si hay grupos disponibles
        if (groups.length > 0 && activeKey.length === 0) {
            setActiveKey([groups[0]?.key]);
        }
    }, [groups, activeKey.length]);

    return (
        <ConfigProvider
            theme={{
                components: {
                    Collapse: {
                        contentPadding: "0 0"
                    }
                }
            }}>
            <Collapse
                style={{
                    height: "100%"
                }}
                accordion={true}
                bordered={true}
                size='small'
                className={style.routineGroupsContainer}
                items={groups}
                activeKey={activeKey}
                onChange={(key) => {
                    // Si intentan cerrar el último cajón abierto, mantenerlo abierto
                    if (key === null || (Array.isArray(key) && key.length === 0)) {
                        return;
                    }
                    setActiveKey(key);
                }} />
        </ConfigProvider>
    );
});


export default RoutineGroups;