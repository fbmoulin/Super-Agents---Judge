"""
Lex Intelligentia AgentOS - Legal AI Agents Backend
"""

from agno.agent import Agent
from agno.models.google import Gemini
from agno.playground import Playground, serve_playground_app

legal_agent = Agent(
    name="Lex Legal Assistant",
    model=Gemini(id="gemini-2.0-flash"),
    instructions=[
        "You are a legal assistant specialized in Brazilian civil law.",
        "You help draft judicial decisions and sentences.",
        "Always cite relevant laws, súmulas, and jurisprudence.",
        "Use formal legal Portuguese.",
    ],
    markdown=True,
)

app = Playground(agents=[legal_agent]).get_app()

if __name__ == "__main__":
    serve_playground_app("main:app", reload=True)
