"use client"

import { Flex, Spinner, Box, Text, VStack, useColorModeValue } from "@chakra-ui/react"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { GiDragonHead } from "react-icons/gi"

import useAuth, { isLoggedIn } from "../../hooks/useAuth"
import Sidebar from "../../components/Common/Sidebar"
import UserMenu from "../../components/Common/UserMenu"

interface AuthLayoutProps {
  children: React.ReactNode
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  const router = useRouter()
  const { isLoading } = useAuth()
  const bgColor = useColorModeValue("dnd.ink", "#0d0d1a")

  useEffect(() => {
    if (!isLoggedIn()) {
      router.push("/login")
    }
  }, [router])

  if (isLoading || !isLoggedIn()) {
    return (
      <Flex 
        justify="center" 
        align="center" 
        height="100vh" 
        width="full"
        bg={bgColor}
        direction="column"
      >
        <VStack spacing={4}>
          <GiDragonHead size={60} color="#C9A227" />
          <Spinner size="xl" color="dnd.gold" thickness="4px" />
          <Text color="text.primary" fontFamily="'Cinzel', serif">
            Preparing your adventure...
          </Text>
        </VStack>
      </Flex>
    )
  }

  return (
    <Flex maxW="large" h="auto" position="relative" bg={bgColor} minH="100vh">
      <Sidebar />
      <UserMenu />
      <Box flex="1" overflowY="auto">
        {children}
      </Box>
    </Flex>
  )
}
