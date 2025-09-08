import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Bike, CheckCircle, BarChart3, FileText, Users } from "lucide-react";

export default function Landing() {
  const handleLogin = () => {
    window.location.href = "/api/login";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900" data-testid="landing-page">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center max-w-4xl mx-auto">
          <div className="flex items-center justify-center gap-3 mb-8">
            <div className="w-16 h-16 bg-primary rounded-xl flex items-center justify-center" data-testid="hero-logo">
              <Bike className="text-primary-foreground text-2xl" />
            </div>
            <h1 className="text-5xl font-bold text-foreground" data-testid="hero-title">BikeCheck</h1>
          </div>
          
          <h2 className="text-3xl font-bold text-foreground mb-6" data-testid="hero-subtitle">
            Professional Bike Inspection & Valuation System
          </h2>
          
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto" data-testid="hero-description">
            Comprehensive motorcycle inspection platform designed for Pakistani mechanics and dealerships. 
            Get accurate market valuations with our intelligent scoring system.
          </p>
          
          <Button 
            size="lg" 
            className="text-lg px-8 py-6" 
            onClick={handleLogin}
            data-testid="login-button"
          >
            Get Started
          </Button>
        </div>
      </div>

      {/* Features Section */}
      <div className="container mx-auto px-4 py-16">
        <h3 className="text-3xl font-bold text-center text-foreground mb-12" data-testid="features-title">
          Built for Pakistani Motorcycle Market
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <Card className="text-center" data-testid="feature-inspection">
            <CardHeader>
              <CheckCircle className="w-12 h-12 text-primary mx-auto mb-4" />
              <CardTitle>Smart Inspection</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Component-wise inspection with intelligent scoring for engines, brakes, body, and more.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="text-center" data-testid="feature-valuation">
            <CardHeader>
              <BarChart3 className="w-12 h-12 text-primary mx-auto mb-4" />
              <CardTitle>Market Valuation</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Real-time market pricing for Honda, Suzuki, Yamaha, United Motors, and local brands.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="text-center" data-testid="feature-reports">
            <CardHeader>
              <FileText className="w-12 h-12 text-primary mx-auto mb-4" />
              <CardTitle>Professional Reports</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Generate detailed PDF reports with charts, photos, and inspection certificates.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="text-center" data-testid="feature-dashboard">
            <CardHeader>
              <Users className="w-12 h-12 text-primary mx-auto mb-4" />
              <CardTitle>Team Management</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Role-based access for mechanics, dealers, and administrators with comprehensive dashboards.
              </CardDescription>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Brands Section */}
      <div className="container mx-auto px-4 py-16 bg-card/50">
        <h3 className="text-3xl font-bold text-center text-foreground mb-12" data-testid="brands-title">
          Pre-loaded Pakistani Motorcycle Database
        </h3>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8 items-center text-center">
          <div className="p-4" data-testid="brand-honda">
            <h4 className="font-semibold text-foreground">Honda</h4>
            <p className="text-sm text-muted-foreground">CD 70, CG 125, CB 150F</p>
          </div>
          <div className="p-4" data-testid="brand-suzuki">
            <h4 className="font-semibold text-foreground">Suzuki</h4>
            <p className="text-sm text-muted-foreground">GD 110S, GS 150, GSX 125</p>
          </div>
          <div className="p-4" data-testid="brand-yamaha">
            <h4 className="font-semibold text-foreground">Yamaha</h4>
            <p className="text-sm text-muted-foreground">YBR 125, YBR 125G, YB 125Z</p>
          </div>
          <div className="p-4" data-testid="brand-united">
            <h4 className="font-semibold text-foreground">United Motors</h4>
            <p className="text-sm text-muted-foreground">US 70, US 125, US 150</p>
          </div>
          <div className="p-4" data-testid="brand-roadprince">
            <h4 className="font-semibold text-foreground">Road Prince</h4>
            <p className="text-sm text-muted-foreground">RP 70, RP 125, RX3</p>
          </div>
          <div className="p-4" data-testid="brand-unique">
            <h4 className="font-semibold text-foreground">Unique</h4>
            <p className="text-sm text-muted-foreground">UD 70, 125cc, 150cc</p>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center max-w-2xl mx-auto">
          <h3 className="text-3xl font-bold text-foreground mb-6" data-testid="cta-title">
            Ready to Start Professional Inspections?
          </h3>
          <p className="text-xl text-muted-foreground mb-8" data-testid="cta-description">
            Join mechanics and dealerships across Pakistan using BikeCheck for accurate motorcycle valuations.
          </p>
          <Button 
            size="lg" 
            className="text-lg px-8 py-6" 
            onClick={handleLogin}
            data-testid="cta-button"
          >
            Start Inspecting Today
          </Button>
        </div>
      </div>
    </div>
  );
}
