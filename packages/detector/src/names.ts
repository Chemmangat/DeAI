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
    
    // Check filler suffixes
    for (const suffix of FILLER_SUFFIXES) {
      if (name.endsWith(suffix) && name.length > suffix.length) {
        const suggested = name.substring(0, name.length - suffix.length);
        const lowerSuggested = suggested.charAt(0).toLowerCase() + suggested.slice(1);
        results.push({
          line,
          column,
          endColumn,
          message: `"${name}" — the "${suffix}" suffix adds no meaning. Try "${lowerSuggested}" instead.`,
          severity: "warning",
          ruleId: "no-filler-suffix"
        });
        break;
      }
    }
    
    // Check filler prefixes
    for (const prefix of FILLER_PREFIXES) {
      const prefixLower = prefix.toLowerCase();
      const nameLower = name.toLowerCase();
      if (nameLower.startsWith(prefixLower) && name.length > prefix.length) {
        const remainder = name.substring(prefix.length);
        if (/^[A-Z]/.test(remainder) || remainder.toLowerCase() === 'data') {
          const suggested = remainder.charAt(0).toLowerCase() + remainder.slice(1);
          results.push({
            line,
            column,
            endColumn,
            message: `"${name}" — vague prefix. Consider "${suggested}" or name it after what it specifically does.`,
            severity: "warning",
            ruleId: "no-filler-prefix"
          });
          break;
        }
      }
    }
    
    // Check generic names
    if (GENERIC_NAMES.includes(name.toLowerCase())) {
      results.push({
        line,
        column,
        endColumn,
        message: `"${name}" is too generic. Name it after its actual purpose.`,
        severity: "info",
        ruleId: "no-generic-names"
      });
    }
    
    // Check verbose booleans
    for (const prefix of VERBOSE_BOOLEAN_PREFIXES) {
      const prefixLower = prefix.toLowerCase();
      const nameLower = name.toLowerCase();
      if (nameLower.startsWith(prefixLower)) {
        let suggested = '';
        if (nameLower.startsWith('iscurrently')) {
          suggested = 'is' + name.substring('isCurrently'.length);
        } else if (nameLower.startsWith('hasalready')) {
          suggested = 'has' + name.substring('hasAlready'.length);
        } else if (nameLower.startsWith('shouldcurrently')) {
          suggested = 'should' + name.substring('shouldCurrently'.length);
        } else if (nameLower.startsWith('willeventually')) {
          suggested = 'will' + name.substring('willEventually'.length);
        }
        results.push({
          line,
          column,
          endColumn,
          message: `"${name}" — overly verbose. Try "${suggested}" instead.`,
          severity: "info",
          ruleId: "no-verbose-booleans"
        });
        break;
      }
    }
  }
  
  return results;
}
