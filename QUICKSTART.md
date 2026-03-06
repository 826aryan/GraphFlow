# Quick Start Guide

## For Developers

### First Time Setup

```bash
# Clone or navigate to project
cd /Users/aryanraj/Downloads/graph-viz

# Install dependencies
npm install

# Start development server
npm run dev
```

The app will open at `http://localhost:5173` with hot module reloading.

## Common Commands

```bash
# Development
npm run dev          # Start dev server with HMR (hot reload)
npm run lint         # Check code quality
npm run build        # Create production bundle
npm run preview      # Preview production build locally

# Development workflow
1. npm run dev       # Make changes
2. npm run lint      # Check code
3. npm run build     # Verify build
4. npm run preview   # Test production build
5. Deploy!
```

## Project Structure

```
src/
├── App.jsx          # Main component with all algorithms
├── index.css        # Global styles (CSS variables)
├── main.jsx         # React entry point
└── assets/          # Images, fonts, etc.

public/              # Static files (favicon, etc.)
dist/                # Production build (after build)
.github/workflows/   # CI/CD pipeline configuration
```

## Key Files to Know

| File | Purpose |
|------|---------|
| `src/App.jsx` | All algorithm implementations and React UI |
| `src/index.css` | Global styles and CSS variables |
| `vite.config.js` | Build configuration |
| `package.json` | Dependencies and scripts |
| `vercel.json` | Vercel deployment config |
| `netlify.toml` | Netlify deployment config |

## Making Changes

### Adding a New Algorithm

1. Add algorithm function in `src/App.jsx` (e.g., `runNewAlgo()`)
2. Add to `ALGO_LIST` array
3. Add color definitions to `COLORS` object if needed
4. Add visualization logic in `getNodeColor()` and `getEdgeColor()`
5. Update `runAlgorithm()` switch statement
6. Test with `npm run dev`

### Styling Changes

Edit `src/index.css` - uses CSS variables for theming:
```css
--bg: #0a0e1a           /* Background */
--accent: #3b82f6       /* Primary color */
--text: #e2e8f0         /* Text color */
--success: #22c55e      /* Success indicator */
```

### Component Updates

Edit `src/App.jsx` - all UI is inline (no separate components currently).
To refactor into components:
1. Create `src/components/` folder
2. Extract components
3. Import in `App.jsx`

## Testing Before Deployment

```bash
# 1. Run linter
npm run lint

# 2. Build for production
npm run build

# 3. Test production build locally
npm run preview
# Opens http://localhost:4173

# 4. Check bundle size
npm run build  # See output with gzipped sizes
```

## Debugging

### Browser DevTools
- Press `F12` to open DevTools
- React DevTools extension recommended
- Check Console tab for errors
- Use Sources tab to debug

### VS Code Debugging
Add to `.vscode/launch.json`:
```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "chrome",
      "request": "launch",
      "name": "Launch Chrome",
      "url": "http://localhost:5173",
      "webRoot": "${workspaceFolder}"
    }
  ]
}
```

## Code Quality

All code follows:
- ✅ React best practices
- ✅ ESLint rules (configured in `eslint.config.js`)
- ✅ Modern JavaScript (ES2020+)
- ✅ Functional components with hooks
- ✅ Proper useCallback, useEffect dependencies

Run `npm run lint` before committing.

## Contributing Workflow

```bash
# 1. Create feature branch
git checkout -b feature/new-algorithm

# 2. Make changes
# Edit files, test locally with npm run dev

# 3. Verify quality
npm run lint
npm run build

# 4. Commit
git commit -m "Add new algorithm"

# 5. Push and create PR
git push origin feature/new-algorithm
```

## Performance Tips

- Use `useCallback` for event handlers (already done)
- Memoize expensive calculations with `useMemo`
- Keep state as local as possible
- Avoid re-renders with proper dependencies

## Browser Support

The app uses modern JavaScript features:
- ES2020+ syntax (const, arrow functions, spread operator)
- React 19 hooks
- CSS Variables
- CSS Grid/Flexbox

Target browsers: Chrome, Firefox, Safari, Edge (latest versions)

## Troubleshooting

**Issue: HMR not working**
- Solution: Check that `npm run dev` is running
- Refresh browser if needed

**Issue: Build fails**
- Solution: Run `npm install` to ensure dependencies
- Check `npm run lint` for code errors

**Issue: Styles not loading**
- Solution: Check `src/index.css` is imported in `src/main.jsx`

**Issue: Linter errors**
- Solution: Run `npm run lint` to see issues
- Most can be auto-fixed with IDE extensions

## Resources

- **React Docs:** https://react.dev
- **Vite Docs:** https://vite.dev
- **MDN Web Docs:** https://developer.mozilla.org
- **Graph Algorithms:** https://en.wikipedia.org/wiki/Graph_algorithm

## Quick Deploy Checklist

```
☐ npm run lint       (no errors)
☐ npm run build      (succeeds)
☐ npm run preview    (works locally)
☐ Test all algorithms (verify they work)
☐ Choose platform (Vercel/Netlify/etc.)
☐ Follow DEPLOYMENT.md guide
☐ Share your app! 🎉
```

## Getting Help

1. Check `README.md` for feature overview
2. Check `DEPLOYMENT.md` for deployment help
3. Check `RELEASE.md` for version info
4. Check browser console for errors
5. Run `npm run lint` for code issues

---

**Happy coding! 🚀**
