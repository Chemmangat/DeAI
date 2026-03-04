# Test Workspace for AI Slop Detector

This folder contains sample files to test the AI Slop Detector extension.

## How to Test

1. Press F5 in VS Code (from the main extension folder) to launch Extension Development Host
2. In the new window, open this `test-workspace` folder
3. Open any of the sample files:
   - `sample1.ts` - TypeScript with many AI patterns
   - `sample2.js` - JavaScript with clean code (minimal issues)
   - `sample3.tsx` - React/TSX with AI patterns

## What to Look For

- Squiggly underlines (yellow for warnings, blue for info)
- Hover over underlined code to see messages
- Status bar in bottom-right showing issue count
- Problems panel (Ctrl+Shift+M) showing all issues

## Testing Configuration

Try these in VS Code settings (Ctrl+,):

```json
{
  "aiSlopDetector.enable": true,
  "aiSlopDetector.checkOnSave": true,
  "aiSlopDetector.rules": {
    "no-obvious-comments": true,
    "no-hedge-comments": true,
    "no-divider-comments": true,
    "no-filler-suffix": true,
    "no-filler-prefix": true,
    "no-generic-names": true,
    "no-verbose-booleans": true
  }
}
```

Try disabling individual rules to see the difference!
