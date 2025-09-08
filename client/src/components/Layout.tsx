import { useState } from "react";
import { Link, useLocation } from "wouter";
import { 
  LayoutDashboard, 
  Plus, 
  History, 
  FileText, 
  Settings, 
  User, 
  Moon, 
  Sun, 
  Bell,
  Menu,
  X,
  Bike
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/components/ThemeProvider";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const [location] = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const { user } = useAuth();

  const navigationItems = [
    { 
      name: "Dashboard", 
      href: "/dashboard", 
      icon: LayoutDashboard,
      testId: "nav-dashboard"
    },
    { 
      name: "New Inspection", 
      href: "/new-inspection", 
      icon: Plus,
      testId: "nav-new-inspection"
    },
    { 
      name: "Inspection History", 
      href: "/inspection-history", 
      icon: History,
      testId: "nav-history"
    },
    { 
      name: "Reports", 
      href: "/reports", 
      icon: FileText,
      testId: "nav-reports"
    },
    ...(user?.role === 'admin' ? [{ 
      name: "Admin Panel", 
      href: "/admin", 
      icon: Settings,
      testId: "nav-admin"
    }] : []),
    { 
      name: "Profile Settings", 
      href: "/profile", 
      icon: User,
      testId: "nav-profile"
    },
  ];

  const isActive = (href: string) => {
    if (href === "/" && location === "/") return true;
    if (href !== "/" && location.startsWith(href)) return true;
    return false;
  };

  const closeSidebar = () => setSidebarOpen(false);

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <aside
        className={cn(
          "w-64 bg-card border-r border-border transition-all duration-300 ease-in-out lg:translate-x-0 transform fixed lg:relative lg:block z-30 h-full",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
        data-testid="sidebar"
      >
        <div className="flex flex-col h-full">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3 p-6 border-b border-border">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <Bike className="text-primary-foreground text-lg" data-testid="logo-icon" />
            </div>
            <div>
              <h1 className="font-bold text-lg text-foreground" data-testid="app-title">BikeCheck</h1>
              <p className="text-sm text-muted-foreground" data-testid="app-subtitle">Inspection System</p>
            </div>
          </div>

          {/* Navigation Menu */}
          <nav className="flex-1 p-4 space-y-2" data-testid="sidebar-nav">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={closeSidebar}
                  data-testid={item.testId}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-lg transition-colors",
                    active
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  )}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* Bottom Actions */}
          <div className="p-4 border-t border-border space-y-3">
            {/* Dark Mode Toggle */}
            <Button
              variant="ghost"
              className="flex items-center gap-3 p-3 rounded-lg w-full justify-start text-muted-foreground hover:text-accent-foreground"
              onClick={toggleTheme}
              data-testid="theme-toggle"
            >
              {theme === "dark" ? (
                <Sun className="w-5 h-5" data-testid="theme-icon" />
              ) : (
                <Moon className="w-5 h-5" data-testid="theme-icon" />
              )}
              <span data-testid="theme-text">
                {theme === "dark" ? "Light Mode" : "Dark Mode"}
              </span>
            </Button>
            
            {/* User Info */}
            <div className="flex items-center gap-3 p-3" data-testid="user-info">
              <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                <span className="text-primary-foreground text-sm font-medium" data-testid="user-avatar">
                  {user?.firstName?.charAt(0) || user?.email?.charAt(0) || "U"}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate" data-testid="user-name">
                  {user?.firstName || user?.email || "User"}
                </p>
                <p className="text-xs text-muted-foreground" data-testid="user-role">
                  {user?.role || "Mechanic"}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-foreground"
                onClick={() => window.location.href = "/api/logout"}
                data-testid="logout-button"
              >
                <User className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile Sidebar Overlay */}
      <div
        className={cn(
          "fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden",
          sidebarOpen ? "block" : "hidden"
        )}
        onClick={closeSidebar}
        data-testid="sidebar-overlay"
      />

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
        <header className="bg-card border-b border-border p-4 flex items-center justify-between" data-testid="header">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              className="lg:hidden text-muted-foreground hover:text-foreground"
              onClick={() => setSidebarOpen(true)}
              data-testid="sidebar-toggle"
            >
              <Menu className="text-xl" />
            </Button>
            <div>
              <h2 className="text-xl font-semibold text-foreground" data-testid="page-title">
                {getPageTitle(location)}
              </h2>
              <p className="text-sm text-muted-foreground" data-testid="page-subtitle">
                {getPageSubtitle(location)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              className="relative text-muted-foreground hover:text-foreground"
              data-testid="notifications-button"
            >
              <Bell className="text-lg" />
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-destructive rounded-full" data-testid="notification-badge" />
            </Button>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-auto p-6" data-testid="main-content">
          {children}
        </div>
      </main>
    </div>
  );
}

function getPageTitle(location: string): string {
  const titles: Record<string, string> = {
    "/": "Dashboard",
    "/dashboard": "Dashboard",
    "/new-inspection": "New Inspection",
    "/inspection-history": "Inspection History",
    "/reports": "Reports",
    "/admin": "Admin Panel",
    "/profile": "Profile Settings",
  };
  
  // Check for dynamic routes
  if (location.includes("/inspection/") && location.includes("/results")) {
    return "Inspection Results";
  }
  
  return titles[location] || "BikeCheck";
}

function getPageSubtitle(location: string): string {
  const subtitles: Record<string, string> = {
    "/": "Overview of inspection activities",
    "/dashboard": "Overview of inspection activities",
    "/new-inspection": "Create a new bike inspection",
    "/inspection-history": "View past inspections",
    "/reports": "Generate and view reports",
    "/admin": "Manage scoring rules and users",
    "/profile": "Manage your account settings",
  };
  
  // Check for dynamic routes
  if (location.includes("/inspection/") && location.includes("/results")) {
    return "View inspection scoring and valuation";
  }
  
  return subtitles[location] || "Professional bike inspection system";
}
