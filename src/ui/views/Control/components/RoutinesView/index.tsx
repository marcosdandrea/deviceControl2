import useProject from '@hooks/useProject';
import React, { useEffect, useState } from 'react';
import RoutineGroups from '../RoutineGroups';
import RoutineList from '../RoutineList';
import NoProjectLoaded from '../NoProjectLoaded';

const RoutinesView = () => {
    const { project } = useProject({ fetchProject: false });
    const [showGroups, setShowGroups] = useState<boolean>(true);

    useEffect(() => {
        if (!project) return;
        setShowGroups(project.showGroupsInControlView);
    }, [project])

    if (!project) return <NoProjectLoaded />;

    if (showGroups)
        return <RoutineGroups />;
    else
        return <RoutineList groupId={null} />;
}

export default RoutinesView;