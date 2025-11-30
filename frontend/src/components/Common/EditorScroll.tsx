'use client';

import React from 'react';
import { Box } from '@chakra-ui/react';
import { Editor } from '../ui/editor/Editor';

export default function EditorScroll() {
  return (
    <Box h="100%" w="100%" flex="1" display="flex" flexDirection="column">
      <Editor
        storageKey="dm-companion-notes"
        title="Campaign Notes"
        showToolbar={false}
      />
    </Box>
  );
}
