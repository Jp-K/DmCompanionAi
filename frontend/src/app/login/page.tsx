"use client"

import {
  Box,
  Button,
  Container,
  FormControl,
  FormErrorMessage,
  Heading,
  Input,
  Link,
  Text,
  VStack,
} from "@chakra-ui/react"
import { useRouter, useSearchParams } from "next/navigation"
import { type SubmitHandler, useForm } from "react-hook-form"
import NextLink from "next/link"
import { useEffect } from "react"

import useAuth, { isLoggedIn } from "../../hooks/useAuth"
import { emailPattern } from "../../utils"

interface LoginFormData {
  username: string
  password: string
}

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { loginMutation, error, resetError } = useAuth()
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    mode: "onBlur",
    criteriaMode: "all",
    defaultValues: {
      username: "",
      password: "",
    },
  })

  useEffect(() => {
    if (isLoggedIn()) {
      const redirect = searchParams.get("redirect")
      router.push(redirect || "/")
    }
  }, [router, searchParams])

  const onSubmit: SubmitHandler<LoginFormData> = async (data) => {
    if (isSubmitting) return

    resetError()

    try {
      await loginMutation.mutateAsync(data)
      const redirect = searchParams.get("redirect")
      router.push(redirect || "/")
    } catch {
      // error is handled by the loginMutation
    }
  }

  return (
    <Box
      minH="100vh"
      backgroundColor={"dnd.ink"}
      backgroundImage="linear-gradient(rgba(26, 15, 10, 0.7), rgba(26, 15, 10, 0.85)), url('/images/parchment-texture.jpg')"
      backgroundSize="cover"
      backgroundPosition="center"
      display="flex"
      alignItems="center"
      justifyContent="center"
    >
      <Container
        as="form"
        onSubmit={handleSubmit(onSubmit)}
        maxW="sm"
        backgroundColor={"dnd.leather"}
        p={8}
        borderRadius="lg"
        border="3px solid"
        borderColor="dnd.gold"
        boxShadow="0 0 30px rgba(201, 162, 39, 0.3), inset 0 0 60px rgba(0, 0, 0, 0.5)"
      >
        {/* D&D Style Header */}
        <VStack spacing={2} mb={8}>
          <Heading
            as="h1"
            size="xl"
            fontFamily="'Cinzel', serif"
            color="dnd.gold"
            textAlign="center"
            textShadow="2px 2px 4px rgba(0, 0, 0, 0.5)"
            letterSpacing="wider"
          >
            DM Companion
          </Heading>
          <Text
            fontSize="sm"
            color="dnd.parchment"
            fontStyle="italic"
            textAlign="center"
          >
            Your AI-Powered Dungeon Master Tools
          </Text>
          <Box
            w="60%"
            h="2px"
            bg="linear-gradient(90deg, transparent, #C9A227, transparent)"
            mt={2}
          />
        </VStack>

        <VStack spacing={4}>
          <FormControl id="username" isInvalid={!!errors.username || !!error}>
            <Input
              id="username"
              {...register("username", {
                required: "Username is required",
                pattern: emailPattern,
              })}
              placeholder="Email"
              type="email"
              required
              size="lg"
            />
            {errors.username && (
              <FormErrorMessage>{errors.username.message}</FormErrorMessage>
            )}
          </FormControl>
          <FormControl id="password" isInvalid={!!error}>
            <Input
              {...register("password", {
                required: "Password is required",
              })}
              placeholder="Password"
              type="password"
              required
              size="lg"
            />
            {error && <FormErrorMessage>{error}</FormErrorMessage>}
          </FormControl>

          <Link
            as={NextLink}
            href="/recover-password"
            color="dnd.gold"
            fontSize="sm"
            _hover={{ color: "dnd.goldLight" }}
            passHref
          >
            Forgot password?
          </Link>

          <Button
            variant="primary"
            type="submit"
            isLoading={isSubmitting}
            w="full"
            size="lg"
            mt={2}
          >
            Enter the Realm 
          </Button>

          <Text fontSize="sm" color="dnd.parchment" mt={4}>
            Don&apos;t have an account?{" "}
            <Link
              as={NextLink}
              href="/signup"
              color="dnd.gold"
              fontWeight="bold"
              _hover={{ color: "dnd.goldLight" }}
              passHref
            >
              Join the Adventure
            </Link>
          </Text>
        </VStack>
      </Container>
    </Box>
  )
}
