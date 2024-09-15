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
  ;(self as any).postMessage(msg)
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
      cx.drawImage(img as any, 0, 0)
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
    const sharpen = (imageData: ImageData, strength = 0.15) => {
      const weights = [0,-1,0,-1,5,-1,0,-1,0]
      const side = 3
      const half = 1
      const src = imageData.data
      const w = imageData.width
      const h = imageData.height
      const dst = new Uint8ClampedArray(src)
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          let r=0,g=0,b=0,a=0
          for (let cy = 0; cy < side; cy++) {
            for (let cx = 0; cx < side; cx++) {
              const scy = Math.min(h-1, Math.max(0, y + cy - half))
              const scx = Math.min(w-1, Math.max(0, x + cx - half))
              const off = (scy * w + scx) * 4
              const wt = weights[cy*side+cx]
              r += src[off] * wt
              g += src[off+1] * wt
              b += src[off+2] * wt
              a += src[off+3] * wt
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
      ;(curCtx as any).imageSmoothingQuality = 'high'
      curCtx.clearRect(0, 0, curW, curH)
      curCtx.drawImage(bitmap, 0, 0)
      while (curW / 2 >= targetW && curH / 2 >= targetH) {
        const nextW = Math.max(targetW, Math.floor(curW / 2))
        const nextH = Math.max(targetH, Math.floor(curH / 2))
        const nextCanvas = new OffscreenCanvas(nextW, nextH)
        const nextCtx = nextCanvas.getContext('2d')!
        nextCtx.imageSmoothingEnabled = true
        ;(nextCtx as any).imageSmoothingQuality = 'high'
        nextCtx.drawImage(curCanvas, 0, 0, curW, curH, 0, 0, nextW, nextH)
        curCanvas = nextCanvas
        curCtx = nextCtx
        curW = nextW
        curH = nextH
      }
      return curCanvas
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
          let acc=0, idx=y*w+x
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

    const alphaQuantize = (imageData: ImageData, th = 60) => {
      const d = imageData.data
      for (let i=0;i<d.length;i+=4){ d[i+3] = d[i+3] > th ? 255 : 0 }
      return imageData
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
        try { srcBitmap = await createImageBitmap(imageBitmap, trimRect.sx, trimRect.sy, trimRect.sw, trimRect.sh) } catch {}
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
      ;(ctx as any).imageSmoothingQuality = 'high'
      if (size <= 32 && (options as any).crispSmallIcons !== false) {
        const stepCanvas = downscaleInSteps(srcBitmap, destW, destH)
        if (size <= 16) { ctx.imageSmoothingEnabled = false as any; (ctx as any).imageSmoothingQuality = 'low' }
        ctx.drawImage(stepCanvas, 0, 0, (stepCanvas as any).width, (stepCanvas as any).height, dx, dy, destW, destH)
        ctx.imageSmoothingEnabled = true; (ctx as any).imageSmoothingQuality = 'high'
      } else {
        ctx.drawImage(imageBitmap, trimRect.sx, trimRect.sy, trimRect.sw, trimRect.sh, dx, dy, destW, destH)
      }
      const dilate1px = (imageData: ImageData) => {
        const w=imageData.width,h=imageData.height,d=imageData.data
        const out=new Uint8ClampedArray(d)
        for(let y=0;y<h;y++){
          for(let x=0;x<w;x++){
            const off=(y*w+x)*4
            if(d[off+3]>0) continue
            let found=-1
            for(let cy=-1;cy<=1;cy++){
              const yy=y+cy; if(yy<0||yy>=h) continue
              for(let cx=-1;cx<=1;cx++){
                const xx=x+cx; if(xx<0||xx>=w) continue
                const o=(yy*w+xx)*4
                if(d[o+3]>150){ found=o; break }
              }
              if(found>=0) break
            }
            if(found>=0){ out[off]=d[found]; out[off+1]=d[found+1]; out[off+2]=d[found+2]; out[off+3]=Math.max(out[off+3],210) }
          }
        }
        imageData.data.set(out)
        return imageData
      }

      if (size <= 32) {
        let data = ctx.getImageData(0, 0, size, size)
        if (size <= 16) data = alphaQuantize(data, 60)
        const strength = Math.max(0, Math.min(2, (options as any).smallIconStrength16 ?? 1.2))
        if ((options as any).smallIconMode && size <= 16) {
          for (let k = 0; k < Math.round(strength); k++) data = dilate1px(data)
        }
        const s = size <= 16 ? 0.28 + 0.1 * strength : 0.22
        luminanceSharpen(data, s, size <= 16 ? 4 : 6, 1.08)
        if (size <= 16){
          const avg = meanLuminance(data)
          const outline = avg < 100 ? [255,255,255,170] : [0,0,0,170]
          addOutline(data, outline as any)
        }
        ctx.putImageData(data, 0, 0)
      }
      const pngBlob = await (canvas as any).convertToBlob({ type: 'image/png' })
      const buf = await pngBlob.arrayBuffer()
      pngs.push({ size, buffer: buf })
    }
    postProgress(90, 'Gerando ICO')
    const icoBuffer = createIcoFile(pngs.map(p => ({ buffer: p.buffer, size: p.size })))
    const msg: WorkerDoneMessage = { type: 'done', payload: { icoBuffer, pngs } }
    ;(self as any).postMessage(msg, [icoBuffer, ...pngs.map(p => p.buffer)])
  } catch (err: any) {
    const msg: WorkerErrorMessage = { type: 'error', payload: { message: err?.message || 'Worker error' } }
    ;(self as any).postMessage(msg)
  }
}


