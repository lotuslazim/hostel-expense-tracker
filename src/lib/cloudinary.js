// cloudinary.js
const CLOUD_NAME = 'your-cloud-name-here'; // From Step 2
const UPLOAD_PRESET = 'bachelorbite';      // 👈 USE THIS

export async function uploadToCloudinary(file) {
  if (CLOUD_NAME === 'your-cloud-name-here') {
    console.warn("Cloudinary is not configured. Please add your CLOUD_NAME to /src/lib/cloudinary.js. Skipping image upload.");
    return null;
  }

  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', UPLOAD_PRESET);
  formData.append('cloud_name', CLOUD_NAME);

  try {
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
      {
        method: 'POST',
        body: formData,
      }
    );

    if (!response.ok) {
        const errorData = await response.json();
        console.error("Cloudinary upload failed:", errorData);
        return null;
    }

    const data = await response.json();
    return data.secure_url;
  } catch (error) {
    console.error("Error uploading to Cloudinary:", error);
    return null;
  }
}
