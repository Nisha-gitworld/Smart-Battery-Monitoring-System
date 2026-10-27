#!/usr/bin/env python3
"""
Smart Battery System - Data Preprocessing Pipeline
Consolidated pipeline for processing NASA battery data and generating RUL for all rows
"""

import pandas as pd
import numpy as np
import yaml
import os
from pathlib import Path
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def load_config():
    """Load configuration from config.yaml"""
    config_path = Path(__file__).parent.parent / "config" / "config.yaml"
    with open(config_path, 'r') as f:
        return yaml.safe_load(f)

def generate_rul_for_all_rows(df):
    """
    Generate RUL (Remaining Useful Life) for ALL rows in the dataset

    Args:
        df: DataFrame with battery data

    Returns:
        DataFrame with RUL calculated for all rows
    """
    logger.info("Generating RUL for all rows...")

    # Calculate total lifetime for each battery (max Time)
    battery_lifetimes = df.groupby('battery')['Time'].max()
    logger.info(f"Found {len(battery_lifetimes)} batteries with lifetime data")

    # Calculate RUL for all rows: max_time - current_time
    df['rul_calculated'] = df.apply(lambda row: battery_lifetimes[row['battery']] - row['Time'], axis=1)

    # Normalize RUL to bounded range (0-1500)
    df['rul'] = df['rul_calculated'].clip(upper=1500)

    logger.info(f"RUL generated: range 0-{df['rul'].max():.1f}")
    return df

def intelligent_downsampling(df, target_size=200000):
    """
    Intelligently downsample the dataset to manageable size

    Args:
        df: DataFrame to downsample
        target_size: Target number of samples

    Returns:
        Downsampled DataFrame
    """
    logger.info(f"Downsampling from {len(df)} to {target_size} samples...")

    if len(df) <= target_size:
        logger.info("Dataset already smaller than target size")
        return df

    # Random sampling with fixed seed for reproducibility
    df_sampled = df.sample(n=target_size, random_state=42)
    logger.info(f"Downsampled to {len(df_sampled)} samples")

    return df_sampled

def balance_dataset_by_rul_quantiles(df, n_bins=5, max_per_bin=40000):
    """
    Balance dataset by RUL quantiles to ensure good distribution across lifecycle

    Args:
        df: DataFrame to balance
        n_bins: Number of quantile bins
        max_per_bin: Maximum samples per bin

    Returns:
        Balanced DataFrame
    """
    logger.info("Balancing dataset by RUL quantiles...")

    # Create quantile bins
    bins = pd.qcut(df['rul'], q=n_bins, duplicates='drop')

    # Sample equally from each bin
    df_balanced = df.groupby(bins, observed=False).apply(
        lambda x: x.sample(min(len(x), max_per_bin), random_state=42)
    ).reset_index(drop=True)

    logger.info(f"Balanced to {len(df_balanced)} samples across {n_bins} RUL quantiles")
    return df_balanced

def preprocess_features(df, config):
    """
    Preprocess features: handle missing values, convert data types

    Args:
        df: DataFrame with raw data
        config: Configuration dictionary

    Returns:
        Preprocessed DataFrame
    """
    logger.info("Preprocessing features...")

    # Select only numeric features (remove problematic string columns)
    feature_cols = config['features']['selected_features']

    # Convert string columns to numeric (pandas compatibility)
    for col in feature_cols:
        if col in df.columns:
            df[col] = pd.to_numeric(df[col], errors='coerce')

    # Fill NaN values with column means
    df[feature_cols] = df[feature_cols].fillna(df[feature_cols].mean())

    logger.info(f"Features preprocessed: {len(feature_cols)} numeric features")
    return df

def create_final_dataset():
    """
    Main pipeline: create the final dataset with RUL for all rows
    """
    config = load_config()

    # Load raw data
    data_path = config['data']['nasa_battery_file']
    if not os.path.exists(data_path):
        raise FileNotFoundError(f"Data file not found: {data_path}")

    logger.info(f"Loading data from {data_path}")
    df = pd.read_csv(data_path)
    logger.info(f"Loaded {len(df)} raw samples")

    # Step 1: Generate RUL for ALL rows
    df = generate_rul_for_all_rows(df)

    # Step 2: Intelligent downsampling
    df = intelligent_downsampling(df, config['model']['training']['downsample_size'])

    # Step 3: Balance by RUL quantiles
    df = balance_dataset_by_rul_quantiles(
        df,
        config['model']['training']['balance_bins'],
        config['model']['training']['balance_max_per_bin']
    )

    # Step 4: Preprocess features
    df = preprocess_features(df, config)

    # Save final dataset
    output_path = config['data']['final_dataset']
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    df.to_csv(output_path, index=False)

    logger.info(f"Final dataset saved to {output_path}")
    logger.info(f"Shape: {df.shape}")
    logger.info(f"RUL range: {df['rul'].min():.1f} - {df['rul'].max():.1f}")
    logger.info(f"Unique batteries: {df['battery'].nunique()}")

    return df

if __name__ == "__main__":
    logger.info("Starting Smart Battery System - Data Preprocessing Pipeline")
    df_final = create_final_dataset()
    logger.info("Data preprocessing completed successfully!")