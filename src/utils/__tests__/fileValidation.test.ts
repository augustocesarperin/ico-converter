import { describe, it, expect } from "vitest";

import { validateImageFile } from "../fileValidation";

const makePngFile = async (
  w: number,
  h: number,
  sizePad = 0,
): Promise<File> => {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const ctx = c.getContext("2d")!;
  ctx.fillStyle = "#090";
  ctx.fillRect(0, 0, w, h);
  const blob: Blob = await new Promise((resolve) =>
    c.toBlob((b) => resolve(b!), "image/png"),
  );
  const padded = new Blob([blob, new Uint8Array(sizePad)]);
  return new File([padded], "test.png", { type: "image/png" });
};

describe("validateImageFile", () => {
  it.skip("accepts a valid PNG within limits", async () => {
    const file = await makePngFile(128, 128);
    const res = await validateImageFile(file, {
      maxSizeInMB: 5,
      allowedTypes: ["image/png"],
    });
    expect(res.isValid).toBe(true);
    expect(res.error).toBeUndefined();
  });

  it("rejects wrong file type", async () => {
    const file = new File([new Uint8Array(10)], "bad.txt", {
      type: "text/plain",
    });
    const res = await validateImageFile(file, { allowedTypes: ["image/png"] });
    expect(res.isValid).toBe(false);
    expect(res.error).toBeTruthy();
  });

  it("rejects oversize", async () => {
    const file = await makePngFile(128, 128, 6 * 1024 * 1024);
    const res = await validateImageFile(file, {
      maxSizeInMB: 5,
      allowedTypes: ["image/png"],
    });
    expect(res.isValid).toBe(false);
    const msg = (res.error || "").toLowerCase();
    expect(
      msg.includes("grande") ||
        msg.includes("muitos uploads") ||
        msg.includes("aguarde")
    ).toBe(true);
  });
});

