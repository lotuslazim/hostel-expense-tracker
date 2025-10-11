// cloudinary.js
const CLOUD_NAME = 'dpi7maxlc'; // From Step 2
const UPLOAD_PRESET = 'bachelorbite';      // 👈 USE THIS

export async function uploadFile(file) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', UPLOAD_PRESET); // 👈 This matches
  formData.append('cloud_name', CLOUD_NAME);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
    {
      method: 'POST',
      body: formData,
    }
  );

  const data = await response.json();
  return data.secure_url;
}
