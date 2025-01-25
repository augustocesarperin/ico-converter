import { describe, it, expect } from "vitest";
import { computeSmallIconHint, SmallIconResolution } from "../smallIconHint";

function makeCanvas(size: number, alphaPredicate: (x: number, y: number) => number) {
  const width = size;
  const height = size;
  const data = new Uint8ClampedArray(width * height * 4);
  let p = 0;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      data[p++] = 0; // r
      data[p++] = 0; // g
      data[p++] = 0; // b
      data[p++] = alphaPredicate(x, y); // a
    }
  }
  return {
    getContext: () => ({
      getImageData: () => ({ data }),
    }),
  } as any;
}

describe("computeSmallIconHint", () => {
  it("returns null when no 16/32 candidate exists", () => {
    const res: SmallIconResolution[] = [{ size: 64, canvas: makeCanvas(64, () => 255) }];
    expect(computeSmallIconHint(res)).toBeNull();
  });

  it("returns 'thin' when opaque coverage < 28% on 16px", () => {
    const size = 16;
    const threshold = Math.floor(size * size * 0.26);
    let count = 0;
    const canvas = makeCanvas(size, () => (count++ < threshold ? 255 : 0));
    const res: SmallIconResolution[] = [{ size, canvas }];
    expect(computeSmallIconHint(res)).toBe("thin");
  });

  it("returns 'bold' when opaque coverage > 70% on 16px", () => {
    const size = 16;
    const threshold = Math.floor(size * size * 0.90);
    let count = 0;
    const canvas = makeCanvas(size, () => (count++ < threshold ? 255 : 0));
    const res: SmallIconResolution[] = [{ size, canvas }];
    expect(computeSmallIconHint(res)).toBe("bold");
  });

  it("falls back to 32px when 16px not present", () => {
    const size = 32;
    const threshold = Math.floor(size * size * 0.9);
    let count = 0;
    const canvas = makeCanvas(size, () => (count++ < threshold ? 255 : 0));
    const res: SmallIconResolution[] = [{ size, canvas }];
    expect(computeSmallIconHint(res)).toBe("bold");
  });

  it("returns null when coverage between thresholds", () => {
    const size = 16;
    const low = Math.floor(size * size * 0.4);
    let count = 0;
    const canvas = makeCanvas(size, () => (count++ < low ? 255 : 0));
    const res: SmallIconResolution[] = [{ size, canvas }];
    expect(computeSmallIconHint(res)).toBeNull();
  });
});







