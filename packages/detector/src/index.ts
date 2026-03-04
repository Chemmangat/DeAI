import { analyzeComments, DetectionResult } from './comments';
import { analyzeNames } from './names';

export { DetectionResult };
export { AISuggester, AISuggesterConfig } from './ai-suggester';

export interface AnalysisResult {
  issues: DetectionResult[];
  summary: {
    total: number;
    warnings: number;
    infos: number;
  };
}

export function analyze(source: string): AnalysisResult {
  const commentIssues = analyzeComments(source);
  const nameIssues = analyzeNames(source);
  
  const allIssues = [...commentIssues, ...nameIssues];
  
  allIssues.sort((a, b) => {
    if (a.line !== b.line) return a.line - b.line;
    return a.column - b.column;
  });
  
  const warnings = allIssues.filter(i => i.severity === 'warning').length;
  const infos = allIssues.filter(i => i.severity === 'info').length;
  
  return {
    issues: allIssues,
    summary: {
      total: allIssues.length,
      warnings,
      infos
    }
  };
}
