let chartInstance = null;

function analyze() {
  const input = document.getElementById('history').value;
  const arr = input.trim().split(/\s+/).map(x => x.toUpperCase());

  const counts = { O: 0, U: 0 };
  arr.forEach(item => {
    if (item === 'O' || item === 'U') counts[item]++;
  });

  const total = arr.length;
  const oRate = ((counts['O'] / total) * 100).toFixed(2);
  const uRate = ((counts['U'] / total) * 100).toFixed(2);

  const suggest = oRate > uRate ? '🔮 Gợi ý: Đánh O' : '🔮 Gợi ý: Đánh U';

  let resultText = `🧮 O: ${oRate}%<br>🧮 U: ${uRate}%<br>${suggest}`;

  // 🔁 Chuỗi liên tiếp
  const streaks = countStreaks(arr);
  document.getElementById('sequenceStats').innerHTML = `
    🔁 Chuỗi O: ${streaks.O.join(', ')}<br>
    🔁 Chuỗi U: ${streaks.U.join(', ')}
  `;

  // 🤖 Markov
  const markov = getMarkovPrediction(arr);
  resultText += `<br>🤖 Markov đoán tiếp theo: ${markov.nextGuess} (sau ${arr[arr.length - 1]})`;

  // 🎯 Hiển thị kết quả
  document.getElementById('result').innerHTML = resultText;

  // 📊 Biểu đồ (kiểm tra trạng thái bật/tắt)
  const showChart = document.getElementById("toggleChart").checked;
  const canvas = document.getElementById("chart");

  if (showChart) {
    canvas.style.display = "block";
    drawChart(counts['O'], counts['U']);
  } else {
    canvas.style.display = "none";
  }
}

// Hàm đếm chuỗi
function countStreaks(arr) {
  let result = { O: [], U: [] };
  let current = arr[0];
  let count = 1;

  for (let i = 1; i < arr.length; i++) {
    if (arr[i] === current) {
      count++;
    } else {
      result[current].push(count);
      current = arr[i];
      count = 1;
    }
  }
  result[current].push(count);
  return result;
}

// Hàm dự đoán Markov
function getMarkovPrediction(arr) {
  let transitions = { O: { O: 0, U: 0 }, U: { O: 0, U: 0 } };

  for (let i = 0; i < arr.length - 1; i++) {
    const current = arr[i];
    const next = arr[i + 1];
    if (current && next && transitions[current]) {
      transitions[current][next]++;
    }
  }

  const last = arr[arr.length - 1];
  const nextGuess = transitions[last].O > transitions[last].U ? 'O' : 'U';

  return {
    nextGuess,
    stats: transitions
  };
}

// Biểu đồ thống kê
function drawChart(oCount, uCount) {
  const ctx = document.getElementById("chart").getContext("2d");

  // Nếu đã có biểu đồ trước đó thì huỷ
  if (chartInstance) {
    chartInstance.destroy();
  }

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
