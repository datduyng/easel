
import "./app.css";
import usePersistedStore, { NoteType } from "./stores/use-persisted-store";
import NotePage from "./components/note-page";
import Layout from './components/layout';
import HomePage from "./components/home-page";



export function App<FC>() {
  const [
    page,
  ] = usePersistedStore(state => [
    state.page,
  ]);

  return (
    <>
      {page === 'home' && <HomePage />}
      {page === 'note' && <NotePage />}
    </>
  );
}
