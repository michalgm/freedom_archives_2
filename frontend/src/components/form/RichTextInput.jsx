import { Box, FormControl, FormHelperText, InputLabel } from "@mui/material";
import { Link } from "@tiptap/extension-link";
import { TextAlign } from "@tiptap/extension-text-align";
import { Underline } from "@tiptap/extension-underline";
import { StarterKit } from "@tiptap/starter-kit";
import { merge } from "lodash-es";
import {
  LinkBubbleMenu,
  LinkBubbleMenuHandler,
  MenuButtonAlignCenter,
  MenuButtonAlignLeft,
  MenuButtonAlignRight,
  MenuButtonBold,
  MenuButtonBulletedList,
  MenuButtonEditLink,
  MenuButtonHorizontalRule,
  MenuButtonItalic,
  MenuButtonOrderedList,
  MenuButtonUnderline,
  MenuControlsContainer,
  MenuDivider,
  MenuSelectHeading,
  RichTextEditor,
  RichTextReadOnly,
} from "mui-tiptap";
import { useEffect, useRef, useState } from "react";
import { parseError } from "src/components/form/schemaUtils";

const RichTextInput = (props) => {
  const {
    content = "",
    onChange,
    editable = true,
    disabled = false,
    required = false,
    label,
    error,
    helperText,
    color,
    focus = false,
    sx = {},
  } = props;
  const rteRef = useRef(null);
  const labelRef = useRef(null);
  const [labelWidth, setLabelWidth] = useState(0);
  useEffect(() => {
    if (labelRef.current) {
      setLabelWidth(labelRef.current.getBoundingClientRect().width);
    }
  }, [label]);
  const hasError = Boolean(error);

  const editor = rteRef.current?.editor;
  useEffect(() => {
    if (!editor || editor.isDestroyed) {
      return;
    }
    if (!editor.isFocused || !editor.isEditable) {
      // Use queueMicrotask per https://github.com/ueberdosis/tiptap/issues/3764#issuecomment-1546854730
      queueMicrotask(() => {
        const currentSelection = editor.state.selection;
        editor.chain().setContent(content).setTextSelection(currentSelection).run();
      });
    }
  }, [content, editor, editor?.isEditable, editor?.isFocused]);

  const extensions = [
    StarterKit,
    LinkBubbleMenuHandler,
    Link,
    Underline,
    TextAlign.configure({
      types: [
        "paragraph",
        "blockquote",
        "bulletList",
        "codeBlock",
        "doc",
        "hardBreak",
        "heading",
        "horizontalRule",
        "listItem",
        "orderedList",
      ],
    }),
  ];

  if (editable) {
    return (
      <FormControl
        fullWidth
        disabled={disabled}
        variant="outlined"
        size="small"
        margin="dense"
        required={required}
        error={Boolean(error)}
        sx={(theme) =>
          merge(
            label
              ? {
                  "&& .MuiTiptap-FieldContainer-notchedOutline": {
                    borderColor: error ? "error.main" : `${color}.main`,
                  },
                  "& .MuiTiptap-FieldContainer-root": {
                    backgroundColor: color ? `rgba(var(--mui-palette-${color}-lightChannel) / 0.1)` : undefined,
                    "&::before": {
                      content: '""',
                      position: "absolute",
                      top: "0px",
                      left: "8px",
                      right: 0,
                      height: "10px",
                      backgroundColor: "background.paper",
                      width: `${labelWidth + 12}px`,
                      zIndex: 5,
                      borderRadius: "0 0 2px 2px",
                      border: "none",
                      borderColor: "action.disabled",
                      borderTop: "none",
                      ...theme.applyStyles("dark", {
                        backgroundColor: "#2e2e2e",
                        border: "1px solid",
                      }),
                    },
                    "[data-theme='light'] &::before": {
                      border: "none",
                      backgroundColor: "white",
                    },
                  },
                }
              : {},
            sx
          )
        }
      >
        {label && (
          <InputLabel
            size="small"
            margin="dense"
            sx={{
              zIndex: 10,
            }}
            shrink
            color={color}
            variant="outlined"
            htmlFor={`${props.name}`}
            id={`${props.name}-label`}
          >
            <span ref={labelRef}>{label}</span>
          </InputLabel>
        )}
        <Box
          sx={{
            "&& .MuiTiptap-RichTextContent-root  a": {
              color: "secondary.main",
            },
            "&& .ProseMirror": {
              minHeight: props.minRows * 24,
              overflowY: "auto",
            },
          }}
        >
          <RichTextEditor
            ref={rteRef}
            extensions={extensions}
            content={content} // Initial content for the editor
            onUpdate={({ editor }) => {
              const content = editor.getHTML();
              onChange(content === "<p></p>" ? "" : content);
            }}
            onCreate={({ editor }) => {
              if (focus) {
                editor.commands.focus("end");
              }
            }}
            autofocus={focus ? "end" : false}
            editable={!disabled}
            editorProps={{
              attributes: {
                id: props.name,
                "aria-labelledby": `${props.name}-label`,
                class: "ProseMirror",
                tabindex: props?.inputProps?.tabIndex || 0,
              },
            }}
            renderControls={() =>
              !disabled && (
                <MenuControlsContainer>
                  <MenuSelectHeading />
                  <MenuDivider />
                  <MenuButtonBold />
                  <MenuButtonItalic />
                  <MenuButtonUnderline />
                  <MenuDivider />
                  <MenuButtonAlignLeft />
                  <MenuButtonAlignCenter />
                  <MenuButtonAlignRight />
                  <MenuDivider />
                  <MenuButtonEditLink />
                  <MenuDivider />
                  <MenuButtonBulletedList />
                  <MenuButtonOrderedList />
                  <MenuDivider />
                  <MenuButtonHorizontalRule />
                </MenuControlsContainer>
              )
            }
          >
            {() => (
              <>
                <LinkBubbleMenu />
              </>
            )}
          </RichTextEditor>
        </Box>
        {(helperText || (hasError && !disabled)) && (
          <FormHelperText id={props.name} error={hasError}>
            {hasError && !disabled ? parseError(name, label)(error) : helperText}
          </FormHelperText>
        )}
      </FormControl>
    );
  } else {
    return <RichTextReadOnly content={content} extensions={extensions} />;
  }
};
export default RichTextInput;
