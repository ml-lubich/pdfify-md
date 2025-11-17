# Usage Guide

Comprehensive guide to using md-pdf for converting Markdown files to PDF and HTML.

## 📋 Table of Contents

- [Installation Options](#installation-options)
- [Command-Line Usage](#command-line-usage)
  - [Basic Commands](#basic-commands)
  - [Input Options](#input-options)
  - [Output Options](#output-options)
- [Configuration](#configuration)
  - [Configuration Sources](#configuration-sources)
  - [CLI Options](#cli-options)
  - [Front Matter](#front-matter)
  - [Config Files](#config-files)
- [Features](#features)
  - [Mermaid Diagrams](#mermaid-diagrams)
  - [Syntax Highlighting](#syntax-highlighting)
  - [Custom Styling](#custom-styling)
  - [Watch Mode](#watch-mode)
- [Examples](#examples)
- [Troubleshooting](#troubleshooting)

## Installation Options

### Global Installation

```bash
npm install -g md-pdf
```

After installation, use `md-pdf` from anywhere:

```bash
md-pdf document.md
```

### Local Installation (as Dependency)

```bash
npm install md-pdf
```

Then use in your code:

```typescript
import { mdToPdf } from 'md-pdf';

const pdf = await mdToPdf({ path: 'document.md' });
```

### Development Installation

```bash
git clone https://github.com/ml-lubich/markpdf.git
cd markpdf
npm install
npm run build
npm link
```

## Command-Line Usage

### Basic Commands

```bash
# Convert single file
md-pdf document.md

# Convert multiple files
md-pdf *.md
md-pdf file1.md file2.md file3.md

# Watch mode
md-pdf document.md --watch

# Show help
md-pdf --help

# Show version
md-pdf --version
```

### Input Options

#### File Input

```bash
md-pdf path/to/document.md
```

#### Stdin Input

```bash
cat document.md | md-pdf > output.pdf
echo "# Hello World" | md-pdf > output.pdf
```

### Output Options

#### Default Output

Creates PDF file with same name as input:

```bash
md-pdf document.md  # Creates document.pdf
```

#### HTML Output

```bash
md-pdf document.md --as-html  # Creates document.html
```

#### Custom Output Path

Use `--dest` option (handled internally via configuration).

## Configuration

### Configuration Sources

Configuration is merged in this order (later sources override earlier ones):

1. **Default configuration** - Built-in defaults
2. **Config file** (optional) - JSON/JS file specified with `--config-file`
3. **Front matter** (optional) - YAML front matter in the Markdown file
4. **CLI arguments** - Command-line options (highest priority)

### CLI Options

#### General Options

| Option | Description | Example |
|--------|-------------|---------|
| `-h, --help` | Show help | `md-pdf --help` |
| `-v, --version` | Show version | `md-pdf --version` |
| `-w, --watch` | Watch mode | `md-pdf doc.md --watch` |

#### Styling Options

| Option | Description | Example |
|--------|-------------|---------|
| `--stylesheet <path>` | Custom stylesheet | `--stylesheet custom.css` |
| `--css <css>` | Inline CSS | `--css "body { font-size: 12pt; }"` |
| `--highlight-style <name>` | Code highlighting theme | `--highlight-style monokai` |
| `--body-class <class>` | Body CSS class | `--body-class markdown-body` |

#### PDF Options

| Option | Description | Example |
|--------|-------------|---------|
| `--pdf-options <json>` | Puppeteer PDF options | `--pdf-options '{"format":"Letter"}'` |
| `--page-media-type <type>` | Media type (screen/print) | `--page-media-type print` |

#### Advanced Options

| Option | Description | Example |
|--------|-------------|---------|
| `--config-file <path>` | Config file | `--config-file config.json` |
| `--basedir <path>` | Base directory | `--basedir ./docs` |
| `--port <number>` | HTTP server port | `--port 3000` |
| `--as-html` | Output HTML | `--as-html` |
| `--devtools` | Open browser devtools | `--devtools` |

### Front Matter

Configure PDF options in your Markdown file:

````markdown
---
pdf_options:
  format: a4
  margin: 30mm 25mm
  printBackground: true
  headerTemplate: |-
    <div style="text-align: center; font-size: 11px;">
      Document Title
    </div>
  footerTemplate: |-
    <div style="text-align: center;">
      Page <span class="pageNumber"></span> of <span class="totalPages"></span>
    </div>
stylesheet:
  - https://cdnjs.cloudflare.com/ajax/libs/github-markdown-css/5.0.0/github-markdown.min.css
body_class: markdown-body
highlight_style: github
---

# Your Document Content
````

### Config Files

Create a JSON config file:

```json
{
  "highlight_style": "monokai",
  "pdf_options": {
    "format": "A4",
    "margin": "20mm"
  },
  "stylesheet": ["custom.css"]
}
```

Or JavaScript config file:

```javascript
module.exports = {
  highlight_style: 'monokai',
  pdf_options: {
    format: 'A4',
    margin: '20mm'
  },
  stylesheet: ['custom.css']
};
```

Use it:

```bash
md-pdf document.md --config-file config.json
```

## Features

### Mermaid Diagrams

**How it works:**
1. Tool detects `\`\`\`mermaid` code blocks
2. Each diagram is rendered to a PNG image
3. Images are embedded as base64 data URIs in the PDF
4. Temporary files are automatically cleaned up

**Example:**

````markdown
```mermaid
graph TD
    A[Start] --> B{Decision}
    B -->|Yes| C[Action 1]
    B -->|No| D[Action 2]
```
````

**Important:**
- Use exactly `\`\`\`mermaid` (lowercase) - case-sensitive
- No Mermaid charts = faster processing (nothing generated)
- Multiple charts are processed sequentially

### Syntax Highlighting

Automatic syntax highlighting for code blocks using highlight.js:

```bash
md-pdf document.md --highlight-style github
```

Popular themes: `github`, `monokai`, `vs`, `atom-one-dark`, `dracula`, `github-dark`.

### Custom Styling

#### Stylesheet Files

```bash
md-pdf document.md --stylesheet custom.css --stylesheet theme.css
```

#### Inline CSS

```bash
md-pdf document.md --css "body { font-family: 'Georgia', serif; font-size: 12pt; }"
```

#### Remote Stylesheets

```bash
md-pdf document.md --stylesheet https://cdn.example.com/style.css
```

### Watch Mode

Automatically regenerate PDF when files change:

```bash
md-pdf document.md --watch
```

Press `Ctrl+C` to stop watching.

## Examples

### Basic Conversion

```bash
md-pdf README.md
```

### Custom Styling

```bash
md-pdf document.md \
  --stylesheet custom.css \
  --css "body { font-family: 'Georgia', serif; }" \
  --highlight-style monokai
```

### Custom PDF Format

```bash
md-pdf document.md --pdf-options '{"format": "Letter", "landscape": true, "margin": "1in"}'
```

### Watch Mode

```bash
md-pdf document.md --watch
```

### Multiple Files with Config

```bash
md-pdf chapter*.md --config-file book-config.json
```

### Stdin to Stdout

```bash
cat document.md | md-pdf > output.pdf
```

### Generate HTML

```bash
md-pdf document.md --as-html
```

## Troubleshooting

### Command Not Found

**Issue:** `zsh: command not found: md-pdf`

**Solutions:**
1. Install globally: `npm install -g md-pdf`
2. Use npx: `npx md-pdf document.md`
3. For development: `npm link` after building

### Permission Denied

**Issue:** `zsh: permission denied: md-pdf`

**Solutions:**
```bash
# Make CLI executable
chmod +x dist/cli.js

# Re-link
npm unlink
npm link
```

### Port Already in Use

**Issue:** Error about port being in use

**Solution:**
```bash
md-pdf document.md --port 3001
```

### Mermaid Charts Not Showing

**Issue:** Mermaid diagrams appear as links or not rendered

**Check:**
- Use exactly `\`\`\`mermaid` (lowercase) - case-sensitive
- Ensure internet connection (Mermaid.js loaded from CDN)
- Wait longer - first render can take time
- Check browser console if using `--devtools`

### Process Hangs

**Issue:** Command doesn't complete

**Causes:**
- Mermaid processing (can take time with many charts)
- Browser launching (first run is slower)
- Network issues downloading Mermaid.js

**Solutions:**
- Wait longer (first run can be slow)
- Check internet connection
- Try with simpler file first: `md-pdf src/test/basic/test.md`

### File Not Found

**Issue:** Error about file not found

**Solution:**
```bash
# Use absolute path
md-pdf /full/path/to/document.md

# Or relative path
md-pdf ./document.md
```

## Related Documentation

- **Quick Start**: [QUICKSTART.md](./QUICKSTART.md) - Get started quickly
- **CLI Reference**: [../CLI-INTERFACE.md](../CLI-INTERFACE.md) - Complete CLI reference
- **Examples**: [../../examples/](../../examples/) - Example files
- **Architecture**: [../ARCHITECTURE.md](../ARCHITECTURE.md) - System architecture
