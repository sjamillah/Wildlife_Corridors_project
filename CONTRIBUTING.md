# Contributing to Wildlife Corridors Management System

Thank you for your interest in contributing to the Wildlife Corridors Management System! This document provides guidelines and information for contributors.

## 🌟 How to Contribute

### Reporting Issues

- Use GitHub Issues to report bugs or request features
- Provide detailed information about the issue
- Include screenshots for UI-related issues
- Specify the platform (mobile/web) and environment

### Development Workflow

1. Fork the repository
2. Create a feature branch from `main`
3. Make your changes following the coding standards
4. Test your changes thoroughly
5. Submit a pull request with a clear description

## 📋 Coding Standards

### Mobile App (React Native/Expo)

- **Components**: Use PascalCase (e.g., `DashboardScreen.jsx`)
- **Files**: Use `.jsx` extension for components with JSX
- **Utilities**: Use camelCase (e.g., `useColorScheme.js`)
- **Constants**: Use PascalCase (e.g., `Colors.js`)

### File Organization

```
✅ Correct Structure:
components/ui/ButtonComponent.jsx
screens/auth/SignInScreen.jsx
hooks/useThemeColor.js
contexts/ThemeContext.js
```

### Code Quality

- Follow ESLint configuration
- Use meaningful variable and function names
- Add comments for complex logic
- Maintain consistent indentation (2 spaces)

## 🧪 Testing

### Mobile Testing

```bash
# Run on different platforms
npm run android     # Android testing
npm run ios        # iOS testing (macOS only)
npm run web        # Web browser testing
```

### Manual Testing Checklist

- [ ] Authentication flow works correctly
- [ ] Navigation between screens is smooth
- [ ] Forms validate input properly
- [ ] Dark/light theme switching works
- [ ] Offline functionality (where applicable)

## 📱 Platform-Specific Guidelines

### Mobile App Features

- Ensure compatibility with both Android and iOS
- Test on different screen sizes
- Verify haptic feedback works on supported devices
- Check accessibility features

### UI/UX Standards

- Follow the established design system
- Maintain consistency with existing components
- Ensure WCAG 2.1 accessibility compliance
- Test in both light and dark modes

## 🔄 Pull Request Process

1. **Branch Naming**: Use descriptive names

   ```
   feature/add-incident-reporting
   bugfix/fix-navigation-crash
   improvement/optimize-map-rendering
   ```

2. **Commit Messages**: Use clear, descriptive messages

   ```
   feat: add wildlife sighting reporting feature
   fix: resolve authentication timeout issue
   docs: update installation instructions
   ```

3. **PR Description**: Include:
   - What changes were made
   - Why the changes were necessary
   - How to test the changes
   - Screenshots (for UI changes)

## 🐛 Bug Reports

When reporting bugs, please include:

- **Environment**: Device, OS version, app version
- **Steps to reproduce**: Clear step-by-step instructions
- **Expected behavior**: What should happen
- **Actual behavior**: What actually happens
- **Screenshots**: Visual evidence of the issue

## 💡 Feature Requests

For new features, please include:

- **Use case**: Why this feature is needed
- **User story**: As a [user type], I want [feature] so that [benefit]
- **Acceptance criteria**: How to determine if the feature is complete
- **Mock-ups**: Visual representation (if applicable)

## 🔧 Development Setup

### Prerequisites

```bash
# Required tools
Node.js (v16+)
npm or yarn
Git
Expo CLI
```

### Local Development

```bash
# Clone and setup
git clone https://github.com/sjamillah/Wildlife_Corridors_project.git
cd Wildlife_Corridors_project/frontend/mobile
npm install
npx expo start
```

## 📚 Resources

### Documentation

- [React Native Documentation](https://reactnative.dev/)
- [Expo Documentation](https://docs.expo.dev/)
- [Expo Router Guide](https://docs.expo.dev/router/introduction/)

### Design Resources

- [Wildlife Conservation Icons](https://www.flaticon.com/categories/animals)
- [Color Accessibility Checker](https://webaim.org/resources/contrastchecker/)
- [React Native UI Libraries](https://github.com/madhavanmalolan/awesome-reactnative-ui)

## 🏆 Recognition

Contributors will be recognized in:

- Project README contributors section
- Release notes for significant contributions
- Special mentions for outstanding contributions

## 📞 Getting Help

- **GitHub Issues**: Technical problems and feature requests
- **Discussions**: General questions and ideas
- **Code Reviews**: Learning and improvement opportunities

Thank you for helping make wildlife conservation more effective through technology! 🦌🌍
