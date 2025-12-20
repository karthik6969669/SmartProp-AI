import pandas as pd
import numpy as np

# STEP 1: Load CSV
df = pd.read_csv('../data/house_price_predictions.csv')

# STEP 2: Remove rows with missing target
df = df.dropna(subset=['Predicted_Price'])

# STEP 3: Fill missing Year_Built with median or a default like 2011
if 'Year_Built' in df.columns:
    df['Year_Built'] = pd.to_numeric(df['Year_Built'], errors='coerce')
    default_year = int(df['Year_Built'].median()) if not df['Year_Built'].dropna().empty else 2011
    df['Year_Built'] = df['Year_Built'].fillna(default_year)

# STEP 4: Standardize flags (applicable/notApplicable) and fill missing as 0
flags = ['hospitalApplicable', 'schoolApplicable', 'railwayApplicable', 'busApplicable']
for col in flags:
    if col in df.columns:
        df[col] = df[col].map({'applicable': 1, 'notApplicable': 0})
        df[col] = df[col].fillna(0)

# STEP 5: Force numeric for all numeric/distance columns and fill missing with 0
numeric_fields = ['Area_sqft', 'Bedrooms', 'Bathrooms', 'latitude', 'longitude',
                  'hospitalDistance', 'schoolDistance', 'railwayDistance', 'busDistance']
for col in numeric_fields:
    if col in df.columns:
        df[col] = pd.to_numeric(df[col], errors='coerce').fillna(0)

# STEP 6: Fill categories ("Property_Type", "Condition") with mode
for col in ['Property_Type', 'Condition']:
    if col in df.columns:
        mode_value = df[col].mode()[0]
        df[col] = df[col].fillna(mode_value)

# STEP 7: Remove duplicates (optional but good practice)
df = df.drop_duplicates()

# STEP 8: Print summary of nulls
print("Null values after cleaning:")
print(df.isnull().sum())

# STEP 9: Save cleaned CSV
df.to_csv('../data/house_price_predictions_cleaned.csv', index=False)
