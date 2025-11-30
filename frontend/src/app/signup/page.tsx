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
import { useRouter } from "next/navigation"
import { type SubmitHandler, useForm } from "react-hook-form"
import NextLink from "next/link"

import { type UserRegister, UsersService } from "../../client"
import type { ApiError } from "../../client/core/ApiError"
import useCustomToast from "../../hooks/useCustomToast"
import {
  confirmPasswordRules,
  emailPattern,
  handleError,
  passwordRules,
} from "../../utils"

interface UserRegisterForm extends UserRegister {
  confirm_password: string
}

export default function SignUpPage() {
  const router = useRouter()
  const showToast = useCustomToast()
  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<UserRegisterForm>({
    mode: "onBlur",
    criteriaMode: "all",
    defaultValues: {
      email: "",
      full_name: "",
      password: "",
      confirm_password: "",
    },
  })

  const mutation = useMutation({
    mutationFn: (data: UserRegister) =>
      UsersService.registerUser({ requestBody: data }),
    onSuccess: () => {
      showToast(
        "Account created.",
        "Your account has been created successfully.",
        "success"
      )
      router.push("/login")
    },
    onError: (err: ApiError) => {
      handleError(err, showToast)
    },
  })

  const onSubmit: SubmitHandler<UserRegisterForm> = (data) => {
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
      py={8}
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
        <VStack spacing={2} mb={6}>
          <Heading
            as="h1"
            size="xl"
            fontFamily="'Cinzel', serif"
            color="dnd.gold"
            textAlign="center"
            textShadow="2px 2px 4px rgba(0, 0, 0, 0.5)"
            letterSpacing="wider"
          >
            Join the Guild
          </Heading>
          <Text
            fontSize="sm"
            color="dnd.parchment"
            fontStyle="italic"
            textAlign="center"
          >
            Create your adventurer profile
          </Text>
          <Box
            w="60%"
            h="2px"
            bg="linear-gradient(90deg, transparent, #C9A227, transparent)"
            mt={2}
          />
        </VStack>

        <VStack spacing={4}>
          <FormControl id="full_name" isInvalid={!!errors.full_name}>
            <FormLabel
              htmlFor="full_name"
              fontFamily="'Cinzel', serif"
              color="dnd.gold"
              fontSize="sm"
            >
              Adventurer Name
            </FormLabel>
            <Input
              id="full_name"
              minLength={3}
              {...register("full_name", { required: "Full Name is required" })}
              placeholder="Your name"
              type="text"
              size="lg"
            />
            {errors.full_name && (
              <FormErrorMessage>{errors.full_name.message}</FormErrorMessage>
            )}
          </FormControl>

          <FormControl id="email" isInvalid={!!errors.email}>
            <FormLabel
              htmlFor="email"
              fontFamily="'Cinzel', serif"
              color="dnd.gold"
              fontSize="sm"
            >
              Scroll Address
            </FormLabel>
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

          <FormControl id="password" isInvalid={!!errors.password}>
            <FormLabel
              htmlFor="password"
              fontFamily="'Cinzel', serif"
              color="dnd.gold"
              fontSize="sm"
            >
              Secret Passphrase
            </FormLabel>
            <Input
              id="password"
              {...register("password", passwordRules())}
              placeholder="Password"
              type="password"
              size="lg"
            />
            {errors.password && (
              <FormErrorMessage>{errors.password.message}</FormErrorMessage>
            )}
          </FormControl>

          <FormControl id="confirm_password" isInvalid={!!errors.confirm_password}>
            <FormLabel
              htmlFor="confirm_password"
              fontFamily="'Cinzel', serif"
              color="dnd.gold"
              fontSize="sm"
            >
              Confirm Passphrase
            </FormLabel>
            <Input
              id="confirm_password"
              {...register(
                "confirm_password",
                confirmPasswordRules(() => getValues() as unknown as Record<string, unknown>)
              )}
              placeholder="Repeat password"
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
            Begin Your Quest
          </Button>

          <Text fontSize="sm" color="dnd.parchment" mt={4}>
            Already a guild member?{" "}
            <Link
              as={NextLink}
              href="/login"
              color="dnd.gold"
              fontWeight="bold"
              _hover={{ color: "dnd.goldLight" }}
              passHref
            >
              Enter the Realm
            </Link>
          </Text>
        </VStack>
      </Container>
    </Box>
  )
}
