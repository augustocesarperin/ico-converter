// @ts-ignore
import WorkerUrl from '@/workers/ico.worker.ts?worker&url'

type StartParams = {
  file: File
  sizes: number[]
  options: {
    preserveAspectRatio: boolean
    backgroundTransparent: boolean
    backgroundColor: string
    crispSmallIcons?: boolean
    smallIconMode?: boolean
    smallIconStrength16?: number
  }
  onProgress?: (progress: number, step: string) => void
}

export const processWithWorker = ({ file, sizes, options, onProgress }: StartParams): Promise<{ icoBlob: Blob; pngs: { size: number; blob: Blob }[] }> => {
  return new Promise(async (resolve, reject) => {
    const worker = new Worker(WorkerUrl, { type: 'module' })
    const fileBuffer = await file.arrayBuffer()
    const cleanup = () => worker.terminate()
    worker.onmessage = async (e: MessageEvent) => {
      const { type, payload } = e.data
      if (type === 'progress') {
        onProgress?.(payload.progress, payload.step)
      } else if (type === 'done') {
        const icoBlob = new Blob([payload.icoBuffer], { type: 'image/x-icon' })
        const pngs = await Promise.all(
          payload.pngs.map(async (p: any) => ({ size: p.size, blob: new Blob([p.buffer], { type: 'image/png' }) }))
        )
        cleanup()
        resolve({ icoBlob, pngs })
      } else if (type === 'error') {
        cleanup()
        reject(new Error(payload.message))
      }
    }
    worker.onerror = (err) => {
      cleanup()
      reject(err)
    }
    worker.postMessage({
      type: 'start',
      payload: {
        fileBuffer,
        mimeType: file.type,
        sizes,
        options,
      },
    }, [fileBuffer])
  })
}


