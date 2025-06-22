let betData = [];
let betChartInstance = null;

function addBet(event) {
  event.preventDefault();

  const rawInput = document.getElementById("wl").value.trim().toUpperCase();
  const amountInput = document.getElementById("amount").value.trim();
  const amount = parseFloat(amountInput);

  let wl = null;
  if (rawInput === "1") wl = "W";
  else if (rawInput === "2") wl = "L";
  else if (rawInput === "W" || rawInput === "L") wl = rawInput;
  else {
    alert("❗ Chỉ được nhập W, L, 1 (W) hoặc 2 (L)");
    return;
  }

  if (!amountInput || isNaN(amount)) {
    alert("❗ Tiền lời/lỗ không hợp lệ");
    return;
  }

  betData.push({ wl, amount });
  updateBetTable();

  document.getElementById("wl").value = "";
  document.getElementById("amount").value = "";
}

function updateBetTable() {
  const tbody = document.querySelector("#betTable tbody");
  tbody.innerHTML = "";

  let total = 0;
  let winCount = 0;
  let lossCount = 0;

  betData.forEach((item, index) => {
    const actualAmount = item.wl === 'W' ? item.amount : -Math.abs(item.amount);
    total += actualAmount;
    if (item.wl === 'W') winCount++;
    if (item.wl === 'L') lossCount++;

    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${index + 1}</td>
      <td>${item.wl}</td>
      <td>${actualAmount}</td>
    `;
    tbody.appendChild(row);
  });

  const totalBets = winCount + lossCount;
  const winRate = totalBets > 0 ? ((winCount / totalBets) * 100).toFixed(1) : 0;
  const lossRate = totalBets > 0 ? ((lossCount / totalBets) * 100).toFixed(1) : 0;

  document.getElementById("summaryStats").textContent = `💰 Tổng lời/lỗ: ${total}`;
  document.getElementById("winLossRatio").textContent = `📊 Tỷ lệ: W ${winRate}% - L ${lossRate}%`;

  document.getElementById("clearAllBtn").style.display = betData.length > 0 ? "inline-block" : "none";

  drawBetChart();
}

function clearAllBets() {
  betData = [];
  updateBetTable();
}

function drawBetChart() {
  const labels = betData.map((_, i) => `Lần ${i + 1}`);
  const data = betData.map(item => item.wl === 'W' ? item.amount : -Math.abs(item.amount));

  const ctx = document.getElementById("betChart").getContext("2d");
  if (betChartInstance) betChartInstance.destroy();

  betChartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [{
        label: 'Lời/Lỗ mỗi lần cược',
        data: data,
        fill: false,
        borderColor: data.map(v => v >= 0 ? '#2ecc71' : '#e74c3c'),
        backgroundColor: '#3498db',
        tension: 0.3
      }]
    },
    options: {
      scales: {
        y: {
          beginAtZero: false,
          title: {
            display: true,
            text: 'Tiền lời/lỗ'
          }
        }
      }
    }
  });
}

function toggleBetChart() {
  const checked = document.getElementById("toggleBetChart").checked;
  document.getElementById("betChart").style.display = checked ? "block" : "none";
}
