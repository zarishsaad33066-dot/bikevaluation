import { useEffect } from "react";
import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  FileText, 
  Share, 
  Edit,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Download,
  ArrowLeft
} from "lucide-react";
import { Link } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import ScoreGauge from "@/components/ScoreGauge";
import { cn } from "@/lib/utils";

interface InspectionResult {
  id: string;
  make: string;
  model: string;
  year: number;
  chassisNo: string;
  engineNo: string;
  color?: string;
  mileage?: number;
  finalScore: number;
  engineScore: number;
  frameScore: number;
  suspensionScore: number;
  brakesScore: number;
  tiresScore: number;
  electricalsScore: number;
  bodyScore: number;
  documentsScore: number;
  marketBaseline: number;
  estimatedValue: number;
  status: string;
  reportGenerated: boolean;
  createdAt: string;
  inspector: {
    id: string;
    firstName?: string;
    lastName?: string;
    email?: string;
  };
}

export default function InspectionResults() {
  const params = useParams<{ id: string }>();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { toast } = useToast();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, authLoading, toast]);

  const { data: inspection, isLoading, error } = useQuery<InspectionResult>({
    queryKey: ["/api/inspections", params.id],
    enabled: isAuthenticated && !!params.id,
  });

  if (authLoading || !isAuthenticated) {
    return (
      <div className="flex items-center justify-center h-64" data-testid="results-loading">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (error && isUnauthorizedError(error as Error)) {
    toast({
      title: "Unauthorized",
      description: "You are logged out. Logging in again...",
      variant: "destructive",
    });
    setTimeout(() => {
      window.location.href = "/api/login";
    }, 500);
    return null;
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64" data-testid="inspection-loading">
        <div className="text-muted-foreground">Loading inspection results...</div>
      </div>
    );
  }

  if (!inspection) {
    return (
      <div className="text-center py-12" data-testid="inspection-not-found">
        <AlertTriangle className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
        <h3 className="text-lg font-medium text-foreground mb-2">
          Inspection not found
        </h3>
        <p className="text-muted-foreground mb-4">
          The inspection you're looking for doesn't exist or you don't have access to it.
        </p>
        <Link href="/inspection-history">
          <Button>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to History
          </Button>
        </Link>
      </div>
    );
  }

  const getScoreColor = (score: number) => {
    if (score >= 8) return "text-green-600";
    if (score >= 5) return "text-yellow-600";
    return "text-red-600";
  };

  const getConditionText = (score: number) => {
    if (score >= 8) return "Excellent Condition";
    if (score >= 5) return "Fair Condition";
    return "Poor Condition";
  };

  const getConditionColor = (score: number) => {
    if (score >= 8) return "text-green-600 bg-green-50 dark:bg-green-900/20";
    if (score >= 5) return "text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20";
    return "text-red-600 bg-red-50 dark:bg-red-900/20";
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-PK", {
      style: "currency",
      currency: "PKR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-PK", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const categoryScores = [
    { name: "Engine", score: inspection.engineScore ?? 0, weight: 40 },
    { name: "Frame", score: inspection.frameScore ?? 0, weight: 15 },
    { name: "Suspension", score: inspection.suspensionScore ?? 0, weight: 10 },
    { name: "Brakes", score: inspection.brakesScore ?? 0, weight: 10 },
    { name: "Tires", score: inspection.tiresScore ?? 0, weight: 10 },
    { name: "Electricals", score: inspection.electricalsScore ?? 0, weight: 5 },
    { name: "Body", score: inspection.bodyScore ?? 0, weight: 8 },
    { name: "Documents", score: inspection.documentsScore ?? 0, weight: 2 },
  ];

  const conditionAdjustment = inspection.finalScore ? (((inspection.finalScore / 10) - 1) * 100) : 0;

  const majorIssues = inspection.status === 'completed' 
    ? categoryScores
        .filter(cat => cat.score < 7)
        .map(cat => ({
          category: cat.name,
          score: cat.score,
          deduction: 10 - cat.score,
        }))
    : [];

  return (
    <div className="max-w-4xl mx-auto space-y-8" data-testid="inspection-results-page">
      {/* Back Navigation */}
      <div className="flex items-center gap-4">
        <Link href="/inspection-history">
          <Button variant="outline" size="sm" data-testid="button-back">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to History
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Inspection Results</h1>
          <p className="text-muted-foreground">
            {inspection.make} {inspection.model} ({inspection.year})
          </p>
        </div>
      </div>

      {/* Score Summary */}
      <Card className="text-center" data-testid="card-score-summary">
        <CardContent className="p-8">
          <div className="mb-6">
            <ScoreGauge score={inspection.finalScore ?? 0} size="lg" data-testid="final-score-gauge" />
          </div>
          
          <h2 className="text-2xl font-bold text-foreground mb-2">Inspection Complete</h2>
          <p className="text-lg text-muted-foreground mb-4" data-testid="bike-info">
            {inspection.make} {inspection.model} - {inspection.year}
          </p>
          <p className="text-sm text-muted-foreground mb-4">
            Chassis: {inspection.chassisNo} • Completed: {formatDate(inspection.createdAt)}
          </p>
          
          <div className={cn(
            "inline-flex items-center gap-2 px-4 py-2 rounded-full font-medium",
            inspection.status === 'draft' 
              ? "text-blue-600 bg-blue-50 dark:bg-blue-900/20"
              : getConditionColor(inspection.finalScore ?? 0)
          )} data-testid="condition-badge">
            {inspection.status === 'draft' ? (
              <AlertTriangle className="w-4 h-4" />
            ) : (inspection.finalScore ?? 0) >= 8 ? (
              <CheckCircle className="w-4 h-4" />
            ) : (
              <AlertTriangle className="w-4 h-4" />
            )}
            <span>
              {inspection.status === 'draft' 
                ? 'Draft - Incomplete Inspection' 
                : getConditionText(inspection.finalScore ?? 0)
              }
            </span>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Category Breakdown */}
        <Card data-testid="card-category-breakdown">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Category Breakdown
            </CardTitle>
            <CardDescription>
              Detailed scoring by inspection category
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4" data-testid="category-scores">
              {categoryScores.map((category) => (
                <div key={category.name} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-foreground">
                      {category.name} ({category.weight}%)
                    </span>
                    <span 
                      className={cn(
                        "text-sm font-medium", 
                        inspection.status === 'draft' 
                          ? "text-muted-foreground" 
                          : getScoreColor(category.score)
                      )}
                      data-testid={`score-${category.name.toLowerCase()}`}
                    >
                      {inspection.status === 'draft' ? 'N/A' : category.score.toFixed(1)}
                    </span>
                  </div>
                  <Progress 
                    value={inspection.status === 'draft' ? 0 : (category.score / 10) * 100} 
                    className="h-2"
                    data-testid={`progress-${category.name.toLowerCase()}`}
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Market Valuation */}
        <Card data-testid="card-market-valuation">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Market Valuation
            </CardTitle>
            <CardDescription>
              Estimated market value based on condition
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4" data-testid="valuation-details">
              {inspection.status === 'draft' ? (
                <div className="text-center py-8">
                  <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <h3 className="text-lg font-medium text-foreground mb-2">
                    Valuation Pending
                  </h3>
                  <p className="text-muted-foreground">
                    Complete the inspection to see market valuation
                  </p>
                </div>
              ) : (
                <>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Market Baseline</span>
                    <span className="font-medium text-foreground" data-testid="market-baseline">
                      {formatCurrency(inspection.marketBaseline ?? 0)}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Condition Adjustment</span>
                    <span 
                      className={cn(
                        "font-medium",
                        conditionAdjustment >= 0 ? "text-green-600" : "text-red-600"
                      )}
                      data-testid="condition-adjustment"
                    >
                      {conditionAdjustment > 0 ? "+" : ""}{conditionAdjustment.toFixed(1)}%
                    </span>
                  </div>
                  
                  <div className="border-t border-border pt-4">
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-semibold text-foreground">Estimated Value</span>
                      <span 
                        className="text-xl font-bold text-primary" 
                        data-testid="estimated-value"
                      >
                        {formatCurrency(inspection.estimatedValue ?? 0)}
                      </span>
                    </div>
                  </div>
                </>
              )}
              
              <div className="mt-4 p-3 bg-muted/50 rounded-lg">
                <p className="text-xs text-muted-foreground">
                  * Valuation based on current market conditions and inspection findings. 
                  Actual selling price may vary based on demand and location.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Major Issues */}
      {majorIssues.length > 0 && (
        <Card data-testid="card-major-issues">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-destructive" />
              Issues Identified
            </CardTitle>
            <CardDescription>
              Categories scoring below 7.0 points
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4" data-testid="issues-list">
              {majorIssues.map((issue) => (
                <div
                  key={issue.category}
                  className="flex items-center gap-3 p-3 bg-destructive/10 border border-destructive/20 rounded-lg"
                  data-testid={`issue-${issue.category.toLowerCase()}`}
                >
                  <AlertTriangle className="w-5 h-5 text-destructive flex-shrink-0" />
                  <div className="flex-1">
                    <p className="font-medium text-foreground">
                      {issue.category} Issues
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Score: {issue.score.toFixed(1)} (-{issue.deduction.toFixed(1)} points)
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Inspection Details */}
      <Card data-testid="card-inspection-details">
        <CardHeader>
          <CardTitle>Inspection Details</CardTitle>
          <CardDescription>
            Additional information about this motorcycle
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" data-testid="bike-details">
            <div>
              <p className="text-sm text-muted-foreground">Engine Number</p>
              <p className="font-medium text-foreground">{inspection.engineNo}</p>
            </div>
            
            {inspection.color && (
              <div>
                <p className="text-sm text-muted-foreground">Color</p>
                <p className="font-medium text-foreground">{inspection.color}</p>
              </div>
            )}
            
            {inspection.mileage && (
              <div>
                <p className="text-sm text-muted-foreground">Mileage</p>
                <p className="font-medium text-foreground">
                  {inspection.mileage.toLocaleString()} KM
                </p>
              </div>
            )}
            
            <div>
              <p className="text-sm text-muted-foreground">Inspector</p>
              <p className="font-medium text-foreground">
                {inspection.inspector.firstName || inspection.inspector.email}
              </p>
            </div>
            
            <div>
              <p className="text-sm text-muted-foreground">Status</p>
              <Badge variant="default" data-testid="inspection-status">
                {inspection.status}
              </Badge>
            </div>
            
            <div>
              <p className="text-sm text-muted-foreground">Report Status</p>
              <Badge 
                variant={inspection.reportGenerated ? "default" : "secondary"}
                data-testid="report-status"
              >
                {inspection.reportGenerated ? "Generated" : "Pending"}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-4 justify-end" data-testid="action-buttons">
        <Link href={`/new-inspection`}>
          <Button variant="outline" className="w-full sm:w-auto" data-testid="button-edit">
            <Edit className="w-4 h-4 mr-2" />
            New Inspection
          </Button>
        </Link>
        
        <Button 
          variant="outline" 
          className="w-full sm:w-auto"
          data-testid="button-download-report"
        >
          <Download className="w-4 h-4 mr-2" />
          Download Report
        </Button>
        
        <Button 
          className="w-full sm:w-auto"
          data-testid="button-share"
        >
          <Share className="w-4 h-4 mr-2" />
          Share Report
        </Button>
      </div>
    </div>
  );
}
