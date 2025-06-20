let chartInstance = null;
let betChart = null;
let betData = [];

// 📊 Phân tích lịch sử O/U
function analyze() {
  const input = document.getElementById('history').value.trim();
  const arr = input.split(/\s+/).map(x => x.toUpperCase());
  const counts = { O: 0, U: 0 };

  arr.forEach(x => {
    if (x === 'O' || x === 'U') counts[x]++;
  });

  const total = arr.length || 1;
  const oRate = ((counts.O / total) * 100).toFixed(2);
  const uRate = ((counts.U / total) * 100).toFixed(2);
  const suggest = oRate > uRate ? '🔮 Gợi ý: Đánh O' : '🔮 Gợi ý: Đánh U';

  const streaks = countStreaks(arr);
  const lastOStreak = streaks.O.at(-1) || 0;
  const lastUStreak = streaks.U.at(-1) || 0;

  let resultText = `🧮 O: ${oRate}%<br>🧮 U: ${uRate}%<br>${suggest}`;
  resultText += `<br>🔁 Chuỗi O: ${streaks.O.join(', ')}<br>🔁 Chuỗi U: ${streaks.U.join(', ')}`;

if (lastOStreak >= 6) {
  resultText += `<br>🚨 Cảnh báo: Đã có chuỗi ${lastOStreak} O liên tiếp – xác suất đảo chiều cao!`;
} else if (lastOStreak >= 4) {
  resultText += `<br>⚠️ ${lastOStreak} O liên tiếp – có thể đảo sang U!`;
}

if (lastUStreak >= 6) {
  resultText += `<br>🚨 Cảnh báo: Đã có chuỗi ${lastUStreak} U liên tiếp – xác suất đảo chiều cao!`;
} else if (lastUStreak >= 4) {
  resultText += `<br>⚠️ ${lastUStreak} U liên tiếp – có thể đảo sang O!`;
}

  const markov = getMarkovPrediction(arr);
  resultText += `<br>🤖 Markov đoán tiếp theo: ${markov.nextGuess} (sau ${arr.at(-1)})`;

  document.getElementById('result').innerHTML = resultText;

  const showChart = document.getElementById("toggleChart").checked;
  document.getElementById("chart").style.display = showChart ? "block" : "none";
  if (showChart) drawChart(counts.O, counts.U);
}

// 🔁 Đếm chuỗi liên tiếp
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

// 📈 Vẽ biểu đồ O/U
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

// 🤖 Dự đoán Markov
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

// ➕ Thêm dữ liệu cược
function addBet(event) {
  event.preventDefault();

  const resultRaw = document.getElementById('wl').value.trim().toLowerCase();
  const amountStr = document.getElementById('amount').value.trim();

  if (!resultRaw || !amountStr) {
    alert("Vui lòng nhập đầy đủ kết quả và tiền lời/lỗ");
    return;
  }

  const amount = parseFloat(amountStr);
  if (isNaN(amount)) {
    alert("Tiền lời/lỗ phải là số hợp lệ");
    return;
  }

  const winKeywords = ['w', 'win', 't', 'thắng', '1', '✓'];
  const loseKeywords = ['l', 'lose', 'b', 'thua', '2', 'x', '✗'];

  let result = '';
  if (winKeywords.includes(resultRaw)) {
    result = 'w';
  } else if (loseKeywords.includes(resultRaw)) {
    result = 'l';
  } else {
    alert("Kết quả chỉ được nhập dạng thắng/thua hợp lệ (vd: w, l, win, thua)");
    return;
  }

  const adjustedAmount = result === 'l' ? -Math.abs(amount) : Math.abs(amount);
  const matchId = betData.length + 1;

  betData.push({ matchId, result, amount: adjustedAmount });
  renderTable();
  updateSummary();
  document.getElementById('betForm').reset();
}

// 🧾 Vẽ bảng cược
function renderTable() {
  const tbody = document.querySelector('#betTable tbody');
  tbody.innerHTML = '';

  betData.forEach((bet) => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${bet.matchId}</td>
      <td>${bet.result}</td>
      <td>${bet.amount > 0 ? '+' + bet.amount : bet.amount}</td>
    `;
    tbody.appendChild(row);
  });

  const clearBtn = document.getElementById('clearAllBtn');
  clearBtn.style.display = betData.length > 0 ? 'inline-block' : 'none';
}

// 🧹 Xóa toàn bộ dữ liệu cược
function clearAllBets() {
  betData = [];
  renderTable();
  updateSummary();
  document.getElementById('betForm').reset();
  document.getElementById('clearAllBtn').style.display = 'none';
}


// 📊 Tổng hợp & vẽ biểu đồ cược
function updateSummary() {
  const total = betData.length;
  const win = betData.filter(b => b.result === 'w').length;
  const lose = total - win;
  const winRate = total > 0 ? ((win / total) * 100).toFixed(2) : 0;
  const totalProfit = betData.reduce((sum, b) => sum + b.amount, 0);

  document.getElementById('summaryStats').innerText =
    `Tổng trận: ${total} | Đúng: ${win} | Sai: ${lose} | Tỉ lệ đúng: ${winRate}% | Tổng lời/lỗ: ${totalProfit}`;

  updateBetChart();
}

// 📈 Vẽ biểu đồ lời/lỗ
function updateBetChart() {
  const chartCanvas = document.getElementById('betChart');
  const labels = betData.map((_, i) => `Trận ${i + 1}`);
  
  let cumulative = 0;
  const cumulativeValues = betData.map(b => {
    cumulative += b.amount;
    return cumulative;
  });

  if (betChart) betChart.destroy();

  betChart = new Chart(chartCanvas, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [{
        label: 'Lũy kế lời/lỗ',
        data: cumulativeValues,
        borderColor: 'blue',
        backgroundColor: 'rgba(0,0,255,0.1)',
        fill: true,
        tension: 0.3
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: true }
      },
      scales: {
        y: {
          beginAtZero: true
        }
      }
    }
  });
}


// 🔘 Toggle biểu đồ
function toggleBetChart() {
  const chart = document.getElementById('betChart');
  chart.style.display = chart.style.display === 'none' ? 'block' : 'none';
}

// 🔘 Toggle form cược
function toggleBetSection() {
  const checked = document.getElementById('toggleBetSection').checked;
  document.getElementById('betSection').style.display = checked ? 'block' : 'none';
}

// Thêm hàng phân tích ngược 
function analyzeReverseChance(arr, target = 'O', minStreak = 6) {
  let streak = 0;
  let total = 0;
  let reverse = 0;

  for (let i = 0; i < arr.length - 1; i++) {
    if (arr[i] === target) {
      streak++;
    } else {
      if (streak >= minStreak) {
        total++;
        if (arr[i + 1] && arr[i + 1] !== target) {
          reverse++;
        }
      }
      streak = 0;
    }
  }

  return total > 0 ? (reverse / total * 100).toFixed(2) : null;
}


