'use client';

import React, { useState, useCallback } from 'react';
import { Box, Flex, Text, Input, IconButton, Tooltip } from '@chakra-ui/react';
import type { Value } from 'platejs';
import {
  BlockquotePlugin,
  BoldPlugin,
  CodePlugin,
  H1Plugin,
  H2Plugin,
  H3Plugin,
  ItalicPlugin,
  UnderlinePlugin,
  StrikethroughPlugin,
} from '@platejs/basic-nodes/react';
import {
  Plate,
  PlateContent,
  usePlateEditor,
  createPlatePlugin,
} from 'platejs/react';
import { Transforms, Editor as SlateEditor, Node, Path } from 'slate';
import { GiSpellBook, GiSave, GiScrollUnfurled } from 'react-icons/gi';
import { LuSave, LuRotateCcw, LuMaximize2, LuMinimize2 } from 'react-icons/lu';

import {
  H1Element,
  H2Element,
  H3Element,
  BlockquoteElement,
  ParagraphElement,
  BulletedListElement,
  NumberedListElement,
  ListItemElement,
  TodoElement,
  DividerElement,
  CodeBlockElement,
  CalloutElement,
  ImageElement,
  LinkElement,
  TableElement,
  TableRowElement,
  TableCellElement,
  TableHeaderCellElement,
} from './EditorElements';
import {
  BoldLeaf,
  ItalicLeaf,
  UnderlineLeaf,
  StrikethroughLeaf,
  CodeLeaf,
} from './EditorLeafs';
import { EditorToolbar } from './EditorToolbar';
import { SlashCommandMenu, useSlashCommand } from './SlashCommand';
import { FloatingToolbar } from './FloatingToolbar';

// Create custom plugins for elements not in @platejs/basic-nodes
const ParagraphPlugin = createPlatePlugin({
  key: 'p',
  node: { isElement: true, component: ParagraphElement },
});

const BulletedListPlugin = createPlatePlugin({
  key: 'ul',
  node: { isElement: true, component: BulletedListElement },
});

const NumberedListPlugin = createPlatePlugin({
  key: 'ol',
  node: { isElement: true, component: NumberedListElement },
});

const ListItemPlugin = createPlatePlugin({
  key: 'li',
  node: { isElement: true, component: ListItemElement },
});

const TodoPlugin = createPlatePlugin({
  key: 'todo',
  node: { isElement: true, component: TodoElement },
});

const DividerPlugin = createPlatePlugin({
  key: 'hr',
  node: { isElement: true, isVoid: true, component: DividerElement },
});

const CodeBlockPlugin = createPlatePlugin({
  key: 'code_block',
  node: { isElement: true, component: CodeBlockElement },
});

const CalloutPlugin = createPlatePlugin({
  key: 'callout',
  node: { isElement: true, component: CalloutElement },
});

const ImagePlugin = createPlatePlugin({
  key: 'img',
  node: { isElement: true, isVoid: true, component: ImageElement },
});

const LinkPlugin = createPlatePlugin({
  key: 'a',
  node: { isElement: true, isInline: true, component: LinkElement },
});

const TablePlugin = createPlatePlugin({
  key: 'table',
  node: { isElement: true, component: TableElement },
});

const TableRowPlugin = createPlatePlugin({
  key: 'tr',
  node: { isElement: true, component: TableRowElement },
});

const TableCellPlugin = createPlatePlugin({
  key: 'td',
  node: { isElement: true, component: TableCellElement },
});

const TableHeaderPlugin = createPlatePlugin({
  key: 'th',
  node: { isElement: true, component: TableHeaderCellElement },
});

// Initial value for new documents
const defaultInitialValue: Value = [
  {
    type: 'h1',
    children: [{ text: 'Untitled Document' }],
  },
  {
    type: 'p',
    children: [{ text: 'Start writing your adventure here... Type "/" for commands.' }],
  },
];

interface EditorProps {
  initialValue?: Value;
  storageKey?: string;
  onChange?: (value: Value) => void;
  readOnly?: boolean;
  showToolbar?: boolean;
  title?: string;
  onTitleChange?: (title: string) => void;
}

export function Editor({
  initialValue,
  storageKey = 'dm-editor-content',
  onChange,
  readOnly = false,
  showToolbar = true,
  title = '',
  onTitleChange,
}: EditorProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [documentTitle, setDocumentTitle] = useState(title);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  const editor = usePlateEditor({
    plugins: [
      // Text formatting (marks)
      BoldPlugin.withComponent(BoldLeaf),
      ItalicPlugin.withComponent(ItalicLeaf),
      UnderlinePlugin.withComponent(UnderlineLeaf),
      StrikethroughPlugin.withComponent(StrikethroughLeaf),
      CodePlugin.withComponent(CodeLeaf),
      // Block elements from @platejs/basic-nodes
      H1Plugin.withComponent(H1Element),
      H2Plugin.withComponent(H2Element),
      H3Plugin.withComponent(H3Element),
      BlockquotePlugin.withComponent(BlockquoteElement),
      // Custom block elements
      ParagraphPlugin,
      BulletedListPlugin,
      NumberedListPlugin,
      ListItemPlugin,
      TodoPlugin,
      DividerPlugin,
      CodeBlockPlugin,
      CalloutPlugin,
      ImagePlugin,
      LinkPlugin,
      TablePlugin,
      TableRowPlugin,
      TableCellPlugin,
      TableHeaderPlugin,
    ],
    value: () => {
      // Try to load from localStorage
      if (typeof window !== 'undefined' && storageKey) {
        const saved = localStorage.getItem(storageKey);
        if (saved) {
          try {
            return JSON.parse(saved);
          } catch {
            // Fall through to initial/default
          }
        }
      }
      return initialValue || defaultInitialValue;
    },
  });

  // Slash command hook
  const slashCommand = useSlashCommand(editor);

  // Handle value change
  const handleChange = useCallback(
    ({ value }: { value: Value }) => {
      // Auto-save to localStorage
      if (typeof window !== 'undefined' && storageKey) {
        localStorage.setItem(storageKey, JSON.stringify(value));
        setLastSaved(new Date());
      }
      // Call external onChange if provided
      onChange?.(value);
    },
    [storageKey, onChange]
  );

  // Handle title change
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDocumentTitle(e.target.value);
    onTitleChange?.(e.target.value);
  };

  // Reset to initial value
  const handleReset = () => {
    if (window.confirm('Reset document to initial state? This cannot be undone.')) {
      // Try new API first, then fallback
      if (editor.tf?.setValue) {
        editor.tf.setValue(initialValue || defaultInitialValue);
      } else {
        // Fallback: clear and set children directly
        (editor as any).children = initialValue || defaultInitialValue;
        (editor as any).onChange?.();
      }
      if (typeof window !== 'undefined' && storageKey) {
        localStorage.removeItem(storageKey);
      }
    }
  };

  // Toggle fullscreen
  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  // Check if cursor is inside a table
  const isInTable = useCallback((editor: any): { inTable: boolean; tablePath: number[] | null; rowPath: number[] | null; cellPath: number[] | null } => {
    const { selection } = editor;
    if (!selection) return { inTable: false, tablePath: null, rowPath: null, cellPath: null };
    
    try {
      const path = selection.anchor.path;
      
      // Walk up the path to find table, row, cell
      for (let i = 0; i < path.length; i++) {
        const ancestorPath = path.slice(0, i + 1);
        const node = Node.get(editor, ancestorPath) as any;
        
        if (node.type === 'table') {
          // Find row and cell paths
          let rowPath = null;
          let cellPath = null;
          
          for (let j = i + 1; j < path.length; j++) {
            const innerPath = path.slice(0, j + 1);
            const innerNode = Node.get(editor, innerPath) as any;
            if (innerNode.type === 'tr') {
              rowPath = innerPath;
            } else if (innerNode.type === 'td' || innerNode.type === 'th') {
              cellPath = innerPath;
            }
          }
          
          return { inTable: true, tablePath: ancestorPath, rowPath, cellPath };
        }
      }
    } catch {
      // Ignore errors
    }
    
    return { inTable: false, tablePath: null, rowPath: null, cellPath: null };
  }, []);

  // Check if a row is empty (all cells have no text)
  const isRowEmpty = useCallback((editor: any, rowPath: number[]): boolean => {
    try {
      const row = Node.get(editor, rowPath) as any;
      if (!row.children) return false;
      
      for (const cell of row.children) {
        const text = Node.string(cell);
        if (text.trim() !== '') return false;
      }
      return true;
    } catch {
      return false;
    }
  }, []);

  // Handle arrow down at end of document to create new paragraph
  const handleEditorKeyDown = useCallback((e: React.KeyboardEvent) => {
    // First handle slash commands
    slashCommand.handleKeyDown(e as any);
    
    const { selection } = editor;
    if (!selection) return;
    
    // Check if we're in a table
    const tableInfo = isInTable(editor);
    
    // Handle Shift+Enter in table - insert a line break within the cell
    if (e.key === 'Enter' && e.shiftKey && tableInfo.inTable) {
      e.preventDefault();
      
      try {
        // Insert a newline character at the current cursor position
        Transforms.insertText(editor as any, '\n');
      } catch (err) {
        console.warn('Shift+Enter in table failed:', err);
      }
      return;
    }
    
    // Handle Enter in table - always create a new row below current row
    if (e.key === 'Enter' && tableInfo.inTable && tableInfo.tablePath && tableInfo.rowPath && tableInfo.cellPath) {
      e.preventDefault();
      
      try {
        const table = Node.get(editor as any, tableInfo.tablePath) as any;
        const currentRowIndex = tableInfo.rowPath[tableInfo.rowPath.length - 1];
        const currentCellIndex = tableInfo.cellPath[tableInfo.cellPath.length - 1];
        const numCols = table.children[0]?.children?.length || 0;
        
        // Always create a new row below the current row
        const newRow = {
          type: 'tr',
          children: Array(numCols).fill(null).map(() => ({
            type: 'td',
            children: [{ text: '' }],
          })),
        };
        
        // Insert the new row right after the current row
        const insertPath = [...tableInfo.tablePath, currentRowIndex + 1];
        Transforms.insertNodes(editor as any, newRow as any, {
          at: insertPath,
        });
        
        // Move cursor to the same column in the new row
        Transforms.select(editor as any, {
          anchor: { path: [...insertPath, currentCellIndex, 0], offset: 0 },
          focus: { path: [...insertPath, currentCellIndex, 0], offset: 0 },
        });
      } catch (err) {
        console.warn('Enter in table failed:', err);
      }
      return;
    }
    
    // Handle Tab in table - move to next cell
    if (e.key === 'Tab' && tableInfo.inTable && tableInfo.tablePath && tableInfo.rowPath && tableInfo.cellPath) {
      e.preventDefault();
      
      try {
        const table = Node.get(editor as any, tableInfo.tablePath) as any;
        const currentRowIndex = tableInfo.rowPath[tableInfo.rowPath.length - 1];
        const currentCellIndex = tableInfo.cellPath[tableInfo.cellPath.length - 1];
        const numRows = table.children.length;
        const numCols = table.children[0]?.children?.length || 0;
        
        let nextRowIndex = currentRowIndex;
        let nextCellIndex = currentCellIndex;
        
        if (e.shiftKey) {
          // Shift+Tab - go to previous cell
          nextCellIndex--;
          if (nextCellIndex < 0) {
            nextCellIndex = numCols - 1;
            nextRowIndex--;
            if (nextRowIndex < 0) {
              // At the beginning, stay in first cell
              nextRowIndex = 0;
              nextCellIndex = 0;
            }
          }
        } else {
          // Tab - go to next cell
          nextCellIndex++;
          if (nextCellIndex >= numCols) {
            nextCellIndex = 0;
            nextRowIndex++;
            if (nextRowIndex >= numRows) {
              // At the end, create a new row
              const newRow = {
                type: 'tr',
                children: Array(numCols).fill(null).map(() => ({
                  type: 'td',
                  children: [{ text: '' }],
                })),
              };
              
              Transforms.insertNodes(editor as any, newRow as any, {
                at: [...tableInfo.tablePath, numRows],
              });
              nextRowIndex = numRows;
            }
          }
        }
        
        const nextPath = [...tableInfo.tablePath, nextRowIndex, nextCellIndex, 0];
        Transforms.select(editor as any, {
          anchor: { path: nextPath, offset: 0 },
          focus: { path: nextPath, offset: 0 },
        });
      } catch (err) {
        console.warn('Tab in table failed:', err);
      }
      return;
    }
    
    // Handle Backspace in table
    if (e.key === 'Backspace' && tableInfo.inTable && tableInfo.tablePath && tableInfo.rowPath && tableInfo.cellPath) {
      const { anchor } = selection;
      
      // Only handle if cursor is at the start of the cell
      if (anchor.offset === 0) {
        try {
          const table = Node.get(editor as any, tableInfo.tablePath) as any;
          const currentRowIndex = tableInfo.rowPath[tableInfo.rowPath.length - 1];
          const currentCellIndex = tableInfo.cellPath[tableInfo.cellPath.length - 1];
          const numRows = table.children.length;
          
          // If we're in an empty row (not the header row) and all cells are empty, delete the row
          if (currentRowIndex > 0 && isRowEmpty(editor, tableInfo.rowPath)) {
            e.preventDefault();
            
            // Move cursor to the row above first
            const prevRowPath = [...tableInfo.tablePath, currentRowIndex - 1, currentCellIndex, 0];
            
            // Remove the current row
            Transforms.removeNodes(editor as any, {
              at: tableInfo.rowPath,
            });
            
            // Move cursor to the cell above
            const prevCellText = Node.string(Node.get(editor as any, [...tableInfo.tablePath, currentRowIndex - 1, currentCellIndex]));
            Transforms.select(editor as any, {
              anchor: { path: prevRowPath, offset: prevCellText.length },
              focus: { path: prevRowPath, offset: prevCellText.length },
            });
            return;
          }
          
          // If we're at the first cell, first row (not header), cursor at start - move to row above
          if (currentCellIndex === 0 && currentRowIndex > 0) {
            e.preventDefault();
            const prevCellPath = [...tableInfo.tablePath, currentRowIndex - 1, table.children[currentRowIndex - 1].children.length - 1, 0];
            const prevCellText = Node.string(Node.get(editor as any, [...tableInfo.tablePath, currentRowIndex - 1, table.children[currentRowIndex - 1].children.length - 1]));
            Transforms.select(editor as any, {
              anchor: { path: prevCellPath, offset: prevCellText.length },
              focus: { path: prevCellPath, offset: prevCellText.length },
            });
            return;
          }
          
          // If we're at the first cell of header row - exit table upward
          if (currentCellIndex === 0 && currentRowIndex === 0) {
            e.preventDefault();
            // Check if there's a node above the table
            if (tableInfo.tablePath[0] > 0) {
              const prevNodePath = [tableInfo.tablePath[0] - 1];
              const prevNode = Node.get(editor as any, prevNodePath);
              const prevNodeText = Node.string(prevNode);
              Transforms.select(editor as any, SlateEditor.end(editor as any, prevNodePath));
            }
            return;
          }
          
          // Otherwise move to the previous cell
          if (currentCellIndex > 0) {
            e.preventDefault();
            const prevCellText = Node.string(Node.get(editor as any, [...tableInfo.tablePath, currentRowIndex, currentCellIndex - 1]));
            const prevCellPath = [...tableInfo.tablePath, currentRowIndex, currentCellIndex - 1, 0];
            Transforms.select(editor as any, {
              anchor: { path: prevCellPath, offset: prevCellText.length },
              focus: { path: prevCellPath, offset: prevCellText.length },
            });
            return;
          }
        } catch (err) {
          console.warn('Backspace in table failed:', err);
        }
      }
      return;
    }
    
    // Handle Delete in table - if at end of cell, don't merge with next cell
    if (e.key === 'Delete' && tableInfo.inTable && tableInfo.tablePath && tableInfo.cellPath) {
      try {
        const cell = Node.get(editor as any, tableInfo.cellPath);
        const cellText = Node.string(cell);
        const { anchor } = selection;
        
        // If cursor is at the end of the cell text, prevent default behavior
        if (anchor.offset >= cellText.length) {
          e.preventDefault();
          // Do nothing - don't merge cells
        }
      } catch {
        // Let default behavior happen
      }
      return;
    }
    
    // Handle arrow down at end of document
    if (e.key === 'ArrowDown') {
      const { selection } = editor;
      if (!selection) return;
      
      try {
        // Check if we're at the last node
        const lastNodeEntry = SlateEditor.last(editor as any, []);
        if (!lastNodeEntry) return;
        
        const [, lastPath] = lastNodeEntry;
        const lastBlockPath = lastPath.slice(0, 1);
        const currentPath = selection.anchor.path.slice(0, 1);
        
        // If we're in the last block
        if (Path.equals(lastBlockPath, currentPath)) {
          // Check if cursor is at the end
          const lastNode = Node.get(editor as any, lastBlockPath);
          const lastNodeText = Node.string(lastNode);
          const cursorOffset = selection.anchor.offset;
          
          // Get total text length considering nested structure
          let isAtEnd = false;
          if (SlateEditor.isEnd(editor as any, selection.anchor, lastBlockPath)) {
            isAtEnd = true;
          }
          
          if (isAtEnd) {
            e.preventDefault();
            // Insert a new paragraph at the end
            const newPath = [lastBlockPath[0] + 1];
            Transforms.insertNodes(
              editor as any,
              { type: 'p', children: [{ text: '' }] } as any,
              { at: newPath }
            );
            // Move cursor to the new paragraph
            Transforms.select(editor as any, {
              anchor: { path: [...newPath, 0], offset: 0 },
              focus: { path: [...newPath, 0], offset: 0 },
            });
          }
        }
      } catch (err) {
        // Silently fail - arrow key will work normally
      }
    }
  }, [editor, slashCommand, isInTable, isRowEmpty]);

  return (
    <Box
      position={isFullscreen ? 'fixed' : 'relative'}
      top={isFullscreen ? 0 : 'auto'}
      left={isFullscreen ? 0 : 'auto'}
      right={isFullscreen ? 0 : 'auto'}
      bottom={isFullscreen ? 0 : 'auto'}
      zIndex={isFullscreen ? 9999 : 'auto'}
      bg="dnd.ink"
      display="flex"
      flexDirection="column"
      flex="1"
      h={isFullscreen ? '100vh' : '100%'}
      w="100%"
    >
      {/* Header */}
      <Flex
        align="center"
        justify="space-between"
        p={4}
        borderBottomWidth="1px"
        borderColor="rgba(201, 162, 39, 0.3)"
        bg="dnd.leather"
      >
        <Flex align="center" gap={3} flex={1}>
          <GiSpellBook size={24} color="#C9A227" />
          <Input
            value={documentTitle}
            onChange={handleTitleChange}
            placeholder="Document title..."
            variant="unstyled"
            fontSize="xl"
            fontFamily="'Cinzel', serif"
            color="dnd.gold"
            fontWeight="bold"
            _placeholder={{ color: 'gray.500' }}
            maxW="400px"
          />
        </Flex>

        <Flex align="center" gap={2}>
          {lastSaved && (
            <Text fontSize="xs" color="gray.500">
              Saved {lastSaved.toLocaleTimeString()}
            </Text>
          )}
          <Tooltip label="Reset Document">
            <IconButton
              aria-label="Reset"
              icon={<LuRotateCcw size={16} />}
              size="sm"
              variant="ghost"
              color="dnd.parchment"
              _hover={{ bg: 'rgba(201, 162, 39, 0.15)', color: 'dnd.gold' }}
              onClick={handleReset}
            />
          </Tooltip>
          <Tooltip label={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}>
            <IconButton
              aria-label="Toggle Fullscreen"
              icon={isFullscreen ? <LuMinimize2 size={16} /> : <LuMaximize2 size={16} />}
              size="sm"
              variant="ghost"
              color="dnd.parchment"
              _hover={{ bg: 'rgba(201, 162, 39, 0.15)', color: 'dnd.gold' }}
              onClick={toggleFullscreen}
            />
          </Tooltip>
        </Flex>
      </Flex>

      {/* Toolbar */}
      {showToolbar && !readOnly && (
        <Box p={4} pb={0}>
          <EditorToolbar editor={editor} />
        </Box>
      )}

      {/* Editor Content */}
      <Box
        flex={1}
        overflow="auto"
        p={4}
        sx={{
          '&::-webkit-scrollbar': { width: '8px' },
          '&::-webkit-scrollbar-thumb': {
            bg: 'dnd.gold',
            borderRadius: '4px',
          },
          '&::-webkit-scrollbar-track': { bg: 'transparent' },
        }}
      >
        <Box
          maxW="100%"
          mx="auto"
          bg="dnd.parchmentDark"
          borderRadius="12px"
          borderWidth="2px"
          borderColor="dnd.leatherDark"
        //   boxShadow="0 0 30px rgba(0, 0, 0, 0.3), 0 0 15px rgba(201, 162, 39, 0.2)"
          minH="100%"
        >
          <Plate
            editor={editor}
            onChange={handleChange}
          >
            <PlateContent
              readOnly={readOnly}
              style={{
                padding: '2rem 3rem',
                minHeight: '100%',
                outline: 'none',
                color: '#1A0F0A',
                fontSize: '1rem',
                lineHeight: 1.75,
              }}
              placeholder="Start typing your adventure..."
              onKeyDown={handleEditorKeyDown}
            />

            {/* Floating toolbar for text selection */}
            <FloatingToolbar editor={editor} />

            {/* Slash command menu */}
            <SlashCommandMenu
              editor={editor}
              isOpen={slashCommand.isOpen}
              position={slashCommand.position}
              onClose={slashCommand.close}
              onSelect={slashCommand.selectCommand}
            />
          </Plate>
        </Box>
      </Box>

      {/* Footer */}
      <Flex
        align="center"
        justify="space-between"
        p={3}
        borderTopWidth="1px"
        borderColor="rgba(201, 162, 39, 0.3)"
        bg="dnd.leather"
      >
        <Flex align="center" gap={2}>
          <GiScrollUnfurled size={16} color="#C9A227" />
          <Text fontSize="xs" color="gray.500" fontFamily="'Cinzel', serif">
            DM Companion Editor
          </Text>
        </Flex>
        <Text fontSize="xs" color="gray.500">
          Type "/" for commands • Select text for formatting
        </Text>
      </Flex>
    </Box>
  );
}
