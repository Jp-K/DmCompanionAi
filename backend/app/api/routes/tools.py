import re
from typing import Any

import numpy as np
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

router = APIRouter(prefix="/tools", tags=["tools"])


class DiceFormulaRequest(BaseModel):
    formula: str


class DiceProbabilityResult(BaseModel):
    formula: str
    min_value: int
    max_value: int
    mean: float
    std_dev: float
    mode: int
    mode_probability: float
    probabilities: list[dict[str, Any]]  # [{value: int, probability: float, cumulative: float}]


def parse_dice_formula(formula: str) -> tuple[list[tuple[int, int]], int]:
    """
    Parse a dice formula string into dice groups and modifier.
    
    Examples:
        "2d6+3" -> ([(2, 6)], 3)
        "1d20+2d6-5" -> ([(1, 20), (2, 6)], -5)
        "3d8+1d4+2" -> ([(3, 8), (1, 4)], 2)
    
    Returns:
        Tuple of (list of (count, sides) tuples, modifier)
    """
    formula = formula.replace(" ", "").lower()
    
    dice_pattern = r'([+-]?)(\d*)d(\d+)'
    modifier_pattern = r'([+-])(\d+)(?!d)'
    
    dice_groups = []
    total_modifier = 0
    
    # Find all dice groups
    for match in re.finditer(dice_pattern, formula):
        sign = match.group(1)
        count = int(match.group(2)) if match.group(2) else 1
        sides = int(match.group(3))
        
        if sign == '-':
            raise HTTPException(
                status_code=400,
                detail="Negative dice (e.g., -2d6) are not supported. Use modifiers instead."
            )
        
        if count < 1 or count > 100:
            raise HTTPException(status_code=400, detail=f"Dice count must be between 1 and 100, got {count}")
        if sides < 2 or sides > 1000:
            raise HTTPException(status_code=400, detail=f"Dice sides must be between 2 and 1000, got {sides}")
        
        dice_groups.append((count, sides))
    
    remaining = re.sub(dice_pattern, '', formula)
    
    for match in re.finditer(r'([+-]?\d+)', remaining):
        total_modifier += int(match.group(1))
    
    if remaining and remaining[0].isdigit():
        pass
    
    if not dice_groups:
        raise HTTPException(
            status_code=400,
            detail="Invalid formula. Must contain at least one dice notation (e.g., 2d6, 1d20)"
        )
    
    return dice_groups, total_modifier


def single_die_distribution(sides: int) -> np.ndarray:
    """Create probability distribution for a single die with given sides."""
    return np.ones(sides) / sides


def convolve_fft(dist1: np.ndarray, dist2: np.ndarray) -> np.ndarray:
    """
    Convolve two probability distributions using FFT for efficiency.
    
    This computes the probability distribution of the sum of two
    independent random variables.
    """
    n = len(dist1) + len(dist2) - 1
    
    n_fft = 1
    while n_fft < n:
        n_fft *= 2
    fft1 = np.fft.fft(dist1, n_fft)
    fft2 = np.fft.fft(dist2, n_fft)
    result_fft = fft1 * fft2
    result = np.fft.ifft(result_fft).real[:n]
    result = np.clip(result, 0, 1)
    
    return result


def compute_dice_distribution(dice_groups: list[tuple[int, int]]) -> tuple[np.ndarray, int]:
    """
    Compute the probability distribution for a set of dice.
    
    Args:
        dice_groups: List of (count, sides) tuples
        
    Returns:
        Tuple of (probability array, minimum value offset)
    """
    result = np.array([1.0])
    min_value = 0
    
    for count, sides in dice_groups:
        single_die = single_die_distribution(sides)
        
        die_result = single_die
        dice_to_add = count
        
        doubled = single_die
        while dice_to_add > 0:
            if dice_to_add & 1:
                die_result = convolve_fft(die_result, doubled) if dice_to_add < count else doubled
                if dice_to_add == count:
                    die_result = doubled
                else:
                    die_result = convolve_fft(die_result, doubled)
            dice_to_add >>= 1
            if dice_to_add > 0:
                doubled = convolve_fft(doubled, doubled)
        
        die_result = single_die
        for _ in range(count - 1):
            die_result = convolve_fft(die_result, single_die)
        
        result = convolve_fft(result, die_result)
        
        min_value += count
    
    return result, min_value


@router.post("/dice-probability", response_model=DiceProbabilityResult)
def calculate_dice_probability(request: DiceFormulaRequest) -> Any:
    """
    Calculate the probability distribution for a dice formula.
    
    Accepts formulas like:
    - "2d6" - Roll 2 six-sided dice
    - "1d20+5" - Roll 1d20 and add 5
    - "2d6+1d8+3" - Roll 2d6, add 1d8, add 3
    - "4d6+2d4-2" - Roll 4d6, add 2d4, subtract 2
    
    Uses FFT-based convolution for efficient probability calculation.
    """
    try:
        dice_groups, modifier = parse_dice_formula(request.formula)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to parse formula: {str(e)}")
    
    distribution, base_min = compute_dice_distribution(dice_groups)
    
    min_value = base_min + modifier
    max_value = min_value + len(distribution) - 1
    
    values = np.arange(min_value, max_value + 1)
    mean = float(np.sum(values * distribution))
    variance = float(np.sum((values - mean) ** 2 * distribution))
    std_dev = float(np.sqrt(variance))
    
    mode_idx = int(np.argmax(distribution))
    mode = min_value + mode_idx
    mode_probability = float(distribution[mode_idx])
    
    cumulative = 0.0
    probabilities = []
    for i, prob in enumerate(distribution):
        prob_float = float(prob)
        if prob_float > 1e-10:
            cumulative += prob_float
            probabilities.append({
                "value": min_value + i,
                "probability": round(prob_float, 10),
                "percentage": round(prob_float * 100, 4),
                "cumulative": round(cumulative, 10),
                "cumulative_percentage": round(cumulative * 100, 4)
            })
    
    return DiceProbabilityResult(
        formula=request.formula,
        min_value=min_value,
        max_value=max_value,
        mean=round(mean, 4),
        std_dev=round(std_dev, 4),
        mode=mode,
        mode_probability=round(mode_probability, 6),
        probabilities=probabilities
    )
