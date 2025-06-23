from flask import Flask, request, jsonify
from flask_cors import CORS  # 👈 Thêm dòng này
import joblib

app = Flask(__name__)
CORS(app)  # 👈 Bật CORS cho toàn bộ app

model = joblib.load('model.pkl')

@app.route('/predict', methods=['POST'])
def predict():
    data = request.get_json()
    goals = data.get('goals', 0)
    over_last5 = data.get('over_last5', 0)
    prediction = model.predict([[goals, over_last5]])[0]
    return jsonify({'prediction': 'O' if prediction == 1 else 'U'})

if __name__ == '__main__':
    app.run(debug=True)
