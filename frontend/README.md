# Battery Health Monitoring Dashboard

## Human-AI Interaction System for Research Publication (Track 5)

A modern React dashboard that demonstrates explainable AI for battery health monitoring, featuring SHAP-based explanations and actionable recommendations for human-AI collaboration.

## Features

### 🔋 Prediction Panel
- Real-time battery health prediction (RUL - Remaining Useful Life)
- Interactive parameter input form
- Health status indicators (Critical/High/Medium/Good)

### 📊 SHAP Feature Explanations
- AI decision-making transparency
- Feature contribution analysis
- Human-understandable explanations

### 📈 Feature Importance Visualization
- Interactive bar chart showing feature impact
- Color-coded positive/negative contributions
- Detailed tooltips with impact percentages

### 🚨 Actionable Alert System
- Priority-based recommendations (Critical → Preventive)
- Specific maintenance actions
- Impact assessment for each recommendation

## Research Contribution

This dashboard demonstrates:
- **Explainable AI (XAI)**: SHAP-based feature explanations
- **Human-AI Interaction**: Actionable insights for decision support
- **Research-Grade Methodology**: Battery-wise split, no data leakage
- **Publication-Ready**: Visual evidence of AI transparency

## Technology Stack

- **Frontend**: React 18, Material-UI, Recharts
- **Backend**: Flask API with SHAP integration
- **AI**: Random Forest + SHAP explanations
- **Data**: NASA battery degradation dataset

## Usage

1. Start the Flask API: `python backend/ml_api.py`
2. Install dependencies: `npm install`
3. Start dashboard: `npm start`
4. Access at `http://localhost:3000`

## API Integration

The dashboard connects to the Flask API at `http://localhost:5001` for:
- `/predict`: Battery health predictions with SHAP explanations
- `/health`: API health check

## Research Paper Integration

This dashboard provides visual evidence for:
- **Figure 1**: Prediction interface with health status
- **Figure 2**: SHAP feature contribution analysis
- **Figure 3**: Actionable recommendation system
- **Figure 4**: Feature importance visualization

## Human-AI Interaction Design

- **Transparency**: Clear explanation of AI decisions
- **Actionability**: Specific, implementable recommendations
- **Trust**: Evidence-based insights with impact assessment
- **Collaboration**: AI suggestions + human expertise