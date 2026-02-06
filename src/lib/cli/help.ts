/**
 * CLI Help Text
 * Displays usage information and examples for the CLI.
 */

import chalk from 'chalk';

const banner = chalk.cyan(`
 ███████████  ██████████   ███████████ █████ ███████████ █████ █████            ██████   ██████ ██████████
░░███░░░░░███░░███░░░░███ ░░███░░░░░░█░░███ ░░███░░░░░░█░░███ ░░███            ░░██████ ██████ ░░███░░░░███
 ░███    ░███ ░███   ░░███ ░███   █ ░  ░███  ░███   █ ░  ░░███ ███              ░███░█████░███  ░███   ░░███
 ░██████████  ░███    ░███ ░███████    ░███  ░███████     ░░█████    ██████████ ░███░░███ ░███  ░███    ░███
 ░███░░░░░░   ░███    ░███ ░███░░░█    ░███  ░███░░░█      ░░███    ░░░░░░░░░░  ░███ ░░░  ░███  ░███    ░███
 ░███         ░███    ███  ░███  ░     ░███  ░███  ░        ░███                ░███      ░███  ░███    ███
 █████        ██████████   █████       █████ █████          █████               █████     █████ ██████████
░░░░░        ░░░░░░░░░░   ░░░░░       ░░░░░ ░░░░░          ░░░░░               ░░░░░     ░░░░░ ░░░░░░░░░░
`);

const helpText = `
${banner}
  ${chalk.bold('Usage:')} ${chalk.cyan('pdfify-md')} [options] path/to/file.md

  ${chalk.dim('─').repeat(60)}
  ${chalk.bold('Options:')}
  ${chalk.dim('─').repeat(60)}

  -h, --help                  Output usage information
  -v, --version               Output version
  -w, --watch                 Watch the current file(s) for changes
  --watch-options             Options for Chokidar's watch call
  --basedir                   Base directory to be served by the file server
  --stylesheet                Path to a local or remote stylesheet (repeatable)
  --css                       Inline CSS string
  --document-title            HTML document title
  --body-class                Class(es) for the body tag (repeatable)
  --page-media-type           Page media type (default: screen)
  --highlight-style           highlight.js theme (default: github)
  --marked-options            Custom options for marked (JSON string)
  --html-pdf-options          HTML-to-PDF options (JSON string)
  --pdf-options               PDF options (JSON string)
  --launch-options            Puppeteer launch options
  --gray-matter-options       gray-matter options
  --port                      HTTP server port
  --md-file-encoding          Markdown file encoding
  --stylesheet-encoding      Stylesheet encoding
  --as-html                   Output HTML instead of PDF
  --config-file               Path to JSON/JS config file
  --devtools                  Open browser devtools instead of generating PDF
  --mermaid-horizontal-width  Max width for horizontal charts (default: 1600)
  --mermaid-vertical-width    Max width for vertical charts (default: 250)
  --mermaid-max-height        Max height for charts (default: 200)
  -r, --mermaid-resolution    Mermaid image resolution (default: 8)
  -t, --mermaid-timeout       Mermaid render timeout in ms (default: 60000)

  ${chalk.dim('─').repeat(60)}
  ${chalk.bold('Examples:')}
  ${chalk.dim('─').repeat(60)}

  Convert a file:
    ${chalk.cyan('pdfify-md file.md')}

  All .md in directory:
    ${chalk.cyan('pdfify-md ./*.md')}

  Recursive:
    ${chalk.cyan('pdfify-md ./**/*.md')}

  Watch mode:
    ${chalk.cyan('pdfify-md ./*.md -w')}
    ${chalk.cyan('pdfify-md ./*.md --watch --watch-options \'{ "atomic": true }\'')}

  With base directory:
    ${chalk.cyan('pdfify-md path/to/file.md --basedir path')}

  Styling:
    ${chalk.cyan('pdfify-md file.md --stylesheet custom-markdown.css')}
    ${chalk.cyan('pdfify-md file.md --highlight-style monokai')}

  Custom PDF:
    ${chalk.cyan('pdfify-md file.md --pdf-options \'{ "format": "Letter" }\'')}

  Output HTML:
    ${chalk.cyan('pdfify-md file.md --as-html')}

  Mermaid chart size:
    ${chalk.cyan('pdfify-md file.md --mermaid-horizontal-width 1000 -r 10')}
`;

export const help = (): void => console.log(helpText);
