"""
Tools for LangChain agent to search and retrieve D&D information from Qdrant vector database.

Uses SentenceTransformer for local embeddings (no external API required).
"""
from typing import List, Literal, Optional, Type

from langchain.tools import BaseTool
from pydantic import BaseModel, Field

from app.core.utils import search_vector_db, get_collection_stats


class SpellSearchInput(BaseModel):
    """Input schema for spell search."""
    query: str = Field(default="", description="Spell name or description of magical effects to search for. Can be empty when using filters.")
    level: Optional[int] = Field(default=None, description="Filter by spell level (0 for cantrips, 1-9 for spell levels)")
    school: Optional[str] = Field(default=None, description="Filter by school (Abjuration, Conjuration, Divination, Enchantment, Evocation, Illusion, Necromancy, Transmutation)")
    class_name: Optional[str] = Field(default=None, description="Filter by class that can cast the spell (Wizard, Cleric, Bard, Druid, Paladin, Ranger, Sorcerer, Warlock)")


class RPGRulesSearchTool(BaseTool):
    """Tool for searching RPG rules in the Qdrant vector database."""
    
    name: str = "rpg_rules_search"
    description: str = """
    Use this tool to search for RPG rules and game mechanics.
    Input should be a clear and specific question or search query about RPG rules.
    The tool will return the most relevant rules based on semantic similarity.
    
    Examples of good inputs:
    - "Como funciona o sistema de combate?"
    - "Regras sobre quebrar objetos"
    - "Como calcular dano de ataque desarmado?"
    - "Condições de exaustão"
    """
    
    def _run(self, query: str) -> str:
        """Execute the search and return formatted results."""
        try:
            results = search_vector_db(query, category="rule", limit=3)
            
            if not results:
                return "Não foram encontradas regras relevantes para esta consulta."
            
            formatted_results = []
            for i, result in enumerate(results, 1):
                title = result.get("title", "Sem título")
                source = result.get("source", "Unknown")
                page = result.get("page", "N/A")
                description = result.get("description", "")
                score = result.get("score", 0)
                
                formatted_results.append(
                    f"### Resultado {i}: {title} (Score: {score:.2f})\n"
                    f"**Fonte:** {source} (Página {page})\n\n"
                    f"{description}\n"
                )
            
            return "\n".join(formatted_results)
        
        except Exception as e:
            return f"Erro ao buscar regras: {str(e)}"
    
    async def _arun(self, query: str) -> str:
        """Async version of the tool."""
        return self._run(query)


class SpellsSearchTool(BaseTool):
    """Tool for searching spells in the Qdrant vector database."""
    
    name: str = "spells_search"
    description: str = """Use this tool to search for information about spells and magical abilities.
    You can filter by level (0 for cantrips, 1-9), school, or class that can cast the spell."""
    args_schema: Type[BaseModel] = SpellSearchInput
    
    def _run(
        self, 
        query: str = "",
        level: Optional[int] = None,
        school: Optional[str] = None,
        class_name: Optional[str] = None,
    ) -> str:
        """Execute the search for spells."""
        try:
            # Use a generic query if none provided but filters are present
            search_query = query if query else "spell"
            
            results = search_vector_db(
                search_query, 
                category="spell", 
                limit=5,
                spell_level=level,
                spell_school=school,
                available_from_filter=class_name,
            )
            
            if not results:
                filter_info = []
                if level is not None:
                    filter_info.append(f"nível {level}")
                if school:
                    filter_info.append(f"escola {school}")
                if class_name:
                    filter_info.append(f"classe {class_name}")
                filter_str = f" com filtros: {', '.join(filter_info)}" if filter_info else ""
                return f"Não foram encontradas magias relacionadas a '{query}'{filter_str}."
            
            formatted_results = []
            for i, result in enumerate(results, 1):
                title = result.get("title", "Sem nome")
                source = result.get("source", "Unknown")
                page = result.get("page", "N/A")
                description = result.get("description", "")
                score = result.get("score", 0)
                spell_level = result.get("level", 0)
                spell_school = result.get("school", "")
                available_from = result.get("available_from", [])
                
                # Format level
                if spell_level == 0:
                    level_str = "Truque"
                else:
                    ordinal = {1: "1º", 2: "2º", 3: "3º", 4: "4º", 5: "5º", 6: "6º", 7: "7º", 8: "8º", 9: "9º"}.get(spell_level, f"{spell_level}º")
                    level_str = f"{ordinal} nível"
                
                result_text = (
                    f"### Magia {i}: {title} (Score: {score:.2f})\n"
                    f"**Nível:** {level_str} | **Escola:** {spell_school}\n"
                    f"**Fonte:** {source} (Página {page})\n\n"
                    f"{description}\n"
                )
                
                if available_from:
                    result_text += f"\n**Disponível em:** {', '.join(available_from)}\n"
                
                formatted_results.append(result_text)
            
            return "\n".join(formatted_results)
        
        except Exception as e:
            return f"Erro ao buscar magias: {str(e)}"
    
    async def _arun(
        self, 
        query: str = "",
        level: Optional[int] = None,
        school: Optional[str] = None,
        class_name: Optional[str] = None,
    ) -> str:
        """Async version of the tool."""
        return self._run(query, level, school, class_name)


class ItemsSearchTool(BaseTool):
    """Tool for searching items in the Qdrant vector database."""
    
    name: str = "items_search"
    description: str = """
    Use this tool to search for information about items, equipment, weapons, armor, and magic items.
    Input should be an item name or description of the item you want to find.
    
    Examples of good inputs:
    - "Longsword"
    - "Itens mágicos de cura"
    - "Armadura de placas"
    - "Anel de invisibilidade"
    """
    
    def _run(self, query: str) -> str:
        """Execute the search for items."""
        try:
            results = search_vector_db(query, category="item", limit=3)
            
            if not results:
                return f"Não foram encontrados itens relacionados a '{query}'."
            
            formatted_results = []
            for i, result in enumerate(results, 1):
                title = result.get("title", "Sem nome")
                source = result.get("source", "Unknown")
                page = result.get("page", "N/A")
                description = result.get("description", "")
                score = result.get("score", 0)
                
                formatted_results.append(
                    f"### Item {i}: {title} (Score: {score:.2f})\n"
                    f"**Fonte:** {source} (Página {page})\n\n"
                    f"{description}\n"
                )
            
            return "\n".join(formatted_results)
        
        except Exception as e:
            return f"Erro ao buscar itens: {str(e)}"
    
    async def _arun(self, query: str) -> str:
        """Async version of the tool."""
        return self._run(query)


class ActionsSearchTool(BaseTool):
    """Tool for searching actions in the Qdrant vector database."""
    
    name: str = "actions_search"
    description: str = """
    Use this tool to search for information about combat actions and special actions.
    Input should be an action name or description of what you want to do.
    
    Examples of good inputs:
    - "Dash"
    - "Ação de ataque"
    - "Desengajar"
    - "Ajudar aliado"
    """
    
    def _run(self, query: str) -> str:
        """Execute the search for actions."""
        try:
            results = search_vector_db(query, category="action", limit=3)
            
            if not results:
                return f"Não foram encontradas ações relacionadas a '{query}'."
            
            formatted_results = []
            for i, result in enumerate(results, 1):
                title = result.get("title", "Sem nome")
                source = result.get("source", "Unknown")
                page = result.get("page", "N/A")
                description = result.get("description", "")
                score = result.get("score", 0)
                
                formatted_results.append(
                    f"### Ação {i}: {title} (Score: {score:.2f})\n"
                    f"**Fonte:** {source} (Página {page})\n\n"
                    f"{description}\n"
                )
            
            return "\n".join(formatted_results)
        
        except Exception as e:
            return f"Erro ao buscar ações: {str(e)}"
    
    async def _arun(self, query: str) -> str:
        """Async version of the tool."""
        return self._run(query)


class BackgroundsSearchTool(BaseTool):
    """Tool for searching backgrounds in the Qdrant vector database."""
    
    name: str = "backgrounds_search"
    description: str = """
    Use this tool to search for information about character backgrounds.
    Input should be a background name or description of the background you want to find.
    
    Examples of good inputs:
    - "Acolyte"
    - "Criminoso"
    - "Nobre"
    - "Soldado"
    """
    
    def _run(self, query: str) -> str:
        """Execute the search for backgrounds."""
        try:
            results = search_vector_db(query, category="background", limit=3)
            
            if not results:
                return f"Não foram encontrados antecedentes relacionados a '{query}'."
            
            formatted_results = []
            for i, result in enumerate(results, 1):
                title = result.get("title", "Sem nome")
                source = result.get("source", "Unknown")
                page = result.get("page", "N/A")
                description = result.get("description", "")
                score = result.get("score", 0)
                
                formatted_results.append(
                    f"### Antecedente {i}: {title} (Score: {score:.2f})\n"
                    f"**Fonte:** {source} (Página {page})\n\n"
                    f"{description}\n"
                )
            
            return "\n".join(formatted_results)
        
        except Exception as e:
            return f"Erro ao buscar antecedentes: {str(e)}"
    
    async def _arun(self, query: str) -> str:
        """Async version of the tool."""
        return self._run(query)


class DeitiesSearchTool(BaseTool):
    """Tool for searching deities in the Qdrant vector database."""
    
    name: str = "deities_search"
    description: str = """
    Use this tool to search for information about gods and deities.
    Input should be a deity name, pantheon, or domain you want to find.
    
    Examples of good inputs:
    - "Tyr"
    - "Deuses da guerra"
    - "Panteão élfico"
    - "Divindades do domínio da vida"
    """
    
    def _run(self, query: str) -> str:
        """Execute the search for deities."""
        try:
            results = search_vector_db(query, category="deity", limit=3)
            
            if not results:
                return f"Não foram encontradas divindades relacionadas a '{query}'."
            
            formatted_results = []
            for i, result in enumerate(results, 1):
                title = result.get("title", "Sem nome")
                source = result.get("source", "Unknown")
                page = result.get("page", "N/A")
                description = result.get("description", "")
                score = result.get("score", 0)
                
                formatted_results.append(
                    f"### Divindade {i}: {title} (Score: {score:.2f})\n"
                    f"**Fonte:** {source} (Página {page})\n\n"
                    f"{description}\n"
                )
            
            return "\n".join(formatted_results)
        
        except Exception as e:
            return f"Erro ao buscar divindades: {str(e)}"
    
    async def _arun(self, query: str) -> str:
        """Async version of the tool."""
        return self._run(query)


class RacesSearchTool(BaseTool):
    """Tool for searching races in the Qdrant vector database."""
    
    name: str = "races_search"
    description: str = """
    Use this tool to search for information about playable races and species.
    Input should be a race name or characteristic you want to find.
    
    Examples of good inputs:
    - "Elf"
    - "Anão"
    - "Raças com visão no escuro"
    - "Tiefling"
    """
    
    def _run(self, query: str) -> str:
        """Execute the search for races."""
        try:
            results = search_vector_db(query, category="race", limit=3)
            
            if not results:
                return f"Não foram encontradas raças relacionadas a '{query}'."
            
            formatted_results = []
            for i, result in enumerate(results, 1):
                title = result.get("title", "Sem nome")
                source = result.get("source", "Unknown")
                page = result.get("page", "N/A")
                description = result.get("description", "")
                score = result.get("score", 0)
                
                formatted_results.append(
                    f"### Raça {i}: {title} (Score: {score:.2f})\n"
                    f"**Fonte:** {source} (Página {page})\n\n"
                    f"{description}\n"
                )
            
            return "\n".join(formatted_results)
        
        except Exception as e:
            return f"Erro ao buscar raças: {str(e)}"
    
    async def _arun(self, query: str) -> str:
        """Async version of the tool."""
        return self._run(query)


class FeatsSearchTool(BaseTool):
    """Tool for searching feats in the Qdrant vector database."""
    
    name: str = "feats_search"
    description: str = """
    Use this tool to search for information about feats and special abilities.
    Input should be a feat name or description of the ability you want to find.
    
    Examples of good inputs:
    - "Great Weapon Master"
    - "Talentos de combate"
    - "Lucky"
    - "Talentos para magos"
    """
    
    def _run(self, query: str) -> str:
        """Execute the search for feats."""
        try:
            results = search_vector_db(query, category="feat", limit=3)
            
            if not results:
                return f"Não foram encontrados talentos relacionados a '{query}'."
            
            formatted_results = []
            for i, result in enumerate(results, 1):
                title = result.get("title", "Sem nome")
                source = result.get("source", "Unknown")
                page = result.get("page", "N/A")
                description = result.get("description", "")
                score = result.get("score", 0)
                
                formatted_results.append(
                    f"### Talento {i}: {title} (Score: {score:.2f})\n"
                    f"**Fonte:** {source} (Página {page})\n\n"
                    f"{description}\n"
                )
            
            return "\n".join(formatted_results)
        
        except Exception as e:
            return f"Erro ao buscar talentos: {str(e)}"
    
    async def _arun(self, query: str) -> str:
        """Async version of the tool."""
        return self._run(query)


class GeneralSearchTool(BaseTool):
    """Tool for searching all categories in the Qdrant vector database."""
    
    name: str = "general_search"
    description: str = """
    Use this tool to search across ALL categories (spells, rules, items, actions, backgrounds, deities, races, feats).
    This is useful when you're not sure which category the information belongs to.
    Input should be any search query about D&D content.
    
    Examples of good inputs:
    - "Como funciona resistência a dano?"
    - "Informações sobre dragões"
    - "Healing word"
    - "Combate corpo a corpo"
    """
    
    def _run(self, query: str) -> str:
        """Execute the search across all categories."""
        try:
            # Search without category filter to get results from all categories
            results = search_vector_db(query, category=None, limit=5)
            
            if not results:
                return f"Não foram encontrados resultados para '{query}'."
            
            formatted_results = []
            for i, result in enumerate(results, 1):
                title = result.get("title", "Sem título")
                category = result.get("category", "unknown")
                source = result.get("source", "Unknown")
                page = result.get("page", "N/A")
                description = result.get("description", "")
                score = result.get("score", 0)
                available_from = result.get("available_from", [])
                level = result.get("level", 0)
                school = result.get("school", "")
                
                # Map category to Portuguese
                category_map = {
                    "spell": "Magia",
                    "rule": "Regra",
                    "item": "Item",
                    "action": "Ação",
                    "background": "Antecedente",
                    "deity": "Divindade",
                    "race": "Raça",
                    "feat": "Talento",
                }
                category_pt = category_map.get(category, category)
                
                # Add level info for spells
                level_info = ""
                if category == "spell":
                    if level == 0:
                        level_info = " | **Nível:** Truque"
                    else:
                        ordinal = {1: "1º", 2: "2º", 3: "3º", 4: "4º", 5: "5º", 6: "6º", 7: "7º", 8: "8º", 9: "9º"}.get(level, f"{level}º")
                        level_info = f" | **Nível:** {ordinal}"
                    if school:
                        level_info += f" | **Escola:** {school}"
                
                result_text = (
                    f"### {i}. [{category_pt}] {title} (Score: {score:.2f})\n"
                    f"**Fonte:** {source} (Página {page}){level_info}\n\n"
                    f"{description}\n"
                )
                
                # Add available_from for spells
                if category == "spell" and available_from:
                    result_text += f"\n**Disponível em:** {', '.join(available_from)}\n"
                
                formatted_results.append(result_text)
            
            return "\n".join(formatted_results)
        
        except Exception as e:
            return f"Erro ao buscar: {str(e)}"
    
    async def _arun(self, query: str) -> str:
        """Async version of the tool."""
        return self._run(query)


class DatabaseStatsTool(BaseTool):
    """Tool for getting statistics about the vector database."""
    
    name: str = "database_stats"
    description: str = """
    Use this tool to get statistics about the D&D knowledge base.
    It returns the count of items in each category (spells, rules, items, etc.).
    No input is required.
    """
    
    def _run(self, query: str = "") -> str:
        """Get database statistics."""
        try:
            stats = get_collection_stats()
            
            if "error" in stats:
                return f"Erro ao obter estatísticas: {stats['error']}"
            
            return (
                f"### Estatísticas da Base de Conhecimento D&D\n\n"
                f"- **Total de documentos:** {stats.get('total_points', 0)}\n"
                f"- **Magias:** {stats.get('spells', 0)}\n"
                f"- **Regras:** {stats.get('rules', 0)}\n"
                f"- **Itens:** {stats.get('items', 0)}\n"
                f"- **Ações:** {stats.get('actions', 0)}\n"
                f"- **Antecedentes:** {stats.get('backgrounds', 0)}\n"
                f"- **Divindades:** {stats.get('deities', 0)}\n"
                f"- **Raças:** {stats.get('races', 0)}\n"
                f"- **Talentos:** {stats.get('feats', 0)}\n"
                f"- **Status:** {stats.get('status', 'unknown')}\n"
            )
        
        except Exception as e:
            return f"Erro ao obter estatísticas: {str(e)}"
    
    async def _arun(self, query: str = "") -> str:
        """Async version of the tool."""
        return self._run(query)


def get_available_tools() -> List[BaseTool]:
    """Return list of all available tools for the agent."""
    return [
        GeneralSearchTool(),
        SpellsSearchTool(),
        RPGRulesSearchTool(),
        ItemsSearchTool(),
        ActionsSearchTool(),
        BackgroundsSearchTool(),
        DeitiesSearchTool(),
        RacesSearchTool(),
        FeatsSearchTool(),
        DatabaseStatsTool(),
    ]
