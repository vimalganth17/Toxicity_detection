import requests
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Dict
from fastapi.middleware.cors import CORSMiddleware
from langchain_core.prompts import ChatPromptTemplate
from langchain_ollama import OllamaLLM

# Initialize FastAPI app
app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Update with specific origins in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Define input model
class UserInput(BaseModel):
    sentence: str  # Changed from `question` to `sentence`

prompt = ChatPromptTemplate.from_messages([
    ("system", "You are a sentence rephrasing assistant. Your task is to rephrase the given toxic sentence into a polite and wiser version, maintaining its original context. Respond only with the rephrased sentence and nothing else."),
    ("user", "{sentence}")
])




# Initialize the LLM model
llm = OllamaLLM(model="llama3.2", temperature = 0)
chain = prompt | llm

# Define API route
@app.post("/rephrase")
async def rephrase_sentence(user_input: UserInput):
    try:
        # Invoke the chain with user input
        response = chain.invoke({"sentence": user_input.sentence})
        print(response)
        return {"response": response}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
