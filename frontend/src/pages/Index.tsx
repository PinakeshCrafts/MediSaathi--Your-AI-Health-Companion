import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, FileImage, MessageSquare, Shield, Zap, Users, Lock } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const Index = () => {
  const { isAuthenticated, user } = useAuth();
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-hero py-20 md:py-32">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center space-y-6 animate-fade-in">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium">
              <Activity className="h-4 w-4" />
              AI-Powered Healthcare
            </div>
            <h1 className="text-4xl md:text-6xl font-bold leading-tight">
              Your Trusted Medical{" "}
              <span className="bg-gradient-primary bg-clip-text text-transparent">
                AI Assistant
              </span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
              Advanced AI technology for X-ray fracture detection and intelligent symptom
              analysis. Get preliminary health insights in seconds.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              {isAuthenticated ? (
                <>
                  <Link to="/xray-analysis">
                    <Button size="lg" className="w-full sm:w-auto shadow-lg">
                      <FileImage className="mr-2 h-5 w-5" />
                      Analyze X-ray
                    </Button>
                  </Link>
                  <Link to="/consultation">
                    <Button size="lg" variant="outline" className="w-full sm:w-auto">
                      <MessageSquare className="mr-2 h-5 w-5" />
                      Get Consultation
                    </Button>
                  </Link>
                </>
              ) : (
                <>
                  <Link to="/auth">
                    <Button size="lg" className="w-full sm:w-auto shadow-lg">
                      <Lock className="mr-2 h-5 w-5" />
                      Login to Analyze X-ray
                    </Button>
                  </Link>
                  <Link to="/auth">
                    <Button size="lg" variant="outline" className="w-full sm:w-auto">
                      <Lock className="mr-2 h-5 w-5" />
                      Login for Consultation
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Comprehensive AI Healthcare Services
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              State-of-the-art technology to assist with medical diagnostics and health consultations
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            <Card className="shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <div className="p-3 w-fit rounded-lg bg-primary/10 mb-4">
                  <FileImage className="h-8 w-8 text-primary" />
                </div>
                <CardTitle className="text-2xl">X-ray Fracture Detection</CardTitle>
                <CardDescription className="text-base">
                  Advanced AI model trained to detect and locate fractures in X-ray images
                  with high accuracy.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <Shield className="h-5 w-5 text-secondary shrink-0 mt-0.5" />
                    <span>Accurate fracture detection and localization</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Zap className="h-5 w-5 text-secondary shrink-0 mt-0.5" />
                    <span>Instant analysis with confidence scores</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Activity className="h-5 w-5 text-secondary shrink-0 mt-0.5" />
                    <span>Supports multiple X-ray image formats</span>
                  </li>
                </ul>
                {isAuthenticated ? (
                  <Link to="/xray-analysis">
                    <Button className="w-full mt-6">Try X-ray Analysis</Button>
                  </Link>
                ) : (
                  <Link to="/auth">
                    <Button className="w-full mt-6">
                      <Lock className="mr-2 h-4 w-4" />
                      Login to Try X-ray Analysis
                    </Button>
                  </Link>
                )}
              </CardContent>
            </Card>

            <Card className="shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <div className="p-3 w-fit rounded-lg bg-secondary/10 mb-4">
                  <MessageSquare className="h-8 w-8 text-secondary" />
                </div>
                <CardTitle className="text-2xl">AI Health Consultation</CardTitle>
                <CardDescription className="text-base">
                  Describe your symptoms and receive AI-powered preliminary health insights
                  and recommendations.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <Users className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <span>Natural language symptom analysis</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Zap className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <span>Powered by Google Gemini AI</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Activity className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <span>Comprehensive health recommendations</span>
                  </li>
                </ul>
                {isAuthenticated ? (
                  <Link to="/consultation">
                    <Button className="w-full mt-6" variant="secondary">
                      Start Consultation
                    </Button>
                  </Link>
                ) : (
                  <Link to="/auth">
                    <Button className="w-full mt-6" variant="secondary">
                      <Lock className="mr-2 h-4 w-4" />
                      Login to Start Consultation
                    </Button>
                  </Link>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-primary text-white">
        <div className="container mx-auto px-4 text-center">
          {isAuthenticated ? (
            <>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Welcome back, {user?.name}!
              </h2>
              <p className="text-lg mb-8 opacity-90 max-w-2xl mx-auto">
                You're all set to use MediBuddy's AI-powered health analysis features.
                Start with X-ray analysis or get a consultation.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link to="/xray-analysis">
                  <Button size="lg" variant="secondary" className="shadow-xl">
                    <FileImage className="mr-2 h-5 w-5" />
                    Analyze X-ray
                  </Button>
                </Link>
                <Link to="/consultation">
                  <Button size="lg" variant="outline" className="shadow-xl border-white text-white hover:bg-white hover:text-primary">
                    <MessageSquare className="mr-2 h-5 w-5" />
                    Get Consultation
                  </Button>
                </Link>
              </div>
            </>
          ) : (
            <>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Ready to Get Started?
              </h2>
              <p className="text-lg mb-8 opacity-90 max-w-2xl mx-auto">
                Join thousands of users who trust MediBuddy for preliminary health insights
                and diagnostics.
              </p>
              <Link to="/auth">
                <Button size="lg" variant="secondary" className="shadow-xl">
                  Create Free Account
                </Button>
              </Link>
            </>
          )}
        </div>
      </section>

      {/* Disclaimer */}
      <section className="py-8 bg-muted/50">
        <div className="container mx-auto px-4">
          <p className="text-sm text-center text-muted-foreground max-w-4xl mx-auto">
            <strong>Medical Disclaimer:</strong> MediBuddy provides AI-assisted preliminary
            health information and is not a substitute for professional medical advice,
            diagnosis, or treatment. Always consult with qualified healthcare providers
            for proper medical evaluation and care.
          </p>
        </div>
      </section>
    </div>
  );
};

export default Index;
