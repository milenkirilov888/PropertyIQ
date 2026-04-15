import pandas as pd
import numpy as np
import shap
import pickle
import warnings
warnings.filterwarnings('ignore')

# Load the saved model and columns used for training the model from the jupyter notebook
with open('model1_price_predictor.pkl', 'rb') as f:
    model = pickle.load(f)
with open('feature_cols.pkl', 'rb') as f:
    feature_cols = pickle.load(f)

# Creates the SHAP model to explain the text. And to the SHAP model with add our XGBoost model
explainer = shap.TreeExplainer(model)

def predict_and_explain(properties: dict):

    try:

        # Converts the properties into a DataFrame
        df = pd.DataFrame([properties])

        # Parse the postcode
        postcode_cols = [col for col in feature_cols if col.startswith('postcode_area_')]
        for col in postcode_cols:
            area = col.replace('postcode_area_', '')
            df[col] = (df['postcode_area'] == area).astype(int)
        
        if 'postcode_area' in df.columns:
            df = df.drop(columns=['postcode_area'])
        
        # Clean the property type just like we did in the first model
        type_cols = [col for col in feature_cols if col.startswith('property_type_clean_')]
        for col in type_cols:
            prop_type = col.replace('property_type_clean_', '')
            df[col] = (df['property_type_clean'] == prop_type).astype(int)
        
        if 'property_type_clean' in df.columns:
            df = df.drop(columns=['property_type_clean'])
        
        # Align columns
        for col in feature_cols:
            if col not in df.columns:
                df[col] = 0
        df = df[feature_cols]

        # Predict the property value from the attributes
        pred_log = model.predict(df)[0]
        predicted_price = float(np.expm1(pred_log))

        # Run the SHAP model to generate the explaining text
        shap_values = explainer.shap_values(df.values)
        if len(shap_values.shape) == 2:
            shap_values = shap_values[0]

        base_value = float(explainer.expected_value)
        if isinstance(base_value, np.ndarray):
            base_value = float(base_value)

        shap_breakdown = dict(zip(feature_cols, shap_values))

        explanation = f"The model predicts £{predicted_price:,.0f} for this property."

        # The function returns the explanation of the property value predicted by XGBoost
        return {
            "predicted_price": round(predicted_price, 2),
            "base_price": round(float(np.expm1(base_value)), 2),
            "explanation": explanation,
            "shap_breakdown": {k: float(v) for k, v in shap_breakdown.items()}
        }

    except Exception as e:
        print("Error in predict_and_explain:", str(e))
        raise
