import type { Metadata } from "next";
import AdminShell from "./AdminShell";

// Belt-and-suspenders alongside robots.txt: keeps /admin out of search
// results even if a page were ever linked to from elsewhere.
export const metadata: Metadata = {
  robots: { index: false, follow: false, nocache: true },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <AdminShell>{children}</AdminShell>;
}
