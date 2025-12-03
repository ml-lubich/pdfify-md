# CLI Interface Documentation

## Overview

The markpdf CLI provides a command-line interface for converting Markdown files to PDF or HTML. It supports single files, multiple files, stdin input, and watch mode.

## 📋 Table of Contents

- [Command Syntax](#command-syntax)
- [Basic Usage](#basic-usage)
  - [Convert Single File](#convert-single-file)
  - [Convert Multiple Files](#convert-multiple-files)
  - [Convert from Stdin](#convert-from-stdin)
  - [Watch Mode](#watch-mode)
- [Options](#options)
  - [General Options](#general-options)
  - [Configuration Options](#configuration-options)
  - [Styling Options](#styling-options)
  - [Document Options](#document-options)
  - [PDF Options](#pdf-options)
  - [Advanced Options](#advanced-options)
  - [Output Options](#output-options)
- [Configuration Priority](#configuration-priority)
- [Front Matter Configuration](#front-matter-configuration)
- [Examples](#examples)
  - [Basic PDF Generation](#basic-pdf-generation)
  - [Custom Styling](#custom-styling)
  - [Custom PDF Format](#custom-pdf-format)
  - [Watch Mode with Custom Options](#watch-mode-with-custom-options)
  - [Multiple Files with Custom Config](#multiple-files-with-custom-config)
  - [Stdin to Stdout](#stdin-to-stdout)
  - [Generate HTML](#generate-html)
- [Exit Codes](#exit-codes)
- [Error Handling](#error-handling)
  - [File Not Found](#file-not-found)
  - [Invalid Configuration](#invalid-configuration)
  - [Conversion Failure](#conversion-failure)
- [Performance Tips](#performance-tips)
- [Limitations](#limitations)
- [Troubleshooting](#troubleshooting)
  - [Port Already in Use](#port-already-in-use)
  - [Missing Dependencies](#missing-dependencies)
  - [Browser Issues](#browser-issues)
  - [Encoding Issues](#encoding-issues)

## Command Syntax

```bash
markpdf [options] [files...]
```

## Basic Usage

### Convert Single File

```bash
markpdf document.md
```

Converts `document.md` to `document.pdf` in the same directory.

### Convert Multiple Files

```bash
markpdf *.md
markpdf chapter1.md chapter2.md chapter3.md
```

Converts all specified files. Files are processed in parallel for better performance.

### Convert from Stdin

```bash
cat document.md | markpdf > output.pdf
echo "# Hello" | markpdf > output.pdf
```

Reads markdown from stdin and writes PDF to stdout.

### Watch Mode

```bash
markpdf --watch document.md
```

Watches for file changes and automatically regenerates the PDF when the markdown file is modified.

## Options

### General Options

#### `-h, --help`

Display help information and exit.

```bash
markpdf --help
```

#### `-v, --version`

Display version information and exit.

```bash
markpdf --version
```

#### `-w, --watch`

Enable watch mode. Automatically regenerates output when input files change.

```bash
markpdf --watch document.md
```

**Note:** The server remains active in watch mode. Press Ctrl+C to stop.

#### `--watch-options <json>`

Configure Chokidar watch options (JSON string).

```bash
markpdf --watch document.md --watch-options '{"atomic": true, "ignored": ["*.tmp"]}'
```

Common options:
- `atomic`: Wait for atomic writes (default: false)
- `ignored`: Patterns to ignore (array of strings)
- `awaitWriteFinish`: Wait for write to finish (default: false)

### Configuration Options

#### `--config-file <path>`

Path to a JSON or JavaScript configuration file.

```bash
markpdf document.md --config-file ./pdf-config.json
```

The config file should export a configuration object:

```json
{
  "pdf_options": {
    "format": "Letter",
    "margin": "20mm"
  },
  "highlight_style": "monokai"
}
```

Or as a JavaScript file:

```javascript
module.exports = {
  pdf_options: {
    format: 'Letter',
    margin: '20mm'
  },
  highlight_style: 'monokai'
};
```

#### `--basedir <path>`

Base directory to be served by the file server. Defaults to the markdown file's directory or current working directory.

```bash
markpdf document.md --basedir ./docs
```

**Use case:** When your markdown references relative paths (images, stylesheets), this ensures they resolve correctly.

### Styling Options

#### `--stylesheet <path>`

Add a stylesheet (can be used multiple times). Can be a local file path or HTTP URL.

```bash
markpdf document.md --stylesheet custom.css --stylesheet theme.css
markpdf document.md --stylesheet https://cdn.example.com/style.css
```

#### `--css <css>`

Inline CSS styles as a string.

```bash
markpdf document.md --css "body { font-family: 'Georgia', serif; font-size: 12pt; }"
```

#### `--highlight-style <name>`

Code highlighting style from highlight.js. Default: `github`.

```bash
markpdf document.md --highlight-style monokai
```

Available styles include: `github`, `monokai`, `vs`, `atom-one-dark`, `dracula`, etc.

#### `--body-class <class>`

Add a class to the body tag (can be used multiple times).

```bash
markpdf document.md --body-class markdown-body --body-class custom-theme
```

### Document Options

#### `--document-title <title>`

Set the HTML document title.

```bash
markpdf document.md --document-title "My Document"
```

#### `--page-media-type <type>`

Media type to emulate: `screen` or `print`. Default: `screen`.

```bash
markpdf document.md --page-media-type print
```

**Note:** `print` media type applies print-specific CSS rules.

### PDF Options

#### `--html-pdf-options <json>`

Custom HTML to PDF conversion options as a JSON string. Legacy option, use `--pdf-options` instead.

```bash
markpdf document.md --html-pdf-options '{"format": "A4"}'
```

**Note:** This option is deprecated. Use `--pdf-options` instead for consistency.

#### `--pdf-options <json>`

Custom PDF options as a JSON string. These are Puppeteer PDF options.

```bash
markpdf document.md --pdf-options '{"format": "Letter", "margin": {"top": "1in", "right": "1in", "bottom": "1in", "left": "1in"}}'
```

Common options:
- `format`: Page format (`A4`, `Letter`, `Legal`, etc.)
- `margin`: Page margins (string or object)
- `printBackground`: Print background graphics (default: true)
- `landscape`: Landscape orientation (default: false)
- `scale`: Scale factor (default: 1)
- `displayHeaderFooter`: Display header/footer (default: false)
- `headerTemplate`: HTML template for header
- `footerTemplate`: HTML template for footer

#### Header/Footer Templates

```bash
markpdf document.md --pdf-options '{
  "displayHeaderFooter": true,
  "headerTemplate": "<div style=\"font-size: 10px; text-align: center; width: 100%;\">Document Title</div>",
  "footerTemplate": "<div style=\"font-size: 10px; text-align: center; width: 100%;\">Page <span class=\"pageNumber\"></span> of <span class=\"totalPages\"></span></div>"
}'
```

Special classes in templates:
- `<span class="pageNumber"></span>`: Current page number
- `<span class="totalPages"></span>`: Total page count

### Advanced Options

#### `--marked-options <json>`

Custom options for the Marked parser (JSON string).

```bash
markpdf document.md --marked-options '{"gfm": true, "breaks": false}'
```

#### `--launch-options <json>`

Custom Puppeteer launch options (JSON string).

```bash
markpdf document.md --launch-options '{"args": ["--no-sandbox", "--disable-setuid-sandbox"]}'
```

**Warning:** Only use this if you understand the security implications.

#### `--gray-matter-options <json>`

Custom options for gray-matter (front-matter parser). By default, JavaScript execution is disabled for security.

```bash
# Enable JavaScript in front-matter (not recommended)
markpdf document.md --gray-matter-options '{}'
```

#### `--port <number>`

Set the port for the HTTP server. Default: random available port.

```bash
markpdf document.md --port 3000
```

#### `--md-file-encoding <encoding>`

File encoding for markdown files. Default: `utf-8`.

```bash
markpdf document.md --md-file-encoding utf-8
```

#### `--stylesheet-encoding <encoding>`

File encoding for stylesheets. Default: `utf-8`.

```bash
markpdf document.md --stylesheet-encoding utf-8
```

### Output Options

#### `--as-html`

Generate HTML output instead of PDF.

```bash
markpdf document.md --as-html
```

Outputs `document.html` instead of `document.pdf`.

#### `--devtools`

Open browser with devtools instead of generating PDF. Useful for debugging.

```bash
markpdf document.md --devtools
```

**Note:** No output file is generated in devtools mode.

## Configuration Priority

When multiple configuration sources are used, they are merged in this order (later sources override earlier ones):

1. Default configuration
2. Config file (`--config-file`)
3. Front matter (YAML in markdown file)
4. CLI arguments (highest priority)

Example:

```bash
# Config file has format: A4
# Front matter has format: Letter
# CLI has format: Legal
# Final format: Legal (CLI wins)
markpdf document.md --config-file config.json --pdf-options '{"format": "Legal"}'
```

## Front Matter Configuration

You can configure PDF options directly in your Markdown file using YAML front matter:

```markdown
---
pdf_options:
  format: a4
  margin: 30mm 25mm
  printBackground: true
stylesheet:
  - custom.css
highlight_style: monokai
---

# My Document

Content here...
```

**Note:** CLI arguments override front matter settings.

## Examples

### Basic PDF Generation

```bash
markpdf README.md
```

### Custom Styling

```bash
markpdf document.md \
  --stylesheet custom.css \
  --css "body { font-family: 'Georgia', serif; }" \
  --highlight-style github
```

### Custom PDF Format

```bash
markpdf document.md --pdf-options '{"format": "Letter", "landscape": true}'
```

### Watch Mode with Custom Options

```bash
markpdf --watch document.md \
  --stylesheet theme.css \
  --highlight-style monokai
```

### Multiple Files with Custom Config

```bash
markpdf chapter*.md \
  --config-file book-config.json \
  --pdf-options '{"format": "A4"}'
```

### Stdin to Stdout

```bash
cat document.md | markpdf > output.pdf
```

### Generate HTML

```bash
markpdf document.md --as-html
```

## Exit Codes

- `0`: Success
- `1`: Error (invalid arguments, conversion failure, etc.)

## Error Handling

### File Not Found

```bash
markpdf nonexistent.md
# Error: ENOENT: no such file or directory
```

### Invalid Configuration

```bash
markpdf document.md --pdf-options 'invalid json'
# Error: Failed to parse --pdf-options JSON
```

### Conversion Failure

If conversion fails for a file in a batch, other files continue processing. Errors are displayed per file.

## Performance Tips

1. **Multiple Files**: Process multiple files in a single command for better performance (browser reuse)
2. **Watch Mode**: Use watch mode during development for faster iteration
3. **Config File**: Use config files for repeated configurations
4. **Front Matter**: Use front matter for document-specific settings

## Limitations

- Server runs on localhost only
- Large files may take longer to process
- Mermaid diagrams require network access to load Mermaid.js library
- PDF generation requires Chromium (bundled with Puppeteer)

## Troubleshooting

### Port Already in Use

```bash
markpdf document.md --port 3001
```

### Missing Dependencies

Ensure all dependencies are installed:

```bash
npm install
```

### Browser Issues

Try running with explicit launch options:

```bash
markpdf document.md --launch-options '{"args": ["--no-sandbox"]}'
```

### Encoding Issues

Specify encoding explicitly:

```bash
markpdf document.md --md-file-encoding utf-8
```

