import { EditorContent, Extension, JSONContent, useEditor } from '@tiptap/react'
import StarterKit from "@tiptap/starter-kit";
import Placeholder from '@tiptap/extension-placeholder'
import Document from '@tiptap/extension-document'
import Link from '@tiptap/extension-link'
import Suggestion from '@tiptap/suggestion'
import usePersistedStore, { baseUrl, NoteType } from '../stores/use-persisted-store';
import { useEffect, useState } from 'preact/hooks';
// import { useDebounce } from 'use-debounce';
import debounce from 'lodash.debounce';
import useHotkey from '../utils/use-hotkey';
import useSWR from 'swr';
import { SlashCommands } from './tiptap-editor-plugins/slash-command';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import Text from '@tiptap/extension-text'
import Typography from '@tiptap/extension-typography'
import Code from '@tiptap/extension-code'
const CustomDocument = Document.extend({
  //heading, ordered list, bulleted list
  // content: 'heading block*',
  content: 'heading block*',
})

const EscShortCutBlurExtension = Extension.create({
  name: 'customExtension',

  addStorage() {
    return {
      awesomeness: 100,
    }
  },

  onUpdate() {
    this.storage.awesomeness += 1
  },
  addKeyboardShortcuts() {
    return {

    }
  }
})

const TiptabEditor = ({ persistData, setEditorSnapshot }: { persistData: any; setEditorSnapshot: (json: JSONContent) => void; }) => {
  // const [editorValue, setEditorValue] = useState<JSONContent>();

  const [notes,
    addNote,
    page,
    setPage,
    selectedNoteId,
    getNoteContent,
    setNoteContent,
    createOrUpdateNotionPage,
    updateNoteMeta,
    getNoteMetaById,
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
    state.getNoteMetaById,
  ]);

  useHotkey('Esc', () => {
    setPage('home');
  })
  useHotkey('FocusNoteEditor', () => {
    editor?.commands.focus('end');
  });

  // const persistData = debounce((value) => {
  //   if (!selectedNoteId) {
  //     return;
  //   }
  //   const note = convertTipTapToNoteType(value);
  //   updateNoteMeta(selectedNoteId, note, true);
  //   // saveToNotion();
  // }, 1000);
  const defaultContent = {
    type: 'doc',
    content: [
      {
        type: 'heading',
        attrs: {
          level: 1,
        },
        content: [
          {
            type: 'text',
            text: 'Hello World!',
          }
        ]
      },
      {
        type: 'paragraph',
        content: [
          {
            type: 'text',
            text: 'Hello World!',
          },
        ],
      }
    ],
  };
  const localContent = selectedNoteId ? getNoteContent(selectedNoteId).content : defaultContent;
  const [data, setData] = useState<JSONContent>(localContent);

  useEffect(() => {
    (async () => {
      
      if (!selectedNoteId) {
        return;
      }
      // use data from local storage
      setData(localContent);

      console.info('[tiptap-editor] fetching new data from remote');

      console.info('localContent', JSON.stringify(localContent));

      // use data from remote if local is older
      await fetch(`${baseUrl}/api/notes?id=${selectedNoteId}`)
        .then(res => res.json())
        .then(remoteData => {
          if (remoteData?.content) {
            // compare local content with remote content
            const localNoteMeta = getNoteMetaById(selectedNoteId!);
            // when remote have more fresh data
            if ((localNoteMeta?.updatedAt && remoteData.updatedAt > localNoteMeta.updatedAt)

              // for backward compatibility
              || (!localNoteMeta?.updatedAt && !remoteData?.updatedAt)) {
              setData(remoteData.content);
              console.info("[tiptap-editor] using remote data");
              persistData(remoteData.content);
              return remoteData.content;
            }
            console.info('[tiptap-editor] local content is newer ', 'remoteiiiiii', JSON.stringify(remoteData), 'local', JSON.stringify(localNoteMeta), 'localcontent', JSON.stringify(localContent));
          }

          return localContent;
        })

    })()
  }, [selectedNoteId]);

  const editor = useEditor({
    extensions: [
      Link.configure({
        openOnClick: true,
        autolink: true,
      }),
      Code,
      Typography,
      TaskList,
      TaskItem,
      SlashCommands,
      EscShortCutBlurExtension.extend({
        addKeyboardShortcuts() {
          return {
            'Escape': () => {
              return this.editor.commands.blur()
            },
            'Mod-s': () => {
              return persistData(this.editor.getJSON());
            },
            'Tab': (editor) => {
              // Do whatever you want here...
              this.editor.chain().insertContent('    ').run();

              return true // <- make sure to return true to prevent the tab from blurring.
            },
          }
        }
      }),
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

    onUpdate: ({ editor: e, transaction }) => {
      const content = e.getJSON();
      setEditorSnapshot(content);
      persistData(content);
    },
    enablePasteRules: [
      "paragraph",
    ], // disable Markdown when pasting
    enableInputRules: false, // disable Markdown when typing
    content: data || {
      type: 'doc',
      content: [],
    },
    editorProps: {
      attributes: {
        spellcheck: "false",
        class: rteClass,
      },
    },
  }, [selectedNoteId, data]);

  return <>
    <EditorContent editor={editor} />
  </>
}






export const rteClass =
  "prose !bg-transparent dark:prose-invert max-w-[calc(100%+2rem)] focus:outline-none pb-4 pt-2 " +
  "prose-pre:!bg-gray-900 prose-pre:border dark:prose-pre:border-gray-800 dark:prose-code:bg-gray-900 dark:prose-code:border-gray-700 dark:prose-code:text-gray-400 prose-code:bg-gray-100 dark:bg-gray-800 prose-code:font-medium prose-code:font-mono prose-code:rounded-lg prose-code:px-1.5 prose-code:py-0.5 prose-code:border prose-code:text-gray-500 " +
  "prose-blockquote:border-l-2 prose-blockquote:pl-4 prose-blockquote:text-gray-400 prose-blockquote:not-italic " +
  "prose-headings:leading-tight prose-headings:tracking-tight prose-h1:text-2xl prose-h1:font-bold prose-h1:font-bold";


export default TiptabEditor;
