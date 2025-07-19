import { Text, useMantineTheme } from "@mantine/core";
import { createRootRoute, Link, Outlet } from "@tanstack/react-router";

export const Route = createRootRoute({
  component: Layout,
});

const Header = () => {
  const theme = useMantineTheme();

  return (
    <header className="w-full">
      <div className="p-4 mx-auto max-w-7xl flex self-center">
        <Link to="/">
          <span className="text-2xl font-bold tracking-tight">
            WebRTC
            <Text component="span" c={theme.primaryColor}>
              <span className="text-2xl font-bold">Share</span>
            </Text>
          </span>
        </Link>
      </div>
      <hr />
    </header>
  );
};

const Footer = () => {
  return <footer className="bg-gray-100 p-4 w-full border-t text-center">
    {/* TODO: github link <Text size="sm" c="dimmed"></Text> */}
  </footer>;
};

function Layout() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 flex items-center justify-center">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
