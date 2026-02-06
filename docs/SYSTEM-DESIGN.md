# System Design Documentation

## System Overview

pdfify-md is a CLI tool and library for converting Markdown documents to PDF format. It uses a multi-layered architecture with clear separation of concerns, dependency injection, and extensive configurability.

## 📋 Table of Contents

- [Design Goals](#design-goals)
- [Core Design Patterns](#core-design-patterns)
  - [1. Service Layer Pattern](#1-service-layer-pattern)
  - [2. Factory Pattern](#2-factory-pattern)
  - [3. Strategy Pattern](#3-strategy-pattern)
  - [4. Template Method Pattern](#4-template-method-pattern)
- [Component Design](#component-design)
  - [Configuration System](#configuration-system)
  - [File Processing](#file-processing)
  - [Mermaid Processing](#mermaid-processing)
  - [HTML Generation](#html-generation)
  - [PDF Generation](#pdf-generation)
- [Data Structures](#data-structures)
  - [Input Types](#input-types)
  - [Configuration Types](#configuration-types)
  - [Output Types](#output-types)
- [State Management](#state-management)
  - [Stateless Services](#stateless-services)
  - [Stateful Components](#stateful-components)
- [Error Handling Strategy](#error-handling-strategy)
  - [Error Types](#error-types)
  - [Error Propagation](#error-propagation)
  - [Error Recovery](#error-recovery)
- [Resource Management](#resource-management)
  - [Browser Lifecycle](#browser-lifecycle)
  - [Server Lifecycle](#server-lifecycle)
  - [Image Cleanup](#image-cleanup)
- [Concurrency Model](#concurrency-model)
  - [Parallel Processing](#parallel-processing)
  - [Resource Sharing](#resource-sharing)
- [Performance Optimizations](#performance-optimizations)
- [Security Design](#security-design)
  - [Input Validation](#input-validation)
  - [Resource Isolation](#resource-isolation)
  - [Error Information](#error-information)
- [Testing Strategy](#testing-strategy)
  - [Unit Tests](#unit-tests)
  - [Integration Tests](#integration-tests)
  - [Performance Tests](#performance-tests)
- [Extension Points](#extension-points)
  - [Custom Renderers](#custom-renderers)
  - [Custom Processors](#custom-processors)
  - [Custom Output Generators](#custom-output-generators)
- [Future Considerations](#future-considerations)
  - [Scalability](#scalability)
  - [Maintainability](#maintainability)
  - [Extensibility](#extensibility)

## Design Goals

1. **Usability**: Simple CLI interface with sensible defaults
2. **Flexibility**: Extensive configuration options for advanced users
3. **Performance**: Efficient processing of multiple files
4. **Maintainability**: Clean architecture with testable components
5. **Extensibility**: Easy to extend with new features
6. **Reliability**: Robust error handling and validation

## Core Design Patterns

### 1. Service Layer Pattern

Services encapsulate business logic and coordinate between components:

```typescript
class ConverterService {
  constructor(
    private mermaidProcessor: IMermaidProcessor,
    private outputGenerator: IOutputGenerator,
    private fileService: IFileService,
    private configService: IConfigService,
    private logger: ILogger
  ) {}
}
```

**Benefits:**
- Clear separation of concerns
- Easy to test with mocks
- Dependency injection for flexibility

### 2. Factory Pattern

Factory functions create configured service instances:

```typescript
function createConverterService(logger?: ILogger): ConverterService {
  return new ConverterService(
    new MermaidProcessorService(),
    new OutputGeneratorService(),
    new FileService(),
    new ConfigService(),
    logger
  );
}
```

**Benefits:**
- Convenient default configuration
- Still allows custom dependencies
- Reduces boilerplate

### 3. Strategy Pattern

Different output strategies (PDF vs HTML) are handled polymorphically:

```typescript
interface IOutputGenerator {
  generate(html: string, config: Config): Promise<Output>;
}
```

**Benefits:**
- Easy to add new output formats
- Consistent interface
- Runtime selection of strategy

### 4. Template Method Pattern

Conversion workflow follows a template with customizable steps:

1. Read input
2. Parse configuration
3. Process Mermaid diagrams
4. Generate HTML
5. Generate output
6. Write result

**Benefits:**
- Consistent workflow
- Easy to customize individual steps
- Clear extension points

## Component Design

### Configuration System

**Hierarchy:**
```
Default Config
    ↓
Config File (optional)
    ↓
Front Matter (optional)
    ↓
CLI Arguments (highest priority)
```

**Implementation:**
- Deep merge of configuration objects
- Type-safe configuration interface
- Validation at each merge level

### File Processing

**Strategies:**
- **Single File**: Direct conversion
- **Multiple Files**: Parallel processing with Listr
- **Stdin**: Stream-based processing
- **Watch Mode**: File system monitoring with Chokidar

**Error Handling:**
- Individual file errors don't stop batch processing
- Clear error reporting per file
- Graceful degradation

### Mermaid Processing

**Workflow:**
1. Detect Mermaid code blocks in markdown
2. Extract Mermaid syntax
3. For each diagram:
   - Launch Puppeteer page
   - Load Mermaid.js library
   - Initialize and render diagram
   - Wait for SVG generation
   - Take screenshot as PNG
   - Save to temp directory
   - Generate HTTP URL
4. Replace code blocks with image references
5. Cleanup temp images after conversion

**Optimization:**
- Reuse browser instance across diagrams
- Parallel processing of multiple diagrams
- Efficient temp file management
- Cleanup on completion or error

### HTML Generation

**Pipeline:**
1. Parse Markdown with Marked
2. Apply syntax highlighting with highlight.js
3. Process Mermaid diagrams (if any)
4. Inject stylesheets
5. Inject custom CSS
6. Inject scripts (if any)
7. Apply body classes
8. Generate final HTML

### PDF Generation

**Pipeline:**
1. Load HTML into Puppeteer page
2. Navigate to local server URL
3. Inject additional stylesheets and scripts
4. Wait for resources to load
5. Apply media type (screen/print)
6. Generate PDF with configured options
7. Return PDF buffer

## Data Structures

### Input Types

```typescript
type MarkdownInput = 
  | { path: string }
  | { content: string };
```

### Configuration Types

```typescript
interface Config {
  basedir: string;
  dest?: string;
  stylesheet: string[];
  css: string;
  pdf_options: PDFOptions;
  // ... many more options
}
```

### Output Types

```typescript
type Output = 
  | { filename: string; content: Buffer }  // PDF
  | { filename: string; content: string }; // HTML
```

## State Management

### Stateless Services

Most services are stateless:
- ConverterService
- MermaidProcessorService
- FileService
- ConfigService

### Stateful Components

Limited stateful components:
- **ServerService**: Manages HTTP server instance
- **OutputGeneratorService**: Manages shared browser instance
- **CliService**: Manages watch mode file watcher

**State Lifecycle:**
- State created when service starts
- State cleaned up explicitly
- Resources properly disposed

## Error Handling Strategy

### Error Types

1. **ValidationError**: Input validation failures
2. **MermaidProcessError**: Mermaid diagram rendering failures
3. **OutputGenerationError**: PDF/HTML generation failures
4. **FileError**: File I/O errors
5. **ConfigError**: Configuration errors

### Error Propagation

```
Service Layer
    ↓ (throws domain error)
Application Layer
    ↓ (catches and wraps)
CLI/API Layer
    ↓ (converts to user message)
User
```

### Error Recovery

- **Mermaid Errors**: Continue with original code block
- **Individual File Errors**: Continue with other files
- **Resource Errors**: Cleanup and propagate

## Resource Management

### Browser Lifecycle

```
Launch Browser
    ↓
Process Files/Diagrams
    ↓
Close Browser (always)
```

### Server Lifecycle

```
Start Server
    ↓
Process Files
    ↓
Stop Server (always)
```

### Image Cleanup

```
Generate Images
    ↓
Use Images in PDF
    ↓
Delete Images (always)
```

## Concurrency Model

### Parallel Processing

- Multiple files processed concurrently using Listr
- Mermaid diagrams can be processed in parallel
- HTTP requests handled asynchronously

### Resource Sharing

- Single browser instance shared across files in CLI mode
- Single server instance shared across all operations
- Temp directory shared for all images

## Performance Optimizations

1. **Browser Reuse**: Single browser for multiple conversions
2. **Parallel Processing**: Concurrent file processing
3. **Lazy Loading**: Resources loaded only when needed
4. **Efficient Rendering**: Optimized Mermaid rendering pipeline
5. **Streaming**: Large files handled via streams
6. **Caching**: Browser instance caching in CLI mode

## Security Design

### Input Validation

- File path validation
- Configuration validation
- Markdown content sanitization

### Resource Isolation

- Server limited to localhost
- Server limited to base directory
- Temp images in isolated directory
- Front matter JavaScript disabled by default

### Error Information

- Detailed errors for developers
- Safe error messages for users
- No sensitive information in errors

## Testing Strategy

### Unit Tests

- Individual service tests
- Mock dependencies
- Test edge cases

### Integration Tests

- Service interaction tests
- End-to-end conversion tests
- Error scenario tests

### Performance Tests

- Large file handling
- Concurrent processing
- Resource cleanup

## Extension Points

### Custom Renderers

Implement renderer interface to customize HTML/Markdown processing:

```typescript
interface IRenderer {
  render(markdown: string, config: Config): string;
}
```

### Custom Processors

Implement processor interface for custom pre-processing:

```typescript
interface IProcessor {
  process(markdown: string): Promise<string>;
}
```

### Custom Output Generators

Implement output generator for custom formats:

```typescript
interface IOutputGenerator {
  generate(html: string, config: Config): Promise<Output>;
}
```

## Future Considerations

### Scalability

- Current design supports processing hundreds of files
- Browser pooling could improve performance for large batches
- Distributed processing could be added

### Maintainability

- Clear service boundaries enable easy refactoring
- Interface-based design allows implementation swapping
- Comprehensive tests ensure stability

### Extensibility

- Plugin system could be added
- Custom renderers supported
- Configuration system extensible

