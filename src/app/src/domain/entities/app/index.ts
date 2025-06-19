import { projectInterface } from "@common/types/project.types.js";
import { appType } from "@common/types/app.types.js";
import { version } from "../../../../../../package.json" 

class App implements appType {
    private static instance: App | null = null;
    project: projectInterface | null;

    private constructor() {
        this.project = null;
    }

    setProject(project: projectInterface): void {
        this.project = project;
    }

    closeProject(): void {
        if (!this.project)
            throw new Error("No project to close.");

        this.project = null;
    }

    static getAppVersion(): string {
        return version;
    }

    static getInstance(): App {
        if (!App.instance) {
            App.instance = new App();
        }
        return App.instance;
    }
}

export default App;