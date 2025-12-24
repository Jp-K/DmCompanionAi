"use client"

import {
  Box,
  Drawer,
  DrawerBody,
  DrawerCloseButton,
  DrawerContent,
  DrawerOverlay,
  Flex,
  IconButton,
  Text,
  useDisclosure,
} from "@chakra-ui/react"
import { useQueryClient } from "@tanstack/react-query"
import { FiLogOut, FiMenu } from "react-icons/fi"
import { GiDragonHead } from "react-icons/gi"

import type { UserPublic } from "../../client"
import useAuth from "../../hooks/useAuth"
import SidebarItems from "./SidebarItems"

const Sidebar = () => {
  const queryClient = useQueryClient()
  const currentUser = queryClient.getQueryData<UserPublic>(["currentUser"])
  const { isOpen, onOpen, onClose } = useDisclosure()
  const { logout } = useAuth()

  const handleLogout = async () => {
    logout()
  }

  return (
    <>
      {/* Mobile */}
      <IconButton
        onClick={onOpen}
        display={{ base: "flex", md: "none" }}
        aria-label="Open Menu"
        position="absolute"
        fontSize="20px"
        m={4}
        icon={<FiMenu />}
        bg="dnd.leather"
        color="dnd.gold"
        borderWidth="2px"
        borderColor="dnd.gold"
        _hover={{ bg: "dnd.gold", color: "dnd.leather" }}
      />
      <Drawer isOpen={isOpen} placement="left" onClose={onClose}>
        <DrawerOverlay bg="blackAlpha.800" />
        <DrawerContent 
          maxW="250px" 
          bg="dnd.leather"
          borderRightWidth="3px"
          borderColor="dnd.gold"
        >
          <DrawerCloseButton color="dnd.gold" />
          <DrawerBody py={8}>
            <Flex flexDir="column" justify="space-between" h="full">
              <Box>
                <Flex align="center" justify="center" p={4} mb={4}>
                  <GiDragonHead size={40} color="#C9A227" />
                  <Text 
                    fontFamily="'Cinzel', serif" 
                    fontSize="xl" 
                    color="dnd.gold" 
                    ml={2}
                    fontWeight="bold"
                  >
                    DM Companion
                  </Text>
                </Flex>
                <SidebarItems onClose={onClose} />
                <Flex
                  as="button"
                  onClick={handleLogout}
                  p={2}
                  mt={4}
                  color="dnd.crimson"
                  fontWeight="bold"
                  alignItems="center"
                  _hover={{ color: "#B22222" }}
                >
                  <FiLogOut />
                  <Text ml={2}>Log out</Text>
                </Flex>
              </Box>
              <Box mt="auto">
                {currentUser?.email && (
                  <Text color="dnd.parchment" noOfLines={2} fontSize="sm" p={2} opacity={0.8}>
                    ⚔️ {currentUser.email}
                  </Text>
                )}
                <Flex justify="center" mt={4}>
                  <a href="https://ko-fi.com/T6T81QVZLD" target="_blank" rel="noopener noreferrer">
                    <img 
                      height="36" 
                      style={{ border: 0, height: '36px' }} 
                      src="https://storage.ko-fi.com/cdn/kofi2.png?v=6" 
                      alt="Buy Me a Coffee at ko-fi.com" 
                    />
                  </a>
                </Flex>
              </Box>
            </Flex>
          </DrawerBody>
        </DrawerContent>
      </Drawer>

      {/* Desktop */}
      <Box
        bg="dnd.ink"
        p={3}
        h="100vh"
        position="sticky"
        top="0"
        display={{ base: "none", md: "flex" }}
      >
        <Flex
          flexDir="column"
          justify="space-between"
          bg="dnd.leather"
          p={4}
          borderRadius={12}
          borderWidth="2px"
          borderColor="dnd.gold"
          boxShadow="0 0 20px rgba(201, 162, 39, 0.3)"
        >
          <Box>
            <Flex align="center" justify="center" p={4} mb={4}>
              <GiDragonHead size={36} color="#C9A227" />
              <Text 
                fontFamily="'Cinzel', serif" 
                fontSize="lg" 
                color="dnd.gold" 
                ml={2}
                fontWeight="bold"
              >
                DM Companion
              </Text>
            </Flex>
            <SidebarItems />
          </Box>
          <Box mt="auto">
            {currentUser?.email && (
              <Text
                color="dnd.parchment"
                noOfLines={2}
                fontSize="sm"
                p={2}
                maxW="180px"
                opacity={0.8}
              >
                ⚔️ {currentUser.email}
              </Text>
            )}
            <Flex justify="center" mt={4}>
              <a href="https://ko-fi.com/T6T81QVZLD" target="_blank" rel="noopener noreferrer">
                <img 
                  height="36" 
                  style={{ border: 0, height: '36px' }} 
                  src="https://storage.ko-fi.com/cdn/kofi2.png?v=6" 
                  alt="Buy Me a Coffee at ko-fi.com" 
                />
              </a>
            </Flex>
          </Box>
        </Flex>
      </Box>
    </>
  )
}

export default Sidebar
