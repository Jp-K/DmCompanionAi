"use client"

import {
  Badge,
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
  Icon,
  useColorModeValue,
} from "@chakra-ui/react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { GiCrown, GiCrossedSwords } from "react-icons/gi"
import { FiCheck, FiX } from "react-icons/fi"

import { UsersService } from "../../../client"
import ActionsMenu from "../../../components/Common/ActionsMenu"
import Navbar from "../../../components/Common/Navbar"
import AddUser from "../../../components/Admin/AddUser"
import { PaginationFooter } from "../../../components/Common/PaginationFooter"

const PER_PAGE = 5

function getUsersQueryOptions({ page }: { page: number }) {
  return {
    queryFn: () =>
      UsersService.readUsers({ skip: (page - 1) * PER_PAGE, limit: PER_PAGE }),
    queryKey: ["users", { page }],
  }
}

function UsersTable() {
  const queryClient = useQueryClient()
  const searchParams = useSearchParams()
  const page = Number(searchParams.get("page")) || 1
  const textColor = useColorModeValue("dnd.parchment", "dnd.parchment")
  const hoverBg = useColorModeValue("rgba(201, 162, 39, 0.1)", "rgba(201, 162, 39, 0.1)")

  const setPage = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set("page", String(newPage))
    window.history.pushState(null, "", `?${params.toString()}`)
  }

  const {
    data: users,
    isPending,
    isPlaceholderData,
  } = useQuery({
    ...getUsersQueryOptions({ page }),
    placeholderData: (prevData) => prevData,
  })

  const hasNextPage = !isPlaceholderData && users?.data.length === PER_PAGE
  const hasPreviousPage = page > 1

  useEffect(() => {
    if (hasNextPage) {
      queryClient.prefetchQuery(getUsersQueryOptions({ page: page + 1 }))
    }
  }, [page, queryClient, hasNextPage])

  return (
    <>
      <TableContainer>
        <Table size={{ base: "sm", md: "md" }}>
          <Thead>
            <Tr>
              <Th color="dnd.gold" fontFamily="'Cinzel', serif" borderColor="dnd.gold" width="20%">
                Full Name
              </Th>
              <Th color="dnd.gold" fontFamily="'Cinzel', serif" borderColor="dnd.gold" width="50%">
                Email
              </Th>
              <Th color="dnd.gold" fontFamily="'Cinzel', serif" borderColor="dnd.gold" width="10%">
                Role
              </Th>
              <Th color="dnd.gold" fontFamily="'Cinzel', serif" borderColor="dnd.gold" width="10%">
                Status
              </Th>
              <Th color="dnd.gold" fontFamily="'Cinzel', serif" borderColor="dnd.gold" width="10%">
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
              {users?.data.map((user) => (
                <Tr 
                  key={user.id} 
                  opacity={isPlaceholderData ? 0.5 : 1}
                  _hover={{ bg: hoverBg }}
                  transition="background 0.2s"
                >
                  <Td
                    color={!user.full_name ? "gray.500" : textColor}
                    isTruncated
                    maxWidth="150px"
                    borderColor="rgba(201, 162, 39, 0.3)"
                  >
                    {user.full_name || "N/A"}
                  </Td>
                  <Td isTruncated maxWidth="150px" color={textColor} borderColor="rgba(201, 162, 39, 0.3)">
                    {user.email}
                  </Td>
                  <Td borderColor="rgba(201, 162, 39, 0.3)">
                    {user.is_superuser ? (
                      <Badge 
                        bg="rgba(201, 162, 39, 0.3)" 
                        color="dnd.gold"
                        fontFamily="'Cinzel', serif"
                        px={2}
                        py={1}
                        borderRadius="md"
                        display="flex"
                        alignItems="center"
                        gap={1}
                      >
                        <Icon as={GiCrown} /> Admin
                      </Badge>
                    ) : (
                      <Badge 
                        bg="rgba(74, 55, 40, 0.5)" 
                        color="dnd.parchment"
                        fontFamily="'Cinzel', serif"
                        px={2}
                        py={1}
                        borderRadius="md"
                        display="flex"
                        alignItems="center"
                        gap={1}
                      >
                        <Icon as={GiCrossedSwords} /> User
                      </Badge>
                    )}
                  </Td>
                  <Td borderColor="rgba(201, 162, 39, 0.3)">
                    {user.is_active ? (
                      <Badge 
                        bg="rgba(34, 139, 34, 0.3)" 
                        color="#90EE90"
                        fontFamily="'Cinzel', serif"
                        px={2}
                        py={1}
                        borderRadius="md"
                        display="flex"
                        alignItems="center"
                        gap={1}
                      >
                        <Icon as={FiCheck} /> Active
                      </Badge>
                    ) : (
                      <Badge 
                        bg="rgba(139, 0, 0, 0.3)" 
                        color="#FF6B6B"
                        fontFamily="'Cinzel', serif"
                        px={2}
                        py={1}
                        borderRadius="md"
                        display="flex"
                        alignItems="center"
                        gap={1}
                      >
                        <Icon as={FiX} /> Inactive
                      </Badge>
                    )}
                  </Td>
                  <Td borderColor="rgba(201, 162, 39, 0.3)">
                    <ActionsMenu
                      type="User"
                      value={user}
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

export default function AdminPage() {
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
          <Icon as={GiCrown} /> Guild Administration
        </Heading>
        <Text color={textColor} mt={2} opacity={0.8}>
          👑 Manage the realm's adventurers
        </Text>
      </Box>

      <Navbar type="User" addModalAs={AddUser} />
      <Box 
        bg={cardBg} 
        p={6} 
        borderRadius="12px" 
        borderWidth="2px" 
        borderColor="dnd.gold"
        boxShadow="0 0 20px rgba(201, 162, 39, 0.2)"
      >
        <UsersTable />
      </Box>
    </Container>
  )
}
