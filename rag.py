"""
Retrival logic for the service
This model has everythign anout the RAG
The web layer - app.py will import from here
"""

import chromadb
import chromadb
from llama_index.core import (
    VectorStoreIndex,
    SimpleDirectoryReader,
    StorageContext,
    Settings,
)
from llama_index.vector_stores.chroma import ChromaVectorStore
from llama_index.llms.ollama import Ollama
from llama_index.core import Document
from llama_index.embeddings.ollama import OllamaEmbedding
 
import config


#This is the general prompt that the sytem will always abide by
SYSTEM_PROMPT = (
    "You are an assistant for control room operators. Answer ONLY using the "
    "procedure text provided to you.\n\n"
    "CRITICAL MATCHING RULE: Only answer if the provided text contains a "
    "procedure for the SPECIFIC condition AND the SPECIFIC equipment named in "
    "the question. The equipment (e.g. OTSG, FWKO separator, ESP motor) and the "
    "condition (e.g. high pressure, low pressure, high temperature, low level) "
    "must BOTH match. If the text only covers a different condition for that "
    "equipment (for example, only HIGH pressure when the question asks about LOW "
    "pressure), or only a different piece of equipment, you MUST decline. Do NOT "
    "adapt, borrow, or generalize a procedure written for a different condition "
    "or different equipment to answer the question.\n\n"
    "When a matching procedure exists: reproduce ALL of its steps in order, "
    "completely, and reproduce tag names, thresholds, and valve numbers exactly "
    "as written. Do NOT add rationale, commentary, or steps not in the source.\n\n"
    "If no procedure matches the specific equipment and condition asked about, "
    "respond exactly: \"I do not have a procedure for that.\" Do not add anything "
    "else."
)

#Module level handle to the query engine 
_query_engine = None


def _load_procedure_chunks():
    """Read the SOP file and split it into one chunk per procedure.

    Each procedure in the source starts with a 'SOP-032-' marker. Splitting
    on that keeps every procedure whole and self-contained, so retrieval
    returns one clean chunk per alarm instead of a blend of several.
    """
    import os

    documents = []
    for fname in os.listdir(config.SOPS_DIR):
        path = os.path.join(config.SOPS_DIR, fname)
        if not os.path.isfile(path):
            continue
        with open(path, "r", encoding="utf-8") as f:
            text = f.read()

        # Split on the procedure marker. Keep the marker with each piece.
        parts = text.split("SOP-032-")
        header = parts[0]  # intro/general-notes block before the first procedure

        if header.strip():
            documents.append(Document(text=header, metadata={"file_name": fname}))

        for part in parts[1:]:
            chunk = "SOP-032-" + part
            documents.append(Document(text=chunk.strip(), metadata={"file_name": fname}))

    return documents
 
def _build_query_engine():
    """Set up models, load or build the Chroma index, return a query engine."""
    Settings.llm = Ollama(
        model=config.LLM_MODEL,
        request_timeout=config.REQUEST_TIMEOUT,
        system_prompt=SYSTEM_PROMPT,
    )
    Settings.embed_model = OllamaEmbedding(model_name=config.EMBED_MODEL)
 
    chroma_client = chromadb.PersistentClient(path=config.CHROMA_PATH)
    collection = chroma_client.get_or_create_collection(config.COLLECTION_NAME)
    vector_store = ChromaVectorStore(chroma_collection=collection)

    if collection.count() == 0:
        print("Embedding documents for the first time...")
        documents = _load_procedure_chunks()
        storage_context = StorageContext.from_defaults(vector_store=vector_store)
        index = VectorStoreIndex.from_documents(
            documents, storage_context=storage_context
        )
    else:
        print("Loading existing index from disk...")
        index = VectorStoreIndex.from_vector_store(vector_store)
 
    return index.as_query_engine(
        similarity_top_k=config.SIMILARITY_TOP_K,
        response_mode=config.RESPONSE_MODE,
    )
#returns the shared query engine, builds it if it is not built already
def get_query_engine():
    global _query_engine
    if _query_engine is None:
        _query_engine = _build_query_engine()
    return _query_engine

#Runs one query and returns the answer and the citations for the sources used
def answer_query(question):
    engine = get_query_engine()
    response = engine.query(question)
 
    # Pull out which source chunks were retrieved, for the audit trail.
    sources = []
    for node in getattr(response, "source_nodes", []):
        sources.append({
            "file": node.metadata.get("file_name", "unknown"),
            "score": round(float(node.score), 4) if node.score is not None else None,
        })
 
    return {"answer": str(response), "sources": sources}




