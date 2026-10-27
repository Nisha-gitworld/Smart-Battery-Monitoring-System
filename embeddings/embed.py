import hashlib
import json
import os
from pathlib import Path
from typing import Iterable, List

import numpy as np

try:
    import faiss  # type: ignore
except ImportError:  # pragma: no cover
    faiss = None


EMBED_DIMENSION = 256


def _tokenize(text: str) -> List[str]:
    return [token for token in "".join(ch.lower() if ch.isalnum() else " " for ch in text).split() if token]


class EmbeddingClient:
    def __init__(self) -> None:
        self.provider = "local"
        self.model_name = "hashing-v1"

        if os.environ.get("OPENAI_API_KEY"):
            try:
                from openai import OpenAI  # type: ignore

                self._client = OpenAI()
                self.provider = "openai"
                self.model_name = os.environ.get("OPENAI_EMBEDDING_MODEL", "text-embedding-3-small")
            except Exception:
                self._client = None
        else:
            self._client = None

    def embed_texts(self, texts: Iterable[str]) -> np.ndarray:
        texts = list(texts)
        if self.provider == "openai" and self._client is not None:
            response = self._client.embeddings.create(model=self.model_name, input=texts)
            vectors = np.array([item.embedding for item in response.data], dtype=np.float32)
            return _normalize(vectors)

        vectors = np.vstack([_hash_embedding(text) for text in texts]).astype(np.float32)
        return _normalize(vectors)


def _hash_embedding(text: str, dimension: int = EMBED_DIMENSION) -> np.ndarray:
    vector = np.zeros(dimension, dtype=np.float32)
    for token in _tokenize(text):
        digest = hashlib.sha256(token.encode("utf-8")).hexdigest()
        bucket = int(digest[:8], 16) % dimension
        sign = 1.0 if int(digest[8:10], 16) % 2 == 0 else -1.0
        vector[bucket] += sign

    if not np.any(vector):
        vector[0] = 1.0
    return vector


def _normalize(vectors: np.ndarray) -> np.ndarray:
    norms = np.linalg.norm(vectors, axis=1, keepdims=True)
    norms[norms == 0] = 1.0
    return vectors / norms


def _document_to_text(document: dict) -> str:
    parts = [
        document.get("topic", ""),
        document.get("content", ""),
        document.get("cause", ""),
        document.get("effect", ""),
        document.get("recommendation", ""),
        " ".join(document.get("tags", [])),
        document.get("severity", ""),
    ]
    return " ".join(part for part in parts if part).strip()


def build_knowledge_base(
    data_path: str | Path = "data/battery_docs.json",
    output_dir: str | Path = "embeddings/store",
) -> dict:
    data_path = Path(data_path)
    output_dir = Path(output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)

    with data_path.open("r", encoding="utf-8") as handle:
        documents = json.load(handle)

    client = EmbeddingClient()
    document_texts = [_document_to_text(doc) for doc in documents]
    vectors = client.embed_texts(document_texts).astype(np.float32)

    np.save(output_dir / "vectors.npy", vectors)
    with (output_dir / "documents.json").open("w", encoding="utf-8") as handle:
        json.dump(documents, handle, indent=2)
    with (output_dir / "metadata.json").open("w", encoding="utf-8") as handle:
        json.dump(
            {
                "provider": client.provider,
                "model_name": client.model_name,
                "dimension": int(vectors.shape[1]),
                "document_count": len(documents),
                "faiss_enabled": faiss is not None,
            },
            handle,
            indent=2,
        )

    if faiss is not None:
        index = faiss.IndexFlatIP(vectors.shape[1])
        index.add(vectors)
        faiss.write_index(index, str(output_dir / "battery_docs.faiss"))

    return {
        "document_count": len(documents),
        "embedding_provider": client.provider,
        "index_path": str(output_dir / "battery_docs.faiss"),
    }


if __name__ == "__main__":
    info = build_knowledge_base()
    print(f"Knowledge base built with {info['document_count']} documents using {info['embedding_provider']}.")
