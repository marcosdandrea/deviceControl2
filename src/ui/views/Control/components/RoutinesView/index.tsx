import useProject from '@hooks/useProject';
import React, { useEffect, useState } from 'react';
import RoutineGroups from '../RoutineGroups';
import RoutineList from '../RoutineList';

const RoutinesView = () => {
    const { project } = useProject({ fetchProject: false });
    const [showGroups, setShowGroups] = useState<boolean>(true);

    useEffect(() => {
        if (!project) return;
        setShowGroups(project.showGroupsInControlView);
    }, [project])

    if (showGroups)
        return <RoutineGroups />;
    else
        return <RoutineList groupId={null} />;
}

export default RoutinesView;