import React from "react";
import { Line } from "react-chartjs-2";
import { Chart, LineElement, PointElement, CategoryScale, LinearScale, Legend, Tooltip } from "chart.js";
Chart.register(LineElement, PointElement, CategoryScale, LinearScale, Legend, Tooltip);

export default function PriceChart({ data = [] }){
  const labels = data.map((_, i) => i+1);
  const actual = data.map(d => d.actual);
  const predicted = data.map(d => d.predicted);
  const chartData = {
    labels,
    datasets: [
      { label: "Actual", data: actual, fill: false },
      { label: "Predicted", data: predicted, fill: false }
    ]
  };
  return <div style={{maxWidth:800}}><Line data={chartData} /></div>;
}
