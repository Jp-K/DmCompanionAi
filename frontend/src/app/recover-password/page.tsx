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
import { useMutation } from "@tanstack/react-query"
import { type SubmitHandler, useForm } from "react-hook-form"
import NextLink from "next/link"

import { LoginService } from "../../client"
import type { ApiError } from "../../client/core/ApiError"
import useCustomToast from "../../hooks/useCustomToast"
import { emailPattern, handleError } from "../../utils"

interface FormData {
  email: string
}

export default function RecoverPasswordPage() {
  const showToast = useCustomToast()
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>()

  const recoverPassword = async (data: FormData) => {
    await LoginService.recoverPassword({
      email: data.email,
    })
  }

  const mutation = useMutation({
    mutationFn: recoverPassword,
    onSuccess: () => {
      showToast(
        "Email sent.",
        "We sent an email with a link to get back into your account.",
        "success"
      )
      reset()
    },
    onError: (err: ApiError) => {
      handleError(err, showToast)
    },
  })

  const onSubmit: SubmitHandler<FormData> = async (data) => {
    mutation.mutate(data)
  }

  return (
    <Box
      minH="100vh"
      bg="dnd.leather"
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
        bg="rgba(45, 27, 14, 0.95)"
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
            Password Recovery
          </Heading>
          <Text
            fontSize="sm"
            color="dnd.parchment"
            fontStyle="italic"
            textAlign="center"
          >
            A recovery scroll will be sent to your registered account
          </Text>
          <Box
            w="60%"
            h="2px"
            bg="linear-gradient(90deg, transparent, #C9A227, transparent)"
            mt={2}
          />
        </VStack>

        <VStack spacing={4}>
          <FormControl isInvalid={!!errors.email}>
            <Input
              id="email"
              {...register("email", {
                required: "Email is required",
                pattern: emailPattern,
              })}
              placeholder="Email"
              type="email"
              size="lg"
            />
            {errors.email && (
              <FormErrorMessage>{errors.email.message}</FormErrorMessage>
            )}
          </FormControl>

          <Button
            variant="primary"
            type="submit"
            isLoading={isSubmitting}
            w="full"
            size="lg"
            mt={2}
          >
            Send Recovery Scroll
          </Button>

          <Text fontSize="sm" color="dnd.parchment" mt={4}>
            Remember your password?{" "}
            <Link
              as={NextLink}
              href="/login"
              color="dnd.gold"
              fontWeight="bold"
              _hover={{ color: "dnd.goldLight" }}
              passHref
            >
              Return to Login
            </Link>
          </Text>
        </VStack>
      </Container>
    </Box>
  )
}
