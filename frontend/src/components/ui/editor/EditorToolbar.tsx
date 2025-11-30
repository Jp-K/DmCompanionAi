'use client';

import React from 'react';
import { 
  Box, 
  Flex, 
  IconButton, 
  Divider,
  Tooltip,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Button,
} from '@chakra-ui/react';
import {
  FiBold,
  FiItalic,
  FiUnderline,
  FiCode,
  FiList,
  FiAlignLeft,
  FiAlignCenter,
  FiAlignRight,
  FiLink,
  FiImage,
  FiChevronDown,
} from 'react-icons/fi';
import {
  GiQuillInk,
  GiSpellBook,
} from 'react-icons/gi';
import {
  LuHeading1, 
  LuHeading2, 
  LuHeading3, 
  LuQuote,
  LuListOrdered,
  LuSquareCheck,
  LuMinus,
  LuHighlighter,
  LuStrikethrough,
  LuUndo2,
  LuRedo2,
} from 'react-icons/lu';interface ToolbarButtonProps {
  icon: React.ReactElement;
  label: string;
  isActive?: boolean;
  onClick: () => void;
}

function ToolbarButton({ icon, label, isActive, onClick }: ToolbarButtonProps) {
  return (
    <Tooltip label={label} placement="top" hasArrow>
      <IconButton
        aria-label={label}
        icon={icon}
        size="sm"
        variant="ghost"
        color={isActive ? 'dnd.gold' : 'dnd.parchment'}
        bg={isActive ? 'rgba(201, 162, 39, 0.2)' : 'transparent'}
        _hover={{
          bg: 'rgba(201, 162, 39, 0.15)',
          color: 'dnd.gold',
        }}
        onClick={onClick}
      />
    </Tooltip>
  );
}

interface EditorToolbarProps {
  editor: any;
}

export function EditorToolbar({ editor }: EditorToolbarProps) {
  const toggleMark = (mark: string) => {
    if (editor.tf?.toggle?.mark) {
      editor.tf.toggle.mark({ key: mark });
    } else {
      // Fallback for different Plate versions
      const isActive = isMarkActive(mark);
      if (isActive) {
        editor.removeMark(mark);
      } else {
        editor.addMark(mark, true);
      }
    }
  };

  const toggleBlock = (type: string) => {
    try {
      if (editor.tf?.toggle?.block) {
        editor.tf.toggle.block({ type });
      } else {
        // Fallback: use Slate transforms directly
        const { Transforms } = require('slate');
        Transforms.setNodes(editor, { type });
      }
    } catch (e) {
      console.warn('toggleBlock failed:', e);
    }
  };

  const isMarkActive = (mark: string): boolean => {
    try {
      // Try new API first
      if (editor.api?.mark?.isActive) {
        return editor.api.mark.isActive({ key: mark });
      }
      // Fallback: check marks in the current selection
      const marks = editor.getMarks?.();
      return marks ? !!marks[mark] : false;
    } catch {
      return false;
    }
  };

  const isBlockActive = (type: string): boolean => {
    try {
      if (editor.api?.block?.isActive) {
        return editor.api.block.isActive({ type });
      }
      return false;
    } catch {
      return false;
    }
  };

  const insertNodes = (node: any) => {
    try {
      if (editor.tf?.insert?.nodes) {
        editor.tf.insert.nodes(node);
      } else {
        // Fallback: use Slate transforms directly
        const { Transforms } = require('slate');
        Transforms.insertNodes(editor, node);
      }
    } catch (e) {
      console.warn('insertNodes failed:', e);
    }
  };

  return (
    <Box
      bg="dnd.leather"
      borderRadius="12px"
      borderWidth="2px"
      borderColor="dnd.gold"
      p={2}
      mb={4}
      boxShadow="0 0 15px rgba(201, 162, 39, 0.2)"
    >
      <Flex wrap="wrap" gap={1} align="center">
        {/* Undo/Redo */}
        <ToolbarButton
          icon={<LuUndo2 />}
          label="Undo (Ctrl+Z)"
          onClick={() => editor.undo()}
        />
        <ToolbarButton
          icon={<LuRedo2 />}
          label="Redo (Ctrl+Y)"
          onClick={() => editor.redo()}
        />

        <Divider orientation="vertical" h="24px" borderColor="dnd.gold" opacity={0.3} mx={1} />

        {/* Text Format */}
        <ToolbarButton
          icon={<FiBold />}
          label="Bold (Ctrl+B)"
          isActive={isMarkActive('bold')}
          onClick={() => toggleMark('bold')}
        />
        <ToolbarButton
          icon={<FiItalic />}
          label="Italic (Ctrl+I)"
          isActive={isMarkActive('italic')}
          onClick={() => toggleMark('italic')}
        />
        <ToolbarButton
          icon={<FiUnderline />}
          label="Underline (Ctrl+U)"
          isActive={isMarkActive('underline')}
          onClick={() => toggleMark('underline')}
        />
        <ToolbarButton
          icon={<LuStrikethrough />}
          label="Strikethrough"
          isActive={isMarkActive('strikethrough')}
          onClick={() => toggleMark('strikethrough')}
        />
        <ToolbarButton
          icon={<FiCode />}
          label="Inline Code"
          isActive={isMarkActive('code')}
          onClick={() => toggleMark('code')}
        />
        <ToolbarButton
          icon={<LuHighlighter />}
          label="Highlight"
          isActive={isMarkActive('highlight')}
          onClick={() => toggleMark('highlight')}
        />

        <Divider orientation="vertical" h="24px" borderColor="dnd.gold" opacity={0.3} mx={1} />

        {/* Headings Dropdown */}
        <Menu>
          <MenuButton
            as={Button}
            size="sm"
            variant="ghost"
            rightIcon={<FiChevronDown />}
            color="dnd.parchment"
            _hover={{ bg: 'rgba(201, 162, 39, 0.15)', color: 'dnd.gold' }}
            fontFamily="'Cinzel', serif"
            fontSize="xs"
          >
            Heading
          </MenuButton>
          <MenuList
            bg="dnd.leather"
            borderColor="dnd.gold"
            borderWidth="2px"
          >
            <MenuItem
              icon={<LuHeading1 />}
              onClick={() => toggleBlock('h1')}
              bg="transparent"
              color="dnd.parchment"
              _hover={{ bg: 'rgba(201, 162, 39, 0.2)', color: 'dnd.gold' }}
              fontFamily="'Cinzel', serif"
            >
              Heading 1
            </MenuItem>
            <MenuItem
              icon={<LuHeading2 />}
              onClick={() => toggleBlock('h2')}
              bg="transparent"
              color="dnd.parchment"
              _hover={{ bg: 'rgba(201, 162, 39, 0.2)', color: 'dnd.gold' }}
              fontFamily="'Cinzel', serif"
            >
              Heading 2
            </MenuItem>
            <MenuItem
              icon={<LuHeading3 />}
              onClick={() => toggleBlock('h3')}
              bg="transparent"
              color="dnd.parchment"
              _hover={{ bg: 'rgba(201, 162, 39, 0.2)', color: 'dnd.gold' }}
              fontFamily="'Cinzel', serif"
            >
              Heading 3
            </MenuItem>
          </MenuList>
        </Menu>

        <Divider orientation="vertical" h="24px" borderColor="dnd.gold" opacity={0.3} mx={1} />

        {/* Blocks */}
        <ToolbarButton
          icon={<LuQuote />}
          label="Blockquote"
          isActive={isBlockActive('blockquote')}
          onClick={() => toggleBlock('blockquote')}
        />
        <ToolbarButton
          icon={<FiList />}
          label="Bullet List"
          isActive={isBlockActive('ul')}
          onClick={() => toggleBlock('ul')}
        />
        <ToolbarButton
          icon={<LuListOrdered />}
          label="Numbered List"
          isActive={isBlockActive('ol')}
          onClick={() => toggleBlock('ol')}
        />
        <ToolbarButton
          icon={<LuSquareCheck />}
          label="Todo List"
          isActive={isBlockActive('todo')}
          onClick={() => toggleBlock('todo')}
        />
        <ToolbarButton
          icon={<LuMinus />}
          label="Divider"
          onClick={() => {
            insertNodes({
              type: 'hr',
              children: [{ text: '' }],
            });
          }}
        />

        <Divider orientation="vertical" h="24px" borderColor="dnd.gold" opacity={0.3} mx={1} />

        {/* Insert */}
        <ToolbarButton
          icon={<FiLink />}
          label="Insert Link"
          onClick={() => {
            const url = window.prompt('Enter URL:');
            if (url) {
              insertNodes({
                type: 'a',
                url,
                children: [{ text: url }],
              });
            }
          }}
        />
        <ToolbarButton
          icon={<FiImage />}
          label="Insert Image"
          onClick={() => {
            const url = window.prompt('Enter image URL:');
            if (url) {
              insertNodes({
                type: 'img',
                url,
                children: [{ text: '' }],
              });
            }
          }}
        />

        {/* Spacer */}
        <Box flex={1} />

        {/* Branding */}
        <Flex align="center" gap={2} color="dnd.gold" opacity={0.7}>
          <GiSpellBook />
          <Box fontSize="xs" fontFamily="'Cinzel', serif">
            DM Editor
          </Box>
        </Flex>
      </Flex>
    </Box>
  );
}
