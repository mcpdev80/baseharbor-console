import Link from "next/link";
import { Panel } from "@/components/ui/panel";
import { RepositoryTable } from "@/components/repositories/repository-table";
import { previewData } from "@/lib/baseharbor/data";

export default async function RepositoriesPage() {
  const repositories = await previewData.repositories();

  return (
    <div className="mx-auto max-w-[1600px] space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <p className="mb-2 text-xs font-medium uppercase tracking-[.18em] text-[var(--bh-signal-blue)]">Source</p>
          <h1 className="text-2xl font-semibold tracking-tight text-white">Repositories</h1>
          <p className="mt-2 max-w-3xl text-sm text-[var(--muted)]">
            Register existing local repositories, inspect source identity and enter the BaseHarbor adoption/init flow without turning Console into a Git server.
          </p>
        </div>
        <Link href="/repositories/new" className="inline-flex min-h-10 items-center rounded-md bg-[var(--bh-ocean-blue)] px-3.5 text-xs font-medium text-white">
          Register repository
        </Link>
      </div>

      <Panel title="Known repositories" subtitle="Repository state is source context; BaseHarbor application state remains separate.">
        <RepositoryTable repositories={repositories} />
      </Panel>
    </div>
  );
}
