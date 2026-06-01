import React from "react";
import { sendEmail } from "./client";
import { getAppUrl } from "@/lib/app-url";
import AdminInvitation from "./templates/AdminInvitation";

type Params = {
  email: string;
  firstName?: string | null;
  invitedByName?: string | null;
};

export async function sendAdminInvitation({
  email,
  firstName = null,
  invitedByName = null,
}: Params) {
  const loginUrl = `${getAppUrl()}/admin/login`;
  return sendEmail({
    to: email,
    subject: "Bienvenue dans l'admin Les Pilotes",
    react: React.createElement(AdminInvitation, {
      firstName,
      loginUrl,
      invitedByName,
    }),
  });
}
