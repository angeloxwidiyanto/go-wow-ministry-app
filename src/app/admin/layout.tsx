import Sidebar from "@/components/Sidebar";
import TopAppBar from "@/components/TopAppBar";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 ml-72 min-h-screen">
        <TopAppBar />
        <div className="pt-28 pb-12 px-10 max-w-7xl mx-auto">{children}</div>
      </main>
    </div>
  );
}
