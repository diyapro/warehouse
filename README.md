# Running pickled (.pkl) models

Steps to run a .pkl model included in this repo's `model/` folder.

1. Install dependencies (recommended in a virtualenv):

```bash
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
```

2. Run the included script `run_model.py`.

Example (uses the model `model/warehouse_demand_model.pkl` and the provided dataset):

```bash
python run_model.py --model model/warehouse_demand_model.pkl --input "dataset/logistics_dataset (1).csv" --output predictions.csv
```

Notes:
- The script attempts to load models via `joblib` (preferred) or `pickle`.
- If the model has `feature_names_in_`, the script will select those columns from the CSV.
- If not, it will use numeric columns from the CSV; provide a prepared CSV with only the feature columns when needed.
- If the pickled object is not an sklearn-like estimator (no `.predict()`), adapt loading accordingly.
"# warehouse" 
