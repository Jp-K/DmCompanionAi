"""
Example of how to add new tools to the agent system.
This file demonstrates how to extend the agent with additional capabilities.
"""
from typing import List
from langchain.tools import BaseTool
from pydantic import Field
import json


class MonsterSearchTool(BaseTool):
    """
    Example tool for searching monster/creature information.
    This demonstrates how to add a new tool to the system.
    """
    
    name: str = "monster_search"
    description: str = """
    Use this tool to search for information about monsters, creatures, and enemies.
    Input should be a monster name or type of creature you want to find.
    
    Examples of good inputs:
    - "Dragon"
    - "Goblin stats"
    - "Undead creatures"
    - "Challenge rating 5 monsters"
    """
    
    def _run(self, query: str) -> str:
        """Execute the search for monsters."""
        # TODO: Implement actual monster search logic
        # This could connect to a monster database, JSON file, or API
        
        return f"Searching for monsters matching: {query}\n(This is a placeholder - implement actual logic)"
    
    async def _arun(self, query: str) -> str:
        """Async version of the tool."""
        return self._run(query)


class DiceRollerTool(BaseTool):
    """
    Tool for rolling dice and calculating results.
    Shows how to add interactive/computational tools.
    """
    
    name: str = "dice_roller"
    description: str = """
    Use this tool to roll dice and calculate results.
    Input should be in standard dice notation (e.g., "2d6+3", "1d20", "3d8-2").
    
    Examples:
    - "2d6" - Roll two six-sided dice
    - "1d20+5" - Roll one twenty-sided die and add 5
    - "3d8-2" - Roll three eight-sided dice and subtract 2
    """
    
    def _run(self, dice_notation: str) -> str:
        """Roll dice and return the result."""
        import random
        import re
        
        try:
            # Parse dice notation (e.g., "2d6+3")
            match = re.match(r'(\d+)d(\d+)([+-]\d+)?', dice_notation.strip())
            
            if not match:
                return "Invalid dice notation. Use format like '2d6' or '1d20+5'"
            
            num_dice = int(match.group(1))
            die_size = int(match.group(2))
            modifier = int(match.group(3)) if match.group(3) else 0
            
            # Roll the dice
            rolls = [random.randint(1, die_size) for _ in range(num_dice)]
            total = sum(rolls) + modifier
            
            # Format the result
            rolls_str = ", ".join(map(str, rolls))
            modifier_str = f" {modifier:+d}" if modifier != 0 else ""
            
            result = f"Rolling {dice_notation}:\n"
            result += f"Rolls: [{rolls_str}]\n"
            result += f"Total: {total} (rolled: {sum(rolls)}{modifier_str})"
            
            return result
            
        except Exception as e:
            return f"Error rolling dice: {str(e)}"
    
    async def _arun(self, dice_notation: str) -> str:
        """Async version of the tool."""
        return self._run(dice_notation)


class CharacterSheetTool(BaseTool):
    """
    Tool for accessing and managing character information.
    Example of a stateful tool that could access a database.
    """
    
    name: str = "character_sheet"
    description: str = """
    Use this tool to get information about a character's stats, abilities, and equipment.
    Input should be the character name or aspect you want to check.
    
    Examples:
    - "Show stats for Aragorn"
    - "What is the character's armor class?"
    - "List character equipment"
    """
    
    def _run(self, query: str) -> str:
        """Get character information."""
        # TODO: Implement actual database lookup
        # This would typically query a character database
        
        return f"Character lookup: {query}\n(Placeholder - would query character database)"
    
    async def _arun(self, query: str) -> str:
        """Async version of the tool."""
        return self._run(query)


# Example of how to integrate these tools into the system:
def get_all_available_tools() -> List[BaseTool]:
    """
    Returns all available tools including examples.
    To add a new tool to the system:
    1. Create a new class inheriting from BaseTool
    2. Implement _run() method
    3. Add it to this list
    """
    from app.tools import RPGRulesSearchTool, SpellsSearchTool
    
    return [
        # Core tools
        RPGRulesSearchTool(),
        SpellsSearchTool(),
        
        # Example additional tools (uncomment when implemented)
        # MonsterSearchTool(),
        # DiceRollerTool(),
        # CharacterSheetTool(),
    ]


# Example: Custom tool with external API
class ExternalAPITool(BaseTool):
    """
    Example of a tool that calls an external API.
    Useful for integrating third-party services.
    """
    
    name: str = "external_api"
    description: str = "Calls an external API for additional information"
    api_url: str = Field(default="https://api.example.com")
    
    def _run(self, query: str) -> str:
        """Call external API."""
        import httpx
        
        try:
            # Example API call
            response = httpx.get(f"{self.api_url}/search", params={"q": query})
            response.raise_for_status()
            return response.text
        except Exception as e:
            return f"API error: {str(e)}"
    
    async def _arun(self, query: str) -> str:
        """Async version for better performance."""
        import httpx
        
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{self.api_url}/search",
                    params={"q": query}
                )
                response.raise_for_status()
                return response.text
        except Exception as e:
            return f"API error: {str(e)}"


# Example: Tool with configuration
class ConfigurableTool(BaseTool):
    """
    Example of a tool with configuration options.
    Shows how to make tools flexible and reusable.
    """
    
    name: str = "configurable_tool"
    description: str = "A tool with configurable behavior"
    
    # Configuration fields
    max_results: int = Field(default=5, description="Maximum number of results")
    enable_cache: bool = Field(default=True, description="Enable result caching")
    
    def _run(self, query: str) -> str:
        """Execute with configuration."""
        result = f"Processing query: {query}\n"
        result += f"Max results: {self.max_results}\n"
        result += f"Cache enabled: {self.enable_cache}\n"
        
        # Implement actual logic here
        
        return result
    
    async def _arun(self, query: str) -> str:
        """Async version."""
        return self._run(query)


"""
USAGE EXAMPLES:

1. Add a single tool:
   In app/tools.py, update get_available_tools():
   
   def get_available_tools() -> List[BaseTool]:
       return [
           RPGRulesSearchTool(),
           SpellsSearchTool(),
           DiceRollerTool(),  # Add new tool here
       ]

2. Use tool with configuration:
   
   dice_roller = DiceRollerTool()
   result = dice_roller.run("2d6+3")

3. Create a specialized tool for your domain:
   
   class MyCustomTool(BaseTool):
       name = "my_custom_tool"
       description = "Does something specific"
       
       def _run(self, query: str) -> str:
           # Your logic here
           return "result"

4. Test tools independently:
   
   from app.tools_examples import DiceRollerTool
   
   tool = DiceRollerTool()
   result = tool.run("1d20+5")
   print(result)
"""
