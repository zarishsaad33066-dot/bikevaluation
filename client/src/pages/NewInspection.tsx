import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { 
  insertInspectionSchema, 
  type InspectionFormData,
  type MotorcycleBrand,
  type MotorcycleModel 
} from "@shared/schema";
import { 
  Cog, 
  Square, 
  Zap, 
  Disc, 
  Car, 
  Camera,
  Save,
  CheckCircle,
  Minus,
  Plus,
  Upload
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ModelWithBrand extends MotorcycleModel {
  brand: MotorcycleBrand;
}

export default function NewInspection() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [selectedMake, setSelectedMake] = useState<string>("");
  const [counters, setCounters] = useState({
    minorScratches: 0,
    bigScratches: 0,
    smallDents: 0,
    bigDents: 0,
  });
  const [brakePadValue, setBrakePadValue] = useState([75]);
  const [treadValue, setTreadValue] = useState([80]);
  const [uploadedPhotos, setUploadedPhotos] = useState<Record<string, File | null>>({
    "Front View": null,
    "Rear View": null,
    "Left Side": null,
    "Odometer": null,
  });

  const form = useForm<InspectionFormData>({
    resolver: zodResolver(insertInspectionSchema),
    defaultValues: {
      engineData: {
        oilLeaks: "none",
        smoke: "none",
        abnormalNoise: false,
        hardStart: false,
        overheating: false,
      },
      frameData: {
        cracks: false,
        rust: false,
        bends: false,
        repaintMarks: false,
      },
      suspensionData: {
        leakage: false,
        stiffness: false,
        abnormalSound: false,
      },
      brakesData: {
        padRemaining: 75,
        discWarp: false,
        absStatus: true,
        fluidLeak: false,
      },
      tiresData: {
        treadRemaining: 80,
        cracks: false,
        mismatchedPair: false,
        ageOver5Years: false,
      },
      electricalsData: {
        lights: true,
        indicators: true,
        horn: true,
        starter: true,
        batteryCondition: "good",
      },
      bodyData: {
        minorScratches: 0,
        bigScratches: 0,
        smallDents: 0,
        bigDents: 0,
        cracks: false,
        repaintPanels: false,
        fairingCondition: "excellent",
      },
      documentsData: {
        registration: true,
        importPapers: true,
        serviceRecords: false,
      },
    },
  });

  // Fetch motorcycle brands
  const { data: brands } = useQuery<MotorcycleBrand[]>({
    queryKey: ["/api/motorcycle-brands"],
  });

  // Fetch motorcycle models
  const { data: allModels } = useQuery<ModelWithBrand[]>({
    queryKey: ["/api/motorcycle-models"],
  });

  // Filter models by selected make
  const availableModels = allModels?.filter(model => 
    model.brand.name.toLowerCase() === selectedMake.toLowerCase()
  ) || [];

  const createInspectionMutation = useMutation({
    mutationFn: async (data: InspectionFormData & { status?: string }) => {
      const response = await apiRequest("POST", "/api/inspections", data);
      return await response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Inspection Created",
        description: "Your inspection has been completed successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/inspections"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      setLocation(`/inspection/${data.id}/results`);
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
        description: "Failed to create inspection. Please try again.",
        variant: "destructive",
      });
    },
  });

  const saveDraftMutation = useMutation({
    mutationFn: async (data: InspectionFormData) => {
      const draftData = { ...data, status: "draft" };
      const response = await apiRequest("POST", "/api/inspections", draftData);
      return await response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Draft Saved",
        description: "Your inspection draft has been saved successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/inspections"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      setLocation(`/inspection/${data.id}`);
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
        description: "Failed to save draft. Please try again.",
        variant: "destructive",
      });
    },
  });

  const updateCounter = (field: keyof typeof counters, delta: number) => {
    setCounters(prev => {
      const newValue = Math.max(0, prev[field] + delta);
      const updatedCounters = { ...prev, [field]: newValue };
      
      // Update form data
      form.setValue("bodyData", {
        ...form.getValues("bodyData"),
        [field]: newValue,
      });
      
      return updatedCounters;
    });
  };

  const handleBrakePadChange = (value: number[]) => {
    setBrakePadValue(value);
    form.setValue("brakesData", {
      ...form.getValues("brakesData"),
      padRemaining: value[0],
    });
  };

  const handleTreadChange = (value: number[]) => {
    setTreadValue(value);
    form.setValue("tiresData", {
      ...form.getValues("tiresData"),
      treadRemaining: value[0],
    });
  };

  const handlePhotoUpload = (label: string, file: File) => {
    setUploadedPhotos(prev => ({
      ...prev,
      [label]: file
    }));
  };

  const handlePhotoClick = (label: string) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        handlePhotoUpload(label, file);
      }
    };
    input.click();
  };

  const onSubmit = (data: InspectionFormData) => {
    // Validate required fields
    if (!data.make || !data.model || !data.year || !data.chassisNo || !data.engineNo) {
      toast({
        title: "Missing Required Fields",
        description: "Please fill in Make, Model, Year, Chassis Number, and Engine Number.",
        variant: "destructive",
      });
      return;
    }

    // Include counter values in body data
    const finalData = {
      ...data,
      bodyData: {
        ...data.bodyData,
        ...counters,
      },
      status: "completed",
    };
    createInspectionMutation.mutate(finalData);
  };

  const handleSaveDraft = () => {
    const currentFormData = form.getValues();
    
    // For drafts, at least make/model/year should be filled
    if (!currentFormData.make || !currentFormData.model || !currentFormData.year) {
      toast({
        title: "Missing Basic Information",
        description: "Please select Make, Model, and Year before saving draft.",
        variant: "destructive",
      });
      return;
    }

    const finalData = {
      ...currentFormData,
      chassisNo: currentFormData.chassisNo || "DRAFT",
      engineNo: currentFormData.engineNo || "DRAFT", 
      bodyData: {
        ...currentFormData.bodyData,
        ...counters,
      },
      status: "draft",
    };
    saveDraftMutation.mutate(finalData);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8" data-testid="new-inspection-page">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">New Inspection</h1>
          <p className="text-muted-foreground mt-2">
            Complete a comprehensive motorcycle inspection
          </p>
        </div>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        {/* Bike Information Section */}
        <Card data-testid="card-bike-info">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Car className="w-5 h-5" />
              Bike Information
            </CardTitle>
            <CardDescription>
              Enter the basic details of the motorcycle
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div>
                <Label htmlFor="make">Make <span className="text-red-500">*</span></Label>
                <Select
                  onValueChange={(value) => {
                    setSelectedMake(value);
                    form.setValue("make", value);
                    form.setValue("model", ""); // Reset model when make changes
                  }}
                  data-testid="select-make"
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Make" />
                  </SelectTrigger>
                  <SelectContent>
                    {brands?.map((brand) => (
                      <SelectItem key={brand.id} value={brand.name}>
                        {brand.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="model">Model <span className="text-red-500">*</span></Label>
                <Select
                  onValueChange={(value) => form.setValue("model", value)}
                  disabled={!selectedMake}
                  data-testid="select-model"
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Model" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableModels.map((model) => (
                      <SelectItem key={model.id} value={model.name}>
                        {model.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="year">Year <span className="text-red-500">*</span></Label>
                <Select onValueChange={(value) => form.setValue("year", parseInt(value))} data-testid="select-year">
                  <SelectTrigger>
                    <SelectValue placeholder="Select Year" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - i).map((year) => (
                      <SelectItem key={year} value={year.toString()}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="chassisNo">Chassis Number <span className="text-red-500">*</span></Label>
                <Input
                  {...form.register("chassisNo")}
                  placeholder="Enter chassis number"
                  data-testid="input-chassis"
                />
              </div>

              <div>
                <Label htmlFor="engineNo">Engine Number <span className="text-red-500">*</span></Label>
                <Input
                  {...form.register("engineNo")}
                  placeholder="Enter engine number"
                  data-testid="input-engine"
                />
              </div>

              <div>
                <Label htmlFor="mileage">Mileage (KM)</Label>
                <Input
                  type="number"
                  {...form.register("mileage", { valueAsNumber: true })}
                  placeholder="Enter mileage"
                  data-testid="input-mileage"
                />
              </div>

              <div>
                <Label htmlFor="color">Color</Label>
                <Input
                  {...form.register("color")}
                  placeholder="Enter color"
                  data-testid="input-color"
                />
              </div>

              <div>
                <Label htmlFor="importSource">Import Source</Label>
                <Select onValueChange={(value) => form.setValue("importSource", value)} data-testid="select-import">
                  <SelectTrigger>
                    <SelectValue placeholder="Select Source" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="japan">Japan</SelectItem>
                    <SelectItem value="local">Local</SelectItem>
                    <SelectItem value="china">China</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Engine Inspection */}
        <Card data-testid="card-engine-inspection">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Cog className="w-5 h-5 text-primary" />
              Engine Inspection (Weight: 40%)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label className="text-sm font-medium">Oil Leaks</Label>
                <RadioGroup
                  defaultValue="none"
                  onValueChange={(value) => 
                    form.setValue("engineData.oilLeaks", value as "none" | "minor" | "major")
                  }
                  className="mt-2"
                  data-testid="radio-oil-leaks"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="none" id="oil-none" />
                    <Label htmlFor="oil-none">No Leaks</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="minor" id="oil-minor" />
                    <Label htmlFor="oil-minor">Minor Leaks</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="major" id="oil-major" />
                    <Label htmlFor="oil-major">Major Leaks</Label>
                  </div>
                </RadioGroup>
              </div>

              <div>
                <Label className="text-sm font-medium">Smoke Level</Label>
                <RadioGroup
                  defaultValue="none"
                  onValueChange={(value) => 
                    form.setValue("engineData.smoke", value as "none" | "light" | "heavy")
                  }
                  className="mt-2"
                  data-testid="radio-smoke"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="none" id="smoke-none" />
                    <Label htmlFor="smoke-none">No Smoke</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="light" id="smoke-light" />
                    <Label htmlFor="smoke-light">Light Smoke</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="heavy" id="smoke-heavy" />
                    <Label htmlFor="smoke-heavy">Heavy Smoke</Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="md:col-span-2">
                <Label className="text-sm font-medium">Engine Issues</Label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="abnormal-noise"
                      onCheckedChange={(checked) => 
                        form.setValue("engineData.abnormalNoise", !!checked)
                      }
                      data-testid="checkbox-abnormal-noise"
                    />
                    <Label htmlFor="abnormal-noise">Abnormal Noise</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="hard-start"
                      onCheckedChange={(checked) => 
                        form.setValue("engineData.hardStart", !!checked)
                      }
                      data-testid="checkbox-hard-start"
                    />
                    <Label htmlFor="hard-start">Hard Start</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="overheating"
                      onCheckedChange={(checked) => 
                        form.setValue("engineData.overheating", !!checked)
                      }
                      data-testid="checkbox-overheating"
                    />
                    <Label htmlFor="overheating">Overheating</Label>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Brakes Inspection */}
        <Card data-testid="card-brakes-inspection">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Disc className="w-5 h-5 text-destructive" />
              Brakes Inspection (Weight: 10%)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label className="text-sm font-medium">Brake Pad Remaining (%)</Label>
                <div className="mt-4">
                  <Slider
                    value={brakePadValue}
                    onValueChange={handleBrakePadChange}
                    max={100}
                    step={5}
                    className="w-full"
                    data-testid="slider-brake-pad"
                  />
                  <div className="flex justify-between text-sm text-muted-foreground mt-2">
                    <span>0%</span>
                    <span className="font-medium text-foreground" data-testid="brake-pad-value">
                      {brakePadValue[0]}%
                    </span>
                    <span>100%</span>
                  </div>
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium">Brake Issues</Label>
                <div className="space-y-3 mt-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="disc-warp"
                      onCheckedChange={(checked) => 
                        form.setValue("brakesData.discWarp", !!checked)
                      }
                      data-testid="checkbox-disc-warp"
                    />
                    <Label htmlFor="disc-warp">Disc Warp</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="fluid-leak"
                      onCheckedChange={(checked) => 
                        form.setValue("brakesData.fluidLeak", !!checked)
                      }
                      data-testid="checkbox-fluid-leak"
                    />
                    <Label htmlFor="fluid-leak">Fluid Leak</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="abs-issue"
                      onCheckedChange={(checked) => 
                        form.setValue("brakesData.absStatus", !checked)
                      }
                      data-testid="checkbox-abs-issue"
                    />
                    <Label htmlFor="abs-issue">ABS Issue</Label>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Body/Exterior Inspection */}
        <Card data-testid="card-body-inspection">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Square className="w-5 h-5 text-warning" />
              Body/Exterior Inspection (Weight: 8%)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {Object.entries(counters).map(([key, value]) => (
                <div key={key}>
                  <Label className="text-sm font-medium">
                    {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())} Count
                  </Label>
                  <div className="flex items-center gap-3 mt-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="w-8 h-8 p-0"
                      onClick={() => updateCounter(key as keyof typeof counters, -1)}
                      data-testid={`button-decrease-${key}`}
                    >
                      <Minus className="w-4 h-4" />
                    </Button>
                    <span className="font-medium text-foreground min-w-[2rem] text-center" data-testid={`counter-${key}`}>
                      {value}
                    </span>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="w-8 h-8 p-0"
                      onClick={() => updateCounter(key as keyof typeof counters, 1)}
                      data-testid={`button-increase-${key}`}
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
              <div>
                <Label className="text-sm font-medium">Condition Issues</Label>
                <div className="space-y-3 mt-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="body-cracks"
                      onCheckedChange={(checked) => 
                        form.setValue("bodyData.cracks", !!checked)
                      }
                      data-testid="checkbox-body-cracks"
                    />
                    <Label htmlFor="body-cracks">Cracks</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="repaint-panels"
                      onCheckedChange={(checked) => 
                        form.setValue("bodyData.repaintPanels", !!checked)
                      }
                      data-testid="checkbox-repaint-panels"
                    />
                    <Label htmlFor="repaint-panels">Repaint Panels</Label>
                  </div>
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium">Fairing Condition</Label>
                <Select
                  defaultValue="excellent"
                  onValueChange={(value) => 
                    form.setValue("bodyData.fairingCondition", value as "excellent" | "good" | "fair" | "poor")
                  }
                  data-testid="select-fairing"
                >
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="excellent">Excellent</SelectItem>
                    <SelectItem value="good">Good</SelectItem>
                    <SelectItem value="fair">Fair</SelectItem>
                    <SelectItem value="poor">Poor</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Photo Upload Section */}
        <Card data-testid="card-photo-upload">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Camera className="w-5 h-5 text-primary" />
              Bike Photos
            </CardTitle>
            <CardDescription>
              Upload photos of the motorcycle from different angles
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {["Front View", "Rear View", "Left Side", "Odometer"].map((label) => {
                const hasPhoto = uploadedPhotos[label];
                return (
                  <div
                    key={label}
                    onClick={() => handlePhotoClick(label)}
                    className={cn(
                      "border-2 border-dashed rounded-lg p-6 text-center hover:border-primary transition-colors cursor-pointer",
                      hasPhoto ? "border-green-500 bg-green-50" : "border-border"
                    )}
                    data-testid={`upload-${label.toLowerCase().replace(" ", "-")}`}
                  >
                    {hasPhoto ? (
                      <>
                        <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
                        <p className="text-sm text-green-700 font-medium">{label}</p>
                        <p className="text-xs text-green-600 mt-1">Uploaded</p>
                      </>
                    ) : (
                      <>
                        <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                        <p className="text-sm text-muted-foreground">{label}</p>
                        <p className="text-xs text-muted-foreground mt-1">Click to upload</p>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Submit Section */}
        <div className="flex gap-4 justify-end">
          <Button 
            type="button" 
            variant="outline"
            onClick={handleSaveDraft}
            disabled={saveDraftMutation.isPending}
            data-testid="button-save-draft"
          >
            {saveDraftMutation.isPending ? (
              "Saving..."
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save Draft
              </>
            )}
          </Button>
          <Button 
            type="submit"
            disabled={createInspectionMutation.isPending}
            data-testid="button-complete-inspection"
          >
            {createInspectionMutation.isPending ? (
              "Processing..."
            ) : (
              <>
                <CheckCircle className="w-4 h-4 mr-2" />
                Complete Inspection
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
