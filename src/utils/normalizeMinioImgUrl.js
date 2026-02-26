const INTERNAL_BASES = [
  "http://192.168.192.177:9000",
  "http://localhost:9000",
];

const IMAGE_BASE_PUBLIC = "https://assets.omnivision.neuradyne.in";

const normalizeImageUrl = (url) => {
  if (!url || typeof url !== "string") return null;

  const trimmed = url.trim();

  if (trimmed.startsWith(IMAGE_BASE_PUBLIC)) {
    return trimmed;
  }

  for (const base of INTERNAL_BASES) {
    if (trimmed.startsWith(base)) {
      return trimmed.replace(base, IMAGE_BASE_PUBLIC);
    }
  }

  if (
    trimmed.startsWith("http://") ||
    trimmed.startsWith("https://")
  ) {
    return trimmed;
  }

  if (trimmed.startsWith("/billion-eyes-images/")) {
    return `${IMAGE_BASE_PUBLIC}${trimmed}`;
  }

  return trimmed;
};

export default normalizeImageUrl;