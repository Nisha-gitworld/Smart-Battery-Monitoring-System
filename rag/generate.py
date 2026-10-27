import os
from typing import List, Tuple

def _build_context(documents: List[dict]) -> str:
    return "\n\n".join(
        (
            f"Topic: {doc.get('topic', 'unknown')}\n"
            f"Severity: {doc.get('severity', 'unknown')}\n"
            f"Content: {doc.get('content', '')}\n"
            f"Cause: {doc.get('cause', '')}\n"
            f"Effect: {doc.get('effect', '')}\n"
            f"Recommendation: {doc.get('recommendation', '')}"
        )
        for doc in documents
    )


def _local_answer(query: str, documents: List[dict]) -> str:
    if not documents:
        return "I could not find a relevant battery knowledge entry for that question."

    primary = documents[0]
    supporting = ", ".join(doc.get("topic", "unknown") for doc in documents[1:3])
    answer = (
        f"For \"{query}\", the strongest match is {primary.get('topic', 'this battery condition')}. "
        f"{primary.get('content', '')} Recommended action: {primary.get('recommendation', '')}"
    )
    if supporting:
        answer += f" Related supporting topics include {supporting}."
    return answer


def _generate_with_openai(query: str, documents: List[dict]) -> str | None:
    if not os.environ.get("OPENAI_API_KEY"):
        return None

    try:
        from openai import OpenAI  # type: ignore

        client = OpenAI()
        prompt = (
            "You are a battery diagnostics assistant. Answer the user using only the supplied retrieval context. "
            "Keep the answer practical, mention likely causes, severity, and recommended actions.\n\n"
            f"User question: {query}\n\n"
            f"Context:\n{_build_context(documents)}"
        )
        response = client.responses.create(
            model=os.environ.get("OPENAI_CHAT_MODEL", "gpt-4.1-mini"),
            input=prompt,
        )
        return response.output_text.strip()
    except Exception:
        return None


def _generate_with_gemini(query: str, documents: List[dict]) -> str | None:
    if not os.environ.get("GEMINI_API_KEY"):
        return None

    try:
        import google.generativeai as genai  # type: ignore

        genai.configure(api_key=os.environ["GEMINI_API_KEY"])
        model = genai.GenerativeModel(os.environ.get("GEMINI_MODEL", "gemini-1.5-flash"))
        prompt = (
            "Answer the battery question using only the retrieval context. "
            "Explain likely causes, risk level, and immediate recommendation.\n\n"
            f"Question: {query}\n\nContext:\n{_build_context(documents)}"
        )
        response = model.generate_content(prompt)
        return (response.text or "").strip()
    except Exception:
        return None


def generate_answer(query: str, documents: List[dict], provider: str = "auto") -> Tuple[str, str]:
    provider = provider.lower()

    if provider in {"auto", "openai"}:
        answer = _generate_with_openai(query, documents)
        if answer:
            return answer, "openai"

    if provider in {"auto", "gemini"}:
        answer = _generate_with_gemini(query, documents)
        if answer:
            return answer, "gemini"

    return _local_answer(query, documents), "local"
