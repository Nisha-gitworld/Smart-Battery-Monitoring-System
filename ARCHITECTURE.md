# Smart Battery System - Clean Architecture Implementation

## 📋 Project Structure

```
smart-battery-system/
│
├── config/
│   └── config.yaml                 ✅ Centralized configuration
│
├── data/
│   ├── raw/
│   ├── processed/
│   │   └── final_dataset.csv       ✅ Single output (200K balanced samples)
│   └── preprocessing.py            ✅ Single pipeline (RUL generation + sampling)
│
├── models/
│   ├── train.py                    ✅ Training with battery-wise split
│   ├── predict.py                  ✅ Inference module with BatteryPredictor class
│   ├── model.pkl                   ✅ XGBoost model
│   ├── metadata.pkl                ✅ Model metadata
│   └── shap_explainer.pkl          ✅ SHAP explainer
│
├── backend/
│   └── api.py                      ✅ Single Flask API
│
├── frontend/
│   └── (React app)
│
├── xai/
│   └── shap_analysis.py            ✅ SHAP explanations
│
├── tests/
│   └── validate_system.py
│
├── requirements.txt                ✅ All dependencies including pyyaml
├── config.json                     ⚠️  Legacy (can be removed)
├── README.md
└── Dockerfile
```

## 🔧 Key Features of New Structure

### 1. **Centralized Configuration (config/config.yaml)**
- Single source of truth for all paths and parameters
- Loaded by all modules at startup
- Easy to modify without code changes
- Includes:
  - Data paths (raw, processed, final)
  - Model paths and parameters
  - XGBoost hyperparameters
  - Feature selection
  - Training parameters

### 2. **Unified Data Pipeline (data/preprocessing.py)**
- **5 Steps:**
  1. RUL generation for ALL 7.3M rows
  2. Intelligent downsampling to 200K samples
  3. RUL quantile balancing (5 bins, 40K per bin max)
  4. Feature preprocessing (numeric conversion, NaN handling)
  5. Saves single `final_dataset.csv`

- **Benefits:**
  - Reproducible: Uses `random_state=42`
  - Efficient: Handles 7.3M rows in memory
  - Transparent: Clear logging of each step
  - Single output: `final_dataset.csv` ready for training

### 3. **Modular Model Training (models/train.py)**
- Uses config.yaml for all paths/parameters
- Battery-wise train/test split (prevents data leakage)
- Uses config-driven feature selection
- Saves model + metadata + SHAP explainer
- Clear methodology documentation

### 4. **Prediction Module (models/predict.py)**
- `BatteryPredictor` class for easy inference
- Single method interface: `predict_single()` and `predict_batch()`
- Automatic health classification (EXCELLENT/GOOD/FAIR/POOR/CRITICAL)
- SHAP integration for explainability
- Config-based feature validation

### 5. **Unified API (backend/api.py)**
- Single Flask application
- Config-driven model loading
- Endpoints:
  - `/predict` - Single prediction with explanation
  - `/batch_predict` - Multiple predictions
  - `/model_info` - Model metadata
  - `/health` - Health check

## 📊 Data Flow

```
Raw Data (7.3M rows)
    ↓
preprocessing.py
    ├─ Generate RUL for ALL rows
    ├─ Downsample intelligently (200K)
    ├─ Balance by RUL quantiles
    └─ Save final_dataset.csv
    ↓
train.py
    ├─ Load final_dataset.csv
    ├─ Battery-wise split (80/20)
    ├─ Train XGBoost
    └─ Save model artifacts
    ↓
predict.py / api.py
    ├─ Load model + config
    ├─ Make predictions
    └─ Return with explanations
```

## 🚀 Usage Guide

### Step 1: Preprocess Data
```bash
python data/preprocessing.py
```
Output: `data/processed/final_dataset.csv` (200K samples, balanced)

### Step 2: Train Model
```bash
python models/train.py
```
Output: 
- `models/model.pkl`
- `models/metadata.pkl`
- `models/shap_explainer.pkl`

### Step 3: Make Predictions
```python
from models.predict import BatteryPredictor

predictor = BatteryPredictor()
result = predictor.predict_single({
    'Voltage_measured': 3.8,
    'Current_measured': -0.5,
    'Temperature_measured': 25.0,
    'Current_load': 1.0,
    'Voltage_load': 4.0
})
print(f"RUL: {result['prediction']:.1f}")
print(f"Health: {result['health_status']}")
```

### Step 4: Run API Server
```bash
python backend/api.py
```
Server runs on `http://localhost:5000`

### Step 5: Access Web Dashboard
```bash
cd frontend
npm start
```
Dashboard runs on `http://localhost:3000`

## 📈 Model Performance

- **Type:** XGBoost Regressor
- **Training Samples:** ~160K (80% of 200K)
- **Test Samples:** ~40K (20% of 200K)
- **Features:** 5 selected (Voltage, Current, Temperature, Load metrics)
- **RUL Range:** 0-1500 cycles (normalized)
- **Battery-wise Split:** Prevents data leakage, tests generalization

## 🔄 Configuration System

All modules use `config/config.yaml`:

```yaml
data:
  final_dataset: "data/processed/final_dataset.csv"

model:
  model_file: "models/model.pkl"
  metadata_file: "models/metadata.pkl"
  xgboost:
    n_estimators: 500
    max_depth: 6
    learning_rate: 0.1

features:
  selected_features:
    - "Voltage_measured"
    - "Current_measured"
    - "Temperature_measured"
    - "Current_load"
    - "Voltage_load"
```

## ✅ Validation

Run the validation suite:
```bash
python tests/validate_system.py
```

Checks:
- Config files exist
- Data pipeline works
- Model trains successfully
- Predictions are reasonable
- API endpoints respond

## 📝 Clean Up

Legacy files that can be removed:
- `api.py` (renamed to backend/api.py)
- `ml_api.py` (renamed to backend/api.py)
- `battery_model.pkl` (moved to models/model.pkl)
- `model_metadata.pkl` (moved to models/metadata.pkl)
- `shap_explainer.pkl` (moved to models/shap_explainer.pkl)
- `config.json` (replaced by config/config.yaml)
- Various test scripts (consolidated into tests/validate_system.py)

## 🎯 Benefits of New Architecture

✅ **Single source of truth** - config.yaml  
✅ **Reproducible pipelines** - deterministic random seeds  
✅ **Data validation** - 200K balanced samples  
✅ **No data leakage** - battery-wise train/test split  
✅ **Modular design** - independent, testable components  
✅ **Easy deployment** - containerized with Docker  
✅ **Explainable AI** - SHAP integration throughout  
✅ **Research-grade** - methodology clearly documented  

## 🔗 Dependencies

```
paho-mqtt          # MQTT messaging
streamlit           # Dashboard framework
pandas              # Data processing
flask               # API server
scikit-learn==1.5.0 # ML utilities
xgboost==2.0.3      # Gradient boosting
matplotlib          # Visualization
seaborn             # Statistical visualization
joblib              # Model serialization
pyyaml              # Configuration
flask-cors          # CORS for API
```

---

**Last Updated:** April 17, 2026  
**Status:** ✅ Production Ready