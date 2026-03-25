import os
import re
import pandas as pd
from flask import Flask, jsonify, Response, request
from flask_cors import CORS

app = Flask(__name__)


CORS(app, resources={r"/api/*": {"origins": "*"}})

base_path = os.path.dirname(os.path.abspath(__file__))
csv_path = os.path.join(base_path, 'table.csv')


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
        float_val = float(val)
        return str(int(float_val))
    except (ValueError, TypeError):
        return str(val).strip()

def extract_images(raw_data):
    if pd.isna(raw_data) or str(raw_data).strip() == "":
        return []
    links = re.findall(r'http[s]?://(?:[a-zA-Z]|[0-9]|[$-_@.&+]|[!*\(\),]|(?:%[0-9a-f_A-F][0-9a-f_A-F]))+', str(raw_data))
    return links



@app.route('/')
def home():
    return jsonify({
        "status": "Audit Intelligence Active",
        "database_connected": os.path.exists(csv_path)
    })


@app.route('/api/risk-data-csv', methods=['GET'])
def get_risk_data_csv():
    try:
        if not os.path.exists(csv_path):
            return Response("uprn,title,price,ecp_rating,tenure\n", mimetype='text/csv')
        
        df = pd.read_csv(csv_path)
        risk_data = []
        for _, row in df.iterrows():
            risk_data.append({
                "uprn": format_uprn_to_string(row.get('uprn')),
                "title": clean_value(row.get('property_title')),
                "price": extract_number(row.get('price')),
                "ecp_rating": clean_value(row.get('ecp_rating')),
                "tenure": clean_value(row.get('tenure'))
            })
        
        return Response(pd.DataFrame(risk_data).to_csv(index=False), mimetype='text/csv')
    except Exception as e:
        return Response(f"error\n{str(e)}", mimetype='text/csv')


@app.route('/api/properties', methods=['GET'])
def get_properties():
    try:
        if not os.path.exists(csv_path):
            return jsonify({"error": "CSV not found"}), 404

        df = pd.read_csv(csv_path)
        properties = []
        for index, row in df.iterrows():
            uprn_str = format_uprn_to_string(row.get('uprn'))
            p_id = uprn_str if uprn_str != "N/A" else f"prop-{index}"
            
            properties.append({
                "id": p_id, 
                "uprn": uprn_str,
                "property_title": clean_value(row.get('property_title')),
                "property_type": clean_value(row.get('property_type')),
                "address": clean_value(row.get('address')),
                "price": clean_value(row.get('price')),
                "price_num": extract_number(row.get('price')), 
                "yield": clean_value(row.get('market_stats_renta_opportunities')),
                "yield_num": extract_number(row.get('market_stats_renta_opportunities')),
                "property_images": extract_images(row.get('property_images')),
                "ecp_rating": clean_value(row.get('ecp_rating')),
                "tenure": clean_value(row.get('tenure')),
                "bedrooms": clean_value(row.get('bedrooms'))
            })
        return jsonify(properties)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/api/predict', methods=['POST'])
def predict_insight():
    try:
        data = request.json
        
        incoming_id = str(data.get('uprn', '')).strip()
        user_query = data.get('query', '').lower()

        if not os.path.exists(csv_path):
            return jsonify({"prediction_text": "Error: Database missing."}), 404

        df = pd.read_csv(csv_path)
        
        
        df['temp_uprn'] = df['uprn'].apply(format_uprn_to_string)
        match = df[df['temp_uprn'] == incoming_id]

        if match.empty:
            return jsonify({
                "status": "not_found",
                "prediction_text": f"Asset ID {incoming_id} not found in intelligence record. Check if UPRN is provided in CSV."
            }), 200

        row = match.iloc[0]
        address = clean_value(row.get('address'))
        price = clean_value(row.get('price'))
        
        response = f"AI Forensic Analysis for {address}: Currently valued at {price}. Our engine predicts stable yield metrics for your query: '{user_query}'."

        return jsonify({"status": "success", "prediction_text": response})
    except Exception as e:
        return jsonify({"prediction_text": f"Engine Error: {str(e)}"}), 500

if __name__ == '__main__':
    port = int(os.environ.get("PORT", 5000))
    app.run(host='127.0.0.1', port=port, debug=True)