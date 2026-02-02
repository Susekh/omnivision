const IMAGE_BASE_INTERNAL = "http://192.168.192.177:9000";
const IMAGE_BASE_PUBLIC = "https://assets.omnivision.neuradyne.in";

const normalizeImageUrl = (url) => {
  // Guard clauses
  if (!url || typeof url !== "string") return null;

  const trimmed = url.trim();

  // Already correct (public CDN)
  if (trimmed.startsWith(IMAGE_BASE_PUBLIC)) {
    return trimmed;
  }

  // Internal IP → Public CDN
  if (trimmed.startsWith(IMAGE_BASE_INTERNAL)) {
    return trimmed.replace(IMAGE_BASE_INTERNAL, IMAGE_BASE_PUBLIC);
  }

  // Any other absolute URL (do NOT touch)
  if (
    trimmed.startsWith("http://") ||
    trimmed.startsWith("https://")
  ) {
    return trimmed;
  }

  // Relative path that looks like an image we own
  if (trimmed.startsWith("/billion-eyes-images/")) {
    return `${IMAGE_BASE_PUBLIC}${trimmed}`;
  }

  // 🔒 Unrelated string → leave untouched
  return trimmed;
};
export default normalizeImageUrl;