import { describe, it, expect } from "vitest";

import { sanitizeSvgText } from "../svgSanitize";

describe("sanitizeSvgText", () => {
  it("removes script and event handlers", () => {
    const dirty =
      '<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script><rect width="10" height="10" onclick="x()"/></svg>';
    const clean = sanitizeSvgText(dirty);
    expect(clean).not.toContain("<script");
    expect(clean).not.toContain("onclick=");
  });

  it("blocks external href and style url()", () => {
    const dirty =
      '<svg xmlns="http://www.w3.org/2000/svg"><use href="https://evil.com/x.svg"/><rect style="fill:url(http://evil)"/></svg>';
    const clean = sanitizeSvgText(dirty);
    expect(clean).not.toContain('href="https://');
    expect(clean).not.toContain("url(");
  });
});










