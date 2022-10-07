import { EditorContent, JSONContent, useEditor } from '@tiptap/react'
import StarterKit from "@tiptap/starter-kit";
import Placeholder from '@tiptap/extension-placeholder'
import Document from '@tiptap/extension-document'
import usePersistedStore, { NoteType } from '../stores/use-persisted-store';
import { useEffect, useState } from 'preact/hooks';
import { useDebounce } from 'use-debounce';
const CustomDocument = Document.extend({
    content: 'heading block*',
})


const TiptabEditor = () => {
    const [editorValue, setEditorValue] = useState<JSONContent>();

    const [notes,
        addNote,
        page,
        setPage,
        selectedNoteId,
        getNoteContent,
        setNoteContent,
        createOrUpdateNotionPage,
        updateNoteMeta,
    ] = usePersistedStore(state => [
        state.notes,
        state.addNote,
        state.page,
        state.setPage,
        state.selectedNoteId,
        state.getNoteContent,
        state.setNoteContent,
        state.createOrUpdateNotionPage,
        state.updateNoteMeta,
    ]);

    const editor = useEditor({
        extensions: [
            CustomDocument,
            StarterKit.configure({
                document: false,
                // dropcursor: false,
                // paragraph: false,
                // heading: true,
                // blockquote: false,
                // bulletList: false,
                // orderedList: false,
                // horizontalRule: false,
                // codeBlock: false,
            }),
            Placeholder.configure({
                // Use a placeholder:
                // placeholder: 'Write something …',
                // Use different placeholders depending on the node type:
                placeholder: ({ node }) => {
                    if (node.type.name === 'heading') {
                        return 'Start writing a title …'
                    }

                    return 'Start writing ...'
                },
            }),

        ],

        onUpdate: ({ editor: e }) => setEditorValue(e.getJSON()),
        enablePasteRules: [
            "paragraph",
        ], // disable Markdown when pasting
        enableInputRules: false, // disable Markdown when typing
        content: selectedNoteId ? getNoteContent(selectedNoteId).content : {},
        editorProps: {
            attributes: {
                spellcheck: "false",
                class: rteClass,
            },
        },
    }, [selectedNoteId])

    const [debouncedEditor] = useDebounce(editorValue, 600);

    useEffect(() => {
        if (debouncedEditor && selectedNoteId) {
            console.info("[TiptabEditor] Persisting note content", selectedNoteId);

            const d = convertTipTapToNoteType(debouncedEditor);
            updateNoteMeta(selectedNoteId, d);
        }
    }, [debouncedEditor, selectedNoteId]);

    return <>
        <EditorContent editor={editor} />
    </>
}


const convertTipTapToNoteType = (content: JSONContent) => {
    if (!content?.content) {
        return {};
    }

    let title: string = "";
    for (const node of content.content) {
        if (!title?.trim() && node.type === 'heading') {
            title = node.content?.[0].text || "Untitled";
            break;
        }
    }

    return {
        title,
        content,
    } as Partial<NoteType>;
}




export const rteClass =
    "prose !bg-transparent dark:prose-invert max-w-[calc(100%+2rem)] focus:outline-none pb-4 pt-2 " +
    "prose-pre:!bg-gray-900 prose-pre:border dark:prose-pre:border-gray-800 dark:prose-code:bg-gray-900 dark:prose-code:border-gray-700 dark:prose-code:text-gray-400 prose-code:bg-gray-100 dark:bg-gray-800 prose-code:font-medium prose-code:font-mono prose-code:rounded-lg prose-code:px-1.5 prose-code:py-0.5 prose-code:border prose-code:text-gray-500 " +
    "prose-blockquote:border-l-2 prose-blockquote:pl-4 prose-blockquote:text-gray-400 prose-blockquote:not-italic " +
    "prose-headings:leading-tight prose-headings:tracking-tight prose-h1:text-2xl prose-h1:font-bold prose-h1:font-bold";


export default TiptabEditor;
