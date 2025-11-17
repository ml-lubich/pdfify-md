/**
 * CLI Help Text
 * Displays usage information and examples for the CLI.
 */

import chalk from 'chalk';

const helpText = `
  ${chalk.cyan(`
███╗   ███╗ █████╗ ██████╗ ██╗  ██╗██████╗ ██████╗ ███████╗
████╗ ████║██╔══██╗██╔══██╗██║ ██╔╝██╔══██╗██╔══██╗██╔════╝
██╔████╔██║███████║██████╔╝█████╔╝ ██████╔╝██║  ██║█████╗  
██║╚██╔╝██║██╔══██║██╔══██╗██╔═██╗ ██╔═══╝ ██║  ██║██╔══╝  
██║ ╚═╝ ██║██║  ██║██║  ██║██║  ██╗██║     ██████╔╝██║     
╚═╝     ╚═╝╚═╝  ╚═╝╚═╝  ╚═╝╚═╝  ╚═╝╚═╝     ╚═════╝ ╚═╝     
                                                           
`)}
  ${chalk.bold('$ pdfify-md')} [options] path/to/file.md

  ${chalk.dim.underline.bold('Options:')}

    -h, --help ${chalk.dim('...............')} Output usage information
    -v, --version ${chalk.dim('............')} Output version
    -w, --watch ${chalk.dim('..............')} Watch the current file(s) for changes
		--watch-options ${chalk.dim('..........')} Options for Chokidar's watch call
    --basedir ${chalk.dim('................')} Base directory to be served by the file server
    --stylesheet ${chalk.dim('.............')} Path to a local or remote stylesheet (can be passed multiple times)
    --css ${chalk.dim('....................')} String of styles
    --document-title ${chalk.dim('.........')} Name of the HTML Document.
    --body-class ${chalk.dim('.............')} Classes to be added to the body tag (can be passed multiple times)
    --page-media-type ${chalk.dim('........')} Media type to emulate the page with (default: screen)
    --highlight-style ${chalk.dim('........')} Style to be used by highlight.js (default: github)
    --marked-options ${chalk.dim('.........')} Set custom options for marked (as a JSON string)
    --html-pdf-options ${chalk.dim('........')} Set custom options for HTML to PDF conversion (as a JSON string)
    --pdf-options ${chalk.dim('............')} Set custom options for the generated PDF (as a JSON string)
    --launch-options ${chalk.dim('.........')} Set custom launch options for Puppeteer
		--gray-matter-options ${chalk.dim('....')} Set custom options for gray-matter
    --port ${chalk.dim('...................')} Set the port to run the http server on
    --md-file-encoding ${chalk.dim('.......')} Set the file encoding for the markdown file
    --stylesheet-encoding ${chalk.dim('....')} Set the file encoding for the stylesheet
    --as-html ${chalk.dim('................')} Output as HTML instead
    --config-file ${chalk.dim('............')} Path to a JSON or JS configuration file
    --devtools ${chalk.dim('...............')} Open the browser with devtools instead of creating PDF
    --mermaid-horizontal-width ${chalk.dim('..')} Max width for horizontal charts (default: 1600)
    --mermaid-vertical-width ${chalk.dim('....')} Max width for vertical charts (default: 250)
    --mermaid-max-height ${chalk.dim('.......')} Max height for charts (default: 200)
    --mermaid-resolution ${chalk.dim('........')} Image resolution scale factor 1-4 (default: 3)

  ${chalk.dim.underline.bold('Examples:')}

  ${chalk.gray('–')} Convert ./file.md and save to ./file.pdf

    ${chalk.cyan('$ pdfify-md file.md')}

  ${chalk.gray('–')} Convert all markdown files in current directory

    ${chalk.cyan('$ pdfify-md ./*.md')}

  ${chalk.gray('–')} Convert all markdown files in current directory recursively

    ${chalk.cyan('$ pdfify-md ./**/*.md')}

  ${chalk.gray('–')} Convert and enable watch mode

    ${chalk.cyan('$ pdfify-md ./*.md -w')}

  ${chalk.gray('–')} Convert and enable watch mode with custom options

    ${chalk.cyan('$ pdfify-md ./*.md --watch --watch-options \'{ "atomic": true }\'')}

  ${chalk.gray('–')} Convert path/to/file.md with a different base directory

    ${chalk.cyan('$ pdfify-md path/to/file.md --basedir path')}

  ${chalk.gray('–')} Convert file.md using custom-markdown.css

    ${chalk.cyan('$ pdfify-md file.md --stylesheet custom-markdown.css')}

  ${chalk.gray('–')} Convert file.md using the Monokai theme for code highlighting

    ${chalk.cyan('$ pdfify-md file.md --highlight-style monokai')}

  ${chalk.gray('–')} Convert file.md using custom page options

    ${chalk.cyan('$ pdfify-md file.md --pdf-options \'{ "format": "Letter" }\'')}

  ${chalk.gray('–')} Convert file.md but save the intermediate HTML instead

    ${chalk.cyan('$ pdfify-md file.md --as-html')}

  ${chalk.gray('–')} Convert with custom Mermaid chart sizes

    ${chalk.cyan('$ pdfify-md file.md --mermaid-horizontal-width 1000 --mermaid-resolution 4')}
`;

export const help = (): void => console.log(helpText);
