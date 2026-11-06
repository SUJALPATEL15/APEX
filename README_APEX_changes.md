# APEX update - what is in this folder
Replace in your project (same file names): train_apex_models.py, main.py, readiness_model.pkl, injury_model.pkl, apex_cricket_football_athlete_dataset.csv
New files (must sit next to main.py): apex_features.py, model_meta.json, apex_eda.py
Reports for the PBL submission: apex_results/ (eda_summary.md, model_comparison_tables.md, error_analysis.md, metrics.json, figures/)

Run:  pip install fastapi uvicorn scikit-learn imbalanced-learn pandas matplotlib seaborn joblib
      python apex_eda.py ; python train_apex_models.py ; uvicorn main:app --reload --port 8000
API docs: http://127.0.0.1:8000/docs   (apex.db is created on first start and seeded with the 40 athletes)
Data is SYNTHETIC - demonstration only.
