# Architecture Documentation

## Overview
`pdfify-md` is a CLI tool that converts Markdown to PDF or HTML using Puppeteer.

## Core Components

### 1. CLI Layer (`src/lib/cli/`)
- **CliService**: Entry point. Parses arguments, handles watch mode, and orchestrates the conversion process. Uses `listr` for task feedback.

### 2. Core Logic (`src/lib/core/`)
- **Converter**: (`converter.ts`) High-level function that prepares configuration and instantiates the `ConverterService`.

### 3. Services (`src/lib/services/`)
- **ConverterService**: Manages the conversion pipeline.
    - Reads input file.
    - Uses `MarkdownParserService` to convert MD to HTML.
    - Uses `OutputGeneratorService` to render HTML to PDF via Puppeteer.
- **MarkdownParserService**: Wraps `marked` to parse Markdown. Handles syntax highlighting (highlight.js) and front-matter (gray-matter).
- **OutputGeneratorService**: Manages Puppeteer instance. Launches browser, creates pages, sets content, and generates PDF/HTML files.
- **MermaidProcessorService**: (If used) Pre-processes Mermaid diagrams into images or SVG.

### 4. Configuration (`src/lib/config/`)
- Defines default options and merges user config.

## Flow
1. `cli.ts` -> `CliService.run()`
2. `CliService` parses args and expands directories (new feature).
3. For each file, `ConverterService.convert()` is called.
4. `MarkdownParser` converts MD -> HTML.
5. `OutputGenerator` spins up headless Chrome, loads HTML, and prints to PDF.
