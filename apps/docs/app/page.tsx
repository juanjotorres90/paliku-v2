import { Button } from "@repo/ui/components/button";
import { Card } from "@repo/ui/components/card";
import { Checkbox } from "@repo/ui/components/checkbox";
import { Code } from "@repo/ui/components/code";
import { Gradient } from "@repo/ui/components/gradient";
import { Input } from "@repo/ui/components/input";
import { Skeleton } from "@repo/ui/components/skeleton";
import { Textarea } from "@repo/ui/components/textarea";
import { TurborepoLogo } from "@repo/ui/components/turborepo-logo";

export default function Home(): React.ReactElement {
  return (
    <main className="min-h-screen p-8 flex flex-col items-center justify-center gap-8">
      <h1 className="text-3xl font-bold">Docs App</h1>

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
        <div className="flex gap-4">
          <Button>Default</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="destructive">Destructive</Button>
          <Button variant="link">Link</Button>
        </div>
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

      <section className="flex flex-col gap-4 items-center">
        <h2 className="text-xl font-semibold">Input Component</h2>
        <div className="flex flex-col gap-4 w-full max-w-sm">
          <Input placeholder="Default input" />
          <Input type="email" placeholder="Email input" />
          <Input type="password" placeholder="Password input" />
          <Input disabled placeholder="Disabled input" />
        </div>
      </section>

      <section className="flex flex-col gap-4 items-center">
        <h2 className="text-xl font-semibold">Checkbox Component</h2>
        <div className="flex flex-col gap-4">
          <div className="flex items-center space-x-2">
            <Checkbox id="terms" />
            <label htmlFor="terms" className="text-sm font-medium leading-none">
              Accept terms and conditions
            </label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox id="checked" defaultChecked />
            <label
              htmlFor="checked"
              className="text-sm font-medium leading-none"
            >
              Checked by default
            </label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox id="disabled" disabled />
            <label
              htmlFor="disabled"
              className="text-sm font-medium leading-none opacity-50"
            >
              Disabled checkbox
            </label>
          </div>
        </div>
      </section>

      <section className="flex flex-col gap-4 items-center">
        <h2 className="text-xl font-semibold">Textarea Component</h2>
        <div className="flex flex-col gap-4 w-full max-w-sm">
          <Textarea placeholder="Type your message here." />
          <Textarea placeholder="Disabled textarea" disabled />
        </div>
      </section>

      <section className="flex flex-col gap-4 items-center">
        <h2 className="text-xl font-semibold">Skeleton Component</h2>
        <div className="flex flex-col gap-4 w-full max-w-sm">
          <div className="flex items-center space-x-4">
            <Skeleton className="h-12 w-12 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-[250px]" />
              <Skeleton className="h-4 w-[200px]" />
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
