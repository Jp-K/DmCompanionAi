import uuid
from typing import Any, Optional, AsyncGenerator
import asyncio

from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from sqlmodel import select

from langchain_openai import ChatOpenAI
from langchain.agents import AgentExecutor, create_openai_functions_agent
from langchain.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_core.messages import AIMessage, HumanMessage

from app import crud
from app.core.config import settings
from app.api.deps import CurrentUser, SessionDep
from app.models import Chat, ChatCreate, ChatMessage
from app.tools import get_available_tools

router = APIRouter(prefix="/chats", tags=["chats"])

class MessagePayload(BaseModel):
    message: str
    id: Optional[uuid.UUID] = None


def get_chat_history(session, chat_id: uuid.UUID) -> list:
    """Load chat messages and convert to LangChain message format."""
    statement = select(ChatMessage).where(ChatMessage.chat_id == chat_id).order_by(ChatMessage.created_at)
    messages = session.exec(statement).all()
    
    history = []
    for msg in messages:
        if msg.role == "user":
            history.append(HumanMessage(content=msg.content))
        elif msg.role == "assistant":
            history.append(AIMessage(content=msg.content))
    
    return history


def save_message(session, chat_id: uuid.UUID, content: str, role: str) -> ChatMessage:
    """Save a message to the database."""
    message = ChatMessage(
        chat_id=chat_id,
        content=content[:50000],  # Limit content size
        role=role
    )
    session.add(message)
    session.commit()
    session.refresh(message)
    return message

def create_agent_executor(chat_history: list = None):
    """Create and return a LangChain agent executor with tools."""
    llm = ChatOpenAI(
        model="gpt-4o-mini",
        temperature=0.1,
        openai_api_key=settings.OPENAI_API_KEY
    )
    
    tools = get_available_tools()
    
    # Build prompt with chat history
    messages = [
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
        MessagesPlaceholder("chat_history"),
        ("human", "{input}"),
        MessagesPlaceholder("agent_scratchpad"),
    ]
    
    prompt = ChatPromptTemplate.from_messages(messages)
    
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
    Messages are saved to the database for conversation history.
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
            item_in=ChatCreate(title=message[:50], description=""), 
            owner_id=current_user.id
        )
    
    # Load chat history
    chat_history = get_chat_history(session, current_chat.id)
    
    # Save user message
    save_message(session, current_chat.id, message, "user")
    
    # Create agent and execute with history
    agent_executor = create_agent_executor()
    
    try:
        result = agent_executor.invoke({
            "input": message,
            "chat_history": chat_history
        })
        response_message = result.get("output", "Desculpe, não consegui processar sua pergunta.")
    except Exception as e:
        response_message = f"Erro ao processar a mensagem: {str(e)}"
    
    # Save assistant response
    save_message(session, current_chat.id, response_message, "assistant")
    
    response_data = {
        "message": response_message,
        "id": current_chat.id
    }
    
    return response_data

async def agent_stream(message: str, chat_history: list = None) -> AsyncGenerator[str, None]:
    """
    Stream responses from the LangChain agent.
    The agent will use tools as needed and stream the final response.
    """
    full_response = []
    
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
            MessagesPlaceholder("chat_history"),
            ("human", "{input}"),
            MessagesPlaceholder("agent_scratchpad"),
        ])
        
        agent = create_openai_functions_agent(llm, tools, prompt)
        agent_executor = AgentExecutor(agent=agent, tools=tools, verbose=True)
        
        # Execute agent and stream the response
        async for event in agent_executor.astream_events(
            {"input": message, "chat_history": chat_history or []},
            version="v1"
        ):
            kind = event["event"]
            
            # Stream only the final answer tokens
            if kind == "on_chat_model_stream":
                content = event["data"]["chunk"].content
                if content:
                    full_response.append(content)
                    yield content
                    await asyncio.sleep(0.01)
        
        # Return the full response for saving
        yield "[RESPONSE_END]" + "".join(full_response) + "[FINISHED]"
        
    except Exception as e:
        error_msg = f"Erro ao processar a mensagem: {str(e)}"
        yield error_msg
        yield "[RESPONSE_END]" + error_msg + "[FINISHED]"


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
    Messages are saved to the database for conversation history.
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
            item_in=ChatCreate(title=message[:50], description=""), 
            owner_id=current_user.id
        )
    
    # Load chat history
    chat_history = get_chat_history(session, current_chat.id)
    
    # Save user message
    save_message(session, current_chat.id, message, "user")
    
    chat_id = current_chat.id
    
    async def stream_and_save():
        full_response = ""
        async for chunk in agent_stream(message, chat_history):
            if chunk.startswith("[RESPONSE_END]"):
                # Extract full response and save it
                full_response = chunk.replace("[RESPONSE_END]", "").replace("[FINISHED]", "")
                # We need a new session for async context
                from app.core.db import engine
                from sqlmodel import Session
                with Session(engine) as save_session:
                    save_message(save_session, chat_id, full_response, "assistant")
                yield f"[CHAT_ID]{chat_id}[FINISHED]"
            else:
                yield chunk
    
    return StreamingResponse(stream_and_save(), media_type="text/plain")


class ChatMessageResponse(BaseModel):
    id: uuid.UUID
    content: str
    role: str
    created_at: str


class ChatMessagesResponse(BaseModel):
    messages: list[ChatMessageResponse]
    chat_id: uuid.UUID


@router.get("/{chat_id}/messages/")
def get_messages(
    session: SessionDep,
    current_user: CurrentUser,
    chat_id: uuid.UUID
) -> ChatMessagesResponse:
    """
    Get all messages for a specific chat.
    """
    # Verify chat exists and belongs to user
    chat = session.get(Chat, chat_id)
    if not chat:
        raise HTTPException(status_code=404, detail="Chat not found")
    if chat.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to access this chat")
    
    # Get messages
    statement = select(ChatMessage).where(ChatMessage.chat_id == chat_id).order_by(ChatMessage.created_at)
    messages = session.exec(statement).all()
    
    return ChatMessagesResponse(
        chat_id=chat_id,
        messages=[
            ChatMessageResponse(
                id=msg.id,
                content=msg.content,
                role=msg.role,
                created_at=msg.created_at.isoformat()
            )
            for msg in messages
        ]
    )
