const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25MB
const ALLOWED_AUDIO_TYPES = [
  'audio/wav',
  'audio/mp3',
  'audio/mpeg',
  'audio/x-m4a',
  'audio/aac',
  'audio/ogg'
];

export async function validateAudioFile(file: File) {
    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      throw new Error('File size exceeds the 25MB limit');
    }
  
    // Check file type
    if (!ALLOWED_AUDIO_TYPES.includes(file.type)) {
      throw new Error('Invalid audio file format');
    }
  

    
    return true;
  }