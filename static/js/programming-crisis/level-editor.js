import { EditorCore } from './programming-crisis-level-editor/editor-core.js';

export class LevelEditor {
    constructor(room) {
        this.room = room;
        this.editorCore = new EditorCore(room);
    }

    enterEditorMode() {
        this.editorCore.enterEditorMode();
    }

    exitEditorMode() {
        this.editorCore.exitEditorMode();
    }

    // Delegate other methods to the core
    getCustomLevels() {
        return this.editorCore.storage.getCustomLevels();
    }

    isEditorMode() {
        return this.editorCore.isEditorMode;
    }

    isTestModeActive() {
        return this.editorCore.tester.isTestModeActive();
    }
}
