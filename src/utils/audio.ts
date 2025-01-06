const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25MB

export async function validateAudioFile(file: File) {
    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      throw new Error('File size exceeds the 25MB limit');
    }

  
    return true;
  }