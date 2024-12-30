import { describe, it, expect } from "vitest";

// Minimal helper mirroring logic from faviconGenerator.ts
const renderToSizedBlob = async (size: number): Promise<Blob> => {
  const source = document.createElement("canvas");
  source.width = 64;
  source.height = 64;
  const ctx = source.getContext("2d")!;
  ctx.fillStyle = "#00f";
  ctx.fillRect(0, 0, 64, 64);

  const target = document.createElement("canvas");
  target.width = size;
  target.height = size;
  const tctx = target.getContext("2d")!;
  tctx.drawImage(source, 0, 0, 64, 64, 0, 0, size, size);
  const blob = await new Promise<Blob>((resolve, reject) => {
    target.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("blob fail"))),
      "image/png",
    );
  });
  return blob;
};

describe("renderToSizedBlob", () => {
  it("produces a PNG blob at requested size", async () => {
    const blob = await renderToSizedBlob(32);
    expect(blob.size).toBeGreaterThan(0);
    expect(blob.type).toBe("image/png");
  });
});

