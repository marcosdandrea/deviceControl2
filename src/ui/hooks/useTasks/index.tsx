import tasksCommands from "@common/commands/tasks.commands";
import { TaskType } from "@common/types/task.type";
import { SocketIOContext } from "@components/SocketIOProvider";
import { message } from "antd";
import { useContext } from "react";

const useTasks = () => {
    const {socket} = useContext(SocketIOContext)

    const getTaskTemplate = async (callback: Function) => {
        socket.emit(tasksCommands.getTaskTemplate, null, (response: TaskType | Error) => {
            if (response instanceof Error) {
                message.error("Error al obtener la plantilla de tarea: " + response.message)
                return
            }
            callback?.(response)
        })
    }

    return { getTaskTemplate }
}
 
export default useTasks;