const STORAGE_KEY = 'hubsec_forensic_notes';

export interface ForensicNote {
  id: string;
  targetId: string; // address or tx hash
  targetType: 'address' | 'transaction';
  text: string;
  createdAt: number;
  updatedAt: number;
}

function loadAll(): ForensicNote[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveAll(notes: ForensicNote[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
}

export function getNotesForTarget(targetId: string): ForensicNote[] {
  return loadAll().filter(n => n.targetId.toLowerCase() === targetId.toLowerCase());
}

export function getAllNotes(): ForensicNote[] {
  return loadAll().sort((a, b) => b.updatedAt - a.updatedAt);
}

export function addNote(targetId: string, targetType: 'address' | 'transaction', text: string): ForensicNote {
  const notes = loadAll();
  const note: ForensicNote = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    targetId: targetId.toLowerCase(),
    targetType,
    text,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
  notes.push(note);
  saveAll(notes);
  return note;
}

export function updateNote(id: string, text: string): void {
  const notes = loadAll();
  const note = notes.find(n => n.id === id);
  if (note) {
    note.text = text;
    note.updatedAt = Date.now();
    saveAll(notes);
  }
}

export function deleteNote(id: string): void {
  const notes = loadAll().filter(n => n.id !== id);
  saveAll(notes);
}

export function hasNote(targetId: string): boolean {
  return loadAll().some(n => n.targetId.toLowerCase() === targetId.toLowerCase());
}

export function exportNotesJSON(): string {
  return JSON.stringify(loadAll(), null, 2);
}

export function exportNotesCSV(): string {
  const notes = loadAll();
  const header = 'Target ID,Target Type,Note,Created,Updated\n';
  const rows = notes.map(n => {
    const created = new Date(n.createdAt).toISOString();
    const updated = new Date(n.updatedAt).toISOString();
    const text = n.text.replace(/"/g, '""');
    return `"${n.targetId}","${n.targetType}","${text}","${created}","${updated}"`;
  }).join('\n');
  return header + rows;
}
