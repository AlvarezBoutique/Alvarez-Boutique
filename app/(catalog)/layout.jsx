import Sidebar from "../components/Sidebar";
import MobileNav from "../components/MobileNav";

/** Chrome for the public catalog only — /admin has its own shell. */
export default function CatalogLayout({ children }) {
  return (
    <>
      <Sidebar />
      <MobileNav />
      <main className="min-h-screen lg:ml-sidebar-width">{children}</main>
    </>
  );
}
