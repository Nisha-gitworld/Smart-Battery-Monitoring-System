import json
from pathlib import Path
from typing import List

import numpy as np

try:
    import faiss  # type: ignore
except ImportError:  # pragma: no cover
    faiss = None

from embeddings.embed import EmbeddingClient, build_knowledge_base


class BatteryKnowledgeBase:
    def __init__(self, store_dir: str | Path = "embeddings/store", data_path: str | Path = "data/battery_docs.json") -> None:
        self.store_dir = Path(store_dir)
        self.data_path = Path(data_path)
        self.embedding_client = EmbeddingClient()
        self.index = None
        self.documents: List[dict] = []
        self.vectors: np.ndarray | None = None
        self.metadata: dict = {}
        self._load_or_create()

    def _load_or_create(self) -> None:
        required_files = [
            self.store_dir / "documents.json",
            self.store_dir / "vectors.npy",
            self.store_dir / "metadata.json",
        ]
        if not all(path.exists() for path in required_files):
            build_knowledge_base(self.data_path, self.store_dir)

        with (self.store_dir / "documents.json").open("r", encoding="utf-8") as handle:
            self.documents = json.load(handle)
        with (self.store_dir / "metadata.json").open("r", encoding="utf-8") as handle:
            self.metadata = json.load(handle)
        self.vectors = np.load(self.store_dir / "vectors.npy").astype(np.float32)

        index_path = self.store_dir / "battery_docs.faiss"
        if faiss is not None and index_path.exists():
            self.index = faiss.read_index(str(index_path))

    def search(self, query: str, top_k: int = 3) -> List[dict]:
        top_k = max(1, min(top_k, len(self.documents)))
        query_vector = self.embedding_client.embed_texts([query]).astype(np.float32)

        if self.index is not None:
            scores, indices = self.index.search(query_vector, top_k)
            ranked_scores = scores[0]
            ranked_indices = indices[0]
        else:
            assert self.vectors is not None
            ranked_scores = np.dot(self.vectors, query_vector[0])
            ranked_indices = np.argsort(ranked_scores)[::-1][:top_k]
            ranked_scores = ranked_scores[ranked_indices]

        results = []
        for score, idx in zip(ranked_scores, ranked_indices):
            if idx < 0:
                continue
            document = dict(self.documents[int(idx)])
            document["score"] = float(score)
            results.append(document)
        return results

    def info(self) -> dict:
        return {
            "document_count": len(self.documents),
            "embedding_provider": self.metadata.get("provider", "unknown"),
            "embedding_model": self.metadata.get("model_name", "unknown"),
            "faiss_enabled": self.index is not None,
        }
