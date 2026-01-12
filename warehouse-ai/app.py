from flask import Flask, request, send_from_directory, jsonify
from flask_cors import CORS
import os
import sys
import pandas as pd

# allow importing run_model from repo root
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
if ROOT not in sys.path:
    sys.path.insert(0, ROOT)

from run_model import predict_from_dict
LATEST_METRICS = None
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
    

@app.route("/analyze", methods=["POST"])
def analyze():
    global LATEST_METRICS

    if "file" not in request.files:
        return jsonify({"error": "No file uploaded"}), 400

    file = request.files["file"]
    df = pd.read_csv(file)
    df = df.fillna(0)

    print("📊 Received columns:", df.columns.tolist())

    items = []
    preview_df = df.head(50)

    for idx, row in preview_df.iterrows():

        # 🔮 Predict demand
        try:
            feature_dict = {}
            for f in FEATURES:
                feature_dict[f] = float(row[f]) if f in df.columns else 0
                if f in INT_FIELDS:
                    feature_dict[f] = int(feature_dict[f])

            predicted_demand = round(predict_from_dict(feature_dict), 1)
        except Exception:
            predicted_demand = 0

        current_stock = int(row["stock_level"]) if "stock_level" in df.columns else 0
        days_left = round(float(row["days_of_stock_left"]), 1) if "days_of_stock_left" in df.columns else 0
        days_to_expiry = int(row["days_to_expiry"]) if "days_to_expiry" in df.columns else 0
        reorder_point = float(row["reorder_point"]) if "reorder_point" in df.columns else 0

        items.append({
            "item_id": int(idx),
            "predicted_demand": predicted_demand,
            "current_stock": current_stock,
            "days_left": days_left,
            "days_to_expiry": days_to_expiry,
            "alert": "YES" if current_stock < reorder_point else "NO",
            "action": "REORDER" if current_stock < reorder_point else "OK"
        })

    # 📊 KPI aggregates
    LATEST_METRICS = {
        "alerts": sum(1 for i in items if i["action"] == "REORDER"),
        "expiryCount": sum(1 for i in items if i["days_to_expiry"] <= 7),
        "avgDays": round(
            sum(i["days_left"] for i in items) / len(items), 1
        ) if items else 0,
        "financialRisk": int(
            sum(
                row["stock_level"] * row["unit_price"]
                for _, row in preview_df.iterrows()
                if "unit_price" in df.columns
            )
        ) if "unit_price" in df.columns else 0,
        "items": items,
        "totalDemand": round(sum(i["predicted_demand"] for i in items), 1),
        "reorderCount": sum(1 for i in items if i["action"] == "REORDER")
    }

    return jsonify(LATEST_METRICS)



@app.route("/analyze-latest", methods=["GET"])
def analyze_latest():
    if not LATEST_METRICS:
        return jsonify({"error": "No analysis available yet"}), 404
    return jsonify(LATEST_METRICS)


if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=True)
