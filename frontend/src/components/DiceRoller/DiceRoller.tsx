"use client"

import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  Box,
  Text,
  VStack,
  HStack,
  Button,
  Input,
  Badge,
  Flex,
  Icon,
  useColorModeValue,
} from "@chakra-ui/react"
import { useEffect, useState, useCallback, useRef } from "react"
import { GiDiceTwentyFacesTwenty, GiPerspectiveDiceSixFacesRandom } from "react-icons/gi"

interface DiceRollerProps {
  isOpen: boolean
  onClose: () => void
  initialFormula?: string
}

interface DiceResult {
  formula: string
  rolls: { die: string; results: number[] }[]
  modifier: number
  total: number
}

// Parse dice formula like "2d6+5", "1d20-2", "3d8+2d6+10"
function parseDiceFormula(formula: string): { dice: { count: number; sides: number }[]; modifier: number } | null {
  const cleanFormula = formula.replace(/\s/g, "").toLowerCase()
  
  const diceRegex = /(\d+)d(\d+)/g
  const modifierRegex = /([+-]\d+)(?!d)/g
  
  const dice: { count: number; sides: number }[] = []
  let match
  
  while ((match = diceRegex.exec(cleanFormula)) !== null) {
    dice.push({
      count: parseInt(match[1], 10),
      sides: parseInt(match[2], 10),
    })
  }
  
  if (dice.length === 0) return null
  
  let modifier = 0
  const modMatches = cleanFormula.match(modifierRegex)
  if (modMatches) {
    modifier = modMatches.reduce((sum, mod) => sum + parseInt(mod, 10), 0)
  }
  
  return { dice, modifier }
}

// Roll dice and return results
function rollDice(parsed: { dice: { count: number; sides: number }[]; modifier: number }): DiceResult {
  const rolls: { die: string; results: number[] }[] = []
  let total = 0
  
  for (const die of parsed.dice) {
    const results: number[] = []
    for (let i = 0; i < die.count; i++) {
      const roll = Math.floor(Math.random() * die.sides) + 1
      results.push(roll)
      total += roll
    }
    rolls.push({ die: `d${die.sides}`, results })
  }
  
  total += parsed.modifier
  
  return {
    formula: `${parsed.dice.map(d => `${d.count}d${d.sides}`).join("+")}${parsed.modifier >= 0 ? (parsed.modifier > 0 ? `+${parsed.modifier}` : "") : parsed.modifier}`,
    rolls,
    modifier: parsed.modifier,
    total,
  }
}

// Get color for dice type
function getDiceColor(die: string): string {
  const colors: Record<string, string> = {
    d4: "red",
    d6: "teal",
    d8: "blue",
    d10: "green",
    d12: "yellow",
    d20: "purple",
    d100: "orange",
  }
  return colors[die] || "gray"
}

// Spinning number component - slot machine style
interface SpinningNumberProps {
  finalValue: number
  maxValue: number
  delay: number
  spinDuration: number
  onComplete?: () => void
}

const SpinningNumber = ({ finalValue, maxValue, delay, spinDuration, onComplete }: SpinningNumberProps) => {
  const [displayValue, setDisplayValue] = useState<number | null>(null)
  const [isSpinning, setIsSpinning] = useState(false)
  const [isComplete, setIsComplete] = useState(false)
  const onCompleteRef = useRef(onComplete)
  onCompleteRef.current = onComplete
  
  useEffect(() => {
    let cancelled = false
    let timeoutId: NodeJS.Timeout
    
    // Wait for delay before starting
    const startDelay = setTimeout(() => {
      if (cancelled) return
      
      setIsSpinning(true)
      const startTime = Date.now()
      
      const spin = () => {
        if (cancelled) return
        
        const elapsed = Date.now() - startTime
        const progress = Math.min(elapsed / spinDuration, 1)
        
        if (progress < 1) {
          // Show random number
          setDisplayValue(Math.floor(Math.random() * maxValue) + 1)
          // Slow down progressively - scale interval based on spin duration
          const baseInterval = Math.max(20, spinDuration / 30)
          const nextInterval = baseInterval + progress * baseInterval * 2
          timeoutId = setTimeout(spin, nextInterval)
        } else {
          // Done - show final value
          setDisplayValue(finalValue)
          setIsSpinning(false)
          setIsComplete(true)
          onCompleteRef.current?.()
        }
      }
      
      spin()
    }, delay)
    
    return () => {
      cancelled = true
      clearTimeout(startDelay)
      clearTimeout(timeoutId)
    }
  }, [finalValue, maxValue, delay, spinDuration])
  
  return (
    <Box
      position="relative"
      overflow="hidden"
      h="60px"
      w="60px"
      display="flex"
      alignItems="center"
      justifyContent="center"
    >
      {displayValue === null ? (
        <Text fontSize="2xl" color="gray.600">-</Text>
      ) : (
        <Text
          fontSize="2xl"
          fontWeight="bold"
          color={isComplete ? "dnd.gold" : "gray.400"}
          fontFamily="'Cinzel', serif"
          transform={isComplete ? "scale(1)" : "scale(0.9)"}
          transition={isComplete ? "all 0.2s ease-out" : "none"}
        >
          {displayValue}
        </Text>
      )}
    </Box>
  )
}

// Single die result display with spinning animation
interface DieResultProps {
  die: string
  results: number[]
  startDelay: number
  spinDuration: number
  delayPerDie: number
  onAllComplete?: () => void
}

const DieResult = ({ die, results, startDelay, spinDuration, delayPerDie, onAllComplete }: DieResultProps) => {
  const [completedCount, setCompletedCount] = useState(0)
  const maxValue = parseInt(die.replace("d", ""), 10)
  const onAllCompleteRef = useRef(onAllComplete)
  onAllCompleteRef.current = onAllComplete
  
  useEffect(() => {
    if (completedCount === results.length) {
      onAllCompleteRef.current?.()
    }
  }, [completedCount, results.length])
  
  return (
    <VStack spacing={1}>
      <Badge colorScheme={getDiceColor(die)} fontSize="xs" px={2}>
        {die}
      </Badge>
      <HStack spacing={2} flexWrap="wrap" justify="center">
        {results.map((result, index) => (
          <Box
            key={index}
            bg="rgba(0, 0, 0, 0.3)"
            borderRadius="md"
            borderWidth="2px"
            borderColor={completedCount > index ? "dnd.gold" : "rgba(201, 162, 39, 0.3)"}
            transition="border-color 0.3s"
          >
            <SpinningNumber
              finalValue={result}
              maxValue={maxValue}
              delay={startDelay + index * delayPerDie}
              spinDuration={spinDuration}
              onComplete={() => setCompletedCount(prev => prev + 1)}
            />
          </Box>
        ))}
      </HStack>
    </VStack>
  )
}

// Calculate dynamic timing based on dice count
// More dice = faster individual animations
function calculateTiming(totalDice: number): { spinDuration: number; delayPerDie: number; totalTime: number } {
  // Target total animation time: 2-4 seconds regardless of dice count
  const minTotalTime = 2000
  const maxTotalTime = 4000
  
  if (totalDice <= 1) {
    // Single die: full animation
    return { spinDuration: 1000, delayPerDie: 0, totalTime: 1500 }
  } else if (totalDice <= 3) {
    // 2-3 dice: comfortable pace
    const spinDuration = 800
    const delayPerDie = 400
    return { spinDuration, delayPerDie, totalTime: spinDuration + (totalDice - 1) * delayPerDie + 300 }
  } else if (totalDice <= 6) {
    // 4-6 dice: faster
    const spinDuration = 600
    const delayPerDie = 250
    return { spinDuration, delayPerDie, totalTime: spinDuration + (totalDice - 1) * delayPerDie + 300 }
  } else if (totalDice <= 12) {
    // 7-12 dice: quick
    const spinDuration = 400
    const delayPerDie = 150
    return { spinDuration, delayPerDie, totalTime: spinDuration + (totalDice - 1) * delayPerDie + 300 }
  } else {
    // 13+ dice: rapid fire
    const spinDuration = 300
    const delayPerDie = Math.max(50, 100 - (totalDice - 12) * 5) // Minimum 50ms between dice
    return { spinDuration, delayPerDie, totalTime: spinDuration + (totalDice - 1) * delayPerDie + 300 }
  }
}

const DiceRoller = ({ isOpen, onClose, initialFormula = "1d20" }: DiceRollerProps) => {
  const [formula, setFormula] = useState(initialFormula)
  const [result, setResult] = useState<DiceResult | null>(null)
  const [isRolling, setIsRolling] = useState(false)
  const [showTotal, setShowTotal] = useState(false)
  const [history, setHistory] = useState<DiceResult[]>([])
  const [timing, setTiming] = useState({ spinDuration: 1000, delayPerDie: 400, totalTime: 1500 })
  
  const bgColor = useColorModeValue("dnd.leather", "rgba(26, 26, 46, 0.95)")
  const textColor = useColorModeValue("dnd.parchment", "dnd.parchment")
  const inputBg = useColorModeValue("rgba(0, 0, 0, 0.2)", "rgba(0, 0, 0, 0.3)")
  
  // Reset when modal opens
  useEffect(() => {
    if (isOpen) {
      setFormula(initialFormula)
      setResult(null)
      setShowTotal(false)
    }
  }, [isOpen, initialFormula])
  
  // Handle roll
  const handleRoll = useCallback(() => {
    const parsed = parseDiceFormula(formula)
    if (!parsed) return
    
    setIsRolling(true)
    setShowTotal(false)
    
    // Count total dice
    let totalDice = 0
    for (const die of parsed.dice) {
      totalDice += die.count
    }
    
    // Calculate dynamic timing
    const newTiming = calculateTiming(totalDice)
    setTiming(newTiming)
    
    const diceResult = rollDice(parsed)
    setResult(diceResult)
    
    setTimeout(() => {
      setShowTotal(true)
      setIsRolling(false)
      setHistory(prev => [diceResult, ...prev.slice(0, 9)])
    }, newTiming.totalTime)
  }, [formula])
  
  const quickRolls = ["1d4", "1d6", "1d8", "1d10", "1d12", "1d20", "2d6", "1d100"]
  
  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl" isCentered>
      <ModalOverlay bg="blackAlpha.700" backdropFilter="blur(4px)" />
      <ModalContent bg={bgColor} borderColor="dnd.gold" borderWidth="2px" maxW="500px">
        <ModalHeader 
          color="dnd.gold" 
          fontFamily="'Cinzel Decorative', serif"
          display="flex"
          alignItems="center"
          gap={2}
        >
          <Icon as={GiPerspectiveDiceSixFacesRandom} />
          Dice Roller
        </ModalHeader>
        <ModalCloseButton color="dnd.gold" />
        <ModalBody pb={6}>
          <VStack spacing={4} align="stretch">
            {/* Formula Input */}
            <HStack>
              <Input
                value={formula}
                onChange={(e) => setFormula(e.target.value)}
                placeholder="Ex: 2d6+5, 1d20, 3d8+2d6+10"
                bg={inputBg}
                color={textColor}
                borderColor="rgba(201, 162, 39, 0.5)"
                _hover={{ borderColor: "dnd.gold" }}
                _focus={{ borderColor: "dnd.gold", boxShadow: "0 0 0 1px var(--chakra-colors-dnd-gold)" }}
                fontFamily="monospace"
                fontSize="lg"
                textAlign="center"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !isRolling) {
                    handleRoll()
                  }
                }}
              />
              <Button
                onClick={handleRoll}
                isLoading={isRolling}
                loadingText="..."
                bg="dnd.gold"
                color="dnd.ink"
                _hover={{ bg: "yellow.500" }}
                fontFamily="'Cinzel', serif"
                leftIcon={<Icon as={GiDiceTwentyFacesTwenty} />}
              >
                Roll!
              </Button>
            </HStack>
            
            {/* Quick Roll Buttons */}
            <Flex wrap="wrap" gap={2} justify="center">
              {quickRolls.map((qr) => (
                <Button
                  key={qr}
                  size="sm"
                  variant="outline"
                  borderColor="rgba(201, 162, 39, 0.5)"
                  color="dnd.gold"
                  _hover={{ bg: "rgba(201, 162, 39, 0.2)" }}
                  onClick={() => {
                    setFormula(qr)
                    setTimeout(() => {
                      const parsed = parseDiceFormula(qr)
                      if (parsed) {
                        setIsRolling(true)
                        setShowTotal(false)
                        
                        let totalDice = 0
                        for (const die of parsed.dice) {
                          totalDice += die.count
                        }
                        const newTiming = calculateTiming(totalDice)
                        setTiming(newTiming)
                        
                        const diceResult = rollDice(parsed)
                        setResult(diceResult)
                        
                        setTimeout(() => {
                          setShowTotal(true)
                          setIsRolling(false)
                          setHistory(prev => [diceResult, ...prev.slice(0, 9)])
                        }, newTiming.totalTime)
                      }
                    }, 50)
                  }}
                  isDisabled={isRolling}
                >
                  {qr}
                </Button>
              ))}
            </Flex>
            
            {/* Result Display */}
            {result && (
              <Box
                p={4}
                bg="rgba(0, 0, 0, 0.2)"
                borderRadius="md"
                borderWidth="1px"
                borderColor="rgba(201, 162, 39, 0.3)"
                minH="150px"
              >
                <VStack spacing={4}>
                  {/* Formula label */}
                  <Text color="gray.400" fontSize="sm">
                    {result.formula}
                  </Text>
                  
                  {/* Spinning dice results */}
                  <Flex wrap="wrap" gap={4} justify="center">
                    {result.rolls.map((roll, i) => {
                      let delay = 0
                      for (let j = 0; j < i; j++) {
                        delay += result.rolls[j].results.length * timing.delayPerDie
                      }
                      return (
                        <DieResult
                          key={i}
                          die={roll.die}
                          results={roll.results}
                          startDelay={delay}
                          spinDuration={timing.spinDuration}
                          delayPerDie={timing.delayPerDie}
                        />
                      )
                    })}
                    
                    {/* Modifier */}
                    {result.modifier !== 0 && (
                      <VStack spacing={1}>
                        <Badge colorScheme="blue" fontSize="xs" px={2}>
                          mod
                        </Badge>
                        <Box
                          bg="rgba(0, 0, 0, 0.3)"
                          borderRadius="md"
                          borderWidth="2px"
                          borderColor="blue.400"
                          h="60px"
                          w="60px"
                          display="flex"
                          alignItems="center"
                          justifyContent="center"
                        >
                          <Text
                            fontSize="2xl"
                            fontWeight="bold"
                            color="blue.400"
                            fontFamily="'Cinzel', serif"
                          >
                            {result.modifier > 0 ? `+${result.modifier}` : result.modifier}
                          </Text>
                        </Box>
                      </VStack>
                    )}
                  </Flex>
                  
                  {/* Total */}
                  <Box
                    opacity={showTotal ? 1 : 0}
                    transform={showTotal ? "scale(1)" : "scale(0.5)"}
                    transition="all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)"
                    pt={2}
                    borderTopWidth="1px"
                    borderTopColor="rgba(201, 162, 39, 0.3)"
                    w="full"
                    textAlign="center"
                  >
                    <Text color="gray.500" fontSize="xs" mb={1}>
                      TOTAL
                    </Text>
                    <Text
                      color="dnd.gold"
                      fontSize="4xl"
                      fontWeight="bold"
                      fontFamily="'Cinzel Decorative', serif"
                      textShadow="0 0 20px rgba(201, 162, 39, 0.5)"
                    >
                      {result.total}
                    </Text>
                  </Box>
                </VStack>
              </Box>
            )}
            
            {/* Empty state */}
            {!result && (
              <Box
                p={8}
                bg="rgba(0, 0, 0, 0.2)"
                borderRadius="md"
                borderWidth="1px"
                borderColor="rgba(201, 162, 39, 0.3)"
                textAlign="center"
              >
                <Icon 
                  as={GiPerspectiveDiceSixFacesRandom} 
                  fontSize="48px" 
                  color="rgba(201, 162, 39, 0.3)" 
                  mb={2}
                />
                <Text color="gray.500" fontSize="sm">
                  Digite uma fórmula e clique em Roll!
                </Text>
              </Box>
            )}
            
            {/* History */}
            {history.length > 0 && (
              <Box>
                <Text color="gray.500" fontSize="xs" mb={2}>
                  Histórico
                </Text>
                <Flex wrap="wrap" gap={2}>
                  {history.slice(0, 5).map((h, i) => (
                    <Badge
                      key={i}
                      variant="subtle"
                      colorScheme="gray"
                      fontSize="xs"
                      cursor="pointer"
                      onClick={() => setFormula(h.formula)}
                      _hover={{ bg: "rgba(201, 162, 39, 0.2)" }}
                    >
                      {h.formula} = {h.total}
                    </Badge>
                  ))}
                </Flex>
              </Box>
            )}
          </VStack>
        </ModalBody>
      </ModalContent>
    </Modal>
  )
}

export default DiceRoller
