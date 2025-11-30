"use client"

import {
  Box,
  Button,
  Container,
  FormControl,
  FormErrorMessage,
  FormLabel,
  Heading,
  Input,
  Link,
  Text,
  VStack,
} from "@chakra-ui/react"
import { useMutation } from "@tanstack/react-query"
import { useRouter, useSearchParams } from "next/navigation"
import { type SubmitHandler, useForm } from "react-hook-form"
import NextLink from "next/link"

import { type NewPassword, LoginService } from "../../client"
import type { ApiError } from "../../client/core/ApiError"
import useCustomToast from "../../hooks/useCustomToast"
import { confirmPasswordRules, handleError, passwordRules } from "../../utils"
import { get } from "http"

interface NewPasswordForm extends NewPassword {
  confirm_password: string
}

export default function ResetPasswordPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const showToast = useCustomToast()
  const {
    register,
    handleSubmit,
    getValues,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<NewPasswordForm>({
    mode: "onBlur",
    criteriaMode: "all",
    defaultValues: {
      new_password: "",
    },
  })

  const resetPassword = async (data: NewPassword) => {
    const token = searchParams.get("token")
    if (!token) return
    await LoginService.resetPassword({
      requestBody: { token, new_password: data.new_password },
    })
  }

  const mutation = useMutation({
    mutationFn: resetPassword,
    onSuccess: () => {
      showToast("Success!", "Password updated successfully.", "success")
      reset()
      router.push("/login")
    },
    onError: (err: ApiError) => {
      handleError(err, showToast)
    },
  })

  const onSubmit: SubmitHandler<NewPasswordForm> = async (data) => {
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
            Reset Password
          </Heading>
          <Text
            fontSize="sm"
            color="dnd.parchment"
            fontStyle="italic"
            textAlign="center"
          >
            Forge a new key to your realm
          </Text>
          <Box
            w="60%"
            h="2px"
            bg="linear-gradient(90deg, transparent, #C9A227, transparent)"
            mt={2}
          />
        </VStack>

        <VStack spacing={4}>
          <FormControl isInvalid={!!errors.new_password}>
            <FormLabel
              htmlFor="password"
              fontFamily="'Cinzel', serif"
              color="dnd.gold"
              fontSize="sm"
            >
              New Password
            </FormLabel>
            <Input
              id="password"
              {...register("new_password", passwordRules())}
              placeholder="Enter new password"
              type="password"
              size="lg"
            />
            {errors.new_password && (
              <FormErrorMessage>{errors.new_password.message}</FormErrorMessage>
            )}
          </FormControl>

          <FormControl isInvalid={!!errors.confirm_password}>
            <FormLabel
              htmlFor="confirm_password"
              fontFamily="'Cinzel', serif"
              color="dnd.gold"
              fontSize="sm"
            >
              Confirm Password
            </FormLabel>
            <Input
              id="confirm_password"
              {...register(
                "confirm_password",
                confirmPasswordRules(() => getValues() as unknown as Record<string, unknown>)
              )}
              placeholder="Confirm new password"
              type="password"
              size="lg"
            />
            {errors.confirm_password && (
              <FormErrorMessage>{errors.confirm_password.message}</FormErrorMessage>
            )}
          </FormControl>

          <Button
            variant="primary"
            type="submit"
            isLoading={isSubmitting}
            w="full"
            size="lg"
            mt={4}
          >
            Forge New Key
          </Button>

          <Text fontSize="sm" color="dnd.parchment" mt={4}>
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
