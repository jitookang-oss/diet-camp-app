import crypto from "crypto";
import { SolapiMessageService } from "solapi";

const client = new SolapiMessageService(
  process.env.SOLAPI_API_KEY!,
  process.env.SOLAPI_API_SECRET!
);

export function generateCheckinToken(phone: string, date: string, type: string): string {
  const secret = process.env.CHECKIN_SECRET || "diet-camp-secret";
  return crypto
    .createHmac("sha256", secret)
    .update(`${phone}:${date}:${type}`)
    .digest("hex")
    .slice(0, 16);
}

export function verifyCheckinToken(
  phone: string,
  date: string,
  type: string,
  token: string
): boolean {
  return generateCheckinToken(phone, date, type) === token;
}

export async function sendAlimtalk({
  to,
  templateId,
  variables,
  buttonName,
  buttonUrl,
}: {
  to: string;
  templateId: string;
  variables: Record<string, string>;
  buttonName: string;
  buttonUrl: string;
}) {
  return client.send({
    to,
    from: process.env.SOLAPI_SENDER_PHONE!,
    type: "ATA",
    kakaoOptions: {
      pfId: process.env.SOLAPI_PFID!,
      templateId,
      variables,
      buttons: [
        {
          buttonType: "WL",
          buttonName,
          linkMo: buttonUrl,
          linkPc: buttonUrl,
        },
      ],
    },
  });
}
