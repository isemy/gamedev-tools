export function removeByColor(
  imageData: ImageData,
  x: number,
  y: number,
  tolerance: number
): ImageData {
  const { data, width, height } = imageData
  const result = new ImageData(new Uint8ClampedArray(data), width, height)
  const rd = result.data

  const idx = (y * width + x) * 4
  const br = data[idx]
  const bg = data[idx + 1]
  const bb = data[idx + 2]

  const t = tolerance * tolerance

  for (let i = 0; i < rd.length; i += 4) {
    const dr = rd[i] - br
    const dg = rd[i + 1] - bg
    const db = rd[i + 2] - bb
    if (dr * dr + dg * dg + db * db <= t) {
      rd[i + 3] = 0
    }
  }

  return result
}

export function exportAsBlob(
  imageData: ImageData,
  width: number,
  height: number,
  format: 'image/png' | 'image/webp'
): Promise<Blob> {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')!
  ctx.putImageData(imageData, 0, 0)
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('Export failed'))),
      format
    )
  })
}
