 # Smart Battery Monitoring System with Explainable AI

A research-driven intelligent battery analytics platform for battery health prediction, Remaining Useful Life (RUL) estimation, explainable AI, and retrieval-augmented battery guidance.

## Live Deployment

- Frontend Dashboard: https://smart-battery-frontend.onrender.com/
- Backend API: https://smart-battery-api.onrender.com/

## Overview

This project combines machine learning, SHAP explanations, retrieval-augmented generation (RAG), and an interactive React dashboard for battery monitoring and decision support.

The platform supports:

- Real-time battery condition monitoring
- Remaining Useful Life (RUL) estimation
- Explainable model predictions using SHAP
- Grounded battery safety and maintenance answers through RAG
- Human-centered AI decision support

## System Architecture

```text
[Battery Dataset] -> [Feature Engineering] -> [ML Prediction Engine]
         |                    |                    |
   NASA Battery Data     Statistical Features    XGBoost/RF Models
                                                     |
                                             [Explainability Layer]
                                                     |
                                                SHAP Analysis
                                                     |
                                              [Flask REST API]
                                                     |
                                      [React Dashboard + RAG Assistant]
```

## Core Features

### Intelligent Battery Analytics

- Battery degradation trend analysis
- Health state monitoring
- Remaining Useful Life prediction
- Predictive maintenance support

### Explainable AI

- SHAP-based feature importance analysis
- Interpretable model outputs
- Transparent prediction reasoning
- AI-assisted operational insights

### RAG Battery Assistant

- Visible **Solve Battery Query** option on the frontend
- Answer provider display, for example `local`, `gemini`, or `openai`
- Knowledge document count display, for example `Docs: 30`
- Embedding model display, for example `hashing-v1`
- Retrieved document cards with topic, severity, score, and recommendation

## Technology Stack

| Layer | Technologies |
|---|---|
| Frontend | React, Material UI, Axios |
| Backend | Python, Flask, Flask-CORS, Gunicorn |
| Machine Learning | Scikit-learn, XGBoost |
| Explainable AI | SHAP |
| RAG Retrieval | FAISS when available, numpy similarity fallback |
| RAG Embeddings | Local hash embeddings, optional OpenAI embeddings |
| RAG Generation | Gemini, optional OpenAI, local fallback |
| Data Processing | Pandas, NumPy |
| Deployment | Render Blueprint |

## Dataset

The implementation uses the NASA Prognostics Center of Excellence battery dataset for battery degradation modeling and predictive analysis.

Dataset source:

https://ti.arc.nasa.gov/tech/dash/groups/pcoe/prognostic-data-repository/

Supported battery samples include:

- B0005
- B0006
- B0007
- B0018

## Project Structure

```text
backend/               # Flask API services
frontend/              # React dashboard
data/
  battery_docs.json    # RAG knowledge base
  raw/                 # Original dataset files
  processed/           # Processed datasets
embeddings/
  embed.py             # Embedding builder
  store/               # Persisted RAG vectors and metadata
rag/                   # Retrieval and answer generation
models/                # Training and inference modules
xai/                   # SHAP explainability components
tests/                 # Test cases
render.yaml            # Render Blueprint
```

## Installation

```bash
git clone <repository-url>
cd smart-battery-monitoring
pip install -r requirements.txt
```

Download NASA battery dataset files and place them inside:

```text
data/raw/
```

## Running Locally

Start the backend API:

```bash
python backend/api.py
```

Start the frontend:

```bash
cd frontend
npm install
npm start
```

For local React development, either rely on the `proxy` in `frontend/package.json` or create `frontend/.env` from `frontend/.env.example`.

## API Endpoints

| Endpoint | Description |
|---|---|
| `/health` | API health status, including model and RAG load state |
| `/predict` | Battery prediction endpoint |
| `/batch_predict` | Batch battery prediction endpoint |
| `/model_info` | Model metadata |
| `/rag/query` | Retrieval-augmented battery query endpoint |

### RAG Query Contract

Request:

```json
{
  "query": "Why does my battery heat while charging?",
  "top_k": 3,
  "provider": "auto"
}
```

Response includes:

- `provider`: answer provider used
- `knowledge_base.document_count`: total docs in the RAG knowledge base
- `knowledge_base.embedding_model`: embedding model used
- `retrieved_documents`: source documents shown in the frontend

## Render Deployment

This repo is configured for two separate Render services:

- `smart-battery-api`: Python web service for Flask, predictions, SHAP, and RAG.
- `smart-battery-frontend`: React static site for the dashboard.

Deploy both from `render.yaml` using Render Blueprints.

### Backend Environment Variables

```text
FRONTEND_ORIGIN=https://your-frontend-site.onrender.com
GEMINI_API_KEY=your-gemini-key
GEMINI_MODEL=gemini-1.5-flash
```

`GEMINI_API_KEY` belongs only on the backend service. Do not add it to the frontend static site.

### Frontend Environment Variables

```text
REACT_APP_API_URL=https://your-api-service.onrender.com
```

With the current Blueprint, Render can derive `REACT_APP_API_URL` from the API service and `FRONTEND_ORIGIN` from the frontend service. Render still prompts for secret keys such as `GEMINI_API_KEY` because they are marked with `sync: false`.

## Research Contribution

This work explores the integration of:

- Explainable AI for battery diagnostics
- Human-AI collaborative monitoring systems
- Interpretable predictive maintenance workflows
- Retrieval-augmented operational guidance

## Evaluation Metrics

- RMSE
- Prediction accuracy
- Feature importance consistency
- Explanation usefulness
- Retrieval relevance

## Future Enhancements

- Advanced deep learning architectures
- Streaming IoT sensor integration
- Edge deployment optimization
- Multi-battery fleet analytics
- User behavior evaluation studies

## Citation

```bibtex
@misc{smart_battery_monitoring_2026,
  title={Smart Battery Monitoring System with Explainable AI},
  author={Udai Tiwari},
  year={2026}
}
```

## License

This project is intended for research, academic experimentation, and educational purposes.
