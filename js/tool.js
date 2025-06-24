let chartInstance = null;
let predictionLog = [];

function historyTo01(arr) {
  return arr.map(x => x === 'O' ? 1 : 0);
}

function analyze() {
  const input = document.getElementById('history').value.trim();
  const arr = input.split(/\s+/).map(x => x.toUpperCase());
  const counts = { O: 0, U: 0 };
  arr.forEach(x => {
    if (x === 'O' || x === 'U') counts[x]++;
  });

  const isAdvanced = document.getElementById("showAdvanced").checked;
  const streaks = countStreaks(arr);
  const lastOStreak = streaks.O.at(-1) || 0;
  const lastUStreak = streaks.U.at(-1) || 0;

  let resultText = "";

  if (streaks.O.length > 0) {
    resultText += `🔁 Chuỗi O: ${streaks.O.join(', ')}`;
  }
  if (streaks.U.length > 0) {
    resultText += resultText ? `<br>` : '';
    resultText += `🔁 Chuỗi U: ${streaks.U.join(', ')}`;
  }

  // ⚠️ Cảnh báo chuỗi dài
  if (isAdvanced) {
    if (lastOStreak >= 6) resultText += `<br>🚨 Chuỗi ${lastOStreak} O – dễ đảo chiều!`;
    else if (lastOStreak >= 4) resultText += `<br>⚠️ ${lastOStreak} O – cân nhắc đảo sang U`;

    if (lastUStreak >= 6) resultText += `<br>🚨 Chuỗi ${lastUStreak} U – dễ đảo chiều!`;
    else if (lastUStreak >= 4) resultText += `<br>⚠️ ${lastUStreak} U – cân nhắc đảo sang O`;
  }

  if (arr.length >= 5) {
  predictionLog = []; // Xóa log cũ

  for (let i = 4; i < arr.length; i++) {
    const history = arr.slice(0, i);  // từ đầu đến ván trước
    const actual = arr[i];            // ván hiện tại là kết quả thật

    // Markov
    const markov = getMarkovPrediction(history);
    predictionLog.push({
      method: 'Markov',
      guess: markov.nextGuess,
      actual,
      correct: markov.nextGuess === actual,
      index: i
    });

    // Bayes
    const bayes = getNaiveBayesPrediction(history, 2, actual);
    if (typeof bayes !== 'string') {
      predictionLog.push({
        method: 'Bayes',
        guess: bayes.guess,
        actual,
        correct: bayes.correct,
        index: i
      });
    }

    // Pattern
    const patternResult = suggestFromPattern(history, true);
    if (patternResult.guess === 'O' || patternResult.guess === 'U') {
      predictionLog.push({
        method: 'Pattern',
        guess: patternResult.guess,
        actual,
        correct: patternResult.guess === actual,
        index: i
      });
    }
  }

  // ➕ Optional: Dự đoán thêm ván kế tiếp (ván chưa có thực tế)
  const future = getMarkovPrediction(arr);
  resultText += `<br>🤖 Markov đoán tiếp theo: ${future.nextGuess}`;

  const bayesFuture = getNaiveBayesPrediction(arr, 2);
  if (typeof bayesFuture !== 'string') {
    resultText += `<br>${bayesFuture.text}`;
  }

  const patternFuture = suggestFromPattern(arr, true);
  if (patternFuture.guess) {
    resultText += `<br>${patternFuture.text}`;
  }

  // Hiện thống kê nếu bật nâng cao
  if (isAdvanced) {
    resultText += `<br>${showPredictionStats()}`;
    resultText += `<br>${showAccuracyByMethod()}`;
  }

  document.getElementById('result').innerHTML = resultText;
} else {
  resultText += `<br>❗ Không đủ dữ liệu để phân tích (cần ≥ 5 kết quả)`;
  document.getElementById('result').innerHTML = resultText;
}


  // Biểu đồ
  const showChart = document.getElementById("toggleChart").checked;
  document.getElementById("chart").style.display = showChart ? "block" : "none";
  if (showChart) drawChart(counts.O, counts.U);
}

function countStreaks(arr) {
  const result = { O: [], U: [] };
  let current = arr[0], count = 1;
  for (let i = 1; i < arr.length; i++) {
    if (arr[i] === current) {
      count++;
    } else {
      result[current]?.push(count);
      current = arr[i];
      count = 1;
    }
  }
  result[current]?.push(count);
  return result;
}

function drawChart(oCount, uCount) {
  const ctx = document.getElementById("chart").getContext("2d");
  if (chartInstance) chartInstance.destroy();

  chartInstance = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: ['O', 'U'],
      datasets: [{
        label: 'Số lần xuất hiện',
        data: [oCount, uCount],
        backgroundColor: ['#008080', '#e67e22']
      }]
    }
  });
}

// hàm markov
function getMarkovPrediction(arr) {
  const transitions = { O: { O: 0, U: 0 }, U: { O: 0, U: 0 } };
  for (let i = 0; i < arr.length - 1; i++) {
    const curr = arr[i], next = arr[i + 1];
    if (transitions[curr]) transitions[curr][next]++;
  }
  const last = arr.at(-1);
  const guess = transitions[last]?.O > transitions[last]?.U ? 'O' : 'U';
  return { nextGuess: guess, stats: transitions };
}

function suggestFromPattern(arr, returnObject = false) {
  const patterns = {};
  for (let i = 0; i < arr.length - 3; i++) {
    const key = arr.slice(i, i + 3).join('');
    const next = arr[i + 3];
    if (!patterns[key]) patterns[key] = { O: 0, U: 0 };
    patterns[key][next]++;
  }

  const last3 = arr.slice(-3).join('');
  const data = patterns[last3];

  if (data) {
    const guess = data.O > data.U ? 'O' : 'U';
    const total = data.O + data.U;
    const confidence = ((Math.max(data.O, data.U) / total) * 100).toFixed(1);
    const resultText = `📊 Pattern '${last3}' → đoán: ${guess}`;
    return returnObject ? { guess, confidence, text: resultText } : resultText;
  }

  return returnObject
    ? { guess: null, confidence: 0, text: '📊 Pattern: Không đủ dữ liệu để dự đoán.' }
    : '📊 Pattern: Không đủ dữ liệu để dự đoán.';
}

function analyzeReverseStats(arr, target = 'O', minStreak = 6) {
  let count = 0;
  let reversed = 0;
  let streak = 0;

  for (let i = 0; i < arr.length - 1; i++) {
    if (arr[i] === target) {
      streak++;
    } else {
      if (streak >= minStreak) {
        count++;
        if (arr[i + 1] && arr[i + 1] !== target) {
          reversed++;
        }
      }
      streak = 0;
    }
  }

  return count > 0 ? {
    total: count,
    reversed: reversed,
    rate: ((reversed / count) * 100).toFixed(2)
  } : null;
}

function showPredictionStats() {
  const total = predictionLog.length;
  const correct = predictionLog.filter(p => p.correct).length;
  const winRate = total > 0 ? ((correct / total) * 100).toFixed(2) : 0;
  return `📌 Hiệu quả dự đoán: ${correct}/${total} đúng (${winRate}%)`;
}

// hàm hiển thị bảng thống kê thuật toán - khi chọn hiện nâng cao
function showAccuracyByMethod() {
  const methods = {};
  const symbols = { true: '✔️', false: '❌' };

  // ✅ Lọc predictionLog để chỉ lấy từ ván thứ 10 trở đi
  const filteredLog = predictionLog.slice(9); // ván thứ 10 trở đi (index 9)

  filteredLog.forEach(p => {
    if (!methods[p.method]) {
      methods[p.method] = {
        total: 0,
        correct: 0,
        chain: []
      };
    }
    const isCorrect = p.correct;
    methods[p.method].total++;
    if (isCorrect) methods[p.method].correct++;
    methods[p.method].chain.push(symbols[isCorrect]);
  });

  let result = `<table border="1" cellpadding="4" style="border-collapse: collapse; margin-top: 10px;">`;
  result += `<thead><tr>
    <th>Thuật toán</th>
    <th>Đúng</th>
    <th>Tổng</th>
    <th>Tỉ lệ đúng</th>
    <th>Chuỗi đúng/sai (từ ván 10)</th>
  </tr></thead><tbody>`;

  const desiredOrder = ['Markov', 'Bayes', 'Pattern'];
desiredOrder.forEach(method => {
  if (methods[method]) {
    const { total, correct, chain } = methods[method];
    const rate = ((correct / total) * 100).toFixed(1);
    result += `<tr>
      <td>${method}</td>
      <td>${correct}</td>
      <td>${total}</td>
      <td>${rate}%</td>
      <td>${chain.join(' ')}</td>
    </tr>`;
  }
});

  result += `</tbody></table>`;
  return result;
}

// hàm RL
function getRLPrediction(historyArray) {
  return fetch('http://127.0.0.1:5000/api/predict-rl', {  // 👈 sửa absolute URL
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ history: historyArray })
  })
    .then(response => {
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return response.json();
    })
    .then(data => {
  const actual = document.getElementById('history').value.trim().toUpperCase().split(/\s+/).at(-1);
  predictionLog.push({
    method: 'Reinforcement Learning',
    guess: data.prediction,
    actual,
    correct: data.prediction === actual
  });

  return `<br>🧠 Reinforcement Learning đoán: ${data.prediction}`;
})
    .catch(error => {
      console.error("Lỗi khi gọi RL API:", error);
      return `<br>⚠️ Lỗi gọi API Reinforcement Learning`;
    });
}

// Hàm NaiveBayes
function getNaiveBayesPrediction(arr, lookback = 2, actual = null) {
  if (arr.length < lookback + 1) return "❗ Không đủ dữ liệu cho Bayes";

  const contextCounts = {};
  for (let i = 0; i <= arr.length - lookback - 1; i++) {
    const context = arr.slice(i, i + lookback).join('');
    const outcome = arr[i + lookback];
    if (!contextCounts[context]) contextCounts[context] = { O: 0, U: 0 };
    contextCounts[context][outcome]++;
  }

  const latestContext = arr.slice(-lookback).join('');
  const counts = contextCounts[latestContext];
  if (!counts) return `🧮 Bayes: Không có dữ liệu cho chuỗi '${latestContext}'`;

  const total = counts.O + counts.U;
  const pO = (counts.O / total).toFixed(2);
  const pU = (counts.U / total).toFixed(2);
  const guess = counts.O > counts.U ? 'O' : 'U';

  return {
    guess,
    text: `🧮 Bayes '${latestContext}' → O: ${(pO * 100).toFixed(1)}%, U: ${(pU * 100).toFixed(1)}% → đoán: ${guess}`,
    correct: actual ? (actual === guess) : null
  };
}


