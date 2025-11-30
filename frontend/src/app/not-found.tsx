"use client"

import { Container, Heading, Text } from "@chakra-ui/react"
import Link from "next/link"

export default function NotFound() {
  return (
    <Container
      h="100vh"
      alignItems="stretch"
      justifyContent="center"
      textAlign="center"
      maxW="sm"
      centerContent
    >
      <Heading size="4xl" color="ui.main" textAlign="center" mb={2}>
        404
      </Heading>
      <Text fontSize="lg" mb={4}>
        Oops! Page not found.
      </Text>
      <Link href="/" style={{ color: "#009688", textDecoration: "underline" }}>
        Go back home
      </Link>
    </Container>
  )
}
