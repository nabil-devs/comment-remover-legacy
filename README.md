# USE AT YOUR OWN RISK, MAJOR BUG PATCHES COMING JAN/6/2026

<div align="left" style="position: relative;">
<h1>COMMENT REMOVER PRO
<p align="left">
	<em><code>🧹 Smart Comment Removal for 50+ Programming Languages</code></em>
</p>
<p align="left">
  <img src="https://img.shields.io/github/last-commit/nabil-devs/comment-remover-pro?style=default&logo=git&logoColor=white&color=0080ff" alt="last-commit">
  <img src="https://img.shields.io/github/languages/top/nabil-devs/comment-remover-pro?style=default&color=0080ff" alt="repo-top-language">
  <img src="https://img.shields.io/github/languages/count/nabil-devs/comment-remover-pro?style=default&color=0080ff" alt="repo-language-count">
  <img src="https://img.shields.io/badge/Supports-50%2B%20Languages-brightgreen" alt="languages-supported">
</p>
<p align="left">
</p>
<p align="left">

</p>
</div>
<br clear="right">

https://marketplace.visualstudio.com/items?itemName=Nabil-Devs.comment-remover-pro-v3-by-nabildevs

<details><summary>Table of Contents</summary>

- [📍 Overview](#-overview)
- [✨ Key Features](#-key-features)
- [🌐 Supported Languages](#-supported-languages)
- [📁 Project Structure](#-project-structure)
  - [📂 Project Index](#-project-index)
- [🚀 Getting Started](#-getting-started)
  - [⚡ Quick Installation](#-quick-installation)
  - [🔨 Building from Source](#-building-from-source)
  - [🤖 Usage](#🤖-usage)
  - [⚙️ Configuration](#️-configuration)
- [🛡️ Safety Features](#️-safety-features)
- [🎯 Use Cases](#-use-cases)
- [📌 Project Roadmap](#-project-roadmap)
- [🔰 Contributing](#-contributing)
- [🎗 License](#-license)
- [🙌 Acknowledgments](#-acknowledgments)

</details>
<hr>

## 📍 Overview

**Comment Remover Pro** is a powerful VS Code extension that safely removes comments from your entire codebase while preserving comment-like text inside strings. Perfect for code minification, obfuscation, cleaning, and production preparation.

**Why use Comment Remover Pro?**
- 🛡️ **Safe**: Preserves URLs, regex patterns, and strings containing comment characters
- 🌐 **Universal**: Supports 50+ programming languages
- ⚡ **Fast**: Processes thousands of files in seconds
- 🔄 **Reliable**: Includes backup, preview, and undo features
- 🎯 **Smart**: Language-specific comment detection algorithms

**Perfect for:**
- Preparing code for production
- Reducing file sizes
- Code obfuscation
- Cleaning legacy codebases
- Educational purposes (focusing on code logic)

---

## ✨ Key Features

### 🛡️ **Safe & Smart Removal**
- **String Detection**: Preserves `"//"`, `"#"`, `"/*"` inside strings and URLs
- **Multi-line String Support**: Handles Python's `"""` and JavaScript's template literals
- **Language-Specific Parsing**: Different algorithms for each programming language

### 🔄 **Complete Workflow**
- **Preview Mode**: See what will be removed before making changes
- **Auto Backup**: Creates timestamped backups before modification
- **One-Click Undo**: Restore from the most recent backup
- **Progress Tracking**: Real-time progress with cancellation support

### ⚙️ **Advanced Configuration**
- **File Type Filtering**: Choose which file extensions to process
- **Comment Type Control**: Toggle single-line and multi-line comments separately
- **Pattern Exclusion**: Exclude directories with glob patterns
- **Shebang Handling**: Option to preserve or remove shebang lines

### 📊 **Detailed Reporting**
- **Real-time Output**: Live processing log in VS Code output panel
- **Statistics**: Files scanned, modified, and comments removed
- **Size Reduction**: Calculate bytes saved from comment removal

---

## 🌐 Supported Languages

**Web Development:**
- JavaScript (.js, .jsx, .mjs, .cjs)
- TypeScript (.ts, .tsx, .mts, .cts)
- HTML (.html, .htm)
- CSS (.css, .scss, .sass, .less)
- Vue (.vue), Svelte (.svelte)

**Backend & Systems:**
- Python (.py, .pyw, .pyi)
- Java (.java), Kotlin (.kt), Scala (.scala)
- C/C++ (.c, .h, .cpp, .cc, .hpp)
- C# (.cs), F# (.fs, .fsx)
- Go (.go), Rust (.rs), Swift (.swift), Dart (.dart)

**Scripting:**
- PHP (.php, .phtml)
- Ruby (.rb, .rake)
- Perl (.pl, .pm)
- Lua (.lua), Elixir (.ex), Julia (.jl)

**Shell & Scripts:**
- Bash/Shell (.sh, .bash, .zsh)
- PowerShell (.ps1, .psm1)
- SQL (.sql)

**Configuration & Data:**
- YAML (.yaml, .yml), TOML (.toml)
- JSON5 (.json5)
- INI (.ini, .cfg), Properties (.properties)

**Documentation:**
- Markdown (.md, .markdown)

**And many more!** (Total: 50+ file types)

---

## 📁 Project Structure

```sh
└── comment-remover-pro/
    ├── .vscode/                  # VS Code configuration
    │   ├── launch.json          # Debug configuration
    │   ├── settings.json        # Editor settings
    │   └── tasks.json           # Build tasks
    ├── images/                  # Extension assets
    │   └── icon.png            # Extension icon
    ├── src/                     # TypeScript source
    │   └── extension.ts        # Main extension code
    ├── out/                     # Compiled JavaScript
    │   ├── extension.js        # Compiled extension
    │   └── extension.js.map    # Source maps
    ├── .vscodeignore           # Files to exclude from package
    ├── LICENSE                 # MIT License
    ├── package.json           # Extension manifest
    ├── tsconfig.json          # TypeScript configuration
    └── README.md              # This file
```

### 📂 Project Index
<details open>
	<summary><b><code>COMMENT-REMOVER-PRO/</code></b></summary>
	<details>
		<summary><b>src</b></summary>
		<blockquote>
			<table>
			<tr>
				<td><b><a href='https://github.com/nabil-devs/comment-remover-pro/blob/master/src/extension.ts'>extension.ts</a></b></td>
				<td>Main extension implementation with language handlers and processing logic</td>
			</tr>
			</table>
		</blockquote>
	</details>
	<details>
		<summary><b>out</b></summary>
		<blockquote>
			<table>
			<tr>
				<td><b><a href='https://github.com/nabil-devs/comment-remover-pro/blob/master/out/extension.js'>extension.js</a></b></td>
				<td>Compiled JavaScript extension code</td>
			</tr>
			<tr>
				<td><b><a href='https://github.com/nabil-devs/comment-remover-pro/blob/master/out/extension.js.map'>extension.js.map</a></b></td>
				<td>Source maps for debugging</td>
			</tr>
			</table>
		</blockquote>
	</details>
	<details>
		<summary><b>Configuration Files</b></summary>
		<blockquote>
			<table>
			<tr>
				<td><b><a href='https://github.com/nabil-devs/comment-remover-pro/blob/master/package.json'>package.json</a></b></td>
				<td>VS Code extension manifest with commands and configuration</td>
			</tr>
			<tr>
				<td><b><a href='https://github.com/nabil-devs/comment-remover-pro/blob/master/tsconfig.json'>tsconfig.json</a></b></td>
				<td>TypeScript compiler configuration</td>
			</tr>
			<tr>
				<td><b><a href='https://github.com/nabil-devs/comment-remover-pro/blob/master/.vscodeignore'>.vscodeignore</a></b></td>
				<td>Files to exclude from the extension package</td>
			</tr>
			</table>
		</blockquote>
	</details>
</details>

---
## 🚀 Getting Started

### ⚡ Quick Installation

1. **From VS Code Marketplace:**
   - Open VS Code
   - Go to Extensions (Ctrl+Shift+X)
   - Search for "Comment Remover Pro"
   - Click Install

2. **From VSIX file:**
   - Download the latest `.vsix` file from releases
   - In VS Code: Extensions → ⋮ → Install from VSIX...
   - Select the downloaded file

### 🔨 Building from Source

**Prerequisites:**
- Node.js (v14 or higher)
- npm or yarn
- TypeScript compiler
- VS Code Extension Development Tools

**Build Steps:**

```bash
# 1. Clone the repository
git clone https://github.com/nabil-devs/comment-remover-pro.git
cd comment-remover-pro

# 2. Install dependencies
npm install

# 3. Compile TypeScript
npm run compile

# 4. Package the extension
npx @vscode/vsce package

# 5. Install the generated .vsix file in VS Code
#    - Open Extensions view
#    - Click "..." → "Install from VSIX..."
#    - Select comment-remover-pro-X.X.X.vsix
```

### 🤖 Usage

**Three Ways to Use:**

1. **Command Palette (Recommended):**
   - Press `Ctrl+Shift+P`
   - Type "Remove All Comments from Workspace"
   - Press Enter

2. **Explorer Context Menu:**
   - Right-click any folder in Explorer
   - Select "Remove All Comments from Workspace"

3. **Keyboard Shortcut:**
   - `Ctrl+Shift+/` (Windows/Linux)
   - `Cmd+Shift+/` (Mac)

**Workflow:**
```
1. Preview → Review changes without modifying files
2. Apply → Remove comments (creates automatic backup)
3. Undo → Restore from backup if needed
```

### ⚙️ Configuration

Customize the extension in VS Code Settings (Ctrl+,):

```json
{
  "commentRemoverPro.backup.enabled": true,
  "commentRemoverPro.fileExtensions": [".js", ".ts", ".py", ".html"],
  "commentRemoverPro.remove.singleLine": true,
  "commentRemoverPro.remove.multiLine": true,
  "commentRemoverPro.excludePatterns": [
    "**/node_modules/**",
    "**/.git/**",
    "**/dist/**"
  ]
}
```

**Configuration Options:**
- `backup.enabled`: Create backups before modification (default: true)
- `backup.location`: Backup directory location
- `fileExtensions`: Array of file extensions to process
- `remove.singleLine`: Remove single-line comments (//, #, --)
- `remove.multiLine`: Remove multi-line comments (/* */, <!-- -->)
- `remove.shebang`: Remove shebang lines (#!/usr/bin/env)
- `excludePatterns`: Glob patterns to exclude from processing

---

## 🛡️ Safety Features

### 🔐 **Backup System**
- Automatic timestamped backups
- Configurable backup location
- Backup metadata storage
- Automatic cleanup of old backups

### 👁️ **Preview Mode**
- Shows exactly what will be removed
- No changes made to files
- Statistics about potential modifications
- Option to apply or cancel

### ↩️ **Undo Functionality**
- One-click restore from most recent backup
- Backup history tracking
- Safe rollback mechanism

### 🚨 **Safety Checks**
- Modal confirmation before destructive operations
- Cancellable operations at any time
- Error handling with detailed logging
- Skip read-only and system files

---

## 🎯 Use Cases

### **1. Production Code Preparation**
```javascript
// Before: Development code with comments
const apiUrl = "https://api.example.com"; // Development API
const debugMode = true; // TODO: Set to false in production

// After: Clean production code
const apiUrl = "https://api.example.com";
const debugMode = true;
```

### **2. Code Minification & Obfuscation**
Remove comments to reduce file sizes before:
- Bundling with Webpack/Rollup
- Deploying to production servers
- Distributing proprietary code

### **3. Educational Code Examples**
Create clean examples by removing:
- Development notes
- TODO/FIXME comments
- Debug statements
- Internal documentation

### **4. Legacy Code Cleanup**
Remove outdated comments from:
- Old codebases
- Migrated projects
- Deprecated functionality

---

## 📌 Project Roadmap

### ✅ **Completed**
- [X] **Core Comment Removal**: Basic comment removal for major languages
- [X] **String Preservation**: Smart detection of comment-like text in strings
- [X] **Preview Mode**: Safe preview without file modification
- [X] **Backup System**: Automatic backups before changes
- [X] **Multi-language Support**: 50+ programming languages
- [X] **VS Code Integration**: Commands, menus, and configuration

### 🚧 **In Progress**
- [ ] **Advanced Pattern Matching**: Regex-based custom comment patterns
- [ ] **Language-specific Settings**: Per-language configuration
- [ ] **Batch Size Optimization**: Improved performance for large projects

### 📋 **Planned**
- [ ] **Cloud Backup Integration**: Backup to cloud storage services
- [ ] **Team Collaboration**: Shared settings and templates
- [ ] **AI-Powered Analysis**: Smart comment categorization
- [ ] **Code Style Preservation**: Maintain formatting while removing comments
- [ ] **VS Code Workspace Trust**: Enhanced security features

---

## 🔰 Contributing

We welcome contributions! Here's how you can help:

### **Ways to Contribute**
1. **Report Bugs**: Found an issue? [Open an issue](https://github.com/nabil-devs/comment-remover-pro/issues)
2. **Suggest Features**: Have an idea? [Start a discussion](https://github.com/nabil-devs/comment-remover-pro/discussions)
3. **Submit PRs**: Want to code? [Check open issues](https://github.com/nabil-devs/comment-remover-pro/pulls)
4. **Improve Docs**: Fix typos or improve documentation

### **Development Setup**
```bash
# 1. Fork and clone
git clone https://github.com/nabil-devs/comment-remover-pro.git
cd comment-remover-pro

# 2. Install dependencies
npm install

# 3. Run in development mode
npm run watch

# 4. Press F5 to launch extension development host
# 5. Make changes and test
```

### **Code Guidelines**
- Follow TypeScript best practices
- Add tests for new features
- Update documentation
- Use meaningful commit messages
- Follow existing code style

### **Pull Request Process**
1. Create a feature branch
2. Make your changes
3. Add/update tests
4. Update documentation
5. Submit PR with description

<details closed>
<summary>Contributor Graph</summary>
<br>
<p align="left">
   <a href="https://github.com/nabil-devs/comment-remover-pro/graphs/contributors">
      <img src="https://contrib.rocks/image?repo=nabil-devs/comment-remover-pro">
   </a>
</p>
</details>

---

## 🎗 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

**Permissions:**
- ✅ Commercial use
- ✅ Modification
- ✅ Distribution
- ✅ Private use
- ✅ Sublicensing

**Limitations:**
- ❌ Liability
- ❌ Warranty

**Conditions:**
- © Include original copyright notice
- © Include license copy

---

## 🙌 Acknowledgments

### **Built With**
- [Visual Studio Code](https://code.visualstudio.com/) - The best code editor
- [TypeScript](https://www.typescriptlang.org/) - Type-safe JavaScript
- [Node.js](https://nodejs.org/) - JavaScript runtime

### **Inspiration**
- Inspired by the need for clean, production-ready code
- Built for developers who value code quality and performance
- Created to solve real-world code maintenance challenges

### **Special Thanks**
- The NovaDev Team for making this possible
- The open-source community for invaluable tools and libraries
- All contributors and users who help improve this extension


---

<div align="center">
<sub>Built with ❤️ by the open-source community</sub><br>
<sub>If this extension helps you, consider giving it a ⭐ on GitHub!</sub>
</div>

---

**Disclaimer**: Always back up your code before using automated tools. While Comment Remover Pro is designed to be safe, the developers are not responsible for any data loss. Use the preview feature first!
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  