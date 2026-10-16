export type InputType = "message" | "url" | "transcript";
export type RiskLevel = "low" | "medium" | "high";
export type DetectionMethod = "local-rules" | "backend-rules" | "ai-provider";
export type Language = "en" | "te" | "hi" | "ta" | "kn";
export type AppRoute = "Home" | "Scan" | "Result" | "History" | "Assistant" | "Safety" | "Profile";

export interface ScanInput {
  type: InputType;
  content: string;
}

export interface WarningSignal {
  id: string;
  title: string;
  explanation: string;
}

export interface ScanResult {
  id: string;
  score: number;
  level: RiskLevel;
  summary: string;
  signals: WarningSignal[];
  recommendations: string[];
  method: DetectionMethod;
  analysisNote?: "ai-fallback";
  speechText?: string;
  analyzedAt: string;
}

export interface ScanHistoryRecord {
  id: string;
  inputType: InputType;
  score: number;
  level: RiskLevel;
  explanation: string;
  method: DetectionMethod;
  scannedAt: string;
}

export interface AnalyzeRequest extends ScanInput {
  language?: Language;
}

export interface AnalyzeResultPayload {
  riskScore: number;
  riskLevel: RiskLevel;
  summary: string;
  signals: WarningSignal[];
  recommendations: string[];
  analysisMethod: DetectionMethod;
  analysisNote?: "ai-fallback";
  speechText?: string;
  modelVersion?: string;
}

export interface AnalyzeResponse {
  result: AnalyzeResultPayload;
}

export interface AnalysisProvider {
  analyze(input: AnalyzeRequest, signal: AbortSignal): Promise<AnalyzeResultPayload>;
}

export type ThemePreference = "light" | "dark" | "system";