import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";
import { Upload, FileImage } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

const XrayAnalysis = () => {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>("");
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<{
    hasFracture: boolean;
    confidence: number;
    location?: string;
  } | null>(null);
  const { toast } = useToast();

  const extractBullets = (text: string): string[] => {
    if (!text) return [];
    const lines = text
      .split(/\n+/)
      .map((l) => l.trim().replace(/^[-*•\d.\)\s]+/, ""))
      .filter((l) => l.length > 0);

    const hasListLikeStructure = lines.length >= 2 && lines.some((l) => /\b(fracture|risk|recommend|advis|severity|location|findings|summary)\b/i.test(l));
    if (hasListLikeStructure) {
      return lines.slice(0, 5);
    }

    const sentences = text
      .replace(/\s+/g, " ")
      .split(/(?<=[.!?])\s+(?=[A-Z(])/)
      .map((s) => s.trim())
      .filter(Boolean);

    const prioritized: string[] = [];
    const picks = new Set<number>();

    const pushMatch = (re: RegExp, max = 2) => {
      for (let i = 0; i < sentences.length; i++) {
        if (picks.size >= 5) break;
        if (!picks.has(i) && re.test(sentences[i])) {
          prioritized.push(sentences[i]);
          picks.add(i);
          if (prioritized.length >= max) break;
        }
      }
    };

    pushMatch(/\b(fracture|break|crack|disruption)\b/i, 2);
    pushMatch(/\b(location|site|region|area)\b/i, 1);
    pushMatch(/\b(severity|displacement|comminuted|hairline|stable|unstable)\b/i, 1);
    pushMatch(/\b(recommend|advise|follow|next steps|refer|consult)\b/i, 2);

    for (let i = 0; i < sentences.length && prioritized.length < 5; i++) {
      if (!picks.has(i)) prioritized.push(sentences[i]);
    }

    return prioritized.slice(0, 5);
  };

  const colorize = (text: string) => {
    const patterns: { re: RegExp; className: string }[] = [
      { re: /\b(no fracture|negative|normal)\b/gi, className: "text-green-600 font-medium" },
      { re: /\b(fracture|break|positive)\b/gi, className: "text-red-600 font-semibold" },
      { re: /\b(possible|suspicious|likely|uncertain)\b/gi, className: "text-yellow-700" },
      { re: /\b(recommend|advise|follow up|consult)\b/gi, className: "text-primary font-medium" },
      { re: /\b(location|site|region|area)\b/gi, className: "text-blue-700" },
      { re: /\b(severity|displacement|stable|unstable)\b/gi, className: "text-purple-700" },
    ];

    let parts: Array<string | { text: string; className: string }> = [text];
    for (const { re, className } of patterns) {
      const next: typeof parts = [];
      for (const part of parts) {
        if (typeof part !== "string") {
          next.push(part);
          continue;
        }
        let lastIndex = 0;
        let match: RegExpExecArray | null;
        while ((match = re.exec(part)) !== null) {
          if (match.index > lastIndex) next.push(part.slice(lastIndex, match.index));
          next.push({ text: match[0], className });
          lastIndex = match.index + match[0].length;
        }
        if (lastIndex < part.length) next.push(part.slice(lastIndex));
      }
      parts = next;
    }

    return (
      <>
        {parts.map((p, i) =>
          typeof p === "string" ? (
            <span key={i}>{p}</span>
          ) : (
            <span key={i} className={p.className}>
              {p.text}
            </span>
          )
        )}
      </>
    );
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setResult(null);
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(selectedFile);
    }
  };

  const handleAnalyze = async () => {
    if (!file) {
      toast({
        title: "No file selected",
        description: "Please upload an X-ray image first.",
        variant: "destructive",
      });
      return;
    }

    setAnalyzing(true);
    try {
      const data = await api.analyzeXray(file);
      setResult({
        hasFracture: data.fracture_detected,
        confidence: data.confidence || 0.85,
        location: data.analysis,
      });
      
      toast({
        title: "Analysis Complete",
        description: "X-ray has been successfully analyzed using AI model.",
      });
    } catch (error) {
      console.error('X-ray analysis error:', error);
      let errorMessage = "Failed to analyze the X-ray. Please try again or contact support if the issue persists.";
      
      if (error instanceof Error) {
        if (error.message.includes('Access token required')) {
          errorMessage = "Authentication required. Please log in again.";
        } else if (error.message.includes('Invalid or expired token')) {
          errorMessage = "Your session has expired. Please log in again.";
        } else if (error.message.includes('HTTP error! status: 401')) {
          errorMessage = "Authentication failed. Please log in again.";
        } else {
          errorMessage = error.message;
        }
      }
      
      toast({
        title: "Analysis Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">X-ray Fracture Analysis</h1>
        <p className="text-muted-foreground">
          Upload an X-ray image to detect potential fractures using local AI model
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Upload X-ray Image</CardTitle>
            <CardDescription>
              Select an X-ray image file (JPEG, PNG) for analysis
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary transition-colors">
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
                id="file-upload"
              />
              <label
                htmlFor="file-upload"
                className="cursor-pointer flex flex-col items-center space-y-2"
              >
                {preview ? (
                  <img
                    src={preview}
                    alt="X-ray preview"
                    className="max-h-64 rounded-lg"
                  />
                ) : (
                  <>
                    <Upload className="h-12 w-12 text-muted-foreground" />
                    <div className="text-sm text-muted-foreground">
                      Click to upload or drag and drop
                    </div>
                  </>
                )}
              </label>
            </div>

            {file && (
              <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                <FileImage className="h-5 w-5 text-primary" />
                <span className="text-sm truncate flex-1">{file.name}</span>
              </div>
            )}

            <Button
              onClick={handleAnalyze}
              disabled={!file || analyzing}
              className="w-full"
              size="lg"
            >
              {analyzing ? "Analyzing..." : "Analyze X-ray"}
            </Button>
          </CardContent>
        </Card>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Analysis Results</CardTitle>
            <CardDescription>
              AI-powered fracture detection results
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!result ? (
              <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
                <FileImage className="h-16 w-16 mb-4 opacity-50" />
                <p>Upload and analyze an X-ray to see results</p>
              </div>
            ) : (
              <div className="space-y-4">
                {result.location && (
                  <div className="rounded-lg border p-4 bg-secondary/5">
                    <div className="text-sm font-semibold mb-2 text-foreground">AI Analysis Summary</div>
                    <ul className="space-y-2 text-sm">
                      {extractBullets(result.location).map((item, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="mt-1 h-2 w-2 rounded-full bg-primary/70" />
                          <span className="text-muted-foreground">{colorize(item)}</span>
                        </li>
                      ))}
                      {extractBullets(result.location).length === 0 && (
                        <li className="flex items-start gap-2">
                          <span className="mt-1 h-2 w-2 rounded-full bg-primary/70" />
                          <span className="text-muted-foreground">
                            {colorize(result.location.trim())}
                          </span>
                        </li>
                      )}
                    </ul>
                  </div>
                )}

                <Alert>
                  <AlertDescription>
                    <strong>Disclaimer:</strong> This is an AI-assisted analysis and
                    should not replace professional medical diagnosis. Please consult
                    with a qualified healthcare provider for proper evaluation.
                  </AlertDescription>
                </Alert>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default XrayAnalysis;