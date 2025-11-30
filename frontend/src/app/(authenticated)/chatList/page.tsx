"use client"

import {
  Box,
  Container,
  Heading,
  SkeletonText,
  Table,
  TableContainer,
  Tbody,
  Td,
  Th,
  Thead,
  Tr,
  Text,
} from "@chakra-ui/react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { GiScrollUnfurled } from "react-icons/gi"

import { ChatsService } from "../../../client"
import ActionsMenu from "../../../components/Common/ActionsMenu"
import ActionsOpenItem from "../../../components/Common/ActionsOpenItem"
import Navbar from "../../../components/Common/Navbar"
import AddItem from "../../../components/Items/AddItem"
import { PaginationFooter } from "../../../components/Common/PaginationFooter"

const PER_PAGE = 5

function getItemsQueryOptions({ page }: { page: number }) {
  return {
    queryFn: () =>
      ChatsService.readItems({ skip: (page - 1) * PER_PAGE, limit: PER_PAGE }),
    queryKey: ["items", { page }],
  }
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

  return (
    <>
      <TableContainer>
        <Table size={{ base: "sm", md: "md" }}>
          <Thead>
            <Tr>
              <Th 
                color="dnd.gold" 
                fontFamily="'Cinzel', serif"
                borderColor="dnd.gold"
                width="20%"
              >
                ID
              </Th>
              <Th 
                color="dnd.gold" 
                fontFamily="'Cinzel', serif"
                borderColor="dnd.gold"
                width="20%"
              >
                Title
              </Th>
              <Th 
                color="dnd.gold" 
                fontFamily="'Cinzel', serif"
                borderColor="dnd.gold"
                width="50%"
              >
                Description
              </Th>
              <Th 
                color="dnd.gold" 
                fontFamily="'Cinzel', serif"
                borderColor="dnd.gold"
                width="5%"
              >
                Open
              </Th>
              <Th 
                color="dnd.gold" 
                fontFamily="'Cinzel', serif"
                borderColor="dnd.gold"
                width="5%"
              >
                Actions
              </Th>
            </Tr>
          </Thead>
          {isPending ? (
            <Tbody>
              <Tr>
                {new Array(5).fill(null).map((_, index) => (
                  <Td key={index} borderColor="rgba(201, 162, 39, 0.3)">
                    <SkeletonText noOfLines={1} paddingBlock="16px" />
                  </Td>
                ))}
              </Tr>
            </Tbody>
          ) : (
            <Tbody>
              {items?.data.map((item) => (
                <Tr 
                  key={item.id} 
                  opacity={isPlaceholderData ? 0.5 : 1}
                  _hover={{ bg: "rgba(201, 162, 39, 0.1)" }}
                  transition="background 0.2s"
                >
                  <Td 
                    isTruncated 
                    maxWidth="150px"
                    color="dnd.parchment"
                    borderColor="rgba(201, 162, 39, 0.3)"
                  >
                    {item.id}
                  </Td>
                  <Td 
                    isTruncated 
                    maxWidth="150px"
                    color="dnd.parchment"
                    fontWeight="medium"
                    borderColor="rgba(201, 162, 39, 0.3)"
                  >
                    {item.title}
                  </Td>
                  <Td
                    color={!item.description ? "gray.500" : "dnd.parchment"}
                    isTruncated
                    maxWidth="150px"
                    borderColor="rgba(201, 162, 39, 0.3)"
                  >
                    {item.description || "N/A"}
                  </Td>
                  <Td borderColor="rgba(201, 162, 39, 0.3)">
                    <ActionsOpenItem id={item.id} disabled={isPlaceholderData} />
                  </Td>
                  <Td borderColor="rgba(201, 162, 39, 0.3)">
                    <ActionsMenu
                      type="Item"
                      value={item}
                      disabled={isPlaceholderData}
                    />
                  </Td>
                </Tr>
              ))}
            </Tbody>
          )}
        </Table>
      </TableContainer>
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
  return (
    <Container maxW="full" bg="dnd.ink" minH="100vh">
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
        <Text color="dnd.parchment" mt={2} opacity={0.8}>
          📜 Your chronicles of adventures past
        </Text>
      </Box>

      <Navbar type="Chat" addModalAs={AddItem} />
      <Box 
        bg="dnd.leather" 
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
