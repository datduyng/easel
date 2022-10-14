import { Extension } from "@tiptap/core";
import { Editor, Range, ReactRenderer } from "@tiptap/react";
import Suggestion, { SuggestionOptions } from "@tiptap/suggestion";
import { Node as ProseMirrorNode } from "prosemirror-model";
import tippy, { Instance } from "tippy.js";
import { CommandsList } from "./command-list";
import {
  IconCode,
  IconHeading,
  IconLetterA,
  IconList,
  IconListNumbers,
  IconQuote,
} from "@tabler/icons";

export type CommandsOption = {
  HTMLAttributes?: Record<string, any>;
  renderLabel?: (props: {
    options: CommandsOption;
    node: ProseMirrorNode;
  }) => string;
  suggestion: Omit<SuggestionOptions, "editor">;
};

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    customExtension: {
      toggleBold: () => ReturnType;
      toggleItalic: () => ReturnType;
      toggleOrderedList: () => ReturnType;
      toggleBulletList: () => ReturnType;
      toggleBlockquote: () => ReturnType;
    };
  }
}

export const Commands = Extension.create<CommandsOption>({
  name: "slash-commands",
  addOptions() {
    return {
      suggestion: {
        char: "/",
        startOfLine: true,
        command: ({ editor, range, props }) => {
          props.command({ editor, range });
        },
        allow({ editor, range }) {

          // get parent node of the current cursor or range
          const parent = editor.state.doc.resolve(range.from).parent;
          console.log('parent', parent);
          if (parent
            && parent.type.name === 'codeBlock') {
            return false;
          }

          return true;
        }
      },
    };
  },
  addProseMirrorPlugins() {
    return [
      Suggestion({
        editor: this.editor,
        ...this.options.suggestion,
      }),
    ];
  },
});

const commands = [
  {
    title: "Task List",
    description: "Create a task list",
    icon: <IconCode size={16} />,
    command: ({ editor, range }: { editor: Editor; range: Range }) => {
      editor.chain().focus().deleteRange(range).toggleTaskList().run();
    },
  },
  {
    title: "Code Block",
    description: "Create a code block",
    icon: <IconCode size={16} />,
    command: ({ editor, range }: { editor: Editor; range: Range }) => {
      editor.chain().focus().deleteRange(range).toggleCodeBlock().run();
    },
  },
];

// const fuse = new Fuse(commands, { keys: ["title", "description", "shortcut"] });

export const SlashCommands = Commands.configure({
  suggestion: {
    items: ({ query }) => {
      return query ?
        // filter commands simple filter
        commands.filter((command) => {
          return (
            command.title.toLowerCase().includes(query.toLowerCase()) ||
            command.description?.toLowerCase().includes(query.toLowerCase()));
        }) : commands;
    },
    render: () => {
      let component: ReactRenderer;
      let popup: Instance<any>[];

      return {
        onStart(props) {
          component = new ReactRenderer(CommandsList as any, {
            editor: props.editor as Editor,
            props,
          });

          popup = tippy("body", {
            getReferenceClientRect: props.clientRect as any,
            appendTo: () => document.body,
            content: component.element,
            showOnCreate: true,
            interactive: true,
            trigger: "manual",
            placement: "bottom-start",
          });
        },
        onUpdate(props) {
          component.updateProps(props);
          popup[0].setProps({
            getReferenceClientRect: props.clientRect,
          });
        },
        onKeyDown(props) {
          if (props.event.key === "Escape") {
            popup[0].hide();
            return true;
          }
          if (
            [
              "Space",
              "ArrowUp",
              "ArrowDown",
              "ArrowLeft",
              "ArrowRight",
            ].indexOf(props.event.key) > -1
          ) {
            props.event.preventDefault();
          }
          return (component.ref as any).onKeyDown(props);
        },
        onExit() {
          popup[0].destroy();
          component.destroy();
        },
      };
    },
  },
});