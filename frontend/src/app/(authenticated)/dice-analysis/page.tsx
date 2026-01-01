"use client"

import {
  Box,
  Container,
  Heading,
  Text,
  VStack,
  HStack,
  Input,
  Button,
  Icon,
  Flex,
  Badge,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  SimpleGrid,
  useColorModeValue,
} from "@chakra-ui/react"
import { useState } from "react"
import { GiPerspectiveDiceSixFacesRandom, GiDiceTarget, GiChart, GiScrollUnfurled } from "react-icons/gi"
import { FiAlertTriangle } from "react-icons/fi"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts"

import { ToolsService, DiceProbabilityResult } from "../../../client"

export default function DiceAnalysisPage() {
  const [formula, setFormula] = useState<string>("2d6")
  const [result, setResult] = useState<DiceProbabilityResult | null>(null)
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  const bgColor = useColorModeValue("dnd.ink", "#0d0d1a")
  const cardBg = useColorModeValue("dnd.leather", "rgba(26, 26, 46, 0.9)")
  const textColor = useColorModeValue("dnd.parchment", "white")
  const inputBg = useColorModeValue("dnd.parchmentDark", "rgba(0, 0, 0, 0.3)")
  const statBg = useColorModeValue("rgba(74, 55, 40, 0.5)", "rgba(26, 26, 46, 0.7)")
  const chartBg = useColorModeValue("rgba(74, 55, 40, 0.3)", "rgba(26, 26, 46, 0.5)")
  const barColor = useColorModeValue("#C9A227", "#E6C84A")
  const modeBarColor = useColorModeValue("#8B0000", "#ff6b6b")
  const gridColor = useColorModeValue("rgba(201, 162, 39, 0.3)", "rgba(201, 162, 39, 0.2)")
  const tooltipLabelColor = useColorModeValue("#C9A227", "#E6C84A")
  const tooltipItemColor = useColorModeValue("#1A0F0A", "#F5E6D3")
  const tooltipBorderColor = useColorModeValue("#C9A227", "#E6C84A")

  const handleAnalyze = async () => {
    if (!formula.trim()) return

    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const data = await ToolsService.calculateDiceProbability(formula)
      setResult(data)
    } catch (err: any) {
      setError(err?.body?.detail || "Erro ao analisar fórmula")
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleAnalyze()
    }
  }

  // Prepare chart data
  const chartData = result?.probabilities.map((p) => ({
    value: p.value,
    percentage: p.percentage,
    probability: p.probability,
    isMode: p.value === result.mode,
  })) || []

  // Quick roll buttons
  const quickRolls = [
    "1d20",
    "2d6",
    "1d12",
    "3d6",
    "4d6",
    "1d20+5",
    "2d6+3",
    "8d6",
  ]

  return (
    <Container maxW="full" bg={bgColor} minH="100vh" p={4}>
      <VStack spacing={6} align="stretch">
        {/* Header */}
        <Box py={4}>
          <Heading
            size="lg"
            color="dnd.gold"
            fontFamily="'Cinzel Decorative', 'Cinzel', serif"
            display="flex"
            alignItems="center"
            gap={3}
          >
            <Icon as={GiPerspectiveDiceSixFacesRandom} />
            Dice Analysis
          </Heading>
          <Text color={textColor} mt={2} opacity={0.8}>
            Calcule a distribuição de probabilidade de qualquer rolagem de dados
          </Text>
        </Box>

        {/* Input Section */}
        <Box
          bg={cardBg}
          p={6}
          borderRadius="12px"
          borderWidth="2px"
          borderColor="dnd.gold"
        >
          <VStack spacing={4} align="stretch">
            <HStack spacing={4}>
              <Input
                value={formula}
                onChange={(e) => setFormula(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Digite a fórmula (ex: 2d6+3, 1d20+5)"
                bg={inputBg}
                color={textColor}
                borderColor="dnd.gold"
                _placeholder={{ color: "gray.500" }}
                _focus={{
                  borderColor: "dnd.goldLight",
                  boxShadow: "0 0 10px rgba(201, 162, 39, 0.3)",
                }}
                fontFamily="'Cinzel', serif"
                fontSize="lg"
                size="lg"
              />
              <Button
                onClick={handleAnalyze}
                variant="primary"
                fontFamily="'Cinzel', serif"
                px={8}
                size="lg"
                isLoading={loading}
                loadingText="Analisando..."
                leftIcon={<Icon as={GiDiceTarget} />}
              >
                Analisar
              </Button>
            </HStack>

            {/* Quick Roll Buttons */}
            <HStack spacing={2} flexWrap="wrap">
              <Text color={textColor} fontSize="sm" fontFamily="'Cinzel', serif">
                Rápido:
              </Text>
              {quickRolls.map((roll) => (
                <Badge
                  key={roll}
                  colorScheme="yellow"
                  variant="outline"
                  cursor="pointer"
                  px={3}
                  py={1}
                  borderRadius="full"
                  onClick={() => setFormula(roll)}
                  _hover={{
                    bg: "rgba(201, 162, 39, 0.2)",
                    transform: "scale(1.05)",
                  }}
                  transition="all 0.2s"
                >
                  {roll}
                </Badge>
              ))}
            </HStack>
          </VStack>
        </Box>

        {/* Error Message */}
        {error && (
          <Box
            bg="red.900"
            p={4}
            borderRadius="8px"
            borderWidth="1px"
            borderColor="red.500"
          >
            <HStack spacing={2}>
              <Icon as={FiAlertTriangle} color="red.300" />
              <Text color="red.200" fontFamily="'Cinzel', serif">
                {error}
              </Text>
            </HStack>
          </Box>
        )}

        {/* Results Section */}
        {result && (
          <VStack spacing={6} align="stretch">
            {/* Stats */}
            <SimpleGrid columns={{ base: 2, md: 4 }} spacing={4}>
              <Box bg={statBg} p={4} borderRadius="8px" borderWidth="1px" borderColor="rgba(201, 162, 39, 0.3)">
                <Stat>
                  <StatLabel color="gray.400" fontFamily="'Cinzel', serif">
                    Fórmula
                  </StatLabel>
                  <StatNumber color="dnd.gold" fontFamily="'Cinzel', serif" fontSize="xl">
                    {result.formula}
                  </StatNumber>
                </Stat>
              </Box>

              <Box bg={statBg} p={4} borderRadius="8px" borderWidth="1px" borderColor="rgba(201, 162, 39, 0.3)">
                <Stat>
                  <StatLabel color="gray.400" fontFamily="'Cinzel', serif">
                    Intervalo
                  </StatLabel>
                  <StatNumber color={textColor} fontFamily="'Cinzel', serif" fontSize="xl">
                    {result.min_value} - {result.max_value}
                  </StatNumber>
                </Stat>
              </Box>

              <Box bg={statBg} p={4} borderRadius="8px" borderWidth="1px" borderColor="rgba(201, 162, 39, 0.3)">
                <Stat>
                  <StatLabel color="gray.400" fontFamily="'Cinzel', serif">
                    Média
                  </StatLabel>
                  <StatNumber color={textColor} fontFamily="'Cinzel', serif" fontSize="xl">
                    {result.mean.toFixed(2)}
                  </StatNumber>
                  <StatHelpText color="gray.500">
                    σ = {result.std_dev.toFixed(2)}
                  </StatHelpText>
                </Stat>
              </Box>

              <Box bg={statBg} p={4} borderRadius="8px" borderWidth="1px" borderColor="rgba(201, 162, 39, 0.3)">
                <Stat>
                  <StatLabel color="gray.400" fontFamily="'Cinzel', serif">
                    Moda
                  </StatLabel>
                  <StatNumber color={modeBarColor} fontFamily="'Cinzel', serif" fontSize="xl">
                    {result.mode}
                  </StatNumber>
                  <StatHelpText color="gray.500">
                    {(result.mode_probability * 100).toFixed(2)}%
                  </StatHelpText>
                </Stat>
              </Box>
            </SimpleGrid>

            {/* Chart */}
            <Box
              bg={cardBg}
              p={6}
              borderRadius="12px"
              borderWidth="2px"
              borderColor="dnd.gold"
            >
              <HStack spacing={2}>
                <Icon as={GiChart} color="dnd.gold" />
                <Text
                  color="dnd.gold"
                  fontFamily="'Cinzel', serif"
                  fontWeight="bold"
                  fontSize="lg"
                >
                  Distribuição de Probabilidade
                </Text>
              </HStack>
              <Box bg={chartBg} borderRadius="8px" p={4} h="400px">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={chartData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                    <XAxis
                      dataKey="value"
                      stroke={textColor}
                      tick={{ fill: textColor, fontSize: 12 }}
                      label={{
                        value: "Resultado",
                        position: "insideBottom",
                        offset: -10,
                        fill: textColor,
                        fontFamily: "'Cinzel', serif",
                      }}
                    />
                    <YAxis
                      stroke={textColor}
                      tick={{ fill: textColor, fontSize: 12 }}
                      label={{
                        value: "Probabilidade (%)",
                        angle: -90,
                        position: "insideLeft",
                        fill: textColor,
                        fontFamily: "'Cinzel', serif",
                      }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: cardBg,
                        border: `1px solid ${tooltipBorderColor}`,
                        borderRadius: "8px",
                        fontFamily: "'Cinzel', serif",
                      }}
                      labelStyle={{ color: tooltipLabelColor }}
                      itemStyle={{ color: tooltipItemColor }}
                      formatter={(value: number | undefined) => [
                        value !== undefined ? `${value.toFixed(4)}%` : "N/A",
                        "Probabilidade",
                      ]}
                      labelFormatter={(label) => `Resultado: ${label}`}
                    />
                    <Bar dataKey="percentage" name="Probabilidade">
                      {chartData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={entry.isMode ? modeBarColor : barColor}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </Box>
              <Text color="gray.500" fontSize="sm" mt={2} textAlign="center">
                A barra em <Text as="span" color={modeBarColor} fontWeight="bold">destaque</Text> indica a moda (resultado mais provável)
              </Text>
            </Box>

            {/* Probability Table */}
            <Box
              bg={cardBg}
              p={6}
              borderRadius="12px"
              borderWidth="2px"
              borderColor="dnd.gold"
              maxH="300px"
              overflowY="auto"
            >
              <HStack spacing={2} mb={4}>
                <Icon as={GiScrollUnfurled} color="dnd.gold" />
                <Text
                  color="dnd.gold"
                  fontFamily="'Cinzel', serif"
                  fontWeight="bold"
                  fontSize="lg"
                >
                  Tabela de Probabilidades
                </Text>
              </HStack>
              <SimpleGrid columns={{ base: 3, md: 6 }} spacing={2}>
                {result.probabilities.map((p) => (
                  <Box
                    key={p.value}
                    bg={p.value === result.mode ? "rgba(139, 0, 0, 0.3)" : statBg}
                    p={2}
                    borderRadius="6px"
                    borderWidth="1px"
                    borderColor={
                      p.value === result.mode
                        ? modeBarColor
                        : "rgba(201, 162, 39, 0.2)"
                    }
                    textAlign="center"
                  >
                    <Text
                      color={p.value === result.mode ? modeBarColor : "dnd.gold"}
                      fontWeight="bold"
                      fontFamily="'Cinzel', serif"
                    >
                      {p.value}
                    </Text>
                    <Text color={textColor} fontSize="sm">
                      {p.percentage.toFixed(2)}%
                    </Text>
                  </Box>
                ))}
              </SimpleGrid>
            </Box>
          </VStack>
        )}
      </VStack>
    </Container>
  )
}
