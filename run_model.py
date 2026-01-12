#!/usr/bin/env python3
import os
import sys
import pickle
import pandas as pd
import numpy as np

# Explicit exports from this module
__all__ = ["predict_from_dict", "load_model"]


def load_model(path):
    # Try joblib first (common for sklearn), fall back to pickle
    try:
        from joblib import load as jl_load
        return jl_load(path)
    except Exception:
        try:
            with open(path, "rb") as f:
                return pickle.load(f)
        except ModuleNotFoundError as e:
            print("Failed to load model: missing module during unpickle:", e)
            print("If this is an xgboost model, install xgboost before running this script.")
            raise


def prompt_float(name, dtype=float):
    while True:
        try:
            v = input(f"Enter {name}: ")
            if v.strip() == "":
                print("Empty input not allowed; please enter a number.")
                continue
            return dtype(v)
        except ValueError:
            print("Invalid value. Please enter a numeric value.")


def main():
    model_path = os.path.join("model", "warehouse_demand_model.pkl")
    if not os.path.exists(model_path):
        print(f"Model file not found: {model_path}")
        sys.exit(2)

    print(f"Loading model from {model_path}...")
    try:
        model = load_model(model_path)
    except Exception as e:
        print("Could not load model:", e)
        sys.exit(1)

    # Features expected (match the notebook training code)
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

    # CLI preserves the original interactive behaviour
    print("Please input the following feature values (one by one).")
    values = {}
    for f in features:
        # treat some fields as int where appropriate
        if f in ("category_encoded", "stockout_risk", "is_expired", "total_orders_last_month", "stockout_count_last_month"):
            values[f] = prompt_float(f, int)
        else:
            values[f] = prompt_float(f, float)

    # Build single-row DataFrame in the same column order
    row = {k: [values[k]] for k in features}
    X = pd.DataFrame(row)

    # Ensure numeric dtypes
    X = X.apply(pd.to_numeric)

    if not hasattr(model, "predict"):
        print("Loaded object does not expose a `predict` method. Cannot run prediction.")
        sys.exit(3)

    try:
        pred = model.predict(X)
    except Exception as e:
        print("Prediction failed:", e)
        sys.exit(4)

    # model.predict may return array-like
    try:
        out_value = float(pred[0])
    except Exception:
        out_value = float(pred)

    print(f"Predicted forecasted_demand_next_7d: {out_value}")


def predict_from_dict(feature_dict, model_path=None, model_obj=None):
    """Predict a single value from a mapping of features.

    Args:
        feature_dict (dict): mapping of feature names to values.
        model_path (str|Path): path to the pickled model (used if model_obj is None).
        model_obj: pre-loaded model object (optional).

    Returns:
        float: predicted forecasted_demand_next_7d
    """
    # features list matches training notebook
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

    if model_obj is None:
        if model_path:
            path = model_path
        else:
            # Resolve model path relative to this file (repository root), so callers
            # running from other cwd (e.g. warehouse-ai) still find the model.
            base_dir = os.path.dirname(os.path.abspath(__file__))
            path = os.path.join(base_dir, "model", "warehouse_demand_model.pkl")
        model_obj = load_model(path)

    # build DataFrame
    row = {f: feature_dict.get(f, 0) for f in features}
    X = pd.DataFrame([row], columns=features)
    X = X.apply(pd.to_numeric)

    if not hasattr(model_obj, 'predict'):
        raise ValueError('Provided model has no predict method')

    pred = model_obj.predict(X)
    try:
        return float(pred[0])
    except Exception:
        return float(pred)


if __name__ == "__main__":
    main()
