import { redirect } from "next/navigation";

export default function Home() {
  // Middleware sends signed-out users to /login.
  redirect("/inbox");
}
