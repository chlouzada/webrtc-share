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
  return <footer className="bg-gray-900 p-12 w-full"></footer>;
};

function Layout() {
  return (
    <div className="flex flex-col h-screen justify-between">
      <Header />
      <div className="max-w-4xl mx-auto ">
        <Outlet />
      </div>
      <Footer />
    </div>
  );
}
