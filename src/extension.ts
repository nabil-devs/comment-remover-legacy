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

class CommentRemover {
    private outputChannel: vscode.OutputChannel;
    
    constructor() {
        this.outputChannel = vscode.window.createOutputChannel('Comment Remover Pro');
    }

    async removeAllComments() {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        
        if (!workspaceFolders) {
            vscode.window.showErrorMessage('No workspace folder is open.');
            return;
        }

        const choice = await vscode.window.showWarningMessage(
            'Remove comments from entire workspace?',
            { modal: true, detail: 'This will process all supported file types.' },
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

        const stats = await this.processWorkspace(true);
        
        if (stats.filesModified > 0) {
            const message = `Removed ${stats.commentsRemoved} comments from ${stats.filesModified} files`;
            vscode.window.showInformationMessage(message, 'Show Details', 'Undo').then(selection => {
                if (selection === 'Show Details') {
                    this.outputChannel.show();
                } else if (selection === 'Undo') {
                    this.undoLastRemoval();
                }
            });
        } else {
            vscode.window.showInformationMessage('No comments found to remove.');
        }
    }

    async previewChanges() {
        const stats = await this.processWorkspace(false);
        
        if (stats.filesModified > 0) {
            const choice = await vscode.window.showInformationMessage(
                `Found ${stats.commentsRemoved} comments in ${stats.filesModified} files`,
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
            vscode.window.showInformationMessage('No comments found to remove.');
        }
    }

    async undoLastRemoval() {
        
        vscode.window.showInformationMessage('Undo feature coming soon!');
    }

    private async processWorkspace(applyChanges: boolean): Promise<ProcessingStats> {
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
            
            for (const folder of workspaceFolders) {
                this.outputChannel.appendLine(`📁 Folder: ${folder.name}`);
                
                
                const batchSize = 10;
                for (let i = 0; i < extensions.length; i += batchSize) {
                    if (token.isCancellationRequested) {
                        this.outputChannel.appendLine('⚠️ Operation cancelled by user');
                        return stats;
                    }

                    const batch = extensions.slice(i, i + batchSize);
                    const pattern = `**/*.{${batch.join(',')}}`;
                    
                    try {
                        const files = await vscode.workspace.findFiles(
                            pattern,
                            `{${excludePatterns.join(',')}}`
                        );

                        for (const file of files) {
                            stats.filesScanned++;
                            progress.report({
                                message: `Processing ${path.basename(file.fsPath)}`,
                                increment: 100 / (extensions.length / batchSize) / workspaceFolders.length / Math.max(files.length, 1)
                            });

                            const fileStats = await this.processFile(
                                file.fsPath,
                                removeSingleLine,
                                removeMultiLine,
                                applyChanges
                            );

                            if (fileStats.modified) {
                                stats.filesModified++;
                                stats.commentsRemoved += fileStats.commentsRemoved;
                                stats.bytesSaved += fileStats.bytesSaved;
                                
                                const relativePath = path.relative(folder.uri.fsPath, file.fsPath);
                                this.outputChannel.appendLine(`  ✓ ${relativePath} (${fileStats.commentsRemoved} comments)`);
                            }
                        }
                    } catch (error) {
                        this.outputChannel.appendLine(`  ⚠️ Error with pattern ${pattern}: ${error}`);
                    }
                }
            }

            
            this.outputChannel.appendLine('');
            this.outputChannel.appendLine('=== Summary ===');
            this.outputChannel.appendLine(`Files scanned: ${stats.filesScanned}`);
            this.outputChannel.appendLine(`Files modified: ${stats.filesModified}`);
            this.outputChannel.appendLine(`Comments removed: ${stats.commentsRemoved}`);
            this.outputChannel.appendLine(`Size reduction: ${Math.round(stats.bytesSaved / 1024)} KB`);
            
            if (applyChanges) {
                this.outputChannel.appendLine('✅ Changes applied successfully');
            } else {
                this.outputChannel.appendLine('👁️ Preview complete - no changes made');
            }

            return stats;
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
                    fs.writeFileSync(filePath, newContent, 'utf8');
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
            if (originalLines[i].trim() !== modifiedLines[i].trim()) {
                differences++;
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
            
            for (let i = 0; i < line.length; i++) {
                const char = line[i];
                const nextChar = line[i + 1] || '';
                
                
                if (char === '"' || char === "'" || char === '`') {
                    if (!inString) {
                        inString = true;
                        stringChar = char;
                    } else if (char === stringChar && line[i - 1] !== '\\') {
                        inString = false;
                    }
                    newLine += char;
                    continue;
                }
                
                
                if (!inString && char === '/' && nextChar === '/') {
                    break;
                }
                
                newLine += char;
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
        
        while (i < content.length) {
            const char = content[i];
            const nextChar = content[i + 1] || '';
            
            if (!inComment) {
                
                if (char === '"' || char === "'" || char === '`') {
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
                
                
                if (!inString && char === '/' && nextChar === '*') {
                    inComment = true;
                    i += 2;
                    continue;
                }
                
                result += char;
                i++;
            } else {
                
                if (char === '*' && nextChar === '/') {
                    inComment = false;
                    i += 2;
                } else {
                    i++;
                }
            }
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
                
                if (line.includes(tripleChar.repeat(3))) {
                    inTripleString = false;
                }
                continue;
            }
            
            let newLine = '';
            let inString = false;
            let stringChar = '';
            
            for (let i = 0; i < line.length; i++) {
                const char = line[i];
                const nextChar = line[i + 1] || '';
                const nextNextChar = line[i + 2] || '';
                
                
                if (!inString && (char === "'" || char === '"')) {
                    if (nextChar === char && nextNextChar === char) {
                        inTripleString = true;
                        tripleChar = char;
                        newLine += char + char + char;
                        i += 2;
                        result.push(newLine);
                        break;
                    }
                }
                
                
                if (char === '"' || char === "'") {
                    if (!inString) {
                        inString = true;
                        stringChar = char;
                    } else if (char === stringChar && line[i - 1] !== '\\') {
                        inString = false;
                    }
                    newLine += char;
                    continue;
                }
                
                
                if (!inString && char === '#') {
                    break;
                }
                
                newLine += char;
            }
            
            result.push(newLine);
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
        
        while (i < content.length) {
            const char = content[i];
            const nextChar = content[i + 1] || '';
            const nextNextChar = content[i + 2] || '';
            const nextNextNextChar = content[i + 3] || '';
            
            
            if (char === '<' && nextChar === '!' && nextNextChar === '-' && nextNextNextChar === '-') {
                
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
        
        return content;
    }

    removeMultiLineComments(content: string): string {
        return (new JsStyleHandler()).removeMultiLineComments(content);
    }
}

class ScssHandler extends JsStyleHandler {
    
}

class GenericHandler {
    removeSingleLineComments(content: string): string {
        
        return content.replace(/^\s*#.*$/gm, '')
                     .replace(/^\s*\/\/.*$/gm, '')
                     .replace(/^\s*--.*$/gm, '');
    }

    removeMultiLineComments(content: string): string {

        return content
            .replace(/\/\/.*$/gm, '')
            .replace(/\/\*[\s\S]*?\*\//g, '')
            .replace(/#.*$/gm, '')
            .replace(/<!--[\s\S]*?-->/g, '')
            .replace(/^\s*[\r\n]/gm, '');
    } 
}

export function activate(context: vscode.ExtensionContext) {
    console.log('Comment Remover Pro is now active!');
    
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

export function deactivate() {}