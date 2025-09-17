/**
 * Example usage of OpenRouter AI service
 * This file demonstrates how to use the AI service in your application
 */

import { aiService } from '../src/services/ai.service';
import { IOpenRouterMessage } from '../src/types';

// Example 1: Simple chat completion
async function simpleChat() {
  try {
    const messages: IOpenRouterMessage[] = [
      { role: 'user', content: 'What is the meaning of life?' }
    ];

    const response = await aiService.sendMessage(
      'meta-llama/llama-3.3-70b-instruct:free',
      messages,
      {
        temperature: 0.7,
        maxTokens: 1000,
      }
    );

    const content = aiService.extractContent(response);
    const usage = aiService.extractUsage(response);

    console.log('AI Response:', content);
    console.log('Token Usage:', usage);
  } catch (error) {
    console.error('Error:', error);
  }
}

// Example 2: Conversation with context
async function conversationWithContext() {
  try {
    const messages: IOpenRouterMessage[] = [
      { role: 'system', content: 'You are a helpful customer support assistant.' },
      { role: 'user', content: 'I have an issue with my order' },
      { role: 'assistant', content: 'I\'d be happy to help you with your order. Can you please provide your order number?' },
      { role: 'user', content: 'My order number is #12345' }
    ];

    const response = await aiService.sendMessage(
      'meta-llama/llama-3.3-70b-instruct:free',
      messages,
      {
        temperature: 0.5,
        maxTokens: 500,
      }
    );

    const content = aiService.extractContent(response);
    console.log('Customer Support Response:', content);
  } catch (error) {
    console.error('Error:', error);
  }
}

// Example 3: Streaming response
async function streamingChat() {
  try {
    const messages: IOpenRouterMessage[] = [
      { role: 'user', content: 'Tell me a story about a robot' }
    ];

    const stream = await aiService.streamMessage(
      'meta-llama/llama-3.3-70b-instruct:free',
      messages,
      {
        temperature: 0.8,
        maxTokens: 2000,
      }
    );

    const reader = stream.getReader();
    const decoder = new TextDecoder();

    console.log('Streaming response:');
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      const lines = chunk.split('\n');

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          if (data === '[DONE]') {
            console.log('\n[Stream completed]');
            return;
          }

          try {
            const parsed = JSON.parse(data);
            if (parsed.choices?.[0]?.delta?.content) {
              process.stdout.write(parsed.choices[0].delta.content);
            }
          } catch (error) {
            // Ignore parsing errors for malformed chunks
          }
        }
      }
    }
  } catch (error) {
    console.error('Streaming error:', error);
  }
}

// Example 4: Using different models
async function modelComparison() {
  const models = [
    'meta-llama/llama-3.3-70b-instruct:free',
    'google/gemini-flash-1.5:free',
    'anthropic/claude-3.5-sonnet',
  ];

  const messages: IOpenRouterMessage[] = [
    { role: 'user', content: 'Explain quantum computing in simple terms' }
  ];

  for (const model of models) {
    try {
      console.log(`\n--- Using model: ${model} ---`);
      
      const response = await aiService.sendMessage(model, messages, {
        temperature: 0.7,
        maxTokens: 300,
      });

      const content = aiService.extractContent(response);
      console.log(content);
    } catch (error) {
      console.error(`Error with model ${model}:`, error);
    }
  }
}

// Example 5: Error handling
async function errorHandling() {
  try {
    // This will fail with invalid model
    const response = await aiService.sendMessage(
      'invalid-model',
      [{ role: 'user', content: 'Hello' }]
    );
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('Rate limit')) {
        console.log('Rate limit exceeded, please wait...');
      } else if (error.message.includes('Invalid API key')) {
        console.log('Please check your OpenRouter API key');
      } else if (error.message.includes('timeout')) {
        console.log('Request timed out, please try again');
      } else {
        console.log('Unexpected error:', error.message);
      }
    }
  }
}

// Run examples (uncomment to test)
// simpleChat();
// conversationWithContext();
// streamingChat();
// modelComparison();
// errorHandling();

export {
  simpleChat,
  conversationWithContext,
  streamingChat,
  modelComparison,
  errorHandling,
};
