# Contributing to Civitra

First off, thank you for considering contributing to Civitra! It's people like you that make Civitra such a great tool.

## Code of Conduct

By participating in this project, you are expected to uphold our standard code of conduct. Please be respectful, inclusive, and professional in all interactions.

## How Can I Contribute?

### Reporting Bugs

This section guides you through submitting a bug report for Civitra. Following these guidelines helps maintainers and the community understand your report, reproduce the behavior, and find related reports.

- Use a clear and descriptive title for the issue.
- Describe the exact steps to reproduce the problem.
- Provide specific examples to demonstrate the steps.

### Suggesting Enhancements

This section guides you through submitting an enhancement suggestion, including completely new features and minor improvements to existing functionality.

- Provide a clear and detailed explanation of the feature.
- Explain why this enhancement would be useful to most users.
- Mockups or visual diagrams are highly appreciated if applicable.

### Code Contributions

1. Fork the repository and create your branch from `main`.
2. If you've added code that should be tested, add tests! (See `tests/` directory).
3. Ensure the test suite passes (`npm test`).
4. Ensure code quality checks pass (`npm run lint` and `npm run format`).
5. Update documentation if necessary.

## Development Setup

1. **Node.js**: Ensure you have Node.js >= 22 installed.
2. **Install dependencies**: `npm install`
3. **Environment setup**: Copy `.env.example` to `.env` and fill in required keys (like `GEMINI_API_KEY`).
4. **Start the server**: `npm run dev`

## Pull Request Process

1. Ensure any install or build dependencies are removed before the end of the layer when doing a build.
2. Update the README.md with details of changes to the interface, this includes new environment variables, exposed ports, useful file locations, and container parameters.
3. You may merge the Pull Request in once you have the sign-off of two other developers, or if you do not have permission to do that, you may request the second reviewer to merge it for you.
