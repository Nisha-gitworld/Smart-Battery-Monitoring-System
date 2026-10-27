#!/usr/bin/env python3

from datetime import datetime
import logging
import os
from pathlib import Path
import sys

from flask import Flask, jsonify, request
from flask_cors import CORS
import joblib
import numpy as np
import pandas as pd
import shap
import yaml

sys.path.append(os.path.join(os.path.dirname(__file__), '..'))
from rag import BatteryKnowledgeBase, generate_answer
from xai.shap_analysis import (
    explain_single_prediction,
    generate_human_readable_explanation,
    generate_recommendations,
)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

CONFIG_PATH = Path(__file__).parent.parent / "config" / "config.yaml"
with open(CONFIG_PATH, "r", encoding="utf-8") as f:
    CONFIG = yaml.safe_load(f)

app = Flask(__name__)


def build_cors_origins():
    configured_origins = [
        origin.strip().rstrip("/")
        for origin in os.environ.get("FRONTEND_ORIGIN", "").split(",")
        if origin.strip()
    ]
    default_origins = [
        "https://smart-battery-frontend.onrender.com",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ]
    return sorted(set(configured_origins + default_origins))


CORS(
    app,
    resources={r"/*": {"origins": build_cors_origins()}},
    methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization"],
)

MODEL = None
EXPLAINER = None
METADATA = None
KNOWLEDGE_BASE = None


def convert_numpy(obj):
    if isinstance(obj, np.generic):
        return obj.item()
    if isinstance(obj, np.ndarray):
        return obj.tolist()
    if isinstance(obj, dict):
        return {k: convert_numpy(v) for k, v in obj.items()}
    if isinstance(obj, list):
        return [convert_numpy(i) for i in obj]
    if isinstance(obj, tuple):
        return [convert_numpy(i) for i in obj]
    return obj


def load_model_artifacts():
    global MODEL, EXPLAINER, METADATA

    try:
        MODEL = joblib.load(CONFIG["model"]["model_file"])
        EXPLAINER = shap.TreeExplainer(MODEL)
        METADATA = joblib.load(CONFIG["model"]["metadata_file"])
        logger.info("Model artifacts loaded successfully")
        return True
    except Exception as e:
        logger.error(f"Model load failed: {e}")
        return False


def load_knowledge_base():
    global KNOWLEDGE_BASE

    try:
        KNOWLEDGE_BASE = BatteryKnowledgeBase(
            store_dir=CONFIG["rag"]["store_dir"],
            data_path=CONFIG["rag"]["dataset_file"],
        )
        logger.info("Knowledge base loaded successfully")
        return True
    except Exception as e:
        logger.error(f"Knowledge base load failed: {e}")
        KNOWLEDGE_BASE = None
        return False


@app.route("/", methods=["GET"])
def home():
    return jsonify({
        "service": "Smart Battery Tracking API",
        "status": "running",
        "endpoints": {
            "health": "/health",
            "predict": "/predict",
            "batch_predict": "/batch_predict",
            "model_info": "/model_info",
            "rag_query": "/rag/query",
        },
    })


@app.route("/health", methods=["GET"])
def health():
    return jsonify({
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "model_loaded": MODEL is not None,
        "rag_loaded": KNOWLEDGE_BASE is not None,
    })


@app.route("/predict", methods=["POST"])
def predict():
    if MODEL is None:
        return jsonify({"error": "Model not loaded"}), 500

    try:
        raw_data = request.get_json()
        if not raw_data:
            return jsonify({"error": "No data provided"}), 400

        logger.info(f"Incoming: {raw_data}")

        data = {
            "voltage_mean": raw_data.get("Voltage_measured"),
            "current_mean": raw_data.get("Current_measured"),
            "temperature_mean": raw_data.get("Temperature_measured"),
            "voltage_min": raw_data.get("Voltage_load"),
            "current_min": raw_data.get("Current_load"),
            "capacity": raw_data.get("Battery_impedance", 2.5),
        }

        for key, value in data.items():
            if value is None:
                return jsonify({"error": f"Missing {key}"}), 400

        try:
            explanation = explain_single_prediction(
                data,
                MODEL,
                EXPLAINER,
                None,
                CONFIG["features"]["selected_features"],
            )
        except Exception as e:
            logger.warning(f"SHAP failed: {e}")
            df = pd.DataFrame([data])
            pred = MODEL.predict(df)[0]
            explanation = {
                "prediction": pred,
                "top_contributors": [],
            }

        top_contributors = [
            [str(k), float(v)]
            for k, v in explanation.get("top_contributors", [])
        ]

        explanation_text = generate_human_readable_explanation(explanation)
        recommendations = generate_recommendations(explanation)

        response = {
            "prediction": float(explanation["prediction"]),
            "health_status": explanation.get("health_status", "UNKNOWN"),
            "explanation": {
                "text": str(explanation_text),
                "top_contributors": top_contributors,
            },
            "recommendations": convert_numpy(recommendations),
            "confidence": float(calculate_confidence(explanation)),
            "timestamp": datetime.now().isoformat(),
        }

        return jsonify(convert_numpy(response))

    except Exception as e:
        logger.error(f"Prediction error: {e}")
        return jsonify({"error": str(e)}), 500


@app.route("/batch_predict", methods=["POST"])
def batch_predict():
    if MODEL is None:
        return jsonify({"error": "Model not loaded"}), 500

    try:
        data_list = request.get_json()
        if not isinstance(data_list, list):
            return jsonify({"error": "Expected list of battery data"}), 400

        results = []
        for index, data in enumerate(data_list):
            try:
                df = pd.DataFrame([data])
                pred = MODEL.predict(df)[0]
                results.append({
                    "index": index,
                    "prediction": float(pred),
                })
            except Exception as e:
                results.append({
                    "index": index,
                    "error": str(e),
                })

        return jsonify(convert_numpy({
            "results": results,
            "timestamp": datetime.now().isoformat(),
        }))

    except Exception as e:
        logger.error(f"Batch prediction error: {e}")
        return jsonify({"error": str(e)}), 500


@app.route("/model_info", methods=["GET"])
def model_info():
    if METADATA is None:
        return jsonify({"error": "Model metadata not loaded"}), 500

    return jsonify(convert_numpy({
        "model_type": METADATA.get("model_type"),
        "features": METADATA.get("features"),
        "metrics": METADATA.get("metrics"),
        "training_date": METADATA.get("training_date"),
    }))


@app.route("/rag/query", methods=["POST"])
def rag_query():
    if KNOWLEDGE_BASE is None:
        return jsonify({"error": "Knowledge base not loaded"}), 500

    try:
        data = request.get_json() or {}
        query = (data.get("query") or "").strip()
        top_k = int(data.get("top_k", CONFIG["rag"]["top_k"]))
        provider = data.get("provider", "auto")

        if not query:
            return jsonify({"error": "Query is required"}), 400

        documents = KNOWLEDGE_BASE.search(query, top_k=top_k)
        answer, answer_provider = generate_answer(query, documents, provider=provider)

        return jsonify(convert_numpy({
            "query": query,
            "answer": answer,
            "provider": answer_provider,
            "retrieved_documents": documents,
            "knowledge_base": KNOWLEDGE_BASE.info(),
            "timestamp": datetime.now().isoformat(),
        }))

    except Exception as e:
        logger.error(f"RAG query error: {e}")
        return jsonify({"error": str(e)}), 500


def calculate_confidence(explanation):
    try:
        vals = [abs(v) for _, v in explanation.get("top_contributors", [])[:3]]
        return float(min(1.0, np.mean(vals) * 10))
    except Exception:
        return 0.5


load_model_artifacts()
load_knowledge_base()

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5001))
    app.run(host="0.0.0.0", port=port)
