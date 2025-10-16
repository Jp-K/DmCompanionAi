import json
import os
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from sentence_transformers import SentenceTransformer
import numpy as np
from sklearn.metrics.pairwise import cosine_similarity

model = SentenceTransformer('all-MiniLM-L6-v2')

def create_embeddings(content):
    texts = [f"Title: {item['title']}, Text: {item['text']}" for item in content]
    vectors = model.encode(texts, convert_to_numpy=True)
    return vectors

def similarity_search(query, vectors, content):
    query_vector = model.encode([query], convert_to_numpy=True)
    similarities = cosine_similarity(query_vector, vectors).flatten()
    indices = np.argsort(-similarities)[:3]
    results = [{"title": content[i]["title"], "text": content[i]["text"], "similarity": similarities[i]} for i in indices]
    return results

def get_json_content(json_data):
    result = []
    for item in json_data["spells"]:
        title = item["title"]
        description = item["description"]
        result.append({"title": title, "text": description})
    return result

if __name__ == "__main__":
    dir = os.path.dirname(__file__)
    filename = os.path.join(dir, 'new_spells.json')
    with open(filename, 'r', encoding='utf-8') as file:
        json_data = json.load(file)
    content = get_json_content(json_data)
    vectors = create_embeddings(content)

    #query = "How much in the dice i need to rool if if need to break a wood object with an unarmed strike?"
    query = "What is the fireball spell?"
    results = similarity_search(query, vectors, content)
    print(f"Query: {query}")
    for result in results:
        print(result)

