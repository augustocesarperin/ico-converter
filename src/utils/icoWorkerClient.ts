import WorkerUrl from "@/workers/ico.worker.ts?worker&url";

type StartParams = {
  file: File;
  sizes: number[];
  options: {
    preserveAspectRatio: boolean;
    backgroundTransparent: boolean;
    backgroundColor: string;
    crispSmallIcons?: boolean;
    smallIconMode?: boolean;
    smallIconStrength16?: number;
    outline16px?: boolean;
    autoProfile?: boolean;
  };
  onProgress?: (progress: number, step: string) => void;
};

export const processWithWorker = ({
  file,
  sizes,
  options,
  onProgress,
}: StartParams): Promise<{
  icoBlob: Blob;
  pngs: { size: number; blob: Blob }[];
}> => {
  return new Promise((resolve, reject) => {
    // Fallback for tests where Worker is unavailable
    const worker = typeof Worker !== 'undefined' ? new Worker(WorkerUrl, { type: "module" }) : (null as unknown as Worker);
    file
      .arrayBuffer()
      .then((fileBuffer) => {
        const cleanup = () => { try { worker?.terminate(); } catch { /* noop */ } };
        if (!worker) throw new Error('Worker is not available in this environment');
        worker.onmessage = async (
          e: MessageEvent<{
            type: "progress" | "done" | "error";
            payload: unknown;
          }>,
        ) => {
          const { type, payload } = e.data;
          if (type === "progress") {
            const p = payload as { progress: number; step: string };
            onProgress?.(p.progress, p.step);
          } else if (type === "done") {
            const pl = payload as {
              icoBuffer: ArrayBuffer;
              pngs: { size: number; buffer: ArrayBuffer }[];
            };
            const icoBlob = new Blob([pl.icoBuffer], { type: "image/x-icon" });
            const pngs = await Promise.all(
              pl.pngs.map(async (p) => ({
                size: p.size,
                blob: new Blob([p.buffer], { type: "image/png" }),
              })),
            );
            cleanup();
            resolve({ icoBlob, pngs });
          } else if (type === "error") {
            cleanup();
            const err = payload as { message: string };
            reject(new Error(err.message));
          }
        };
        worker.onerror = (err) => {
          cleanup();
          reject(err);
        };
        worker.postMessage(
          {
            type: "start",
            payload: {
              fileBuffer,
              mimeType: file.type,
              sizes,
              options,
            },
          },
          [fileBuffer],
        );
      })
      .catch(reject);
  });
};
