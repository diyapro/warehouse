from flask import Flask, request, send_from_directory, jsonify
from flask_cors import CORS
import os
import sys

# allow importing run_model from repo root
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
if ROOT not in sys.path:
    sys.path.insert(0, ROOT)

from run_model import predict_from_dict

app = Flask(__name__, static_folder='.', template_folder='.')
CORS(app)  # allow all origins (safe for dev)

@app.route('/', methods=['GET'])
def index():
    return send_from_directory('.', 'index.html')

@app.route('/<path:filename>')
def static_files(filename):
    return send_from_directory('.', filename)

FEATURES = [
    "category_encoded",
    "daily_demand",
    "demand_std_dev",
    "stock_level",
    "days_of_stock_left",
    "stockout_risk",
    "lead_time_days",
    "reorder_point",
    "reorder_frequency_days",
    "item_popularity_score",
    "total_orders_last_month",
    "stockout_count_last_month",
    "turnover_ratio",
    "days_since_restock",
    "days_to_expiry",
    "is_expired",
    "unit_price",
    "holding_cost_per_unit_day",
]

INT_FIELDS = {
    "category_encoded",
    "stockout_risk",
    "is_expired",
    "total_orders_last_month",
    "stockout_count_last_month",
}

@app.route('/predict', methods=['POST'])
def predict():
    print("✅ /predict HIT")

    if request.is_json:
        data = request.get_json()
    else:
        data = request.form.to_dict()

    if not isinstance(data, dict):
        return jsonify({'error': 'Request body must be JSON or form data'}), 400

    feature_dict = {}
    missing = []
    cast_errors = []

    for f in FEATURES:
        if f in data and data[f] != "":
            try:
                val = float(data[f])
                if f in INT_FIELDS:
                    val = int(val)
                feature_dict[f] = val
            except Exception:
                cast_errors.append(f)
        else:
            missing.append(f)

    if cast_errors:
        return jsonify({'error': 'Invalid numeric fields', 'fields': cast_errors}), 400

    if missing:
        return jsonify({'error': 'Missing required fields', 'missing': missing}), 400

    try:
        prediction = predict_from_dict(feature_dict)
        return jsonify({'prediction': prediction})
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# ===========================
# 🔥 BULK PREDICTION ENDPOINT
# ===========================
@app.route('/predict-bulk', methods=['POST'])
def predict_bulk():
    print("✅ /predict-bulk HIT")

    data = request.get_json()

    if not isinstance(data, list):
        return jsonify({
            "error": "Input must be a JSON array of arrays"
        }), 400

    predictions = []
    errors = []

    for idx, row in enumerate(data):
        if not isinstance(row, list):
            errors.append({"index": idx, "error": "Each item must be an array"})
            continue

        if len(row) != len(FEATURES):
            errors.append({
                "index": idx,
                "error": f"Expected {len(FEATURES)} values, got {len(row)}"
            })
            continue

        try:
            feature_dict = {}
            for f, v in zip(FEATURES, row):
                val = float(v)
                if f in INT_FIELDS:
                    val = int(val)
                feature_dict[f] = val

            pred = predict_from_dict(feature_dict)
            predictions.append(pred)

        except Exception as e:
            errors.append({"index": idx, "error": str(e)})

    return jsonify({
        "predictions": predictions,
        "errors": errors
    })


if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=True)
