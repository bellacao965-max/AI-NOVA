// API client for NOVA AI backend integration

export interface APIError extends Error {
  status: number;
}

async function apiCall<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const response = await fetch(`/api${endpoint}`, {
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
    ...options,
  });

  if (!response.ok) {
    const error = new Error(`${response.status}: ${response.statusText}`) as APIError;
    error.status = response.status;
    throw error;
  }

  return response.json();
}

export const api = {
  // Auth
  getUser: async () => apiCall<any>("/auth/user"),
  login: () => {
    window.location.href = "/api/login";
  },
  logout: () => {
    window.location.href = "/api/logout";
  },

  // Conversations
  getConversations: async () => apiCall<any[]>("/conversations"),
  createConversation: async (data: { title: string; messages: any[] }) =>
    apiCall<any>("/conversations", { method: "POST", body: JSON.stringify(data) }),
  getConversation: async (id: string) => apiCall<any>(`/conversations/${id}`),
  updateConversation: async (id: string, data: any) =>
    apiCall<any>(`/conversations/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  deleteConversation: async (id: string) =>
    apiCall<any>(`/conversations/${id}`, { method: "DELETE" }),

  // Image generation
  generateImage: async (prompt: string) =>
    apiCall<any>("/generate-image", { method: "POST", body: JSON.stringify({ prompt }) }),
  getGeneratedImages: async () => apiCall<any[]>("/generated-images"),

  // Real-time data APIs
  getWeather: async (location: string) => apiCall<any>(`/weather/${encodeURIComponent(location)}`),
  getFinance: async (symbol: string) => apiCall<any>(`/finance/${encodeURIComponent(symbol)}`),
  getSports: async (topic: string) => apiCall<any>(`/sports/${encodeURIComponent(topic)}`),

  // Learning tracking
  recordLearning: async (data: { topic: string; sentimentScore?: number }) =>
    apiCall<any>("/learning", { method: "POST", body: JSON.stringify(data) }),
  getLearning: async () => apiCall<any[]>("/learning"),

  // Gemini AI Chat (GRATIS!)
  geminiChat: async (message: string) =>
    apiCall<any>("/chat", { method: "POST", body: JSON.stringify({ message }) }),
};

export function isUnauthorizedError(error: unknown): boolean {
  if (error instanceof Error) {
    const apiError = error as APIError;
    return apiError.status === 401;
  }
  return false;
}
