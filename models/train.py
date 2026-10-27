#!/usr/bin/env python3
"""
Smart Battery System - Model Training
Trains XGBoost model for battery RUL prediction with battery-wise validation
"""

import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_squared_error, mean_absolute_error, r2_score
import joblib
import yaml
from pathlib import Path
import os
import xgboost as xgb
import logging

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(message)s')
logger = logging.getLogger(__name__)

# Load configuration
CONFIG_PATH = Path(__file__).parent.parent / "config" / "config.yaml"
with open(CONFIG_PATH, 'r') as f:
    CONFIG = yaml.safe_load(f)

def load_and_preprocess_data():
    """
    Load and preprocess the final dataset with battery-wise train/test split

    Returns:
        tuple: X_train, X_test, y_train, y_test, feature_names
    """
    data_path = CONFIG['data']['final_dataset']

    if not os.path.exists(data_path):
        logger.error(f"Final dataset not found: {data_path}")
        logger.error("Please run data/preprocessing.py first to create the final dataset")
        return None

    logger.info(f"Loading final dataset from {data_path}")
    df = pd.read_csv(data_path)

    logger.info(f"Dataset: {len(df)} samples, {df['battery'].nunique()} batteries")

    # 🔧 Battery-wise split (prevents data leakage)
    logger.info("\n🔧 Performing battery-wise train/test split...")
    unique_batteries = df['battery'].unique()
    train_batteries, test_batteries = train_test_split(
        unique_batteries,
        test_size=CONFIG['model']['training']['test_size'],
        random_state=CONFIG['model']['training']['random_state']
    )

    train_mask = df['battery'].isin(train_batteries)
    test_mask = df['battery'].isin(test_batteries)

    df_train = df[train_mask]
    df_test = df[test_mask]

    logger.info(f"✅ Battery-wise split: {len(train_batteries)} train batteries, {len(test_batteries)} test batteries")
    logger.info(f"   Training samples: {len(df_train)}, Test samples: {len(df_test)}")

    # Feature selection
    feature_cols = CONFIG['features']['selected_features']
    target_col = CONFIG['features']['target']

    # Extract features and target
    X_train = df_train[feature_cols]
    X_test = df_test[feature_cols]
    y_train = df_train[target_col]
    y_test = df_test[target_col]

    # Fill any remaining NaNs (shouldn't be necessary with preprocessing)
    X_train = X_train.fillna(X_train.mean())
    X_test = X_test.fillna(X_test.mean())

    logger.info(f"Training RUL range: {y_train.min():.1f} - {y_train.max():.1f}")
    logger.info(f"Test RUL range: {y_test.min():.1f} - {y_test.max():.1f}")

    # Check for constant features
    logger.info("Feature variances:")
    for col in X_train.columns:
        var = X_train[col].var()
        logger.info(f"  {col}: {var:.6f}")

    return X_train.values, X_test.values, y_train.values, y_test.values, feature_cols

def train_battery_model(X_train, y_train, feature_names):
    """
    Train XGBoost model for battery RUL prediction

    Args:
        X_train: Training features
        y_train: Training target
        feature_names: List of feature names

    Returns:
        Trained XGBoost model
    """
    logger.info("\nTraining XGBoost model...")

    xgb_params = CONFIG['model']['xgboost']
    model = xgb.XGBRegressor(
        n_estimators=xgb_params['n_estimators'],
        max_depth=xgb_params['max_depth'],
        learning_rate=xgb_params['learning_rate'],
        subsample=xgb_params['subsample'],
        colsample_bytree=xgb_params['colsample_bytree'],
        random_state=xgb_params['random_state']
    )

    model.fit(X_train, y_train)

    logger.info("✅ XGBoost model trained successfully")
    return model

def evaluate_model(model, X_test, y_test, feature_names):
    """
    Evaluate model on test set

    Args:
        model: Trained model
        X_test: Test features
        y_test: Test target
        feature_names: List of feature names

    Returns:
        tuple: metrics dictionary, predictions
    """
    logger.info("\nEvaluating model...")

    y_pred = model.predict(X_test)

    rmse = np.sqrt(mean_squared_error(y_test, y_pred))
    mae = mean_absolute_error(y_test, y_pred)
    r2 = r2_score(y_test, y_pred)

    metrics = {
        'rmse': rmse,
        'mae': mae,
        'r2': r2
    }

    logger.info(f"\nModel Evaluation:")
    logger.info(f"RMSE: {rmse:.4f}")
    logger.info(f"MAE: {mae:.4f}")
    logger.info(f"R²: {r2:.4f}")

    # Feature importance
    feature_importance = dict(zip(feature_names, model.feature_importances_))
    sorted_importance = sorted(feature_importance.items(), key=lambda x: x[1], reverse=True)

    logger.info("\nTop 5 Feature Importance:")
    for feature, importance in sorted_importance[:5]:
        logger.info(f"  {feature}: {importance:.4f}")

    return metrics, y_pred

def save_model_artifacts(model, metrics, feature_names):
    """Save model and metadata"""
    os.makedirs(CONFIG['model']['model_dir'], exist_ok=True)

    # Save model
    joblib.dump(model, CONFIG['model']['model_file'])

    # Save metadata
    metadata = {
        'model_type': 'XGBRegressor',
        'features': list(feature_names),
        'metrics': metrics,
        'training_date': pd.Timestamp.now().isoformat()
    }
    joblib.dump(metadata, CONFIG['model']['metadata_file'])

    logger.info(f"\n✅ Model saved to {CONFIG['model']['model_file']}")
    logger.info(f"✅ Metadata saved to {CONFIG['model']['metadata_file']}")

def main():
    """Main training pipeline"""
    logger.info("=" * 70)
    logger.info("Smart Battery System - Model Training Pipeline")
    logger.info("=" * 70)

    # Load data
    data = load_and_preprocess_data()
    if data is None:
        return

    X_train, X_test, y_train, y_test, feature_names = data

    logger.info(f"\n✅ METHODOLOGY:")
    logger.info(f"   • RUL generated for ALL rows from 7.3M dataset")
    logger.info(f"   • Intelligent downsampling: 7M → 200K samples")
    logger.info(f"   • Balanced by RUL quantiles: ensures full lifecycle coverage")
    logger.info(f"   • Battery-wise split: tests generalization to new batteries")
    logger.info(f"   • XGBoost model: 500 estimators, depth=6, lr=0.1\n")

    # Train model
    model = train_battery_model(X_train, y_train, feature_names)

    # Evaluate
    metrics, y_pred = evaluate_model(model, X_test, y_test, feature_names)

    # Save artifacts
    save_model_artifacts(model, metrics, feature_names)

    logger.info("\n✅ Training completed successfully!")
    logger.info("\nNext steps:")
    logger.info("1. Run models/predict.py to make predictions")
    logger.info("2. Run backend/api.py to start the API server")
    logger.info("3. Access React dashboard at http://localhost:3000")

if __name__ == "__main__":
    main()