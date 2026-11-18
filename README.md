# Beyond JSON Compare 🔍

A desktop-grade web application spin-off of **Beyond Compare**, built specifically for JSON files and repository directory comparisons.

![Beyond JSON Compare](https://img.shields.io/badge/Beyond-JSON%20Compare-blue.svg)
![React](https://img.shields.io/badge/React-18-blue.svg)
![Vite](https://img.shields.io/badge/Vite-5-646CFF.svg)
![TailwindCSS](https://img.shields.io/badge/Tailwind-CSS-38B2AC.svg)

---

## 🚀 Key Features

### 1. Multi-Tab Session Management (Up to 100 Tabs)
- **High-Capacity Tab Bar**: Open, compare, and switch between up to 100 JSON comparison sessions tab-wise.
- **Diff Status Badges on Tabs**: Tabs display live diff count badges (`✓` for matching, or `~3 diffs`).
- **Tab Search & Filter Dropdown**: Quickly find and switch to any open tab out of 50–100 tabs with the built-in search popup.
- **Bulk Tab Controls**: "Close Unchanged", "Close Others", and "Close All".
- **Performance Optimized**: Only the active tab renders the heavy diff DOM, keeping memory footprint minimal.

### 2. Folder & Directory Comparison (Folder Compare Session)
- **Path-based Directory Comparison**: Provide two folder paths (e.g. `./repo-v1` and `./repo-v2` or absolute disk paths).
- **Zero Persistent Storage**: Files are checked in-memory on demand; no data is stored or uploaded to any database.
- **Live File Status Breakdown**:
  - 🟢 **Identical**: Same content and structure.
  - 🟡 **Modified / Different**: Different JSON content (with diff count estimation).
  - 🔵 **Left Only**: Present in original repo only (deleted in target).
  - 🟣 **Right Only**: Present in target repo only (added in target).
- **One-Click "Compare in Tab"**: Double-click or click **Compare** on any file to open it in a dedicated JSON Compare Tab.
- **"Open All Diffs in Tabs"**: Instantly batch-opens all modified files into individual tabs for review and merging.
- **Save Back to Disk**: When comparing files from a folder session, click **Save** in the header to write the merged changes directly back to disk.

### 3. Dual Comparison Engines
- **Text Diff Mode (Classic Beyond Compare)**:
  - Side-by-side synchronized vertical and horizontal scrolling.
  - Line numbers and empty padding lines (`~`) to keep matching blocks locked horizontally.
  - **Intra-line character/token diff**: Pinpoints the exact changed value tokens within a line (e.g., `8080` vs `8443`).
  - **Overview Minimap**: Right-edge gutter displaying diff markers across the entire document with click-to-jump.
- **Tree Diff Mode (Beyond Compare Data Compare)**:
  - Deep hierarchical JSON tree inspection.
  - Property-by-property breakdown with status badges (`Added`, `Deleted`, `Changed`, `Type Diff`, `Same`).
  - Search filter by property path, key name, or value.
  - Quick expand controls: "Expand Diffs Only", "Expand All", "Collapse All".

### 4. Interactive Merge Operations
- **Hunk Merging (`[ → ]` / `[ ← ]`)**: Click the merge arrows in the center gutter to push or pull changes block-by-block.
- **Tree Node Merging**: Target specific nested object or array keys.
- **Global Merging**: "Take All Left to Right" (`Ctrl+Shift+→`) and "Take All Right to Left" (`Ctrl+Shift+←`).
- **Swap Sides (`A ⇄ B`)**: Swap left and right files with one click (`Alt+S`).

### 5. Smart JSON Utilities
- **Sort Keys Alphabetically (`A-Z`)**: Solves JSON false-positives by normalizing object key ordering across both documents (semantic comparison).
- **Beautify / Prettify (`Ctrl+Shift+F`)**: Re-indents and canonicalizes JSON formatting.
- **Live Editing & Syntax Validation**: Switch to Edit mode to type or paste directly; real-time alerts warn of invalid JSON with exact line/column indicators.
- **Diff Filter Modes**:
  - `Show All`: View the entire document context.
  - `Diffs Only`: Beyond Compare's signature feature — collapses identical lines to focus solely on changes.
  - `Same Only`: Shows only matching lines.

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
| :--- | :--- |
| `Ctrl + Down` or `Ctrl + N` | Jump to Next Difference |
| `Ctrl + Up` or `Ctrl + P` | Jump to Previous Difference |
| `Home` | Jump to First Difference |
| `End` | Jump to Last Difference |
| `Alt + Right` | Take Current Diff: Left → Right |
| `Alt + Left` | Take Current Diff: Right → Left |
| `Ctrl + Shift + Right` | Take ALL Diffs: Left → Right |
| `Ctrl + Shift + Left` | Take ALL Diffs: Right → Left |
| `Ctrl + Shift + F` | Beautify & Prettify JSON |
| `Alt + S` | Swap Left and Right Documents |
| `Escape` | Close Dialogs & Modals |

---

## 🛠️ Getting Started

### Prerequisites
- Node.js (v18+)
- npm

### Installation & Run
```bash
# Install dependencies
npm install

# Start the Vite development server
npm run dev

# Open http://localhost:3000 in your browser
```

### Try the Sample Folders
In the **Folder Compare** tab, click **Load Sample Folders** to immediately scan and compare `./test-folders/repo-v1` and `./test-folders/repo-v2`.
