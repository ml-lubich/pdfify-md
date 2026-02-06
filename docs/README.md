# pdfify-md Documentation

Welcome to the pdfify-md documentation. This directory contains comprehensive documentation about the architecture, system design, CLI interface, and user guides for the pdfify-md tool.

## 📋 Table of Contents

- [User Guides](#-user-guides)
  - [Quick Start Guide](#quick-start-guide)
  - [Usage Guide](#usage-guide)
- [Architecture & Design](#️-architecture--design)
  - [Architecture Documentation](#architecture-documentation)
  - [System Design Documentation](#system-design-documentation)
  - [CLI Interface Documentation](#cli-interface-documentation)
- [Testing](#-testing)
  - [Test Coverage Documentation](#test-coverage-documentation)
- [Quick Links](#quick-links)
- [Documentation Conventions](#documentation-conventions)
- [Contributing to Documentation](#contributing-to-documentation)
- [Related Documentation](#related-documentation)

## Documentation Index

### 📘 User Guides

#### [Quick Start Guide](./user-guide/QUICKSTART.md)

Get started quickly with pdfify-md. Includes:
- Installation instructions
- Basic usage examples
- Common commands
- Development setup

**Start here** if you're new to pdfify-md.

#### [Usage Guide](./user-guide/USAGE.md)

Detailed usage instructions covering:
- Installation options
- Command-line usage
- Configuration options
- Examples and use cases

**Read this** for detailed usage information.

### 🏗️ Architecture & Design

#### [Architecture Documentation](./ARCHITECTURE.md)

Comprehensive overview of the pdfify-md architecture, including:
- Architecture principles and design goals
- System layers and their responsibilities
- Data flow and component interactions
- Key components (Server, Browser, Image handling)
- Dependency graph
- Error handling strategy
- Testing strategy
- Extensibility points

**Read this first** to understand how the system is organized and how components interact.

### [System Design Documentation](./SYSTEM-DESIGN.md)

Detailed system design documentation covering:
- Design goals and principles
- Core design patterns (Service Layer, Factory, Strategy, Template Method)
- Component design and responsibilities
- Data structures and types
- State management approach
- Error handling strategy
- Resource management lifecycle
- Concurrency model
- Performance optimizations
- Security design considerations
- Testing strategy
- Extension points

**Read this** to understand the design decisions and patterns used throughout the codebase.

### [CLI Interface Documentation](./CLI-INTERFACE.md)

Complete CLI interface reference including:
- Command syntax and usage
- All available options with examples
- Configuration priority and merging
- Front matter configuration
- Common use cases and examples
- Troubleshooting guide
- Performance tips

**Read this** to understand how to use the CLI tool effectively.

### 🧪 Testing

#### [Test Coverage Documentation](./testing/TEST_COVERAGE.md)

Comprehensive test coverage documentation including:
- Test file organization
- Coverage statistics
- Edge case testing
- Testing strategy

**Read this** to understand the testing approach and coverage.

## Quick Links

### For Developers

- **Architecture**: Start with [ARCHITECTURE.md](./ARCHITECTURE.md) to understand the overall system
- **Design Patterns**: See [SYSTEM-DESIGN.md](./SYSTEM-DESIGN.md) for design decisions
- **Code Style**: See `.cursorrules` in the root directory for coding guidelines

### For Users

- **CLI Usage**: See [CLI-INTERFACE.md](./CLI-INTERFACE.md) for command-line usage
- **Examples**: Check the main [README.md](../README.md) for quick examples
- **Configuration**: See [CLI-INTERFACE.md](./CLI-INTERFACE.md#configuration-options) for configuration options

## Documentation Conventions

### Code Examples

All code examples use TypeScript and assume you're working within the pdfify-md codebase.

### File Paths

File paths are relative to the project root unless otherwise specified.

### Terminology

- **Service**: A class that encapsulates business logic and coordinates with dependencies
- **Layer**: A grouping of related components (Presentation, Application, Domain, Service, Infrastructure)
- **Workflow**: A sequence of steps that accomplish a task (e.g., conversion workflow)
- **Resource**: A system resource (browser, server, temp files) that requires cleanup

## Contributing to Documentation

When contributing to documentation:

1. **Keep it accurate**: Ensure documentation matches the actual code
2. **Update when code changes**: Update docs when modifying functionality
3. **Use examples**: Include practical examples where helpful
4. **Cross-reference**: Link to related documentation sections
5. **Be clear**: Write for an audience that may be new to the codebase

## Related Documentation

- **Main README**: [../README.md](../README.md) - User-facing documentation
- **Cursor Rules**: [../.cursorrules](../.cursorrules) - AI-assisted development guidelines

## Questions?

If you have questions about the documentation or need clarification:

1. Check the relevant documentation file
2. Review the source code for implementation details
3. Check existing issues or create a new one
4. Reach out to the maintainers

## Version Information

This documentation corresponds to pdfify-md version 6.0.0. Some details may change in future versions.

