"use client"

import {
  Box,
  Container,
  Heading,
  Text,
  SimpleGrid,
  Flex,
  Icon,
  VStack,
} from "@chakra-ui/react"
import { useQueryClient } from "@tanstack/react-query"
import Link from "next/link"
import { GiCrossedSwords, GiSpellBook, GiScrollUnfurled, GiCog, GiCastle, GiDragonHead } from "react-icons/gi"

import type { UserPublic } from "../../../client"

const quickActions = [
  { 
    icon: GiSpellBook, 
    title: "New Quest", 
    description: "Start a new conversation with your DM Companion",
    path: "/chat",
    color: "dnd.gold"
  },
  { 
    icon: GiScrollUnfurled, 
    title: "Chronicles", 
    description: "Review your past adventures and conversations",
    path: "/chatList",
    color: "dnd.goldLight"
  },
  { 
    icon: GiScrollUnfurled, 
    title: "Scrolls", 
    description: "Review your past adventures and conversations",
    path: "/scrolls",
    color: "dnd.goldLight"
  },
  { 
    icon: GiCog, 
    title: "Guild Settings", 
    description: "Customize your adventurer profile",
    path: "/settings",
    color: "dnd.parchment"
  },
]

export default function DashboardPage() {
  const queryClient = useQueryClient()
  const currentUser = queryClient.getQueryData<UserPublic>(["currentUser"])

  return (
    <Container maxW="full" bg="dnd.ink" minH="100vh" py={8}>
      {/* Welcome Section */}
      <Box textAlign="center" py={12}>
        <Icon as={GiDragonHead} boxSize={16} color="dnd.gold" mb={4} />
        <Heading 
          size="2xl" 
          color="dnd.gold"
          fontFamily="'Cinzel', serif"
          mb={4}
        >
          Welcome, Adventurer
        </Heading>
        <Text color="dnd.parchment" fontSize="xl" opacity={0.9}>
          ⚔️ {currentUser?.full_name || currentUser?.email || "Brave Hero"} ⚔️
        </Text>
        <Text color="dnd.parchment" mt={2} opacity={0.7}>
          Your DM Companion awaits your command
        </Text>
      </Box>

      {/* Quick Actions */}
      <Box py={8}>
        <Heading 
          size="lg" 
          color="dnd.gold"
          fontFamily="'Cinzel', serif"
          mb={6}
          textAlign="center"
        >
          <Icon as={GiCastle} mr={3} />
          Quick Actions
        </Heading>
        
        <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6}>
          {quickActions.map((action) => (
            <Box
              as={Link}
              href={action.path}
              key={action.title}
              bg="dnd.leather"
              p={6}
              borderRadius="12px"
              borderWidth="2px"
              borderColor="dnd.gold"
              transition="all 0.3s"
              _hover={{
                transform: "translateY(-4px)",
                boxShadow: "0 0 30px rgba(201, 162, 39, 0.4)",
                borderColor: "dnd.goldLight",
              }}
              cursor="pointer"
            >
              <VStack spacing={4} align="center">
                <Icon as={action.icon} boxSize={12} color={action.color} />
                <Heading 
                  size="md" 
                  color="dnd.gold"
                  fontFamily="'Cinzel', serif"
                >
                  {action.title}
                </Heading>
                <Text color="dnd.parchment" textAlign="center" fontSize="sm">
                  {action.description}
                </Text>
              </VStack>
            </Box>
          ))}
        </SimpleGrid>
      </Box>

      {/* Stats or Info Section */}
      <Box 
        py={8} 
        mt={8}
        bg="dnd.leather"
        borderRadius="12px"
        borderWidth="2px"
        borderColor="dnd.gold"
        p={8}
        textAlign="center"
      >
        <Icon as={GiCrossedSwords} boxSize={10} color="dnd.gold" mb={4} />
        <Heading 
          size="md" 
          color="dnd.gold"
          fontFamily="'Cinzel', serif"
          mb={4}
        >
          Ready for Adventure?
        </Heading>
        <Text color="dnd.parchment" maxW="600px" mx="auto">
          Your DM Companion is an AI-powered assistant designed to help Game Masters 
          create immersive RPG experiences. Ask about rules, generate NPCs, create 
          encounters, or seek advice for your campaigns.
        </Text>
      </Box>
    </Container>
  )
}
