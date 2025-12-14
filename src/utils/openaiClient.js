// OpenAI API Client - Uses backend proxy for security
// This replaces direct OpenAI API calls in your frontend

import config from '../config/api.js';

/**
 * Call OpenAI API through secure backend proxy (Vercel serverless function)
 * @param {Array} messages - Array of message objects with role and content
 * @param {Object} options - Optional parameters (model, temperature, max_tokens)
 * @returns {Promise} - OpenAI API response
 */
export async function callOpenAI(messages, options = {}) {
  const {
    model = 'gpt-4o-mini',
    temperature = 0.7,
    max_tokens = 2000
  } = options;

  try {
    // Use Vercel API URL (configured in src/config/api.js)
    const apiUrl = `${config.VERCEL_API_URL}${config.endpoints.openai}`;

    console.log('Calling API:', apiUrl);

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages,
        model,
        temperature,
        max_tokens
      })
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(error.error || `API request failed: ${response.status}`);
    }

    const data = await response.json();
    return data;

  } catch (error) {
    console.error('OpenAI API call failed:', error);

    // Provide helpful error message
    if (error.message.includes('Failed to fetch')) {
      throw new Error('Cannot connect to API server. Please check your API configuration in src/config/api.js');
    }

    throw error;
  }
}

/**
 * Helper function to format messages for OpenAI
 * @param {string} systemPrompt - System instruction
 * @param {string} userMessage - User's message
 * @param {Array} conversationHistory - Optional previous messages
 * @returns {Array} - Formatted messages array
 */
export function formatMessages(systemPrompt, userMessage, conversationHistory = []) {
  return [
    { role: 'system', content: systemPrompt },
    ...conversationHistory,
    { role: 'user', content: userMessage }
  ];
}

/**
 * Extract text content from OpenAI response
 * @param {Object} response - OpenAI API response
 * @returns {string} - Extracted text content
 */
export function extractContent(response) {
  return response?.choices?.[0]?.message?.content || '';
}

/**
 * Complete helper: Call OpenAI and extract content in one step
 * @param {string} systemPrompt - System instruction
 * @param {string} userMessage - User's message
 * @param {Object} options - Optional parameters
 * @returns {Promise<string>} - AI response text
 */
export async function getAIResponse(systemPrompt, userMessage, options = {}) {
  const messages = formatMessages(systemPrompt, userMessage);
  const response = await callOpenAI(messages, options);
  return extractContent(response);
}

