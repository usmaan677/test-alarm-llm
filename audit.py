"""
Audit logging for each query

It writes one JSON object per line for every query handled.

We can change this later to go into a database rather than be file-based.
"""

import json
from datetime import datetime, timezone

import config

def write_entry(question, answer, sources):
    #Appends one audit record.
    entry = {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "question": question,
        "answer": answer,
        "sources": sources,
    }
    try:
        with open(config.AUDIT_LOG_PATH, "a", encoding="utf-8") as f:
            f.write(json.dumps(entry) + "\n")
    except Exception as e:
        print(f"[audit] failed to write entry: {e}")
        
