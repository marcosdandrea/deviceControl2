import { MenuItemConstructorOptions } from "electron";
import { Log } from "@utils/log.js";
import { getMainWindow } from "./index.js";

const log = new Log("mainWindowMenu", true)

export const mainWindowMenu = () => {

    const handleCreateNewProject = () => {
        log.info("Creating new project")
    }

    const handleOpenProject = () => {
        log.info("Opening project")
    }

    const handleSaveProject = () => {
        log.info("Saving project")
    }

    const handleSaveProjectAs = () => {
        log.info("Saving project as")
    }

    const handleCloseProject = () => {
        log.info("Closing project")
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
                        { label: "Elemento", click: ()=>{} },
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