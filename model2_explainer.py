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

POSTCODE_TO_REGION = {
    # London postcodes
    'E': 'london', 'EC': 'london', 'N': 'london', 'NW': 'london',
    'SE': 'london', 'SW': 'london', 'W': 'london', 'WC': 'london',
    'BR': 'london', 'CR': 'london', 'DA': 'london', 'EN': 'london',
    'HA': 'london', 'IG': 'london', 'KT': 'london', 'RM': 'london',
    'SM': 'london', 'TW': 'london', 'UB': 'london', 'WD': 'london',
    # Manchester
    'M': 'manchester', 'OL': 'manchester', 'SK': 'manchester', 'BL': 'manchester',
    'WN': 'manchester',
    # Birmingham
    'B': 'birmingham', 'WS': 'birmingham', 'WV': 'birmingham', 'DY': 'birmingham',
    # Liverpool
    'L': 'liverpool', 'CH': 'liverpool',
    # Leeds
    'LS': 'leeds', 'BD': 'leeds', 'HX': 'leeds', 'HD': 'leeds', 'WF': 'leeds',
    # Sheffield
    'S': 'sheffield', 'DN': 'sheffield',
    # Bristol
    'BS': 'bristol',
    # Edinburgh
    'EH': 'edinburgh',
    # Glasgow
    'G': 'glasgow', 'PA': 'glasgow',
    # Cardiff
    'CF': 'cardiff',
    # Newcastle
    'NE': 'newcastle', 'SR': 'newcastle', 'DH': 'newcastle',
    # Nottingham
    'NG': 'nottingham',
    # Leicester
    'LE': 'leicester',
    # Southampton
    'SO': 'southampton',
    # Portsmouth
    'PO': 'portsmouth',
    # Brighton
    'BN': 'brighton',
    # Cambridge
    'CB': 'cambridge',
    # Oxford
    'OX': 'oxford',
    # Reading
    'RG': 'reading',
    # Coventry
    'CV': 'coventry',
    # Plymouth
    'PL': 'plymouth',
    # Aberdeen
    'AB': 'aberdeen',
    # Belfast
    'BT': 'belfast',
}

UK_REGIONS = ['london', 'manchester', 'birmingham', 'liverpool', 'leeds', 'sheffield',
              'bristol', 'edinburgh', 'glasgow', 'cardiff', 'newcastle', 'nottingham',
              'leicester', 'southampton', 'portsmouth', 'brighton', 'cambridge',
              'oxford', 'reading', 'coventry', 'plymouth', 'aberdeen', 'belfast']

# ====================== PLAIN-ENGLISH FEATURE LABELS ======================
FEATURE_LABELS = {
    'bedrooms': 'Number of bedrooms',
    'bathrooms': 'Number of bathrooms',
    'receptions': 'Number of reception rooms',
    'property_size': 'Property size (sq ft)',
    'time_remaining_on_lease': 'Lease remaining (years)',
    'service_charge': 'Annual service charge',
    'price_per_sqft': 'Price per square foot',
    'is_london': 'London location',
    'is_manchester': 'Manchester location',
    'is_birmingham': 'Birmingham location',
    'is_liverpool': 'Liverpool location',
    'is_leeds': 'Leeds location',
    'is_sheffield': 'Sheffield location',
    'is_bristol': 'Bristol location',
    'is_edinburgh': 'Edinburgh location',
    'is_glasgow': 'Glasgow location',
    'is_cardiff': 'Cardiff location',
    'is_newcastle': 'Newcastle location',
    'is_nottingham': 'Nottingham location',
    'is_leicester': 'Leicester location',
    'is_southampton': 'Southampton location',
    'is_portsmouth': 'Portsmouth location',
    'is_brighton': 'Brighton location',
    'is_cambridge': 'Cambridge location',
    'is_oxford': 'Oxford location',
    'is_reading': 'Reading location',
    'is_coventry': 'Coventry location',
    'is_plymouth': 'Plymouth location',
    'is_aberdeen': 'Aberdeen location',
    'is_belfast': 'Belfast location',
    'property_type_clean_new-homes': 'New-build property',
    'property_type_clean_for-sale': 'Resale property',
}

def get_feature_label(feature_name):
    """Get plain-English label for a feature."""
    if feature_name in FEATURE_LABELS:
        return FEATURE_LABELS[feature_name]
    # Handle dynamic feature names
    if feature_name.startswith('is_'):
        region = feature_name.replace('is_', '').title()
        return f"{region} location"
    if feature_name.startswith('property_type_clean_'):
        ptype = feature_name.replace('property_type_clean_', '').replace('-', ' ').title()
        return f"{ptype} listing type"
    return feature_name.replace('_', ' ').title()

def get_region_from_postcode(postcode_area):
    """Map postcode area letter(s) to region name."""
    if not postcode_area:
        return None
    prefix = postcode_area.upper().strip()
    if prefix in POSTCODE_TO_REGION:
        return POSTCODE_TO_REGION[prefix]
    if len(prefix) > 1 and prefix[0] in POSTCODE_TO_REGION:
        return POSTCODE_TO_REGION[prefix[0]]
    return None

def format_price_impact(value, predicted_price):
    """Format SHAP value as price impact string with percentage."""
    if abs(value) < 100:
        return "minimal impact"
    sign = "+" if value > 0 else ""
    pct = (value / predicted_price) * 100 if predicted_price > 0 else 0
    return f"{sign}£{value:,.0f} ({sign}{pct:.1f}%)"

def generate_feature_bullets(shap_breakdown, input_features, predicted_price, base_price):
    """Generate bullet point list of feature contributions with plain-English labels."""
    bullets = []
    
    # Sort by absolute impact
    sorted_features = sorted(shap_breakdown.items(), key=lambda x: abs(x[1]), reverse=True)
    
    for feature, shap_val in sorted_features:
        # Skip features with negligible impact (less than 0.5% of price)
        if abs(shap_val) < predicted_price * 0.005:
            continue
            
        label = get_feature_label(feature)
        impact = format_price_impact(shap_val, predicted_price)
        direction = "adds to" if shap_val > 0 else "reduces"
        
        # Get feature value for context
        if feature in input_features:
            val = input_features[feature]
            if feature == 'property_size':
                bullets.append(f"{label} ({val:,.0f} sq ft): {impact}")
            elif feature == 'service_charge':
                bullets.append(f"{label} (£{val:,.0f}/year): {impact}")
            elif feature == 'price_per_sqft':
                bullets.append(f"{label} (£{val:,.0f}): {impact}")
            elif feature in ['bedrooms', 'bathrooms', 'receptions']:
                bullets.append(f"{label} ({int(val)}): {impact}")
            elif feature == 'time_remaining_on_lease':
                bullets.append(f"{label} ({int(val)} years): {impact}")
            else:
                bullets.append(f"{label}: {impact}")
        elif feature.startswith('is_') and abs(shap_val) > 0:
            # Location features
            bullets.append(f"{label}: {impact}")
        elif feature.startswith('property_type_clean_') and abs(shap_val) > 0:
            bullets.append(f"{label}: {impact}")
    
    # Return top 7 features + always include market baseline
    top_bullets = bullets[:7]
    top_bullets.append(f"Market baseline: £{base_price:,.0f}")
    
    return top_bullets

def generate_valuation_summary(predicted_price, base_price, shap_breakdown, input_features):
    """Generate a natural, human-sounding valuation narrative."""
    
    # Find the active region
    active_region = None
    for region in UK_REGIONS:
        if input_features.get(f'is_{region}', 0) == 1:
            active_region = region.title()
            break
    
    # Get key metrics
    bedrooms = int(input_features.get('bedrooms', 0))
    bathrooms = int(input_features.get('bathrooms', 0))
    size = input_features.get('property_size', 0)
    
    # Determine top positive and negative factors
    sorted_impacts = sorted(shap_breakdown.items(), key=lambda x: x[1], reverse=True)
    top_positive = [(k, v) for k, v in sorted_impacts if v > 500][:3]
    top_negative = [(k, v) for k, v in sorted_impacts if v < -500][:3]
    
    # Build the narrative
    parts = []
    
    # Opening with prediction
    parts.append(f"Based on our analysis, this property is valued at £{predicted_price:,.0f}.")
    
    # Property description
    if active_region and size > 0:
        parts.append(f"This {bedrooms}-bedroom, {bathrooms}-bathroom property in {active_region} "
                    f"offers {size:,.0f} square feet of living space.")
    elif size > 0:
        parts.append(f"This {bedrooms}-bedroom property offers {size:,.0f} square feet of living space.")
    
    # Positive factors
    if top_positive:
        positive_labels = [get_feature_label(k) for k, v in top_positive]
        if len(positive_labels) == 1:
            parts.append(f"The valuation is primarily supported by {positive_labels[0].lower()}.")
        elif len(positive_labels) == 2:
            parts.append(f"Key value drivers include {positive_labels[0].lower()} and {positive_labels[1].lower()}.")
        else:
            parts.append(f"Key value drivers include {positive_labels[0].lower()}, {positive_labels[1].lower()}, "
                        f"and {positive_labels[2].lower()}.")
    
    # Negative factors
    if top_negative:
        negative_labels = [get_feature_label(k) for k, v in top_negative]
        if len(negative_labels) == 1:
            parts.append(f"The {negative_labels[0].lower()} has a moderating effect on the price.")
        else:
            parts.append(f"Factors such as {negative_labels[0].lower()} temper the overall valuation somewhat.")
    
    # Comparison to baseline
    diff = predicted_price - base_price
    if abs(diff) > 50000:
        if diff > 0:
            parts.append(f"Overall, this property commands a premium of £{diff:,.0f} above the market baseline.")
        else:
            parts.append(f"The valuation sits £{abs(diff):,.0f} below the typical market baseline for comparable properties.")
    
    return " ".join(parts)

def predict_and_explain(input_features: dict):
    try:
        input_df = pd.DataFrame([input_features])
        
        # Handle region mapping from postcode_area
        if 'postcode_area' in input_df.columns:
            postcode = input_df['postcode_area'].iloc[0]
            region = get_region_from_postcode(postcode)
            
            # Create region boolean columns
            for r in UK_REGIONS:
                col_name = f'is_{r}'
                input_df[col_name] = 1 if region == r else 0
                input_features[col_name] = 1 if region == r else 0
            
            input_df = input_df.drop(columns=['postcode_area'])
        
        # Handle property_type_clean one-hot encoding
        type_cols = [col for col in feature_cols if col.startswith('property_type_clean_')]
        for col in type_cols:
            prop_type = col.replace('property_type_clean_', '')
            input_df[col] = (input_df.get('property_type_clean', '') == prop_type).astype(int) if 'property_type_clean' in input_df.columns else 0
        
        if 'property_type_clean' in input_df.columns:
            input_df = input_df.drop(columns=['property_type_clean'])
        
        # Align columns - add missing as 0, keep only feature_cols
        for col in feature_cols:
            if col not in input_df.columns:
                input_df[col] = 0
        input_df = input_df[feature_cols]

        # Predict
        pred_log = model.predict(input_df)[0]
        predicted_price = float(np.expm1(pred_log))

        # SHAP values
        shap_values = explainer.shap_values(input_df.values)
        if len(shap_values.shape) == 2:
            shap_values = shap_values[0]

        base_value = float(explainer.expected_value)
        if isinstance(base_value, np.ndarray):
            base_value = float(base_value)
        
        base_price = float(np.expm1(base_value))

        # Convert SHAP values from log-space to additive price contributions
        # In log-space: base_value + sum(shap_values) = pred_log
        # We want additive contributions that sum to (predicted_price - base_price)
        # 
        # Method: Distribute the price difference proportionally based on SHAP magnitudes
        # This ensures: base_price + sum(price_impacts) = predicted_price
        
        total_shap = sum(shap_values)
        price_diff = predicted_price - base_price
        
        shap_breakdown = {}
        for col, sv in zip(feature_cols, shap_values):
            # Each feature's contribution is proportional to its share of total SHAP
            if abs(total_shap) > 1e-10:
                price_impact = (float(sv) / total_shap) * price_diff
            else:
                price_impact = 0.0
            shap_breakdown[col] = price_impact

        # Generate human-readable outputs
        feature_bullets = generate_feature_bullets(shap_breakdown, input_features, predicted_price, base_price)
        valuation_summary = generate_valuation_summary(predicted_price, base_price, shap_breakdown, input_features)

        # Simple explanation (legacy)
        explanation = f"The model predicts £{predicted_price:,.0f} for this property based on {len([v for v in shap_breakdown.values() if abs(v) > 100])} significant features."

        return {
            "predicted_price": round(predicted_price, 2),
            "base_price": round(base_price, 2),
            "explanation": explanation,
            "shap_breakdown": {k: float(v) for k, v in shap_breakdown.items()},
            "feature_bullets": feature_bullets,
            "valuation_summary": valuation_summary,
        }

    except Exception as e:
        print("Error in predict_and_explain:", str(e))
        raise

if __name__ == "__main__":
    sample = {
        'bedrooms': 2, 'bathrooms': 2, 'receptions': 1,
        'property_size': 972, 'time_remaining_on_lease': 992,
        'service_charge': 6686, 'price_per_sqft': 2263,
        'postcode_area': 'SW', 'property_type_clean': 'for-sale'
    }
    result = predict_and_explain(sample)
    print(f"Predicted Price: £{result['predicted_price']:,.0f}")
    print(f"\nValuation Summary:\n{result['valuation_summary']}")
    print(f"\nFeature Contributions:")
    for bullet in result['feature_bullets']:
        print(f"  • {bullet}")
