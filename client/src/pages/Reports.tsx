import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  FileText, 
  Download, 
  Share, 
  Filter,
  Calendar,
  TrendingUp,
  BarChart3,
  PieChart,
  Search
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { cn } from "@/lib/utils";
import { useEffect } from "react";

interface ReportData {
  id: string;
  inspectionId: string;
  make: string;
  model: string;
  year: number;
  chassisNo: string;
  finalScore: number;
  estimatedValue: number;
  reportType: "individual" | "summary";
  generatedAt: string;
  downloadCount: number;
}

export default function Reports() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [reportFilter, setReportFilter] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<string>("all");

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

  // Mock data for now - would be replaced with actual API calls
  const mockReports: ReportData[] = [];

  const { data: inspections, isLoading } = useQuery({
    queryKey: ["/api/inspections", { status: "completed" }],
    enabled: isAuthenticated,
  });

  if (authLoading || !isAuthenticated) {
    return (
      <div className="flex items-center justify-center h-64" data-testid="reports-loading">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  const completedInspections = inspections?.filter((i: any) => i.status === "completed") || [];

  const handleGenerateReport = async (inspectionId: string, type: "individual" | "summary") => {
    try {
      toast({
        title: "Generating Report",
        description: "Your report is being prepared...",
      });
      
      // API call would go here
      // await apiRequest("POST", `/api/inspections/${inspectionId}/report`, { type });
      
      toast({
        title: "Report Generated",
        description: "Your report has been successfully created.",
      });
    } catch (error) {
      if (isUnauthorizedError(error as Error)) {
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
      
      toast({
        title: "Error",
        description: "Failed to generate report. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDownloadReport = (reportId: string) => {
    // API call to download report
    toast({
      title: "Downloading Report",
      description: "Your report download will begin shortly.",
    });
  };

  const handleShareReport = (reportId: string) => {
    // API call to get shareable link
    toast({
      title: "Report Link Copied",
      description: "Shareable link has been copied to clipboard.",
    });
  };

  const getScoreColor = (score: number) => {
    if (score >= 8) return "text-green-600";
    if (score >= 5) return "text-yellow-600";
    return "text-red-600";
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
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="space-y-6" data-testid="reports-page">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Reports</h1>
          <p className="text-muted-foreground mt-2">
            Generate and manage inspection reports
          </p>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4" data-testid="report-stats">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Reports</p>
                <p className="text-2xl font-bold text-foreground" data-testid="stat-total-reports">
                  {mockReports.length}
                </p>
              </div>
              <FileText className="w-8 h-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">This Month</p>
                <p className="text-2xl font-bold text-foreground" data-testid="stat-month-reports">
                  0
                </p>
              </div>
              <Calendar className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Downloads</p>
                <p className="text-2xl font-bold text-foreground" data-testid="stat-downloads">
                  {mockReports.reduce((sum, r) => sum + r.downloadCount, 0)}
                </p>
              </div>
              <Download className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg Score</p>
                <p className="text-2xl font-bold text-green-600" data-testid="stat-avg-score">
                  {completedInspections.length > 0 
                    ? (completedInspections.reduce((sum: number, i: any) => sum + (i.finalScore || 0), 0) / completedInspections.length).toFixed(1)
                    : "0.0"
                  }
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Report Generation */}
      <Card data-testid="card-generate-reports">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Generate New Reports
          </CardTitle>
          <CardDescription>
            Create professional PDF reports from completed inspections
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              Loading completed inspections...
            </div>
          ) : completedInspections.length === 0 ? (
            <div className="text-center py-8" data-testid="no-completed-inspections">
              <FileText className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-lg font-medium text-foreground mb-2">
                No completed inspections
              </h3>
              <p className="text-muted-foreground mb-4">
                Complete some inspections first to generate reports
              </p>
            </div>
          ) : (
            <div className="space-y-4" data-testid="inspection-reports-list">
              {completedInspections.slice(0, 10).map((inspection: any) => (
                <div
                  key={inspection.id}
                  className="flex items-center justify-between p-4 bg-accent/30 dark:bg-accent/20 rounded-lg"
                  data-testid={`report-inspection-${inspection.id}`}
                >
                  <div>
                    <h4 className="font-medium text-foreground" data-testid="report-inspection-title">
                      {inspection.make} {inspection.model} ({inspection.year})
                    </h4>
                    <p className="text-sm text-muted-foreground" data-testid="report-inspection-details">
                      Chassis: {inspection.chassisNo} • Score: 
                      <span className={cn("font-medium ml-1", getScoreColor(inspection.finalScore || 0))}>
                        {inspection.finalScore?.toFixed(1) || "N/A"}
                      </span>
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Value: {formatCurrency(inspection.estimatedValue || 0)}
                    </p>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleGenerateReport(inspection.id, "individual")}
                      data-testid="button-generate-individual"
                    >
                      <FileText className="w-4 h-4 mr-2" />
                      Individual Report
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Report Templates */}
      <Card data-testid="card-report-templates">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Report Templates
          </CardTitle>
          <CardDescription>
            Choose from professional report templates
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="border border-border rounded-lg p-6 hover:border-primary transition-colors cursor-pointer" data-testid="template-detailed">
              <div className="flex items-center gap-3 mb-4">
                <FileText className="w-8 h-8 text-primary" />
                <div>
                  <h3 className="font-semibold text-foreground">Detailed Report</h3>
                  <p className="text-sm text-muted-foreground">Complete inspection analysis</p>
                </div>
              </div>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Comprehensive score breakdown</li>
                <li>• Market valuation analysis</li>
                <li>• Component-wise inspection</li>
                <li>• Professional certificate</li>
              </ul>
            </div>

            <div className="border border-border rounded-lg p-6 hover:border-primary transition-colors cursor-pointer" data-testid="template-summary">
              <div className="flex items-center gap-3 mb-4">
                <PieChart className="w-8 h-8 text-green-600" />
                <div>
                  <h3 className="font-semibold text-foreground">Summary Report</h3>
                  <p className="text-sm text-muted-foreground">Quick overview format</p>
                </div>
              </div>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Final score and rating</li>
                <li>• Key findings summary</li>
                <li>• Market value estimate</li>
                <li>• Compact format</li>
              </ul>
            </div>

            <div className="border border-border rounded-lg p-6 hover:border-primary transition-colors cursor-pointer" data-testid="template-comparative">
              <div className="flex items-center gap-3 mb-4">
                <BarChart3 className="w-8 h-8 text-blue-600" />
                <div>
                  <h3 className="font-semibold text-foreground">Comparative Report</h3>
                  <p className="text-sm text-muted-foreground">Multiple bikes comparison</p>
                </div>
              </div>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Side-by-side comparison</li>
                <li>• Market positioning</li>
                <li>• Score benchmarking</li>
                <li>• Investment analysis</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Reports */}
      <Card data-testid="card-recent-reports">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Recent Reports
            </span>
            <Badge variant="secondary" data-testid="reports-count">
              {mockReports.length} reports
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {mockReports.length === 0 ? (
            <div className="text-center py-8" data-testid="no-reports">
              <FileText className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-lg font-medium text-foreground mb-2">
                No reports generated yet
              </h3>
              <p className="text-muted-foreground">
                Generate your first report from a completed inspection
              </p>
            </div>
          ) : (
            <div className="space-y-4" data-testid="reports-list">
              {mockReports.map((report) => (
                <div
                  key={report.id}
                  className="flex items-center justify-between p-4 bg-accent/30 dark:bg-accent/20 rounded-lg"
                  data-testid={`report-${report.id}`}
                >
                  <div>
                    <h4 className="font-medium text-foreground">
                      {report.make} {report.model} Report
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      Generated on {formatDate(report.generatedAt)} • Downloaded {report.downloadCount} times
                    </p>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownloadReport(report.id)}
                      data-testid="button-download"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Download
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleShareReport(report.id)}
                      data-testid="button-share"
                    >
                      <Share className="w-4 h-4 mr-2" />
                      Share
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
