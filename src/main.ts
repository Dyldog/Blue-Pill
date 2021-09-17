import { FileExplorer, Plugin, TFile, App } from 'obsidian';
import { WorkspaceLeaf, MarkdownView } from 'obsidian';

export default class FileExplorerNoteCount extends Plugin {
    // fileExplorer?: FileExplorer;

    sanitiseTitle(oldTitle: string): string {
        return oldTitle
        .toLowerCase()
        .replace(/[^\w\s]/gi, '')
        .trim()
        .replace(/ /g, '-')
    }

    isZettelFile(file: TFile): boolean {
        return /^((?:[0-9]+|[a-z]+)+)\.md$/.exec(file.name) != null;
    }

    getZettels(): TFile[] {
        return this.app.vault.getMarkdownFiles().filter((file) => {
            const ignore = /^[_layouts|templates|scripts]/;
            return file.path.match(ignore) == null && this.isZettelFile(file);
        });
    }


    async renameFile(file: TFile) {
        console.log("Renaming " + file.name)

        let val = await this.app.vault.read(file)
        const match = /# (.+)\s*/.exec(val);
        
        if (match == null) { 
            console.log("Didn't find a title; Skipping")
            return 
        }

        const name = match[1];
        const sanitised = this.sanitiseTitle(name)
        var newPath = sanitised + ".md"

        if (sanitised == file.name.replace(".md", "")) {
            console.log("Already renamed, skipping")
            return
        }

        var idx = 0
        while(await this.app.vault.adapter.exists(newPath)) {
            idx += 1
            newPath = sanitised + "-" + idx.toString() + ".md"
        }

        console.log("New name: " + newPath)
        
        await this.app.fileManager.renameFile(file, newPath)
        console.log("Done!")
    }

    renameCurrentFile() {
        let view = this.app.workspace.getActiveViewOfType(MarkdownView);
        if (view == null) { return }
            let file = view.file;
        this.renameFile(file)
    }

    async renameAllFiles() {
        for (const file of this.getZettels()) {
            await this.renameFile(file)
        }
    }

    onload() {
        console.log('loading RENAMER');

        this.addCommand({
            id: "rename-current-file",
            name: "Rename Current File to Markdown Header",
            callback: () => {
                this.renameCurrentFile()
            },
        });

        this.addCommand({
            id: "rename-all-files",
            name: "Rename All Files to their Markdown Headers",
            callback: () => {
                this.renameAllFiles()
            },
        });

    }

    onunload() {
        console.log('unloading RENAME');
    }

}