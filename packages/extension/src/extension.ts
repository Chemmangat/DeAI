import * as vscode from 'vscode';
import { analyze } from '@ai-slop-detector/detector';
import { AISuggester } from '@ai-slop-detector/detector';

let diagnosticCollection: vscode.DiagnosticCollection;
let statusBarItem: vscode.StatusBarItem;
let aiSuggester: AISuggester | null = null;

function getCodeContext(source: string, line: number, contextLines: number = 3): string {
  const lines = source.split('\n');
  const start = Math.max(0, line - contextLines - 1);
  const end = Math.min(lines.length, line + contextLines);
  return lines.slice(start, end).join('\n');
}

const SUPPORTED_LANGUAGES = ['javascript', 'typescript', 'javascriptreact', 'typescriptreact'];

export function activate(context: vscode.ExtensionContext) {
  diagnosticCollection = vscode.languages.createDiagnosticCollection('ai-slop');
  context.subscriptions.push(diagnosticCollection);

  statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
  context.subscriptions.push(statusBarItem);

  // Initialize AI suggester
  updateAISuggester();

  // Analyze on open
  if (vscode.window.activeTextEditor) {
    analyzeDocument(vscode.window.activeTextEditor.document);
  }

  // Analyze on editor change
  context.subscriptions.push(
    vscode.window.onDidChangeActiveTextEditor(editor => {
      if (editor) {
        analyzeDocument(editor.document);
      }
    })
  );

  // Analyze on save
  context.subscriptions.push(
    vscode.workspace.onDidSaveTextDocument(document => {
      const config = vscode.workspace.getConfiguration('aiSlopDetector');
      if (config.get('checkOnSave', true)) {
        analyzeDocument(document);
      }
    })
  );

  // Clear diagnostics on close
  context.subscriptions.push(
    vscode.workspace.onDidCloseTextDocument(document => {
      diagnosticCollection.delete(document.uri);
    })
  );

  // Analyze on text change (optional, for real-time feedback)
  context.subscriptions.push(
    vscode.workspace.onDidChangeTextDocument(event => {
      const config = vscode.workspace.getConfiguration('aiSlopDetector');
      if (config.get('enable', true) && !config.get('checkOnSave', true)) {
        analyzeDocument(event.document);
      }
    })
  );

  // Update AI suggester when config changes
  context.subscriptions.push(
    vscode.workspace.onDidChangeConfiguration(e => {
      if (e.affectsConfiguration('aiSlopDetector.ai')) {
        updateAISuggester();
      }
    })
  );

  // Register code action provider for AI suggestions
  // Removed - using direct diagnostic messages with AI suggestions instead
  // context.subscriptions.push(
  //   vscode.languages.registerCodeActionsProvider(
  //     SUPPORTED_LANGUAGES.map(lang => ({ language: lang })),
  //     new AISuggestionProvider(),
  //     { providedCodeActionKinds: [vscode.CodeActionKind.QuickFix] }
  //   )
  // );

  // Register AI suggestion command
  context.subscriptions.push(
    vscode.commands.registerCommand(
      'aiSlopDetector.getAISuggestion',
      async (document: vscode.TextDocument, diagnostic: vscode.Diagnostic) => {
        if (!aiSuggester) {
          vscode.window.showErrorMessage('AI suggestions are not enabled. Configure API key in settings.');
          return;
        }

        const name = document.getText(diagnostic.range);
        const source = document.getText();
        const contextCode = getCodeContext(source, diagnostic.range.start.line + 1);

        vscode.window.withProgress(
          {
            location: vscode.ProgressLocation.Notification,
            title: 'Getting AI suggestion...',
            cancellable: false
          },
          async () => {
            if (!aiSuggester) {
              vscode.window.showErrorMessage('AI suggester not initialized.');
              return;
            }

            const suggestion = await aiSuggester.getSuggestion({
              name,
              issue: diagnostic.message,
              surroundingCode: contextCode,
              lineNumber: diagnostic.range.start.line + 1
            });

            if (suggestion) {
              const action = await vscode.window.showInformationMessage(
                `AI suggests: "${suggestion}"`,
                'Apply',
                'Copy',
                'Cancel'
              );

              if (action === 'Apply') {
                const edit = new vscode.WorkspaceEdit();
                edit.replace(document.uri, diagnostic.range, suggestion);
                await vscode.workspace.applyEdit(edit);
              } else if (action === 'Copy') {
                await vscode.env.clipboard.writeText(suggestion);
                vscode.window.showInformationMessage('Copied to clipboard!');
              }
            } else {
              vscode.window.showWarningMessage('Could not generate AI suggestion.');
            }
          }
        );
      }
    )
  );
}

function updateAISuggester() {
  const config = vscode.workspace.getConfiguration('aiSlopDetector.ai');
  const enabled = config.get('enabled', false);
  const apiKey = config.get('apiKey', '');
  const provider = config.get('provider', 'builtin') as 'openai' | 'anthropic' | 'openai-compatible' | 'builtin';
  const model = config.get('model', '');
  const baseUrl = config.get('baseUrl', '');

  if (enabled) {
    aiSuggester = new AISuggester({
      enabled,
      apiKey,
      provider,
      model: model || undefined,
      baseUrl: baseUrl || undefined
    });
  } else {
    aiSuggester = null;
  }
}

async function analyzeDocument(document: vscode.TextDocument) {
  const config = vscode.workspace.getConfiguration('aiSlopDetector');
  
  if (!config.get('enable', true)) {
    diagnosticCollection.clear();
    statusBarItem.hide();
    return;
  }

  if (!SUPPORTED_LANGUAGES.includes(document.languageId)) {
    return;
  }

  const source = document.getText();
  const result = analyze(source);
  
  const rules = config.get('rules', {
    'no-obvious-comments': true,
    'no-hedge-comments': true,
    'no-divider-comments': true,
    'no-filler-suffix': true,
    'no-filler-prefix': true,
    'no-generic-names': true,
    'no-verbose-booleans': true
  }) as Record<string, boolean>;

  const filteredIssues = result.issues.filter(issue => rules[issue.ruleId] !== false);

  const diagnostics: vscode.Diagnostic[] = [];
  
  for (const issue of filteredIssues) {
    const line = issue.line - 1;
    const range = new vscode.Range(
      new vscode.Position(line, issue.column),
      new vscode.Position(line, issue.endColumn)
    );

    const severity = issue.severity === 'warning' 
      ? vscode.DiagnosticSeverity.Warning 
      : vscode.DiagnosticSeverity.Information;

    let message = issue.message;
    
    // Get AI suggestion and add to message
    if (aiSuggester && config.get('ai.enabled', true)) {
      try {
        const name = document.getText(range);
        const contextCode = getCodeContext(source, issue.line);
        
        const suggestion = await aiSuggester.getSuggestion({
          name,
          issue: issue.message,
          surroundingCode: contextCode,
          lineNumber: issue.line
        });
        
        if (suggestion && suggestion !== name) {
          message = suggestion; // Just show AI's response
        } else {
          message = `${issue.message} (analyzing...)`; // Fallback if AI fails
        }
      } catch (error) {
        console.error('AI suggestion failed:', error);
        message = `${issue.message}.`;
      }
    } else {
      message = `${issue.message}.`;
    }

    const diagnostic = new vscode.Diagnostic(range, message, severity);
    diagnostic.code = issue.ruleId;
    diagnostic.source = 'ai-slop-detector';
    diagnostics.push(diagnostic);
  }

  diagnosticCollection.set(document.uri, diagnostics);

  // Update status bar
  if (filteredIssues.length > 0) {
    const warnings = filteredIssues.filter(i => i.severity === 'warning').length;
    const infos = filteredIssues.filter(i => i.severity === 'info').length;
    statusBarItem.text = `$(warning) AI Slop: ${warnings}W ${infos}I`;
    statusBarItem.tooltip = `${warnings} warnings, ${infos} infos`;
    statusBarItem.show();
  } else {
    statusBarItem.hide();
  }
}

export function deactivate() {
  if (diagnosticCollection) {
    diagnosticCollection.dispose();
  }
  if (statusBarItem) {
    statusBarItem.dispose();
  }
}
