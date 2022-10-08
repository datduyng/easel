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
  | 'Esc';

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