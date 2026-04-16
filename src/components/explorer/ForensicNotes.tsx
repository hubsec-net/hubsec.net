'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  getNotesForTarget,
  addNote,
  updateNote,
  deleteNote,
  getAllNotes,
  exportNotesJSON,
  exportNotesCSV,
  type ForensicNote,
} from '@/lib/forensic-notes';

// ── Inline Note Button (for address/tx rows) ──

interface NoteButtonProps {
  targetId: string;
  targetType: 'address' | 'transaction';
}

export function NoteButton({ targetId, targetType }: NoteButtonProps) {
  const [open, setOpen] = useState(false);
  const [notes, setNotes] = useState<ForensicNote[]>([]);
  const [draft, setDraft] = useState('');

  const refresh = useCallback(() => {
    setNotes(getNotesForTarget(targetId));
  }, [targetId]);

  useEffect(() => { refresh(); }, [refresh]);

  const handleAdd = () => {
    if (!draft.trim()) return;
    addNote(targetId, targetType, draft.trim());
    setDraft('');
    refresh();
  };

  const handleDelete = (id: string) => {
    deleteNote(id);
    refresh();
  };

  const hasNotes = notes.length > 0;

  return (
    <span className="relative inline-block">
      <button
        onClick={() => setOpen(!open)}
        title={hasNotes ? `${notes.length} note(s)` : 'Add note'}
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: '0 2px',
          fontSize: 12,
          color: hasNotes ? '#f59e0b' : 'var(--color-text-tertiary)',
          opacity: hasNotes ? 1 : 0.5,
        }}
      >
        {hasNotes ? '\u{1F4DD}' : '\u{1F4DD}'}
      </button>
      {open && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            zIndex: 80,
            width: 280,
            backgroundColor: 'var(--color-bg-primary)',
            border: '1px solid var(--color-border-default)',
            borderRadius: 8,
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
            padding: 12,
          }}
          onClick={e => e.stopPropagation()}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold" style={{ color: 'var(--color-text-primary)', fontFamily: 'var(--font-jetbrains), monospace' }}>
              Notes
            </span>
            <button
              onClick={() => setOpen(false)}
              style={{ background: 'none', border: 'none', color: 'var(--color-text-tertiary)', cursor: 'pointer', fontSize: 14, padding: 0 }}
            >
              &times;
            </button>
          </div>

          {notes.map(n => (
            <div key={n.id} className="mb-2 py-1.5 px-2 rounded" style={{ backgroundColor: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.15)' }}>
              <p className="text-xs break-words" style={{ color: 'var(--color-text-primary)' }}>{n.text}</p>
              <div className="flex items-center justify-between mt-1">
                <span className="text-xs" style={{ color: 'var(--color-text-tertiary)', fontSize: 10 }}>
                  {new Date(n.updatedAt).toLocaleDateString()}
                </span>
                <button
                  onClick={() => handleDelete(n.id)}
                  className="text-xs"
                  style={{ color: 'var(--color-flow-out)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontSize: 10 }}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}

          <div className="flex gap-1.5 mt-1">
            <input
              type="text"
              value={draft}
              onChange={e => setDraft(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleAdd(); }}
              placeholder="Add a note..."
              className="flex-1 text-xs px-2 py-1.5 rounded"
              style={{
                backgroundColor: 'var(--color-bg-secondary)',
                border: '1px solid var(--color-border-default)',
                color: 'var(--color-text-primary)',
                fontFamily: 'var(--font-jetbrains), monospace',
                outline: 'none',
              }}
            />
            <button
              onClick={handleAdd}
              disabled={!draft.trim()}
              className="px-2 py-1.5 rounded text-xs"
              style={{
                backgroundColor: draft.trim() ? 'var(--color-accent-primary)' : 'var(--color-bg-tertiary)',
                color: draft.trim() ? 'var(--color-text-inverse)' : 'var(--color-text-tertiary)',
                border: 'none',
                cursor: draft.trim() ? 'pointer' : 'not-allowed',
                fontFamily: 'var(--font-jetbrains), monospace',
              }}
            >
              +
            </button>
          </div>

          <p className="text-xs mt-2" style={{ color: 'var(--color-text-tertiary)', fontSize: 9, lineHeight: 1.3 }}>
            Notes are stored in your browser only. Export regularly to avoid data loss.
          </p>
        </div>
      )}
    </span>
  );
}

// ── Account-level Notes Panel (shown in account header) ──

interface AccountNotesProps {
  address: string;
}

export function AccountNotes({ address }: AccountNotesProps) {
  const [notes, setNotes] = useState<ForensicNote[]>([]);
  const [editing, setEditing] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [draft, setDraft] = useState('');
  const [expanded, setExpanded] = useState(false);

  const refresh = useCallback(() => {
    setNotes(getNotesForTarget(address));
  }, [address]);

  useEffect(() => { refresh(); }, [refresh]);

  const handleAdd = () => {
    if (!draft.trim()) return;
    addNote(address, 'address', draft.trim());
    setDraft('');
    refresh();
  };

  const handleSaveEdit = (id: string) => {
    if (editText.trim()) updateNote(id, editText.trim());
    setEditing(null);
    refresh();
  };

  const handleDelete = (id: string) => {
    deleteNote(id);
    setEditing(null);
    refresh();
  };

  if (notes.length === 0 && !expanded) {
    return (
      <button
        onClick={() => setExpanded(true)}
        className="text-xs flex items-center gap-1 mt-2"
        style={{ color: 'var(--color-text-tertiary)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontFamily: 'var(--font-jetbrains), monospace' }}
      >
        + Add investigator note
      </button>
    );
  }

  return (
    <div className="mt-3">
      {notes.length > 0 && (
        <div className="space-y-1.5 mb-2">
          {notes.map(n => (
            <div
              key={n.id}
              className="flex items-start gap-2 py-1.5 px-2.5 rounded"
              style={{ backgroundColor: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.12)' }}
            >
              <span style={{ color: '#f59e0b', fontSize: 12, flexShrink: 0 }}>{'\u{1F4DD}'}</span>
              {editing === n.id ? (
                <div className="flex-1 flex gap-1">
                  <input
                    type="text"
                    value={editText}
                    onChange={e => setEditText(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') handleSaveEdit(n.id); }}
                    className="flex-1 text-xs px-2 py-1 rounded"
                    style={{ backgroundColor: 'var(--color-bg-secondary)', border: '1px solid var(--color-border-default)', color: 'var(--color-text-primary)', fontFamily: 'var(--font-jetbrains), monospace', outline: 'none' }}
                    autoFocus
                  />
                  <button onClick={() => handleSaveEdit(n.id)} className="text-xs" style={{ color: 'var(--color-flow-in)', background: 'none', border: 'none', cursor: 'pointer' }}>Save</button>
                </div>
              ) : (
                <>
                  <p className="flex-1 text-xs" style={{ color: 'var(--color-text-primary)' }}>{n.text}</p>
                  <button
                    onClick={() => { setEditing(n.id); setEditText(n.text); }}
                    className="text-xs shrink-0"
                    style={{ color: 'var(--color-text-tertiary)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontSize: 10 }}
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(n.id)}
                    className="text-xs shrink-0"
                    style={{ color: 'var(--color-flow-out)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontSize: 10 }}
                  >
                    &times;
                  </button>
                </>
              )}
            </div>
          ))}
        </div>
      )}
      <div className="flex gap-1.5">
        <input
          type="text"
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') handleAdd(); }}
          placeholder="Add investigator note..."
          className="flex-1 text-xs px-2 py-1.5 rounded"
          style={{
            backgroundColor: 'var(--color-bg-tertiary)',
            border: '1px solid var(--color-border-default)',
            color: 'var(--color-text-primary)',
            fontFamily: 'var(--font-jetbrains), monospace',
            outline: 'none',
          }}
        />
        <button
          onClick={handleAdd}
          disabled={!draft.trim()}
          className="px-3 py-1.5 rounded text-xs"
          style={{
            backgroundColor: draft.trim() ? 'var(--color-accent-primary)' : 'var(--color-bg-tertiary)',
            color: draft.trim() ? 'var(--color-text-inverse)' : 'var(--color-text-tertiary)',
            border: 'none',
            cursor: draft.trim() ? 'pointer' : 'not-allowed',
            fontFamily: 'var(--font-jetbrains), monospace',
          }}
        >
          + Add
        </button>
      </div>
    </div>
  );
}

// ── Notes Export Panel ──

export function NotesExportPanel() {
  const notes = getAllNotes();

  if (notes.length === 0) return null;

  const handleExportJSON = () => {
    const blob = new Blob([exportNotesJSON()], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `hubsec_notes_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportCSV = () => {
    const blob = new Blob([exportNotesCSV()], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `hubsec_notes_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs" style={{ color: 'var(--color-text-tertiary)', fontFamily: 'var(--font-jetbrains), monospace' }}>
        {notes.length} note(s)
      </span>
      <button
        onClick={handleExportJSON}
        className="text-xs px-2 py-1 rounded"
        style={{ color: 'var(--color-accent-primary)', border: '1px solid var(--color-accent-border)', backgroundColor: 'transparent', cursor: 'pointer', fontFamily: 'var(--font-jetbrains), monospace' }}
      >
        Export JSON
      </button>
      <button
        onClick={handleExportCSV}
        className="text-xs px-2 py-1 rounded"
        style={{ color: 'var(--color-accent-primary)', border: '1px solid var(--color-accent-border)', backgroundColor: 'transparent', cursor: 'pointer', fontFamily: 'var(--font-jetbrains), monospace' }}
      >
        Export CSV
      </button>
    </div>
  );
}
