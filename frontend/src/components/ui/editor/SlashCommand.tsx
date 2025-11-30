'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Box, Flex, Text, VStack, Input } from '@chakra-ui/react';
import {
  LuHeading1,
  LuHeading2,
  LuHeading3,
  LuQuote,
  LuListOrdered,
  LuList,
  LuSquareCheck,
  LuCode,
  LuMinus,
  LuType,
  LuCircleAlert,
  LuImage,
  LuTable,
} from 'react-icons/lu';
import { GiScrollUnfurled, GiSpellBook } from 'react-icons/gi';

import { Transforms, Editor } from 'slate';

interface SlashCommandItem {
  id: string;
  icon: React.ReactElement;
  title: string;
  description: string;
  keywords: string[];
  action: (editor: any) => void;
}

const toggleBlock = (editor: any, type: string) => {
  try {
    if (editor.tf?.toggle?.block) {
      editor.tf.toggle.block({ type });
    } else {
      // @ts-ignore
      Transforms.setNodes(editor, { type });
    }
  } catch (e) {
    console.warn('toggleBlock failed:', e);
  }
};

const insertNodes = (editor: any, node: any) => {
  try {
    if (editor.tf?.insert?.nodes) {
      editor.tf.insert.nodes(node);
    } else {
      Transforms.insertNodes(editor, node);
    }
  } catch (e) {
    console.warn('insertNodes failed:', e);
  }
};

const slashCommands: SlashCommandItem[] = [
  {
    id: 'p',
    icon: <LuType size={18} />,
    title: 'Paragraph',
    description: 'Plain text paragraph',
    keywords: ['paragraph', 'text', 'plain'],
    action: (editor) => toggleBlock(editor, 'p'),
  },
  {
    id: 'h1',
    icon: <LuHeading1 size={18} />,
    title: 'Heading 1',
    description: 'Large section heading',
    keywords: ['heading', 'h1', 'title', 'large'],
    action: (editor) => toggleBlock(editor, 'h1'),
  },
  {
    id: 'h2',
    icon: <LuHeading2 size={18} />,
    title: 'Heading 2',
    description: 'Medium section heading',
    keywords: ['heading', 'h2', 'subtitle', 'medium'],
    action: (editor) => toggleBlock(editor, 'h2'),
  },
  {
    id: 'h3',
    icon: <LuHeading3 size={18} />,
    title: 'Heading 3',
    description: 'Small section heading',
    keywords: ['heading', 'h3', 'small'],
    action: (editor) => toggleBlock(editor, 'h3'),
  },
  {
    id: 'quote',
    icon: <LuQuote size={18} />,
    title: 'Quote',
    description: 'Capture a quote',
    keywords: ['quote', 'blockquote', 'citation'],
    action: (editor) => toggleBlock(editor, 'blockquote'),
  },
  {
    id: 'ul',
    icon: <LuList size={18} />,
    title: 'Bullet List',
    description: 'Create a simple bullet list',
    keywords: ['bullet', 'list', 'unordered', 'ul'],
    action: (editor) => insertNodes(editor, {
      type: 'ul',
      children: [
        { type: 'li', children: [{ text: '' }] },
      ],
    }),
  },
  {
    id: 'ol',
    icon: <LuListOrdered size={18} />,
    title: 'Numbered List',
    description: 'Create a numbered list',
    keywords: ['numbered', 'list', 'ordered', 'ol'],
    action: (editor) => insertNodes(editor, {
      type: 'ol',
      children: [
        { type: 'li', children: [{ text: '' }] },
      ],
    }),
  },
  {
    id: 'todo',
    icon: <LuSquareCheck size={18} />,
    title: 'To-do List',
    description: 'Track tasks with checkboxes',
    keywords: ['todo', 'task', 'checkbox', 'check'],
    action: (editor) => insertNodes(editor, {
      type: 'todo',
      checked: false,
      children: [{ text: '' }],
    }),
  },
  {
    id: 'code',
    icon: <LuCode size={18} />,
    title: 'Code Block',
    description: 'Add a code snippet',
    keywords: ['code', 'snippet', 'programming'],
    action: (editor) => toggleBlock(editor, 'code_block'),
  },
  {
    id: 'divider',
    icon: <LuMinus size={18} />,
    title: 'Divider',
    description: 'Visual separator between sections',
    keywords: ['divider', 'separator', 'hr', 'line'],
    action: (editor) => insertNodes(editor, {
      type: 'hr',
      children: [{ text: '' }],
    }),
  },
  {
    id: 'callout',
    icon: <LuCircleAlert size={18} />,
    title: 'Callout',
    description: 'Highlight important information',
    keywords: ['callout', 'alert', 'note', 'info'],
    action: (editor) => insertNodes(editor, {
      type: 'callout',
      variant: 'info',
      children: [{ text: 'Important note here...' }],
    }),
  },
  {
    id: 'image',
    icon: <LuImage size={18} />,
    title: 'Image',
    description: 'Upload or embed an image',
    keywords: ['image', 'picture', 'photo', 'img'],
    action: (editor) => {
      const url = window.prompt('Enter image URL:');
      if (url) {
        insertNodes(editor, {
          type: 'img',
          url,
          children: [{ text: '' }],
        });
      }
    },
  },
  {
    id: 'table',
    icon: <LuTable size={18} />,
    title: 'Table',
    description: 'Add a table',
    keywords: ['table', 'grid', 'data'],
    action: (editor) => insertNodes(editor, {
      type: 'table',
      children: [
        {
          type: 'tr',
          children: [
            { type: 'th', children: [{ text: 'Header 1' }] },
            { type: 'th', children: [{ text: 'Header 2' }] },
          ],
        },
        {
          type: 'tr',
          children: [
            { type: 'td', children: [{ text: 'Cell 1' }] },
            { type: 'td', children: [{ text: 'Cell 2' }] },
          ],
        },
      ],
    }),
  },
];

interface SlashCommandMenuProps {
  editor: any;
  isOpen: boolean;
  position: { top: number; left: number };
  onClose: () => void;
  onSelect: (command: SlashCommandItem) => void;
}

export function SlashCommandMenu({
  editor,
  isOpen,
  position,
  onClose,
  onSelect,
}: SlashCommandMenuProps) {
  const [search, setSearch] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const menuRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);

  const filteredCommands = slashCommands.filter((cmd) => {
    const searchLower = search.toLowerCase();
    return (
      cmd.title.toLowerCase().includes(searchLower) ||
      cmd.description.toLowerCase().includes(searchLower) ||
      cmd.keywords.some((k) => k.includes(searchLower))
    );
  });

  // Reset refs array when filtered commands change
  useEffect(() => {
    itemRefs.current = itemRefs.current.slice(0, filteredCommands.length);
  }, [filteredCommands.length]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [search]);

  useEffect(() => {
    if (!isOpen) {
      setSearch('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  // Scroll selected item into view
  useEffect(() => {
    const selectedItem = itemRefs.current[selectedIndex];
    if (selectedItem && listRef.current) {
      selectedItem.scrollIntoView({
        block: 'nearest',
        behavior: 'smooth',
      });
    }
  }, [selectedIndex]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!isOpen) return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex((prev) =>
            prev < filteredCommands.length - 1 ? prev + 1 : 0
          );
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex((prev) =>
            prev > 0 ? prev - 1 : filteredCommands.length - 1
          );
          break;
        case 'Enter':
          e.preventDefault();
          if (filteredCommands[selectedIndex]) {
            onSelect(filteredCommands[selectedIndex]);
          }
          break;
        case 'Escape':
          e.preventDefault();
          onClose();
          break;
      }
    },
    [isOpen, filteredCommands, selectedIndex, onSelect, onClose]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Prevent mouse down from stealing focus from editor
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
  };

  const handleItemClick = (cmd: SlashCommandItem) => {
    onSelect(cmd);
  };

  if (!isOpen) return null;

  return (
    <Box
      ref={menuRef}
      data-slash-menu
      position="fixed"
      top={`${position.top}px`}
      left={`${position.left}px`}
      zIndex={1000}
      bg="dnd.leather"
      borderRadius="12px"
      borderWidth="2px"
      borderColor="dnd.gold"
      boxShadow="0 0 30px rgba(0, 0, 0, 0.5), 0 0 15px rgba(201, 162, 39, 0.3)"
      maxH="400px"
      w="320px"
      overflow="hidden"
      onMouseDown={handleMouseDown}
    >
      {/* Header */}
      <Flex
        align="center"
        gap={2}
        p={3}
        borderBottomWidth="1px"
        borderColor="rgba(201, 162, 39, 0.3)"
      >
        <GiScrollUnfurled color="#C9A227" />
        <Text
          fontFamily="'Cinzel', serif"
          fontSize="sm"
          color="dnd.gold"
          fontWeight="bold"
        >
          Insert Block
        </Text>
      </Flex>

      {/* Search */}
      <Box p={2} borderBottomWidth="1px" borderColor="rgba(201, 162, 39, 0.3)">
        <Input
          placeholder="Search commands..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          size="sm"
          bg="dnd.ink"
          color="dnd.parchment"
          borderColor="dnd.gold"
          _placeholder={{ color: 'gray.500' }}
          _focus={{
            borderColor: 'dnd.goldLight',
            boxShadow: '0 0 5px rgba(201, 162, 39, 0.3)',
          }}
        />
      </Box>

      {/* Commands List */}
      <VStack
        ref={listRef}
        align="stretch"
        spacing={0}
        maxH="300px"
        overflowY="auto"
        sx={{
          '&::-webkit-scrollbar': { width: '6px' },
          '&::-webkit-scrollbar-thumb': {
            bg: 'dnd.gold',
            borderRadius: '3px',
          },
          '&::-webkit-scrollbar-track': { bg: 'transparent' },
        }}
      >
        {filteredCommands.length === 0 ? (
          <Box p={4} textAlign="center">
            <Text color="gray.500" fontSize="sm">
              No commands found
            </Text>
          </Box>
        ) : (
          filteredCommands.map((cmd, index) => (
            <Flex
              key={cmd.id}
              ref={(el) => { itemRefs.current[index] = el; }}
              align="center"
              gap={3}
              p={3}
              cursor="pointer"
              bg={index === selectedIndex ? 'rgba(201, 162, 39, 0.2)' : 'transparent'}
              _hover={{ bg: 'rgba(201, 162, 39, 0.15)' }}
              onClick={() => handleItemClick(cmd)}
              transition="background 0.15s"
            >
              <Box color="dnd.gold">{cmd.icon}</Box>
              <Box flex={1}>
                <Text
                  color="dnd.parchment"
                  fontSize="sm"
                  fontWeight="medium"
                  fontFamily="'Cinzel', serif"
                >
                  {cmd.title}
                </Text>
                <Text color="gray.500" fontSize="xs">
                  {cmd.description}
                </Text>
              </Box>
            </Flex>
          ))
        )}
      </VStack>

      {/* Footer hint */}
      <Flex
        p={2}
        borderTopWidth="1px"
        borderColor="rgba(201, 162, 39, 0.3)"
        justify="center"
        gap={4}
      >
        <Text fontSize="xs" color="gray.500">
          ↑↓ Navigate
        </Text>
        <Text fontSize="xs" color="gray.500">
          ↵ Select
        </Text>
        <Text fontSize="xs" color="gray.500">
          Esc Close
        </Text>
      </Flex>
    </Box>
  );
}

// Hook to handle slash command detection
export function useSlashCommand(editor: any) {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });

  const close = useCallback(() => {
    setIsOpen(false);
  }, []);

  // Close menu on Backspace, Delete, or when clicking outside
  useEffect(() => {
    if (!isOpen) return;

    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Backspace' || e.key === 'Delete') {
        close();
      }
    };

    const handleBlur = () => {
      // Small delay to allow click events to fire first
      setTimeout(() => {
        close();
      }, 150);
    };

    const handleClickOutside = (e: MouseEvent) => {
      // Close if clicking outside the menu
      const target = e.target as HTMLElement;
      if (!target.closest('[data-slash-menu]')) {
        close();
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    window.addEventListener('blur', handleBlur);
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      window.removeEventListener('keydown', handleGlobalKeyDown);
      window.removeEventListener('blur', handleBlur);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, close]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === '/' && !isOpen) {
        const selection = window.getSelection();
        if (selection && selection.rangeCount > 0) {
          const range = selection.getRangeAt(0);
          const rect = range.getBoundingClientRect();
          setPosition({
            top: rect.bottom + 8,
            left: rect.left,
          });
          setIsOpen(true);
        }
      }
    },
    [isOpen]
  );

  const selectCommand = useCallback(
    (command: SlashCommandItem) => {
      setIsOpen(false);
      editor.deleteBackward('character');
      command.action(editor);
    },
    [editor]
  );

  return {
    isOpen,
    position,
    handleKeyDown,
    close,
    selectCommand,
  };
}

export { slashCommands };
export type { SlashCommandItem };
