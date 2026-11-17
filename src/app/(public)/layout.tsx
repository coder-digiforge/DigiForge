import { GuestFooter } from "@/components/GuestFooter";
import { GuestHeader } from "@/components/GuestHeader";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <GuestHeader />
      <main className="flex-1">{children}</main>
      <GuestFooter />
    </div>
  );
}
