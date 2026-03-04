export interface DetectionResult {
  line: number;
  column: number;
  endColumn: number;
  message: string;
  severity: "warning" | "info";
  ruleId: string;
}

const OBVIOUS_PATTERNS = [
  /\b(loop through|iterate over|check if|returns? the|gets? the|sets? the|creates? a|initialize|this function|this method|here we|now we)\b/i
];

const HEDGE_PATTERNS = [
  /\b(might need to be changed|could be improved|adjust as needed|feel free to|modify as needed)\b/i
];

const DIVIDER_PATTERN = /^[\s]*\/\/[\s]*[=\-_]{3,}|\/\/[\s]*===.*===|\/\/[\s]*SECTION:/;

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

export function analyzeComments(source: string): DetectionResult[] {
  const results: DetectionResult[] = [];
  const lines = source.split('\n');
  
  for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
    const line = lines[lineIndex];
    const commentMatch = line.match(/\/\/(.*)$/);
    
    if (!commentMatch) continue;
    
    const commentStart = line.indexOf('//');
    if (isInsideString(source.substring(0, source.split('\n').slice(0, lineIndex).join('\n').length + commentStart), source.split('\n').slice(0, lineIndex).join('\n').length + commentStart)) {
      continue;
    }
    
    const commentText = commentMatch[1];
    const column = commentStart;
    
    let hasIssue = false;
    
    // Check for obvious comments
    for (const pattern of OBVIOUS_PATTERNS) {
      if (pattern.test(commentText)) {
        hasIssue = true;
        break;
      }
    }
    
    // Check for hedge comments
    if (!hasIssue) {
      for (const pattern of HEDGE_PATTERNS) {
        if (pattern.test(commentText)) {
          hasIssue = true;
          break;
        }
      }
    }
    
    // Check for divider comments
    if (!hasIssue && DIVIDER_PATTERN.test(line)) {
      hasIssue = true;
    }
    
    if (hasIssue) {
      results.push({
        line: lineIndex + 1,
        column,
        endColumn: line.length,
        message: `Comment`, // AI will provide explanation
        severity: "info",
        ruleId: "ai-comment-issue"
      });
    }
  }
  
  return results;
}
