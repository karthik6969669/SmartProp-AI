import pandas as pd
import numpy as np
from sklearn.linear_model import LinearRegression
from sklearn.model_selection import train_test_split, cross_val_score
import joblib
import json

# Load cleaned data
df = pd.read_csv('../data/house_price_predictions_cleaned.csv')

# Convert all "applicable"/"notApplicable" flags to 1/0
for col in ['hospitalApplicable', 'schoolApplicable', 'railwayApplicable', 'busApplicable']:
    df[col] = df[col].map({'applicable': 1, 'notApplicable': 0, 1: 1, 0: 0}).fillna(0).astype(int)

# Feature engineering: log-transform Area
df['log_Area_sqft'] = np.log1p(df['Area_sqft'])

# One-hot encode categorical features
df = pd.get_dummies(df, columns=['Property_Type', 'Condition'], drop_first=True)

# Select features to use for prediction
features = [
    'log_Area_sqft', 'Bedrooms', 'Bathrooms', 'Year_Built',
    'hospitalApplicable', 'hospitalDistance',
    'schoolApplicable', 'schoolDistance',
    'railwayApplicable', 'railwayDistance',
    'busApplicable', 'busDistance'
]
# Add one-hot encoded columns dynamically
features += [col for col in df.columns if col.startswith('Property_Type_') or col.startswith('Condition_')]

X = df[features]
y = df['Predicted_Price']

# Remove rows where y is NaN
not_null_mask = y.notnull()
X = X[not_null_mask]
y = y[not_null_mask]

# Save features used for prediction (for API)
with open("house_model_features.json", "w") as f:
    json.dump(features, f)

# Train/test split
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# Train linear regression model
model = LinearRegression()
model.fit(X_train, y_train)

print("Train R2:", model.score(X_train, y_train))
print("Test R2:", model.score(X_test, y_test))

joblib.dump(model, 'house_price_model.pkl')

scores = cross_val_score(LinearRegression(), X, y, cv=5, scoring='r2')
print("5-fold CV scores:", scores)
print("Mean CV R2:", scores.mean())
