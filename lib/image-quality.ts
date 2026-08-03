export type ImageQualityReport = {
  width: number;
  height: number;
  brightness: number;
  contrast: number;
  sharpness: number;
  warnings: string[];
};

export async function inspectImageQuality(file: File): Promise<ImageQualityReport> {
  const bitmap = await createImageBitmap(file);
  const canvas = document.createElement("canvas");
  const maxSide = 640;
  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
  canvas.width = Math.max(1, Math.round(bitmap.width * scale));
  canvas.height = Math.max(1, Math.round(bitmap.height * scale));
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) throw new Error("Unable to inspect image quality.");
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();

  const { data } = context.getImageData(0, 0, canvas.width, canvas.height);
  const gray = new Float32Array(canvas.width * canvas.height);
  let total = 0;
  let totalSquared = 0;
  for (let i = 0, pixel = 0; i < data.length; i += 4, pixel += 1) {
    const value = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
    gray[pixel] = value;
    total += value;
    totalSquared += value * value;
  }
  const count = gray.length;
  const brightness = total / count;
  const contrast = Math.sqrt(Math.max(0, totalSquared / count - brightness * brightness));

  let laplacianEnergy = 0;
  let samples = 0;
  for (let y = 1; y < canvas.height - 1; y += 1) {
    for (let x = 1; x < canvas.width - 1; x += 1) {
      const index = y * canvas.width + x;
      const laplacian =
        gray[index - canvas.width] +
        gray[index + canvas.width] +
        gray[index - 1] +
        gray[index + 1] -
        4 * gray[index];
      laplacianEnergy += laplacian * laplacian;
      samples += 1;
    }
  }
  const sharpness = samples ? laplacianEnergy / samples : 0;
  const warnings: string[] = [];
  if (bitmap.width < 480 || bitmap.height < 480) warnings.push("Use a higher-resolution image for a more reliable result.");
  if (brightness < 45) warnings.push("The image is dark. Add more light or retake it outdoors.");
  if (brightness > 225) warnings.push("The image is overexposed. Reduce glare and retake it.");
  if (contrast < 22) warnings.push("The subject has low contrast. Use a plain background or move closer.");
  if (sharpness < 85) warnings.push("The image may be blurred. Hold the camera steady and retake it.");

  return {
    width: bitmap.width,
    height: bitmap.height,
    brightness: Math.round(brightness),
    contrast: Math.round(contrast),
    sharpness: Math.round(sharpness),
    warnings,
  };
}
