import { beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ currentUser: vi.fn(), getSignupByEmail: vi.fn() }));
vi.mock("@clerk/nextjs/server", () => ({ currentUser: mocks.currentUser }));
vi.mock("@/lib/db/signups", () => ({ getSignupByEmail: mocks.getSignupByEmail, getChildrenCount: async () => 0 }));
vi.mock("@/lib/interests", () => ({ getInterestPool: async () => [] }));
vi.mock("@/lib/referral-names", () => ({ getReferrerLine: async () => null }));
vi.mock("./signup-form", () => ({ default: "signup-form" }));
vi.mock("./interest-tiles", () => ({ default: "interest-tiles" }));
vi.mock("next/navigation", () => ({ redirect: (url: string) => { throw new Error(`redirect:${url}`); } }));
import SignupPage from "./page";
const user = { firstName: "Example", primaryEmailAddressId: "one", primaryEmailAddress: { emailAddress: "member@example.test" }, emailAddresses: [{ id: "one", emailAddress: "member@example.test", verification: { status: "verified" } }] };
beforeEach(() => { vi.clearAllMocks(); mocks.currentUser.mockResolvedValue(user); });
describe("returning signup", () => {
  it("resumes the saved profile instead of creating a new family", async () => {
    mocks.getSignupByEmail.mockResolvedValue({ id: "saved", extra: {} });
    await expect(SignupPage({ searchParams: Promise.resolve({}) })).rejects.toThrow("redirect:/signup/thanks?id=saved");
    expect(mocks.getSignupByEmail).toHaveBeenCalledWith("member@example.test");
  });
  it("sends completed members to their family", async () => {
    mocks.getSignupByEmail.mockResolvedValue({ id: "saved", extra: { onboardedAt: "2026-01-01" } });
    await expect(SignupPage({ searchParams: Promise.resolve({}) })).rejects.toThrow("redirect:/family");
  });
  it("does not resolve a profile for an unverified session or anonymous visitor", async () => {
    mocks.currentUser.mockResolvedValue({ ...user, emailAddresses: [] });
    await SignupPage({ searchParams: Promise.resolve({}) });
    mocks.currentUser.mockResolvedValue(null);
    await SignupPage({ searchParams: Promise.resolve({}) });
    expect(mocks.getSignupByEmail).not.toHaveBeenCalled();
  });
});
