import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
import os
import pickle

# -------------------------------
# Generate synthetic student data
# -------------------------------
n = 500
data = {
    'attendance': np.random.randint(40, 100, size=n),
    'marks': np.random.randint(30, 100, size=n),
    'fees_paid': np.random.choice([0, 1], size=n),
}

df = pd.DataFrame(data)

# -------------------------------
# Label student risk
# -------------------------------
def label_risk(row):
    score = 0
    if row['attendance'] < 75:
        score += 1
    if row['marks'] < 60:
        score += 1
    if row['fees_paid'] == 0:
        score += 1

    if score == 0:
        return 0  # Low risk
    elif score == 1:
        return 1  # Medium risk
    else:
        return 2  # High risk

df['risk_label'] = df.apply(label_risk, axis=1)

# -------------------------------
# Prepare features and target
# -------------------------------
X = df[['attendance', 'marks', 'fees_paid']]
y = df['risk_label']

X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42
)

# -------------------------------
# Train Random Forest model
# -------------------------------
model = RandomForestClassifier(n_estimators=100, random_state=42)
model.fit(X_train, y_train)

# -------------------------------
# Save model
# -------------------------------

with open('risk_model.pkl', 'wb') as f:
    pickle.dump(model, f)

print("ML model trained and saved as models/risk_model.pkl")
