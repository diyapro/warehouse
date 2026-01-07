#!/usr/bin/env python3
import sys
import json
import os

def main():
    # read json from stdin
    raw = sys.stdin.read()
    if not raw:
        print(json.dumps({"error": "no input"}))
        sys.exit(1)

    try:
        data = json.loads(raw)
    except Exception as e:
        print(json.dumps({"error": f"invalid json: {e}"}))
        sys.exit(1)

    import pandas as pd
    import numpy as np
    import pickle
    from pathlib import Path

    model_path = Path('model') / 'warehouse_demand_model.pkl'
    if not model_path.exists():
        print(json.dumps({"error": f"model not found: {model_path}"}))
        sys.exit(2)

    # feature list (match training notebook)
    features = [
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

    # build one-row dataframe, fill missing with 0
    row = {f: data.get(f, 0) for f in features}
    df = pd.DataFrame([row], columns=features)

    # load model
    try:
        from joblib import load as jl_load
        model = jl_load(model_path)
    except Exception:
        try:
            with open(model_path, 'rb') as f:
                model = pickle.load(f)
        except Exception as e:
            print(json.dumps({"error": f"failed to load model: {e}"}))
            sys.exit(3)

    if not hasattr(model, 'predict'):
        print(json.dumps({"error": "model has no predict method"}))
        sys.exit(4)

    try:
        pred = model.predict(df)
        val = float(pred[0])
    except Exception as e:
        print(json.dumps({"error": f"prediction failed: {e}"}))
        sys.exit(5)

    print(json.dumps({"prediction": val}))


if __name__ == '__main__':
    main()
