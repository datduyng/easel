import { useState } from "preact/hooks";
import { invoke } from "@tauri-apps/api/tauri";
import "./app.css";
import { appWindow } from "@tauri-apps/api/window";
import React, { useEffect } from 'preact/compat'
import usePersistedStore, { NoteType } from "./stores/use-persisted-store";
import TiptabEditor from "./components/tiptap-editor";
import { ArrowLeftIcon, ArrowRightIcon, DrawingPinFilledIcon, DrawingPinIcon, Pencil2Icon, TrashIcon } from "@radix-ui/react-icons";
import CommonButton from "./components/common-button";
import CommonKbd from "./components/common-kbd";


let isPinned = false;
appWindow.listen('tauri://blur', () => {
  // invoke('hide_window', {
  //   isPinned,
  // });
})

const Hr = () => {
  return <div class="bg-brand2-300 mx-2" style={{
    height: 1,
  }} />;
}

export function App<FC>() {
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
  console.log('pining', pining);

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
  const footer = (
    <>
      <Hr />

      <div data-tauri-drag-region class="flex flex-row items-center justify-center px-2" style={{
        height: '10vh',
      }}>
        {/* Floating footer at the end of page */}
        <div class=" flex flex-row justify-between items-center self-center
        w-full
      ">
          <div>
            <CommonButton
              variant="light">
              <CommonKbd>⌘</CommonKbd>
              <CommonKbd>
                <ArrowLeftIcon />
              </CommonKbd>
            </CommonButton>
          </div>
          <div>
            <CommonButton
              variant="light">
              <CommonKbd>⌘</CommonKbd>
              <CommonKbd>
                <ArrowRightIcon />
              </CommonKbd>
            </CommonButton>
          </div>
        </div>
      </div>
    </>

  )
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
              content: {},
              createdAt: Date.now(),
              id: randomString(10),
              preview: "",
            })
          }}
          variant="primary">
          Add note
        </CommonButton>
      </div>}

      {page === 'note' && <div data-tauri-drag-region
        class="
        flex flex-row justify-between gap-2
        p-2
      ">
        <CommonButton
          variant="light"
          onClick={() => {
            setPage('home')
          }}>
          Back
        </CommonButton>

        <CommonButton
          variant="primary"
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
              console.error("[notion] Syncing with notion error", e);
            } finally {
              setLoadingNotion(false);
            }
          }}>
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

        </CommonButton>
      </div>}
    </div>
  );

  return (
    <div className={'flex flex-col h-full'}>
      {header}
      <Hr />
      <div class="overflow-y-auto w-full relative max-w-md" style={{
        height: 'calc(100vh - 10vh - 10vh)'
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
            <TiptabEditor />
          </div>}
        </div>
      </div>
      {footer}
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
