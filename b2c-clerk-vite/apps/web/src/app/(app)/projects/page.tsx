export default function ProjectsPage() {
  return (
    <div className="max-w-3xl">
      <div className="mb-6">
        <h1 className="text-heading-24 font-semibold">Projects</h1>
        <p className="text-copy-14 text-muted-foreground mt-1">
          A place to organize your work.
        </p>
      </div>
      <div className="rounded-lg border border-ds-gray-100 p-12 text-center">
        <p className="text-copy-14 text-muted-foreground">
          No projects yet.
        </p>
      </div>
    </div>
  );
}
