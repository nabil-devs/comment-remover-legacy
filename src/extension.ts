import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

interface ProcessingStats {
    filesScanned: number;
    filesModified: number;
    commentsRemoved: number;
    bytesSaved: number;
}

interface BackupInfo {
    timestamp: number;
    files: Array<{originalPath: string, backupPath: string}>;
}

class CommentRemover {
    private outputChannel: vscode.OutputChannel;
    private lastBackupInfo: BackupInfo | null = null;
    private backupCleanupInterval: NodeJS.Timeout | null = null;
    
    constructor() {
        this.outputChannel = vscode.window.createOutputChannel('Comment Remover Pro');
        this.startBackupCleanupTimer();
    }

    private startBackupCleanupTimer() {
        if (this.backupCleanupInterval) {
            clearInterval(this.backupCleanupInterval);
        }
        this.backupCleanupInterval = setInterval(() => {
            this.cleanupOldBackups();
        }, 5 * 60 * 1000);
    }

    private async cleanupOldBackups() {
        const config = vscode.workspace.getConfiguration('commentRemoverPro');
        const backupEnabled = config.get<boolean>('backup.enabled', true);
        
        if (!backupEnabled) return;

        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders) return;

        const oneHourAgo = Date.now() - (60 * 60 * 1000);
        
        for (const folder of workspaceFolders) {
            const backupLocation = config.get<string>('backup.location', '${workspaceFolder}/.comment-remover-backups')
                .replace('${workspaceFolder}', folder.uri.fsPath);
            
            try {
                if (fs.existsSync(backupLocation)) {
                    const items = fs.readdirSync(backupLocation);
                    for (const item of items) {
                        const itemPath = path.join(backupLocation, item);
                        const stats = fs.statSync(itemPath);
                        
                        if (stats.isDirectory()) {
                            const timestamp = parseInt(item.split('-').pop() || '0');
                            if (timestamp < oneHourAgo) {
                                fs.rmSync(itemPath, { recursive: true, force: true });
                                this.outputChannel.appendLine(`Cleaned up old backup: ${itemPath}`);
                            }
                        }
                    }
                }
            } catch (error) {
                console.error('Error cleaning up backups:', error);
            }
        }
    }

    private async createBackup(files: string[]): Promise<string | null> {
        const config = vscode.workspace.getConfiguration('commentRemoverPro');
        const backupEnabled = config.get<boolean>('backup.enabled', true);
        
        if (!backupEnabled || files.length === 0) return null;

        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders) return null;

        const timestamp = Date.now();
        const backupFolderName = `backup-${timestamp}`;
        const backupFiles: Array<{originalPath: string, backupPath: string}> = [];

        for (const folder of workspaceFolders) {
            const backupLocation = config.get<string>('backup.location', '${workspaceFolder}/.comment-remover-backups')
                .replace('${workspaceFolder}', folder.uri.fsPath);
            
            const specificBackupPath = path.join(backupLocation, backupFolderName);
            
            try {
                if (!fs.existsSync(backupLocation)) {
                    fs.mkdirSync(backupLocation, { recursive: true });
                }
                
                if (!fs.existsSync(specificBackupPath)) {
                    fs.mkdirSync(specificBackupPath, { recursive: true });
                }

                for (const filePath of files) {
                    if (filePath.startsWith(folder.uri.fsPath)) {
                        const relativePath = path.relative(folder.uri.fsPath, filePath);
                        const backupFilePath = path.join(specificBackupPath, relativePath);
                        
                        const backupDir = path.dirname(backupFilePath);
                        if (!fs.existsSync(backupDir)) {
                            fs.mkdirSync(backupDir, { recursive: true });
                        }
                        
                        fs.copyFileSync(filePath, backupFilePath);
                        backupFiles.push({
                            originalPath: filePath,
                            backupPath: backupFilePath
                        });
                    }
                }
            } catch (error) {
                this.outputChannel.appendLine(`❌ Backup failed for ${specificBackupPath}: ${error}`);
                return null;
            }
        }

        this.lastBackupInfo = {
            timestamp,
            files: backupFiles
        };

        return backupFolderName;
    }

    private async restoreBackup(backupInfo: BackupInfo) {
        const totalFiles = backupInfo.files.length;
        let restoredCount = 0;
        
        for (const file of backupInfo.files) {
            try {
                if (fs.existsSync(file.backupPath)) {
                    fs.copyFileSync(file.backupPath, file.originalPath);
                    restoredCount++;
                }
            } catch (error) {
                this.outputChannel.appendLine(`❌ Failed to restore ${file.originalPath}: ${error}`);
            }
        }

        this.lastBackupInfo = null;
        return restoredCount;
    }

    async removeAllComments() {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        
        if (!workspaceFolders) {
            vscode.window.showErrorMessage('No workspace folder is open.');
            return;
        }

        const choice = await vscode.window.showWarningMessage(
            'Remove comments from entire workspace?',
            { 
                modal: true, 
                detail: 'This will process all supported file types. A backup will be created automatically.'
            },
            'Preview Changes',
            'Remove Comments',
            'Cancel'
        );

        if (choice === 'Cancel') {
            return;
        }

        if (choice === 'Preview Changes') {
            await this.previewChanges();
            return;
        }

        const result = await this.processWorkspace(true);
        
        if (result.stats.filesModified > 0) {
            const message = `Removed ${result.stats.commentsRemoved} comments from ${result.stats.filesModified} files`;
            const backupInfo = result.backupCreated ? 
                'Backup created. You can undo within 1 hour.' : 
                'No backup created (disabled in settings).';
            
            vscode.window.showInformationMessage(
                `${message}\n${backupInfo}`,
                'Show Details', 
                'Undo Changes',
                'Star Repo'
            ).then(selection => {
                if (selection === 'Show Details') {
                    this.outputChannel.show();
                } else if (selection === 'Undo Changes') {
                    this.undoLastRemoval();
                } else if (selection === 'Star Repo') {
                    vscode.env.openExternal(vscode.Uri.parse('https://github.com/nabil-devs/comment-remover-pro.git'));
                }
            });
        } else {
            vscode.window.showInformationMessage('No comments found to remove.', 'Star Repo').then(selection => {
                if (selection === 'Star Repo') {
                    vscode.env.openExternal(vscode.Uri.parse('https://github.com/nabil-devs/comment-remover-pro.git'));
                }
            });
        }
    }

    async previewChanges() {
        const result = await this.processWorkspace(false);
        
        if (result.stats.filesModified > 0) {
            const choice = await vscode.window.showInformationMessage(
                `Found ${result.stats.commentsRemoved} comments in ${result.stats.filesModified} files`,
                'Apply Changes',
                'Show Details',
                'Cancel'
            );

            if (choice === 'Apply Changes') {
                await this.removeAllComments();
            } else if (choice === 'Show Details') {
                this.outputChannel.show();
            }
        } else {
            vscode.window.showInformationMessage('No comments found to remove.', 'Star Repo').then(selection => {
                if (selection === 'Star Repo') {
                    vscode.env.openExternal(vscode.Uri.parse('https://github.com/nabil-devs/comment-remover-pro.git'));
                }
            });
        }
    }

    async undoLastRemoval() {
        if (!this.lastBackupInfo) {
            vscode.window.showInformationMessage('No backup found to restore. The backup may have expired (older than 1 hour) or backup is disabled.', 'Star Repo').then(selection => {
                if (selection === 'Star Repo') {
                    vscode.env.openExternal(vscode.Uri.parse('https://github.com/nabil-devs/comment-remover-pro.git'));
                }
            });
            return;
        }

        const oneHourAgo = Date.now() - (60 * 60 * 1000);
        if (this.lastBackupInfo.timestamp < oneHourAgo) {
            vscode.window.showInformationMessage('Backup has expired (older than 1 hour).', 'Star Repo').then(selection => {
                if (selection === 'Star Repo') {
                    vscode.env.openExternal(vscode.Uri.parse('https://github.com/nabil-devs/comment-remover-pro.git'));
                }
            });
            return;
        }

        const choice = await vscode.window.showWarningMessage(
            'Restore from backup?',
            { modal: true, detail: 'This will restore all files modified in the last operation.' },
            'Restore',
            'Cancel'
        );

        if (choice !== 'Restore') {
            return;
        }

        const restoredCount = await this.restoreBackup(this.lastBackupInfo);
        
        if (restoredCount > 0) {
            vscode.window.showInformationMessage(`Restored ${restoredCount} files from backup.`, 'Star Repo').then(selection => {
                if (selection === 'Star Repo') {
                    vscode.env.openExternal(vscode.Uri.parse('https://github.com/nabil-devs/comment-remover-pro.git'));
                }
            });
        } else {
            vscode.window.showErrorMessage('Failed to restore files from backup.');
        }
    }

    private async processWorkspace(applyChanges: boolean): Promise<{stats: ProcessingStats, backupCreated: boolean}> {
        return vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: applyChanges ? "Removing comments..." : "Scanning for comments...",
            cancellable: true
        }, async (progress, token) => {
            const stats: ProcessingStats = {
                filesScanned: 0,
                filesModified: 0,
                commentsRemoved: 0,
                bytesSaved: 0
            };

            this.outputChannel.clear();
            this.outputChannel.appendLine('=== Comment Remover Pro ===');
            this.outputChannel.appendLine(`Mode: ${applyChanges ? 'Apply Changes' : 'Preview Only'}`);
            this.outputChannel.appendLine('');

            const config = vscode.workspace.getConfiguration('commentRemoverPro');
            const extensions = this.getAllSupportedExtensions();
            const excludePatterns = config.get<string[]>('excludePatterns', []);
            const removeSingleLine = config.get<boolean>('remove.singleLine', true);
            const removeMultiLine = config.get<boolean>('remove.multiLine', true);

            const workspaceFolders = vscode.workspace.workspaceFolders || [];
            const filesToProcess: string[] = [];
            const fileResults: Array<{filePath: string, modified: boolean}> = [];
            
            for (const folder of workspaceFolders) {
                this.outputChannel.appendLine(`📁 Folder: ${folder.name}`);
                
                const batchSize = 10;
                for (let i = 0; i < extensions.length; i += batchSize) {
                    if (token.isCancellationRequested) {
                        this.outputChannel.appendLine('⚠️ Operation cancelled by user');
                        return {stats, backupCreated: false};
                    }

                    const batch = extensions.slice(i, i + batchSize);
                    const pattern = `**/*.{${batch.join(',')}}`;
                    
                    try {
                        const files = await vscode.workspace.findFiles(
                            pattern,
                            `{${excludePatterns.join(',')}}`
                        );

                        for (const file of files) {
                            filesToProcess.push(file.fsPath);
                        }
                    } catch (error) {
                        this.outputChannel.appendLine(`  ⚠️ Error with pattern ${pattern}: ${error}`);
                    }
                }
            }

            let backupCreated = false;
            if (applyChanges && filesToProcess.length > 0) {
                const backupName = await this.createBackup(filesToProcess);
                backupCreated = backupName !== null;
                if (backupCreated) {
                    this.outputChannel.appendLine(`💾 Backup created: ${backupName}`);
                }
            }

            for (let i = 0; i < filesToProcess.length; i++) {
                if (token.isCancellationRequested) {
                    this.outputChannel.appendLine('⚠️ Operation cancelled by user');
                    return {stats, backupCreated};
                }

                const filePath = filesToProcess[i];
                stats.filesScanned++;
                progress.report({
                    message: `Processing ${path.basename(filePath)} (${i + 1}/${filesToProcess.length})`,
                    increment: 100 / Math.max(filesToProcess.length, 1)
                });

                const fileStats = await this.processFile(
                    filePath,
                    removeSingleLine,
                    removeMultiLine,
                    applyChanges
                );

                if (fileStats.modified) {
                    stats.filesModified++;
                    stats.commentsRemoved += fileStats.commentsRemoved;
                    stats.bytesSaved += fileStats.bytesSaved;
                    
                    const folder = workspaceFolders.find(f => filePath.startsWith(f.uri.fsPath));
                    if (folder) {
                        const relativePath = path.relative(folder.uri.fsPath, filePath);
                        this.outputChannel.appendLine(`  ✓ ${relativePath} (${fileStats.commentsRemoved} comments)`);
                    }
                }
            }

            this.outputChannel.appendLine('');
            this.outputChannel.appendLine('=== Summary ===');
            this.outputChannel.appendLine(`Files scanned: ${stats.filesScanned}`);
            this.outputChannel.appendLine(`Files modified: ${stats.filesModified}`);
            this.outputChannel.appendLine(`Comments removed: ${stats.commentsRemoved}`);
            this.outputChannel.appendLine(`Size reduction: ${Math.round(stats.bytesSaved / 1024)} KB`);
            
            if (backupCreated) {
                this.outputChannel.appendLine(`💾 Backup available for 1 hour`);
            }
            
            if (applyChanges) {
                this.outputChannel.appendLine('✅ Changes applied successfully');
            } else {
                this.outputChannel.appendLine('👁️ Preview complete - no changes made');
            }

            return {stats, backupCreated};
        });
    }

    private getAllSupportedExtensions(): string[] {
        return [
            'js', 'jsx', 'mjs', 'cjs', 'ts', 'tsx', 'mts', 'cts',
            'html', 'htm', 'xml', 'svg',
            'css', 'scss', 'sass', 'less',
            'vue', 'svelte',
            'py', 'pyw', 'pyi',
            'java', 'kt', 'kts', 'scala', 'groovy', 'gradle',
            'c', 'h', 'cpp', 'cc', 'cxx', 'hpp', 'hh', 'hxx',
            'cs', 'fs', 'fsx', 'fsi',
            'go', 'rs', 'swift', 'dart',
            'php', 'phtml', 'php3', 'php4', 'php5', 'php7', 'phps',
            'rb', 'rake', 'ru', 'gemspec',
            'pl', 'pm',
            'lua',
            'ex', 'exs',
            'jl',
            'r', 'R',
            'sh', 'bash', 'zsh', 'fish', 'ps1', 'psm1', 'psd1',
            'sql',
            'yaml', 'yml', 'toml', 'json5',
            'ini', 'cfg', 'conf', 'properties',
            'md', 'markdown',
            'hs', 'lhs', 'clj', 'cljs', 'cljc', 'edn', 'elm',
            'pas', 'pp', 'inc',
            'f', 'for', 'f90', 'f95', 'f03', 'f08',
            'v', 'vh', 'sv', 'vhd', 'vhdl',
            'adb', 'ads',
            'pro', 'pwn', 'inc',
            'asm', 's', 'S',
            'tex', 'sty', 'cls',
            'coffee', 'litcoffee',
            'hbs', 'handlebars',
            'm'
        ];
    }

    private async processFile(
        filePath: string,
        removeSingleLine: boolean,
        removeMultiLine: boolean,
        applyChanges: boolean
    ): Promise<{ modified: boolean; commentsRemoved: number; bytesSaved: number }> {
        try {
            const content = fs.readFileSync(filePath, 'utf8');
            const extension = path.extname(filePath).toLowerCase();
            const newContent = this.removeCommentsFromContent(
                content,
                extension,
                removeSingleLine,
                removeMultiLine
            );

            if (newContent !== content) {
                const commentsRemoved = this.countCommentDifferences(content, newContent);
                const bytesSaved = content.length - newContent.length;

                if (applyChanges) {
                    const tempPath = filePath + '.crp-temp';
                    fs.writeFileSync(tempPath, newContent, 'utf8');
                    const verifyContent = fs.readFileSync(tempPath, 'utf8');
                    if (verifyContent === newContent) {
                        fs.renameSync(tempPath, filePath);
                    } else {
                        fs.unlinkSync(tempPath);
                        throw new Error('File verification failed');
                    }
                }

                return {
                    modified: true,
                    commentsRemoved,
                    bytesSaved
                };
            }

            return { modified: false, commentsRemoved: 0, bytesSaved: 0 };
        } catch (error) {
            this.outputChannel.appendLine(`  ❌ Error processing ${filePath}: ${error}`);
            return { modified: false, commentsRemoved: 0, bytesSaved: 0 };
        }
    }

    private removeCommentsFromContent(
        content: string,
        extension: string,
        removeSingleLine: boolean,
        removeMultiLine: boolean
    ): string {
        const handler = this.getLanguageHandler(extension);
        
        let result = content;
        
        if (removeSingleLine) {
            result = handler.removeSingleLineComments(result);
        }
        
        if (removeMultiLine) {
            result = handler.removeMultiLineComments(result);
        }
        
        return result;
    }

    private getLanguageHandler(extension: string) {
        const handlers: Record<string, any> = {
            '.js': new JsStyleHandler(),
            '.jsx': new JsStyleHandler(),
            '.mjs': new JsStyleHandler(),
            '.cjs': new JsStyleHandler(),
            '.ts': new JsStyleHandler(),
            '.tsx': new JsStyleHandler(),
            '.mts': new JsStyleHandler(),
            '.cts': new JsStyleHandler(),
            '.py': new PythonHandler(),
            '.pyw': new PythonHandler(),
            '.pyi': new PythonHandler(),
            '.html': new HtmlHandler(),
            '.htm': new HtmlHandler(),
            '.xml': new HtmlHandler(),
            '.svg': new HtmlHandler(),
            '.css': new CssHandler(),
            '.scss': new ScssHandler(),
            '.sass': new ScssHandler(),
            '.less': new ScssHandler(),
            '.java': new JsStyleHandler(),
            '.kt': new JsStyleHandler(),
            '.kts': new JsStyleHandler(),
            '.scala': new JsStyleHandler(),
            '.c': new JsStyleHandler(),
            '.h': new JsStyleHandler(),
            '.cpp': new JsStyleHandler(),
            '.cc': new JsStyleHandler(),
            '.cxx': new JsStyleHandler(),
            '.hpp': new JsStyleHandler(),
            '.hh': new JsStyleHandler(),
            '.hxx': new JsStyleHandler(),
            '.cs': new JsStyleHandler(),
        };

        return handlers[extension] || new GenericHandler();
    }

    private countCommentDifferences(original: string, modified: string): number {
        const originalLines = original.split('\n');
        const modifiedLines = modified.split('\n');
        let differences = 0;
        
        for (let i = 0; i < Math.min(originalLines.length, modifiedLines.length); i++) {
            const origTrimmed = originalLines[i].trim();
            const modTrimmed = modifiedLines[i].trim();
            
            if (origTrimmed !== modTrimmed) {
                if (origTrimmed.startsWith('//') || origTrimmed.startsWith('#') || 
                    origTrimmed.startsWith('/*') || origTrimmed.endsWith('*/') ||
                    origTrimmed.startsWith('<!--') || origTrimmed.includes('-->')) {
                    differences++;
                }
            }
        }
        
        return differences;
    }
}

class JsStyleHandler {
    removeSingleLineComments(content: string): string {
        const lines = content.split('\n');
        const result: string[] = [];
        
        for (const line of lines) {
            let inString = false;
            let stringChar = '';
            let newLine = '';
            let escaped = false;
            
            for (let i = 0; i < line.length; i++) {
                const char = line[i];
                const nextChar = line[i + 1] || '';
                
                if (escaped) {
                    newLine += char;
                    escaped = false;
                    continue;
                }
                
                if (char === '\\') {
                    escaped = true;
                    newLine += char;
                    continue;
                }
                
                if ((char === '"' || char === "'" || char === '`') && !inString) {
                    inString = true;
                    stringChar = char;
                    newLine += char;
                } else if (inString && char === stringChar) {
                    inString = false;
                    newLine += char;
                } else if (!inString && char === '/' && nextChar === '/') {
                    const prevChar = i > 0 ? line[i - 1] : '';
                    const prevPrevChar = i > 1 ? line[i - 2] : '';
                    const nextNextChar = line[i + 2] || '';
                    if (prevChar === ':' || prevChar === '[' || prevChar === '(' || prevChar === '{' || 
                        (prevChar === '/' && prevPrevChar === '\\') || 
                        (prevChar === '*' && prevPrevChar === '\\') ||
                        nextNextChar === '.' || nextNextChar === ',' || nextNextChar === ']' || nextNextChar === '}' || nextNextChar === ')' || nextNextChar === ';' || nextNextChar === '\'' || nextNextChar === 'g' || nextNextChar === 'i' || nextNextChar === 'm') {
                        newLine += char;
                        continue;
                    }
                    break;
                } else if (!inString && char === '/' && nextChar === '*') {
                    const prevChar = i > 0 ? line[i - 1] : '';
                    if (prevChar === '[') {
                        newLine += char;
                        continue;
                    }
                    break;
                } else {
                    newLine += char;
                }
            }
            
            result.push(newLine);
        }
        
        return result.join('\n');
    }

    removeMultiLineComments(content: string): string {
        let result = '';
        let i = 0;
        let inString = false;
        let stringChar = '';
        let inComment = false;
        let escaped = false;
        
        while (i < content.length) {
            const char = content[i];
            const nextChar = content[i + 1] || '';
            
            if (escaped) {
                if (!inComment) result += char;
                escaped = false;
                i++;
                continue;
            }
            
            if (char === '\\') {
                if (!inComment) result += char;
                escaped = true;
                i++;
                continue;
            }
            
            if (!inComment) {
                if ((char === '"' || char === "'" || char === '`') && !inString) {
                    inString = true;
                    stringChar = char;
                    result += char;
                } else if (inString && char === stringChar) {
                    inString = false;
                    result += char;
                } else if (!inString && char === '/' && nextChar === '*') {
                    const prevChar = i > 0 ? content[i - 1] : '';
                    const prevPrevChar = i > 1 ? content[i - 2] : '';
                    if (prevChar === '[' || prevChar === '(' || prevChar === '{' || 
                        (prevChar === '/' && prevPrevChar === '\\') || 
                        (prevChar === '*' && prevPrevChar === '\\')) {
                        result += char;
                        i++;
                        continue;
                    }
                    inComment = true;
                    i += 2;
                    continue;
                } else {
                    result += char;
                }
            } else {
                if (char === '*' && nextChar === '/') {
                    inComment = false;
                    i += 2;
                    continue;
                }
            }
            
            i++;
        }
        
        return result;
    }
}

class PythonHandler {
    removeSingleLineComments(content: string): string {
        const lines = content.split('\n');
        const result: string[] = [];
        let inTripleString = false;
        let tripleChar = '';
        
        for (const line of lines) {
            if (inTripleString) {
                result.push(line);
                if (line.includes(tripleChar.repeat(3)) && !line.includes('\\' + tripleChar.repeat(3))) {
                    const stringEnd = line.lastIndexOf(tripleChar.repeat(3));
                    if (stringEnd !== -1) {
                        const afterString = line.substring(stringEnd + 3);
                        const hashIndex = afterString.indexOf('#');
                        if (hashIndex !== -1) {
                            result[result.length - 1] = line.substring(0, stringEnd + 3 + hashIndex);
                        }
                    }
                    inTripleString = false;
                }
                continue;
            }
            
            let newLine = '';
            let inString = false;
            let stringChar = '';
            let escaped = false;
            
            for (let i = 0; i < line.length; i++) {
                const char = line[i];
                const nextChar = line[i + 1] || '';
                const nextNextChar = line[i + 2] || '';
                
                if (escaped) {
                    newLine += char;
                    escaped = false;
                    continue;
                }
                
                if (char === '\\') {
                    escaped = true;
                    newLine += char;
                    continue;
                }
                
                if (!inString && (char === "'" || char === '"')) {
                    if (nextChar === char && nextNextChar === char) {
                        inTripleString = true;
                        tripleChar = char;
                        newLine += char + char + char;
                        i += 2;
                        result.push(newLine);
                        break;
                    } else {
                        inString = true;
                        stringChar = char;
                        newLine += char;
                    }
                } else if (inString && char === stringChar) {
                    inString = false;
                    newLine += char;
                } else if (!inString && char === '#') {
                    if (i > 0 && line[i - 1] === ' ') {
                        const beforeComment = line.substring(0, i);
                        if (beforeComment.trim().length > 0) {
                            newLine = beforeComment;
                        }
                    }
                    break;
                } else {
                    newLine += char;
                }
            }
            
            if (!inTripleString) {
                result.push(newLine);
            }
        }
        
        return result.join('\n');
    }

    removeMultiLineComments(content: string): string {
        return content;
    }
}

class HtmlHandler {
    removeSingleLineComments(content: string): string {
        return content;
    }

    removeMultiLineComments(content: string): string {
        let result = '';
        let i = 0;
        let inString = false;
        let stringChar = '';
        
        while (i < content.length) {
            const char = content[i];
            const nextChar = content[i + 1] || '';
            const nextNextChar = content[i + 2] || '';
            const nextNextNextChar = content[i + 3] || '';
            
            if (char === '"' || char === "'") {
                if (!inString) {
                    inString = true;
                    stringChar = char;
                } else if (char === stringChar && content[i - 1] !== '\\') {
                    inString = false;
                }
                result += char;
                i++;
                continue;
            }
            
            if (!inString && char === '<' && nextChar === '!' && nextNextChar === '-' && nextNextNextChar === '-') {
                let j = i + 4;
                while (j < content.length) {
                    if (content[j] === '-' && content[j + 1] === '-' && content[j + 2] === '>') {
                        i = j + 3;
                        break;
                    }
                    j++;
                }
                continue;
            }
            
            result += char;
            i++;
        }
        
        return result;
    }
}

class CssHandler {
    removeSingleLineComments(content: string): string {
        const lines = content.split('\n');
        const result: string[] = [];
        
        for (const line of lines) {
            let inString = false;
            let newLine = '';
            
            for (let i = 0; i < line.length; i++) {
                const char = line[i];
                const nextChar = line[i + 1] || '';
                
                if (char === '"' || char === "'") {
                    inString = !inString;
                    newLine += char;
                } else if (!inString && char === '/' && nextChar === '/') {
                    break;
                } else {
                    newLine += char;
                }
            }
            
            result.push(newLine);
        }
        
        return result.join('\n');
    }

    removeMultiLineComments(content: string): string {
        return (new JsStyleHandler()).removeMultiLineComments(content);
    }
}

class ScssHandler extends JsStyleHandler {
}

class GenericHandler {
    removeSingleLineComments(content: string): string {
        const lines = content.split('\n');
        const result: string[] = [];
        
        for (const line of lines) {
            let inString = false;
            let stringChar = '';
            let newLine = '';
            
            for (let i = 0; i < line.length; i++) {
                const char = line[i];
                const nextChar = line[i + 1] || '';
                
                if ((char === '"' || char === "'") && !inString) {
                    inString = true;
                    stringChar = char;
                    newLine += char;
                } else if (inString && char === stringChar && line[i - 1] !== '\\') {
                    inString = false;
                    newLine += char;
                } else if (!inString && (char === '#' || (char === '/' && nextChar === '/'))) {
                    break;
                } else {
                    newLine += char;
                }
            }
            
            result.push(newLine);
        }
        
        return result.join('\n');
    }

    removeMultiLineComments(content: string): string {
        return content
            .replace(/\/\*[\s\S]*?\*\//g, '')
            .replace(/<!--[\s\S]*?-->/g, '');
    }
}

export function activate(context: vscode.ExtensionContext) {
    const remover = new CommentRemover();
    
    context.subscriptions.push(
        vscode.commands.registerCommand('commentRemoverPro.removeAllComments', () => {
            remover.removeAllComments();
        }),
        vscode.commands.registerCommand('commentRemoverPro.previewChanges', () => {
            remover.previewChanges();
        }),
        vscode.commands.registerCommand('commentRemoverPro.undoLastRemoval', () => {
            remover.undoLastRemoval();
        })
    );
}

export function deactivate() {
}