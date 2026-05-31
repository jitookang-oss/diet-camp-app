import { handleCronAlimtalk } from "@/lib/cron-alimtalk";

export const GET = (request: Request) =>
  handleCronAlimtalk({
    request,
    templateEnvKey: "SOLAPI_TEMPLATE_EVENING",
    checkinType: "evening_exercise",
    buttonName: "✅ 저녁 운동 완료",
  });
