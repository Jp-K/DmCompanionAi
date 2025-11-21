import uuid
from typing import Any, Optional, AsyncGenerator
import asyncio

from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from langchain_openai import ChatOpenAI
from langchain.agents import AgentExecutor, create_openai_functions_agent
from langchain.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_core.messages import AIMessage, HumanMessage

from app import crud
from app.core.config import settings
from app.api.deps import CurrentUser, SessionDep
from app.models import Chat, ChatCreate
from app.tools import get_available_tools

router = APIRouter(prefix="/chats", tags=["chats"])

class MessagePayload(BaseModel):
    message: str
    id: Optional[uuid.UUID] = None

def create_agent_executor():
    """Create and return a LangChain agent executor with tools."""
    llm = ChatOpenAI(
        model="gpt-4o-mini",
        temperature=0.1,
        openai_api_key=settings.OPENAI_API_KEY
    )
    
    tools = get_available_tools()
    
    prompt = ChatPromptTemplate.from_messages([
        ("system", """You are a helpful RPG assistant specialized in tabletop role-playing games.

Your role is to help users understand game rules, find information about spells, 
and answer questions about game mechanics.

When a user asks a question:
1. First, analyze if you need to search for information using your tools
2. Use the 'rpg_rules_search' tool to find relevant rules
3. Use the 'spells_search' tool to find information about spells
4. Provide a clear, helpful answer in the same language as the question
5. Format your answer in markdown for better readability

Always respond in the same language as the user's question.
Be concise but informative. If you're not sure, say so."""),
        ("human", "{input}"),
        MessagesPlaceholder("agent_scratchpad"),
    ])
    
    agent = create_openai_functions_agent(llm, tools, prompt)
    agent_executor = AgentExecutor(agent=agent, tools=tools, verbose=True)
    
    return agent_executor


@router.post("/message/")
def read_items(
    session: SessionDep, 
    current_user: CurrentUser, 
    payload: MessagePayload
) -> Any:
    """
    Process a message using LangChain agent with tools.
    The agent will decide when to search for rules or spells based on the user's question.
    """
    message = payload.message
    id = payload.id
    current_chat = None
    
    # Get or create chat
    if id:
        current_chat = session.get(Chat, id)
        if not current_chat:
            raise HTTPException(status_code=404, detail="Chat not found")
    else:
        current_chat = crud.create_chat(
            session=session, 
            item_in=ChatCreate(title=message[:20], description=""), 
            owner_id=current_user.id
        )
    
    # Create agent and execute
    agent_executor = create_agent_executor()
    
    try:
        result = agent_executor.invoke({"input": message})
        response_message = result.get("output", "Desculpe, não consegui processar sua pergunta.")
    except Exception as e:
        response_message = f"Erro ao processar a mensagem: {str(e)}"
    
    response_data = {
        "message": response_message,
        "id": current_chat.id
    }
    
    return response_data

async def agent_stream(message: str) -> AsyncGenerator[str, None]:
    """
    Stream responses from the LangChain agent.
    The agent will use tools as needed and stream the final response.
    """
    try:
        llm = ChatOpenAI(
            model="gpt-4o-mini",
            temperature=0.1,
            openai_api_key=settings.OPENAI_API_KEY,
            streaming=True
        )
        
        tools = get_available_tools()
        
        prompt = ChatPromptTemplate.from_messages([
            ("system", """You are a helpful RPG assistant specialized in tabletop role-playing games.

Your role is to help users understand game rules, find information about spells, 
and answer questions about game mechanics.

When a user asks a question:
1. First, analyze if you need to search for information using your tools
2. Use the 'rpg_rules_search' tool to find relevant rules
3. Use the 'spells_search' tool to find information about spells
4. Provide a clear, helpful answer in the same language as the question
5. Format your answer in markdown for better readability

Always respond in the same language as the user's question.
Be concise but informative. If you're not sure, say so."""),
            ("human", "{input}"),
            MessagesPlaceholder("agent_scratchpad"),
        ])
        
        agent = create_openai_functions_agent(llm, tools, prompt)
        agent_executor = AgentExecutor(agent=agent, tools=tools, verbose=True)
        
        # Execute agent and stream the response
        async for event in agent_executor.astream_events(
            {"input": message},
            version="v1"
        ):
            kind = event["event"]
            
            # Stream only the final answer tokens
            if kind == "on_chat_model_stream":
                content = event["data"]["chunk"].content
                if content:
                    yield content
                    await asyncio.sleep(0.01)
        
        yield "[FINISHED]"
        
    except Exception as e:
        yield f"Erro ao processar a mensagem: {str(e)}"
        yield "[FINISHED]"


@router.post("/message/streaming/")
async def streaming_message(
    session: SessionDep, 
    current_user: CurrentUser, 
    payload: MessagePayload
) -> Any:
    """
    Process a message using LangChain agent with streaming response.
    The agent will decide when to search for rules or spells based on the user's question.
    The response is streamed back to the client in real-time.
    """
    message = payload.message
    id = payload.id
    current_chat = None
    
    # Get or create chat
    if id:
        current_chat = session.get(Chat, id)
        if not current_chat:
            raise HTTPException(status_code=404, detail="Chat not found")
    else:
        current_chat = crud.create_chat(
            session=session, 
            item_in=ChatCreate(title=message[:20], description=""), 
            owner_id=current_user.id
        )
    
    # Stream the agent's response
    return StreamingResponse(agent_stream(message), media_type="text/plain")
