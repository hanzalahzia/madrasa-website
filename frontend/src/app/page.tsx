import { getHomeData } from "@/lib/server-site";
import { HomePage } from "./home-page";

export default async function Page() {
  const initial = await getHomeData();
  return <HomePage initial={initial} />;
}
