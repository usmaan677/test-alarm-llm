"""
FastAPI service for the alarm assistant
This is the orchestrator level and it takes a query over HTTP, calls the retrival module, logs the interaction,
all the real work is in rag.py and audit.py
"""
from contextlib import asynccontextmanager

from fastapi import FastAPI
from pydantic import BaseModel

import rag
import audit

@asynccontextmanager
async def lifespan(app):
    #Runs once on startup to build the query engine so that first request isnt slowed down
    rag.get_query_engine()
    yield


app = FastAPI(title = "Ibex Alarm Assist", lifespan=lifespan)

class Query(BaseModel):
    question: str

@app.get("/health")
def health():
    return {"status":"ok"}

@app.post("/query")
def query_endpoint(q:Query):
    result = rag.answer_query(q.question)
    audit.write_entry(q.question, result["answer"],result["sources"])
    return result
