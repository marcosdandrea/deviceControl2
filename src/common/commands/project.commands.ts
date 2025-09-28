export default {
    create: "project:create",
    loadProjectFile: "project:load",
    getProjectFile: "project:getFile",
    close: "project:unload",
    getCurrent: "project:getCurrent",
    getExecutions: "project:getExecutions",
    getExecution: "project:getExecution",
    deleteExecution: "project:deleteExecution",
    downloadExecutions: "project:downloadExecutions",
    deleteExecutions: "project:deleteExecutions",
    deleteAllExecutions: "project:deleteAllExecutions",
} as const;