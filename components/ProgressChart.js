import { useEffect, useRef } from 'react';
import Chart from 'chart.js/auto';

export default function ProgressChart({ reviews }) {
  const chartRef = useRef(null);
  const chartInstance = useRef(null);

  useEffect(() => {
    if (reviews.length === 0) return;
    
    const groupedByDate = reviews.reduce((acc, review) => {
      const date = new Date(review.review_date).toLocaleDateString();
      if (!acc[date]) {
        acc[date] = {
          date,
          count: 0,
          avgQuality: 0,
        };
      }
      acc[date].count += 1;
      acc[date].avgQuality += review.quality;
      return acc;
    }, {});
    
    const chartData = Object.values(groupedByDate)
      .map(item => ({
        ...item,
        avgQuality: item.avgQuality / item.count
      }))
      .sort((a, b) => new Date(a.date) - new Date(b.date));
    
    const labels = chartData.map(item => item.date);
    const reviewCounts = chartData.map(item => item.count);
    const avgQualities = chartData.map(item => item.avgQuality);
    
    if (chartInstance.current) {
      chartInstance.current.destroy();
    }
    
    const ctx = chartRef.current.getContext('2d');
    chartInstance.current = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [
          {
            label: '复习数量',
            data: reviewCounts,
            borderColor: 'rgb(99, 102, 241)',
            backgroundColor: 'rgba(99, 102, 241, 0.1)',
            tension: 0.3,
            fill: true,
            yAxisID: 'y',
          },
          {
            label: '平均质量',
            data: avgQualities,
            borderColor: 'rgb(16, 185, 129)',
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
            tension: 0.3,
            fill: false,
            yAxisID: 'y1',
          }
        ]
      },
      options: {
        responsive: true,
        interaction: {
          mode: 'index',
          intersect: false,
        },
        scales: {
          y: {
            type: 'linear',
            display: true,
            position: 'left',
            title: {
              display: true,
              text: '复习数量'
            }
          },
          y1: {
            type: 'linear',
            display: true,
            position: 'right',
            min: 0,
            max: 5,
            title: {
              display: true,
              text: '平均质量 (0-5)'
            },
            grid: {
              drawOnChartArea: false,
            },
          }
        }
      }
    });
    
    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [reviews]);

  return (
    <div>
      <canvas ref={chartRef} height="300"></canvas>
    </div>
  );
}
