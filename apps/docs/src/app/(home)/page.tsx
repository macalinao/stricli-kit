import Link from "next/link";

function FeatureCard({
  title,
  description,
  icon,
}: {
  title: string;
  description: string;
  icon: string;
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-6 text-left">
      <div className="mb-3 text-2xl">{icon}</div>
      <h3 className="mb-2 font-semibold">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  );
}

function CodeBlock({ children }: { children: string }) {
  return (
    <pre className="overflow-x-auto rounded-lg bg-zinc-900 p-4 text-left text-sm text-zinc-100">
      <code>{children}</code>
    </pre>
  );
}

export default function HomePage() {
  return (
    <main className="flex flex-1 flex-col">
      {/* Hero Section */}
      <section className="flex flex-col items-center justify-center px-4 py-20 text-center">
        <div className="mb-4 inline-block rounded-full bg-primary/10 px-4 py-1 text-sm font-medium text-primary">
          File-based CLI routing for Stricli
        </div>
        <h1 className="mb-4 text-5xl font-bold tracking-tight">Stricli-Kit</h1>
        <p className="mb-8 max-w-2xl text-xl text-muted-foreground">
          Build type-safe CLIs with file-based routing. Define commands as
          files, generate route maps automatically.
        </p>
        <div className="flex gap-4">
          <Link
            href="/docs/getting-started/quick-start"
            className="rounded-lg bg-primary px-6 py-3 font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Get Started
          </Link>
          <Link
            href="/docs"
            className="rounded-lg border border-border px-6 py-3 font-medium transition-colors hover:bg-muted"
          >
            Documentation
          </Link>
        </div>
      </section>

      {/* Code Example Section */}
      <section className="border-y border-border bg-muted/30 px-4 py-16">
        <div className="mx-auto max-w-4xl">
          <h2 className="mb-8 text-center text-2xl font-bold">
            Commands as Files
          </h2>
          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <p className="mb-3 text-sm font-medium text-muted-foreground">
                Directory Structure
              </p>
              <CodeBlock>
                {`src/commands/
├── deploy.ts        → cli deploy
├── config/
│   ├── get.ts       → cli config get
│   └── set.ts       → cli config set
└── db/
    ├── migrate.ts   → cli db migrate
    └── seed.ts      → cli db seed`}
              </CodeBlock>
            </div>
            <div>
              <p className="mb-3 text-sm font-medium text-muted-foreground">
                Command Definition
              </p>
              <CodeBlock>
                {`// src/commands/deploy.ts
import { defineRoute, defineHandler } from
  "@macalinao/stricli-utils";

const params = defineParameters({
  flags: {
    env: {
      kind: "enum",
      values: ["dev", "prod"],
      brief: "Target environment",
    },
  },
});

export const command = defineRoute({
  handler: defineHandler((_ctx, { flags }) => {
    console.log(\`Deploying to \${flags.env}\`);
  }),
  params,
  docs: { brief: "Deploy the app" },
});`}
              </CodeBlock>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="px-4 py-16">
        <div className="mx-auto max-w-4xl">
          <h2 className="mb-8 text-center text-2xl font-bold">Features</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <FeatureCard
              icon="📁"
              title="File-Based Routing"
              description="Organize commands in directories. File paths map directly to CLI routes."
            />
            <FeatureCard
              icon="⚡"
              title="Code Generation"
              description="Generate route maps automatically. No manual registration needed."
            />
            <FeatureCard
              icon="👀"
              title="Watch Mode"
              description="Routes regenerate on file changes during development."
            />
            <FeatureCard
              icon="🔒"
              title="Type Safety"
              description="Full TypeScript support with inference for flags and arguments."
            />
            <FeatureCard
              icon="📦"
              title="Modular"
              description="Use only what you need. Core, codegen, config, and utils packages."
            />
            <FeatureCard
              icon="🛠️"
              title="Scaffolding"
              description="Generate new commands and packages with built-in templates."
            />
          </div>
        </div>
      </section>

      {/* Quick Install Section */}
      <section className="border-t border-border bg-muted/30 px-4 py-16">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="mb-4 text-2xl font-bold">Quick Install</h2>
          <CodeBlock>
            {
              "bun add @macalinao/stricli-kit @macalinao/stricli-utils @stricli/core"
            }
          </CodeBlock>
          <p className="mt-6 text-muted-foreground">
            Then run{" "}
            <code className="rounded bg-muted px-2 py-1">stricli-kit init</code>{" "}
            to set up your project.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border px-4 py-8 text-center text-sm text-muted-foreground">
        <p>
          Built with{" "}
          <Link
            href="https://github.com/bloomberg/stricli"
            className="underline hover:text-foreground"
          >
            Stricli
          </Link>
          . Open source on{" "}
          <Link
            href="https://github.com/macalinao/stricli-kit"
            className="underline hover:text-foreground"
          >
            GitHub
          </Link>
          .
        </p>
      </footer>
    </main>
  );
}
