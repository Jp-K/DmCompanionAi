"use client"

import {
  Box,
  IconButton,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
} from "@chakra-ui/react"
import Link from "next/link"
import { GiWizardFace } from "react-icons/gi"
import { FiLogOut, FiUser } from "react-icons/fi"

import useAuth from "../../hooks/useAuth"

const UserMenu = () => {
  const { logout } = useAuth()

  const handleLogout = async () => {
    logout()
  }

  return (
    <>
      {/* Desktop */}
      <Box
        display={{ base: "none", md: "block" }}
        position="fixed"
        top={4}
        right={4}
      >
        <Menu>
          <MenuButton
            as={IconButton}
            aria-label="Options"
            icon={<GiWizardFace color="#C9A227" fontSize="24px" />}
            bg="dnd.leather"
            borderWidth="2px"
            borderColor="dnd.gold"
            isRound
            data-testid="user-menu"
            _hover={{ 
              bg: "dnd.gold", 
              "& svg": { color: "#4A3728" } 
            }}
            boxShadow="0 0 10px rgba(201, 162, 39, 0.4)"
          />
          <MenuList 
            bg="dnd.leather" 
            borderColor="dnd.gold" 
            borderWidth="2px"
            boxShadow="0 0 20px rgba(0, 0, 0, 0.5)"
          >
            <MenuItem 
              icon={<FiUser fontSize="18px" />} 
              as={Link} 
              href="/settings"
              bg="transparent"
              color="dnd.parchment"
              fontFamily="'Cinzel', serif"
              _hover={{ bg: "rgba(201, 162, 39, 0.2)", color: "dnd.gold" }}
            >
              My profile
            </MenuItem>
            <MenuItem
              icon={<FiLogOut fontSize="18px" />}
              onClick={handleLogout}
              color="dnd.crimson"
              fontWeight="bold"
              bg="transparent"
              fontFamily="'Cinzel', serif"
              _hover={{ bg: "rgba(139, 0, 0, 0.2)" }}
            >
              Log out
            </MenuItem>
          </MenuList>
        </Menu>
      </Box>
    </>
  )
}

export default UserMenu
