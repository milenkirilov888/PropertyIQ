from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, HTMLResponse
from pydantic import BaseModel
from fastapi import Response
from typing import Optional
import os
import re
import numpy as np
import pandas as pd
import shap
import warnings

warnings.filterwarnings('ignore')

port = int(os.getenv("PORT", 8000))

# Import ML components
from model2_explainer import predict_and_explain, feature_cols, model

app = FastAPI(
    title="UK Property Audit + ML Prediction API",
    description="Serves property data from CSV + ML Price Prediction with SHAP explanations",
    version="2.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

base_path = os.path.dirname(os.path.abspath(__file__))
csv_path  = os.path.join(base_path, 'table.csv')

class PropertyInput(BaseModel):
    bedrooms:                Optional[float] = 2
    bathrooms:               Optional[float] = 1
    receptions:              Optional[float] = 1
    property_size:           Optional[float] = 800
    time_remaining_on_lease: Optional[float] = 150
    price_per_sqft:          Optional[float] = 1000
    service_charge:          Optional[float] = 3000
    postcode_area:           Optional[str]   = ""
    property_type_clean:     Optional[str]   = ""
    # kept for backwards compat / other endpoints
    deposit:                 Optional[float] = 500
    ecp_rating:              Optional[str]   = "C"
    council_tax_band:        Optional[str]   = "D"
    property_type:           Optional[str]   = "for-sale"
    tenure:                  Optional[str]   = "Leasehold"
    area:                    Optional[str]   = "London"
    is_london:               Optional[int]   = 1
    avg_estimated_value:     Optional[float] = 500000

def clean_value(val):
    if pd.isna(val) or str(val).lower() == "nan" or str(val).strip() == "":
        return "N/A"
    s = str(val).strip()
    s = s.replace('Â£', '£').replace('Â', '')
    s = re.sub(r'^["\'\[]+|["\'\]]+$', '', s)
    return s

def extract_number(val):
    if pd.isna(val) or str(val).strip() == "" or str(val).lower() == "n/a":
        return 0
    clean_str = re.sub(r'[^\d.]', '', str(val).replace(',', ''))
    try:
        return float(clean_str) if clean_str else 0
    except ValueError:
        return 0


def format_uprn_to_string(val):
    try:
        if pd.isna(val) or str(val).lower() == 'nan' or str(val).strip() == '':
            return "N/A"
        return str(int(float(val)))
    except (ValueError, TypeError):
        return str(val).strip()


def extract_images(raw_data):
    if pd.isna(raw_data) or str(raw_data).strip() == "":
        return []
    return re.findall(
        r'http[s]?://(?:[a-zA-Z]|[0-9]|[$-_@.&+]|[!*\(\),]|(?:%[0-9a-f_A-F][0-9a-f_A-F]))+',
        str(raw_data)
    )

@app.get("/health")
def health():
    return {"status": "ok"}


@app.get("/api/properties")
def get_properties():
    try:
        if not os.path.exists(csv_path):
            raise HTTPException(status_code=404, detail="table.csv not found")

        df = pd.read_csv(csv_path)
        properties = []

        for index, row in df.iterrows():
            uprn_str = format_uprn_to_string(row.get('uprn'))
            p_id = uprn_str if uprn_str != "N/A" else f"prop-{index}"

            properties.append({
                "id":             p_id,
                "uprn":           uprn_str,
                "property_title": clean_value(row.get('property_title')),
                "property_type":  clean_value(row.get('property_type')),
                "address":        clean_value(row.get('address')),
                "price":          clean_value(row.get('price')),
                "price_num":      extract_number(row.get('price')),
                "yield":          clean_value(row.get('market_stats_renta_opportunities')),
                "yield_num":      extract_number(row.get('market_stats_renta_opportunities')),
                "property_images": extract_images(row.get('property_images')),
                "ecp_rating":     clean_value(row.get('ecp_rating')),
                "tenure":         clean_value(row.get('tenure')),
                "bedrooms":       clean_value(row.get('bedrooms')),
                "bathrooms":      clean_value(row.get('bathrooms')),
                "receptions":     clean_value(row.get('receptions')),
                "property_size":  clean_value(row.get('property_size')),
                "service_charge": clean_value(row.get('service_charge')),
                "time_remaining_on_lease": clean_value(row.get('time_remaining_on_lease')),
                "council_tax_band": clean_value(row.get('council_tax_band')),
                "description":    clean_value(row.get('description')),
                "availability":   clean_value(row.get('availability')),
            })

        return properties

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/risk-data-csv")
def get_risk_data_csv():
    try:
        if not os.path.exists(csv_path):
            return Response("uprn,title,price,ecp_rating,tenure\n", media_type="text/csv")

        df = pd.read_csv(csv_path)
        risk_data = []

        for _, row in df.iterrows():
            risk_data.append({
                "uprn":      format_uprn_to_string(row.get('uprn')),
                "title":     clean_value(row.get('property_title')),
                "price":     extract_number(row.get('price')),
                "ecp_rating": clean_value(row.get('ecp_rating')),
                "tenure":    clean_value(row.get('tenure'))
            })

        return Response(
            pd.DataFrame(risk_data).to_csv(index=False),
            media_type="text/csv"
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/predict")
def predict(data: PropertyInput):
    input_dict = data.dict()
    features = {
        "bedrooms":                input_dict["bedrooms"],
        "bathrooms":               input_dict["bathrooms"],
        "receptions":              input_dict["receptions"],
        "property_size":           input_dict["property_size"],
        "time_remaining_on_lease": input_dict["time_remaining_on_lease"],
        "service_charge":          input_dict["service_charge"],
        "price_per_sqft":          input_dict["price_per_sqft"],
        "postcode_area":           input_dict.get("postcode_area", ""),
        "property_type_clean":     input_dict.get("property_type_clean", ""),
    }
    result = predict_and_explain(features)
    return {
        "predicted_price": result["predicted_price"],
        "currency": "GBP"
    }


@app.post("/explain")
def explain(input: PropertyInput):
    print(f"📊 Received explain request: {input.dict()}")
    input_dict = input.dict()

    # Build features dict for predict_and_explain
    features = {
        "bedrooms":                input_dict["bedrooms"],
        "bathrooms":               input_dict["bathrooms"],
        "receptions":              input_dict["receptions"],
        "property_size":           input_dict["property_size"],
        "time_remaining_on_lease": input_dict["time_remaining_on_lease"],
        "service_charge":          input_dict["service_charge"],
        "price_per_sqft":          input_dict["price_per_sqft"],
        "postcode_area":           input_dict.get("postcode_area", ""),
        "property_type_clean":     input_dict.get("property_type_clean", ""),
    }
    
    # Use the centralized predict_and_explain function
    result = predict_and_explain(features)
    
    print(f"💰 Predicted price: £{result['predicted_price']:,.0f}")

    return {
        "predicted_price":    result["predicted_price"],
        "base_price":         result["base_price"],
        "shap_breakdown":     result["shap_breakdown"],
        "explanation":        result["explanation"],
        "feature_bullets":    result.get("feature_bullets", []),
        "valuation_summary":  result.get("valuation_summary", ""),
    }
@app.get("/api/property/{uprn}")
def get_property(uprn: str):
    try:
        if not os.path.exists(csv_path):
            raise HTTPException(status_code=404, detail="CSV not found")

        df = pd.read_csv(csv_path)
        df['temp_uprn'] = df['uprn'].apply(format_uprn_to_string)
        match = df[df['temp_uprn'] == uprn.strip()]

        if match.empty:
            raise HTTPException(status_code=404, detail=f"Property {uprn} not found")

        row = match.iloc[0]
        return {
            "uprn":           format_uprn_to_string(row.get('uprn')),
            "property_title": clean_value(row.get('property_title')),
            "address":        clean_value(row.get('address')),
            "price":          clean_value(row.get('price')),
            "price_num":      extract_number(row.get('price')),
            "ecp_rating":     clean_value(row.get('ecp_rating')),
            "tenure":         clean_value(row.get('tenure')),
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/")
async def serve_index():
    dist_path = os.path.join(os.path.dirname(__file__), 'dist')
    index_path = os.path.join(dist_path, 'index.html')
    if os.path.exists(index_path):
        return FileResponse(index_path)
    return {"message": "UK Property Audit + ML API is running", "csv_loaded": True, "ml_model": "XGBoost + SHAP Ready"}

@app.get("/{full_path:path}")
async def serve_spa(full_path: str):
    dist_path = os.path.join(os.path.dirname(__file__), 'dist')
    index_path = os.path.join(dist_path, 'index.html')
    if os.path.exists(index_path):
        return FileResponse(index_path)
    return {"error": "Frontend not built"}
