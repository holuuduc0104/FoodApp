import { API_URL } from '@/config/api';

/**
 * Upload image to Supabase Storage via backend API
 * @param imageUri - Local file URI (file://, blob:, or content://)
 * @returns Public URL of uploaded image
 */
export async function uploadImage(imageUri: string): Promise<string> {
  try {
    console.log('Starting image upload for:', imageUri);

    // Create FormData
    const formData = new FormData();
    
    // Handle different URI types
    if (imageUri.startsWith('blob:')) {
      // Web blob URL
      const response = await fetch(imageUri);
      const blob = await response.blob();
      const file = new File([blob], 'photo.jpg', { type: 'image/jpeg' });
      formData.append('file', file);
    } else if (imageUri.startsWith('file://') || imageUri.startsWith('content://')) {
      // Mobile file URI
      const filename = imageUri.split('/').pop() || 'photo.jpg';
      formData.append('file', {
        uri: imageUri,
        name: filename,
        type: 'image/jpeg',
      } as any);
    } else if (imageUri.startsWith('http://') || imageUri.startsWith('https://')) {
      // Already a public URL, return as is
      console.log('Image is already a public URL');
      return imageUri;
    } else {
      throw new Error('Unsupported image URI format');
    }

    console.log('Uploading to:', `${API_URL}/api/upload/image`);

    // Upload to backend
    const uploadResponse = await fetch(`${API_URL}/api/upload/image`, {
      method: 'POST',
      body: formData,
      headers: {
        // Don't set Content-Type, let browser set it with boundary
      },
    });

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      console.error('Upload failed:', uploadResponse.status, errorText);
      throw new Error(`Upload failed: ${uploadResponse.status} - ${errorText}`);
    }

    const result = await uploadResponse.json();
    console.log('Upload successful:', result);

    if (!result.url) {
      throw new Error('No URL returned from upload');
    }

    return result.url;
  } catch (error) {
    console.error('Error uploading image:', error);
    throw error;
  }
}

/**
 * Delete image from Supabase Storage
 * @param filename - Filename to delete (not full URL, just filename)
 */
export async function deleteImage(filename: string): Promise<void> {
  try {
    const response = await fetch(`${API_URL}/api/upload/image/${filename}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Delete failed: ${response.status} - ${errorText}`);
    }

    console.log('Image deleted successfully:', filename);
  } catch (error) {
    console.error('Error deleting image:', error);
    throw error;
  }
}
