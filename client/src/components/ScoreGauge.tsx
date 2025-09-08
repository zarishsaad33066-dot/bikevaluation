import { cn } from "@/lib/utils";

interface ScoreGaugeProps {
  score: number;
  size?: "sm" | "md" | "lg";
  className?: string;
  showLabel?: boolean;
}

export default function ScoreGauge({ 
  score, 
  size = "md", 
  className,
  showLabel = true 
}: ScoreGaugeProps) {
  const normalizedScore = Math.max(0, Math.min(10, score));
  const percentage = (normalizedScore / 10) * 100;
  const circumference = 314; // 2 * π * 50
  const strokeDashoffset = circumference - (percentage / 100) * circumference;
  
  const getScoreColor = (score: number) => {
    if (score >= 8) return "var(--success)";
    if (score >= 5) return "var(--warning)";
    return "var(--destructive)";
  };

  const getScoreClass = (score: number) => {
    if (score >= 8) return "score-excellent";
    if (score >= 5) return "score-fair";
    return "score-poor";
  };

  const sizes = {
    sm: { width: 80, height: 80, strokeWidth: 6, fontSize: "text-lg" },
    md: { width: 120, height: 120, strokeWidth: 8, fontSize: "text-2xl" },
    lg: { width: 160, height: 160, strokeWidth: 10, fontSize: "text-4xl" },
  };

  const { width, height, strokeWidth, fontSize } = sizes[size];

  return (
    <div className={cn("relative inline-flex items-center justify-center", className)} data-testid="score-gauge">
      <svg 
        width={width} 
        height={height} 
        viewBox="0 0 120 120" 
        className="transform -rotate-90"
        data-testid="score-gauge-svg"
      >
        {/* Background circle */}
        <circle
          cx="60"
          cy="60"
          r="50"
          stroke="var(--muted)"
          strokeWidth={strokeWidth}
          fill="none"
          data-testid="score-gauge-background"
        />
        {/* Progress circle */}
        <circle
          cx="60"
          cy="60"
          r="50"
          stroke={getScoreColor(normalizedScore)}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="score-gauge-circle transition-all duration-1000 ease-out"
          data-testid="score-gauge-progress"
        />
      </svg>
      
      {/* Score text overlay */}
      <div className="absolute inset-0 flex items-center justify-center" data-testid="score-gauge-overlay">
        <div className="text-center">
          <span 
            className={cn(fontSize, "font-bold", getScoreClass(normalizedScore))}
            style={{ color: getScoreColor(normalizedScore) }}
            data-testid="score-value"
          >
            {normalizedScore.toFixed(1)}
          </span>
          {showLabel && (
            <p className="text-sm text-muted-foreground" data-testid="score-label">/10</p>
          )}
        </div>
      </div>
    </div>
  );
}
