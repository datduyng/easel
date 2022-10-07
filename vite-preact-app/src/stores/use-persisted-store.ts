import { notification } from '@tauri-apps/api';
import create from 'zustand';
import { persist } from 'zustand/middleware';
import { createNoteInNotion, updateNoteInNotion } from '../app';

interface Store {
    test: string;
    notes: NoteType[];
    selectedNoteId: string | null;
    setSelectNoteId: (id: string) => void;
    getNoteMetaById: (id: string) => NoteType | undefined;
    addNote: (note: NoteType) => void;
    page: 'home' | 'note',
    setPage: (page: 'home' | 'note') => void;
    getNoteContent: (id: string) => { content: string };
    setNoteContent: (id: string, content: string) => void;
    updateNoteMeta: (id: string, note: Partial<NoteType>) => void;
    deleteNote: (id: string) => void;
    createOrUpdateNotionPage: (id: string, note: Partial<NoteType>) => void;
}

export interface NoteType {
    id: string;
    notionId?: string;
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
            getNoteMetaById(id) {
                return get().notes.find((x) => x.id === id);
            },
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
                delete note.id;
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
            },
            deleteNote: (id: string) => {
                const notes = get().notes;
                const noteIndex = notes.findIndex((note) => note.id === id);
                notes.splice(noteIndex, 1);
                if (noteIndex !== -1) {
                    removeLocalStorageByKey(`note:${id}`);
                }
                    
                set({ notes: [...notes] });
            },
            async createOrUpdateNotionPage(id, updatedNote) {
                delete updatedNote.id;

                const notes = get().notes;
                const noteInDb = notes.find((note) => note.id === id);
                if (noteInDb) {
                    const notionId = noteInDb.notionId;
                    if (notionId) {
                        // update notion page
                        await updateNoteInNotion(notionId, {
                            ...noteInDb,
                            ...updatedNote,
                        });
                    } else {
                        // create notion page
                        const response = await createNoteInNotion({
                            ...noteInDb,
                            ...updatedNote,
                        });
                        
                        console.log('create notion page', response);
                        const notionId = response.id;
                        get().updateNoteMeta(id, { notionId });
                    }
                }
            },
        }),
        {
            name: 'quick-notes',
        }
    )
);

// https://github.com/pmndrs/zustand/issues/195
const getLocalStorage = (key: string) => JSON.parse(window.localStorage.getItem(key) || '{}');
const removeLocalStorageByKey = (key: string) => window.localStorage.removeItem(key);
const setLocalStorage = (key: string, value: any) =>
    window.localStorage.setItem(key, JSON.stringify(value));

export default usePersistedStore;