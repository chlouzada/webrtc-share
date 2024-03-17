import { createRootRoute, Link, Outlet } from "@tanstack/react-router";

export const Route = createRootRoute({
  component: () => (
    <div className="flex flex-col h-screen justify-between">
      <div className="p-2 flex gap-2 bg-red-500">
        <Link to="/" className="[&.active]:font-bold">
          Home
        </Link>
      </div>
      <div className="max-w-4xl mx-auto ">
        <Outlet />
      </div>
      <footer className="h-12 bg-red-500"></footer>
    </div>
  ),
});
