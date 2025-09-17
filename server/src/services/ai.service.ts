import axios, { AxiosResponse } from 'axios';
import { config, DEFAULT_SYSTEM_PROMPT } from '@/config';
import {
  IOpenRouterRequest,
  IOpenRouterResponse,
  IOpenRouterMessage,
  IOpenRouterStreamChunk,
} from '@/types';
import { logger } from '@/utils/logger';

export class AIService {
  private readonly baseUrl: string;
  private readonly apiKey: string;
  private readonly timeout: number = 60000; // 60 seconds

  constructor() {
    this.baseUrl = config.openRouterBaseUrl;
    this.apiKey = config.openRouterApiKey;
    
    logger.info('AI Service initialized', {
      baseUrl: this.baseUrl,
      apiKeyLength: this.apiKey ? this.apiKey.length : 0,
      apiKeyPrefix: this.apiKey ? this.apiKey.substring(0, 8) + '...' : 'NOT_SET'
    });
  }

  /**
   * Send a message to OpenRouter and get a response
   */
  async sendMessage(
    model: string,
    messages: IOpenRouterMessage[],
    options: {
      temperature?: number;
      maxTokens?: number;
      extraHeaders?: Record<string, string>;
      extraBody?: Record<string, unknown>;
    } = {}
  ): Promise<IOpenRouterResponse> {
    try {
      logger.info('AI Service sendMessage called', {
        model,
        messageCount: messages.length,
        apiKeySet: !!this.apiKey,
        baseUrl: this.baseUrl,
        options
      });

      if (!this.apiKey) {
        throw new Error('OpenRouter API key is not set');
      }

      const requestData: IOpenRouterRequest = {
        model,
        messages: this.prepareMessages(messages),
        temperature: options.temperature ?? 0.7,
        max_tokens: options.maxTokens ?? 1000,
        ...options.extraBody,
      };

      const headers = {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': config.appUrl,
        'X-Title': 'ViralLens Chatbot',
        ...options.extraHeaders,
      };

      logger.info('Sending request to OpenRouter', {
        model,
        messageCount: messages.length,
        temperature: requestData.temperature,
        maxTokens: requestData.max_tokens,
      });

      logger.info('Making axios request to OpenRouter', {
        url: `${this.baseUrl}/chat/completions`,
        requestData: {
          model: requestData.model,
          messageCount: requestData.messages.length,
          temperature: requestData.temperature,
          maxTokens: requestData.max_tokens
        },
        headers: {
          'Authorization': `Bearer ${this.apiKey.substring(0, 8)}...`,
          'Content-Type': headers['Content-Type'],
          'HTTP-Referer': headers['HTTP-Referer'],
          'X-Title': headers['X-Title']
        },
        timeout: this.timeout
      });

      const response: AxiosResponse<IOpenRouterResponse> = await axios.post(
        `${this.baseUrl}/chat/completions`,
        requestData,
        {
          headers,
          timeout: this.timeout,
        }
      );

      logger.info('Received response from OpenRouter', {
        model,
        status: response.status,
        statusText: response.statusText,
        usage: response.data.usage,
        finishReason: response.data.choices[0]?.finish_reason,
        responseData: response.data
      });

      return response.data;
    } catch (error) {
      logger.error('OpenRouter API error', {
        model,
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        isAxiosError: error && typeof error === 'object' && 'isAxiosError' in error,
        axiosError: error && typeof error === 'object' && 'isAxiosError' in error ? {
          status: (error as any).response?.status,
          statusText: (error as any).response?.statusText,
          data: (error as any).response?.data,
          config: {
            url: (error as any).config?.url,
            method: (error as any).config?.method,
            headers: (error as any).config?.headers
          }
        } : null
      });

      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
          throw new Error('Invalid OpenRouter API key');
        } else if (error.response?.status === 429) {
          throw new Error('Rate limit exceeded. Please try again later.');
        } else if (error.response?.status === 500) {
          throw new Error('OpenRouter service is temporarily unavailable');
        } else if (error.code === 'ECONNABORTED') {
          throw new Error('Request timeout. Please try again.');
        }
      }

      throw new Error('Failed to get AI response. Please try again.');
    }
  }

  /**
   * Stream a message to OpenRouter and get streaming response
   */
  async streamMessage(
    model: string,
    messages: IOpenRouterMessage[],
    options: {
      temperature?: number;
      maxTokens?: number;
      extraHeaders?: Record<string, string>;
      extraBody?: Record<string, unknown>;
    } = {}
  ): Promise<ReadableStream<IOpenRouterStreamChunk>> {
    try {
      logger.info('AI Service streamMessage called', {
        model,
        messageCount: messages.length,
        apiKeySet: !!this.apiKey,
        baseUrl: this.baseUrl,
        options
      });

      if (!this.apiKey) {
        throw new Error('OpenRouter API key is not set');
      }

      const requestData: IOpenRouterRequest = {
        model,
        messages: this.prepareMessages(messages),
        stream: true,
        temperature: options.temperature ?? 0.7,
        max_tokens: options.maxTokens ?? 1000,
        ...options.extraBody,
      };

      const headers = {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': config.appUrl,
        'X-Title': 'ViralLens Chatbot',
        ...options.extraHeaders,
      };

      logger.info('Starting streaming request to OpenRouter', {
        model,
        messageCount: messages.length,
        requestData: {
          model: requestData.model,
          messageCount: requestData.messages.length,
          temperature: requestData.temperature,
          maxTokens: requestData.max_tokens,
          stream: requestData.stream,
          messages: requestData.messages.map(msg => ({
            role: msg.role,
            contentLength: msg.content.length,
            contentPreview: msg.content.substring(0, 100) + (msg.content.length > 100 ? '...' : '')
          }))
        },
        headers: {
          'Authorization': `Bearer ${this.apiKey.substring(0, 8)}...`,
          'Content-Type': headers['Content-Type'],
          'HTTP-Referer': headers['HTTP-Referer'],
          'X-Title': headers['X-Title']
        }
      });

      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers,
        body: JSON.stringify(requestData),
      });

      logger.info('Received streaming response from OpenRouter', {
        model,
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        ok: response.ok
      });

      if (!response.ok) {
        const errorData = await response.text();
        logger.error('OpenRouter streaming error - HTTP Error', {
          status: response.status,
          statusText: response.statusText,
          errorData: errorData,
          model,
          messageCount: messages.length,
          url: `${this.baseUrl}/chat/completions`,
          requestHeaders: headers
        });
        
        // Try to parse error data as JSON for more details
        let parsedError;
        try {
          parsedError = JSON.parse(errorData);
        } catch {
          parsedError = errorData;
        }
        
        throw new Error(`OpenRouter API error (${response.status}): ${JSON.stringify(parsedError)}`);
      }

      if (!response.body) {
        logger.error('OpenRouter streaming error - No response body', {
          model,
          status: response.status,
          statusText: response.statusText
        });
        throw new Error('No response body received from OpenRouter');
      }

      logger.info('Successfully established streaming connection', {
        model,
        messageCount: messages.length
      });

      return this.parseStreamResponse(response.body);
    } catch (error) {
      logger.error('OpenRouter streaming error - Exception', {
        model,
        messageCount: messages.length,
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        isAxiosError: error && typeof error === 'object' && 'isAxiosError' in error,
        errorType: error?.constructor?.name
      });
      throw error;
    }
  }

  /**
   * Parse streaming response from OpenRouter
   */
  private async parseStreamResponse(
    body: ReadableStream<Uint8Array>
  ): Promise<ReadableStream<IOpenRouterStreamChunk>> {
    const reader = body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    return new ReadableStream({
      start(controller) {
        function pump(): Promise<void> {
          return reader.read().then(({ done, value }) => {
            if (done) {
              logger.info('Stream parsing completed - stream ended');
              controller.close();
              return;
            }

            try {
              // Validate the value before decoding
              if (!value || !(value instanceof Uint8Array)) {
                logger.warn('Invalid stream value received', { 
                  valueType: typeof value,
                  value: value
                });
                return pump();
              }
              
              const chunk = decoder.decode(value, { stream: true });
              buffer += chunk;
              
              // Split by newlines and process each line
              const lines = buffer.split('\n');
              // Keep the last incomplete line in buffer
              buffer = lines.pop() || '';

              for (const line of lines) {
                const trimmedLine = line.trim();
                
                if (trimmedLine.startsWith('data: ')) {
                  const data = trimmedLine.slice(6).trim();
                  
                  if (data === '[DONE]') {
                    logger.info('Stream parsing completed - received [DONE]');
                    controller.close();
                    return;
                  }

                  if (data === '') {
                    // Empty data line, skip
                    continue;
                  }

                  try {
                    const parsed: IOpenRouterStreamChunk = JSON.parse(data);
                    
                    // Validate the parsed chunk structure
                    if (parsed && typeof parsed === 'object') {
                      logger.debug('Parsed streaming chunk', {
                        id: parsed.id,
                        model: parsed.model,
                        choicesCount: parsed.choices?.length || 0,
                        hasContent: parsed.choices?.[0]?.delta?.content !== undefined
                      });
                      
                      controller.enqueue(parsed);
                    } else {
                      logger.warn('Invalid chunk structure', { data, parsed });
                    }
                  } catch (parseError) {
                    logger.warn('Failed to parse streaming chunk', { 
                      data, 
                      error: parseError instanceof Error ? parseError.message : 'Unknown parse error',
                      stack: parseError instanceof Error ? parseError.stack : undefined
                    });
                  }
                } else if (trimmedLine !== '') {
                  // Non-data line, log for debugging
                  logger.debug('Non-data line in stream', { line: trimmedLine });
                }
              }

              return pump();
            } catch (decodeError) {
              logger.error('Error decoding stream chunk', {
                error: decodeError instanceof Error ? decodeError.message : 'Unknown decode error',
                stack: decodeError instanceof Error ? decodeError.stack : undefined
              });
              controller.error(decodeError);
              return;
            }
          }).catch((error) => {
            logger.error('Error in stream pump', {
              error: error instanceof Error ? error.message : 'Unknown error',
              stack: error instanceof Error ? error.stack : undefined
            });
            controller.error(error);
          });
        }

        return pump();
      },
    });
  }

  /**
   * Prepare messages with system prompt if not present
   */
  private prepareMessages(messages: IOpenRouterMessage[]): IOpenRouterMessage[] {
    const hasSystemMessage = messages.some(msg => msg.role === 'system');
    
    if (!hasSystemMessage) {
      return [
        { role: 'system', content: DEFAULT_SYSTEM_PROMPT },
        ...messages,
      ];
    }

    return messages;
  }

  /**
   * Extract content from OpenRouter response
   */
  extractContent(response: IOpenRouterResponse): string {
    if (!response.choices || response.choices.length === 0) {
      throw new Error('No response choices received from OpenRouter');
    }

    const choice = response.choices[0];
    if (!choice?.message?.content) {
      throw new Error('No content in response from OpenRouter');
    }

    return choice.message.content;
  }

  /**
   * Extract usage information from OpenRouter response
   */
  extractUsage(response: IOpenRouterResponse): {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  } | null {
    if (!response.usage) {
      return null;
    }

    return {
      promptTokens: response.usage.prompt_tokens,
      completionTokens: response.usage.completion_tokens,
      totalTokens: response.usage.total_tokens,
    };
  }

  /**
   * Validate model is supported
   */
  validateModel(model: string): boolean {
    // This could be expanded to check against a list of supported models
    return typeof model === 'string' && model.length > 0;
  }

  /**
   * Get default model
   */
  getDefaultModel(): string {
    return 'meta-llama/llama-3.3-70b-instruct:free';
  }

  /**
   * Test connection to OpenRouter
   */
  async testConnection(): Promise<boolean> {
    try {
      await this.sendMessage(
        this.getDefaultModel(),
        [{ role: 'user', content: 'Hello' }],
        { maxTokens: 10 }
      );
      return true;
    } catch (error) {
      logger.error('OpenRouter connection test failed', { error });
      return false;
    }
  }
}

// Export singleton instance
export const aiService = new AIService();
