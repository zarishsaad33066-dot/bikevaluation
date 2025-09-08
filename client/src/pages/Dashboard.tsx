import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { 
  ClipboardCheck, 
  Calendar, 
  Star, 
  FileText, 
  Plus,
  Bike,
  TrendingUp,
  Users
} from "lucide-react";
import ScoreGauge from "@/components/ScoreGauge";
import ScoreDistributionChart from "@/components/charts/ScoreDistributionChart";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { useEffect } from "react";
import { cn } from "@/lib/utils";

interface DashboardStats {
  total: number;
  thisMonth: number;
  avgScore: number;
  reportsGenerated: number;
}

interface RecentInspection {
  id: string;
  make: string;
  model: string;
  chassisNo: string;
  finalScore: number;
  createdAt: string;
  status: string;
}

export default function Dashboard() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
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

  const { data: stats, isLoading: statsLoading } = useQuery<DashboardStats>({
    queryKey: ["/api/dashboard/stats"],
    enabled: isAuthenticated,
  });

  const { data: recentInspections, isLoading: inspectionsLoading } = useQuery<RecentInspection[]>({
    queryKey: ["/api/inspections", { limit: 5 }],
    enabled: isAuthenticated,
  });

  if (authLoading || !isAuthenticated) {
    return (
      <div className="flex items-center justify-center h-64" data-testid="dashboard-loading">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  const getScoreColor = (score: number) => {
    if (score >= 8) return "text-green-600";
    if (score >= 5) return "text-yellow-600";
    return "text-red-600";
  };

  const getScoreBadgeClass = (score: number) => {
    if (score >= 8) return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400";
    if (score >= 5) return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400";
    return "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400";
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return "Just now";
    if (diffInHours < 24) return `${diffInHours} hours ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays === 1) return "1 day ago";
    return `${diffInDays} days ago`;
  };

  return (
    <div className="space-y-8" data-testid="dashboard-page">
      {/* Welcome Section */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground" data-testid="dashboard-welcome">
            Welcome back, {user?.firstName || "User"}!
          </h1>
          <p className="text-muted-foreground mt-2" data-testid="dashboard-subtitle">
            Here's an overview of your inspection activities
          </p>
        </div>
        <Link href="/new-inspection">
          <Button className="gap-2" data-testid="button-new-inspection">
            <Plus className="w-4 h-4" />
            New Inspection
          </Button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6" data-testid="stats-cards">
        <Card data-testid="card-total-inspections">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Inspections</CardTitle>
            <ClipboardCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="stat-total">
              {statsLoading ? "..." : stats?.total || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              All time inspections completed
            </p>
          </CardContent>
        </Card>

        <Card data-testid="card-this-month">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Month</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="stat-month">
              {statsLoading ? "..." : stats?.thisMonth || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Inspections this month
            </p>
          </CardContent>
        </Card>

        <Card data-testid="card-avg-score">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Score</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={cn("text-2xl font-bold", getScoreColor(stats?.avgScore || 0))} data-testid="stat-avg-score">
              {statsLoading ? "..." : stats?.avgScore?.toFixed(1) || "0.0"}
            </div>
            <p className="text-xs text-muted-foreground">
              Average condition score
            </p>
          </CardContent>
        </Card>

        <Card data-testid="card-reports">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Reports Generated</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="stat-reports">
              {statsLoading ? "..." : stats?.reportsGenerated || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              PDF reports created
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Inspections */}
        <Card data-testid="card-recent-inspections">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bike className="w-5 h-5" />
              Recent Inspections
            </CardTitle>
            <CardDescription>
              Your latest inspection activities
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4" data-testid="recent-inspections-list">
              {inspectionsLoading ? (
                <div className="text-center py-8 text-muted-foreground">
                  Loading recent inspections...
                </div>
              ) : !recentInspections || recentInspections.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground" data-testid="no-inspections">
                  <Bike className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No inspections yet</p>
                  <p className="text-sm">Start your first inspection to see it here</p>
                </div>
              ) : (
                recentInspections.map((inspection) => (
                  <div
                    key={inspection.id}
                    className="flex items-center justify-between p-4 bg-accent/50 rounded-lg hover:bg-accent/70 transition-colors"
                    data-testid={`inspection-${inspection.id}`}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                        <Bike className="w-5 h-5 text-primary-foreground" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground" data-testid="inspection-model">
                          {inspection.make} {inspection.model}
                        </p>
                        <p className="text-sm text-muted-foreground" data-testid="inspection-chassis">
                          {inspection.chassisNo}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-2">
                        <span
                          className={cn(
                            "px-2 py-1 text-xs font-medium rounded-full",
                            getScoreBadgeClass(inspection.finalScore)
                          )}
                          data-testid="inspection-score"
                        >
                          {inspection.finalScore?.toFixed(1) || "N/A"}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground" data-testid="inspection-time">
                        {formatTimeAgo(inspection.createdAt)}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
            
            {recentInspections && recentInspections.length > 0 && (
              <div className="mt-4 pt-4 border-t border-border">
                <Link href="/inspection-history">
                  <Button variant="outline" className="w-full" data-testid="button-view-all">
                    View All Inspections
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Score Distribution Chart */}
        <Card data-testid="card-score-distribution">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Score Distribution
            </CardTitle>
            <CardDescription>
              Breakdown of inspection scores
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64" data-testid="score-chart-container">
              <ScoreDistributionChart />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card data-testid="card-quick-actions">
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>
            Common tasks for your workflow
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link href="/new-inspection">
              <Button variant="outline" className="w-full h-20 flex flex-col gap-2" data-testid="action-new-inspection">
                <Plus className="w-6 h-6" />
                <span>New Inspection</span>
              </Button>
            </Link>
            
            <Link href="/inspection-history">
              <Button variant="outline" className="w-full h-20 flex flex-col gap-2" data-testid="action-view-history">
                <ClipboardCheck className="w-6 h-6" />
                <span>View History</span>
              </Button>
            </Link>
            
            <Link href="/reports">
              <Button variant="outline" className="w-full h-20 flex flex-col gap-2" data-testid="action-generate-report">
                <FileText className="w-6 h-6" />
                <span>Generate Report</span>
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
