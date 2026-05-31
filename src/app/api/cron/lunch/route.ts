import { handleCronAlimtalk } from "@/lib/cron-alimtalk";

export const GET = (request: Request) =>
  handleCronAlimtalk({
    request,
    templateEnvKey: "SOLAPI_TEMPLATE_LUNCH",
    checkinType: "lunch_walk",
    buttonName: "✅ 점심 걷기 완료",
  });
