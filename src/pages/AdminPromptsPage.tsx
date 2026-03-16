// ═══════════════════════════════════════════════════
// Skill-Tango — Admin Prompts Page
// Developer Sandbox for prompt engineering
// ═══════════════════════════════════════════════════

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Plus, Save, Zap, ChevronRight, ChevronDown,
  ToggleLeft, ToggleRight, FileCode, Terminal as TermIcon,
} from 'lucide-react';
import { db } from '../adapters/db';
import { useAuth } from '../adapters/auth';
import { useToast } from '../components/ui/Toast';
import { Badge } from '../components/ui/SharedUI';
import type { SystemPrompt } from '../types';
import './AdminPromptsPage.css';

// ─── Models ───────────────────────────────────────

const MODELS = {
  gemini: { name: 'Gemini 2.5 Pro', latency: 1247, costPer1k: 0.004, color: 'hsl(239, 84%, 67%)' },
  nemotron: { name: 'NVIDIA NEMOTRON 3B (Local)', latency: 3500, costPer1k: 0.001, color: 'hsl(155, 72%, 40%)' },
} as const;

type ModelKey = keyof typeof MODELS;

// ─── Terminal Log Line Component ──────────────────

function TerminalLine({ line, delay }: { line: string; delay: number }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  if (!visible) return null;

  return (
    <motion.div
      className="admin__terminal-line"
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.15 }}
    >
      {line}
    </motion.div>
  );
}

// ─── Syntax Highlight Helpers ─────────────────────

function highlightTemplate(text: string): React.ReactNode[] {
  const lines = text.split('\n');
  return lines.map((line, i) => {
    let content: React.ReactNode;

    if (line.trimStart().startsWith('#')) {
      content = <span className="admin__hl-comment">{line}</span>;
    } else if (line.trimStart().startsWith('@')) {
      content = <span className="admin__hl-directive">{line}</span>;
    } else {
      // Highlight {{variables}}
      const parts = line.split(/({{[^}]+}})/g);
      content = parts.map((part, j) =>
        part.startsWith('{{') && part.endsWith('}}')
          ? <span key={j} className="admin__hl-variable">{part}</span>
          : <span key={j}>{part}</span>
      );
    }

    return (
      <div key={i} className="admin__editor-line">
        <span className="admin__line-num">{i + 1}</span>
        <span className="admin__line-content">{content}</span>
      </div>
    );
  });
}

function highlightJSON(text: string): React.ReactNode[] {
  const lines = text.split('\n');
  return lines.map((line, i) => {
    const parts = line.split(/("(?:[^"\\]|\\.)*")/g);
    const highlighted = parts.map((part, j) => {
      if (part.startsWith('"')) {
        // Check if it's a key or value
        if (parts[j + 1]?.trim().startsWith(':')) {
          return <span key={j} className="admin__json-key">{part}</span>;
        }
        // Check for type values
        if (['string', 'number', 'boolean', 'array', 'object'].some(t => part.includes(t))) {
          return <span key={j} className="admin__json-type">{part}</span>;
        }
        return <span key={j} className="admin__json-string">{part}</span>;
      }
      // Highlight true/false/null
      return <span key={j}>{part.replace(/\b(true|false|null)\b/g, '<span class="admin__json-bool">$1</span>')}</span>;
    });
    return <div key={i}>{highlighted}</div>;
  });
}

// ─── Main Component ──────────────────────────────

export function AdminPromptsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [prompts, setPrompts] = useState<SystemPrompt[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [model, setModel] = useState<ModelKey>('gemini');
  const [schemaOpen, setSchemaOpen] = useState(true);
  const [inferenceVars, setInferenceVars] = useState<Record<string, string>>({});
  const [running, setRunning] = useState(false);
  const [terminalLines, setTerminalLines] = useState<string[]>([]);
  const [inferenceOutput, setInferenceOutput] = useState<string | null>(null);
  const outputRef = useRef<HTMLDivElement>(null);

  // Access check
  useEffect(() => {
    if (user && user.role !== 'Owner') {
      addToast({ type: 'warning', title: 'Access denied. Admin privileges required.' });
      navigate('/dashboard');
    }
  }, [user, navigate, addToast]);

  // Load prompts
  useEffect(() => {
    db.getAll<SystemPrompt>('prompts').then(data => {
      setPrompts(data);
      if (data.length > 0) setSelectedId(data[0].id);
      setLoading(false);
    });
  }, []);

  const selectedPrompt = useMemo(
    () => prompts.find(p => p.id === selectedId) ?? null,
    [prompts, selectedId],
  );

  const filteredPrompts = useMemo(
    () => prompts.filter(p =>
      p.promptId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase()),
    ),
    [prompts, searchQuery],
  );

  const currentModel = MODELS[model];

  // Initialize form variables when switching prompts
  useEffect(() => {
    if (selectedPrompt) {
      const vars: Record<string, string> = {};
      selectedPrompt.variables.forEach(v => { vars[v] = ''; });
      setInferenceVars(vars);
      setTerminalLines([]);
      setInferenceOutput(null);
    }
  }, [selectedPrompt]);

  const handleSave = useCallback(() => {
    addToast({ type: 'success', title: 'Prompt template saved.' });
  }, [addToast]);

  const handleRunInference = useCallback(() => {
    if (!selectedPrompt) return;
    setRunning(true);
    setTerminalLines([]);
    setInferenceOutput(null);

    const lat = currentModel.latency;
    const tokensIn = 700 + Math.floor(Math.random() * 300);
    const tokensOut = 200 + Math.floor(Math.random() * 200);
    const cost = ((tokensIn + tokensOut) / 1000 * currentModel.costPer1k).toFixed(4);

    const lines = [
      `> Compiling template...           [OK]`,
      `> Injecting context variables...  [OK]`,
      `> Calling LLM API (Model: ${currentModel.name})...`,
      `> Awaiting TLS handshake...       [OK]`,
      `> Streaming response...`,
      `> Tokens in: ${tokensIn} | Tokens out: ${tokensOut}`,
      `> Latency: ${lat.toLocaleString()}ms | Cost: $${cost}`,
    ];

    setTerminalLines(lines);

    // After simulation, show output
    const totalDelay = lines.length * 200 + 500;
    setTimeout(() => {
      // Generate mock response based on prompt type
      let mockOutput: object;
      if (selectedPrompt.promptId === 'prompt_generate_curriculum') {
        mockOutput = {
          title: 'Mastering React Patterns',
          description: 'A deep dive into advanced React patterns for production applications.',
          difficulty: 'intermediate',
          estimatedHours: 6,
          modules: [
            { title: 'Component Composition', lessons: 4 },
            { title: 'State Management Patterns', lessons: 4 },
            { title: 'Performance Optimization', lessons: 3 },
          ],
        };
      } else if (selectedPrompt.promptId === 'prompt_score_answer') {
        mockOutput = {
          score: 78,
          grade: 'B+',
          strengths: ['Good understanding of core concepts', 'Clear examples provided'],
          missingConcepts: ['Didn\'t mention edge cases', 'Missing performance implications'],
          suggestion: 'Review Module 3, Lesson 2 for optimization details.',
        };
      } else {
        mockOutput = {
          simplifiedText: 'Think of it like a recipe. You have ingredients (data), and the recipe (function) tells you exactly what to do with them. A closure is like writing notes on the recipe card itself.',
          analogyUsed: 'Recipe card in the kitchen',
        };
      }

      setInferenceOutput(JSON.stringify(mockOutput, null, 2));
      setRunning(false);
      addToast({ type: 'success', title: `Inference complete — ${lat}ms` });
    }, totalDelay);
  }, [selectedPrompt, currentModel, addToast]);

  // ─── Loading State ──────────────────────────────
  if (loading) {
    return (
      <div className="admin">
        <div className="admin__left">
          <div className="admin__left-header">
            <h2>System Prompts</h2>
          </div>
          {[1, 2, 3].map(i => (
            <div key={i} className="admin__skeleton-card" />
          ))}
        </div>
        <div className="admin__right">
          <div className="admin__skeleton-editor" />
          <div className="admin__skeleton-sandbox" />
        </div>
      </div>
    );
  }

  // ─── Render ─────────────────────────────────────
  return (
    <div className="admin">
      {/* ─── Left Panel: Prompt List ─── */}
      <div className="admin__left">
        <div className="admin__left-header">
          <h2>System Prompts <Badge variant="default" size="sm">{prompts.length}</Badge></h2>
        </div>

        <div className="admin__search-wrap">
          <Search size={16} />
          <input
            className="admin__search"
            placeholder="Search prompts..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="admin__prompt-list">
          {filteredPrompts.map(prompt => (
            <motion.button
              key={prompt.id}
              className={`admin__prompt-card ${selectedId === prompt.id ? 'admin__prompt-card--active' : ''}`}
              onClick={() => setSelectedId(prompt.id)}
              whileTap={{ scale: 0.98 }}
              layout
            >
              <div className={`admin__status-dot admin__status-dot--${prompt.status}`} />
              <div className="admin__prompt-card-info">
                <span className="admin__prompt-id">{prompt.promptId}</span>
                <span className="admin__prompt-desc">{prompt.description}</span>
              </div>
              <Badge variant={prompt.status === 'active' ? 'success' : prompt.status === 'draft' ? 'warning' : 'default'} size="xs">
                {prompt.version}
              </Badge>
            </motion.button>
          ))}
        </div>

        <button className="admin__create-btn">
          <Plus size={16} /> Create New Prompt
        </button>
      </div>

      {/* ─── Right Panel: Editor + Sandbox ─── */}
      <div className="admin__right">
        {selectedPrompt ? (
          <>
            {/* ── Editor Header ── */}
            <div className="admin__editor-header">
              <div className="admin__editor-header-left">
                <FileCode size={18} />
                <code className="admin__prompt-id-display">{selectedPrompt.promptId}</code>
              </div>
              <div className="admin__editor-header-right">
                <button
                  className="admin__model-toggle"
                  onClick={() => setModel(m => m === 'gemini' ? 'nemotron' : 'gemini')}
                >
                  {model === 'gemini' ? <ToggleLeft size={20} /> : <ToggleRight size={20} />}
                  <span>{currentModel.name}</span>
                </button>
                <span className="admin__cost-pill">${currentModel.costPer1k}/1K tokens</span>
                <motion.button
                  className="btn btn--primary btn--sm"
                  onClick={handleSave}
                  whileTap={{ scale: 0.97 }}
                >
                  <Save size={14} /> Save Changes
                </motion.button>
              </div>
            </div>

            {/* ── Editor + Schema ── */}
            <div className="admin__editor-row">
              <div className="admin__editor-panel">
                <div className="admin__editor-content">
                  {highlightTemplate(selectedPrompt.template)}
                </div>
              </div>

              {/* Schema Side Panel */}
              <div className={`admin__schema-panel ${schemaOpen ? '' : 'admin__schema-panel--collapsed'}`}>
                <button
                  className="admin__schema-toggle"
                  onClick={() => setSchemaOpen(!schemaOpen)}
                >
                  {schemaOpen ? <ChevronRight size={16} /> : <ChevronDown size={16} />}
                  Expected JSON Schema
                </button>
                <AnimatePresence>
                  {schemaOpen && (
                    <motion.div
                      className="admin__schema-content"
                      initial={{ width: 0, opacity: 0 }}
                      animate={{ width: 280, opacity: 1 }}
                      exit={{ width: 0, opacity: 0 }}
                      transition={{ type: 'spring', stiffness: 300, damping: 28 }}
                    >
                      <pre className="admin__schema-code">
                        {highlightJSON(selectedPrompt.expectedSchema)}
                      </pre>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* ── Inference Sandbox ── */}
            <div className="admin__sandbox">
              <div className="admin__sandbox-header">
                <h3><TermIcon size={18} /> Test Inference</h3>
                <Badge variant="primary" size="xs">{currentModel.name}</Badge>
                <span className="admin__cost-pill">~{(currentModel.latency / 1000).toFixed(1)}s</span>
              </div>

              {/* Dynamic Variable Inputs */}
              <div className="admin__sandbox-vars">
                {selectedPrompt.variables.map(v => (
                  <div key={v} className="admin__var-field">
                    <label className="admin__var-label">{`{{${v}}}`}</label>
                    <input
                      className="admin__var-input"
                      placeholder={`Enter ${v.replace(/_/g, ' ')}...`}
                      value={inferenceVars[v] || ''}
                      onChange={e => setInferenceVars({ ...inferenceVars, [v]: e.target.value })}
                    />
                  </div>
                ))}
              </div>

              {/* Run Button */}
              <motion.button
                className="btn btn--secondary btn--lg admin__run-btn"
                onClick={handleRunInference}
                disabled={running}
                whileTap={{ scale: 0.97 }}
              >
                {running ? (
                  <motion.div
                    className="admin__spinner"
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                  />
                ) : (
                  <Zap size={18} />
                )}
                {running ? 'Running...' : 'Run Inference'}
              </motion.button>

              {/* Terminal Output */}
              {terminalLines.length > 0 && (
                <div className="admin__terminal" ref={outputRef}>
                  {terminalLines.map((line, i) => (
                    <TerminalLine key={i} line={line} delay={i * 200} />
                  ))}
                </div>
              )}

              {/* JSON Output */}
              <AnimatePresence>
                {inferenceOutput && (
                  <motion.div
                    className="admin__output"
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                  >
                    <div className="admin__output-header">Response</div>
                    <pre className="admin__output-json">
                      {highlightJSON(inferenceOutput)}
                    </pre>
                    <div className="admin__output-stats">
                      Input Tokens: ~{700 + Math.floor(Math.random() * 300)} | Output Tokens: ~{200 + Math.floor(Math.random() * 200)} | Latency: {(currentModel.latency / 1000).toFixed(1)}s | Model: {currentModel.name}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </>
        ) : (
          <div className="admin__empty">
            <FileCode size={48} />
            <h3>No system prompts configured.</h3>
            <button className="btn btn--secondary" onClick={() => addToast({ type: 'success', title: 'Create flow coming soon' })}>
              Create Your First Prompt
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
