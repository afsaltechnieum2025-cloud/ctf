import { useState, useRef, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Search, Plus, ExternalLink, ImageIcon, X, FileText, Pencil, Trash2, User,
  Cloud, ShieldCheck, Brain, Globe, Layers, Bot, Package, Tag, Sparkles,
} from 'lucide-react';
import { API } from '@/utils/api';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

const TRENDING_API = `${API}/trending`;

// ─── Validation (regex + length) for trending notes ───────────────────────────

/** Title: 2–120 chars, no angle brackets or ASCII control chars. */
const NOTE_TITLE_RE = /^[^<>\u0000-\u001F\u007F]{2,120}$/;

/** Optional URL: http(s), one line, no spaces. */
const NOTE_LINK_RE = /^https?:\/\/\S+$/i;

const NOTE_DESC_MIN = 10;
const NOTE_DESC_MAX = 8000;
const NOTE_LINK_MAX = 2048;

function validateTrendingNoteForm(form: {
  name: string;
  link: string;
  description: string;
  category: string;
  photo: File | null;
  photoPreview: string | null;
}): string | null {
  const name = form.name.trim();
  const description = form.description.trim();
  const link = form.link.trim();

  if (!name) return 'Name is required.';
  if (!description) return 'Description is required.';
  if (!NOTE_TITLE_RE.test(name)) {
    return 'Name must be 2–120 characters and cannot include <, >, or control characters.';
  }
  if (description.length < NOTE_DESC_MIN) {
    return `Description must be at least ${NOTE_DESC_MIN} characters.`;
  }
  if (description.length > NOTE_DESC_MAX) {
    return `Description must be at most ${NOTE_DESC_MAX.toLocaleString()} characters.`;
  }
  if (/\u0000/.test(description)) return 'Description cannot contain null characters.';

  if (link) {
    if (link.length > NOTE_LINK_MAX) return `Link must be at most ${NOTE_LINK_MAX} characters.`;
    if (!NOTE_LINK_RE.test(link)) {
      return 'Link must be a valid http:// or https:// URL (no spaces or line breaks).';
    }
    try {
      const u = new URL(link);
      if (u.protocol !== 'http:' && u.protocol !== 'https:') {
        return 'Link must use http:// or https:// only.';
      }
    } catch {
      return 'Link is not a valid URL.';
    }
  }

  return null;
}

// ─── Auth helper ──────────────────────────────────────────────────────────────

const authHeaders = (): Record<string, string> => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};


// ─── Categories ───────────────────────────────────────────────────────────────

const CATEGORIES = [
  { key: 'all',                  label: 'All',                 icon: Layers,  color: 'text-muted-foreground'  },
  { key: 'aws',                  label: 'Cloud (AWS)',          icon: Cloud,   color: 'text-orange-400'        },
  { key: 'azure',                label: 'Cloud (Azure)',        icon: Cloud,   color: 'text-sky-400'           },
  { key: 'sast',                 label: 'SAST',                 icon: ShieldCheck, color: 'text-green-400'         },
  { key: 'llm',                  label: 'LLM',                  icon: Bot,     color: 'text-purple-400'        },
  { key: 'toip',                 label: 'TOIP',                 icon: Brain,   color: 'text-blue-400'          },
  { key: 'asm',                  label: 'ASM',                  icon: Globe,   color: 'text-red-400'           },
  { key: 'ai_pentest',           label: 'AI Pentest',           icon: Sparkles, color: 'text-pink-400'          },
  { key: 'technieum_products',   label: 'Technieum Products',   icon: Package, color: 'text-primary'           },
  { key: 'others',               label: 'Others',               icon: Tag,     color: 'text-yellow-400'        },
] as const;

type CategoryKey = typeof CATEGORIES[number]['key'];

const CATEGORY_SELECT_OPTIONS = CATEGORIES.filter(c => c.key !== 'all');

const emptyForm = {
  name: '',
  link: '',
  description: '',
  category: 'others' as Exclude<CategoryKey, 'all'>,
  photo: null as File | null,
  photoPreview: null as string | null,
};

// ─── Component ────────────────────────────────────────────────────────────────

function displayAddedByName(note: { added_by_name?: string | null; created_by?: number | string | null }, currentUserId: string | number | undefined, currentUserName: string | null | undefined, currentUserEmail: string | undefined) {
  const fromApi = typeof note.added_by_name === 'string' ? note.added_by_name.trim() : '';
  if (fromApi) return fromApi;
  if (currentUserId != null && note.created_by != null && String(note.created_by) === String(currentUserId)) {
    const n = (currentUserName && currentUserName.trim()) || currentUserEmail?.trim();
    if (n) return n;
  }
  return 'Unknown';
}

export default function Trending() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery]   = useState('');
  const [activeTab, setActiveTab]       = useState<CategoryKey>('all');
  const [notes, setNotes]               = useState<any[]>([]);
  const [open, setOpen]                 = useState(false);
  const [loading, setLoading]           = useState(false);
  const [deleteId, setDeleteId]         = useState<number | null>(null);
  const [editNote, setEditNote]         = useState<any | null>(null);
  const [form, setForm]                 = useState(emptyForm);
  const [dragOver, setDragOver]         = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => { fetchNotes(); }, []);

  const fetchNotes = async () => {
    try {
      const res  = await fetch(TRENDING_API, {
        headers: authHeaders(),
      });
      const data = await res.json();
      setNotes(data);
    } catch (err) { console.error('Failed to fetch notes:', err); }
  };

  // ─── Photo handling — fixed for mobile + desktop ──────────────────────────

  const processFile = (file: File) => {
    if (!file) return;
    if (!file.type.startsWith('image/') && !file.name.match(/\.(heic|heif|jpg|jpeg|png|gif|webp|bmp|svg)$/i)) {
      alert('Please select an image file');
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      setForm(f => ({ ...f, photo: file, photoPreview: ev.target?.result as string }));
    };
    reader.onerror = () => console.error('Failed to read file');
    reader.readAsDataURL(file);
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
    e.target.value = '';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  };

  // ─── Dialog helpers ───────────────────────────────────────────────────────

  const handleOpenAdd = () => {
    setEditNote(null);
    setForm(emptyForm);
    setOpen(true);
  };

  const handleOpenEdit = (note: any) => {
    setEditNote(note);
    setForm({
      name: note.name,
      link: note.link || '',
      description: note.description,
      category: note.category || 'others',
      photo: null,
      photoPreview: note.photoPreview || null,
    });
    setOpen(true);
  };

  const handleCloseDialog = () => {
    setOpen(false);
    setEditNote(null);
    setForm(emptyForm);
  };

  // ─── Submit ───────────────────────────────────────────────────────────────

  const handleSubmit = async () => {
    const validationError = validateTrendingNoteForm(form);
    if (validationError) {
      toast.error(validationError);
      return;
    }
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('name', form.name.trim());
      formData.append('link', form.link.trim());
      formData.append('description', form.description.trim());
      formData.append('category', form.category);
      if (form.photo) formData.append('photo', form.photo);

      // ⚠️ Do NOT set Content-Type manually — browser sets it with the correct
      // multipart boundary automatically when body is FormData.
      const res = editNote
        ? await fetch(`${TRENDING_API}/${editNote.id}`, {
            method: 'PUT',
            headers: authHeaders(),
            body: formData,
          })
        : await fetch(TRENDING_API, {
            method: 'POST',
            headers: authHeaders(),
            body: formData,
          });

      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        toast.error(typeof errBody.error === 'string' ? errBody.error : 'Could not save the note.');
        return;
      }

      handleCloseDialog();
      await fetchNotes();
      toast.success(editNote ? 'Note updated' : 'Note saved');
    } catch (err) {
      console.error('Failed to save note:', err);
      toast.error('Could not save the note. Please try again.');
    }
    finally { setLoading(false); }
  };

  // ─── Delete ───────────────────────────────────────────────────────────────

  const handleDeleteConfirm = async () => {
    if (deleteId === null) return;
    try {
      await fetch(`${TRENDING_API}/${deleteId}`, {
        method: 'DELETE',
        headers: authHeaders(),
      });
      fetchNotes();
    } catch (err) { console.error('Failed to delete note:', err); }
    finally { setDeleteId(null); }
  };

  // ─── Filtering ────────────────────────────────────────────────────────────

  const filtered = notes.filter(n => {
    const matchSearch = n.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (n.description || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchTab = activeTab === 'all' || (n.category || 'others') === activeTab;
    return matchSearch && matchTab;
  });

  const countForTab = (key: CategoryKey) =>
    key === 'all'
      ? notes.length
      : notes.filter(n => (n.category || 'others') === key).length;

  // ─── Category meta ────────────────────────────────────────────────────────

  const getCategoryMeta = (key: string) =>
    CATEGORIES.find(c => c.key === key) ?? CATEGORIES[CATEGORIES.length - 1];

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <DashboardLayout
      title="Trending"
      description='"The quieter you become, the more you are able to hear — what matters most often hides in plain sight."'
    >
      <div className="space-y-5">

        {/* ── Delete Confirmation ── */}
        <AlertDialog open={deleteId !== null} onOpenChange={o => { if (!o) setDeleteId(null); }}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Note</AlertDialogTitle>
              <AlertDialogDescription>Are you sure? This action cannot be undone.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setDeleteId(null)}>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteConfirm} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* ── Add / Edit Dialog ── */}
        <Dialog open={open} onOpenChange={o => { if (!o) handleCloseDialog(); }}>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editNote ? 'Edit Note' : 'Add Note'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-2">

              {/* Name */}
              <div className="space-y-2">
                <Label>Name <span className="text-destructive">*</span></Label>
                <Input
                  placeholder="Note name"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  maxLength={120}
                />
                <p className="text-[11px] text-muted-foreground">
                  2–120 characters.
                </p>
              </div>

              {/* Category */}
              <div className="space-y-2">
                <Label>Category <span className="text-destructive">*</span></Label>
                <Select
                  value={form.category}
                  onValueChange={v => setForm(f => ({ ...f, category: v as any }))}
                >
                  <SelectTrigger className="bg-secondary/50">
                    {/* SelectValue renders selected item text + icon from SelectItem — do not add a second icon here */}
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORY_SELECT_OPTIONS.map(cat => {
                      const Icon = cat.icon;
                      return (
                        <SelectItem key={cat.key} value={cat.key}>
                          <div className="flex items-center gap-2">
                            <Icon className="h-3.5 w-3.5 shrink-0 text-foreground" />
                            {cat.label}
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>

              {/* Link */}
              <div className="space-y-2">
                <Label>Link <span className="text-muted-foreground text-xs">(optional)</span></Label>
                <Input
                  placeholder="https://..."
                  value={form.link}
                  onChange={e => setForm(f => ({ ...f, link: e.target.value }))}
                  maxLength={NOTE_LINK_MAX}
                />
                <p className="text-[11px] text-muted-foreground">
                  If set, must match <span className="font-mono">http://</span> or <span className="font-mono">https://</span> (no spaces).
                </p>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label>Description <span className="text-destructive">*</span></Label>
                <Textarea
                  placeholder="What's this note about?"
                  rows={3}
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  maxLength={NOTE_DESC_MAX}
                />
                <p className="text-[11px] text-muted-foreground">
                  {NOTE_DESC_MIN}–{NOTE_DESC_MAX.toLocaleString()} characters.
                </p>
              </div>

              {/* Photo */}
              <div className="space-y-2">
                <Label>Photo</Label>
                {form.photoPreview ? (
                  <div className="relative w-full h-44 rounded-lg overflow-hidden border border-border/50">
                    <img src={form.photoPreview} alt="preview" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setForm(f => ({ ...f, photo: null, photoPreview: null }))}
                      className="absolute top-2 right-2 bg-background/80 backdrop-blur-sm rounded-full p-1.5 hover:bg-background transition-colors border border-border/50"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ) : (
                  <div
                    onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={handleDrop}
                    onClick={() => fileRef.current?.click()}
                    className={`flex flex-col items-center justify-center w-full h-36 rounded-lg border-2 border-dashed cursor-pointer transition-all select-none ${
                      dragOver
                        ? 'border-primary/70 bg-primary/5'
                        : 'border-border/50 hover:border-primary/50 bg-secondary/20 hover:bg-secondary/40'
                    }`}
                  >
                    <ImageIcon className={`h-8 w-8 mb-2 transition-colors ${dragOver ? 'text-primary' : 'text-muted-foreground'}`} />
                    <p className="text-sm text-muted-foreground font-medium">Click to upload or drag & drop</p>
                    <p className="text-xs text-muted-foreground/60 mt-1">Supports JPG, PNG, HEIC, WebP — from any device</p>
                  </div>
                )}
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*,image/heic,image/heif"
                  className="hidden"
                  onChange={handlePhotoChange}
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <Button variant="outline" onClick={handleCloseDialog}>Cancel</Button>
                <Button
                  className="gradient-technieum"
                  onClick={handleSubmit}
                  disabled={loading}
                >
                  {loading ? 'Saving...' : editNote ? 'Update Note' : 'Save Note'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* ── Top bar: search + add ── */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search notes..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-10 bg-secondary/50"
            />
          </div>
          <Button className="gradient-technieum shrink-0" onClick={handleOpenAdd}>
            <Plus className="h-4 w-4 mr-2" />
            Notes
          </Button>
        </div>

        {/* ── Category tabs ── */}
        <div className="flex gap-1 p-1 bg-secondary/40 rounded-lg overflow-x-auto scrollbar-hide flex-nowrap">
          {CATEGORIES.map(cat => {
            const Icon  = cat.icon;
            const count = countForTab(cat.key);
            const isActive = activeTab === cat.key;
            return (
              <button
                key={cat.key}
                type="button"
                onClick={() => setActiveTab(cat.key)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 whitespace-nowrap shrink-0 border ${
                  isActive
                    ? 'border-primary/30 bg-primary/10 text-primary'
                    : 'border-transparent text-muted-foreground hover:bg-secondary hover:text-foreground'
                }`}
              >
                <Icon className="h-3.5 w-3.5 shrink-0 text-foreground" />
                {cat.label}
                {count > 0 && (
                  <span
                    className={`ml-0.5 rounded-full px-1.5 py-0.5 text-xs font-semibold ${
                      isActive ? 'bg-primary/15 text-primary' : 'bg-secondary text-muted-foreground'
                    }`}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* ── Notes list ── */}
        {filtered.length > 0 ? (
          <div className="space-y-3">
            {filtered.map((note, i) => {
              const catMeta = getCategoryMeta(note.category || 'others');
              const CatIcon = catMeta.icon;
              return (
                <Card
                  key={note.id}
                  glow
                  className="animate-fade-in group"
                  style={{ animationDelay: `${i * 40}ms` }}
                >
                  <CardContent className="p-4">
                    <div className="flex gap-4">
                      {/* Photo */}
                      {note.photoPreview && (
                        <div className="shrink-0 w-20 h-20 rounded-lg overflow-hidden border border-border/50">
                          <img
                            src={note.photoPreview}
                            alt={note.name}
                            className="w-full h-full object-cover"
                            onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                          />
                        </div>
                      )}

                      <div className="flex-1 min-w-0 space-y-1.5">
                        {/* Title row */}
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <p className="font-semibold text-base leading-tight truncate">{note.name}</p>
                            {/* Category pill */}
                            <span className={`shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border bg-secondary/50 border-border/40 ${catMeta.color}`}>
                              <CatIcon className="h-3 w-3" />
                              {catMeta.label}
                            </span>
                          </div>
                          {/* Actions */}
                          <div className="flex items-center gap-2 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                            {note.link && (
                              <a
                                href={note.link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-muted-foreground hover:text-primary transition-colors"
                                title="Open link"
                              >
                                <ExternalLink className="h-4 w-4" />
                              </a>
                            )}
                            <button
                              onClick={() => handleOpenEdit(note)}
                              className="text-muted-foreground hover:text-primary transition-colors"
                              title="Edit"
                            >
                              <Pencil className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => setDeleteId(note.id)}
                              className="text-muted-foreground hover:text-destructive transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>

                        {/* Description */}
                        <p className="text-sm text-muted-foreground line-clamp-3">{note.description}</p>

                        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <User className="h-3 w-3 shrink-0 opacity-70" aria-hidden />
                          <span>
                            Added by{' '}
                            <span className="font-medium text-foreground/90">
                              {displayAddedByName(note, user?.id, user?.name ?? null, user?.email)}
                            </span>
                          </span>
                        </p>

                        {/* Link */}
                        {note.link && (
                          <a
                            href={note.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-primary/70 hover:text-primary truncate block transition-colors"
                          >
                            {note.link}
                          </a>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card className="p-12 text-center">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-lg font-medium">
              {searchQuery
                ? 'No notes found'
                : activeTab === 'all'
                  ? 'No notes yet'
                  : `No notes in ${getCategoryMeta(activeTab).label}`}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              {searchQuery
                ? 'Try a different search term'
                : 'Click "Notes" to add your first note'}
            </p>
            {!searchQuery && activeTab !== 'all' && (
              <Button variant="outline" size="sm" className="mt-4" onClick={handleOpenAdd}>
                <Plus className="h-4 w-4 mr-2" />
                Add to {getCategoryMeta(activeTab).label}
              </Button>
            )}
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}