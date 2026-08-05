"""
Central configuration for the alarm service
Here we can change every part of our system if we ever want to switch anything out
"""

#Models
LLM_MODEL = "llama3.2:3b"
#LLM_MODEL = "llama3.1:8b"
#LLM_MODEL = "qwen2.5:3b"
AVAILABLE_MODELS = ["llama3.2:3b","qwen2.5:3b", "llama3.1:8b"]
EMBED_MODEL = "nomic-embed-text"   
REQUEST_TIMEOUT = 600.0
CONTEXT_WINDOW = 8192

#Vector Store
CHROMA_PATH = "./chroma_db"          
COLLECTION_NAME = "sops"             
SOPS_DIR = "sops" 

#Retrival
SIMILARITY_TOP_K = 2                 
RESPONSE_MODE = "tree_summarize" 

#Audit
AUDIT_LOG_PATH = "audit_log.jsonl"