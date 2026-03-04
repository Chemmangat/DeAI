import { DetectionResult } from './comments';

const FILLER_SUFFIXES = ['Object', 'Data', 'Info', 'Details', 'Item', 'Value', 'Result', 'Response', 'Payload', 'Entity', 'Record', 'Instance', 'Model'];
const FILLER_PREFIXES = ['handle', 'process', 'manage', 'perform', 'execute', 'doSomething', 'runTask', 'makeRequest'];
const GENERIC_NAMES = ['helper', 'util', 'utils', 'misc', 'common', 'shared', 'general', 'temp', 'tmp'];
const VERBOSE_BOOLEAN_PREFIXES = ['isCurrently', 'hasAlready', 'shouldCurrently', 'willEventually'];
const SHORT_NAMES = ['id', 'fn', 'el', 'i', 'e', 'cb', 'x', 'y', 'z', 'a', 'b', 'c', 'k', 'v'];

function isInsideString(source: string, index: number): boolean {
  let inString = false;
  let stringChar = '';
  let inTemplate = false;
  
  for (let i = 0; i < index; i++) {
    const char = source[i];
    const prevChar = i > 0 ? source[i - 1] : '';
    
    if (inTemplate) {
      if (char === '`' && prevChar !== '\\') {
        inTemplate = false;
      }
      continue;
    }
    
    if (inString) {
      if (char === stringChar && prevChar !== '\\') {
        inString = false;
        stringChar = '';
      }
    } else {
      if (char === '`') {
        inTemplate = true;
      } else if (char === '"' || char === "'") {
        inString = true;
        stringChar = char;
      }
    }
  }
  
  return inString || inTemplate;
}

export function analyzeNames(source: string): DetectionResult[] {
  const results: DetectionResult[] = [];
  const namePattern = /\b(?:const|let|var|function|class)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/g;
  const processedNames = new Set<string>(); // Track processed positions
  
  let match;
  while ((match = namePattern.exec(source)) !== null) {
    const name = match[1];
    const index = match.index + match[0].indexOf(name);
    
    if (isInsideString(source, index)) {
      continue;
    }
    
    if (SHORT_NAMES.includes(name.toLowerCase())) {
      continue;
    }
    
    const lines = source.substring(0, index).split('\n');
    const line = lines.length;
    const column = lines[lines.length - 1].length;
    const endColumn = column + name.length;
    
    const posKey = `${line}:${column}`;
    if (processedNames.has(posKey)) {
      continue; // Skip duplicates
    }
    
    let issue: DetectionResult | null = null;
    
    // Priority order: Check most specific issues first, only report ONE per name
    
    // 1. Filler suffixes (highest priority)
    if (!issue) {
      for (const suffix of FILLER_SUFFIXES) {
        if (name.endsWith(suffix) && name.length > suffix.length) {
          issue = {
            line,
            column,
            endColumn,
            message: `Filler suffix "${suffix}"`,
            severity: "warning",
            ruleId: "no-filler-suffix"
          };
          break;
        }
      }
    }
    
    // 2. Filler prefixes (only if no suffix issue)
    if (!issue) {
      for (const prefix of FILLER_PREFIXES) {
        const prefixLower = prefix.toLowerCase();
        const nameLower = name.toLowerCase();
        if (nameLower.startsWith(prefixLower) && name.length > prefix.length) {
          const remainder = name.substring(prefix.length);
          if (/^[A-Z]/.test(remainder) || remainder.toLowerCase() === 'data') {
            issue = {
              line,
              column,
              endColumn,
              message: `Vague prefix "${prefix}"`,
              severity: "warning",
              ruleId: "no-filler-prefix"
            };
            break;
          }
        }
      }
    }
    
    // 3. Generic names
    if (!issue && GENERIC_NAMES.includes(name.toLowerCase())) {
      issue = {
        line,
        column,
        endColumn,
        message: "Generic name",
        severity: "info",
        ruleId: "no-generic-names"
      };
    }
    
    // 4. Verbose booleans
    if (!issue) {
      for (const prefix of VERBOSE_BOOLEAN_PREFIXES) {
        const prefixLower = prefix.toLowerCase();
        const nameLower = name.toLowerCase();
        if (nameLower.startsWith(prefixLower)) {
          issue = {
            line,
            column,
            endColumn,
            message: "Verbose boolean name",
            severity: "info",
            ruleId: "no-verbose-booleans"
          };
          break;
        }
      }
    }
    
    if (issue) {
      processedNames.add(posKey);
      results.push(issue);
    }
  }
  
  return results;
}
