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
import { marked } from "marked"
import { GiSpellBook, GiMagicSwirl, GiCrossedSwords, GiDragonHead } from "react-icons/gi"
import { FiSend } from "react-icons/fi"

import { ChatsService } from "../../../client"

marked.setOptions({
  gfm: true,
  breaks: true,
})

const formatMessage = (text: string) => {
  const html = marked.parse(text).toString()
  return html.replace(/<table>/g, '<table class="custom-table">')
}

function Chat() {
  const [messages, setMessages] = useState<
    { text: string; sender: "user" | "ai" }[]
  >([])
  const [input, setInput] = useState<string>("")
  const [loading, setLoading] = useState<boolean>(false)
  const [currentMessage, setCurrentMessage] = useState<string>("")
  const [id, setId] = useState<string | undefined>(undefined)
  const searchParams = useSearchParams()

  const bgColor = useColorModeValue("dnd.ink", "#0d0d1a")
  const cardBg = useColorModeValue("dnd.leather", "rgba(26, 26, 46, 0.9)")
  const textColor = useColorModeValue("dnd.parchment", "dnd.parchment")
  const userMsgBg = useColorModeValue("dnd.parchmentDark", "rgba(201, 162, 39, 0.15)")
  const userMsgBorder = useColorModeValue("dnd.ink", "dnd.gold")
  const userMsgText = useColorModeValue("dnd.ink", "dnd.parchment")
  const aiMsgBg = useColorModeValue("rgba(74, 55, 40, 0.7)", "rgba(20, 20, 30, 0.8)")
  const aiMsgBorder = useColorModeValue("dnd.gold", "rgba(201, 162, 39, 0.3)")
  const aiMsgText = useColorModeValue("dnd.parchment", "dnd.parchment")
  const inputBg = useColorModeValue("dnd.parchmentDark", "rgba(0, 0, 0, 0.3)")
  const inputBorder = useColorModeValue("dnd.gold", "rgba(201, 162, 39, 0.5)")
  const placeholderColor = useColorModeValue("dnd.ink", "gray.500")
  const emptyTextColor = useColorModeValue("dnd.parchment", "gray.400")

  // Dynamic CSS styles that adapt to theme
  const tableTextColor = useColorModeValue("#1A0F0A", "#F5E6D3")
  const strongColor = useColorModeValue("#8B0000", "#E6C84A")
  const codeColor = useColorModeValue("#8B4513", "#E6C84A")
  const preBg = useColorModeValue("rgba(201, 162, 39, 0.1)", "#1A0F0A")
  const linkColor = useColorModeValue("#8B4513", "#E6C84A")

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
      color: ${tableTextColor};
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
      color: ${strongColor};
    }

    .message-content code {
      background: rgba(201, 162, 39, 0.2);
      padding: 2px 6px;
      border-radius: 4px;
      color: ${codeColor};
    }

    .message-content pre {
      background: ${preBg};
      border: 1px solid #C9A227;
      border-radius: 8px;
      padding: 1rem;
      overflow-x: auto;
    }

    .message-content a {
      color: ${linkColor};
      text-decoration: underline;
    }
  `

  useEffect(() => {
    const chatId = searchParams.get("id")
    if (chatId) {
      setId(chatId)
      loadChatMessages(chatId)
    }
  }, [searchParams])

  const loadChatMessages = async (chatId: string) => {
    try {
      const response = await ChatsService.getChatMessages(chatId)
      if (response.messages && response.messages.length > 0) {
        const loadedMessages = response.messages.map((msg) => ({
          text: msg.content,
          sender: msg.role === "user" ? "user" as const : "ai" as const,
        }))
        setMessages(loadedMessages)
      }
    } catch (error) {
      console.error("Failed to load chat messages:", error)
    }
  }

  const handleSend = async (): Promise<void> => {
    if (input.trim()) {
      setLoading(true)
      setMessages([...messages, { text: input, sender: "user" }])
      setInput("")
      const response = await ChatsService.sendMessage({
        message: input,
        id: id,
      })

      if (response.id) {
        setId(response.id)
      }

      if (response.message) {
        setMessages((prevMessages) => [
          ...prevMessages,
          { text: response.message, sender: "ai" },
        ])
      }
      setLoading(false)
    }
  }

  const handleSendStreaming = async (): Promise<void> => {
    if (input.trim()) {
      setLoading(true)
      setMessages([...messages, { text: input, sender: "user" }])
      setInput("")
      setCurrentMessage("")
      let currentMessageTemp = ""
      await ChatsService.sendMessageStreaming(
        {
          message: input,
          id: id,
        },
        (message) => {
          setCurrentMessage(message)
          currentMessageTemp = message
        },
        (chatId) => {
          if (chatId) {
            setId(chatId)
          }
          setMessages((prevMessages) => [
            ...prevMessages,
            { text: currentMessageTemp, sender: "ai" },
          ])
          setLoading(false)
        }
      )
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendStreaming()
    } else if (e.key === "Enter" && e.shiftKey) {
      e.preventDefault()
      setInput(input + "\n")
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value)
  }

  return (
    <Flex
      direction="column"
      h="calc(100vh)"
      w={{ base: "100%" }}
      padding={4}
      css={tableStyles}
      bg={bgColor}
    >
      <VStack
        flex="1"
        spacing={4}
        overflowY="auto"
        p={4}
        border="2px solid"
        borderColor="dnd.gold"
        borderRadius="12px"
        bg={cardBg}
        boxShadow="inset 0 0 20px rgba(0, 0, 0, 0.5)"
      >
        {messages.length === 0 && !loading && (
          <Flex 
            direction="column" 
            align="center" 
            justify="center" 
            h="full" 
            opacity={0.7}
          >
            <Icon as={GiMagicSwirl} boxSize={16} color="dnd.gold" mb={4} />
            <Text color={emptyTextColor} fontFamily="'Cinzel', serif" fontSize="lg">
              Begin your quest...
            </Text>
            <Text color={emptyTextColor} fontSize="sm" mt={2}>
              Ask your DM Companion anything about your RPG adventures
            </Text>
          </Flex>
        )}
        {messages.map((message, index) => (
          <Box
            key={index}
            alignSelf={message.sender === "user" ? "flex-end" : "flex-start"}
            bg={message.sender === "user" ? userMsgBg : aiMsgBg}
            p={4}
            borderRadius="12px"
            maxWidth="80%"
            whiteSpace="pre-wrap"
            borderWidth="1px"
            borderColor={message.sender === "user" ? userMsgBorder : aiMsgBorder}
            boxShadow={message.sender === "user" ? "0 0 10px rgba(201, 162, 39, 0.5)" : "none"}
          >
            <Text
              fontSize="xs"
              color={message.sender === "user" ? userMsgText : aiMsgText}
              fontFamily="'Cinzel', serif"
              mb={2}
              fontWeight="bold"
              display="flex"
              alignItems="center"
              gap={1}
            >
              {message.sender === "user" ? (
                <><Icon as={GiCrossedSwords} /> Adventurer</>
              ) : (
                <><Icon as={GiDragonHead} /> DM Companion</>
              )}
            </Text>
            <Text
              className="message-content"
              fontFamily="'Cinzel', serif"
              color={message.sender === "user" ? userMsgText : aiMsgText}
              dangerouslySetInnerHTML={{ __html: formatMessage(message.text) }}
            />
          </Box>
        ))}
        {loading && (
          <Box
            alignSelf="flex-start"
            bg={aiMsgBg}
            p={4}
            borderRadius="12px"
            maxWidth="80%"
            width={{ base: "100%", md: "80%" }}
            whiteSpace="pre-wrap"
            borderWidth="1px"
            borderColor={aiMsgBorder}
          >
            <Text
              fontSize="xs"
              color={aiMsgText}
              fontFamily="'Cinzel', serif"
              mb={2}
              fontWeight="bold"
              display="flex"
              alignItems="center"
              gap={1}
            >
              <Icon as={GiDragonHead} /> DM Companion
            </Text>
            <Text
              className="message-content"
              color={aiMsgText}
              fontSize={"21px"}
              fontWeight={500}
              fontFamily="'Cinzel', serif"
              dangerouslySetInnerHTML={{
                __html: formatMessage(currentMessage),
              }}
            />
            <SkeletonText 
              noOfLines={3} 
              gap={4} 
              spacing={3} 
              startColor="dnd.leather" 
              endColor="dnd.parchment"
            />
          </Box>
        )}
      </VStack>
      <Flex 
        p={4} 
        borderTop="2px solid" 
        borderColor="dnd.gold"
        bg={cardBg}
        borderRadius="0 0 12px 12px"
        mt={4}
      >
        <Textarea
          value={input}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder="Speak, adventurer... (Shift+Enter for new line)"
          resize="none"
          mr={3}
          rows={3}
          bg={inputBg}
          color={textColor}
          borderColor={inputBorder}
          _placeholder={{ color: placeholderColor }}
          _focus={{ borderColor: "dnd.goldLight", boxShadow: "0 0 10px rgba(201, 162, 39, 0.3)" }}
          fontFamily="inherit"
        />
        <Button 
          onClick={handleSendStreaming}
          variant="primary"
          fontFamily="'Cinzel', serif"
          px={6}
          isLoading={loading}
          leftIcon={<Icon as={FiSend} />}
        >
          Send
        </Button>
      </Flex>
    </Flex>
  )
}

export default function ChatPage() {
  const bgColor = useColorModeValue("dnd.ink", "#0d0d1a")
  return (
    <Container maxW="full" bg={bgColor} minH="100vh" p={0}>
      <Chat />
    </Container>
  )
}
