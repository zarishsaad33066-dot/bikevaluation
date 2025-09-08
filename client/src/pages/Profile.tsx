import { useState } from "react";
import { useForm } from "react-hook-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  User, 
  Mail, 
  Settings,
  Bell,
  Shield,
  Key,
  Save,
  LogOut,
  Camera,
  Edit3
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import { useTheme } from "@/components/ThemeProvider";
import { useEffect } from "react";

interface ProfileFormData {
  firstName: string;
  lastName: string;
  email: string;
}

interface PreferencesFormData {
  theme: "light" | "dark" | "system";
  notifications: boolean;
  emailAlerts: boolean;
}

export default function Profile() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const { theme, setTheme } = useTheme();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);

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

  const profileForm = useForm<ProfileFormData>({
    defaultValues: {
      firstName: user?.firstName || "",
      lastName: user?.lastName || "",
      email: user?.email || "",
    },
  });

  const preferencesForm = useForm<PreferencesFormData>({
    defaultValues: {
      theme: theme as "light" | "dark" | "system",
      notifications: true,
      emailAlerts: false,
    },
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (data: ProfileFormData) => {
      const response = await apiRequest("PUT", "/api/auth/profile", data);
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Profile Updated",
        description: "Your profile has been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      setIsEditing(false);
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
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    },
  });

  if (authLoading || !isAuthenticated) {
    return (
      <div className="flex items-center justify-center h-64" data-testid="profile-loading">
        <div className="text-muted-foreground">Loading profile...</div>
      </div>
    );
  }

  const getRoleColor = (role?: string) => {
    switch (role) {
      case "admin": return "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400";
      case "mechanic": return "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400";
      case "dealer": return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400";
      default: return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400";
    }
  };

  const handleLogout = () => {
    window.location.href = "/api/logout";
  };

  const onProfileSubmit = (data: ProfileFormData) => {
    updateProfileMutation.mutate(data);
  };

  const onPreferencesSubmit = (data: PreferencesFormData) => {
    setTheme(data.theme);
    toast({
      title: "Preferences Updated",
      description: "Your preferences have been saved.",
    });
  };

  return (
    <div className="space-y-6" data-testid="profile-page">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Profile Settings</h1>
          <p className="text-muted-foreground mt-2">
            Manage your account settings and preferences
          </p>
        </div>
        <Button 
          variant="outline" 
          onClick={handleLogout}
          data-testid="button-logout"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Logout
        </Button>
      </div>

      {/* Profile Overview Card */}
      <Card data-testid="card-profile-overview">
        <CardContent className="p-6">
          <div className="flex items-center gap-6">
            <div className="relative">
              <div className="w-20 h-20 bg-primary rounded-full flex items-center justify-center text-2xl font-bold text-primary-foreground">
                {user?.firstName?.charAt(0) || user?.email?.charAt(0) || "U"}
              </div>
              <Button
                size="sm"
                className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full p-0"
                data-testid="button-change-avatar"
              >
                <Camera className="w-4 h-4" />
              </Button>
            </div>
            
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-foreground" data-testid="profile-name">
                {user?.firstName || user?.lastName 
                  ? `${user.firstName || ""} ${user.lastName || ""}`.trim()
                  : user?.email || "User"
                }
              </h2>
              <p className="text-muted-foreground" data-testid="profile-email">
                {user?.email}
              </p>
              <div className="flex items-center gap-2 mt-2">
                <Badge className={getRoleColor(user?.role)} data-testid="profile-role">
                  {user?.role || "User"}
                </Badge>
                <Badge variant="outline" data-testid="profile-status">
                  Active
                </Badge>
              </div>
            </div>

            <Button
              variant="outline"
              onClick={() => setIsEditing(!isEditing)}
              data-testid="button-edit-profile"
            >
              <Edit3 className="w-4 h-4 mr-2" />
              {isEditing ? "Cancel" : "Edit"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Profile Tabs */}
      <Tabs defaultValue="general" className="space-y-6" data-testid="profile-tabs">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="general" data-testid="tab-general">
            <User className="w-4 h-4 mr-2" />
            General
          </TabsTrigger>
          <TabsTrigger value="preferences" data-testid="tab-preferences">
            <Settings className="w-4 h-4 mr-2" />
            Preferences
          </TabsTrigger>
          <TabsTrigger value="notifications" data-testid="tab-notifications">
            <Bell className="w-4 h-4 mr-2" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="security" data-testid="tab-security">
            <Shield className="w-4 h-4 mr-2" />
            Security
          </TabsTrigger>
        </TabsList>

        {/* General Tab */}
        <TabsContent value="general" className="space-y-6" data-testid="general-tab-content">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Personal Information
              </CardTitle>
              <CardDescription>
                Update your personal details and contact information
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      {...profileForm.register("firstName")}
                      disabled={!isEditing}
                      data-testid="input-first-name"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      {...profileForm.register("lastName")}
                      disabled={!isEditing}
                      data-testid="input-last-name"
                    />
                  </div>
                  
                  <div className="md:col-span-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      {...profileForm.register("email")}
                      disabled={!isEditing}
                      data-testid="input-email"
                    />
                  </div>
                </div>

                {isEditing && (
                  <div className="flex gap-3">
                    <Button
                      type="submit"
                      disabled={updateProfileMutation.isPending}
                      data-testid="button-save-profile"
                    >
                      {updateProfileMutation.isPending ? (
                        "Saving..."
                      ) : (
                        <>
                          <Save className="w-4 h-4 mr-2" />
                          Save Changes
                        </>
                      )}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsEditing(false)}
                      data-testid="button-cancel-edit"
                    >
                      Cancel
                    </Button>
                  </div>
                )}
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Preferences Tab */}
        <TabsContent value="preferences" className="space-y-6" data-testid="preferences-tab-content">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Application Preferences
              </CardTitle>
              <CardDescription>
                Customize your application experience
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={preferencesForm.handleSubmit(onPreferencesSubmit)} className="space-y-6">
                <div>
                  <Label htmlFor="theme">Theme Preference</Label>
                  <Select
                    value={theme}
                    onValueChange={(value) => {
                      setTheme(value as "light" | "dark");
                      preferencesForm.setValue("theme", value as "light" | "dark" | "system");
                    }}
                    data-testid="select-theme"
                  >
                    <SelectTrigger className="mt-2">
                      <SelectValue placeholder="Select theme" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light">Light</SelectItem>
                      <SelectItem value="dark">Dark</SelectItem>
                      <SelectItem value="system">System</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium text-foreground">Display Settings</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="dense-mode">Dense Mode</Label>
                      <input
                        type="checkbox"
                        id="dense-mode"
                        className="rounded"
                        data-testid="checkbox-dense-mode"
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="show-tooltips">Show Tooltips</Label>
                      <input
                        type="checkbox"
                        id="show-tooltips"
                        defaultChecked
                        className="rounded"
                        data-testid="checkbox-tooltips"
                      />
                    </div>
                  </div>
                </div>

                <Button type="submit" data-testid="button-save-preferences">
                  <Save className="w-4 h-4 mr-2" />
                  Save Preferences
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="space-y-6" data-testid="notifications-tab-content">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="w-5 h-5" />
                Notification Settings
              </CardTitle>
              <CardDescription>
                Manage how and when you receive notifications
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="space-y-4">
                  <h4 className="font-medium text-foreground">Email Notifications</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="email-reports">Inspection Reports</Label>
                        <p className="text-sm text-muted-foreground">
                          Get notified when reports are generated
                        </p>
                      </div>
                      <input
                        type="checkbox"
                        id="email-reports"
                        defaultChecked
                        className="rounded"
                        data-testid="checkbox-email-reports"
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="email-weekly">Weekly Summary</Label>
                        <p className="text-sm text-muted-foreground">
                          Weekly inspection activity summary
                        </p>
                      </div>
                      <input
                        type="checkbox"
                        id="email-weekly"
                        className="rounded"
                        data-testid="checkbox-weekly-summary"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium text-foreground">Push Notifications</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="push-completed">Inspection Completed</Label>
                        <p className="text-sm text-muted-foreground">
                          When an inspection is completed
                        </p>
                      </div>
                      <input
                        type="checkbox"
                        id="push-completed"
                        defaultChecked
                        className="rounded"
                        data-testid="checkbox-push-completed"
                      />
                    </div>
                  </div>
                </div>

                <Button data-testid="button-save-notifications">
                  <Save className="w-4 h-4 mr-2" />
                  Save Notification Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security" className="space-y-6" data-testid="security-tab-content">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Security Settings
              </CardTitle>
              <CardDescription>
                Manage your account security and privacy
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <h4 className="font-medium text-foreground mb-4">Account Security</h4>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 border border-border rounded-lg">
                      <div>
                        <h5 className="font-medium text-foreground">Password</h5>
                        <p className="text-sm text-muted-foreground">
                          Last changed 30 days ago
                        </p>
                      </div>
                      <Button variant="outline" data-testid="button-change-password">
                        <Key className="w-4 h-4 mr-2" />
                        Change Password
                      </Button>
                    </div>

                    <div className="flex items-center justify-between p-4 border border-border rounded-lg">
                      <div>
                        <h5 className="font-medium text-foreground">Two-Factor Authentication</h5>
                        <p className="text-sm text-muted-foreground">
                          Add an extra layer of security
                        </p>
                      </div>
                      <Button variant="outline" data-testid="button-enable-2fa">
                        Enable 2FA
                      </Button>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-foreground mb-4">Active Sessions</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-4 border border-border rounded-lg">
                      <div>
                        <h5 className="font-medium text-foreground">Current Session</h5>
                        <p className="text-sm text-muted-foreground">
                          Chrome on Windows • Active now
                        </p>
                      </div>
                      <Badge variant="outline" data-testid="current-session-badge">
                        Current
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-border">
                  <Button variant="destructive" data-testid="button-delete-account">
                    Delete Account
                  </Button>
                  <p className="text-sm text-muted-foreground mt-2">
                    Permanently delete your account and all associated data
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
