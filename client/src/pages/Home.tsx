import { useLocation } from "wouter";
import { useEffect } from "react";
import Dashboard from "./Dashboard";

export default function Home() {
  const [, setLocation] = useLocation();

  useEffect(() => {
    // Redirect to dashboard as the default authenticated view
    setLocation("/dashboard");
  }, [setLocation]);

  // Fallback to dashboard component
  return <Dashboard />;
}
