# Quick Start Guide

Get started with markpdf in minutes. This guide covers the essential commands and features you need to know.

## 📋 Table of Contents

- [Installation](#installation)
- [Basic Usage](#basic-usage)
- [Key Features](#key-features)
- [Common Commands](#common-commands)
- [Next Steps](#next-steps)

## Installation

### Install from npm

```bash
npm install -g md-pdf
```

### Install as a dependency

```bash
npm install md-pdf
```

### For development

```bash
git clone https://github.com/ml-lubich/markpdf.git
cd markpdf
npm install
npm run build
npm link
```

## Basic Usage

### Convert a Single File

```bash
md-pdf document.md
```

This creates `document.pdf` in the same directory.

### Convert Multiple Files

```bash
md-pdf *.md
md-pdf chapter1.md chapter2.md chapter3.md
```

### Watch Mode (Auto-regenerate)

```bash
md-pdf document.md --watch
```

Automatically regenerates the PDF when the file changes.

### Convert from Stdin

```bash
cat document.md | md-pdf > output.pdf
echo "# Hello" | md-pdf > output.pdf
```

## Key Features

### Mermaid Diagram Support

Simply include Mermaid code blocks in your Markdown:

````markdown
```mermaid
flowchart TD
    A[Start] --> B{Decision}
    B -->|Yes| C[Action 1]
    B -->|No| D[Action 2]
```
````

The tool automatically:
- Detects Mermaid code blocks
- Renders them to images
- Embeds them in the PDF
- Cleans up temporary files

**Supported diagram types:**
- Flowcharts
- Sequence Diagrams
- Gantt Charts
- Class Diagrams
- State Diagrams
- Entity Relationship Diagrams
- And more!

### Syntax Highlighting

Automatic syntax highlighting for code blocks:

```bash
md-pdf document.md --highlight-style monokai
```

Available themes: `github`, `monokai`, `vs`, `atom-one-dark`, `dracula`, etc.

### Custom Styling

Add custom CSS:

```bash
md-pdf document.md --stylesheet custom.css --css "body { font-size: 12pt; }"
```

## Common Commands

### Get Help

```bash
md-pdf --help
```

### Show Version

```bash
md-pdf --version
```

### Custom PDF Format

```bash
md-pdf document.md --pdf-options '{"format": "Letter", "margin": "20mm"}'
```

### Generate HTML Instead of PDF

```bash
md-pdf document.md --as-html
```

### Front Matter Configuration

Configure PDF options directly in your Markdown file:

````markdown
---
pdf_options:
  format: a4
  margin: 30mm
  printBackground: true
stylesheet:
  - custom.css
highlight_style: monokai
---

# Your Document
````

## Next Steps

- **Detailed Usage**: See [USAGE.md](./USAGE.md) for comprehensive documentation
- **CLI Reference**: See [../CLI-INTERFACE.md](../CLI-INTERFACE.md) for all options
- **Examples**: Check [../../examples/](../../examples/) directory
- **Architecture**: See [../ARCHITECTURE.md](../ARCHITECTURE.md) for developers

## Troubleshooting

### Command Not Found

If `md-pdf` is not found:
- Ensure it's installed: `npm install -g md-pdf`
- Or use: `npx md-pdf` instead
- For development: run `npm link` after building

### Permission Denied

Make sure the CLI file is executable:
```bash
chmod +x dist/cli.js
npm link
```

### Port Already in Use

Specify a different port:
```bash
md-pdf document.md --port 3001
```

### Mermaid Charts Not Rendering

- Ensure internet connection (Mermaid.js is loaded from CDN)
- Check that Mermaid code blocks use exactly `\`\`\`mermaid` (lowercase)
- Wait a bit longer - first render can take time
