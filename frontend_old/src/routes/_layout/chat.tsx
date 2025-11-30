/** @jsxImportSource @emotion/react */
import { css } from '@emotion/react';
import {
  Container,
  Heading,
  Box,
  Button,
  Flex,
  Textarea,
  Text,
  VStack,
  useColorModeValue,
  SkeletonText
} from "@chakra-ui/react"
import { useQueryClient } from "@tanstack/react-query"
import { createFileRoute, useSearch } from "@tanstack/react-router"
import { useEffect, useState } from "react"
import { z } from "zod"
import { marked } from "marked"

import { ChatsService } from "../../client"

const itemsSearchSchema = z.object({
  page: z.number().catch(1),
})

marked.setOptions({
  gfm: true,
  breaks: true,
})

export const Route = createFileRoute("/_layout/chat")({
  component: Chat,
  validateSearch: (search) => itemsSearchSchema.parse(search),
})

const PER_PAGE = 5

function getItemsQueryOptions({ page }: { page: number }) {
  return {
    queryFn: () =>
      ChatsService.readItems({ skip: (page - 1) * PER_PAGE, limit: PER_PAGE }),
    queryKey: ["items", { page }],
  }
}

function sendMessageQueryOptions(payload: { message: string, id: string }) {
  return {
    queryFn: () =>
      ChatsService.sendMessage(payload),
    queryKey: ["chats", { payload }],
  }
}

const formatMessage = (text: string) => {
  const html = marked.parse(text).toString();
  return html.replace(/<table>/g, '<table class="custom-table">');
};

const tableStyles = css`
  .custom-table {
    width: 100%;
    border-collapse: collapse;
  }

  .custom-table th,
  .custom-table td {
    border: 1px solid #ddd;
    padding: 8px;
  }

  .custom-table th {
    text-align: left;
  }

  .message-content {
    word-wrap: break-word;
    overflow-wrap: break-word;
    border-collapse: collapse;
  }

  .message-content ul {
    list-style-type: none;
  }

  .message-content ol {
    list-style-type: none;
  }
`;

function Chat() {
  const [messages, setMessages] = useState<{ text: string; sender: "user" | "ai" }[]>([]);
  const [input, setInput] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [currentMessage, setCurrentMessage] = useState<string>("");
  const [id, setId] = useState<string>("");
  const search = useSearch({ from: "/_layout/chat" });

  useEffect(() => {
    setId(search.id);
  }, [search.id]);

  const handleSend = async (): Promise<void> => {
    if (input.trim()) {
      setLoading(true);
      setMessages([...messages, { text: input, sender: "user" }]);
      setInput("");
      const response = await sendMessageQueryOptions(
        {
          message: input,
          id: id,
        }
      ).queryFn();

      if (response.id) {
        setId(response.id);
      }

      if (response.message) {
        setMessages((prevMessages) => [
          ...prevMessages,
          { text: response.message, sender: "ai" },
        ]);
      }
      setLoading(false);
    }
  };

  const handleSendStreaming = async (): Promise<void> => {
    if (input.trim()) {
      setLoading(true);
      setMessages([...messages, { text: input, sender: "user" }]);
      setInput("");
      setCurrentMessage("");
      let currentMessageTemp = "";
      await ChatsService.sendMessageStreaming(
        {
          message: input,
          id: id,
        },
        (message) => {
          setCurrentMessage((prev) => message);
          currentMessageTemp = message;
        },
        () => {
          setMessages((prevMessages) => [
            ...prevMessages,
            { text: currentMessageTemp, sender: "ai" },
          ]);
          setLoading(false);
        }
      );
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendStreaming();
    } else if (e.key === 'Enter' && e.shiftKey) {
      e.preventDefault();
      setInput(input + '\n');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
  };

  const userBg = useColorModeValue("blue.100", "blue.700");
  const aiBg = useColorModeValue("gray.100", "gray.700");
  const borderColor = useColorModeValue("gray.200", "gray.600");

  return (
    <Flex direction="column" h="calc(100vh)" w={{ base: "100%" }} padding={4} css={tableStyles}>
      <VStack
        flex="1"
        spacing={4}
        overflowY="auto"
        p={4}
        border="1px solid"
        borderColor={borderColor}
        borderRadius="md"
      >
        {messages.map((message, index) => (
          // @ts-ignore
          <Box
            key={index}
            alignSelf={message.sender === "user" ? "flex-end" : "flex-start"}
            bg={message.sender === "user" ? userBg : aiBg}
            p={3}
            borderRadius="md"
            maxWidth="80%"
            whiteSpace="pre-wrap"
          >
            <Text className="message-content" dangerouslySetInnerHTML={{ __html: formatMessage(message.text) }} />
          </Box>
        ))}
        {loading && (
          <Box
            alignSelf="flex-start"
            bg={aiBg}
            p={3}
            borderRadius="md"
            maxWidth="80%"
            width={{ base: "100%", md: "80%" }}
            whiteSpace="pre-wrap"
          >
            <Text className="message-content" dangerouslySetInnerHTML={{ __html: formatMessage(currentMessage) }} />
            <SkeletonText noOfLines={3} gap={4} spacing={3}/> 
          </Box>
        )}
      </VStack>
      <Flex p={4} borderTop="1px solid" borderColor={borderColor}>
        <Textarea
          value={input}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder="Type your message..."
          resize="none"
          mr={2}
          rows={3}
        />
        <Button onClick={handleSend}>Send</Button>
      </Flex>
    </Flex>
  );
}

function Chats() {
  return (
    <Container maxW="full">
      <Heading size="lg" textAlign={{ base: "center", md: "left" }} pt={12}>
        DM Companion
      </Heading>
      <Chat />
    </Container>
  )
}
