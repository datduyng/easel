import create from 'zustand';
import { persist } from 'zustand/middleware';

interface Store {
    test: string;
    notes: NoteType[];
    selectedNoteId: string | null;
    setSelectNoteId: (id: string) => void;
    addNote: (note: NoteType) => void;
    page: 'home' | 'note',
    setPage: (page: 'home' | 'note') => void;
    getNoteContent: (id: string) => { content: string };
    setNoteContent: (id: string, content: string) => void;
    updateNoteMeta: (id: string, note: NoteType) => void;
}

export interface NoteType {
    id: string;
    title: string;
    preview: string;
    content: string;
    createdAt: number;
}


//implement persist store
function deleteContent(x: Partial<NoteType>) {
    delete x.content;
}

const usePersistedStore = create<Store>()(
    persist<Store>(
        (set, get) => ({
            test: 'test',
            notes: [],
            selectedNoteId: null,
            setSelectNoteId: (id: string) => set({ selectedNoteId: id }),
            addNote: (note) => {
                const notes = get().notes;
                get().setNoteContent(note.id, note.content);
                note.preview = note.content.slice(0, 100);

                deleteContent(note);
                set({ notes: [...notes, note] });
            },
            updateNoteMeta: (id, note) => {
                const notes = get().notes;
                const noteIndex = notes.findIndex((note) => note.id === id);

                if (note.content) {
                    note.preview = note.content.slice(0, 100);
                    get().setNoteContent(id, note.content);
                    deleteContent(note);
                }

                notes[noteIndex] = {
                    ...notes[noteIndex],
                    ...note,
                };
                set({ notes: [...notes] });
            },
            page: 'home',
            setPage: (page) => set({ page }),
            getNoteContent: (noteId: string) => getLocalStorage(`note:${noteId}`) || {},
            setNoteContent: (noteId: string, content: string) => {
                const payload = {
                    content,
                };
                setLocalStorage(`note:${noteId}`, payload);
                return payload;
            }
        }),
        {
            name: 'quick-notes',
        }
    )
);

// https://github.com/pmndrs/zustand/issues/195
const getLocalStorage = (key: string) => JSON.parse(window.localStorage.getItem(key) || '{}');
const setLocalStorage = (key: string, value: any) =>
    window.localStorage.setItem(key, JSON.stringify(value));

export default usePersistedStore;