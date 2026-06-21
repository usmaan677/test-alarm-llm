from llama_index.core import VectorStoreIndex, SimpleDirectoryReader, Settings
from llama_index.llms.ollama import Ollama
from llama_index.embeddings.ollama import OllamaEmbedding

Settings.llm = Ollama(model = "llama3.2:3b", request_timeout = 600.0)
Settings.embed_model = OllamaEmbedding(model_name="nomic-embed-text")

documents = SimpleDirectoryReader("sops").load_data()
index = VectorStoreIndex.from_documents(documents)
query_engine = index.as_query_engine()

response = query_engine.query("What are the complete step-by-step operator actions when OTSG "
    "pressure exceeds 11,500 kPag? List every step including all "
    "shutdown valves to close.")

print(response)


