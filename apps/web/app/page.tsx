import { Button } from "@repo/ui/button";
import { Card } from "@repo/ui/card";
import { Code } from "@repo/ui/code";
import { Gradient } from "@repo/ui/gradient";
import { TurborepoLogo } from "@repo/ui/turborepo-logo";

export default function Home() {
  return (
    <main className="min-h-screen p-8 flex flex-col items-center justify-center gap-8">
      <h1 className="text-3xl font-bold">Web App</h1>

      <section className="flex flex-col gap-4 items-center">
        <h2 className="text-xl font-semibold">Turborepo Logo</h2>
        <TurborepoLogo />
      </section>

      <section className="flex flex-col gap-4 items-center relative">
        <h2 className="text-xl font-semibold">Gradient Component</h2>
        <div className="relative w-64 h-32 overflow-hidden rounded-lg">
          <Gradient conic className="w-full h-full" />
        </div>
      </section>

      <section className="flex flex-col gap-4 items-center">
        <h2 className="text-xl font-semibold">Button Component</h2>
        <Button appName="web">Click me</Button>
      </section>

      <section className="flex flex-col gap-4 items-center">
        <h2 className="text-xl font-semibold">Card Component</h2>
        <Card title="Example Card" href="https://turborepo.com">
          This is a card component from the UI package.
        </Card>
      </section>

      <section className="flex flex-col gap-4 items-center">
        <h2 className="text-xl font-semibold">Code Component</h2>
        <p>
          Run <Code>pnpm dev</Code> to start the development server.
        </p>
      </section>
    </main>
  );
}
