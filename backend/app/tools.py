"""
Tools for LangChain agent to search and retrieve RPG rules information.
"""
import json
import os
from typing import List, Optional

from langchain.tools import BaseTool
from langchain_community.vectorstores import FAISS
from langchain_openai import OpenAIEmbeddings
from langchain.docstore.document import Document
from pydantic import Field

from app.core.config import settings


class VectorStoreManager:
    """Manages vector store creation and retrieval for RPG rules."""
    
    def __init__(self):
        self.embeddings = OpenAIEmbeddings(
            openai_api_key=settings.OPENAI_API_KEY
        )
        self._vector_store = None
        self._rules_content = None
    
    def load_rules(self, json_path: str = 'app/data_source/rules-minimal.json') -> List[Document]:
        """Load rules from JSON file and convert to LangChain documents."""
        with open(json_path, 'r', encoding='utf-8') as file:
            json_data = json.load(file)
        
        documents = []
        for item in json_data.get("Rules Definitions", {}).get("content", []):
            title = item.get("title", "")
            description = item.get("description", "")
            
            doc = Document(
                page_content=f"Title: {title}\n\nDescription: {description}",
                metadata={"title": title, "source": "rules"}
            )
            documents.append(doc)
        
        self._rules_content = documents
        return documents
    
    def get_or_create_vector_store(self) -> FAISS:
        """Get existing vector store or create a new one."""
        if self._vector_store is None:
            if self._rules_content is None:
                self.load_rules()
            
            self._vector_store = FAISS.from_documents(
                self._rules_content,
                self.embeddings
            )
        
        return self._vector_store
    
    def similarity_search(self, query: str, k: int = 3) -> List[Document]:
        """Perform similarity search on the vector store."""
        vector_store = self.get_or_create_vector_store()
        results = vector_store.similarity_search(query, k=k)
        return results


# Global instance
vector_store_manager = VectorStoreManager()


class RPGRulesSearchTool(BaseTool):
    """Tool for searching RPG rules in the vector database."""
    
    name: str = "rpg_rules_search"
    description: str = """
    Use this tool to search for RPG rules and game mechanics.
    Input should be a clear and specific question or search query about RPG rules.
    The tool will return the most relevant rules based on semantic similarity.
    
    Examples of good inputs:
    - "Como funciona o sistema de combate?"
    - "Regras sobre quebrar objetos"
    - "Como calcular dano de ataque desarmado?"
    """
    
    vector_manager: VectorStoreManager = Field(default_factory=lambda: vector_store_manager)
    
    def _run(self, query: str) -> str:
        """Execute the search and return formatted results."""
        try:
            results = self.vector_manager.similarity_search(query, k=3)
            
            if not results:
                return "Não foram encontradas regras relevantes para esta consulta."
            
            formatted_results = []
            for i, doc in enumerate(results, 1):
                title = doc.metadata.get("title", "Sem título")
                content = doc.page_content
                formatted_results.append(f"### Resultado {i}: {title}\n\n{content}\n")
            
            return "\n".join(formatted_results)
        
        except Exception as e:
            return f"Erro ao buscar regras: {str(e)}"
    
    async def _arun(self, query: str) -> str:
        """Async version of the tool."""
        return self._run(query)


class SpellsSearchTool(BaseTool):
    """Tool for searching spells information."""
    
    name: str = "spells_search"
    description: str = """
    Use this tool to search for information about spells and magical abilities.
    Input should be a spell name or description of magical effects you want to find.
    
    Examples of good inputs:
    - "Fireball"
    - "Magia de cura"
    - "Feitiços de nível 3 de dano"
    """
    
    def _run(self, query: str) -> str:
        """Execute the search for spells."""
        try:
            json_path = 'app/data_source/spells-minimal.json'
            
            if not os.path.exists(json_path):
                return "Base de dados de magias não disponível no momento."
            
            with open(json_path, 'r', encoding='utf-8') as file:
                spells_data = json.load(file).get("spells", [])
            
            # Simple search in spell names and descriptions
            query_lower = query.lower()
            found_spells = []
            
            for spell in spells_data:
                name = spell.get("name", "").lower()
                desc = spell.get("desc", "").lower()
                
                if query_lower in name or query_lower in desc:
                    found_spells.append(spell)
                
                if len(found_spells) >= 3:
                    break
            
            if not found_spells:
                return f"Não foram encontradas magias relacionadas a '{query}'."
            
            formatted_results = []
            for i, spell in enumerate(found_spells, 1):
                name = spell.get("name", "Sem nome")
                level = spell.get("level", "N/A")
                school = spell.get("school", "N/A")
                desc = spell.get("desc", "Sem descrição")[:200]
                
                formatted_results.append(
                    f"### Magia {i}: {name}\n"
                    f"**Nível:** {level} | **Escola:** {school}\n"
                    f"**Descrição:** {desc}...\n"
                )
            
            return "\n".join(formatted_results)
        
        except Exception as e:
            return f"Erro ao buscar magias: {str(e)}"
    
    async def _arun(self, query: str) -> str:
        """Async version of the tool."""
        return self._run(query)


def get_available_tools() -> List[BaseTool]:
    """Return list of all available tools for the agent."""
    return [
        RPGRulesSearchTool(),
        SpellsSearchTool(),
    ]
