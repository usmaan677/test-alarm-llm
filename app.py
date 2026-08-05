"""
FastAPI service for the alarm assistant
This is the orchestrator level and it takes a query over HTTP, calls the retrival module, logs the interaction,
all the real work is in rag.py and audit.py
"""
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel


import rag
import audit
import config

@asynccontextmanager
async def lifespan(app):
    #Runs once on startup to build the query engine so that first request isnt slowed down
    rag.get_query_engine()
    yield


app = FastAPI(title = "Ibex Alarm Assist", lifespan=lifespan)

class Query(BaseModel):
    question: str
    model: str | None = None

@app.get("/health")
def health():
    return {"status":"ok"}

@app.get("/models")
def models():
    return {"models":config.AVAILABLE_MODELS, "default":config.LLM_MODEL}

@app.post("/query")
def query_endpoint(q:Query):
    try:
        result = rag.answer_query(q.question,q.model)
    except:
        raise HTTPException(status_code =400, detail = str(e))
    audit.write_entry(q.question, result["answer"],result["sources"], result["model"])
    return result
