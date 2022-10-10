import { useHotkeys as _useHotkeys } from "react-hotkeys-hook";
import { HotkeysEvent } from "hotkeys-js";
export interface HotkeyBindingData {
  hotkey: string;
  label?: string[];
  handler?: (k?: KeyboardEvent) => void;
}

export type OMSHotkey =
  | "MoveNextNote"
  | "MovePreviousNote"
  | 'Esc'
  | 'FocusNoteEditor'
  | 'SaveToNotion';

// check https://www.toptal.com/developers/keycode/for/tab
export const HotkeyBindings: { [hotkey in OMSHotkey]: HotkeyBindingData } = {
  MovePreviousNote: {
    hotkey: "Command+left",
  },
  MoveNextNote: {
    hotkey: "Command+right",
  },
  Esc: {
    hotkey: "Escape",
  },
  FocusNoteEditor: {
    hotkey: "Tab",
  },
  SaveToNotion: {
    hotkey: "Command+s",
  },
};

export const OMSHotKeys = Object.keys(HotkeyBindings);

export default function useHotkey(
  hotkey: OMSHotkey,
  handler?: (k?: KeyboardEvent, h?: HotkeysEvent) => void
) {
  return _useHotkeys(
    HotkeyBindings[hotkey].hotkey,
    (keyboardEvent, hotkeyEvent) => {
      if (handler) {
        keyboardEvent.preventDefault();
        handler(keyboardEvent, hotkeyEvent);
      } else {
        throw new Error(`No registered handler for hotkey ${hotkey}`);
      }
    },
    {
      keydown: true,
      enableOnTags: ["INPUT", "TEXTAREA", "SELECT"],
    },
    [hotkey, handler]
  );
}