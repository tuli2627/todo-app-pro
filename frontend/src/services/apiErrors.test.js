import { getApiErrorMessage } from "./apiErrors";

describe("API error messages", () => {
  test("shows field validation details from the standard API error envelope", () => {
    expect(getApiErrorMessage(
      {
        success: false,
        error: {
          message: "Request failed.",
          detail: {
            photo: ["Photo uploads must be JPG or JPEG files."],
            distance: ["Must be a valid number."],
          },
        },
      },
      "Save failed."
    )).toBe("photo: Photo uploads must be JPG or JPEG files. distance: Must be a valid number.");
  });

  test("shows a specific API message when there are no details", () => {
    expect(getApiErrorMessage(
      { error: { message: "Your session expired." } },
      "Save failed."
    )).toBe("Your session expired.");
  });

  test("uses the fallback for a generic error envelope", () => {
    expect(getApiErrorMessage(
      { success: false, error: { message: "Request failed.", detail: {} } },
      "Save failed."
    )).toBe("Save failed.");
  });
});
