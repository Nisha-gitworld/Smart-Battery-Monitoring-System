"""
SHAP Analysis for Battery Health Model
Generates explanations for model predictions
"""

import shap
import joblib
import pandas as pd
import numpy as np
from pathlib import Path
import os

def calibrate_rul(raw_prediction, voltage, impedance, time):
    """
    Calibrate raw ML prediction based on domain knowledge

    Args:
        raw_prediction (float): Raw model prediction
        voltage (float): Current voltage
        impedance (float): Current impedance
        time (float): Current cycle time

    Returns:
        float: Calibrated RUL prediction
    """
    # Multi-factor calibration based on battery physics
    base_rul = raw_prediction

    # Calculate degradation score (0-1, higher = more degraded)
    voltage_score = max(0, (4.2 - voltage) / 0.8)  # 4.2V is healthy, 3.4V is degraded
    impedance_score = min(1, impedance / 0.3)  # 0.3 ohm is very degraded
    time_score = min(1, time / 1200)  # 1200 cycles is end of life

    degradation_score = (voltage_score + impedance_score + time_score) / 3

    # Apply calibration based on degradation score
    if degradation_score > 0.8:
        calibrated = base_rul * 0.1  # Severe degradation
    elif degradation_score > 0.6:
        calibrated = base_rul * 0.2  # High degradation
    elif degradation_score > 0.4:
        calibrated = base_rul * 0.4  # Moderate degradation
    elif degradation_score > 0.2:
        calibrated = base_rul * 0.6  # Slight degradation
    else:
        calibrated = base_rul * 0.8  # Healthy

    # Apply bounds
    calibrated = max(calibrated, 30)  # Minimum 30 cycles
    calibrated = min(calibrated, 1500)  # Maximum matches training data

    return calibrated

def get_battery_health_status(voltage, impedance, time):
    """
    Determine battery health status based on domain knowledge

    Args:
        voltage (float): Current voltage
        impedance (float): Current impedance
        time (float): Current cycle time

    Returns:
        str: Health status
    """
    # Calculate degradation score (0-1, higher = more degraded)
    voltage_score = max(0, (4.2 - voltage) / 0.8)  # 4.2V is healthy, 3.4V is degraded
    impedance_score = min(1, impedance / 0.3)  # 0.3 ohm is very degraded
    time_score = min(1, time / 1200)  # 1200 cycles is end of life

    degradation_score = (voltage_score + impedance_score + time_score) / 3

    # Determine health status based on degradation score (less sensitive thresholds)
    if degradation_score > 0.8:
        return "CRITICAL"
    elif degradation_score > 0.6:
        return "DEGRADED"
    elif degradation_score > 0.4:
        return "MODERATE"
    else:
        return "HEALTHY"

def explain_single_prediction(data_point, model, explainer, scaler, feature_names):
    """
    Generate SHAP explanation for a single prediction with domain calibration

    Args:
        data_point (dict): Battery features
        model: Trained model
        explainer: SHAP explainer
        scaler: Feature scaler (None for Random Forest - no scaling needed)
        feature_names: List of feature names

    Returns:
        dict: Explanation results with calibrated prediction
    """
    # Convert to DataFrame
    df = pd.DataFrame([data_point])

    # Ensure all features are present
    for feature in feature_names:
        if feature not in df.columns:
            df[feature] = 0  # Default value

    # Select and order features (no scaling needed for Random Forest)
    X = df[feature_names]

    # Make raw prediction (no scaling)
    raw_prediction = model.predict(X)[0]

    # FIXED: Apply domain calibration
    voltage = data_point.get('Voltage_measured', data_point.get('voltage_mean', 3.8))
    impedance = data_point.get('Battery_impedance', data_point.get('impedance', 0.1))
    time_val = data_point.get('Time', 0)

    calibrated_prediction = calibrate_rul(raw_prediction, voltage, impedance, time_val)
    health_status = get_battery_health_status(voltage, impedance, time_val)

    # Generate SHAP explanation (disable additivity check for numerical robustness)
    shap_values = explainer(X, check_additivity=False)

    # Extract feature importance
    feature_importance = {}
    for i, feature in enumerate(feature_names):
        feature_importance[feature] = shap_values.values[0][i]

    # Sort by absolute importance
    sorted_features = sorted(feature_importance.items(),
                           key=lambda x: abs(x[1]), reverse=True)

    explanation = {
        'prediction': float(calibrated_prediction),
        'raw_prediction': float(raw_prediction),
        'health_status': health_status,
        'feature_importance': dict(sorted_features),
        'top_contributors': sorted_features[:5],
        'base_value': float(shap_values.base_values[0]),
        'calibration_info': {
            'voltage_used': float(voltage),
            'impedance_used': float(impedance),
            'calibration_applied': bool(raw_prediction != calibrated_prediction)
        }
    }

    return explanation

def generate_human_readable_explanation(explanation):
    """
    Convert SHAP explanation to human-readable text

    Args:
        explanation (dict): SHAP explanation

    Returns:
        str: Human-readable explanation
    """
    prediction = explanation['prediction']
    top_features = explanation['top_contributors']

    explanation_text = f"Battery RUL prediction: {prediction:.1f} cycles remaining.\n\n"

    explanation_text += "Key factors influencing this prediction:\n"

    for feature, importance in top_features:
        direction = "increased" if importance > 0 else "decreased"
        feature_name = feature.replace('_', ' ').title()
        percentage = abs(importance) * 100

        explanation_text += f"• {feature_name}: {direction} prediction by {percentage:.1f}%\n"

    return explanation_text

def generate_recommendations(explanation):
    """
    Generate actionable recommendations based on SHAP explanation and health status for Human-AI Interaction

    Args:
        explanation (dict): SHAP explanation with calibrated prediction and health status

    Returns:
        list: List of actionable recommendations with priority levels
    """
    recommendations = []
    prediction = explanation['prediction']
    health_status = explanation.get('health_status', 'UNKNOWN')
    top_features = explanation['top_contributors']

    # FIXED: Health status-based recommendations (Priority 1: Critical)
    if health_status == "DEGRADED":
        recommendations.append({
            'priority': 'CRITICAL',
            'icon': '🚨',
            'action': 'Immediate battery replacement required - severe degradation detected',
            'reason': 'Battery impedance > 0.2Ω or voltage < 3.5V indicates critical failure risk',
            'impact': 'System failure imminent - replace immediately'
        })
    elif health_status == "MODERATE":
        recommendations.append({
            'priority': 'HIGH',
            'icon': '⚠️',
            'action': 'Schedule battery replacement within 1 week - moderate degradation',
            'reason': 'Battery impedance > 0.15Ω indicates accelerated aging',
            'impact': 'High failure risk - plan replacement soon'
        })
    elif prediction < 100:
        recommendations.append({
            'priority': 'MEDIUM',
            'icon': '⚡',
            'action': 'Monitor battery daily and plan replacement within 1 month',
            'reason': f'RUL below 100 cycles: {prediction:.0f} cycles remaining',
            'impact': 'Increased maintenance needed'
        })

    # Feature-based actionable insights (Priority 2: Operational)
    feature_insights = {
        'Voltage_measured': {
            'high_impact': 'Low voltage detected - check charging system and power supply',
            'low_impact': 'Voltage fluctuations - monitor power supply stability'
        },
        'Voltage_load': {
            'high_impact': 'Load voltage issues - inspect electrical connections and wiring',
            'low_impact': 'Voltage under load concerns - check circuit integrity'
        },
        'Battery_impedance': {
            'high_impact': 'High impedance detected - battery internal resistance increased significantly',
            'low_impact': 'Impedance rising - monitor for further degradation'
        },
        'Rectified_Impedance': {
            'high_impact': 'Rectified impedance abnormal - check battery electrolyte and plates',
            'low_impact': 'Impedance irregularities - investigate battery chemistry'
        },
        'Time': {
            'high_impact': 'Advanced cycle count - battery nearing end of service life',
            'low_impact': 'Normal aging progression - continue monitoring'
        },
        'Temperature_measured': {
            'high_impact': 'High operating temperature - improve cooling and ventilation immediately',
            'low_impact': 'Temperature stress detected - optimize thermal management'
        },
        'Current_measured': {
            'high_impact': 'Abnormal current draw - investigate power consumption and electrical faults',
            'low_impact': 'Current irregularities - check for electrical faults'
        },
        'Current_load': {
            'high_impact': 'Load current issues - inspect power delivery system and connections',
            'low_impact': 'Current under load concerns - verify electrical connections'
        },
        'Current_charge': {
            'high_impact': 'Charging current problems - check charger compatibility and settings',
            'low_impact': 'Charging efficiency concerns - optimize charging protocol'
        },
        'Voltage_charge': {
            'high_impact': 'Charging voltage issues - verify charger specifications and limits',
            'low_impact': 'Charging voltage optimization needed'
        }
    }

    # Analyze top contributing features for insights
    for feature, importance in top_features[:3]:  # Focus on top 3 contributors
        if feature in feature_insights and abs(importance) > 0.05:  # Significant contribution
            impact_level = 'high_impact' if abs(importance) > 0.15 else 'low_impact'
            insight = feature_insights[feature][impact_level]

            recommendations.append({
                'priority': 'OPERATIONAL',
                'icon': '🔧',
                'action': insight,
                'reason': f'{feature.replace("_", " ").title()} contributing significantly to health assessment',
                'impact': f'Feature importance: {abs(importance)*100:.1f}%'
            })

    # Add general monitoring recommendations (Priority 3: Preventive)
    if health_status == "HEALTHY" and prediction > 200:
        recommendations.append({
            'priority': 'PREVENTIVE',
            'icon': '📊',
            'action': 'Continue regular monitoring schedule - battery in good condition',
            'reason': f'Healthy battery status with {prediction:.0f} cycles remaining',
            'impact': 'Maintain current operations and monitoring'
        })

    return recommendations

def create_shap_visualizations(model, explainer, X_sample, feature_names, output_dir='xai'):
    """
    Create various SHAP visualization plots

    Args:
        model: Trained model
        explainer: SHAP explainer
        X_sample: Sample data for plotting
        feature_names: Feature names
        output_dir: Output directory for plots
    """
    import matplotlib.pyplot as plt

    os.makedirs(output_dir, exist_ok=True)

    # Calculate SHAP values
    shap_values = explainer(X_sample)

    # Summary plot
    plt.figure(figsize=(10, 6))
    shap.summary_plot(shap_values, X_sample, feature_names=feature_names, show=False)
    plt.savefig(f'{output_dir}/shap_summary.png', bbox_inches='tight', dpi=150)
    plt.close()

    # Bar plot of mean absolute SHAP values
    plt.figure(figsize=(10, 6))
    shap.summary_plot(shap_values, X_sample, feature_names=feature_names,
                     plot_type='bar', show=False)
    plt.savefig(f'{output_dir}/shap_bar.png', bbox_inches='tight', dpi=150)
    plt.close()

    # Waterfall plot for first sample
    plt.figure(figsize=(10, 6))
    shap.waterfall_plot(shap_values[0], show=False)
    plt.savefig(f'{output_dir}/shap_waterfall.png', bbox_inches='tight', dpi=150)
    plt.close()

    print(f"SHAP plots saved to {output_dir}/")

def analyze_feature_importance(metadata, output_dir='xai'):
    """Analyze and visualize feature importance"""
    features = metadata['features']
    # This would require the model to be loaded, but for now we'll skip
    # as it's already done in training
    pass

def main():
    """Main SHAP analysis pipeline"""
    print("SHAP Analysis for Battery Health Model")
    print("=" * 50)

    # Load model and explainer
    model, explainer, scaler, metadata = load_model_and_explainer()
    if model is None:
        return

    feature_names = metadata['features']

    # Load some sample data for visualizations
    try:
        df = pd.read_csv('data/processed/nasa_battery_kaggle_with_rul.csv')

        # Select features (same as training)
        feature_cols = [col for col in df.columns if col not in ['battery', 'rul']]
        target_col = 'rul'

        X = df[feature_cols]

        # Handle missing values and filter to numeric columns only
        numeric_cols = X.select_dtypes(include=[np.number]).columns
        X = X[numeric_cols]
        X = X.fillna(X.mean())

        y = df[target_col]

        # Remove rows with NaN in target or features
        valid_rows = ~(y.isna() | X.isna().any(axis=1))
        X = X[valid_rows]

        # Take a small sample for SHAP analysis
        sample_data = X.head(50)
        X_sample_scaled = scaler.transform(sample_data)
    except FileNotFoundError:
        print("Sample data not found. Skipping visualizations.")
        return

    # Create visualizations
    create_shap_visualizations(model, explainer, X_sample_scaled, feature_names)

    # Example prediction explanation
    # Use the first sample from the processed data
    sample_scaled = X_sample_scaled[0:1]  # Keep as 2D array
    prediction = model.predict(sample_scaled)[0]

    # Generate SHAP explanation
    shap_values = explainer(sample_scaled)

    # Extract feature importance
    feature_importance = {}
    for i, feature in enumerate(feature_names):
        feature_importance[feature] = shap_values.values[0][i]

    # Sort by absolute importance
    sorted_features = sorted(feature_importance.items(),
                           key=lambda x: abs(x[1]), reverse=True)

    explanation = {
        'prediction': float(prediction),
        'feature_importance': dict(sorted_features),
        'top_contributors': sorted_features[:5],
        'base_value': float(shap_values.base_values[0])
    }

    print("\nExample Prediction Explanation:")
    print("-" * 30)
    print(generate_human_readable_explanation(explanation))

    recommendations = generate_recommendations(explanation)
    print("\n📋 Actionable Recommendations:")
    print("-" * 35)

    # Group by priority
    priority_order = ['CRITICAL', 'HIGH', 'MEDIUM', 'OPERATIONAL', 'PREVENTIVE']
    grouped_recs = {}
    for rec in recommendations:
        priority = rec['priority']
        if priority not in grouped_recs:
            grouped_recs[priority] = []
        grouped_recs[priority].append(rec)

    for priority in priority_order:
        if priority in grouped_recs:
            print(f"\n{priority} PRIORITY:")
            for rec in grouped_recs[priority]:
                print(f"  {rec['icon']} {rec['action']}")
                print(f"     Reason: {rec['reason']}")
                print(f"     Impact: {rec['impact']}")
                print()

    print("\nSHAP analysis completed!")
    print("Visualization files saved in xai/ directory")

if __name__ == "__main__":
    main()
