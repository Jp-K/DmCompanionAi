import uuid
from typing import Any, Optional

from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from sqlmodel import func, select
from pydantic import BaseModel
from app import crud
from app.core.config import settings
from app.api.deps import CurrentUser, SessionDep
from app.models import Chat, ChatCreate, ChatPublic, ChatsPublic, ChatUpdate, Message
from app.utils import create_embeddings, get_json_content, similarity_search
from typing import AsyncGenerator
import asyncio

import json
import os

from openai import OpenAI

client = OpenAI(
    api_key=settings.OPENAI_API_KEY
)

router = APIRouter(prefix="/chats", tags=["chats"])

class MessagePayload(BaseModel):
    message: str
    id: Optional[uuid.UUID] = None

@router.post("/message/")
def read_items(
    session: SessionDep, 
    current_user: CurrentUser, 
    payload: MessagePayload
) -> Any:
    message = payload.message
    id = payload.id
    current_chat = None
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


    json_path = os.path.join('app/data_source/rules-minimal.json')
    with open(json_path, 'r', encoding='utf-8') as file:
        json_data = json.load(file)
    content = get_json_content(json_data)
    vectors = create_embeddings(content)

    #query = "How much in the dice i need to rool if if need to break a wood object with an unarmed strike?"
    query = message
    results = similarity_search(query, vectors, content)

    completion = client.chat.completions.create(
    model="gpt-4o-mini",
    store=True,
    temperature=0.1,
    messages=[
        {"role": "system", "content": 
         """
            You are a helpful RPG assistant. 
            You are helping a user understand the rules of a game. 
            You can answer the question based on the context provided.
            The Answer will be interpreted in markdown.
            Answer in the question language.
         """},
        {"role": "user", "content": f"Context: {results}. Question: {query}"}
    ]
    )

    response_data = {
        "message": completion.choices[0].message.content,
        "id": current_chat.id
    }

    return response_data

async def chat_stream(prompt: str, context: str) -> AsyncGenerator[str, None]:
    response = client.chat.completions.create(
        model="gpt-3.5-turbo",
        messages=[{"role": "user", "content": prompt}],
        stream=True
    )

    response = client.chat.completions.create(
        model="gpt-4o-mini",
        store=True,
        temperature=0.1,
        stream=True,
        messages=[
            {"role": "system", "content": 
            """
                You are a helpful RPG assistant. 
                You are helping a user understand the rules of a game. 
                You can answer the question based on the context provided.
                The Answer will be interpreted in markdown.
                Answer in the question language.
            """},
            {"role": "user", "content": f"Context: {context}. Question: {prompt}"}
        ]
    )

    full_response = ""
    for chunk in response:
        if chunk.choices and chunk.choices[0].delta.content:
            content = chunk.choices[0].delta.content
            full_response = content
            yield content
            # Importante: dar um pequeno delay para não sobrecarregar
            await asyncio.sleep(0.01)
    yield "[FINISHED]"
    # continuar aqui


@router.post("/message/streaming/")
def read_items(
    session: SessionDep, 
    current_user: CurrentUser, 
    payload: MessagePayload
) -> Any:
    
    message = payload.message
    id = payload.id
    current_chat = None
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


    json_path = os.path.join('app/data_source/rules-minimal.json')
    with open(json_path, 'r', encoding='utf-8') as file:
        json_data = json.load(file)
    content = get_json_content(json_data)
    vectors = create_embeddings(content)

    #query = "How much in the dice i need to rool if if need to break a wood object with an unarmed strike?"
    query = message
    context = similarity_search(query, vectors, content)
    
    return StreamingResponse(chat_stream(query, context), media_type="text/plain")