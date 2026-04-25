import { rawBodyConfig, uploadMultipartFileToBlob } from "../src/utils/uploads.js";

export const config = rawBodyConfig;

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, error: "Method not allowed" });
  }

  try {
    const { blob } = await uploadMultipartFileToBlob({
      req,
      folder: "products",
      fallbackContentType: "image/png",
    });

    return res.status(200).json({
      success: true,
      url: blob.url,
      image_url: blob.url,
      filename: blob.url,
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
}
