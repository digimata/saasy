import type { Metadata } from "next";
import { IconBox, IconPlus } from "@/components/ui/icons";

export const metadata: Metadata = { title: "Projects" };
import { Button } from "@/components/ui/button";

const projects = [
  { name: "Marketing Site", tasks: 12, updated: "2 hours ago" },
  { name: "Mobile App", tasks: 8, updated: "Yesterday" },
  { name: "API v2", tasks: 24, updated: "3 days ago" },
  { name: "Design System", tasks: 6, updated: "1 week ago" },
];

export default function ProjectsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-heading-24 font-medium">Projects</h1>
        <Button variant="outline" size="icon" className="rounded-full size-10">
          <IconPlus className="size-3.5" />
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {projects.map((project) => (
          <div
            key={project.name}
            className="rounded-lg border border-ds-gray-100 bg-ds-bg-300 p-5 space-y-4 cursor-pointer hover:border-ds-gray-200 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="grid place-items-center size-8 rounded-lg bg-ds-bg-200">
                <IconBox className="size-3.5 text-ds-gray-600" />
              </div>
              <span className="text-label-14 font-medium">{project.name}</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-label-13 text-muted-foreground">{project.tasks} tasks</span>
              <span className="text-label-12 text-ds-gray-500">{project.updated}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
