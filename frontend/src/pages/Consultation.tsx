import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";
import { MessageSquare, Loader2, Stethoscope } from "lucide-react";

const Consultation = () => {
  const [symptoms, setSymptoms] = useState("");
  const [diagnosis, setDiagnosis] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const commonSymptoms = [
    { label: "Fever", color: "bg-rose-50 text-rose-700 hover:bg-rose-100" },
    { label: "Cough", color: "bg-amber-50 text-amber-700 hover:bg-amber-100" },
    { label: "Headache", color: "bg-sky-50 text-sky-700 hover:bg-sky-100" },
    { label: "Sore throat", color: "bg-indigo-50 text-indigo-700 hover:bg-indigo-100" },
    { label: "Fatigue", color: "bg-emerald-50 text-emerald-700 hover:bg-emerald-100" },
    { label: "Nausea", color: "bg-fuchsia-50 text-fuchsia-700 hover:bg-fuchsia-100" },
    { label: "Vomiting", color: "bg-pink-50 text-pink-700 hover:bg-pink-100" },
    { label: "Diarrhea", color: "bg-teal-50 text-teal-700 hover:bg-teal-100" },
    { label: "Shortness of breath", color: "bg-red-50 text-red-700 hover:bg-red-100" },
    { label: "Chest pain", color: "bg-orange-50 text-orange-700 hover:bg-orange-100" },
    { label: "Back pain", color: "bg-lime-50 text-lime-700 hover:bg-lime-100" },
    { label: "Abdominal pain", color: "bg-cyan-50 text-cyan-700 hover:bg-cyan-100" },
    { label: "Dizziness", color: "bg-violet-50 text-violet-700 hover:bg-violet-100" },
    { label: "Rash", color: "bg-stone-50 text-stone-700 hover:bg-stone-100" },
  ];

  const handleAddSymptom = (text: string) => {
    const tokens = symptoms.split(/,\s*/).filter(Boolean);
    if (tokens.map(t => t.toLowerCase()).includes(text.toLowerCase())) return;
    const next = tokens.length === 0 ? text : `${symptoms.trim().replace(/,+\s*$/, "")} , ${text}`.replace(/\s+,/g, ",");
    setSymptoms(next);
  };

  const handleConsultation = async () => {
    if (!symptoms.trim()) {
      toast({
        title: "No symptoms entered",
        description: "Please describe your symptoms to get a consultation.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    setDiagnosis("");

    try {
      const data = await api.analyzeSymptoms(symptoms, "user input", "moderate", "");
      setDiagnosis(data.analysis || "<div class=\"text-sm text-muted-foreground\">Analysis complete. Please consult a healthcare provider.</div>");
      
      toast({
        title: "Consultation Complete",
        description: "AI analysis of your symptoms is ready.",
      });
    } catch (error) {
      toast({
        title: "Consultation Failed",
        description: error instanceof Error ? error.message : "Failed to analyze symptoms. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">AI Health Consultation</h1>
        <p className="text-muted-foreground">
          Describe your symptoms and get AI-powered preliminary health insights
        </p>
      </div>

      <div className="grid gap-6">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Stethoscope className="h-5 w-5 text-primary" />
              Describe Your Symptoms
            </CardTitle>
            <CardDescription>
              Please provide detailed information about what you're experiencing
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="text-sm font-medium text-muted-foreground">Common symptoms</div>
              <div className="flex flex-wrap gap-2">
                {commonSymptoms.map((s) => (
                  <Button
                    key={s.label}
                    type="button"
                    variant="outline"
                    size="sm"
                    className={`${s.color} border-transparent`}
                    onClick={() => handleAddSymptom(s.label)}
                    disabled={loading}
                  >
                    {s.label}
                  </Button>
                ))}
              </div>
            </div>
            <Textarea
              placeholder="Example: I have been experiencing headaches for the past 3 days, along with mild fever and fatigue..."
              value={symptoms}
              onChange={(e) => setSymptoms(e.target.value)}
              className="min-h-[150px]"
            />
            <Button
              onClick={handleConsultation}
              disabled={loading || !symptoms.trim()}
              className="w-full"
              size="lg"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <MessageSquare className="mr-2 h-4 w-4" />
                  Get AI Consultation
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {diagnosis && (
          <Card className="shadow-lg border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-primary">
                <MessageSquare className="h-5 w-5" />
                AI Consultation Results
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose prose-sm max-w-none">
                <div
                  className="text-sm leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: diagnosis }}
                />
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="border-secondary/50 bg-secondary/5">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <div className="mt-0.5">
                <svg
                  className="h-5 w-5 text-secondary"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div className="text-sm text-muted-foreground">
                <strong className="text-foreground">Medical Disclaimer:</strong> This AI
                consultation tool provides general health information and preliminary
                insights only. It is not a substitute for professional medical advice,
                diagnosis, or treatment. Always seek the advice of your physician or other
                qualified health provider with any questions you may have regarding a
                medical condition.
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Consultation;
