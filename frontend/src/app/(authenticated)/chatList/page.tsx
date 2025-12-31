"use client"

import {
  Box,
  Container,
  Heading,
  SkeletonText,
  Text,
  VStack,
  HStack,
  Icon,
  Badge,
  Flex,
  useColorModeValue,
} from "@chakra-ui/react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { GiScrollUnfurled, GiSpeaker, GiQuillInk } from "react-icons/gi"

import { ChatsService } from "../../../client"
import ActionsMenu from "../../../components/Common/ActionsMenu"
import ActionsOpenItem from "../../../components/Common/ActionsOpenItem"
import Navbar from "../../../components/Common/Navbar"
import AddItem from "../../../components/Items/AddItem"
import { PaginationFooter } from "../../../components/Common/PaginationFooter"

const PER_PAGE = 10

function getItemsQueryOptions({ page }: { page: number }) {
  return {
    queryFn: () =>
      ChatsService.readItems({ skip: (page - 1) * PER_PAGE, limit: PER_PAGE }),
    queryKey: ["items", { page }],
  }
}

function ChatCard({ 
  item, 
  isPlaceholderData 
}: { 
  item: any; 
  isPlaceholderData: boolean 
}) {
  const cardBg = useColorModeValue("rgba(74, 55, 40, 0.5)", "rgba(26, 26, 46, 0.7)")
  const hoverBg = useColorModeValue("rgba(74, 55, 40, 0.7)", "rgba(26, 26, 46, 0.9)")
  const textColor = useColorModeValue("dnd.parchment", "dnd.parchment")
  const mutedColor = useColorModeValue("gray.400", "gray.500")

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString)
      const now = new Date()
      const diffMs = now.getTime() - date.getTime()
      const diffMins = Math.floor(diffMs / 60000)
      const diffHours = Math.floor(diffMs / 3600000)
      const diffDays = Math.floor(diffMs / 86400000)

      if (diffMins < 1) return "agora mesmo"
      if (diffMins < 60) return `há ${diffMins} minuto${diffMins > 1 ? "s" : ""}`
      if (diffHours < 24) return `há ${diffHours} hora${diffHours > 1 ? "s" : ""}`
      if (diffDays < 7) return `há ${diffDays} dia${diffDays > 1 ? "s" : ""}`
      
      return date.toLocaleDateString("pt-BR", { 
        day: "2-digit", 
        month: "short", 
        year: "numeric" 
      })
    } catch {
      return "Data desconhecida"
    }
  }

  return (
    <Box
      bg={cardBg}
      p={4}
      borderRadius="12px"
      borderWidth="1px"
      borderColor="rgba(201, 162, 39, 0.3)"
      opacity={isPlaceholderData ? 0.5 : 1}
      _hover={{ 
        bg: hoverBg, 
        borderColor: "dnd.gold",
        transform: "translateY(-2px)",
        boxShadow: "0 4px 12px rgba(201, 162, 39, 0.2)"
      }}
      transition="all 0.2s"
      cursor="pointer"
    >
      <Flex justify="space-between" align="flex-start">
        <VStack align="start" spacing={2} flex={1}>
          <HStack spacing={2}>
            <Icon as={GiQuillInk} color="dnd.gold" />
            <Text 
              color={textColor} 
              fontFamily="'Cinzel', serif" 
              fontWeight="bold"
              fontSize="lg"
              noOfLines={1}
            >
              {item.title || "Conversa sem título"}
            </Text>
          </HStack>
          
          {item.description && (
            <Text 
              color={mutedColor} 
              fontSize="sm" 
              noOfLines={2}
              pl={6}
            >
              {item.description}
            </Text>
          )}
          
          <HStack spacing={3} pl={6}>
            <Badge 
              colorScheme="yellow" 
              variant="subtle"
              fontSize="xs"
              borderRadius="full"
            >
              🕐 {item.created_at ? formatDate(item.created_at) : "Recente"}
            </Badge>
          </HStack>
        </VStack>
        
        <HStack spacing={2}>
          <ActionsOpenItem id={item.id} disabled={isPlaceholderData} />
          <ActionsMenu
            type="Item"
            value={item}
            disabled={isPlaceholderData}
          />
        </HStack>
      </Flex>
    </Box>
  )
}

function ItemsTable() {
  const queryClient = useQueryClient()
  const searchParams = useSearchParams()
  const page = Number(searchParams.get("page")) || 1
  
  const setPage = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set("page", String(newPage))
    window.history.pushState(null, "", `?${params.toString()}`)
  }

  const {
    data: items,
    isPending,
    isPlaceholderData,
  } = useQuery({
    ...getItemsQueryOptions({ page }),
    placeholderData: (prevData) => prevData,
  })

  const hasNextPage = !isPlaceholderData && items?.data.length === PER_PAGE
  const hasPreviousPage = page > 1

  useEffect(() => {
    if (hasNextPage) {
      queryClient.prefetchQuery(getItemsQueryOptions({ page: page + 1 }))
    }
  }, [page, queryClient, hasNextPage])

  const emptyBg = useColorModeValue("rgba(74, 55, 40, 0.3)", "rgba(26, 26, 46, 0.5)")
  const textColor = useColorModeValue("dnd.parchment", "dnd.parchment")

  return (
    <>
      <VStack spacing={3} align="stretch">
        {isPending ? (
          <>
            {new Array(3).fill(null).map((_, index) => (
              <Box 
                key={index} 
                p={4} 
                borderRadius="12px" 
                borderWidth="1px"
                borderColor="rgba(201, 162, 39, 0.2)"
              >
                <SkeletonText noOfLines={2} spacing={3} />
              </Box>
            ))}
          </>
        ) : items?.data.length === 0 ? (
          <Box 
            bg={emptyBg}
            p={8} 
            borderRadius="12px" 
            textAlign="center"
            borderWidth="1px"
            borderColor="rgba(201, 162, 39, 0.2)"
          >
            <Icon as={GiSpeaker} fontSize="48px" color="gray.500" mb={4} />
            <Text color={textColor} fontFamily="'Cinzel', serif">
              Nenhuma conversa encontrada
            </Text>
            <Text color="gray.500" fontSize="sm" mt={2}>
              Inicie uma nova conversa com o DM Companion
            </Text>
          </Box>
        ) : (
          items?.data.map((item) => (
            <ChatCard 
              key={item.id} 
              item={item} 
              isPlaceholderData={isPlaceholderData} 
            />
          ))
        )}
      </VStack>
      <PaginationFooter
        page={page}
        onChangePage={setPage}
        hasNextPage={hasNextPage}
        hasPreviousPage={hasPreviousPage}
      />
    </>
  )
}

export default function ChatListPage() {
  const bgColor = useColorModeValue("dnd.ink", "#0d0d1a")
  const cardBg = useColorModeValue("dnd.leather", "rgba(26, 26, 46, 0.9)")
  const textColor = useColorModeValue("dnd.parchment", "dnd.parchment")

  return (
    <Container maxW="full" bg={bgColor} minH="100vh">
      <Box py={12}>
        <Heading 
          size="lg" 
          textAlign={{ base: "center", md: "left" }}
          color="dnd.gold"
          fontFamily="'Cinzel', serif"
          display="flex"
          alignItems="center"
          gap={3}
        >
          <GiScrollUnfurled /> Chat History
        </Heading>
        <Text color={textColor} mt={2} opacity={0.8}>
          📜 Your chronicles of adventures past
        </Text>
      </Box>

      {/* <Navbar type="Chat" addModalAs={AddItem} /> */}
      <Box 
        bg={cardBg} 
        p={6} 
        borderRadius="12px" 
        borderWidth="2px" 
        borderColor="dnd.gold"
        boxShadow="0 0 20px rgba(201, 162, 39, 0.2)"
      >
        <ItemsTable />
      </Box>
    </Container>
  )
}
