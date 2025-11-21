import uuid
from typing import Any

from fastapi import APIRouter, HTTPException
from sqlmodel import func, select

from app.api.deps import CurrentUser, SessionDep
from app.models import Chat, ChatCreate, ChatPublic, ChatsPublic, ChatUpdate, Message
from app.utils import create_embeddings, get_json_content, similarity_search
router = APIRouter(prefix="/items", tags=["items"])


@router.get("/", response_model=ChatsPublic)
def read_items(
    session: SessionDep, current_user: CurrentUser, skip: int = 0, limit: int = 100
) -> Any:
    """
    Retrieve items.
    """
    # import json
    # import os
    # json_path = os.path.join('app/data_source/rules-minimal.json')
    # with open(json_path, 'r', encoding='utf-8') as file:
    #     json_data = json.load(file)
    # content = get_json_content(json_data)
    # vectorizer, vectors = create_embeddings(content)

    # query = "How mutch in the dice i need to rool if if need to break a wood object with an unarmed strike?"
    # results = similarity_search(query, vectorizer, vectors, content)
    # print(f"Query: {query}")
    # for result in results:
    #     print(result)

    # from openai import OpenAI

    # client = OpenAI(
    #     api_key="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"
    # )

    # completion = client.chat.completions.create(
    # model="gpt-4o-mini",
    # store=True,
    # temperature=0.1,
    # messages=[
    #     {"role": "system", "content": 
    #      """
    #         You are a helpful RPG assistant. 
    #         You are helping a user understand the rules of a game. 
    #         You can answer the question based on the context provided.
    #         Answer in the question language.
    #      """},
    #     {"role": "user", "content": f"Context: {results}. Question: {query}"}
    # ]
    # )

    # print(completion.choices[0].message)

    if current_user.is_superuser:
        count_statement = select(func.count()).select_from(Chat)
        count = session.exec(count_statement).one()
        statement = select(Chat).offset(skip).limit(limit)
        items = session.exec(statement).all()
    else:
        count_statement = (
            select(func.count())
            .select_from(Chat)
            .where(Chat.owner_id == current_user.id)
        )
        count = session.exec(count_statement).one()
        statement = (
            select(Chat)
            .where(Chat.owner_id == current_user.id)
            .offset(skip)
            .limit(limit)
        )
        items = session.exec(statement).all()

    return ChatsPublic(data=items, count=count)


@router.get("/{id}", response_model=ChatPublic)
def read_item(session: SessionDep, current_user: CurrentUser, id: uuid.UUID) -> Any:
    """
    Get item by ID.
    """
    item = session.get(Chat, id)
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    if not current_user.is_superuser and (item.owner_id != current_user.id):
        raise HTTPException(status_code=400, detail="Not enough permissions")
    return item


@router.post("/", response_model=ChatPublic)
def create_item(
    *, session: SessionDep, current_user: CurrentUser, item_in: ChatCreate
) -> Any:
    """
    Create new item.
    """
    item = Chat.model_validate(item_in, update={"owner_id": current_user.id})
    session.add(item)
    session.commit()
    session.refresh(item)
    return item


@router.put("/{id}", response_model=ChatPublic)
def update_item(
    *,
    session: SessionDep,
    current_user: CurrentUser,
    id: uuid.UUID,
    item_in: ChatUpdate,
) -> Any:
    """
    Update an item.
    """
    item = session.get(Chat, id)
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    if not current_user.is_superuser and (item.owner_id != current_user.id):
        raise HTTPException(status_code=400, detail="Not enough permissions")
    update_dict = item_in.model_dump(exclude_unset=True)
    item.sqlmodel_update(update_dict)
    session.add(item)
    session.commit()
    session.refresh(item)
    return item


@router.delete("/{id}")
def delete_item(
    session: SessionDep, current_user: CurrentUser, id: uuid.UUID
) -> Message:
    """
    Delete an item.
    """
    item = session.get(Chat, id)
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    if not current_user.is_superuser and (item.owner_id != current_user.id):
        raise HTTPException(status_code=400, detail="Not enough permissions")
    session.delete(item)
    session.commit()
    return Message(message="Item deleted successfully")
