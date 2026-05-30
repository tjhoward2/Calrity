import { redirect } from "next/navigation";

export default function Home() {
  // PRD §6.2: /today is the default after login. Middleware sends signed-out
  // users to /login.
  redirect("/today");
}
