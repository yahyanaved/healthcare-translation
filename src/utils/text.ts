
// Constants for text limits
const MAX_TEXT_LENGTH = 1000 // 500 characters limit
const MIN_TEXT_LENGTH = 1

export function validateText(text: string): { isValid: boolean; error?: string } {
    if (typeof text !== 'string') {
      return { isValid: false, error: 'Text must be a string' }
    }
  
    if (text.length < MIN_TEXT_LENGTH) {
      return { isValid: false, error: 'Text cannot be empty' }
    }
  
    if (text.length > MAX_TEXT_LENGTH) {
      return { 
        isValid: false, 
        error: `Text exceeds maximum length of ${MAX_TEXT_LENGTH} characters` 
      }
    }
    return { isValid: true }
}