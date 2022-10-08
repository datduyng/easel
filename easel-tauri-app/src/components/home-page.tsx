import { useState } from "preact/hooks";
import { invoke } from "@tauri-apps/api/tauri";
import { appWindow } from "@tauri-apps/api/window";
import React, { useEffect } from 'preact/compat'
import usePersistedStore, { NoteType } from "../stores/use-persisted-store";
import { DrawingPinFilledIcon, DrawingPinIcon, Pencil2Icon, TrashIcon } from "@radix-ui/react-icons";
import CommonButton from "./common-button";
import Layout from './layout';
import HeaderLayout from "./header-layout";

let isPinned = false;
appWindow.listen('tauri://blur', () => {
  invoke('hide_window', {
    isPinned,
  });
})


const HomePage = () => {
  const [pining, setPining] = useState<boolean>(false)
  useEffect(() => {
    if (pining) {
      isPinned = true;
    } else {
      isPinned = false;
    }
  }, [pining])
  useWindowEvent('tauri://blur', async () => {
    console.log('pinning on blur', pining);
    // @ts-ignore
    if (!pining) {
      await invoke("hide_window")
    }
    return;
  }, [pining])

  const [
    notes,
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

  const pinButton = (<CommonButton
    onClick={() => {
      setPining(!pining)
    }}
    variant="light">

    <div>
      {pining ? "unpin" : "pin"}
    </div>
    <div>
      {pining ? <DrawingPinFilledIcon /> : <DrawingPinIcon />}
    </div>
  </CommonButton>)

  const header = (
    <div data-tauri-drag-region style={{
      height: '10vh'
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
          onClick={() => {
            addNote({
              title: "new note " + Date.now(),
              content: {
                type: 'doc',
                content: [],
              },
              createdAt: Date.now(),
              id: randomString(10),
              preview: "",
            })
          }}
          variant="primary">
          Add note
        </CommonButton>
      </div>}


    </div>
  );
  return <Layout>
    <HeaderLayout>
      {header}
    </HeaderLayout>

    <div class="
              flex flex-col gap-1
              mx-4 mt-1
              ">
      {notes.map((note, index) => {
        return <NoteListItem key={note.id} note={note} />
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
        flex flex-col gap-1
        rounded-md
        border-[1px] border-brand2-300 px-3 py-2 max-h-24
      ">
      <div class="flex flex-row justify-between">
        <div class="flex flex-row items-center justify-center">
          <button class="
            bg-brand2-300 rounded-md text-xxs h-6 px-1 text-brand2-1100">
            Today
          </button>
        </div>
        <div class="flex flex-row gap-2">
          <CommonButton
            variant="light"
            onClick={() => {
              setPage('note');
              setSelectNoteId(note.id);
            }}>

            <Pencil2Icon height={17} width={17} />
          </CommonButton>
          {/* delete button */}
          <CommonButton
            variant="light"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              deleteNote(note.id);
            }}>
            <TrashIcon height={17} width={17} />
          </CommonButton>
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


export default HomePage;