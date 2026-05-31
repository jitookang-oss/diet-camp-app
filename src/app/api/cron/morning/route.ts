import { handleCronAlimtalk } from "@/lib/cron-alimtalk";

export const GET = (request: Request) =>
  handleCronAlimtalk({
    request,
    templateEnvKey: "SOLAPI_TEMPLATE_MORNING",
    checkinType: "supplement",
    buttonName: "✅ 영양제 챙겼어요",
  });
