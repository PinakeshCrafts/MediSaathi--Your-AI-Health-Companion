const API_BASE_URL = (import.meta as any)?.env?.VITE_API_URL || '/api';

export const getAuthToken = () => localStorage.getItem('token');

export const setAuthToken = (token: string) => localStorage.setItem('token', token);

export const clearAuthToken = () => localStorage.removeItem('token');

const fetchWithAuth = async (url: string, options: RequestInit = {}) => {
  const token = getAuthToken();

  const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData;

  const headers: HeadersInit = {
    ...(options.headers || {}),
  };

  // Only set JSON content-type when not sending FormData
  if (!isFormData) {
    headers['Content-Type'] = headers['Content-Type'] || 'application/json';
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${url}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    // Try to parse JSON error; fallback to text
    let message = `HTTP error! status: ${response.status}`;
    try {
      const errJson = await response.json();
      message = errJson.message || errJson.error || message;
    } catch (_) {
      try {
        const errText = await response.text();
        if (errText) message = errText;
      } catch {}
    }
    throw new Error(message);
  }

  // Attempt JSON; fallback to text
  try {
    return await response.json();
  } catch {
    return await response.text();
  }
};

export const api = {
  // Auth endpoints
  signup: async (name: string, email: string, password: string) => {
    return fetchWithAuth('/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
    });
  },

  login: async (email: string, password: string) => {
    return fetchWithAuth('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },

  getProfile: async () => {
    return fetchWithAuth('/auth/profile');
  },

  // X-ray analysis using backend API
  analyzeXray: async (file: File) => {
    const formData = new FormData();
    formData.append('image', file);

    const response = await fetchWithAuth('/analyze/xray', {
      method: 'POST',
      body: formData,
    });
    // Check if there are any detections with high confidence
    const hasFracture = response.detections?.some((detection: any) => 
      detection.confidence > 0.5
    ) || false;

    return {
      analysis: response.analysis,
      confidence: response.confidence || 0.85,
      fracture_detected: hasFracture,
      probability: response.confidence || 0.5,
      detections: response.detections || [],
      numDetections: response.numDetections || 0
    };
  },

  // Symptom analysis
  analyzeSymptoms: async (symptoms: string, duration?: string, severity?: string, additionalInfo?: string) => {
    return fetchWithAuth('/analyze/symptoms', {
      method: 'POST',
      body: JSON.stringify({ symptoms, duration, severity, additionalInfo }),
    });
  },

  // Chat
  chat: async (message: string, chatId?: string) => {
    return fetchWithAuth('/chat', {
      method: 'POST',
      body: JSON.stringify({ message, chatId }),
    });
  },

  // History
  getAnalysisHistory: async (type?: string, limit?: number) => {
    const params = new URLSearchParams();
    if (type) params.append('type', type);
    if (limit) params.append('limit', limit.toString());
    return fetchWithAuth(`/history/analysis?${params.toString()}`);
  },
  
  getChatHistory: async (limit?: number) => {
    const params = new URLSearchParams();
    if (limit) params.append('limit', limit.toString());
    return fetchWithAuth(`/history/chat?${params.toString()}`);
  },
};
