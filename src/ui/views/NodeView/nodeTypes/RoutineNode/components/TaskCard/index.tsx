import React from 'react';

interface TaskCardProps {
  id: string;
  containerId: string;
  content: string;
  color?: string;
}

const TaskCard: React.FC<TaskCardProps> = ({ id, containerId, content, color }) => {



  return (
    <div>
      {content}
    </div>
  );
};

export default TaskCard;
