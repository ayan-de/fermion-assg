import Link from "next/link";

export const Header = ({
  status,
  buttonText,
  buttonLink,
}: {
  status: string;
  buttonText: string;
  buttonLink: string;
}) => {
  return (
    <div className="mb-4 p-2 bg-gray-800 text-white rounded-lg flex flex-row justify-between items-center">
      <p className="text-sm font-mono">Status: {status}</p>
      <Link href={buttonLink}>
        <button className="px-6 py-3 bg-green-600 text-white text-lg font-semibold rounded-lg shadow-md hover:bg-green-700 transition">
          {buttonText}
        </button>
      </Link>
    </div>
  );
};
