// Vitest jsdom setup: minimal canvas and APIs stubs
// Canvas 2D context stub
if (!(HTMLCanvasElement.prototype as any)._getContextPatched) {
  Object.defineProperty(HTMLCanvasElement.prototype, '_getContextPatched', {
    value: true,
    enumerable: false,
  })
  ;(HTMLCanvasElement.prototype as any).getContext = function () {
    return {
      fillStyle: '#000000',
      imageSmoothingEnabled: true,
      clearRect: () => {},
      fillRect: () => {},
      drawImage: () => {},
      getImageData: (x: number, y: number, w: number, h: number) => ({
        data: new Uint8ClampedArray(w * h * 4),
        width: w,
        height: h,
      }),
      putImageData: () => {},
      measureText: () => ({ width: 0 }),
    }
  }
  ;(HTMLCanvasElement.prototype as any).toBlob = function (
    cb: (b: Blob) => void,
    mime?: string,
  ) {
    cb(new Blob(['mock'], { type: mime || 'image/png' }))
  }
}

// OffscreenCanvas stub (basic)
if (typeof (globalThis as any).OffscreenCanvas === 'undefined') {
  ;(globalThis as any).OffscreenCanvas = class {
    width: number
    height: number
    constructor(w: number, h: number) {
      this.width = w
      this.height = h
    }
    getContext() {
      return (document.createElement('canvas') as HTMLCanvasElement).getContext('2d')
    }
    convertToBlob(opts?: { type?: string }) {
      return Promise.resolve(new Blob(['mock'], { type: opts?.type || 'image/png' }))
    }
  }
}

// URL and createImageBitmap stubs
if (!(globalThis as any).createImageBitmap) {
  ;(globalThis as any).createImageBitmap = async (_: any) => {
    const img = new Image()
    return img as any
  }
}
if (!(globalThis as any).URL.createObjectURL) {
  ;(globalThis as any).URL.createObjectURL = () => 'data:,'
}
if (!(globalThis as any).URL.revokeObjectURL) {
  ;(globalThis as any).URL.revokeObjectURL = () => {}
}











