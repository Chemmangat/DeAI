# AI Slop Detector

A VS Code extension that detects AI-generated code patterns and flags them like a linter — with squiggly underlines and hover messages.

## What It Detects

### Comment Issues

1. **Obvious Comments** (warning: `no-obvious-comments`)
   - Comments that just describe what the code does using verbs like: "loop through", "iterate over", "check if", "returns the", "get the", "set the", "create a", "initialize", "this function", "this method", "here we", "now we"
   - Example: `// Loop through the array` ❌
   - Better: `// Calculate total revenue for tax reporting` ✅

2. **Hedge Comments** (info: `no-hedge-comments`)
   - Vague placeholder phrases like: "might need to be changed", "could be improved", "adjust as needed", "feel free to", "modify as needed"
   - Example: `// This might need to be changed later` ❌

3. **Divider Comments** (info: `no-divider-comments`)
   - Section dividers like `// ============`, `// --------`, `// === UTILS ===`, `// SECTION:`
   - Example: `// ============ HELPERS ============` ❌
   - Better: Use file splits or named exports instead ✅

### Naming Issues

4. **Filler Suffixes** (warning: `no-filler-suffix`)
   - Names ending in: Object, Data, Info, Details, Item, Value, Result, Response, Payload, Entity, Record, Instance, Model
   - Example: `const userData = ...` ❌
   - Better: `const user = ...` ✅

5. **Filler Prefixes** (warning: `no-filler-prefix`)
   - Names starting with: handle, process, manage, perform, execute, doSomething, runTask, makeRequest
   - Example: `function processData()` ❌
   - Better: `function parseUserInput()` ✅

6. **Generic Names** (info: `no-generic-names`)
   - Standalone names like: helper, util, utils, misc, common, shared, general, temp, tmp
   - Example: `const helper = ...` ❌
   - Better: `const formatCurrency = ...` ✅

7. **Verbose Booleans** (info: `no-verbose-booleans`)
   - Names starting with: isCurrently, hasAlready, shouldCurrently, willEventually
   - Example: `const isCurrentlyActive = ...` ❌
   - Better: `const isActive = ...` ✅

## Installation

### From Source

1. Clone this repository
2. Run `npm install` in the root directory
3. Run `npm run build` to build both packages
4. Open the `packages/extension` folder in VS Code
5. Press F5 to launch the extension in a new VS Code window

### From VSIX (after packaging)

1. Run `npm run build` and `cd packages/extension && npm run package`
2. Install the generated `.vsix` file via VS Code: Extensions → ... → Install from VSIX

## Configuration

### Enable/Disable the Extension

```json
{
  "aiSlopDetector.enable": true
}
```

### Check on Save Only

```json
{
  "aiSlopDetector.checkOnSave": true
}
```

### Disable Specific Rules

```json
{
  "aiSlopDetector.rules": {
    "no-obvious-comments": true,
    "no-hedge-comments": true,
    "no-divider-comments": false,
    "no-filler-suffix": true,
    "no-filler-prefix": true,
    "no-generic-names": false,
    "no-verbose-booleans": true
  }
}
```

### AI-Powered Suggestions (Built-in)

AI suggestions are enabled by default using our free service (10 requests/hour):

```json
{
  "aiSlopDetector.ai.enabled": true,
  "aiSlopDetector.ai.provider": "builtin"
}
```

When AI is enabled, you'll see a "✨ Get AI suggestion" quick fix option on detected issues.

### Use Your Own API Key (Unlimited)

For unlimited suggestions, use your own API key:

**OpenAI:**
```json
{
  "aiSlopDetector.ai.enabled": true,
  "aiSlopDetector.ai.provider": "openai",
  "aiSlopDetector.ai.apiKey": "sk-your-api-key-here",
  "aiSlopDetector.ai.model": "gpt-4o-mini"
}
```

**Anthropic (Claude):**
```json
{
  "aiSlopDetector.ai.enabled": true,
  "aiSlopDetector.ai.provider": "anthropic",
  "aiSlopDetector.ai.apiKey": "sk-ant-your-key-here"
}
```

**Hugging Face:**
```json
{
  "aiSlopDetector.ai.enabled": true,
  "aiSlopDetector.ai.provider": "huggingface",
  "aiSlopDetector.ai.apiKey": "hf_your-key-here",
  "aiSlopDetector.ai.model": "meta-llama/Llama-3.2-3B-Instruct"
}
```

**OpenAI-Compatible (Groq, Together, etc):**
```json
{
  "aiSlopDetector.ai.enabled": true,
  "aiSlopDetector.ai.provider": "openai-compatible",
  "aiSlopDetector.ai.apiKey": "your-key",
  "aiSlopDetector.ai.baseUrl": "https://api.groq.com/openai/v1"
}
```

## Supported Languages

- JavaScript (`.js`)
- TypeScript (`.ts`)
- JavaScript React (`.jsx`)
- TypeScript React (`.tsx`)

## Features

- Real-time detection with squiggly underlines
- Hover messages explaining each issue
- Status bar showing issue count
- Per-rule configuration
- Zero runtime dependencies in the detector
- AI-powered rename suggestions (optional)
  - Context-aware suggestions using OpenAI, Anthropic, or compatible APIs
  - Quick fix integration
  - Suggestion caching for performance

## Future Enhancements

- `// ai-slop-disable-next-line` escape hatch
- More granular rule configuration
- Custom pattern definitions

## Development

```bash
# Install dependencies
npm install

# Build detector package
npm run build:detector

# Build extension
npm run build:extension

# Watch mode for development
cd packages/detector && npm run watch
cd packages/extension && npm run watch
```

## License

MIT
