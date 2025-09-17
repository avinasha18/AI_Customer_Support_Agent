// API service for connecting to the backend
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface User {
  _id: string;
  email: string;
  firstName: string;
  lastName: string;
  createdAt: string;
  updatedAt: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface SignupRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export interface LoginResponse {
  user: User;
  token: string;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  createdAt: string;
}

export interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  model: string;
  createdAt: string;
  updatedAt: string;
}

export interface ChatRequest {
  message: string;
  conversationId?: string;
  model?: string;
  stream?: boolean;
}

export interface ChatResponse {
  message: string;
  conversationId: string;
  model: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export interface Model {
  id: string;
  name: string;
  provider: string;
  maxTokens: number;
  costPerToken?: number;
  description?: string;
}

class ApiService {
  private baseURL: string;
  private token: string | null = null;

  constructor() {
    this.baseURL = API_BASE_URL;
    this.token = localStorage.getItem('auth_token');
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseURL}${endpoint}`;
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      const data = await response.json();
      
      console.log('Raw fetch response data:', data);
      console.log('Response data type:', typeof data);
      console.log('Response data keys:', data && typeof data === 'object' ? Object.keys(data) : 'N/A');
      console.log('Response data is array:', Array.isArray(data));

      if (!response.ok) {
        throw new Error(data.error || `HTTP ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // Authentication methods
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const response = await this.request<{
      success: boolean;
      data: LoginResponse;
    }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });

    if (response.success && response.data) {
      const loginData = response.data as unknown as LoginResponse;
      this.token = loginData.token;
      localStorage.setItem('auth_token', loginData.token);
      localStorage.setItem('user_data', JSON.stringify(loginData.user));
      return loginData;
    }

    throw new Error('Login failed: No data received');
  }

  async signup(userData: SignupRequest): Promise<LoginResponse> {
    const response = await this.request<{
      success: boolean;
      data: LoginResponse;
    }>('/auth/signup', {
      method: 'POST',
      body: JSON.stringify(userData),
    });

    if (response.success && response.data) {
      const loginData = response.data as unknown as LoginResponse;
      this.token = loginData.token;
      localStorage.setItem('auth_token', loginData.token);
      localStorage.setItem('user_data', JSON.stringify(loginData.user));
      return loginData;
    }

    throw new Error('Signup failed: No data received');
  }

  async logout(): Promise<void> {
    try {
      await this.request('/auth/logout', {
        method: 'POST',
      });
    } catch (error) {
      console.error('Logout request failed:', error);
    } finally {
      this.token = null;
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user_data');
    }
  }

  async getProfile(): Promise<User> {
    const response = await this.request<{
      success: boolean;
      data: User;
    }>('/users/me');
    
    if (!response.success || !response.data) {
      throw new Error('No user data received');
    }
    return response.data as unknown as User;
  }

  // Chat methods
  async createConversation(): Promise<Conversation> {
    const response = await this.request<{
      success: boolean;
      data: Conversation;
    }>('/chat/conversation', {
      method: 'POST',
    });

    if (!response.success || !response.data) {
      throw new Error('No conversation data received');
    }
    return response.data as unknown as Conversation;
  }

  async sendMessage(chatRequest: ChatRequest): Promise<ChatResponse> {
    const response = await this.request<{
      success: boolean;
      data: ChatResponse;
    }>('/chat/send', {
      method: 'POST',
      body: JSON.stringify(chatRequest),
    });

    if (!response.success || !response.data) {
      throw new Error('No chat response received');
    }
    return response.data as unknown as ChatResponse;
  }

  async sendMessageStream(
    chatRequest: ChatRequest,
    onChunk: (content: string) => void,
    onComplete: (conversationId: string) => void,
    onError: (error: string) => void
  ): Promise<void> {
    const url = `${this.baseURL}/chat/send`;
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify({ ...chatRequest, stream: true }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      if (!response.body) {
        throw new Error('No response body received');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        // Check if value is valid for decoding
        if (!value || !(value instanceof Uint8Array)) {
          console.warn('Invalid stream value:', value);
          continue;
        }

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') {
              onComplete('');
              return;
            }

            try {
              const parsed = JSON.parse(data);
              console.log(parsed);
              if (parsed.type === 'conversation') {
                onComplete(parsed.conversationId);
              } else if (parsed.type === 'content') {
                onChunk(parsed.content);
              } else if (parsed.type === 'error') {
                onError(parsed.error);
                return;
              }
            } catch (error) {
              console.warn('Failed to parse streaming chunk:', data);
            }
          }
        }
      }
    } catch (error) {
      onError(error instanceof Error ? error.message : 'Streaming failed');
    }
  }

  async getConversationHistory(page: number = 1, limit: number = 10): Promise<{
    data: Conversation[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {
    const response = await this.request<{
      success: boolean;
      data: Conversation[];
      pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
      };
    }>(`/chat/history?page=${page}&limit=${limit}`) as any;

    // Handle the response format properly
    if (response.success && response.data) {
      // The server returns {success: true, data: [...], pagination: {...}}
      const serverData = response.data as any;
      if (Array.isArray(serverData)) {
        return {
          data: serverData,
          pagination: response.pagination || {
            page: 1,
            limit: 10,
            total: serverData.length,
            totalPages: 1
          }
        };
      }
    }
    
    // Fallback for empty response
    return {
      data: [],
      pagination: {
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 0
      }
    };
  }

  async getConversation(conversationId: string): Promise<Conversation> {
    const response = await this.request<{
      success: boolean;
      data: Conversation;
    }>(`/chat/${conversationId}`);
    if (!response.success || !response.data) {
      throw new Error('No conversation data received');
    }
    return response.data as unknown as Conversation;
  }

  async deleteConversation(conversationId: string): Promise<void> {
    await this.request(`/chat/${conversationId}`, {
      method: 'DELETE',
    });
  }

  async deleteEmptyConversations(): Promise<void> {
    await this.request('/chat/cleanup/empty', {
      method: 'DELETE',
    });
  }

  async renameConversation(conversationId: string, title: string): Promise<Conversation> {
    const response = await this.request<{
      success: boolean;
      data: Conversation;
    }>(`/chat/${conversationId}/rename`, {
      method: 'PUT',
      body: JSON.stringify({ title }),
    });

    if (!response.success || !response.data) {
      throw new Error('No conversation data received');
    }
    return response.data as unknown as Conversation;
  }

  async getModels(): Promise<Model[]> {
    try {
      console.log('Making request to /models endpoint...');
      const response = await this.request<{
        success: boolean;
        data: Model[];
      }>('/models');
      
      console.log('Raw models response:', response);
      console.log('Response data:', response.data);
      console.log('Response data type:', typeof response.data);
      
      if (!response.success || !response.data) {
        console.error('Response data is null/undefined');
        throw new Error('No data in response');
      }
      
      const modelsData = response.data as unknown as Model[];
      if (!Array.isArray(modelsData)) {
        console.error('Response data is not an array:', modelsData);
        throw new Error('Models data is not an array');
      }
      
      console.log('Models data:', modelsData);
      console.log('Models data type:', typeof modelsData);
      console.log('Models data is array:', Array.isArray(modelsData));
      
      return modelsData;
    } catch (error) {
      console.error('getModels API call failed:', error);
      console.error('Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        error: error
      });
      throw error;
    }
  }

  async getConversationStats(): Promise<{
    totalConversations: number;
    totalMessages: number;
    lastActivity: string | null;
  }> {
    const response = await this.request<{
      success: boolean;
      data: {
        totalConversations: number;
        totalMessages: number;
        lastActivity: string | null;
      };
    }>('/chat/stats');

    if (!response.success || !response.data) {
      throw new Error('No stats data received');
    }
    return response.data as unknown as {
      totalConversations: number;
      totalMessages: number;
      lastActivity: string | null;
    };
  }

  // Health check
  async healthCheck(): Promise<{
    status: string;
    timestamp: string;
    services: {
      ai: boolean;
    };
  }> {
    const response = await this.request<{
      success: boolean;
      data: {
        status: string;
        timestamp: string;
        services: {
          ai: boolean;
        };
      };
    }>('/health');

    if (!response.success || !response.data) {
      throw new Error('No health data received');
    }
    return response.data as unknown as {
      status: string;
      timestamp: string;
      services: {
        ai: boolean;
      };
    };
  }

  // Utility methods
  setToken(token: string): void {
    this.token = token;
    localStorage.setItem('auth_token', token);
  }

  clearToken(): void {
    this.token = null;
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_data');
  }

  isAuthenticated(): boolean {
    return !!this.token;
  }
}

export const apiService = new ApiService();
