import { ProjectInterface } from "@common/types/project.types.js";
import { appType } from "@common/types/app.types.js";


class App implements appType {
    private static instance: App | null = null;
    project: ProjectInterface | null;

    private constructor() {
        this.project = null;
    }

    setProject(project: ProjectInterface): void {
        this.project = project;
    }

    closeProject(): void {
        if (!this.project) 
            throw new Error ("No project to close.");
            
        this.project = null;
    }

    static getInstance(): App {
        if (!App.instance) {
            App.instance = new App();
        }
        return App.instance;
    }
}

export default App;