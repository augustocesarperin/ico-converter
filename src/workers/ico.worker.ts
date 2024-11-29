export type WorkerStartMessage = {
  type: 'start'
  payload: {
    fileBuffer: ArrayBuffer
    mimeType: string
    sizes: number[]
    options: {
      preserveAspectRatio: boolean
      backgroundTransparent: boolean
      backgroundColor: string
      crispSmallIcons?: boolean
      smallIconMode?: boolean
      smallIconStrength16?: number
      outline16px?: boolean
      autoProfile?: boolean
    }
  }
}

type WorkerProgressMessage = { type: 'progress'; payload: { progress: number; step: string } }
type WorkerDoneMessage = { type: 'done'; payload: { icoBuffer: ArrayBuffer; pngs: { size: number; buffer: ArrayBuffer }[] } }
type WorkerErrorMessage = { type: 'error'; payload: { message: string } }

const createIcoFile = (pngBuffers: { buffer: ArrayBuffer; size: number }[]): ArrayBuffer => {
  const iconCount = pngBuffers.length
  const headerSize = 6
  const directorySize = iconCount * 16
  const totalHeaderSize = headerSize + directorySize
  let totalSize = totalHeaderSize
  pngBuffers.forEach(({ buffer }) => (totalSize += buffer.byteLength))
  const icoBuffer = new ArrayBuffer(totalSize)
  const view = new DataView(icoBuffer)
  view.setUint16(0, 0, true)
  view.setUint16(2, 1, true)
  view.setUint16(4, iconCount, true)
  let offset = totalHeaderSize
  let directoryOffset = 6
  pngBuffers.forEach(({ buffer, size }) => {
    view.setUint8(directoryOffset, size === 256 ? 0 : size)
    view.setUint8(directoryOffset + 1, size === 256 ? 0 : size)
    view.setUint8(directoryOffset + 2, 0)
    view.setUint8(directoryOffset + 3, 0)
    view.setUint16(directoryOffset + 4, 1, true)
    view.setUint16(directoryOffset + 6, 32, true)
    view.setUint32(directoryOffset + 8, buffer.byteLength, true)
    view.setUint32(directoryOffset + 12, offset, true)
    new Uint8Array(icoBuffer, offset).set(new Uint8Array(buffer))
    offset += buffer.byteLength
    directoryOffset += 16
  })
  return icoBuffer
}

const postProgress = (progress: number, step: string) => {
  const msg: WorkerProgressMessage = { type: 'progress', payload: { progress, step } }
  ;(self as unknown as Worker).postMessage(msg)
}

self.onmessage = async (e: MessageEvent<WorkerStartMessage>) => {
  try {
    if (e.data?.type !== 'start') return
    const { fileBuffer, mimeType, sizes, options } = e.data.payload
    const blob = new Blob([fileBuffer], { type: mimeType })
    let imageBitmap: ImageBitmap
    try {
      imageBitmap = await createImageBitmap(blob)
    } catch {
      const url = URL.createObjectURL(blob)
      const img = await new Promise<HTMLImageElement>((resolve, reject) => {
        const el = new Image()
        el.onload = () => resolve(el)
        el.onerror = reject
        el.src = url
      })
      const c = new OffscreenCanvas(img.width || 1024, img.height || 1024)
      const cx = c.getContext('2d')!
      cx.drawImage(img, 0, 0)
      imageBitmap = c.transferToImageBitmap()
      URL.revokeObjectURL(url)
    }
    const pngs: { size: number; buffer: ArrayBuffer }[] = []

    const computeTrimRect = async (bitmap: ImageBitmap): Promise<{sx:number; sy:number; sw:number; sh:number}> => {
      const maxSide = Math.max(bitmap.width, bitmap.height)
      const scale = maxSide > 512 ? 512 / maxSide : 1
      const w = Math.max(1, Math.round(bitmap.width * scale))
      const h = Math.max(1, Math.round(bitmap.height * scale))
      const sample = new OffscreenCanvas(w, h)
      const sctx = sample.getContext('2d')!
      sctx.clearRect(0, 0, w, h)
      sctx.drawImage(bitmap, 0, 0, w, h)
      const data = sctx.getImageData(0, 0, w, h).data
      let minX = w, minY = h, maxX = -1, maxY = -1
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const a = data[(y * w + x) * 4 + 3]
          if (a > 8) {
            if (x < minX) minX = x
            if (y < minY) minY = y
            if (x > maxX) maxX = x
            if (y > maxY) maxY = y
          }
        }
      }
      if (maxX < minX || maxY < minY) {
        return { sx: 0, sy: 0, sw: bitmap.width, sh: bitmap.height }
      }
      const pad = 1
      const sx = Math.max(0, Math.floor((minX - pad) / scale))
      const sy = Math.max(0, Math.floor((minY - pad) / scale))
      const sw = Math.min(bitmap.width - sx, Math.ceil((maxX - minX + 1 + pad * 2) / scale))
      const sh = Math.min(bitmap.height - sy, Math.ceil((maxY - minY + 1 + pad * 2) / scale))
      const shrinkX = 1 - sw / bitmap.width
      const shrinkY = 1 - sh / bitmap.height
      if (shrinkX < 0.04 && shrinkY < 0.04) {
        return { sx: 0, sy: 0, sw: bitmap.width, sh: bitmap.height }
      }
      return { sx, sy, sw, sh }
    }

    const trimRect = await computeTrimRect(imageBitmap)
    const _sharpen = (imageData: ImageData, strength = 0.15) => {
      const weights = [0,-1,0,-1,5,-1,0,-1,0]
      const side = 3
      const half = 1
      const src = imageData.data
      const w = imageData.width
      const h = imageData.height
      const dst = new Uint8ClampedArray(src)
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          let r=0,g=0,b=0,_a=0
          for (let cy = 0; cy < side; cy++) {
            for (let cx = 0; cx < side; cx++) {
              const scy = Math.min(h-1, Math.max(0, y + cy - half))
              const scx = Math.min(w-1, Math.max(0, x + cx - half))
              const off = (scy * w + scx) * 4
              const wt = weights[cy*side+cx]
              r += src[off] * wt
              g += src[off+1] * wt
              b += src[off+2] * wt
              _a += src[off+3] * wt
            }
          }
          const dstOff = (y * w + x) * 4
          dst[dstOff] = r * strength + src[dstOff] * (1 - strength)
          dst[dstOff+1] = g * strength + src[dstOff+1] * (1 - strength)
          dst[dstOff+2] = b * strength + src[dstOff+2] * (1 - strength)
          dst[dstOff+3] = src[dstOff+3]
        }
      }
      imageData.data.set(dst)
      return imageData
    }

    const downscaleInSteps = (bitmap: ImageBitmap, targetW: number, targetH: number): OffscreenCanvas => {
      let curW = bitmap.width
      let curH = bitmap.height
      let curCanvas = new OffscreenCanvas(curW, curH)
      let curCtx = curCanvas.getContext('2d')!
      curCtx.imageSmoothingEnabled = true
      ;(curCtx as unknown as CanvasRenderingContext2D & { imageSmoothingQuality?: ImageSmoothingQuality }).imageSmoothingQuality = 'high'
      curCtx.clearRect(0, 0, curW, curH)
      curCtx.drawImage(bitmap, 0, 0)
      while (curW / 2 >= targetW && curH / 2 >= targetH) {
        const nextW = Math.max(targetW, Math.floor(curW / 2))
        const nextH = Math.max(targetH, Math.floor(curH / 2))
        const nextCanvas = new OffscreenCanvas(nextW, nextH)
        const nextCtx = nextCanvas.getContext('2d')!
        nextCtx.imageSmoothingEnabled = true
        ;(nextCtx as unknown as CanvasRenderingContext2D & { imageSmoothingQuality?: ImageSmoothingQuality }).imageSmoothingQuality = 'high'
        nextCtx.drawImage(curCanvas, 0, 0, curW, curH, 0, 0, nextW, nextH)
        curCanvas = nextCanvas
        curCtx = nextCtx
        curW = nextW
        curH = nextH
      }
      return curCanvas
    }

    // Gamma-aware, alpha-weighted 2x box downscale for small sizes (<=48)
    const downscaleBoxBy2 = (src: ImageData): ImageData => {
      const w = src.width, h = src.height
      const newW = Math.max(1, Math.floor(w / 2))
      const newH = Math.max(1, Math.floor(h / 2))
      const out = new ImageData(newW, newH)
      const s = src.data, d = out.data
      const gamma = 2.2
      const toLin = (v: number) => Math.pow(v / 255, gamma)
      const toSrgb = (v: number) => Math.max(0, Math.min(1, Math.pow(v, 1 / gamma))) * 255
      const sample = (xx: number, yy: number) => {
        const x = Math.min(w - 1, Math.max(0, xx))
        const y = Math.min(h - 1, Math.max(0, yy))
        const o = (y * w + x) * 4
        return [s[o], s[o + 1], s[o + 2], s[o + 3]] as [number, number, number, number]
      }
      for (let y = 0; y < newH; y++) {
        for (let x = 0; x < newW; x++) {
          const sx = x * 2, sy = y * 2
          const p1 = sample(sx, sy)
          const p2 = sample(sx + 1, sy)
          const p3 = sample(sx, sy + 1)
          const p4 = sample(sx + 1, sy + 1)
          const a1 = p1[3] / 255, a2 = p2[3] / 255, a3 = p3[3] / 255, a4 = p4[3] / 255
          const aSum = a1 + a2 + a3 + a4
          const rLin = toLin(p1[0]) * a1 + toLin(p2[0]) * a2 + toLin(p3[0]) * a3 + toLin(p4[0]) * a4
          const gLin = toLin(p1[1]) * a1 + toLin(p2[1]) * a2 + toLin(p3[1]) * a3 + toLin(p4[1]) * a4
          const bLin = toLin(p1[2]) * a1 + toLin(p2[2]) * a2 + toLin(p3[2]) * a3 + toLin(p4[2]) * a4
          const aOut = aSum / 4
          const idx = (y * newW + x) * 4
          d[idx + 3] = Math.round(aOut * 255)
          if (aOut > 0) {
            const r = toSrgb(rLin / aSum)
            const g = toSrgb(gLin / aSum)
            const b = toSrgb(bLin / aSum)
            d[idx] = r | 0
            d[idx + 1] = g | 0
            d[idx + 2] = b | 0
          } else {
            d[idx] = d[idx + 1] = d[idx + 2] = 0
          }
        }
      }
      return out
    }

    const _downscaleBoxTo = (bitmap: ImageBitmap | OffscreenCanvas, targetW: number, targetH: number): OffscreenCanvas => {
      let srcCanvas: OffscreenCanvas
      if (bitmap instanceof OffscreenCanvas) {
        srcCanvas = bitmap
      } else {
        srcCanvas = new OffscreenCanvas(bitmap.width, bitmap.height)
        const sctx = srcCanvas.getContext('2d')!
        sctx.drawImage(bitmap, 0, 0)
      }
      let curW = (srcCanvas as OffscreenCanvas).width
      let curH = (srcCanvas as OffscreenCanvas).height
      while (curW / 2 >= targetW && curH / 2 >= targetH) {
        const ctx = srcCanvas.getContext('2d')!
        const img = ctx.getImageData(0, 0, curW, curH)
        const half = downscaleBoxBy2(img)
        const next = new OffscreenCanvas(half.width, half.height)
        next.getContext('2d')!.putImageData(half, 0, 0)
        srcCanvas = next
        curW = half.width
        curH = half.height
      }
      if (curW !== targetW || curH !== targetH) {
        const out = new OffscreenCanvas(targetW, targetH)
        const octx = out.getContext('2d')!
        octx.imageSmoothingEnabled = false as unknown as boolean
        octx.drawImage(srcCanvas, 0, 0, curW, curH, 0, 0, targetW, targetH)
        return out
      }
      return srcCanvas
    }

    const luminanceSharpen = (imageData: ImageData, amount: number, threshold = 6, contrast = 1.06) => {
      const w = imageData.width, h = imageData.height
      const src = imageData.data
      const lum = new Float32Array(w * h)
      for (let i=0, p=0; i<src.length; i+=4, p++) lum[p] = 0.299*src[i] + 0.587*src[i+1] + 0.114*src[i+2]
      const out = new Float32Array(w * h)
      const k = [0,-1,0,-1,5,-1,0,-1,0]
      for (let y=0;y<h;y++){
        for (let x=0;x<w;x++){
          let acc=0; const idx=y*w+x
          for (let cy=-1; cy<=1; cy++){
            const yy=Math.min(h-1, Math.max(0, y+cy))
            for (let cx=-1; cx<=1; cx++){
              const xx=Math.min(w-1, Math.max(0, x+cx))
              acc += lum[yy*w+xx] * k[(cy+1)*3+(cx+1)]
            }
          }
          out[idx]=acc
        }
      }
      for (let i=0, p=0; i<src.length; i+=4, p++){
        const delta = out[p]-lum[p]
        if (Math.abs(delta) < threshold) continue
        const adj = amount * delta
        src[i] = Math.max(0, Math.min(255, (src[i]-128)*contrast + 128 + adj))
        src[i+1] = Math.max(0, Math.min(255, (src[i+1]-128)*contrast + 128 + adj))
        src[i+2] = Math.max(0, Math.min(255, (src[i+2]-128)*contrast + 128 + adj))
      }
      return imageData
    }

    const addOutline = (imageData: ImageData, rgba: [number,number,number,number]) => {
      const w = imageData.width, h = imageData.height
      const src = imageData.data
      const dst = new Uint8ClampedArray(src)
      for (let y=0;y<h;y++){
        for (let x=0;x<w;x++){
          const off=(y*w+x)*4
          const a = src[off+3]
          if (a>0) continue
          let near=false
          for (let cy=-1; cy<=1 && !near; cy++){
            const yy=y+cy; if (yy<0||yy>=h) continue
            for (let cx=-1; cx<=1; cx++){
              const xx=x+cx; if (xx<0||xx>=w) continue
              if (src[(yy*w+xx)*4+3]>120){ near=true; break }
            }
          }
          if (near){ dst[off]=rgba[0]; dst[off+1]=rgba[1]; dst[off+2]=rgba[2]; dst[off+3]=Math.max(dst[off+3], rgba[3]) }
        }
      }
      imageData.data.set(dst)
      return imageData
    }

    const meanLuminance = (imageData: ImageData) => {
      const d = imageData.data
      let sum = 0, count = 0
      for (let i=0; i<d.length; i+=4){
        const a = d[i+3]
        if (a>40){ sum += 0.299*d[i] + 0.587*d[i+1] + 0.114*d[i+2]; count++ }
      }
      return count ? sum / count : 128
    }
    const clampConsistency = (size: number, sharpen: number, contrast: number) => {
      const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v))
      let sLo = 0.02, sHi = 0.10, cLo = 0.96, cHi = 1.04
      if (size <= 16) { sLo = 0.12; sHi = 0.23; cLo = 0.96; cHi = 1.02 }
      else if (size === 32) { sLo = 0.10; sHi = 0.20; cLo = 0.98; cHi = 1.02 }
      else if (size === 48) { sLo = 0.08; sHi = 0.18; cLo = 0.98; cHi = 1.03 }
      else if (size === 64) { sLo = 0.06; sHi = 0.16; cLo = 0.99; cHi = 1.03 }
      else if (size === 96) { sLo = 0.04; sHi = 0.14; cLo = 0.99; cHi = 1.03 }
      return { sharpen: clamp(sharpen, sLo, sHi), contrast: clamp(contrast, cLo, cHi) }
    }

    const coverageRatio = (imageData: ImageData) => {
      const d = imageData.data
      let solid = 0
      for (let i=0; i<d.length; i+=4){ if (d[i+3] > 190) solid++ }
      return solid / (imageData.width * imageData.height)
    }

    const alphaQuantize = (imageData: ImageData, th = 60) => {
      const d = imageData.data
      for (let i=0;i<d.length;i+=4){ d[i+3] = d[i+3] > th ? 255 : 0 }
      return imageData
    }

    const sobelEdgeStrength = (imageData: ImageData) => {
      const w = imageData.width, h = imageData.height
      const d = imageData.data
      const lum = new Float32Array(w * h)
      for (let i=0, p=0; i<d.length; i+=4, p++) lum[p] = 0.299*d[i] + 0.587*d[i+1] + 0.114*d[i+2]
      let sum = 0, count = 0
      const gx = [-1,0,1,-2,0,2,-1,0,1]
      const gy = [-1,-2,-1,0,0,0,1,2,1]
      for (let y=1; y<h-1; y++){
        for (let x=1; x<w-1; x++){
          const off = (y*w+x)*4
          if (d[off+3] <= 40) continue
          let sx=0, sy=0
          let k=0
          for (let cy=-1; cy<=1; cy++){
            for (let cx=-1; cx<=1; cx++){
              const v = lum[(y+cy)*w + (x+cx)]
              sx += v * gx[k]
              sy += v * gy[k]
              k++
            }
          }
          const mag = Math.sqrt(sx*sx + sy*sy)
          sum += mag
          count++
        }
      }
      if (!count) return 0
      return sum / count // ~0..255 scale
    }

    for (let i = 0; i < sizes.length; i++) {
      const size = sizes[i]
      postProgress(10 + Math.round((i / sizes.length) * 70), `Redimensionando ${size}x${size}`)
      const canvas = new OffscreenCanvas(size, size)
      const ctx = canvas.getContext('2d')!
      if (!options.backgroundTransparent) {
        ctx.fillStyle = options.backgroundColor || '#000000'
        ctx.fillRect(0, 0, size, size)
      } else {
        ctx.clearRect(0, 0, size, size)
      }
      let destW = size
      let destH = size
      let dx = 0
      let dy = 0
      // Choose source bitmap (cropped for small sizes to avoid excessive transparency padding)
      let srcBitmap: ImageBitmap = imageBitmap
      if (size <= 32 && (trimRect.sw > 0 && trimRect.sh > 0)) {
        try { srcBitmap = await createImageBitmap(imageBitmap, trimRect.sx, trimRect.sy, trimRect.sw, trimRect.sh) } catch { /* noop */ }
      }

      if (options.preserveAspectRatio) {
        const iw = srcBitmap.width
        const ih = srcBitmap.height
        const scale = Math.min(size / iw, size / ih)
        destW = Math.max(1, Math.round(iw * scale))
        destH = Math.max(1, Math.round(ih * scale))
        dx = Math.floor((size - destW) / 2)
        dy = Math.floor((size - destH) / 2)
      }
      ctx.imageSmoothingEnabled = true
      ;(ctx as unknown as CanvasRenderingContext2D & { imageSmoothingQuality?: ImageSmoothingQuality }).imageSmoothingQuality = 'high'
      if (size <= 48 && (options as unknown as { crispSmallIcons?: boolean }).crispSmallIcons !== false) {
        const stepCanvas = downscaleInSteps(srcBitmap, destW, destH)
        if (size <= 16) { ctx.imageSmoothingEnabled = false as unknown as boolean; (ctx as unknown as CanvasRenderingContext2D & { imageSmoothingQuality?: ImageSmoothingQuality }).imageSmoothingQuality = 'low' }
        ctx.drawImage(stepCanvas, 0, 0, (stepCanvas as OffscreenCanvas).width, (stepCanvas as OffscreenCanvas).height, dx, dy, destW, destH)
        ctx.imageSmoothingEnabled = true; (ctx as unknown as CanvasRenderingContext2D & { imageSmoothingQuality?: ImageSmoothingQuality }).imageSmoothingQuality = 'high'
      } else {
        ctx.drawImage(imageBitmap, trimRect.sx, trimRect.sy, trimRect.sw, trimRect.sh, dx, dy, destW, destH)
      }
      const dilateAlphaNeutral = (imageData: ImageData) => {
        const w = imageData.width, h = imageData.height, d = imageData.data
        const out = new Uint8ClampedArray(d)
        const luminance = (r:number,g:number,b:number)=> 0.299*r + 0.587*g + 0.114*b
        for (let y = 0; y < h; y++) {
          for (let x = 0; x < w; x++) {
            const off = (y * w + x) * 4
            if (d[off + 3] > 0) continue
            let found = -1
            for (let cy = -1; cy <= 1; cy++) {
              const yy = y + cy; if (yy < 0 || yy >= h) continue
              for (let cx = -1; cx <= 1; cx++) {
                const xx = x + cx; if (xx < 0 || xx >= w) continue
                const o = (yy * w + xx) * 4
                if (d[o + 3] > 150) { found = o; break }
              }
              if (found >= 0) break
            }
            if (found >= 0) {
              const lum = luminance(d[found], d[found + 1], d[found + 2]) | 0
              out[off] = lum; out[off + 1] = lum; out[off + 2] = lum
              out[off + 3] = Math.max(out[off + 3], 210)
            }
          }
        }
        imageData.data.set(out)
        return imageData
      }

      if (size <= 32) {
        let data = ctx.getImageData(0, 0, size, size)
        if (size <= 16) data = alphaQuantize(data, 48)
        const auto = (options as unknown as { autoProfile?: boolean }).autoProfile === true
        let strength = Math.max(0, Math.min(2, (options as unknown as { smallIconStrength16?: number }).smallIconStrength16 ?? 1.2))
        let useSmallMode = (options as unknown as { smallIconMode?: boolean }).smallIconMode === true
        const isSharpPreset = ((options as unknown as { outline16px?: boolean }).outline16px === true) && !useSmallMode && (auto === false)
        const isSoftPreset = useSmallMode && ((options as unknown as { outline16px?: boolean }).outline16px !== true) && (auto === false)
        if (auto && size <= 16) {
          const cov = coverageRatio(data)
          if (cov < 0.18) { strength = 1.3; useSmallMode = true }
          else if (cov > 0.70) { strength = 0.6; useSmallMode = false }
          else { strength = 1.0; }
        }
        if (useSmallMode && size <= 16) {
          let passes = Math.max(1, Math.round(strength))
          if (isSoftPreset) passes = Math.max(2, passes)
          for (let k = 0; k < passes; k++) data = dilateAlphaNeutral(data)
        } else if (size <= 16) {
          // micro-bolding único para preservar traços muito finos quando o modo não está ativo
          const covThin = coverageRatio(data)
          if (covThin < 0.30) data = dilateAlphaNeutral(data)
        }
        let sharpenAmount = 0.22
        let contrast = 1.06
        const covAuto = auto ? coverageRatio(data) : undefined
        if (size <= 16) {
          // mais suave para evitar halos e saturação visual no 16px
          sharpenAmount = Math.max(0.15, Math.min(0.23, 0.15 + 0.04 * strength))
          contrast = 0.97
        } else if (size === 32) {
          // leve nitidez, contraste neutro
          sharpenAmount = isSharpPreset ? 0.18 : 0.14
          contrast = 1.00
        } else if (size === 44 || size === 48) {
          // Evitar aspecto "duro" nesses tamanhos intermediários
          const base = size === 44 ? 0.16 : 0.10
          if (auto && covAuto !== undefined) {
            sharpenAmount = covAuto < 0.18 ? base + 0.03 : covAuto > 0.70 ? base - 0.03 : base
          } else {
            sharpenAmount = base
          }
          contrast = size === 44 ? 1.02 : (isSharpPreset ? 1.04 : 1.03)
        } else if (size === 64) {
          const base = 0.14
          if (auto && covAuto !== undefined) {
            sharpenAmount = covAuto < 0.18 ? base + 0.02 : covAuto > 0.70 ? base - 0.02 : base
          } else {
            sharpenAmount = base
          }
          contrast = 1.02
        } else if (size === 96) {
          const base = 0.10
          if (auto && covAuto !== undefined) {
            sharpenAmount = covAuto < 0.18 ? base + 0.02 : covAuto > 0.70 ? base - 0.02 : base
          } else {
            sharpenAmount = base
          }
          contrast = 1.02
        } else if (size === 128 || size === 150 || size === 152 || size === 192 || size === 256) {
          const edge = auto ? sobelEdgeStrength(data) : 0
          let base = 0.08
          if (size === 192) base = 0.06
          if (size === 256) base = 0.05
          sharpenAmount = base
          contrast = size >= 192 ? 1.01 : 1.02
          if (auto) {
            if (edge > 30) { // muito detalhado / alto contraste
              sharpenAmount = Math.max(0.02, base - 0.02)
              contrast = 1.00
            } else if (edge < 12) { // pouco detalhe
              sharpenAmount = base + 0.02
              contrast = Math.min(1.04, (size >= 192 ? 1.02 : 1.03))
            }
          }
        }
        // Consistency guard
        const clamped = clampConsistency(size, sharpenAmount, contrast)
        luminanceSharpen(data, clamped.sharpen, size <= 16 ? 3 : 6, clamped.contrast)
        if (size <= 16){
          const avg = meanLuminance(data)
          const pref = (options as unknown as { outline16px?: boolean }).outline16px
          const shouldOutline = typeof pref === 'boolean' ? pref : (auto && avg >= 85 && avg <= 170)
          if (shouldOutline){
            const outline = avg < 128 ? [255,255,255,100] : [0,0,0,100]
            addOutline(data, outline as [number, number, number, number])
          }
        }

        ctx.putImageData(data, 0, 0)
      }
      const pngBlob = await (canvas as OffscreenCanvas).convertToBlob({ type: 'image/png' })
      const buf = await pngBlob.arrayBuffer()
      pngs.push({ size, buffer: buf })
    }
    postProgress(90, 'Gerando ICO')
    const icoBuffer = createIcoFile(pngs.map(p => ({ buffer: p.buffer, size: p.size })))
    const msg: WorkerDoneMessage = { type: 'done', payload: { icoBuffer, pngs } }
    ;(self as unknown as Worker).postMessage(msg, [icoBuffer, ...pngs.map(p => p.buffer)])
  } catch (err) {
    const message = (err as { message?: string } | null)?.message || 'Worker error'
    const msg: WorkerErrorMessage = { type: 'error', payload: { message } }
    ;(self as unknown as Worker).postMessage(msg)
  }
}



