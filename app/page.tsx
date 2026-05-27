import { redirect } from "next/navigation";

// Root route always redirects to login; middleware handles logged-in redirects.
export default function RootPage() {
  redirect("/login");
}
