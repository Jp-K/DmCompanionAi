"use client"

import { Box, Flex, Icon, Text } from "@chakra-ui/react"
import { useQueryClient } from "@tanstack/react-query"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { FiHome, FiSettings, FiUsers, FiMessageCircle, FiInbox } from "react-icons/fi"
import { GiCrossedSwords, GiSpellBook, GiScrollUnfurled, GiCog, GiCrown, GiBookmarklet } from "react-icons/gi"

import type { UserPublic } from "../../client"

const items = [
  { icon: GiCrossedSwords, title: "Dashboard", path: "/dashboard" },
  { icon: GiSpellBook, title: "Chat", path: "/chat" },
  { icon: GiScrollUnfurled, title: "History", path: "/chatList" },
  { icon: GiBookmarklet, title: "Knowledge", path: "/knowledge" },
  { icon: GiScrollUnfurled, title: "Scrolls", path: "/scrolls" },
  { icon: GiCog, title: "User Settings", path: "/settings" },
]

interface SidebarItemsProps {
  onClose?: () => void
}

const SidebarItems = ({ onClose }: SidebarItemsProps) => {
  const queryClient = useQueryClient()
  const currentUser = queryClient.getQueryData<UserPublic>(["currentUser"])
  const pathname = usePathname()

  const finalItems = currentUser?.is_superuser
    ? [...items, { icon: GiCrown, title: "Admin", path: "/admin" }]
    : items

  const listItems = finalItems.map(({ icon, title, path }) => {
    const isActive = pathname === path
    return (
      <Flex
        as={Link}
        href={path}
        w="100%"
        p={2}
        px={3}
        my={1}
        key={title}
        bg={isActive ? "rgba(201, 162, 39, 0.2)" : "transparent"}
        borderRadius="8px"
        borderLeftWidth={isActive ? "3px" : "0"}
        borderColor="dnd.gold"
        color={isActive ? "dnd.gold" : "dnd.parchment"}
        fontFamily="'Cinzel', serif"
        fontWeight={isActive ? "bold" : "medium"}
        onClick={onClose}
        transition="all 0.2s"
        _hover={{
          bg: "rgba(201, 162, 39, 0.15)",
          color: "dnd.gold",
          transform: "translateX(4px)",
        }}
      >
        <Icon as={icon} alignSelf="center" fontSize="18px" />
        <Text ml={3} fontSize="sm">{title}</Text>
      </Flex>
    )
  })

  return (
    <Box>
      {listItems}
    </Box>
  )
}

export default SidebarItems
