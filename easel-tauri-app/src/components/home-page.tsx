import { useState } from "preact/hooks";
import { invoke } from "@tauri-apps/api/tauri";
import { appWindow } from "@tauri-apps/api/window";
import React, { useEffect } from 'preact/compat'
import usePersistedStore, { baseUrl, NoteType } from "../stores/use-persisted-store";
import { DrawingPinFilledIcon, DrawingPinIcon, Pencil2Icon, TrashIcon } from "@radix-ui/react-icons";
import CommonButton from "./common-button";
import Layout from './layout';
import HeaderLayout from "./header-layout";
import useHotkey from "../utils/use-hotkey";
import useSWR from "swr";


const HomePage = () => {
  const [pining, setPining] = useState<boolean>(false)
  const toggleAlwaysOnTop = async () => {
    const isAlwaysOnTop = !pining;
    await invoke("set_always_on_top", {
      isAlwaysOnTop,
    });
    setPining(isAlwaysOnTop);
  };

  const [
    notes,
    addNote,
    page,
    setPage,
    selectedNoteId,
    getNoteContent,
    setNoteContent,
    createOrUpdateNotionPage,
    setSelectNoteId,
    setNotes,
  ] = usePersistedStore(state => [
    state.notes,
    state.addNote,
    state.page,
    state.setPage,
    state.selectedNoteId,
    state.getNoteContent,
    state.setNoteContent,
    state.createOrUpdateNotionPage,
    state.setSelectNoteId,
    state.setNotes,
  ]);

  const pinButton = (<CommonButton
    onClick={toggleAlwaysOnTop}
    variant="light"
    tabIndex={-1}
  >
    <div>
      {pining ? "unpin" : "pin"}
    </div>
    <div>
      {pining ? <DrawingPinFilledIcon /> : <DrawingPinIcon />}
    </div>
  </CommonButton>)

  const addNewNote = () => {
    // get current date in MM/DD/YYYY
    const date = new Date()
    const month = date.getMonth() + 1
    const day = date.getDate()
    const year = date.getFullYear()
    const dateStr = `${month}-${day}-${year}`
    const title = `Note ${dateStr}`
    const newNote = addNote({
      title,
      content: {
        type: 'doc',
        content: [
          {
            type: "heading",
            attrs: {
              level: 1,
            },
            content: [
              {
                type: "text",
                text: title,
              },
            ],
          }
        ],
      },
      createdAt: Date.now(),
      noteId: randomString(20),
      preview: "",
    });
    setSelectNoteId(newNote.noteId);
    setPage("note");
  };
  const header = (
    <div data-tauri-drag-region style={{
      // height: '10vh'
    }}>
      {page === 'home' && <div
        data-tauri-drag-region
        class="
              flex flex-row justify-end gap-2
              bg-white
              py-2 px-4
            ">

        {pinButton}
        <CommonButton
          onClick={addNewNote}
          variant="primary"
          tabIndex={-1}
        >
          Add note
        </CommonButton>
      </div>}


    </div>
  );

  useHotkey('AddNewNote', addNewNote)

  useSWR('/api/notes', () => fetch(`${baseUrl}/api/notes?lightData`)
    .then(res => res.json())
    .then(data => {
      if (data && data.length > 0) {
        setNotes(data)
      }
      // setNotes(data);
      return data
    })
  );

  return <Layout>
    <HeaderLayout>
      {header}
    </HeaderLayout>

    <div class="
              flex flex-col gap-1
              mx-4 mt-1
              ">
      {/* display notes in reverse order */}
      {notes.slice().reverse().map((note, index) => {
        return <NoteListItem key={note.noteId} note={note} />
      })}
    </div>
  </Layout>
}



// generate random string
function randomString(length: number) {
  const chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let result = '';
  for (let i = length; i > 0; --i) result += chars[Math.floor(Math.random() * chars.length)];
  return result;
}

const NoteListItem: React.FC<{ note: NoteType }> = ({ note }) => {
  const [
    page,
    setPage,
    setSelectNoteId,
    deleteNote,
  ] = usePersistedStore(state => [
    state.page,
    state.setPage,
    state.setSelectNoteId,
    state.deleteNote]);

  const selectNote = () => {
    setPage('note');
    setSelectNoteId(note.noteId);
  }
  return (
    // note list item card with gray border
    <div
      class="
        flex flex-col gap-1
        rounded-md
        border-[1px] border-brand2-300 px-3 py-2 max-h-24
      ">
      <div class="flex flex-row justify-between">
        <div class="flex flex-row items-center justify-center">
          <button class="bg-brand2-300 rounded-md text-xxs h-6 px-1 text-brand2-1100"
            onClick={selectNote}
          >
            {note.createdAt ? formatTimeAgo(note.createdAt) : "No date"}
          </button>
        </div>
        <div class="flex flex-row gap-2">
          <CommonButton
            variant="light"
            onClick={selectNote}
            tabIndex={-1}
          >

            <Pencil2Icon height={17} width={17} />
          </CommonButton>
          {/* delete button */}


          <div class='relative'>
            <CommonButton
              variant="light"
              tabIndex={-1}
              class="peer transition-all duration-200"
            >
              <TrashIcon height={17} width={17} />
            </CommonButton>
            {/* <button class="bg-sky-600 p-2 font-bold text-gray-100 rounded-md peer focus:bg-sky-400 focus:text-gray-200   ">Dropdown</button> */}
            <div class='w-36 right-9 -top-1 absolute z-10
		after:content-[""] after:inline-block after:absolute after:top-0 
    after:bg-white/40
		after:w-full after:h-full after:-z-20 after:blur-[2px] after:rounded-md
    peer-focus:opacity-100 peer-focus:visible 
    transition-all duration-300 invisible  opacity-0 
    '>
              {/* <ul class='flex flex-col gap-3'> */}
                <div class='flex flex-row justify-center items-center gap-1
                cursor-pointer bg-white shadow-md p-1  rounded-md text-sm text-brand-1100'>
                  <CommonButton variant="light" class="h-6">
                    Cancel
                  </CommonButton>
                  <CommonButton 
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      
                      deleteNote(note.noteId);
                    }}
                    variant="custom" 
                    class="h-6 bg-red-500 hover:opacity-90 text-white text-sm px-2 rounded-md">
                    Confirm
                  </CommonButton>
                </div>
              {/* </ul> */}
            </div>
          </div>


        </div>


      </div>
      <div class="text-sm font-medium">
        {note.title}
      </div>
      <div class="text-sm text-brand2-1100">
        {note.preview}
      </div>

    </div>
  )
}


type RemoveListenerBlock = any
export function useWindowEvent<Payload>(name: string, callback: (event: any) => void, deps: any[] = []): RemoveListenerBlock {
  return useEffect(() => {
    let removeListener: RemoveListenerBlock | undefined


    console.info('registering event listener')
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

const formatter = new Intl.RelativeTimeFormat(undefined, {
  numeric: 'auto'
})

function formatTimeAgo(dateUtcNumber: number) {
  // duration
  let duration = Date.now() - dateUtcNumber

  // get days ago 
  const daysAgo = Math.floor(duration / (1000 * 60 * 60 * 24))
  if (daysAgo >= 0 && daysAgo <= 7) {
    if (daysAgo === 0) {
      // get minutes or hours ago
      const minutesAgo = Math.floor(duration / (1000 * 60))
      if (minutesAgo < 60) {
        return formatter.format(-minutesAgo, 'minute')
      } else {
        const hoursAgo = Math.floor(duration / (1000 * 60 * 60))
        return formatter.format(-hoursAgo, 'hour')
      }
    } else {
      return formatter.format(-daysAgo, 'day')
    }
  }


  // convert date utc number into date string MM/DD/YYYY
  const date = new Date(dateUtcNumber)
  const month = date.getMonth() + 1
  const day = date.getDate()
  const year = date.getFullYear()
  return `${month}/${day}/${year}`
}

export default HomePage;