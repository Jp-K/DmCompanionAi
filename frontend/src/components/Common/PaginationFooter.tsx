"use client"

import { Button, Flex, Text } from "@chakra-ui/react"

type PaginationFooterProps = {
  hasNextPage?: boolean
  hasPreviousPage?: boolean
  onChangePage: (newPage: number) => void
  page: number
}

export function PaginationFooter({
  hasNextPage,
  hasPreviousPage,
  onChangePage,
  page,
}: PaginationFooterProps) {
  return (
    <Flex
      gap={4}
      alignItems="center"
      mt={4}
      direction="row"
      justifyContent="flex-end"
    >
      <Button
        onClick={() => onChangePage(page - 1)}
        isDisabled={!hasPreviousPage || page <= 1}
        variant="outline"
        borderColor="dnd.gold"
        color="dnd.gold"
        fontFamily="'Cinzel', serif"
        _hover={{ bg: "rgba(201, 162, 39, 0.2)" }}
        _disabled={{ opacity: 0.4, cursor: "not-allowed" }}
      >
        ◄ Previous
      </Button>
      <Text color="dnd.parchment" fontFamily="'Cinzel', serif" fontSize="sm">
        Page {page}
      </Text>
      <Button 
        isDisabled={!hasNextPage} 
        onClick={() => onChangePage(page + 1)}
        variant="outline"
        borderColor="dnd.gold"
        color="dnd.gold"
        fontFamily="'Cinzel', serif"
        _hover={{ bg: "rgba(201, 162, 39, 0.2)" }}
        _disabled={{ opacity: 0.4, cursor: "not-allowed" }}
      >
        Next ►
      </Button>
    </Flex>
  )
}
