/**
 * Generate a custom ID for conversations and messages
 * Format: prefix_timestamp_random
 * Example: conv_1703123456789_abc123def456
 */
export const generateCustomId = (prefix: string): string => {
  const timestamp = Date.now().toString();
  // Generate 12 hex characters to match server format
  const random = Array.from({ length: 12 }, () => 
    Math.floor(Math.random() * 16).toString(16)
  ).join('');
  return `${prefix}_${timestamp}_${random}`;
};

/**
 * Generate conversation ID
 */
export const generateConversationId = (): string => {
  return generateCustomId('conv');
};

/**
 * Generate message ID
 */
export const generateMessageId = (): string => {
  return generateCustomId('msg');
};

/**
 * Validate custom ID format
 */
export const isValidCustomId = (id: string, prefix: string): boolean => {
  const pattern = new RegExp(`^${prefix}_\\d+_[a-f0-9]{12}$`);
  return pattern.test(id);
};

/**
 * Validate conversation ID
 */
export const isValidConversationId = (id: string): boolean => {
  return isValidCustomId(id, 'conv');
};

/**
 * Validate message ID
 */
export const isValidMessageId = (id: string): boolean => {
  return isValidCustomId(id, 'msg');
};
