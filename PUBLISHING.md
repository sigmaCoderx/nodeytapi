# Publishing Guide

## 1. Build the package

```bash
npm run build
```

## 2. Commit and push to GitHub

```bash
git add .
git commit -m "Prepare release"
git push origin main
```

## 4. Publish to npm

```bash
npm login
npm publish
```

If you want to publish a prerelease:

```bash
npm publish --tag beta
```
