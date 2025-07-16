// Standard aspect ratios and their common sizes
export const STANDARD_SIZES = {
  // 1:1 Square
  '1:1': ['512x512', '1024x1024', '2048x2048'],
  
  // 4:3 Standard
  '4:3': ['640x480', '800x600', '1024x768', '1600x1200'],
  
  // 16:9 Widescreen
  '16:9': ['1280x720', '1920x1080', '2560x1440', '3840x2160'],
  
  // 9:16 Portrait (for mobile)
  '9:16': ['720x1280', '1080x1920', '1440x2560'],
  
  // 3:2 Photography
  '3:2': ['900x600', '1200x800', '1800x1200', '3000x2000'],
  
  // 2:3 Portrait Photography
  '2:3': ['600x900', '800x1200', '1200x1800', '2000x3000']
}

// Get the closest standard size for given dimensions
export function getClosestStandardSize(width: number, height: number): string {
  const aspectRatio = width / height
  let closestSize = `${width}x${height}`
  let minDiff = Infinity
  
  // Check all standard sizes
  Object.values(STANDARD_SIZES).flat().forEach(size => {
    const [w, h] = size.split('x').map(Number)
    const sizeAspectRatio = w / h
    
    // If aspect ratios match closely (within 0.01)
    if (Math.abs(aspectRatio - sizeAspectRatio) < 0.01) {
      // Find the closest by pixel count
      const pixelDiff = Math.abs((width * height) - (w * h))
      if (pixelDiff < minDiff) {
        minDiff = pixelDiff
        closestSize = size
      }
    }
  })
  
  return closestSize
}

// Calculate aspect ratio string (e.g., "16:9")
export function getAspectRatioString(width: number, height: number): string {
  const gcd = (a: number, b: number): number => b === 0 ? a : gcd(b, a % b)
  const divisor = gcd(width, height)
  const simplifiedWidth = width / divisor
  const simplifiedHeight = height / divisor
  
  // Check for common ratios
  const ratio = simplifiedWidth / simplifiedHeight
  
  if (Math.abs(ratio - 1) < 0.01) return '1:1'
  if (Math.abs(ratio - 16/9) < 0.01) return '16:9'
  if (Math.abs(ratio - 9/16) < 0.01) return '9:16'
  if (Math.abs(ratio - 4/3) < 0.01) return '4:3'
  if (Math.abs(ratio - 3/4) < 0.01) return '3:4'
  if (Math.abs(ratio - 3/2) < 0.01) return '3:2'
  if (Math.abs(ratio - 2/3) < 0.01) return '2:3'
  
  return `${simplifiedWidth}:${simplifiedHeight}`
}