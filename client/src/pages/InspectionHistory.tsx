import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Search, 
  Filter, 
  Eye, 
  FileText, 
  Calendar,
  Bike,
  SortAsc,
  SortDesc
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { cn } from "@/lib/utils";
import ScoreGauge from "@/components/ScoreGauge";
import { useEffect } from "react";

interface InspectionWithInspector {
  id: string;
  make: string;
  model: string;
  year: number;
  chassisNo: string;
  engineNo: string;
  color?: string;
  mileage?: number;
  finalScore?: number;
  estimatedValue?: number;
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

export default function InspectionHistory() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [sortField, setSortField] = useState<"createdAt" | "finalScore" | "make">("createdAt");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

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

  const { data: inspections, isLoading, error } = useQuery<InspectionWithInspector[]>({
    queryKey: ["/api/inspections", { search: searchQuery || undefined }],
    enabled: isAuthenticated,
  });

  if (authLoading || !isAuthenticated) {
    return (
      <div className="flex items-center justify-center h-64" data-testid="history-loading">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  const getScoreColor = (score?: number) => {
    if (!score) return "text-muted-foreground";
    if (score >= 8) return "text-green-600";
    if (score >= 5) return "text-yellow-600";
    return "text-red-600";
  };

  const getScoreBadgeVariant = (score?: number) => {
    if (!score) return "secondary";
    if (score >= 8) return "default";
    if (score >= 5) return "secondary";
    return "destructive";
  };

  const getStatusBadgeVariant = (status: string) => {
    return status === "completed" ? "default" : "secondary";
  };

  const formatCurrency = (amount?: number) => {
    if (!amount) return "N/A";
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
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Filter and sort inspections
  const filteredAndSortedInspections = inspections
    ?.filter(inspection => {
      if (!searchQuery) return true;
      const query = searchQuery.toLowerCase();
      return (
        inspection.chassisNo.toLowerCase().includes(query) ||
        inspection.make.toLowerCase().includes(query) ||
        inspection.model.toLowerCase().includes(query) ||
        inspection.engineNo.toLowerCase().includes(query)
      );
    })
    ?.sort((a, b) => {
      let aValue, bValue;
      
      switch (sortField) {
        case "finalScore":
          aValue = a.finalScore || 0;
          bValue = b.finalScore || 0;
          break;
        case "make":
          aValue = `${a.make} ${a.model}`;
          bValue = `${b.make} ${b.model}`;
          break;
        default:
          aValue = new Date(a.createdAt).getTime();
          bValue = new Date(b.createdAt).getTime();
      }
      
      if (sortDirection === "asc") {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    }) || [];

  const toggleSort = (field: typeof sortField) => {
    if (sortField === field) {
      setSortDirection(prev => prev === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

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

  return (
    <div className="space-y-6" data-testid="inspection-history-page">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Inspection History</h1>
          <p className="text-muted-foreground mt-2">
            View and manage your completed inspections
          </p>
        </div>
        <Link href="/new-inspection">
          <Button data-testid="button-new-inspection">
            <Bike className="w-4 h-4 mr-2" />
            New Inspection
          </Button>
        </Link>
      </div>

      {/* Search and Filters */}
      <Card data-testid="card-search-filters">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search by chassis number, make, model..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                  data-testid="input-search"
                />
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => toggleSort("createdAt")}
                className="gap-2"
                data-testid="button-sort-date"
              >
                <Calendar className="w-4 h-4" />
                Date
                {sortField === "createdAt" && (
                  sortDirection === "asc" ? <SortAsc className="w-4 h-4" /> : <SortDesc className="w-4 h-4" />
                )}
              </Button>
              
              <Button
                variant="outline"
                onClick={() => toggleSort("finalScore")}
                className="gap-2"
                data-testid="button-sort-score"
              >
                Score
                {sortField === "finalScore" && (
                  sortDirection === "asc" ? <SortAsc className="w-4 h-4" /> : <SortDesc className="w-4 h-4" />
                )}
              </Button>
              
              <Button
                variant="outline"
                onClick={() => toggleSort("make")}
                className="gap-2"
                data-testid="button-sort-make"
              >
                Model
                {sortField === "make" && (
                  sortDirection === "asc" ? <SortAsc className="w-4 h-4" /> : <SortDesc className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      <Card data-testid="card-inspection-results">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Inspection Results</span>
            <Badge variant="secondary" data-testid="results-count">
              {filteredAndSortedInspections.length} inspections
            </Badge>
          </CardTitle>
          <CardDescription>
            {searchQuery && `Filtered by: "${searchQuery}"`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-12 text-muted-foreground" data-testid="loading-inspections">
              Loading inspections...
            </div>
          ) : filteredAndSortedInspections.length === 0 ? (
            <div className="text-center py-12" data-testid="no-inspections">
              <Bike className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-lg font-medium text-foreground mb-2">
                {searchQuery ? "No matching inspections found" : "No inspections yet"}
              </h3>
              <p className="text-muted-foreground mb-4">
                {searchQuery 
                  ? "Try adjusting your search criteria" 
                  : "Start your first inspection to see it here"
                }
              </p>
              {!searchQuery && (
                <Link href="/new-inspection">
                  <Button data-testid="button-create-first">
                    Create First Inspection
                  </Button>
                </Link>
              )}
            </div>
          ) : (
            <div className="space-y-4" data-testid="inspections-list">
              {filteredAndSortedInspections.map((inspection) => (
                <div
                  key={inspection.id}
                  className="flex items-center gap-6 p-6 bg-accent/30 dark:bg-accent/20 rounded-lg hover:bg-accent/50 dark:hover:bg-accent/30 transition-colors"
                  data-testid={`inspection-${inspection.id}`}
                >
                  {/* Score Gauge */}
                  <div className="flex-shrink-0">
                    <ScoreGauge 
                      score={inspection.finalScore || 0} 
                      size="sm" 
                      data-testid="inspection-score-gauge"
                    />
                  </div>

                  {/* Inspection Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold text-foreground" data-testid="inspection-title">
                          {inspection.make} {inspection.model} ({inspection.year})
                        </h3>
                        <p className="text-sm text-muted-foreground" data-testid="inspection-chassis">
                          Chassis: {inspection.chassisNo}
                        </p>
                        <p className="text-sm text-muted-foreground" data-testid="inspection-details">
                          {inspection.color && `${inspection.color} • `}
                          {inspection.mileage && `${inspection.mileage.toLocaleString()} KM`}
                        </p>
                      </div>
                      
                      <div className="text-right">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge 
                            variant={getStatusBadgeVariant(inspection.status)}
                            data-testid="inspection-status"
                          >
                            {inspection.status}
                          </Badge>
                          {inspection.reportGenerated && (
                            <Badge variant="outline" data-testid="report-badge">
                              <FileText className="w-3 h-3 mr-1" />
                              Report
                            </Badge>
                          )}
                        </div>
                        
                        {inspection.estimatedValue && (
                          <p className="text-sm font-medium text-foreground" data-testid="estimated-value">
                            {formatCurrency(inspection.estimatedValue)}
                          </p>
                        )}
                        
                        <p className="text-xs text-muted-foreground" data-testid="inspection-date">
                          {formatDate(inspection.createdAt)}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-2">
                    <Link href={`/inspection/${inspection.id}/results`}>
                      <Button variant="outline" size="sm" data-testid="button-view-results">
                        <Eye className="w-4 h-4 mr-2" />
                        View
                      </Button>
                    </Link>
                    
                    {inspection.reportGenerated && (
                      <Button variant="outline" size="sm" data-testid="button-download-report">
                        <FileText className="w-4 h-4 mr-2" />
                        Report
                      </Button>
                    )}
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
