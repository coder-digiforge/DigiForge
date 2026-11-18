import { GuestHeader } from "@/components/GuestHeader";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <GuestHeader />
      <main className="flex flex-1 flex-col justify-center">{children}</main>
    </div>
  );
}
