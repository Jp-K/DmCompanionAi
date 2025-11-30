'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Box, Flex, IconButton, Tooltip, Portal } from '@chakra-ui/react';
import {
  FiBold,
  FiItalic,
  FiUnderline,
  FiCode,
  FiLink,
} from 'react-icons/fi';
import { LuStrikethrough, LuHighlighter } from 'react-icons/lu';

interface FloatingToolbarProps {
  editor: any;
}

export function FloatingToolbar({ editor }: FloatingToolbarProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const toolbarRef = useRef<HTMLDivElement>(null);

  const updatePosition = useCallback(() => {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed || selection.rangeCount === 0) {
      setIsVisible(false);
      return;
    }

    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    
    if (rect.width === 0) {
      setIsVisible(false);
      return;
    }

    const toolbarHeight = 40;
    setPosition({
      top: rect.top - toolbarHeight - 8 + window.scrollY,
      left: rect.left + rect.width / 2,
    });
    setIsVisible(true);
  }, []);

  useEffect(() => {
    document.addEventListener('selectionchange', updatePosition);
    return () => {
      document.removeEventListener('selectionchange', updatePosition);
    };
  }, [updatePosition]);

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

  if (!isVisible) return null;

  return (
    <Portal>
      <Box
        ref={toolbarRef}
        position="absolute"
        top={`${position.top}px`}
        left={`${position.left}px`}
        transform="translateX(-50%)"
        zIndex={1000}
        bg="dnd.leather"
        borderRadius="8px"
        borderWidth="2px"
        borderColor="dnd.gold"
        boxShadow="0 0 20px rgba(0, 0, 0, 0.4), 0 0 10px rgba(201, 162, 39, 0.3)"
        p={1}
      >
        <Flex gap={0.5}>
          <Tooltip label="Bold" placement="top" hasArrow>
            <IconButton
              aria-label="Bold"
              icon={<FiBold size={14} />}
              size="xs"
              variant="ghost"
              color={isMarkActive('bold') ? 'dnd.gold' : 'dnd.parchment'}
              bg={isMarkActive('bold') ? 'rgba(201, 162, 39, 0.2)' : 'transparent'}
              _hover={{ bg: 'rgba(201, 162, 39, 0.15)', color: 'dnd.gold' }}
              onClick={() => toggleMark('bold')}
            />
          </Tooltip>
          <Tooltip label="Italic" placement="top" hasArrow>
            <IconButton
              aria-label="Italic"
              icon={<FiItalic size={14} />}
              size="xs"
              variant="ghost"
              color={isMarkActive('italic') ? 'dnd.gold' : 'dnd.parchment'}
              bg={isMarkActive('italic') ? 'rgba(201, 162, 39, 0.2)' : 'transparent'}
              _hover={{ bg: 'rgba(201, 162, 39, 0.15)', color: 'dnd.gold' }}
              onClick={() => toggleMark('italic')}
            />
          </Tooltip>
          <Tooltip label="Underline" placement="top" hasArrow>
            <IconButton
              aria-label="Underline"
              icon={<FiUnderline size={14} />}
              size="xs"
              variant="ghost"
              color={isMarkActive('underline') ? 'dnd.gold' : 'dnd.parchment'}
              bg={isMarkActive('underline') ? 'rgba(201, 162, 39, 0.2)' : 'transparent'}
              _hover={{ bg: 'rgba(201, 162, 39, 0.15)', color: 'dnd.gold' }}
              onClick={() => toggleMark('underline')}
            />
          </Tooltip>
          <Tooltip label="Strikethrough" placement="top" hasArrow>
            <IconButton
              aria-label="Strikethrough"
              icon={<LuStrikethrough size={14} />}
              size="xs"
              variant="ghost"
              color={isMarkActive('strikethrough') ? 'dnd.gold' : 'dnd.parchment'}
              bg={isMarkActive('strikethrough') ? 'rgba(201, 162, 39, 0.2)' : 'transparent'}
              _hover={{ bg: 'rgba(201, 162, 39, 0.15)', color: 'dnd.gold' }}
              onClick={() => toggleMark('strikethrough')}
            />
          </Tooltip>
          <Tooltip label="Code" placement="top" hasArrow>
            <IconButton
              aria-label="Code"
              icon={<FiCode size={14} />}
              size="xs"
              variant="ghost"
              color={isMarkActive('code') ? 'dnd.gold' : 'dnd.parchment'}
              bg={isMarkActive('code') ? 'rgba(201, 162, 39, 0.2)' : 'transparent'}
              _hover={{ bg: 'rgba(201, 162, 39, 0.15)', color: 'dnd.gold' }}
              onClick={() => toggleMark('code')}
            />
          </Tooltip>
          <Tooltip label="Highlight" placement="top" hasArrow>
            <IconButton
              aria-label="Highlight"
              icon={<LuHighlighter size={14} />}
              size="xs"
              variant="ghost"
              color={isMarkActive('highlight') ? 'dnd.gold' : 'dnd.parchment'}
              bg={isMarkActive('highlight') ? 'rgba(201, 162, 39, 0.2)' : 'transparent'}
              _hover={{ bg: 'rgba(201, 162, 39, 0.15)', color: 'dnd.gold' }}
              onClick={() => toggleMark('highlight')}
            />
          </Tooltip>
          <Tooltip label="Link" placement="top" hasArrow>
            <IconButton
              aria-label="Link"
              icon={<FiLink size={14} />}
              size="xs"
              variant="ghost"
              color="dnd.parchment"
              _hover={{ bg: 'rgba(201, 162, 39, 0.15)', color: 'dnd.gold' }}
              onClick={() => {
                const url = window.prompt('Enter URL:');
                if (url) {
                  try {
                    if (editor.tf?.insert?.link) {
                      editor.tf.insert.link({ url });
                    } else {
                      const { Transforms } = require('slate');
                      Transforms.wrapNodes(editor, { type: 'a', url, children: [] }, { split: true });
                    }
                  } catch (e) {
                    console.warn('insert link failed:', e);
                  }
                }
              }}
            />
          </Tooltip>
        </Flex>
      </Box>
    </Portal>
  );
}
