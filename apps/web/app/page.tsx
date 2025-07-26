import Link from "next/link";
import { Button } from "../components/Button";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center h-screen gap-10">
      <h1 className="text-5xl font-bold text-center">Fermion Assignment</h1>
      <div className="flex gap-6">
        <Link href="/stream">
          <Button color="blue">Stream</Button>
        </Link>

        <Link href="/watch">
          <Button color="green">Watch</Button>
        </Link>
      </div>
    </div>
  );
}
