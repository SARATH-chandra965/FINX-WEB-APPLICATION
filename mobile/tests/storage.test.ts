import { beforeEach, describe, expect, it, vi } from "vitest";

const { getItem, setItem, removeItem } = vi.hoisted(() => ({
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
}));
vi.mock("@react-native-async-storage/async-storage", () => ({
  default: {
    getItem,
    setItem,
    removeItem,
  },
}));

import { clearProfilePhoto, loadHistory, loadLanguage, loadProfilePhoto, saveProfilePhoto } from "../src/services/storage";

describe("local history storage", () => {
  beforeEach(() => getItem.mockReset());

  it("reports corrupted JSON instead of silently showing fake empty history", async () => {
    getItem.mockResolvedValue("{invalid");
    await expect(loadHistory()).rejects.toThrow(/corrupted/i);
  });

  it("rejects records that do not match the metadata schema", async () => {
    getItem.mockResolvedValue(JSON.stringify([{ content: "private message" }]));
    await expect(loadHistory()).rejects.toThrow(/invalid format/i);
  });

  it("restores each supported language from local storage", async () => {
    for (const language of ["en", "te", "hi", "ta", "kn"] as const) {
      getItem.mockResolvedValueOnce(language);
      await expect(loadLanguage()).resolves.toBe(language);
    }
  });

  it("saves, restores, and removes a local profile photo reference", async () => {
    setItem.mockResolvedValue(undefined);
    removeItem.mockResolvedValue(undefined);
    getItem.mockResolvedValue("file:///profile-photo.jpg");

    await saveProfilePhoto("file:///profile-photo.jpg");
    await expect(loadProfilePhoto()).resolves.toBe("file:///profile-photo.jpg");
    await clearProfilePhoto();

    expect(setItem).toHaveBeenCalledWith("@finx/profile-photo/v1", "file:///profile-photo.jpg");
    expect(removeItem).toHaveBeenCalledWith("@finx/profile-photo/v1");
  });

  it("rejects an invalid stored profile photo reference", async () => {
    getItem.mockResolvedValue(" ");
    await expect(loadProfilePhoto()).rejects.toThrow(/invalid/i);
  });
});
