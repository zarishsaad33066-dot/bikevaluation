import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Settings, 
  Users, 
  Sliders, 
  Database,
  Save,
  Edit,
  Trash2,
  Plus,
  DollarSign,
  TrendingUp,
  AlertTriangle
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import { type ScoringRule, type User, type MotorcycleModel } from "@shared/schema";
import { useEffect } from "react";

export default function AdminPanel() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editingRule, setEditingRule] = useState<string | null>(null);
  const [editingUser, setEditingUser] = useState<string | null>(null);

  // Redirect to login if not authenticated or not admin
  useEffect(() => {
    if (!authLoading && (!isAuthenticated || user?.role !== 'admin')) {
      toast({
        title: "Unauthorized",
        description: "Admin access required. Redirecting...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, authLoading, user, toast]);

  const { data: scoringRules, isLoading: rulesLoading } = useQuery<ScoringRule[]>({
    queryKey: ["/api/scoring-rules"],
    enabled: isAuthenticated && user?.role === 'admin',
  });

  const { data: allModels } = useQuery<(MotorcycleModel & { brand: any })[]>({
    queryKey: ["/api/motorcycle-models"],
    enabled: isAuthenticated && user?.role === 'admin',
  });

  // Mock users data - would be replaced with actual API
  const mockUsers: User[] = [
    {
      id: "1",
      email: "admin@bikecheck.com",
      firstName: "Admin",
      lastName: "User",
      role: "admin",
      profileImageUrl: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: "2", 
      email: "mechanic@workshop.com",
      firstName: "Ahmed",
      lastName: "Hassan",
      role: "mechanic",
      profileImageUrl: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  const updateScoringRuleMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<ScoringRule> }) => {
      const response = await apiRequest("PUT", `/api/scoring-rules/${id}`, data);
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Scoring rule updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/scoring-rules"] });
      setEditingRule(null);
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
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
        description: "Failed to update scoring rule.",
        variant: "destructive",
      });
    },
  });

  if (authLoading || !isAuthenticated || user?.role !== 'admin') {
    return (
      <div className="flex items-center justify-center h-64" data-testid="admin-loading">
        <div className="text-muted-foreground">Loading admin panel...</div>
      </div>
    );
  }

  const handleUpdateScoringRule = (rule: ScoringRule, newWeight: string) => {
    updateScoringRuleMutation.mutate({
      id: rule.id,
      data: { weight: newWeight }
    });
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case "admin": return "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400";
      case "mechanic": return "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400";
      case "dealer": return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400";
      default: return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400";
    }
  };

  return (
    <div className="space-y-6" data-testid="admin-panel-page">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Admin Panel</h1>
          <p className="text-muted-foreground mt-2">
            Manage system settings, scoring rules, and users
          </p>
        </div>
        <Badge variant="destructive" data-testid="admin-badge">
          <Settings className="w-3 h-3 mr-1" />
          Admin Access
        </Badge>
      </div>

      {/* Admin Tabs */}
      <Tabs defaultValue="scoring" className="space-y-6" data-testid="admin-tabs">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="scoring" data-testid="tab-scoring">
            <Sliders className="w-4 h-4 mr-2" />
            Scoring Rules
          </TabsTrigger>
          <TabsTrigger value="pricing" data-testid="tab-pricing">
            <DollarSign className="w-4 h-4 mr-2" />
            Market Pricing
          </TabsTrigger>
          <TabsTrigger value="users" data-testid="tab-users">
            <Users className="w-4 h-4 mr-2" />
            User Management
          </TabsTrigger>
          <TabsTrigger value="system" data-testid="tab-system">
            <Database className="w-4 h-4 mr-2" />
            System
          </TabsTrigger>
        </TabsList>

        {/* Scoring Rules Tab */}
        <TabsContent value="scoring" className="space-y-6" data-testid="scoring-tab-content">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sliders className="w-5 h-5" />
                Scoring Rules & Weights
              </CardTitle>
              <CardDescription>
                Configure the weightings and deduction rules for each inspection category
              </CardDescription>
            </CardHeader>
            <CardContent>
              {rulesLoading ? (
                <div className="text-center py-8 text-muted-foreground">
                  Loading scoring rules...
                </div>
              ) : !scoringRules || scoringRules.length === 0 ? (
                <div className="text-center py-8" data-testid="no-scoring-rules">
                  <AlertTriangle className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <h3 className="text-lg font-medium text-foreground mb-2">
                    No scoring rules found
                  </h3>
                  <p className="text-muted-foreground">
                    Scoring rules need to be initialized in the database
                  </p>
                </div>
              ) : (
                <div className="space-y-6" data-testid="scoring-rules-list">
                  {scoringRules.map((rule) => (
                    <Card key={rule.id} className="border" data-testid={`scoring-rule-${rule.category}`}>
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-semibold text-foreground capitalize">
                              {rule.category} ({rule.weight}%)
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              Weight in final score calculation
                            </p>
                          </div>
                          
                          <div className="flex items-center gap-3">
                            {editingRule === rule.id ? (
                              <div className="flex items-center gap-2">
                                <Input
                                  type="number"
                                  min="0"
                                  max="100"
                                  defaultValue={rule.weight}
                                  className="w-20"
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      const target = e.target as HTMLInputElement;
                                      handleUpdateScoringRule(rule, target.value);
                                    }
                                  }}
                                  data-testid={`input-weight-${rule.category}`}
                                />
                                <Button
                                  size="sm"
                                  onClick={() => {
                                    const input = document.querySelector(`[data-testid="input-weight-${rule.category}"]`) as HTMLInputElement;
                                    handleUpdateScoringRule(rule, input.value);
                                  }}
                                  disabled={updateScoringRuleMutation.isPending}
                                  data-testid={`button-save-${rule.category}`}
                                >
                                  <Save className="w-4 h-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => setEditingRule(null)}
                                  data-testid={`button-cancel-${rule.category}`}
                                >
                                  Cancel
                                </Button>
                              </div>
                            ) : (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setEditingRule(rule.id)}
                                data-testid={`button-edit-${rule.category}`}
                              >
                                <Edit className="w-4 h-4 mr-2" />
                                Edit
                              </Button>
                            )}
                          </div>
                        </div>

                        {/* Deduction Rules Preview */}
                        <div className="mt-4 p-4 bg-muted/50 rounded-lg">
                          <h4 className="text-sm font-medium text-foreground mb-2">Deduction Rules:</h4>
                          <div className="text-sm text-muted-foreground">
                            {JSON.stringify(rule.deductionRules, null, 2).slice(0, 200)}...
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  
                  <div className="mt-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-yellow-800 dark:text-yellow-200">Important Note</h4>
                        <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                          Ensure all category weights add up to 100%. Changes will affect all future inspections.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Market Pricing Tab */}
        <TabsContent value="pricing" className="space-y-6" data-testid="pricing-tab-content">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                Market Baseline Values
              </CardTitle>
              <CardDescription>
                Manage baseline market prices for motorcycle models
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full" data-testid="pricing-table">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left p-3 text-foreground">Make</th>
                      <th className="text-left p-3 text-foreground">Model</th>
                      <th className="text-left p-3 text-foreground">Engine Size</th>
                      <th className="text-left p-3 text-foreground">2024 Price (PKR)</th>
                      <th className="text-left p-3 text-foreground">2025 Price (PKR)</th>
                      <th className="text-left p-3 text-foreground">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allModels?.slice(0, 10).map((model) => (
                      <tr key={model.id} className="border-b border-border" data-testid={`pricing-row-${model.id}`}>
                        <td className="p-3 text-foreground">{model.brand.name}</td>
                        <td className="p-3 text-foreground">{model.name}</td>
                        <td className="p-3 text-foreground">{model.engineSize}cc</td>
                        <td className="p-3">
                          <Input
                            type="number"
                            defaultValue={model.basePrice2024 ? parseFloat(model.basePrice2024).toString() : ""}
                            className="w-32"
                            data-testid={`input-price-2024-${model.id}`}
                          />
                        </td>
                        <td className="p-3">
                          <Input
                            type="number"
                            defaultValue={model.basePrice2025 ? parseFloat(model.basePrice2025).toString() : ""}
                            className="w-32"
                            data-testid={`input-price-2025-${model.id}`}
                          />
                        </td>
                        <td className="p-3">
                          <Button
                            size="sm"
                            variant="outline"
                            data-testid={`button-save-pricing-${model.id}`}
                          >
                            <Save className="w-4 h-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* User Management Tab */}
        <TabsContent value="users" className="space-y-6" data-testid="users-tab-content">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                User Management
              </CardTitle>
              <CardDescription>
                Manage user accounts and permissions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4" data-testid="users-list">
                {mockUsers.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between p-4 bg-accent/30 dark:bg-accent/20 rounded-lg"
                    data-testid={`user-${user.id}`}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                        <span className="text-primary-foreground font-medium">
                          {user.firstName?.charAt(0)}{user.lastName?.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <h4 className="font-medium text-foreground" data-testid="user-name">
                          {user.firstName} {user.lastName}
                        </h4>
                        <p className="text-sm text-muted-foreground" data-testid="user-email">
                          {user.email}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <Badge className={getRoleColor(user.role)} data-testid="user-role">
                        {user.role}
                      </Badge>
                      
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          data-testid={`button-edit-user-${user.id}`}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        
                        {user.role !== "admin" && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-destructive hover:text-destructive"
                            data-testid={`button-delete-user-${user.id}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* System Tab */}
        <TabsContent value="system" className="space-y-6" data-testid="system-tab-content">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="w-5 h-5" />
                System Information
              </CardTitle>
              <CardDescription>
                System status and configuration
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6" data-testid="system-info">
                <div>
                  <h4 className="font-medium text-foreground mb-3">Database Status</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Motorcycle Brands:</span>
                      <span className="text-foreground">6 loaded</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Motorcycle Models:</span>
                      <span className="text-foreground">{allModels?.length || 0} loaded</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Scoring Rules:</span>
                      <span className="text-foreground">{scoringRules?.length || 0} configured</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-foreground mb-3">Application Status</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Version:</span>
                      <span className="text-foreground">1.0.0</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Environment:</span>
                      <span className="text-foreground">Production</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Database:</span>
                      <Badge variant="default" className="text-xs">Connected</Badge>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
