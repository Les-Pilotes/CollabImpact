import { describe, it, expect, vi, beforeEach } from "vitest";

const { sendEmailMock } = vi.hoisted(() => ({
  sendEmailMock: vi.fn().mockResolvedValue({ sent: true, id: "id-1" }),
}));

vi.mock("@/lib/email/client", () => ({
  sendEmail: sendEmailMock,
}));

vi.mock("@/lib/app-url", () => ({
  getAppUrl: () => "https://workshop.les-pilotes.fr",
}));

import { sendAdminInvitation } from "@/lib/email/admin-invitation";
import AdminInvitation from "@/lib/email/templates/AdminInvitation";

beforeEach(() => vi.clearAllMocks());

describe("sendAdminInvitation", () => {
  it("dispatches an email with the login URL and a friendly subject", async () => {
    await sendAdminInvitation({
      email: "bocar@les-pilotes.fr",
      firstName: "Bocar",
      invitedByName: "Amadou",
    });

    expect(sendEmailMock).toHaveBeenCalledTimes(1);
    const args = sendEmailMock.mock.calls[0][0];
    expect(args.to).toBe("bocar@les-pilotes.fr");
    expect(args.subject).toMatch(/admin/i);
    expect(args.react.type).toBe(AdminInvitation);
    expect(args.react.props.loginUrl).toBe(
      "https://workshop.les-pilotes.fr/admin/login",
    );
    expect(args.react.props.firstName).toBe("Bocar");
    expect(args.react.props.invitedByName).toBe("Amadou");
  });

  it("tolerates a missing first name and inviter name", async () => {
    await sendAdminInvitation({ email: "x@les-pilotes.fr" });

    const props = sendEmailMock.mock.calls[0][0].react.props;
    expect(props.firstName).toBeNull();
    expect(props.invitedByName).toBeNull();
  });
});
