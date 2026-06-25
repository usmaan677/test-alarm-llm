import chromadb
from llama_index.core import VectorStoreIndex, SimpleDirectoryReader, StorageContext, Settings
from llama_index.vector_stores.chroma import ChromaVectorStore
from llama_index.llms.ollama import Ollama
from llama_index.embeddings.ollama import OllamaEmbedding

Settings.llm = Ollama(model = "llama3.2:3b", request_timeout = 600.0)
Settings.embed_model = OllamaEmbedding(model_name="nomic-embed-text")

#Persistent chroma client and it saves to ./chroma_db on local disk
chroma_client = chromadb.PersistentClient(path="./chroma_db")
collection = chroma_client.get_or_create_collection("sops")
vector_store = ChromaVectorStore(chroma_collection=collection)

#embeds the SOPs only if the file is empty otherwise loads the saved index from the disk

if collection.count()==0:
    print("Embedding documents in progress...")
    documents = SimpleDirectoryReader("sops").load_data()
    storage_context = StorageContext.from_defaults(vector_store = vector_store)
    index = VectorStoreIndex.from_documents(documents, storage_context = storage_context)
else:
    print("Load exisitng index from disk...")
    index = VectorStoreIndex.from_vector_store(vector_store)


query_engine = index.as_query_engine(similarity_top_k=4, response_mode = "tree_summarize")

response = query_engine.query("What is the ESD response when OTSG pressure exceeds 11,500 kPag? Give a detailed step-by-step explanation")

print(response)


