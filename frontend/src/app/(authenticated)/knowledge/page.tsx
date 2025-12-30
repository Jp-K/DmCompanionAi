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
  Badge,
  Spinner,
  InputGroup,
  InputLeftElement,
  Tabs,
  TabList,
  TabPanels,
  TabPanel,
  Tab,
  Divider,
  useColorModeValue,
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
import { FiSearch, FiChevronLeft, FiChevronRight } from "react-icons/fi"

import { KnowledgeService, type CategoryType, type KnowledgeItem, type StatsResponse } from "../../../client"

marked.setOptions({
  gfm: true,
  breaks: true,
})

// Verifica se um valor é código de livro/fonte (ex: XPHB, PHB, DMG, MM)
function isSourceCode(value: string): boolean {
  return /^[A-Z]{2,6}(\d{0,2})?$/.test(value)
}

// Verifica se parece ser parâmetro de filtro (ex: level=0;1, class=Cleric)
function isFilterParam(value: string): boolean {
  return /^[a-z]+=/.test(value)
}

// Extrai o texto de exibição correto do padrão 5e-tools
// Formato: {@type nome|fonte} ou {@type nome|fonte|textoExibido}
// Para @filter: {@filter displayText|source|param1|param2...}
// Para @book: {@book displayText|source|chapter|section}
function extractDisplayText(type: string, value: string, parts: string[]): string {
  // Para @filter, sempre usa a primeira parte (é o texto de exibição)
  if (type === "filter") {
    return parts[0].trim()
  }
  
  // Para @book: formato é {@book displayText|source|chapter|section}
  // Onde chapter pode ser numérico - sempre usar a primeira parte
  if (type === "book") {
    return parts[0].trim()
  }
  
  // Para @quickref: formato é {@quickref displayText|source|chapter|section|displayOverride}
  // Se há 5 partes, usa a última; senão usa a primeira
  if (type === "quickref") {
    if (parts.length >= 5 && parts[4]) {
      return parts[4].trim()
    }
    return parts[0].trim()
  }
  
  // Se há 3+ partes: verifica se a terceira não é parâmetro de filtro
  if (parts.length >= 3 && parts[2] && !isFilterParam(parts[2])) {
    return parts[2].trim()
  }
  
  // Se há 2 partes: nome|fonte -> usa nome (ignora fonte se for código de livro ou parâmetro)
  if (parts.length >= 2 && parts[1]) {
    const secondPart = parts[1].trim()
    // Se a segunda parte é código de livro ou parâmetro de filtro, usa a primeira parte
    if (isSourceCode(secondPart) || isFilterParam(secondPart)) {
      return parts[0].trim()
    }
    // Se não, pode ser display text
    return secondPart
  }
  
  // Apenas uma parte: usa ela
  return value.trim()
}

// Função para formatar referências no texto
function formatDescription(text: string): React.ReactNode[] {
  if (!text) return []
  
  // Regex mais robusto para capturar padrões como {@type value}, {@type value|source}, {@type value|source|display}
  // Também captura {{@type value}}
  const regex = /\{\{?@(\w+)\s+([^{}]+?)\}?\}/g
  
  const parts: React.ReactNode[] = []
  let lastIndex = 0
  let match
  let keyIndex = 0
  
  while ((match = regex.exec(text)) !== null) {
    // Adiciona texto antes do match
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index))
    }
    
    const type = match[1].toLowerCase()
    const rawValue = match[2].trim()
    
    // Divide o valor em partes pelo separador |
    const valueParts = rawValue.split("|")
    const displayText = extractDisplayText(type, rawValue, valueParts)
    
    // Cria texto destacado com cor diferente
    parts.push(
      <Text
        key={`ref-${keyIndex++}`}
        as="span"
        color="dnd.gold"
        fontWeight="semibold"
      >
        {displayText}
      </Text>
    )
    
    lastIndex = match.index + match[0].length
  }
  
  // Adiciona o resto do texto
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex))
  }
  
  return parts.length > 0 ? parts : [text]
}

const categories: { key: CategoryType; label: string; icon: any; color: string }[] = [
  { key: "spell", label: "Magias", icon: GiSpellBook, color: "purple" },
  { key: "rule", label: "Regras", icon: GiScrollUnfurled, color: "blue" },
  { key: "item", label: "Itens", icon: GiSwordman, color: "orange" },
  { key: "action", label: "Ações", icon: GiRunningNinja, color: "red" },
  { key: "background", label: "Antecedentes", icon: GiLightBackpack, color: "green" },
  { key: "deity", label: "Divindades", icon: GiHolyGrail, color: "yellow" },
  { key: "race", label: "Raças", icon: GiCrownedSkull, color: "cyan" },
  { key: "feat", label: "Talentos", icon: GiFeather, color: "pink" },
]

interface ListItemProps {
  item: KnowledgeItem
  isSelected: boolean
  onClick: () => void
  category: CategoryType
}

// Helper to format spell level
const formatSpellLevel = (level: number | null | undefined): string => {
  if (level === null || level === undefined) return ""
  if (level === 0) return "Truque"
  const ordinal = { 1: "1º", 2: "2º", 3: "3º", 4: "4º", 5: "5º", 6: "6º", 7: "7º", 8: "8º", 9: "9º" }
  return ordinal[level as keyof typeof ordinal] || `${level}º`
}

// Helper to format school name
const formatSchool = (school: string | null | undefined): string => {
  if (!school) return ""
  const schools: Record<string, string> = {
    "A": "Abjuração", "C": "Conjuração", "D": "Adivinhação",
    "E": "Encantamento", "V": "Evocação", "I": "Ilusão",
    "N": "Necromancia", "T": "Transmutação"
  }
  return schools[school] || school
}

// Helper to format rarity
const formatRarity = (rarity: string | null | undefined): string => {
  if (!rarity || rarity === "none") return ""
  const rarities: Record<string, string> = {
    "common": "Comum", "uncommon": "Incomum", "rare": "Raro",
    "very rare": "Muito Raro", "legendary": "Lendário", "artifact": "Artefato"
  }
  return rarities[rarity] || rarity
}

const rarityColors: Record<string, string> = {
  "common": "gray", "uncommon": "green", "rare": "blue",
  "very rare": "purple", "legendary": "orange", "artifact": "red"
}

const ListItem = ({ item, isSelected, onClick, category }: ListItemProps) => {
  const categoryData = categories.find(c => c.key === category)
  const itemBg = useColorModeValue("transparent", "transparent")
  const selectedBg = useColorModeValue("rgba(201, 162, 39, 0.2)", "rgba(201, 162, 39, 0.15)")
  const hoverBg = useColorModeValue("rgba(201, 162, 39, 0.15)", "rgba(201, 162, 39, 0.1)")
  const textColor = useColorModeValue("dnd.parchment", "dnd.parchment")
  
  // Get category-specific info
  const getExtraInfo = () => {
    switch (category) {
      case "spell":
        const level = formatSpellLevel(item.level)
        const school = formatSchool(item.school)
        return level || school ? `${level}${level && school ? " • " : ""}${school}` : null
      case "item":
        return formatRarity(item.rarity) || null
      case "rule":
        return item.section || null
      default:
        return null
    }
  }
  
  const extraInfo = getExtraInfo()
  
  return (
    <Box
      p={3}
      cursor="pointer"
      bg={isSelected ? selectedBg : itemBg}
      borderLeftWidth="3px"
      borderLeftColor={isSelected ? "dnd.gold" : "transparent"}
      transition="all 0.15s"
      _hover={{
        bg: hoverBg,
      }}
      onClick={onClick}
    >
      <Flex justify="space-between" align="flex-start">
        <Text
          color={isSelected ? "dnd.gold" : textColor}
          fontFamily="'Cinzel', serif"
          fontWeight={isSelected ? "bold" : "medium"}
          fontSize="sm"
          noOfLines={1}
          flex={1}
        >
          {item.title || "Sem título"}
        </Text>
        {category === "spell" && item.level !== null && item.level !== undefined && (
          <Badge 
            colorScheme={item.level === 0 ? "gray" : "purple"} 
            fontSize="2xs" 
            borderRadius="full"
            ml={2}
          >
            {item.level === 0 ? "T" : item.level}
          </Badge>
        )}
        {category === "item" && item.rarity && item.rarity !== "none" && (
          <Badge 
            colorScheme={rarityColors[item.rarity] || "gray"} 
            fontSize="2xs" 
            borderRadius="full"
            ml={2}
          >
            {formatRarity(item.rarity)}
          </Badge>
        )}
      </Flex>
      <HStack spacing={2} mt={1}>
        <Text color="gray.500" fontSize="xs" noOfLines={1}>
          {extraInfo && `${extraInfo} • `}
          {item.source && `${item.source}`}
          {item.page && ` p.${item.page}`}
        </Text>
        {item.score && (
          <Badge colorScheme="green" fontSize="2xs" borderRadius="full">
            {(item.score * 100).toFixed(0)}%
          </Badge>
        )}
      </HStack>
    </Box>
  )
}

interface DetailCardProps {
  item: KnowledgeItem | null
  category: CategoryType
}

const DetailCard = ({ item, category }: DetailCardProps) => {
  const categoryData = categories.find(c => c.key === category)
  const CategoryIcon = categoryData?.icon || GiBookmarklet
  const cardBg = useColorModeValue("dnd.leather", "rgba(26, 26, 46, 0.9)")
  const emptyBg = useColorModeValue("rgba(74, 55, 40, 0.5)", "rgba(26, 26, 46, 0.5)")
  const headerBg = useColorModeValue("rgba(201, 162, 39, 0.15)", "rgba(201, 162, 39, 0.1)")
  const sectionBg = useColorModeValue("rgba(0, 0, 0, 0.1)", "rgba(0, 0, 0, 0.2)")
  const textColor = useColorModeValue("dnd.parchment", "dnd.parchment")
  
  if (!item) {
    return (
      <Flex 
        h="100%" 
        align="center" 
        justify="center"
        bg={emptyBg}
        borderRadius="md"
        borderWidth="1px"
        borderColor="rgba(201, 162, 39, 0.2)"
      >
        <VStack spacing={4}>
          <Icon as={GiMagicSwirl} fontSize="48px" color="gray.600" />
          <Text color="gray.500" fontFamily="'Cinzel', serif">
            Selecione um item para visualizar
          </Text>
        </VStack>
      </Flex>
    )
  }

  // Helper to render spell info row
  const SpellInfoRow = ({ label, value }: { label: string; value: string | null | undefined }) => {
    if (!value) return null
    return (
      <Flex justify="space-between" py={1} borderBottomWidth="1px" borderBottomColor="rgba(201, 162, 39, 0.1)">
        <Text color="gray.400" fontSize="xs" fontWeight="semibold">{label}</Text>
        <Text color={textColor} fontSize="xs" textAlign="right" maxW="60%">{value}</Text>
      </Flex>
    )
  }
  
  return (
    <Box
      h="100%"
      bg={cardBg}
      borderRadius="md"
      borderWidth="1px"
      borderColor="dnd.gold"
      overflow="hidden"
    >
      {/* Header */}
      <Box
        p={4}
        bg={headerBg}
        borderBottomWidth="1px"
        borderBottomColor="rgba(201, 162, 39, 0.3)"
      >
        <HStack spacing={3} mb={2}>
          <Icon 
            as={CategoryIcon} 
            color={`${categoryData?.color}.400`} 
            fontSize="28px" 
          />
          <VStack align="start" spacing={0} flex={1}>
            <HStack spacing={2} align="center">
              <Text
                color="dnd.gold"
                fontFamily="'Cinzel Decorative', 'Cinzel', serif"
                fontWeight="bold"
                fontSize="lg"
              >
                {item.title || "Sem título"}
              </Text>
              {/* Ritual/Concentration tags for spells */}
              {category === "spell" && item.ritual && (
                <Badge colorScheme="cyan" fontSize="2xs" borderRadius="full">R</Badge>
              )}
              {category === "spell" && item.concentration && (
                <Badge colorScheme="yellow" fontSize="2xs" borderRadius="full">C</Badge>
              )}
            </HStack>
            <HStack spacing={2} flexWrap="wrap" mt={1}>
              {/* Spell level and school combined */}
              {category === "spell" && (
                <Text color="gray.400" fontSize="sm" fontStyle="italic">
                  {item.level === 0 ? "Cantrip" : `Level ${item.level}`}
                  {item.school && ` ${item.school}`}
                </Text>
              )}
              {/* Item-specific badges */}
              {category === "item" && item.rarity && item.rarity !== "none" && (
                <Badge colorScheme={rarityColors[item.rarity] || "gray"} fontSize="xs" borderRadius="full">
                  {formatRarity(item.rarity)}
                </Badge>
              )}
              {category === "item" && item.type && (
                <Badge colorScheme="orange" fontSize="xs" borderRadius="full">
                  {item.type}
                </Badge>
              )}
              {/* Rule-specific badges */}
              {category === "rule" && item.section && (
                <Badge colorScheme="blue" fontSize="xs" borderRadius="full">
                  {item.section}
                </Badge>
              )}
              {/* Feat-specific info */}
              {category === "feat" && item.feat_category && (
                <Text color="gray.400" fontSize="sm" fontStyle="italic">
                  {item.feat_category}
                </Text>
              )}
              {item.score && (
                <Badge colorScheme="green" fontSize="xs" borderRadius="full" ml={2}>
                  {(item.score * 100).toFixed(0)}% relevância
                </Badge>
              )}
            </HStack>
          </VStack>
        </HStack>
      </Box>

      {/* Spell Stats Grid */}
      {category === "spell" && (
        <Box
          px={4}
          py={3}
          bg={sectionBg}
          borderBottomWidth="1px"
          borderBottomColor="rgba(201, 162, 39, 0.2)"
        >
          <VStack spacing={0} align="stretch">
            <SpellInfoRow label="Casting Time" value={item.casting_time} />
            <SpellInfoRow label="Range" value={item.range} />
            <SpellInfoRow label="Components" value={
              item.components && item.material 
                ? `${item.components} (${item.material})`
                : item.components
            } />
            <SpellInfoRow label="Duration" value={item.duration} />
          </VStack>
        </Box>
      )}

      {/* Feat Info Section */}
      {category === "feat" && (item.prerequisites || item.ability_increase) && (
        <Box
          px={4}
          py={3}
          bg={sectionBg}
          borderBottomWidth="1px"
          borderBottomColor="rgba(201, 162, 39, 0.2)"
        >
          <VStack spacing={0} align="stretch">
            <SpellInfoRow label="Prerequisites" value={item.prerequisites} />
            <SpellInfoRow label="Ability Increase" value={item.ability_increase} />
          </VStack>
        </Box>
      )}
      
      {/* Content */}
      <Box
        p={4}
        maxH={category === "spell" || category === "feat" ? "calc(100vh - 450px)" : "calc(100vh - 350px)"}
        overflowY="auto"
        css={css`
          &::-webkit-scrollbar {
            width: 6px;
          }
          &::-webkit-scrollbar-track {
            background: rgba(0, 0, 0, 0.2);
          }
          &::-webkit-scrollbar-thumb {
            background: rgba(201, 162, 39, 0.5);
            border-radius: 3px;
          }
        `}
      >
        <Text 
          color={textColor} 
          fontSize="sm" 
          whiteSpace="pre-wrap"
          lineHeight="1.8"
        >
          {formatDescription(item.description || item.document || "Sem descrição disponível.")}
        </Text>

        {/* Higher Level section for spells */}
        {category === "spell" && item.higher_level && (
          <Box mt={4} pt={3} borderTopWidth="1px" borderTopColor="rgba(201, 162, 39, 0.2)">
            <Text color="dnd.gold" fontSize="sm" fontWeight="bold" mb={2}>
              At Higher Levels
            </Text>
            <Text color={textColor} fontSize="sm" lineHeight="1.8">
              {formatDescription(item.higher_level)}
            </Text>
          </Box>
        )}

        {/* Source info */}
        <HStack spacing={4} fontSize="xs" color="gray.500" mt={4} pt={3} borderTopWidth="1px" borderTopColor="rgba(201, 162, 39, 0.1)">
          {item.source && <Text>Source: {item.source}</Text>}
          {item.page && <Text>Page {item.page}</Text>}
        </HStack>
      </Box>
    </Box>
  )
}

interface CategoryPanelProps {
  category: CategoryType
  searchQuery: string
  isSearchMode: boolean
}

const CategoryPanel = ({ category, searchQuery, isSearchMode }: CategoryPanelProps) => {
  const [selectedItem, setSelectedItem] = useState<KnowledgeItem | null>(null)
  const [currentPage, setCurrentPage] = useState(0)
  const itemsPerPage = 20
  const panelBg = useColorModeValue("dnd.leather", "rgba(26, 26, 46, 0.7)")
  const sectionBg = useColorModeValue("rgba(0, 0, 0, 0.1)", "rgba(0, 0, 0, 0.2)")
  const textColor = useColorModeValue("dnd.parchment", "dnd.parchment")

  // List query - key includes itemsPerPage to ensure proper caching
  const { 
    data: listData, 
    isLoading: listLoading,
    isFetching: listFetching,
    refetch: refetchList,
  } = useQuery({
    queryKey: ["knowledge-list", category, currentPage, itemsPerPage],
    queryFn: async () => {
      const result = await KnowledgeService.listItems({
        category,
        limit: itemsPerPage,
        offset: currentPage * itemsPerPage,
      })
      return result
    },
    enabled: !isSearchMode,
    staleTime: 30000, // 30 seconds
  })

  // Search query
  const { 
    data: searchData, 
    isLoading: searchLoading,
    isFetching: searchFetching,
  } = useQuery({
    queryKey: ["knowledge-search", searchQuery, category],
    queryFn: () => KnowledgeService.search({
      q: searchQuery,
      category,
      limit: 50,
    }),
    enabled: isSearchMode && searchQuery.length >= 2,
    staleTime: 30000,
  })

  const isLoading = isSearchMode ? searchLoading : listLoading
  const isFetching = isSearchMode ? searchFetching : listFetching
  const items = isSearchMode ? searchData?.items : listData?.items
  const total = isSearchMode ? (searchData?.items?.length || 0) : (listData?.total || 0)
  const hasMore = !isSearchMode && (listData?.has_more || false)
  const totalPages = Math.ceil(total / itemsPerPage)

  // Select first item when items change
  useEffect(() => {
    if (items && items.length > 0) {
      setSelectedItem(items[0])
    } else {
      setSelectedItem(null)
    }
  }, [items])

  // Handle page change
  const handlePrevPage = () => {
    if (currentPage > 0) {
      setCurrentPage(prev => prev - 1)
    }
  }

  const handleNextPage = () => {
    if (hasMore) {
      setCurrentPage(prev => prev + 1)
    }
  }

  return (
    <Flex h="calc(100vh - 280px)" gap={4}>
      {/* Left: List */}
      <Box
        w={{ base: "100%", lg: "40%" }}
        bg={panelBg}
        borderRadius="md"
        borderWidth="1px"
        borderColor="rgba(201, 162, 39, 0.3)"
        overflow="hidden"
        display="flex"
        flexDirection="column"
      >
        {/* List header */}
        <Box
          p={3}
          borderBottomWidth="1px"
          borderBottomColor="rgba(201, 162, 39, 0.2)"
          bg={sectionBg}
        >
          <Flex justify="space-between" align="center">
            <Text color={textColor} fontSize="sm">
              {isSearchMode 
                ? `${total} resultados`
                : `${total} itens`
              }
            </Text>
            {isFetching && <Spinner size="xs" color="dnd.gold" />}
          </Flex>
        </Box>
        
        {/* List content */}
        <Box
          flex={1}
          overflowY="auto"
          css={css`
            &::-webkit-scrollbar {
              width: 6px;
            }
            &::-webkit-scrollbar-track {
              background: rgba(0, 0, 0, 0.2);
            }
            &::-webkit-scrollbar-thumb {
              background: rgba(201, 162, 39, 0.5);
              border-radius: 3px;
            }
          `}
        >
          {isLoading ? (
            <Flex justify="center" py={8}>
              <VStack spacing={3}>
                <Spinner size="lg" color="dnd.gold" thickness="3px" />
                <Text color="gray.500" fontSize="sm">Carregando...</Text>
              </VStack>
            </Flex>
          ) : items && items.length > 0 ? (
            <VStack spacing={0} align="stretch" divider={<Divider borderColor="rgba(201, 162, 39, 0.1)" />}>
              {items.map((item, index) => (
                <ListItem
                  key={item.id || index}
                  item={item}
                  isSelected={selectedItem?.id === item.id || (selectedItem?.title === item.title && !item.id)}
                  onClick={() => setSelectedItem(item)}
                  category={category}
                />
              ))}
            </VStack>
          ) : (
            <Flex justify="center" py={8}>
              <Text color="gray.500" fontSize="sm">
                {isSearchMode 
                  ? "Nenhum resultado encontrado"
                  : "Nenhum item nesta categoria"
                }
              </Text>
            </Flex>
          )}
        </Box>
        
        {/* Pagination */}
        {!isSearchMode && total > itemsPerPage && (
          <Box
            p={2}
            borderTopWidth="1px"
            borderTopColor="rgba(201, 162, 39, 0.2)"
            bg={sectionBg}
          >
            <Flex justify="space-between" align="center">
              <Button
                size="xs"
                variant="ghost"
                color="dnd.gold"
                leftIcon={<FiChevronLeft />}
                onClick={handlePrevPage}
                isDisabled={currentPage === 0 || isFetching}
              >
                Ant.
              </Button>
              <Text color={textColor} fontSize="xs">
                {currentPage + 1} / {totalPages}
              </Text>
              <Button
                size="xs"
                variant="ghost"
                color="dnd.gold"
                rightIcon={<FiChevronRight />}
                onClick={handleNextPage}
                isDisabled={!hasMore || isFetching}
              >
                Próx.
              </Button>
            </Flex>
          </Box>
        )}
      </Box>
      
      {/* Right: Detail */}
      <Box
        w={{ base: "0", lg: "60%" }}
        display={{ base: "none", lg: "block" }}
      >
        <DetailCard item={selectedItem} category={category} />
      </Box>
    </Flex>
  )
}

export default function KnowledgePage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [isSearchMode, setIsSearchMode] = useState(false)
  const [activeTab, setActiveTab] = useState(0)
  const inputBg = useColorModeValue("rgba(0, 0, 0, 0.2)", "rgba(0, 0, 0, 0.3)")
  const inputTextColor = useColorModeValue("dnd.parchment", "dnd.parchment")
  const tabBg = useColorModeValue("dnd.leather", "rgba(26, 26, 46, 0.7)")
  const textColor = useColorModeValue("dnd.parchment", "dnd.parchment")

  // Stats query
  const { data: stats } = useQuery<StatsResponse>({
    queryKey: ["knowledge-stats"],
    queryFn: () => KnowledgeService.getStats(),
  })

  // Handle search
  const handleSearch = () => {
    if (searchQuery.trim().length >= 2) {
      setIsSearchMode(true)
    }
  }

  // Handle clear search
  const handleClearSearch = () => {
    setSearchQuery("")
    setIsSearchMode(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch()
    } else if (e.key === "Escape") {
      handleClearSearch()
    }
  }

  return (
    <Container maxW="full" py={4} px={{ base: 4, md: 6 }}>
      {/* Header */}
      <Flex align="center" justify="space-between" mb={4}>
        <HStack spacing={3}>
          <Icon as={GiBookmarklet} fontSize="28px" color="dnd.gold" />
          <Heading
            size="md"
            color="dnd.gold"
            fontFamily="'Cinzel Decorative', 'Cinzel', serif"
          >
            Compêndio
          </Heading>
        </HStack>
        
        {/* Search */}
        <HStack spacing={2} w={{ base: "full", md: "400px" }}>
          <InputGroup size="sm">
            <InputLeftElement pointerEvents="none">
              <Icon as={FiSearch} color="dnd.gold" fontSize="14px" />
            </InputLeftElement>
            <Input
              placeholder="Pesquisar..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              bg={inputBg}
              borderColor="rgba(201, 162, 39, 0.5)"
              color={inputTextColor}
              _placeholder={{ color: "gray.500" }}
              _hover={{ borderColor: "dnd.gold" }}
              _focus={{ borderColor: "dnd.gold", boxShadow: "0 0 0 1px var(--chakra-colors-dnd-gold)" }}
            />
          </InputGroup>
          {isSearchMode && (
            <Button
              size="sm"
              variant="ghost"
              color="dnd.gold"
              onClick={handleClearSearch}
              fontSize="xs"
            >
              Limpar
            </Button>
          )}
        </HStack>
      </Flex>

      {/* Tabs */}
      <Tabs 
        index={activeTab} 
        onChange={setActiveTab}
        variant="unstyled"
        isLazy
      >
        <TabList
          bg={tabBg}
          borderRadius="md"
          borderWidth="1px"
          borderColor="rgba(201, 162, 39, 0.3)"
          p={1}
          gap={1}
          overflowX="auto"
          css={css`
            &::-webkit-scrollbar {
              height: 4px;
            }
            &::-webkit-scrollbar-track {
              background: transparent;
            }
            &::-webkit-scrollbar-thumb {
              background: rgba(201, 162, 39, 0.3);
              border-radius: 2px;
            }
          `}
        >
          {categories.map((cat, index) => {
            const count = stats?.[cat.key as keyof StatsResponse] as number || 0
            return (
              <Tab
                key={cat.key}
                px={3}
                py={2}
                borderRadius="md"
                color={textColor}
                fontFamily="'Cinzel', serif"
                fontSize="sm"
                fontWeight="medium"
                whiteSpace="nowrap"
                transition="all 0.15s"
                _selected={{
                  bg: "rgba(201, 162, 39, 0.2)",
                  color: "dnd.gold",
                  fontWeight: "bold",
                }}
                _hover={{
                  bg: "rgba(201, 162, 39, 0.1)",
                }}
              >
                <HStack spacing={2}>
                  <Icon as={cat.icon} fontSize="16px" />
                  <Text>{cat.label}</Text>
                  <Badge
                    colorScheme={cat.color}
                    fontSize="2xs"
                    borderRadius="full"
                    ml={1}
                  >
                    {count}
                  </Badge>
                </HStack>
              </Tab>
            )
          })}
        </TabList>

        <TabPanels mt={4}>
          {categories.map((cat) => (
            <TabPanel key={cat.key} p={0}>
              <CategoryPanel
                category={cat.key}
                searchQuery={searchQuery}
                isSearchMode={isSearchMode}
              />
            </TabPanel>
          ))}
        </TabPanels>
      </Tabs>
    </Container>
  )
}