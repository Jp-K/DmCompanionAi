"use client"

import {
  Container,
  Heading,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  Box,
  Text,
  Icon,
} from "@chakra-ui/react"
import { useQueryClient } from "@tanstack/react-query"
import { GiCog } from "react-icons/gi"

import type { UserPublic } from "../../../client"
import Appearance from "../../../components/UserSettings/Appearance"
import ChangePassword from "../../../components/UserSettings/ChangePassword"
import DeleteAccount from "../../../components/UserSettings/DeleteAccount"
import UserInformation from "../../../components/UserSettings/UserInformation"

const tabsConfig = [
  { title: "📜 Profile", component: UserInformation },
  { title: "🔐 Password", component: ChangePassword },
  { title: "🎨 Appearance", component: Appearance },
  { title: "⚠️ Danger Zone", component: DeleteAccount },
]

export default function SettingsPage() {
  const queryClient = useQueryClient()
  const currentUser = queryClient.getQueryData<UserPublic>(["currentUser"])
  const finalTabs = currentUser?.is_superuser
    ? tabsConfig.slice(0, 3)
    : tabsConfig

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
          <Icon as={GiCog} /> Guild Settings
        </Heading>
        <Text color="dnd.parchment" mt={2} opacity={0.8}>
          ⚙️ Customize your adventurer profile
        </Text>
      </Box>
      <Box 
        bg="dnd.leather" 
        p={6} 
        borderRadius="12px" 
        borderWidth="2px" 
        borderColor="dnd.gold"
        boxShadow="0 0 20px rgba(201, 162, 39, 0.2)"
      >
        <Tabs variant="enclosed">
          <TabList borderColor="dnd.gold">
            {finalTabs.map((tab, index) => (
              <Tab 
                key={index}
                color="dnd.parchment"
                fontFamily="'Cinzel', serif"
                fontSize="sm"
                _selected={{ 
                  color: "dnd.gold", 
                  bg: "rgba(201, 162, 39, 0.2)",
                  borderColor: "dnd.gold",
                  borderBottomColor: "dnd.leather"
                }}
                _hover={{ color: "dnd.gold" }}
              >
                {tab.title}
              </Tab>
            ))}
          </TabList>
          <TabPanels>
            {finalTabs.map((tab, index) => (
              <TabPanel key={index} color="dnd.parchment">
                <tab.component />
              </TabPanel>
            ))}
          </TabPanels>
        </Tabs>
      </Box>
    </Container>
  )
}
