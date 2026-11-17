import { redirect } from "next/navigation";

export default function AdminWithdrawalsRedirect() {
  redirect("/admin/finance");
}
