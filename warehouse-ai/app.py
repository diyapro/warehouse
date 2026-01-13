from flask import Flask, request, send_from_directory, jsonify
from flask_cors import CORS
import os
import sys
import pandas as pd

# -----------------------------
# Setup
# -----------------------------
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
if ROOT not in sys.path:
    sys.path.insert(0, ROOT)

from run_model import predict_from_dict

LATEST_METRICS = None

app = Flask(__name__, static_folder='.', template_folder='.')

CORS(
    app,
    resources={r"/*": {"origins": "http://127.0.0.1:5500"}},
    supports_credentials=True
)

# -----------------------------
# Routes
# -----------------------------
@app.route('/', methods=['GET'])
def index():
    return send_from_directory('.', 'index.html')

@app.route('/<path:filename>')
def static_files(filename):
    return send_from_directory('.', filename)

# -----------------------------
# ANALYZE CSV
# -----------------------------
@app.route("/analyze", methods=["POST", "OPTIONS"])
def analyze():
    global LATEST_METRICS

    if request.method == "OPTIONS":
        return jsonify({"status": "ok"}), 200

    if "file" not in request.files:
        return jsonify({"error": "No file uploaded"}), 400

    df = pd.read_csv(request.files["file"])

    # -----------------------------
    # Normalize column names
    # -----------------------------
    df.columns = (
        df.columns
        .str.strip()
        .str.lower()
        .str.replace(" ", "_")
    )

    # -----------------------------
    # ADD item_id (🔥 REQUIRED)
    # -----------------------------
    df["item_id"] = df.index.astype(int)

    # -----------------------------
    # Column mapping
    # -----------------------------
    COLUMN_MAP = {
        "stock": "stock_level",
        "current_stock": "stock_level",
        "reorderpoint": "reorder_point",
        "demand": "daily_demand",
        "price": "unit_price",
        "expiry": "expiry_date",
        "expiry_date": "expiry_date",
        "restock_date": "restock_date",
        "last_restock_date": "restock_date",
    }

    df.rename(
        columns={c: COLUMN_MAP[c] for c in df.columns if c in COLUMN_MAP},
        inplace=True
    )

    # -----------------------------
    # Derived columns
    # -----------------------------
    today = pd.Timestamp.today()

    if "days_to_expiry" not in df.columns:
        if "expiry_date" in df.columns:
            df["expiry_date"] = pd.to_datetime(df["expiry_date"], errors="coerce")
            df["days_to_expiry"] = (df["expiry_date"] - today).dt.days
        else:
            df["days_to_expiry"] = 999

    if "days_of_stock_left" not in df.columns:
        if "daily_demand" in df.columns and "stock_level" in df.columns:
            df["days_of_stock_left"] = df["stock_level"] / df["daily_demand"]
        else:
            df["days_of_stock_left"] = 0

    # -----------------------------
    # Required validation
    # -----------------------------
    REQUIRED_COLS = [
        "stock_level",
        "reorder_point",
        "days_to_expiry",
        "days_of_stock_left",
        "daily_demand",
        "unit_price"
    ]

    missing = [c for c in REQUIRED_COLS if c not in df.columns]
    if missing:
        return jsonify({
            "error": "Missing required columns",
            "missing": missing,
            "found": df.columns.tolist()
        }), 400

    # -----------------------------
    # KPIs
    # -----------------------------
    alerts = int((df["stock_level"] < df["reorder_point"]).sum())
    expiry = int((df["days_to_expiry"] <= 30).sum())
    avg_days = round(df["days_of_stock_left"].mean(), 2)
    total_demand = int(df["daily_demand"].sum() * 7)
    reorder_count = alerts
    financial_risk = int((df["stock_level"] * df["unit_price"]).sum())

    # -----------------------------
    # EXPIRY RISK CLASSIFICATION
    # -----------------------------
    df["expiry_risk"] = pd.cut(
        df["days_to_expiry"],
        bins=[-float("inf"), 7, 30, float("inf")],
        labels=["Critical", "High", "Low"]
    )

    # -----------------------------
    # STOCK SEVERITY (🔥 REQUIRED)
    # -----------------------------
    df["severity"] = pd.cut(
        df["days_of_stock_left"],
        bins=[-float("inf"), 3, 7, float("inf")],
        labels=["Critical", "High", "Normal"]
    )

    # -----------------------------
    # Product table
    # -----------------------------
    items = []
    for _, row in df.iterrows():
        items.append({
            "item_id": int(row["item_id"]),
            "predicted_demand": round(row["daily_demand"] * 7, 1),
            "current_stock": int(row["stock_level"]),
            "days_left": round(row["days_of_stock_left"], 1),
            "days_to_expiry": int(row["days_to_expiry"]),
            "expiry_risk": str(row["expiry_risk"]),
            "severity": str(row["severity"]),
            "alert": "⚠️ Low Stock" if row["stock_level"] < row["reorder_point"] else "OK",
            "action": "Reorder" if row["stock_level"] < row["reorder_point"] else "Monitor"
        })

    LATEST_METRICS = {
        "alerts": alerts,
        "avgDays": avg_days,
        "expiryCount": expiry,
        "totalDemand": total_demand,
        "reorderCount": reorder_count,
        "financialRisk": financial_risk,
        "items": items
    }

    return jsonify(LATEST_METRICS)

# -----------------------------
# DASHBOARD FETCH
# -----------------------------
@app.route("/analyze-latest", methods=["GET"])
def analyze_latest():
    if not LATEST_METRICS:
        return jsonify({"error": "No analysis available yet"}), 404
    return jsonify(LATEST_METRICS)

# -----------------------------
if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
