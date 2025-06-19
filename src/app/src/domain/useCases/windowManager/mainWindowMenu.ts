import { dialog, MenuItemConstructorOptions } from "electron";
import { Log } from "@utils/log.js";
import { getMainWindow } from "./index.js";
import { closeProject, createNewProject, loadProject, saveProject } from "../project/index.js";
import { Project } from "@src/domain/entities/project/index.js";

const log = new Log("mainWindowMenu", true)

export const mainWindowMenu = () => {

    const handleCreateNewProject = () => {
        log.info("Creating new project")
        try {
            createNewProject()
        } catch (error) {
            log.error("Error creating new project:", error)
            dialog.showErrorBox("Error", "No se pudo crear un nuevo proyecto.")
        }
    }

    const handleOpenProject = async () => {
        log.info("Opening project")

        try {
            const fileData = await dialog.showOpenDialog({
                title: "Abrir Proyecto",
                properties: ['openFile'],
                filters: [
                    { name: 'Proyecto de Device Control', extensions: ['dc2'] }
                ]
            })

            if (fileData.canceled) {
                log.info("Open project dialog was canceled")
                return
            }

            if (fileData.filePaths.length === 0) {
                log.warn("No file selected")
                dialog.showErrorBox("Error", "No se seleccionó ningún archivo.")
                return
            }

            const filePath = fileData.filePaths[0]
            log.info("Selected file path:", filePath)
            await loadProject(filePath)
            log.info("Project loaded successfully")

        } catch (error) {
            log.error("Error opening project:", error)
            dialog.showErrorBox("Error", "No se pudo abrir el proyecto.")
        }
    }

    const handleSaveProject = async () => {
        log.info("Saving project")
        const project = Project.getInstance()
        if (project.filePath)
            try {
                await saveProject(project.filePath)
                log.info("Project saved successfully")
            } catch (error) {
                log.error("Error saving project:", error)
                dialog.showErrorBox("Error", "No se pudo guardar el proyecto.")
            }
        else {
            await handleSaveProjectAs()
        }
    }

    const handleSaveProjectAs = async () => {
        log.info("Saving project as")
        try {
            
            const response = await dialog.showSaveDialog(getMainWindow(), {
                title: "Guardar Proyecto Como",
                defaultPath: "Nuevo Proyecto.dc2",
                filters: [
                    { name: 'Proyecto de Device Control', extensions: ['dc2'] }
                ]
            })

            if (response.canceled) {
                log.info("Save project as dialog was canceled")
                return
            }

            if (!response.filePath) {
                log.warn("No file path provided for saving project")
                dialog.showErrorBox("Error", "No se proporcionó una ruta de archivo para guardar el proyecto.")
                return
            }

            log.info("Selected file path for saving project:", response.filePath)
            await saveProject(response.filePath)
            log.info("Project saved successfully as:", response.filePath)


        }catch (error) {
            log.error("Error saving project as:", error)
            dialog.showErrorBox("Error", "No se pudo guardar el proyecto.")
        }

    }

    const handleCloseProject = async () => {
        log.info("Closing project")
        const project = Project.getInstance()

        if (project) {

            if (project.hasUnsavedChanges()) {
                try {

                    const response = await dialog.showMessageBox(getMainWindow(), {
                        type: 'question',
                        buttons: ['Sí', 'No', 'Cancelar'],
                        title: 'Cerrar Proyecto',
                        message: '¿Desea guardar los cambios antes de cerrar el proyecto?',
                    })

                    if (response.response === 0) { // 'Sí'
                        await handleSaveProject()
                    } else if (response.response === 2) { // 'Cancelar'
                        log.info("Project close canceled by user")
                        return
                    } else {
                        closeProject()
                        log.info("Project closed without saving changes")
                    }

                } catch (error) {
                    log.error("Error closing project:", error)
                    dialog.showErrorBox("Error", "No se pudo cerrar el proyecto.")
                    return
                }

            } else {
                closeProject()
                log.info("Project closed without unsaved changes")
            }

        } else {
            log.warn("No project is currently open to close")
        }
    }

    const handleAbout = () => {
        log.info("Showing about dialog")
    }

    const handleOnConfiguration = () => {
        log.info("Opening configuration")
    }

    const handleOnAdjustToWindow = () => {
        log.info("Adjusting to window")
    }

    const handleOnZoomIn = () => {
        log.info("Zooming in")
    }

    const handleOnZoomOut = () => {
        log.info("Zooming out")
    }

    const handleOnExit = async () => {
        getMainWindow()?.close()
        log.info("Main Window closed")
    }

    const appMenuTemplate: Array<MenuItemConstructorOptions> = [
        {
            label: "Menu",
            submenu: [
                { label: "Nuevo Proyecto", click: handleCreateNewProject },
                { label: "Abrir Proyecto", click: handleOpenProject },
                { label: "Guardar", click: handleSaveProject, enabled: true },
                { label: "Guardar como...", click: handleSaveProjectAs, enabled: false },
                { label: "Cerrar Proyecto", click: handleCloseProject },
                { type: 'separator' },
                { label: "Configurar...", click: handleOnConfiguration },
                { type: 'separator' },
                { label: "Salir", click: handleOnExit },
            ]
        },
        {
            label: "Edición",
            submenu: [
                {
                    label: "Crear", submenu: [
                        { label: "Elemento", click: () => { } },
                    ]
                },
                { type: 'separator' },
                { label: "Deshacer", role: 'undo' },
                { label: "Rehacer", role: 'redo' },
                { type: 'separator' },
                { label: "Cortar", role: 'cut' },
                { label: "Copiar", role: 'copy' },
                { label: "Pegar", role: 'paste' },
            ]
        },
        {
            label: "Ver",
            submenu: [
                { label: "Ajustar a la ventana", click: handleOnAdjustToWindow },
                { label: "Acercar", click: handleOnZoomIn },
                { label: "Alejar", click: handleOnZoomOut },
            ]
        },
        {
            label: "Ayuda",
            submenu: [
                { label: "Acerca de...", click: handleAbout },
            ]
        }
    ];

    return appMenuTemplate
}