"use client"
/** @jsxImportSource @emotion/react */

import { css } from "@emotion/react"
import {
  Container,
  Heading,
  Box,
  Button,
  Flex,
  Textarea,
  Text,
  VStack,
  Icon,
  SkeletonText,
  useColorModeValue,
} from "@chakra-ui/react"
import { useSearchParams } from "next/navigation"
import { useEffect, useState } from "react"
import { GiSpellBook, GiMagicSwirl, GiScrollUnfurled } from "react-icons/gi"

import { ChatsService } from "../../../client"

import EditorScroll from "../../../components/Common/EditorScroll"

 


const tableStyles = css`
  .custom-table {
    width: 100%;
    border-collapse: collapse;
    border: 1px solid #C9A227;
  }

  .custom-table th,
  .custom-table td {
    border: 1px solid #C9A227;
    padding: 8px;
    color: #F5E6D3;
  }

  .custom-table th {
    text-align: left;
    background: rgba(201, 162, 39, 0.2);
    color: #C9A227;
    font-family: 'Cinzel', serif;
  }

  .message-content {
    word-wrap: break-word;
    overflow-wrap: break-word;
    border-collapse: collapse;
  }

  .message-content ul {
    list-style-type: none;
    padding-left: 1rem;
  }

  .message-content ul li::before {
    content: "• ";
  }

  .message-content ol {
    list-style-type: none;
    counter-reset: item;
    padding-left: 1rem;
  }

  .message-content ol li::before {
    counter-increment: item;
    content: counter(item) ". ";
    color: #C9A227;
    font-weight: bold;
  }

  .message-content strong {
    color: #C9A227;
  }

  .message-content code {
    background: rgba(201, 162, 39, 0.2);
    padding: 2px 6px;
    border-radius: 4px;
    color: #E6C84A;
  }

  .message-content pre {
    background: #1A0F0A;
    border: 1px solid #C9A227;
    border-radius: 8px;
    padding: 1rem;
    overflow-x: auto;
  }

  .message-content a {
    color: #E6C84A;
    text-decoration: underline;
  }
`

function Scrolls() {
  const bgColor = useColorModeValue("dnd.ink", "#0d0d1a")
  const cardBg = useColorModeValue("dnd.leather", "rgba(26, 26, 46, 0.9)")

  return (
    <Flex
      direction="column"
      h="calc(100vh - 120px)"
      w="100%"
      px={4}
      pb={4}
      css={tableStyles}
      bg={bgColor}
    >
      <Box
        flex="1"
        display="flex"
        flexDirection="column"
        overflow="hidden"
        border="2px solid"
        borderColor="dnd.gold"
        borderRadius="12px"
        bg={cardBg}
        boxShadow="inset 0 0 20px rgba(0, 0, 0, 0.5)"
      >
        <EditorScroll />
      </Box>
    </Flex>
  )
}

export default function ChatPage() {
  const bgColor = useColorModeValue("dnd.ink", "#0d0d1a")
  const textColor = useColorModeValue("dnd.parchment", "dnd.parchment")

  return (
    <Container maxW="full" bg={bgColor} minH="100vh" p={0}>
      <Box py={6} px={4}>
        <Heading 
          size="lg" 
          textAlign={{ base: "center", md: "left" }}
          color="dnd.gold"
          fontFamily="'Cinzel', serif"
          display="flex"
          alignItems="center"
          gap={3}
        >
          <Icon as={GiScrollUnfurled} /> Scrolls
        </Heading>
        <Text color={textColor} mt={2} opacity={0.8}>
            Review your past adventures and conversations
        </Text>
      </Box>
      <Scrolls />
    </Container>
  )
}
