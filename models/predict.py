#!/usr/bin/env python3
"""
Smart Battery System - Prediction Module
Standalone prediction functionality for battery health assessment
"""

import joblib
import pandas as pd
import numpy as np
import yaml
from pathlib import Path
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class BatteryPredictor:
    """Battery health prediction class"""

    def __init__(self, config_path=None):
        """
        Initialize predictor with configuration

        Args:
            config_path: Path to config.yaml (optional, uses default if not provided)
        """
        if config_path is None:
            config_path = Path(__file__).parent.parent / "config" / "config.yaml"

        with open(config_path, 'r') as f:
            self.config = yaml.safe_load(f)

        self.model = None
        self.explainer = None
        self.metadata = None
        self._load_model()

    def _load_model(self):
        """Load model artifacts"""
        try:
            self.model = joblib.load(self.config['model']['model_file'])
            self.metadata = joblib.load(self.config['model']['metadata_file'])
            logger.info("Model artifacts loaded successfully")
        except FileNotFoundError as e:
            raise FileNotFoundError(f"Model artifacts not found: {e}. Please run training first.")

    def predict_single(self, features):
        """
        Predict RUL for a single battery measurement

        Args:
            features: Dictionary of feature values

        Returns:
            Dictionary with prediction and explanation
        """
        # Validate input features
        required_features = set(self.config['features']['selected_features'])
        provided_features = set(features.keys())

        if not required_features.issubset(provided_features):
            missing = required_features - provided_features
            raise ValueError(f"Missing required features: {missing}")

        # Prepare input data
        input_data = [features[feat] for feat in self.config['features']['selected_features']]
        input_array = np.array(input_data).reshape(1, -1)

        # Make prediction
        prediction = self.model.predict(input_array)[0]

        return {
            'prediction': float(prediction),
            'health_status': self._classify_health(prediction),
            'input_features': features
        }

    def predict_batch(self, features_list):
        """
        Predict RUL for multiple battery measurements

        Args:
            features_list: List of feature dictionaries

        Returns:
            List of prediction dictionaries
        """
        return [self.predict_single(features) for features in features_list]

    def _classify_health(self, rul_prediction):
        """
        Classify battery health based on RUL prediction

        Args:
            rul_prediction: Predicted RUL in time units

        Returns:
            Health status string
        """
        if rul_prediction > 1000:
            return "EXCELLENT"
        elif rul_prediction > 500:
            return "GOOD"
        elif rul_prediction > 200:
            return "FAIR"
        elif rul_prediction > 50:
            return "POOR"
        else:
            return "CRITICAL"

    def get_model_info(self):
        """Get model information and metrics"""
        return {
            'model_type': self.metadata['model_type'],
            'features': self.metadata['features'],
            'metrics': self.metadata['metrics'],
            'training_date': self.metadata['training_date']
        }

def main():
    """Example usage"""
    logger.info("=" * 70)
    logger.info("Smart Battery System - Prediction Demo")
    logger.info("=" * 70)

    # Initialize predictor
    predictor = BatteryPredictor()

    # Display model info
    model_info = predictor.get_model_info()
    logger.info("\n✅ Model Information:")
    logger.info(f"   Type: {model_info['model_type']}")
    logger.info(f"   Features: {model_info['features']}")
    logger.info(f"   Metrics: {model_info['metrics']}")
    logger.info(f"   Training Date: {model_info['training_date']}")

    # Example battery measurements (3 samples)
    logger.info("\n📊 Running Prediction Demo (3 samples):")

    samples = [
        {
            'name': 'Healthy Battery',
            'features': {
                'Voltage_measured': 4.1,
                'Current_measured': -0.5,
                'Temperature_measured': 22.0,
                'Current_load': 0.8,
                'Voltage_load': 4.05
            }
        },
        {
            'name': 'Degraded Battery',
            'features': {
                'Voltage_measured': 3.2,
                'Current_measured': -1.2,
                'Temperature_measured': 35.0,
                'Current_load': 1.5,
                'Voltage_load': 3.1
            }
        },
        {
            'name': 'Critical Battery',
            'features': {
                'Voltage_measured': 2.8,
                'Current_measured': -1.8,
                'Temperature_measured': 45.0,
                'Current_load': 2.0,
                'Voltage_load': 2.5
            }
        }
    ]

    for i, sample in enumerate(samples, 1):
        logger.info(f"\nSample {i}: {sample['name']}")
        result = predictor.predict_single(sample['features'])
        logger.info(f"   Predicted RUL: {result['prediction']:.1f} cycles")
        logger.info(f"   Health Status: {result['health_status']}")

    logger.info("\n✅ Prediction demo completed!")

if __name__ == "__main__":
    main()