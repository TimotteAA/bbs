import { Link, createFileRoute } from "@tanstack/react-router";
import { Button } from "@bbs/components/ui";

export const Route = createFileRoute("/")({
  component: IndexComponent,
});

function IndexComponent() {
  return (
    <div className={`p-2`}>
      <div className={`text-lg`}>Welcome Home!</div>
      <hr className={`my-2`} />
      <Link
        to="/users"
        className={`py-1 px-2 text-xs bg-blue-500 text-white rounded-full`}
      >
        Users
      </Link>
      <Link to="/auth">Auth</Link>
      <Button>shadcn Button!</Button>
      <div className="mt-4">asdas</div>
    </div>
  );
}
