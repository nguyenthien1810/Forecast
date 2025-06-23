let chartInstance = null;
let predictionLog = [];

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

  // ⚠️ Cảnh báo chuỗi dài (nâng cao)
  if (isAdvanced) {
    if (lastOStreak >= 6) resultText += `<br>🚨 Chuỗi ${lastOStreak} O – dễ đảo chiều!`;
    else if (lastOStreak >= 4) resultText += `<br>⚠️ ${lastOStreak} O – cân nhắc đảo sang U`;

    if (lastUStreak >= 6) resultText += `<br>🚨 Chuỗi ${lastUStreak} U – dễ đảo chiều!`;
    else if (lastUStreak >= 4) resultText += `<br>⚠️ ${lastUStreak} U – cân nhắc đảo sang O`;
  }

  if (arr.length >= 4) {
    const testArr = arr.slice(0, -1);
    const actualNext = arr.at(-1);

    // ✅ Markov
    const markov = getMarkovPrediction(testArr);
    resultText += `<br>🤖 Markov đoán: ${markov.nextGuess} → đoán trước đó: ${actualNext}`;
    predictionLog.push({
      method: 'Markov',
      guess: markov.nextGuess,
      actual: actualNext,
      correct: markov.nextGuess === actualNext
    });

    // ✅ Pattern
    const patternResult = suggestFromPattern(testArr, true);
    if (patternResult.guess === 'O' || patternResult.guess === 'U') {
      resultText += `<br>${patternResult.text}`;
      predictionLog.push({
        method: 'Pattern',
        guess: patternResult.guess,
        actual: actualNext,
        correct: patternResult.guess === actualNext
      });
    }

    // ✅ Random Forest
    const recent = arr.slice(-5);
    const goals = recent.filter(x => x === 'O').length;
    const over5 = goals;

    // Gửi API sau Markov & Pattern
    fetch("http://127.0.0.1:5000/predict", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ goals, over_last5: over5 })
    })
      .then(res => res.json())
      .then(data => {
        resultText += `<br>🌳 Random Forest đoán: ${data.prediction}`;
        predictionLog.push({
          method: 'Random Forest',
          guess: data.prediction,
          actual: actualNext,
          correct: data.prediction === actualNext
        });

        // Cập nhật kết quả
        if (isAdvanced) {
          resultText += `<br>${showPredictionStats()}`;
          resultText += `<br>${showAccuracyByMethod()}`;
        }
        document.getElementById('result').innerHTML = resultText;
      })
      .catch(err => {
        console.error("Lỗi gọi API:", err);
        resultText += `<br>⚠️ Lỗi gọi API Random Forest`;
        document.getElementById('result').innerHTML = resultText;
      });
  } else {
    resultText += `<br>❗ Không đủ dữ liệu để dự đoán Markov & Pattern (cần ≥ 4 kết quả)`;
    document.getElementById('result').innerHTML = resultText;
  }

  if (isAdvanced) {
    const reverseO = analyzeReverseStats(arr, 'O', 6);
    const reverseU = analyzeReverseStats(arr, 'U', 6);
    if (reverseO) {
      resultText += `<br>📉 Sau O ≥ 6: Đảo ${reverseO.reversed}/${reverseO.total} (${reverseO.rate}%)`;
    }
    if (reverseU) {
      resultText += `<br>📉 Sau U ≥ 6: Đảo ${reverseU.reversed}/${reverseU.total} (${reverseU.rate}%)`;
    }
  }

  // Tạm thời gán kết quả trước khi fetch
  document.getElementById('result').innerHTML = resultText;

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
    const resultText = `📊 Pattern '${last3}' → đoán: ${guess} (độ tin cậy: ${confidence}%)`;
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
  return `🧠 Hiệu quả dự đoán: ${correct}/${total} đúng (${winRate}%)`;
}

function showAccuracyByMethod() {
  const methods = {};
  predictionLog.forEach(p => {
    if (!methods[p.method]) methods[p.method] = { total: 0, correct: 0 };
    methods[p.method].total++;
    if (p.correct) methods[p.method].correct++;
  });

  let result = '📈 Hiệu quả từng thuật toán:<br>';
  for (const method in methods) {
    const data = methods[method];
    const rate = ((data.correct / data.total) * 100).toFixed(2);
    result += `• ${method}: ${data.correct}/${data.total} đúng (${rate}%)<br>`;
  }
  return result;
}
