"use client"
/** @jsxImportSource @emotion/react */

import { css } from "@emotion/react"
import {
  Container,
  Heading,
  Box,
  Button,
  Flex,
  Input,
  Text,
  VStack,
  HStack,
  Icon,
  Select,
  Badge,
  Spinner,
  InputGroup,
  InputLeftElement,
  Card,
  CardBody,
  SimpleGrid,
  Collapse,
  IconButton,
} from "@chakra-ui/react"
import { useState, useEffect } from "react"
import { useQuery } from "@tanstack/react-query"
import { marked } from "marked"
import { 
  GiSpellBook, 
  GiScrollUnfurled, 
  GiSwordman, 
  GiHolyGrail,
  GiMagicSwirl,
  GiBookmarklet,
  GiCrownedSkull,
  GiRunningNinja,
  GiLightBackpack,
  GiFeather,
} from "react-icons/gi"
import { FiSearch, FiChevronDown, FiChevronUp } from "react-icons/fi"

import { KnowledgeService, type CategoryType, type KnowledgeItem, type StatsResponse } from "../../../client"

marked.setOptions({
  gfm: true,
  breaks: true,
})

const categoryIcons: Record<string, any> = {
  spell: GiSpellBook,
  rule: GiScrollUnfurled,
  item: GiSwordman,
  action: GiRunningNinja,
  background: GiLightBackpack,
  deity: GiHolyGrail,
  race: GiCrownedSkull,
  feat: GiFeather,
}

const categoryLabels: Record<string, string> = {
  spell: "Magia",
  rule: "Regra",
  item: "Item",
  action: "Ação",
  background: "Antecedente",
  deity: "Divindade",
  race: "Raça",
  feat: "Talento",
}

const categoryColors: Record<string, string> = {
  spell: "purple",
  rule: "blue",
  item: "orange",
  action: "red",
  background: "green",
  deity: "yellow",
  race: "cyan",
  feat: "pink",
}

interface KnowledgeCardProps {
  item: KnowledgeItem
}

const KnowledgeCard = ({ item }: KnowledgeCardProps) => {
  const [isExpanded, setIsExpanded] = useState(false)
  const category = item.category || "item"
  const CategoryIcon = categoryIcons[category] || GiBookmarklet
  
  return (
    <Card
      bg="rgba(26, 26, 46, 0.9)"
      borderWidth="1px"
      borderColor="dnd.gold"
      borderRadius="8px"
      overflow="hidden"
      transition="all 0.2s"
      _hover={{
        borderColor: "dnd.lightGold",
        transform: "translateY(-2px)",
        boxShadow: "0 4px 12px rgba(201, 162, 39, 0.3)",
      }}
    >
      <CardBody p={4}>
        <VStack align="stretch" spacing={3}>
          <Flex justify="space-between" align="flex-start">
            <HStack spacing={2} flex={1}>
              <Icon 
                as={CategoryIcon} 
                color={`${categoryColors[category]}.400`} 
                fontSize="24px" 
              />
              <VStack align="start" spacing={0} flex={1}>
                <Text
                  color="dnd.gold"
                  fontFamily="'Cinzel', serif"
                  fontWeight="bold"
                  fontSize="md"
                  noOfLines={isExpanded ? undefined : 1}
                >
                  {item.title || "Sem título"}
                </Text>
                <HStack spacing={2}>
                  <Badge 
                    colorScheme={categoryColors[category]}
                    fontSize="xs"
                    borderRadius="full"
                  >
                    {categoryLabels[category]}
                  </Badge>
                  {item.score && (
                    <Badge colorScheme="green" fontSize="xs" borderRadius="full">
                      {(item.score * 100).toFixed(0)}% match
                    </Badge>
                  )}
                </HStack>
              </VStack>
            </HStack>
            <IconButton
              aria-label="Expandir"
              icon={isExpanded ? <FiChevronUp /> : <FiChevronDown />}
              size="sm"
              variant="ghost"
              color="dnd.parchment"
              onClick={() => setIsExpanded(!isExpanded)}
            />
          </Flex>
          
          <Collapse in={isExpanded} animateOpacity>
            <Box
              bg="rgba(0, 0, 0, 0.3)"
              p={3}
              borderRadius="md"
              maxH="300px"
              overflowY="auto"
            >
              <Text color="dnd.parchment" fontSize="sm" whiteSpace="pre-wrap">
                {item.description || item.document || "Sem descrição disponível."}
              </Text>
            </Box>
          </Collapse>
          
          {!isExpanded && item.description && (
            <Text 
              color="dnd.parchment" 
              fontSize="sm" 
              noOfLines={2}
              opacity={0.8}
            >
              {item.description}
            </Text>
          )}
          
          <HStack spacing={2} fontSize="xs" color="gray.500">
            {item.source && <Text>Fonte: {item.source}</Text>}
            {item.page && <Text>• Página {item.page}</Text>}
          </HStack>
        </VStack>
      </CardBody>
    </Card>
  )
}

export default function KnowledgePage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<CategoryType | "">("")
  const [currentPage, setCurrentPage] = useState(0)
  const [isSearchMode, setIsSearchMode] = useState(false)
  const itemsPerPage = 12

  // Stats query
  const { data: stats, isLoading: statsLoading } = useQuery<StatsResponse>({
    queryKey: ["knowledge-stats"],
    queryFn: () => KnowledgeService.getStats(),
  })

  // List query (when not searching)
  const { 
    data: listData, 
    isLoading: listLoading,
    isFetching: listFetching,
  } = useQuery({
    queryKey: ["knowledge-list", selectedCategory, currentPage],
    queryFn: () => KnowledgeService.listItems({
      category: selectedCategory || undefined,
      limit: itemsPerPage,
      offset: currentPage * itemsPerPage,
    }),
    enabled: !isSearchMode,
  })

  // Search query
  const { 
    data: searchData, 
    isLoading: searchLoading,
    isFetching: searchFetching,
  } = useQuery({
    queryKey: ["knowledge-search", searchQuery, selectedCategory],
    queryFn: () => KnowledgeService.search({
      q: searchQuery,
      category: selectedCategory || undefined,
      limit: 20,
    }),
    enabled: isSearchMode && searchQuery.length >= 2,
  })

  // Handle search
  const handleSearch = () => {
    if (searchQuery.trim().length >= 2) {
      setIsSearchMode(true)
      setCurrentPage(0)
    }
  }

  // Handle clear search
  const handleClearSearch = () => {
    setSearchQuery("")
    setIsSearchMode(false)
    setCurrentPage(0)
  }

  // Handle category change
  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedCategory(e.target.value as CategoryType | "")
    setCurrentPage(0)
  }

  const isLoading = isSearchMode ? searchLoading : listLoading
  const isFetching = isSearchMode ? searchFetching : listFetching
  const items = isSearchMode ? searchData?.items : listData?.items
  const total = isSearchMode ? (searchData?.items?.length || 0) : (listData?.total || 0)
  const hasMore = !isSearchMode && (listData?.has_more || false)

  return (
    <Container maxW="full" py={6}>
      {/* Header */}
      <Flex align="center" mb={6}>
        <Icon as={GiBookmarklet} fontSize="32px" color="dnd.gold" mr={3} />
        <Heading
          size="lg"
          color="dnd.gold"
          fontFamily="'Cinzel Decorative', 'Cinzel', serif"
        >
          Compêndio de Conhecimento
        </Heading>
      </Flex>

      {/* Stats */}
      {stats && !stats.error && (
        <SimpleGrid columns={{ base: 2, sm: 4, md: 8 }} spacing={3} mb={6}>
          {Object.entries(categoryLabels).map(([key, label]) => {
            const count = stats[key as keyof StatsResponse] as number || 0
            const CategoryIcon = categoryIcons[key]
            return (
              <Box
                key={key}
                bg="rgba(26, 26, 46, 0.7)"
                p={3}
                borderRadius="md"
                borderWidth="1px"
                borderColor="rgba(201, 162, 39, 0.3)"
                textAlign="center"
                cursor="pointer"
                transition="all 0.2s"
                _hover={{
                  borderColor: "dnd.gold",
                  bg: "rgba(201, 162, 39, 0.1)",
                }}
                onClick={() => {
                  setSelectedCategory(key as CategoryType)
                  setIsSearchMode(false)
                  setCurrentPage(0)
                }}
              >
                <Icon as={CategoryIcon} color={`${categoryColors[key]}.400`} fontSize="20px" />
                <Text color="dnd.parchment" fontSize="xs" mt={1}>{label}</Text>
                <Text color="dnd.gold" fontWeight="bold" fontSize="lg">{count}</Text>
              </Box>
            )
          })}
        </SimpleGrid>
      )}

      {/* Search and Filter */}
      <Flex 
        gap={4} 
        mb={6}
        direction={{ base: "column", md: "row" }}
        bg="rgba(26, 26, 46, 0.7)"
        p={4}
        borderRadius="md"
        borderWidth="1px"
        borderColor="rgba(201, 162, 39, 0.3)"
      >
        <InputGroup flex={1}>
          <InputLeftElement pointerEvents="none">
            <Icon as={FiSearch} color="dnd.gold" />
          </InputLeftElement>
          <Input
            placeholder="Pesquisar no compêndio..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            bg="rgba(0, 0, 0, 0.3)"
            borderColor="rgba(201, 162, 39, 0.5)"
            color="dnd.parchment"
            _placeholder={{ color: "gray.500" }}
            _hover={{ borderColor: "dnd.gold" }}
            _focus={{ borderColor: "dnd.gold", boxShadow: "0 0 0 1px var(--chakra-colors-dnd-gold)" }}
          />
        </InputGroup>

        <Select
          value={selectedCategory}
          onChange={handleCategoryChange}
          bg="rgba(0, 0, 0, 0.3)"
          borderColor="rgba(201, 162, 39, 0.5)"
          color="dnd.parchment"
          w={{ base: "full", md: "200px" }}
          _hover={{ borderColor: "dnd.gold" }}
        >
          <option value="" style={{ background: "#1a1a2e" }}>Todas categorias</option>
          {Object.entries(categoryLabels).map(([key, label]) => (
            <option key={key} value={key} style={{ background: "#1a1a2e" }}>
              {label}
            </option>
          ))}
        </Select>

        <HStack spacing={2}>
          <Button
            onClick={handleSearch}
            bg="dnd.gold"
            color="dnd.darkBg"
            fontFamily="'Cinzel', serif"
            _hover={{ bg: "dnd.lightGold" }}
            isDisabled={searchQuery.length < 2}
          >
            Buscar
          </Button>
          {isSearchMode && (
            <Button
              onClick={handleClearSearch}
              variant="outline"
              borderColor="dnd.gold"
              color="dnd.gold"
              fontFamily="'Cinzel', serif"
              _hover={{ bg: "rgba(201, 162, 39, 0.1)" }}
            >
              Limpar
            </Button>
          )}
        </HStack>
      </Flex>

      {/* Results info */}
      <Flex justify="space-between" align="center" mb={4}>
        <Text color="dnd.parchment" fontSize="sm">
          {isSearchMode 
            ? `${items?.length || 0} resultados para "${searchQuery}"`
            : `Exibindo ${items?.length || 0} de ${total} itens`
          }
          {selectedCategory && ` em ${categoryLabels[selectedCategory]}`}
        </Text>
        {(isFetching) && <Spinner size="sm" color="dnd.gold" />}
      </Flex>

      {/* Results grid */}
      {isLoading ? (
        <Flex justify="center" py={12}>
          <VStack spacing={4}>
            <Spinner size="xl" color="dnd.gold" thickness="4px" />
            <Text color="dnd.parchment">Consultando os pergaminhos ancestrais...</Text>
          </VStack>
        </Flex>
      ) : items && items.length > 0 ? (
        <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4}>
          {items.map((item, index) => (
            <KnowledgeCard key={item.id || index} item={item} />
          ))}
        </SimpleGrid>
      ) : (
        <Flex 
          justify="center" 
          py={12}
          bg="rgba(26, 26, 46, 0.5)"
          borderRadius="md"
          borderWidth="1px"
          borderColor="rgba(201, 162, 39, 0.2)"
        >
          <VStack spacing={4}>
            <Icon as={GiMagicSwirl} fontSize="48px" color="gray.500" />
            <Text color="gray.500" fontFamily="'Cinzel', serif">
              {isSearchMode 
                ? "Nenhum resultado encontrado para sua busca."
                : "Nenhum item encontrado nesta categoria."
              }
            </Text>
          </VStack>
        </Flex>
      )}

      {/* Pagination */}
      {!isSearchMode && total > itemsPerPage && (
        <Flex justify="center" mt={6} gap={4}>
          <Button
            onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
            isDisabled={currentPage === 0}
            variant="outline"
            borderColor="dnd.gold"
            color="dnd.gold"
            fontFamily="'Cinzel', serif"
            _hover={{ bg: "rgba(201, 162, 39, 0.1)" }}
          >
            Anterior
          </Button>
          <Flex align="center" px={4}>
            <Text color="dnd.parchment">
              Página {currentPage + 1} de {Math.ceil(total / itemsPerPage)}
            </Text>
          </Flex>
          <Button
            onClick={() => setCurrentPage(p => p + 1)}
            isDisabled={!hasMore}
            variant="outline"
            borderColor="dnd.gold"
            color="dnd.gold"
            fontFamily="'Cinzel', serif"
            _hover={{ bg: "rgba(201, 162, 39, 0.1)" }}
          >
            Próximo
          </Button>
        </Flex>
      )}
    </Container>
  )
}