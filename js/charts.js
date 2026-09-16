// Simple price chart for token detail
let chartInstance = null;

function renderTokenChart(canvasId, changePercent = 0) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;

  if (chartInstance) {
    chartInstance.destroy();
    chartInstance = null;
  }

  // Generate fake but realistic-looking sparkline data
  const points = 40;
  const data = [];
  let val = 100;
  const trend = changePercent >= 0 ? 0.4 : -0.4;
  for (let i = 0; i < points; i++) {
    val += (Math.random() - 0.45 + trend * 0.1) * 2.5;
    data.push(Math.max(70, val));
  }

  const isUp = changePercent >= 0;
  const color = isUp ? '#22c55e' : '#ef4444';
  const bgColor = isUp ? 'rgba(34, 197, 94, 0.12)' : 'rgba(239, 68, 68, 0.12)';

  chartInstance = new Chart(canvas, {
    type: 'line',
    data: {
      labels: Array(points).fill(''),
      datasets: [{
        data,
        borderColor: color,
        backgroundColor: bgColor,
        borderWidth: 2,
        fill: true,
        tension: 0.35,
        pointRadius: 0,
        pointHoverRadius: 0
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: { enabled: false }
      },
      scales: {
        x: { display: false },
        y: { display: false }
      },
      animation: { duration: 600 }
    }
  });
}

window.Charts = { renderTokenChart };
