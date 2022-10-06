import { useState } from "preact/hooks";
import preactLogo from "./assets/preact.svg";
import { invoke } from "@tauri-apps/api/tauri";
import "./app.css";
import { appWindow } from "@tauri-apps/api/window";
import React, { useEffect } from 'preact/compat'
import usePersistedStore, { NoteType } from "./stores/use-persisted-store";
import { EditorContent, useEditor } from '@tiptap/react'
import StarterKit from "@tiptap/starter-kit";

import { useDebounce } from 'use-debounce';

let isPinned = false;
appWindow.listen('tauri://blur', () => {
  // invoke('hide_window', {
  //   isPinned,
  // });
})

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

  const [notes, addNote, page, setPage,
    selectedNoteId,
    getNoteContent,
    setNoteContent,] = usePersistedStore(state => [state.notes, state.addNote, state.page, state.setPage,
    state.selectedNoteId,
    state.getNoteContent,
    state.setNoteContent,]);
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
              content: "new note content",
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
        flex flex-row justify-start gap-2
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
      </div>}



    </div>
  );



  const editor = useEditor({

    extensions: [
      StarterKit,
    ],

    content: `${selectedNoteId ? getNoteContent(selectedNoteId).content : ''}`,
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
      <div class="overflow-auto h-96">
          <div class={""}>
          {page === 'home' && <div class="
            w-full relative max-w-md mx-auto
            flex flex-col gap-1
            mx-4
            ">
            {notes.map((note, index) => {
              return <NoteListItem key={note.id} note={note} />
            })}
          </div>}
          {page === 'note' && <div>
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
  const [page, setPage, setSelectNoteId] = usePersistedStore(state => [state.page, state.setPage, state.setSelectNoteId]);
  return (
    // note list item card with gray border
    <div
      onClick={() => {
        setPage('note');
        setSelectNoteId(note.id);
      }}

      class="
      flex
      rounded-md
      border-[1px] border-gray-500
      h-20
    ">
      {note.title}
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
      console.error(`Could not set up window event listener.${ error.message }`)
    })

    return () => {
      if (removeListener) {
        removeListener()
      }
    }
  }, [callback, ...deps])
}
