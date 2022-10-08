import { notification } from '@tauri-apps/api';
import create from 'zustand';
import { persist } from 'zustand/middleware';
import { Client } from "@notionhq/client";
import { JSONContent } from '@tiptap/core';

const NOTION_SECRET =
    "secret_gu2GH4PoSsLdYuFodvAiecODmA6uu02laooSLUkrMS";

// const notionClient = new Client({
//     auth: NOTION_SECRET,
//     notionVersion: "2021-05-13",
//     baseUrl: "http://localhost:3000/api?endpoint=https://api.notion.com",
// });

const notionDbId = "f36eba38aa3f413786fad37c690e474c";

export const createNoteInNotion = async (note: NoteType) => {

    const rawContent = convertTipTapToPlainText(note.content);
    const request = {
        parent: {
            database_id: notionDbId,
        },
        icon: {
            type: "emoji",
            emoji: "🗒️",
        },
        properties: {
            Name: {
                title: [
                    {
                        text: {
                            content: note.title,
                        },
                    },
                ],
            },
            Note: {
                rich_text: [
                    {
                        type: 'text',
                        text: {
                            content: rawContent,
                            link: null,
                        },
                    },
                ],
            }
        },
        // children: rawContent,
    };

    return new Promise((resolve, reject) => {
        return fetch("https://easel-api.vercel.app/api/notion?endpoint=https://api.notion.com/v1/pages", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(request)
        }).then((res) => res.json())
            .then((data) => {
                resolve(data);
            }).catch((err) => {
                console.error("[createNoteInNotion] error", err);
                reject(err);
            });
    });
}

// update note in notion
export const updateNoteInNotion = async (notionId: string, note: Partial<NoteType>) => {
    const rawContent = convertTipTapToPlainText(note?.content);
    const request = {
        page_id: notionId || '',
        properties: {
            Name: {
                title: [
                    {
                        text: {
                            content: note.title || "Untitled",
                        },
                    },
                ],
            },
            Note: {
                rich_text: [
                    {
                        type: 'text',
                        text: {
                            content: rawContent,
                            link: null,
                        },
                    },
                ],
            }
        },
    };

    return new Promise((resolve, reject) => {
        return fetch("https://easel-api.vercel.app/api/notion?endpoint=https://api.notion.com/v1/pages/" + notionId, {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(request)
        }).then((res) => res.json())
            .then((data) => {
                resolve(data);
            }).catch((err) => {
                console.error("[updateNoteInNotion] error", err);
                reject(err);
            });
    });
}
interface Store {
    test: string;
    notes: NoteType[];
    selectedNoteId: string | null;
    setSelectNoteId: (id: string) => void;
    selectPreviousNote: () => void;
    selectNextNote: () => void;
    getNoteMetaById: (id: string) => NoteType | undefined;
    addNote: (note: NoteType) => void;
    page: 'home' | 'note',
    setPage: (page: 'home' | 'note') => void;
    getNoteContent: (id: string) => { content: JSONContent };
    setNoteContent: (id: string, content: JSONContent) => void;
    updateNoteMeta: (id: string, note: Partial<NoteType>) => void;
    deleteNote: (id: string) => void;
    createOrUpdateNotionPage: (id: string, note: Partial<NoteType>) => void;
}

export interface NoteType {
    id: string;
    notionId?: string;
    title: string;
    preview: string;
    content: JSONContent;
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
            selectPreviousNote: () => {
                const notes = get().notes;
                const selectedNoteId = get().selectedNoteId;
                if (!selectedNoteId) {
                    return;
                }
                const index = notes.findIndex((x) => x.id === selectedNoteId);
                if (index === 0) {
                    return;
                }
                set({ selectedNoteId: notes[index - 1].id });
            },
            selectNextNote: () => {
                const notes = get().notes;
                const selectedNoteId = get().selectedNoteId;
                if (!selectedNoteId) {
                    return;
                }
                const index = notes.findIndex((x) => x.id === selectedNoteId);
                if (index === notes.length - 1) {
                    return;
                }
                set({ selectedNoteId: notes[index + 1].id });
            },
            addNote: (note) => {
                const notes = get().notes;
                get().setNoteContent(note.id, note.content);
                note.preview = note.content.content?.find(x => x.type !== 'heading')?.text?.slice(0, 50) || "";

                deleteContent(note);
                set({ notes: [...notes, note] });
            },
            updateNoteMeta: (id, note) => {
                delete note.id;
                const notes = get().notes;
                const noteIndex = notes.findIndex((note) => note.id === id);

                if (note.content) {
                    note.preview = note.content.content?.find(x => x.type !== 'heading')?.text?.slice(0, 50) || "";
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
            getNoteContent: (noteId: string) => getLocalStorage(`note:${noteId}`) || { type: 'doc', content: [] },
            setNoteContent: (noteId: string, content: JSONContent) => {
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

                        const notionId = (response as any).id;
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

// convert JSONContent List to plain text
const convertTipTapToPlainText = (content?: JSONContent) => {
    if (!content?.content) {
        return [];
    }

    let text = "";
    const nodes = content.content;
    for (let i = 1; i < nodes.length; i++) {
        if (nodes[i].type === 'paragraph') {
            text += (nodes[i].content?.[0].text || "") + "\n";
        }
    }

    return text;
}

const convertTipTapToBlocks = (content: JSONContent) => {
    if (!content?.content) {
        return [];
    }

    let text = [];
    const nodes = content.content;
    for (let i = 1; i < nodes.length; i++) {
        if (nodes[i].type === 'paragraph') {
            text.push({
                type: 'paragraph',
                paragraph: {
                    rich_text: [
                        {
                            type: 'text',
                            text: {
                                content: nodes[i].content?.[0].text || "",
                                link: null,
                            },
                        },
                    ],
                    color: 'default',
                },
            })
        }
    }

    return text;
}


// https://github.com/pmndrs/zustand/issues/195
const getLocalStorage = (key: string) => JSON.parse(window.localStorage.getItem(key) || '{}');
const removeLocalStorageByKey = (key: string) => window.localStorage.removeItem(key);
const setLocalStorage = (key: string, value: any) =>
    window.localStorage.setItem(key, JSON.stringify(value));

export default usePersistedStore;