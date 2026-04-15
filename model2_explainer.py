# ============================================================
# MODEL 2 - SHAP EXPLAINABILITY (UPDATED)
# ============================================================

import pandas as pd
import numpy as np
import shap
import pickle
import warnings
warnings.filterwarnings('ignore')

# Load Model & Features
with open('model1_price_predictor.pkl', 'rb') as f:
    model = pickle.load(f)

with open('feature_cols.pkl', 'rb') as f:
    feature_cols = pickle.load(f)

print("Model and features loaded successfully")

explainer = shap.TreeExplainer(model)

# ====================== EXPLANATION FUNCTION ======================
def predict_and_explain(input_features: dict):
    try:
        input_df = pd.DataFrame([input_features])
        
        # Manually create dummy columns for postcode_area
        postcode_cols = [col for col in feature_cols if col.startswith('postcode_area_')]
        for col in postcode_cols:
            area = col.replace('postcode_area_', '')
            input_df[col] = (input_df['postcode_area'] == area).astype(int)
        
        if 'postcode_area' in input_df.columns:
            input_df = input_df.drop(columns=['postcode_area'])
        
        # Handle property_type_clean similarly
        type_cols = [col for col in feature_cols if col.startswith('property_type_clean_')]
        for col in type_cols:
            prop_type = col.replace('property_type_clean_', '')
            input_df[col] = (input_df['property_type_clean'] == prop_type).astype(int)
        
        if 'property_type_clean' in input_df.columns:
            input_df = input_df.drop(columns=['property_type_clean'])
        
        # Align columns
        for col in feature_cols:
            if col not in input_df.columns:
                input_df[col] = 0
        input_df = input_df[feature_cols]

        # Predict
        pred_log = model.predict(input_df)[0]
        predicted_price = float(np.expm1(pred_log))

        # SHAP
        shap_values = explainer.shap_values(input_df.values)
        if len(shap_values.shape) == 2:
            shap_values = shap_values[0]

        base_value = float(explainer.expected_value)
        if isinstance(base_value, np.ndarray):
            base_value = float(base_value)

        shap_breakdown = dict(zip(feature_cols, shap_values))

        explanation = f"The model predicts £{predicted_price:,.0f} for this property."

        return {
            "predicted_price": round(predicted_price, 2),
            "base_price": round(float(np.expm1(base_value)), 2),
            "explanation": explanation,
            "shap_breakdown": {k: float(v) for k, v in shap_breakdown.items()}
        }

    except Exception as e:
        print("Error in predict_and_explain:", str(e))
        raise

# ====================== QUICK TEST ======================
if __name__ == "__main__":
    sample = {
        'bedrooms': 2, 'bathrooms': 2, 'receptions': 1,
        'property_size': 972, 'time_remaining_on_lease': 992,
        'service_charge': 6686, 'price_per_sqft': 2263,
        'postcode_area': 'L', 'property_type_clean': 'flat'
    }
    result = predict_and_explain(sample)
    print(f"Predicted Price: £{result['predicted_price']:,.0f}")