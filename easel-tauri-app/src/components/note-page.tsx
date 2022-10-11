import TiptabEditor from "./tiptap-editor";
import useHotkey from "../utils/use-hotkey";
import Layout, { Hr } from "./layout";
import CommonButton from "./common-button";
import CommonKbd from "./common-kbd";
import { ArrowLeftIcon, ArrowRightIcon } from "@radix-ui/react-icons";
import FooterLayout from "./footer-layout";
import HeaderLayout from "./header-layout";
import usePersistedStore, { NoteType } from "../stores/use-persisted-store";
import { useState } from "preact/compat";

const NotePage = () => {

  const [
    notes,
    addNote,
    page,
    setPage,
    selectedNoteId,
    getNoteContent,
    setNoteContent,
    createOrUpdateNotionPage,
    selectPreviousNote,
    selectNextNote,
  ] = usePersistedStore(state => [
    state.notes,
    state.addNote,
    state.page,
    state.setPage,
    state.selectedNoteId,
    state.getNoteContent,
    state.setNoteContent,
    state.createOrUpdateNotionPage,
    state.selectPreviousNote,
    state.selectNextNote,
  ]);


  const saveToNotion = async () => {
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
      return true;
    }
  }

  useHotkey('MovePreviousNote', () => {
    selectPreviousNote();
  });

  useHotkey('MoveNextNote', () => {
    selectNextNote();
  });

  useHotkey('SaveToNotion', saveToNotion);

  const footer = (
    <>
      <Hr />

      <div data-tauri-drag-region class="flex flex-row items-center justify-center px-2">
        {/* Floating footer at the end of page */}
        <div class=" flex flex-row justify-between items-center self-center
        w-full
      ">
          <div>
            <CommonButton
              variant="light"
              onClick={selectPreviousNote}
            >
              <CommonKbd>⌘</CommonKbd>
              <CommonKbd>
                <ArrowLeftIcon />
              </CommonKbd>
            </CommonButton>
          </div>
          <div>
            <CommonButton
              variant="light"
              onClick={selectNextNote}>
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
  const [loadingNotion, setLoadingNotion] = useState<boolean>(false);


  return <Layout>
    <HeaderLayout>
      <div id='testing' data-tauri-drag-region
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
          <CommonKbd>Esc</CommonKbd>
        </CommonButton>

        <CommonButton
          variant="primary"
          onClick={saveToNotion}>
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
      </div>
    </HeaderLayout>
    <div class={`
        px-4 mt-1
        `}>
      <TiptabEditor saveToNotion={saveToNotion as any}/>
    </div>
    <FooterLayout>
      {footer}
    </FooterLayout>
  </Layout>

}


export default NotePage;