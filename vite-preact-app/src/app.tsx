import { useState } from "preact/hooks";
import preactLogo from "./assets/preact.svg";
import { invoke } from "@tauri-apps/api/tauri";
import "./app.css";
import { appWindow } from "@tauri-apps/api/window";
import React, { useEffect } from 'preact/compat'
import usePersistedStore, { NoteType } from "./stores/use-persisted-store";
import { EditorContent, useEditor } from '@tiptap/react'
import StarterKit from "@tiptap/starter-kit";
import Placeholder from '@tiptap/extension-placeholder'

import { useDebounce } from 'use-debounce';
import { Client } from "@notionhq/client";

const NOTION_SECRET =
  "secret_gu2GH4PoSsLdYuFodvAiecODmA6uu02laooSLUkrMS";

const notionClient = new Client({
  auth: NOTION_SECRET,
  notionVersion: "2021-05-13",
  baseUrl: "https://exp-tauriapp.vercel.app/api/notion-proxy",
});

const notionDbId = "436cfb4ce460431ea89f3a11e408e4d2";


let isPinned = false;
appWindow.listen('tauri://blur', () => {
  // invoke('hide_window', {
  //   isPinned,
  // });
})


export const createNoteInNotion = async (note: NoteType) => {
  const response = await notionClient.pages.create({
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
              content: note.content.slice(0, 10),
            },
          },
        ],
      },
    },
    children: [
      {
        type: 'paragraph',
        paragraph: {
          rich_text: [
            {
              type: 'text',
              text: {
                content: note.content,
                link: null,
              },
            },
          ],
          color: 'default',
        },
      },
    ],
  });

  return response;
}

// update note in notion
export const updateNoteInNotion = async (notionId: string, note: Partial<NoteType>) => {
  const response = await notionClient.pages.update({
    page_id: notionId || '',
    properties: {
      Name: {
        title: [
          {
            text: {
              content: note?.content?.slice(0, 10) || "",
            },
          },
        ],
      },
      Note: {
        rich_text: [
          {
            type: 'text',
            text: {
              content: note?.content || "'",
              link: null,
            },
          },
        ],
      }
    },
  });
}


export const rteClass =
  "prose !bg-transparent dark:prose-invert max-w-[calc(100%+2rem)] focus:outline-none pb-4 pt-2 " +
  "prose-pre:!bg-gray-900 prose-pre:border dark:prose-pre:border-gray-800 dark:prose-code:bg-gray-900 dark:prose-code:border-gray-700 dark:prose-code:text-gray-400 prose-code:bg-gray-100 dark:bg-gray-800 prose-code:font-medium prose-code:font-mono prose-code:rounded-lg prose-code:px-1.5 prose-code:py-0.5 prose-code:border prose-code:text-gray-500 " +
  "prose-blockquote:border-l-2 prose-blockquote:pl-4 prose-blockquote:text-gray-400 prose-blockquote:not-italic " +
  "prose-headings:leading-tight prose-headings:tracking-tight prose-h1:text-2xl prose-h1:font-bold prose-h1:font-bold";

export function App<FC>() {
  const [greetMsg, setGreetMsg] = useState<string>("");
  const [name, setName] = useState<string>("");

  const greet = async () => {
    // Learn more about Tauri commands at https://tauri.app/v1/guides/features/command
    setGreetMsg(await invoke("greet", { name }));
  };
  const [pining, setPining] = useState<boolean>(false)
  useEffect(() => {
    if (pining) {
      isPinned = true;
    } else {
      isPinned = false;
    }
  }, [pining])
  // useWindowEvent('tauri://blur', async () => {
  //   console.log('pinning on blur', pining);
  //   // @ts-ignore
  //   if (!pining) {
  //     await invoke("hide_window")
  //   }
  //   return;
  // }, [pining])
  console.log('pining', pining);

  const pinButton = (<button
    // width="7rem"
    // background={pining ? "green.500" : "gray.500"}
    // color="white"
    onClick={() => {
      setPining(!pining)
    }}
    class="inline-flex items-center text-sm 
          font-medium relative h-9 px-4 py-2.5 
          rounded-md border border-transparent 
          text-white bg-gray-500 hover:bg-gray-400 
          focus:outline-none focus:ring-2 focus:ring-offset-2 
          focus:ring-gray-500">
    {pining ? "unpin" : "pin"}
  </button>)

  const [notes,
    addNote,
    page,
    setPage,
    selectedNoteId,
    getNoteContent,
    setNoteContent,
    createOrUpdateNotionPage,
  ] = usePersistedStore(state => [
    state.notes,
    state.addNote,
    state.page,
    state.setPage,
    state.selectedNoteId,
    state.getNoteContent,
    state.setNoteContent,
    state.createOrUpdateNotionPage]);

  const [loadingNotion, setLoadingNotion] = useState<boolean>(false);
  const header = (
    <div data-tauri-drag-region>
      {page === 'home' && <div
        data-tauri-drag-region
        class="
          flex flex-row justify-end gap-2
          bg-white
          p-2
        ">

        {pinButton}
        <button
          onClick={() => {
            addNote({
              title: "new note " + Date.now(),
              content: "",
              createdAt: Date.now(),
              id: randomString(10),
              preview: "",
            })
          }}
          class="inline-flex items-center text-sm 
          font-medium relative h-9 px-4 py-2.5 
          rounded-md border border-transparent 
          text-white bg-brand-500 hover:bg-brand-400 
          focus:outline-none focus:ring-2 focus:ring-offset-2 
          focus:ring-brand-500">
          Add note
        </button>
      </div>}

      {page === 'note' && <div data-tauri-drag-region
        class="
        flex flex-row justify-between gap-2
        p-2
      ">
        <button
          onClick={() => {
            setPage('home')
          }}
          class="inline-flex items-center text-sm 
          font-medium relative h-9 px-4 py-2.5 
          rounded-md border border-transparent 
          text-white bg-brand-500 hover:bg-brand-400 
          focus:outline-none focus:ring-2 focus:ring-offset-2 
          focus:ring-brand-500">
          Back
        </button>

        <button
          style={{
            height: 40,
          }}
          onClick={async () => {
            setLoadingNotion(true);
            try {
              if (selectedNoteId) {

                const toUpdate: Partial<NoteType> = {
                }

                if (getNoteContent(selectedNoteId)?.content) {
                  toUpdate.content = getNoteContent(selectedNoteId)?.content
                }
                const note = notes.find(n => n.id === selectedNoteId);
                if (note) {
                  toUpdate.preview = note.preview
                }

                await createOrUpdateNotionPage(selectedNoteId, toUpdate);
              }
            } catch (e) {
              console.log('ssaving notion error', e);
            } finally {
              setLoadingNotion(false);
            }
          }}
          class="flex justify-center items-center text-sm 
          rounded-md py-2 px-3 font-medium 
          text-gray-600 hover:bg-gray-100 
          lg:px-[14px]">
          {loadingNotion ? <div class="spinner-grow inline-block w-8 h-8 bg-current rounded-full opacity-0 text-gray-300" role="status">
            <span class="visually-hidden">Loading...</span>
          </div> : <>
            <div>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" clip-rule="evenodd" d="M11.0001 22.2877H13.0001V7.80237L16.2428 11.045L17.657 9.63079L12.0001 3.97394L6.34326 9.63079L7.75748 11.045L11.0001 7.80236V22.2877ZM18 3H6V1H18V3Z" fill="currentColor" /></svg>
            </div>
            <div>
              Save to Notion
            </div>
          </>}

        </button>
      </div>}



    </div>
  );



  const editor = useEditor({

    extensions: [
      StarterKit.configure({
        // dropcursor: false,
        // paragraph: false,
        // heading: false,
        // blockquote: false,
        // bulletList: false,
        // orderedList: false,
        // horizontalRule: false,
        // codeBlock: false,
      }),
      Placeholder.configure({
        // Use a placeholder:
        placeholder: 'Write something …',
        // Use different placeholders depending on the node type:
        // placeholder: ({ node }) => {
        //   if (node.type.name === 'heading') {
        //     return 'What’s the title?'
        //   }

        //   return 'Can you add some further context?'
        // },
      }),

    ],

    content: `${selectedNoteId ? getNoteContent(selectedNoteId).content : ''}`,
    editorProps: {
      attributes: {
        spellcheck: "false",
        class: rteClass,
      },
    },

  }, [selectedNoteId])
  const [debouncedEditor] = useDebounce(editor?.getHTML(), 600);

  // console.log("testsadfjalsdkfj ", editor?.state);
  useEffect(() => {
    if (debouncedEditor && selectedNoteId) {
      console.log('saving test', debouncedEditor);
      // save
      setNoteContent(selectedNoteId, debouncedEditor)
    }
  }, [debouncedEditor, selectedNoteId]);

  return (
    <div className={'flex flex-col h-full'}>
      {header}
      <div class="overflow-y-auto w-full relative max-w-md" style={{
        height: 'calc(500px - 52px)'
      }}>
        <div class={""}>
          {page === 'home' && <div class="
            
            flex flex-col gap-1
            mx-4 mt-1
            ">
            {notes.map((note, index) => {
              return <NoteListItem key={note.id} note={note} />
            })}
          </div>}
          {page === 'note' && <div class={`
            mx-4 mt-1
          `}>
            <EditorContent editor={editor} />
          </div>}
        </div>
      </div>

    </div>
  );
}

// generate random string
function randomString(length: number) {
  const chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let result = '';
  for (let i = length; i > 0; --i) result += chars[Math.floor(Math.random() * chars.length)];
  return result;
}


const NoteListItem: React.FC<{ note: NoteType }> = ({ note }) => {
  const [page,
    setPage,
    setSelectNoteId,
    deleteNote,
  ] = usePersistedStore(state => [
    state.page,
    state.setPage,
    state.setSelectNoteId,
    state.deleteNote]);
  return (
    // note list item card with gray border
    <div


      class="
      flex
      flex-col
      rounded-md
      border-[1px] border-gray-500
      h-20 px-3 pt-1
    ">
      <div class="flex flex-row justify-end">
        <button class="inline-flex"
          onClick={() => {
            setPage('note');
            setSelectNoteId(note.id);
          }}>
          {/* edit icon */}
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              fill-rule="evenodd"
              clip-rule="evenodd"
              d="M12 24C18.6274 24 24 18.6274 24 12C24 5.37258 18.6274 0 12 0C5.37258 0 0 5.37258 0 12C0 18.6274 5.37258 24 12 24ZM18.5793 19.531C20.6758 17.698 22 15.0036 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 14.9616 3.28743 17.6225 5.33317 19.4535L6.99999 10.9738H9.17026L12 6.07251L14.8297 10.9738H17L18.5793 19.531ZM16.0919 21.1272L15.2056 12.9738H8.79438L7.90814 21.1272C9.15715 21.688 10.5421 22 12 22C13.4579 22 14.8428 21.688 16.0919 21.1272Z"
              fill="currentColor"
            />
          </svg>
        </button>
        {/* delete button */}
        <button class="inline-flex" onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          deleteNote(note.id);
        }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" clip-rule="evenodd" d="M17 6V5C17 3.89543 16.1046 3 15 3H9C7.89543 3 7 3.89543 7 5V6H4C3.44772 6 3 6.44772 3 7C3 7.55228 3.44772 8 4 8H5V19C5 20.6569 6.34315 22 8 22H16C17.6569 22 19 20.6569 19 19V8H20C20.5523 8 21 7.55228 21 7C21 6.44772 20.5523 6 20 6H17ZM15 5H9V6H15V5ZM17 8H7V19C7 19.5523 7.44772 20 8 20H16C16.5523 20 17 19.5523 17 19V8Z" fill="currentColor" /></svg>
        </button>

      </div>
      <div>

        {note.title}
      </div>

    </div>
  )
}


type RemoveListenerBlock = any
export function useWindowEvent<Payload>(name: string, callback: (event: any) => void, deps: any[] = []): RemoveListenerBlock {
  return useEffect(() => {
    let removeListener: RemoveListenerBlock | undefined


    console.log('registering event listener')
    const setUpListener = async () => {
      removeListener = await appWindow.listen(name, event => {
        callback(event)
      })
    }

    setUpListener().catch((error: any) => {
      // @ts-ignore
      console.error(`Could not set up window event listener.${error.message}`)
    })

    return () => {
      if (removeListener) {
        removeListener()
      }
    }
  }, [callback, ...deps])
}
