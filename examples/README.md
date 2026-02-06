# pdfify-md Examples

This directory contains example markdown files demonstrating various features of pdfify-md.

## Available Examples

### [Mermaid Diagrams Demo](./demo-mermaid.md)

Comprehensive example showcasing various Mermaid diagram types:
- Flowcharts
- Sequence diagrams
- Gantt charts
- Class diagrams
- State diagrams
- Entity relationship diagrams
- User journey diagrams
- And more!

**To generate PDF:**
```bash
pdfify-md examples/demo-mermaid.md
```

### [Simple Test Example](./test-simple.md)

Basic markdown example for quick testing and getting started.

**To generate PDF:**
```bash
pdfify-md examples/test-simple.md
```

## More Examples

For additional examples, check the test files in [`../src/test/`](../src/test/):
- **Basic examples**: [`../src/test/basic/`](../src/test/basic/) - Simple markdown examples
- **Mermaid examples**: [`../src/test/mermaid/`](../src/test/mermaid/) - Mermaid diagram examples
- **Nested structures**: [`../src/test/nested/`](../src/test/nested/) - Complex directory structures
- **Math formulas**: [`../src/test/mathjax/`](../src/test/mathjax/) - MathJax examples

## Getting Started

1. Install pdfify-md (see main [README.md](../README.md))
2. Run an example:
   ```bash
   pdfify-md examples/demo-mermaid.md
   ```
3. Check the generated PDF in the same directory!

## Creating Your Own Examples

1. Create a markdown file with front matter configuration:
   ````markdown
   ---
   pdf_options:
     format: a4
     margin: 30mm 25mm
   ---
   
   # Your Content
   
   ```mermaid
   graph TD
       A --> B
   ```
   ````
2. Convert to PDF:
   ```bash
   pdfify-md your-file.md
   ```

