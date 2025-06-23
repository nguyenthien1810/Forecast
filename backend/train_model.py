# backend/train_model.py
from sklearn.ensemble import RandomForestClassifier
import joblib

# Dữ liệu mẫu (bạn có thể load từ CSV nếu có)
X = [[2, 3], [1, 1], [4, 4], [0, 2]]
y = [1, 0, 1, 0]  # 1: Over, 0: Under

# Huấn luyện
model = RandomForestClassifier(n_estimators=100)
model.fit(X, y)

# Lưu model
joblib.dump(model, 'model.pkl')
print("✅ Mô hình đã được lưu vào model.pkl")
