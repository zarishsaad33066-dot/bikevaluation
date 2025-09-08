import { useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";

interface ChartData {
  excellent: number;
  fair: number;
  poor: number;
}

export default function ScoreDistributionChart() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { isAuthenticated } = useAuth();

  // Mock data for demonstration - in a real app this would come from API
  const chartData: ChartData = {
    excellent: 45, // 8-10 score range
    fair: 35,      // 5-7.9 score range  
    poor: 20,      // 0-4.9 score range
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas size
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * window.devicePixelRatio;
    canvas.height = rect.height * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

    // Clear canvas
    ctx.clearRect(0, 0, rect.width, rect.height);

    // Chart configuration
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const radius = Math.min(centerX, centerY) - 20;

    // Colors matching the design system
    const colors = {
      excellent: "#16a34a", // green-600
      fair: "#eab308",      // yellow-500
      poor: "#dc2626",      // red-600
    };

    // Calculate angles
    const total = chartData.excellent + chartData.fair + chartData.poor;
    const excellentAngle = (chartData.excellent / total) * 2 * Math.PI;
    const fairAngle = (chartData.fair / total) * 2 * Math.PI;
    const poorAngle = (chartData.poor / total) * 2 * Math.PI;

    let currentAngle = -Math.PI / 2; // Start from top

    // Draw excellent slice
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + excellentAngle);
    ctx.closePath();
    ctx.fillStyle = colors.excellent;
    ctx.fill();
    currentAngle += excellentAngle;

    // Draw fair slice
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + fairAngle);
    ctx.closePath();
    ctx.fillStyle = colors.fair;
    ctx.fill();
    currentAngle += fairAngle;

    // Draw poor slice
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + poorAngle);
    ctx.closePath();
    ctx.fillStyle = colors.poor;
    ctx.fill();

    // Draw center circle (donut effect)
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius * 0.6, 0, 2 * Math.PI);
    ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--background').trim();
    ctx.fill();

    // Add text in center
    ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--foreground').trim();
    ctx.font = "14px Inter, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("Inspections", centerX, centerY - 5);
    ctx.font = "12px Inter, sans-serif";
    ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--muted-foreground').trim();
    ctx.fillText(`${total} total`, centerX, centerY + 10);

  }, [chartData]);

  return (
    <div className="relative w-full h-full" data-testid="score-distribution-chart">
      <canvas
        ref={canvasRef}
        className="w-full h-full"
        data-testid="chart-canvas"
      />
      
      {/* Legend */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1" data-testid="legend-excellent">
            <div className="w-3 h-3 bg-green-600 rounded-full" />
            <span className="text-muted-foreground">Excellent (8-10)</span>
          </div>
          <div className="flex items-center gap-1" data-testid="legend-fair">
            <div className="w-3 h-3 bg-yellow-500 rounded-full" />
            <span className="text-muted-foreground">Fair (5-7.9)</span>
          </div>
          <div className="flex items-center gap-1" data-testid="legend-poor">
            <div className="w-3 h-3 bg-red-600 rounded-full" />
            <span className="text-muted-foreground">Poor (0-4.9)</span>
          </div>
        </div>
      </div>
    </div>
  );
}
