import "./app.css";
import usePersistedStore, { NoteType } from "./stores/use-persisted-store";
import NotePage from "./components/note-page";
import HomePage from "./components/home-page";
import { SWRConfig } from "swr";

export function App<FC>() {
  const [
    page,
  ] = usePersistedStore(state => [
    state.page,
  ]);

  return (
    <>
      <SWRConfig value={{ provider: localStorageProvider }}>
        {page === 'home' && <HomePage />}
        {page === 'note' && <NotePage />}
      </SWRConfig>

    </>
  );
}

function localStorageProvider() {
  // When initializing, we restore the data from `localStorage` into a map.
  const map = new Map(JSON.parse(localStorage.getItem('app-cache') || '[]'))

  // Before unloading the app, we write back all the data into `localStorage`.
  window.addEventListener('beforeunload', () => {
    const appCache = JSON.stringify(Array.from(map.entries()))
    localStorage.setItem('app-cache', appCache)
  })

  // We still use the map for write & read for performance.
  return map
}
