# Contributing to Aureynx Wildlife Conservation Platform

Thank you for your interest in contributing to the Aureynx Wildlife Conservation Platform. This document provides comprehensive guidelines for contributing to the project in a way that maintains code quality, consistency, and alignment with conservation goals.

## Getting Started

Before contributing, please take time to understand the project structure, coding standards, and development workflow. Review the main README.md file for project overview and setup instructions. Familiarize yourself with the existing codebase to understand patterns and conventions.

### Prerequisites

Node.js version 16 or higher installed on your development machine
Git for version control and collaboration
Code editor with JavaScript/React support (VS Code recommended)
Expo CLI for mobile development contributions
Understanding of React, React Native, and modern JavaScript

### Repository Setup

Fork the repository to your GitHub account through the GitHub interface. Clone your fork to your local development environment:

```
git clone https://github.com/YOUR_USERNAME/Wildlife_Corridors_project.git
cd Wildlife_Corridors_project
```

Add the upstream repository as a remote to stay synchronized:

```
git remote add upstream https://github.com/sjamillah/Wildlife_Corridors_project.git
```

Keep your fork updated with the latest changes:

```
git fetch upstream
git checkout main
git merge upstream/main
```

## Development Workflow

### Branch Strategy

Create a new branch for each feature, bugfix, or improvement. Use descriptive branch names that clearly indicate the purpose:

```
git checkout -b feature/wildlife-behavior-analytics
git checkout -b bugfix/map-rendering-issue
git checkout -b improvement/dashboard-performance
```

Branch names should be lowercase with hyphens separating words. Include the type prefix (feature, bugfix, improvement, docs).

### Making Changes

Install dependencies in the relevant directory (frontend/web or frontend/mobile):

```
npm install
```

Start the development server to see changes in real-time:

```
npm start    (for web)
npx expo start    (for mobile)
```

Make your changes following the coding standards outlined below. Test your changes thoroughly on relevant platforms. Ensure no existing functionality is broken.

### Commit Guidelines

Write clear, descriptive commit messages that explain what changed and why. Use conventional commit format:

```
feat: add real-time corridor monitoring dashboard
fix: resolve authentication token expiration issue
docs: update installation instructions for Windows
style: apply consistent color constants across components
refactor: optimize map rendering performance
test: add unit tests for alert filtering logic
```

Commit types:
feat (new features)
fix (bug fixes)
docs (documentation)
style (formatting, styling)
refactor (code restructuring)
test (adding tests)
chore (maintenance tasks)

Make atomic commits that represent single logical changes. Avoid mixing unrelated changes in one commit.

### Pull Request Process

Push your branch to your fork:

```
git push origin feature/your-feature-name
```

Open a Pull Request from your fork to the main repository. Provide a comprehensive description including:

**Summary**: Brief overview of changes made
**Motivation**: Why these changes are necessary
**Changes Made**: Detailed list of modifications
**Testing**: How the changes were tested
**Screenshots**: Visual evidence for UI changes
**Related Issues**: Link to relevant issue numbers

### Pull Request Review

Maintainers will review your PR for code quality, consistency, and functionality. Be responsive to feedback and questions. Make requested changes in additional commits. Once approved, your PR will be merged to the main branch.

## Coding Standards

### JavaScript and React

Use modern ES6+ JavaScript syntax including arrow functions, destructuring, and template literals. Implement functional components with hooks rather than class components. Use async/await for asynchronous operations instead of promise chains.

### Component Structure

Organize imports in this order:
1. React imports
2. Third-party library imports
3. Local component imports
4. Utility and helper imports
5. Style and asset imports

Define constants and helper functions outside components when possible. Keep components focused on a single responsibility. Extract complex logic into custom hooks or utility functions.

### Naming Conventions

**Components**: PascalCase (DashboardScreen.jsx, AlertCard.jsx)
**Functions**: camelCase (handleSubmit, calculateDistance)
**Constants**: UPPER_SNAKE_CASE (API_URL, MAX_FILE_SIZE)
**Files**: Match primary export (Dashboard.jsx exports Dashboard component)
**Folders**: lowercase or kebab-case (components, auth-screens)

### File Organization

Place components in appropriate directories:
`components/ui/` for reusable UI elements
`components/shared/` for cross-platform shared components
`screens/` for full-screen views
`contexts/` for React Context providers
`hooks/` for custom React hooks
`constants/` for configuration and constants
`services/` for API and external service integration

### Code Quality

Follow ESLint configuration for consistent code style. Remove console.log statements before committing (except intentional logging). Handle errors gracefully with user-friendly messages. Implement loading and empty states for better UX. Validate user input before processing or submission.

## Mobile-Specific Guidelines

### Platform Compatibility

Test changes on both iOS and Android platforms when possible. Use Platform.select() for platform-specific code. Avoid platform-specific components unless necessary. Test on different screen sizes and aspect ratios.

### Performance Considerations

Optimize list rendering with FlatList or SectionList. Implement proper key props for list items. Avoid inline function definitions in render methods. Use React.memo for components that rarely change. Implement pagination for large datasets.

### User Experience

Provide visual feedback for all user interactions. Implement proper loading states during async operations. Show clear error messages with recovery options. Ensure touch targets are appropriately sized (minimum 44x44 points). Test with accessibility features enabled (screen readers, high contrast).

### Offline Support

Design features to work without internet connectivity when possible. Implement local data storage for critical information. Queue network requests when offline for later execution. Provide clear connectivity status indicators.

## Web-Specific Guidelines

### Browser Compatibility

Test on major browsers including Chrome, Firefox, Safari, and Edge. Use modern web features with appropriate fallbacks. Implement responsive design for various screen sizes. Ensure keyboard navigation works properly.

### Accessibility

Use semantic HTML elements appropriately. Provide alt text for images and icons. Ensure sufficient color contrast ratios. Support keyboard navigation throughout the application. Test with screen readers (NVDA, JAWS, VoiceOver).

### Performance

Implement code splitting for route-based bundles. Optimize images and assets for web delivery. Minimize bundle size by analyzing dependencies. Use lazy loading for components and routes. Implement proper caching strategies.

## Design System Compliance

### Color Usage

Use colors from the centralized Colors.js constants file. Never hardcode color values directly in components. Reference colors through the COLORS object or theme context. Maintain consistency with the Aureynx brand palette.

### Typography

Use Inter font family consistently across the application. Follow established font size hierarchy for headers, body text, and metadata. Apply appropriate font weights (400 regular, 600 semibold, 700 bold, 800 extra bold).

### Spacing and Layout

Use consistent spacing following the 4px grid system. Maintain uniform padding and margins across similar components. Implement responsive breakpoints at standard sizes. Ensure layouts adapt gracefully to different screen dimensions.

### Component Styling

Follow existing component patterns and structures. Maintain visual consistency with established designs. Use inline styles for component-specific styling. Apply global styles through CSS files for reusable patterns.

## Testing Requirements

### Unit Testing

Write unit tests for utility functions and business logic. Test components with React Testing Library. Aim for meaningful test coverage of critical paths. Mock external dependencies appropriately.

### Integration Testing

Test component interactions and data flows. Verify navigation between screens works correctly. Test form validation and submission processes. Ensure state management functions properly.

### Manual Testing

Test on actual devices when possible, not just simulators. Verify functionality in both online and offline scenarios. Test with different user roles and permissions. Validate edge cases and error conditions.

## Documentation

### Code Comments

Add comments explaining complex logic or algorithms. Document function parameters and return values. Explain non-obvious decisions or workarounds. Keep comments concise and relevant.

### Component Documentation

Document component props with clear descriptions. Specify required vs optional props. Provide usage examples for complex components. Note any important caveats or limitations.

### README Updates

Update relevant README files when adding significant features. Document new environment variables or configuration. Add instructions for new development setup steps. Keep installation and usage instructions current.

## Issue Reporting

### Bug Reports

Provide clear, descriptive titles summarizing the issue. Include detailed steps to reproduce the problem. Specify expected behavior vs actual behavior. Include relevant system information (OS, browser, app version). Attach screenshots or videos demonstrating the issue.

### Feature Requests

Explain the use case and user need for the feature. Describe expected functionality and behavior. Suggest potential implementation approaches if applicable. Include mockups or designs if available.

### Issue Labels

Use appropriate labels to categorize issues:
bug (something not working correctly)
enhancement (new feature or improvement)
documentation (documentation updates)
good first issue (beginner-friendly)
help wanted (seeking contributors)
mobile (mobile app specific)
web (web app specific)

## Code Review Process

### Reviewer Guidelines

Review code for correctness, style, and best practices. Provide constructive, specific feedback. Suggest improvements rather than demanding changes. Approve PRs that meet quality standards. Request changes for issues that need addressing.

### Responding to Reviews

Address all reviewer comments and questions. Make requested changes in additional commits. Explain decisions if you disagree with suggestions. Thank reviewers for their time and feedback. Request re-review after making changes.

## Release Process

### Version Numbering

Follow semantic versioning (MAJOR.MINOR.PATCH):
MAJOR for incompatible API changes
MINOR for backwards-compatible functionality
PATCH for backwards-compatible bug fixes

### Release Checklist

Update version numbers in package.json and app.json. Update CHANGELOG with all notable changes. Test thoroughly on all supported platforms. Create release notes with user-facing changes. Tag release in Git with version number. Deploy to production environments.

## Community Guidelines

### Code of Conduct

Treat all contributors with respect and professionalism. Welcome newcomers and provide helpful guidance. Focus on constructive criticism and improvement. Respect differing viewpoints and experiences. Prioritize conservation goals and user needs.

### Communication

Use clear, professional language in all interactions. Provide context when asking questions or reporting issues. Respond to comments and feedback in a timely manner. Acknowledge contributions from other developers.

## Recognition

### Contributors

Active contributors will be recognized in the project README. Significant contributions will be highlighted in release notes. Outstanding contributions may receive special acknowledgment.

### Attribution

Original authors are credited for their contributions. External resources and libraries are properly attributed. Data sources and research credits are maintained.

## Additional Resources

### Learning Resources

React Documentation: https://react.dev
React Native Docs: https://reactnative.dev
Expo Documentation: https://docs.expo.dev
JavaScript Guide: https://javascript.info

### Conservation Context

Understanding wildlife corridors and their importance. GPS tracking methods and data interpretation. Conservation technology best practices. Field team workflows and requirements.

## Questions and Support

For questions about contributing:
Open a Discussion on GitHub
Comment on relevant Issues
Reach out to maintainers
Review existing documentation and PRs

We appreciate your contributions to wildlife conservation technology. Every improvement helps protect critical wildlife corridors and supports conservation teams in the field.

Thank you for helping build a better future for wildlife through technology.
