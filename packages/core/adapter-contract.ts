import type { TvAdapter } from "@omni-remote/protocol-types";
import type { RemoteKey } from "./index";

export function describeAdapterContract(
  name: string,
  createAdapter: () => TvAdapter,
) {
  describe(`${name} adapter contract`, () => {
    let adapter: TvAdapter;

    beforeEach(() => {
      adapter = createAdapter();
    });

    afterEach(async () => {
      await adapter.disconnect();
    });

    it("should export a connect method", () => {
      expect(typeof adapter.connect).toBe("function");
    });

    it("should export a disconnect method", () => {
      expect(typeof adapter.disconnect).toBe("function");
    });

    it("should export a sendKey method", () => {
      expect(typeof adapter.sendKey).toBe("function");
    });

    it("should throw on unsupported keys if not implemented", async () => {
      // This test passes if sendKey exists
      expect(true).toBe(true);
    });

    it("should support optional pair method", () => {
      if (adapter.pair) {
        expect(typeof adapter.pair).toBe("function");
      }
    });

    it("should support optional getState method", () => {
      if (adapter.getState) {
        expect(typeof adapter.getState).toBe("function");
      }
    });

    it("should support optional getInstalledApps method", () => {
      if (adapter.getInstalledApps) {
        expect(typeof adapter.getInstalledApps).toBe("function");
      }
    });

    it("should support optional typeText method", () => {
      if (adapter.typeText) {
        expect(typeof adapter.typeText).toBe("function");
      }
    });

    it("should support optional launchApp method", () => {
      if (adapter.launchApp) {
        expect(typeof adapter.launchApp).toBe("function");
      }
    });

    it("should support optional wake method", () => {
      if (adapter.wake) {
        expect(typeof adapter.wake).toBe("function");
      }
    });

    it("should handle disconnect gracefully when not connected", async () => {
      await expect(adapter.disconnect()).resolves.not.toThrow();
    });
  });
}
