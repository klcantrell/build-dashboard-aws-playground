"use client";

import { useQuery } from "@tanstack/react-query";

export default function Main() {
  const data = useQuery({
    queryKey: ["bananaPhone"],
    queryFn: fetchBananaPhone,
  });

  return (
    <main className="flex min-h-screen flex-col items-center mt-12">
      <h1 className="text-xl font-semibold">Build dashboard</h1>
      <section className="mt-8">
        {data.isLoading || data.data == null ? (
          <p>Loading...</p>
        ) : (
          <>
            <h2 className="text-lg font-semibold">Data</h2>
            <p>{data.data}</p>
          </>
        )}
      </section>
    </main>
  );
}

function fetchBananaPhone(): Promise<string> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve("banana phone!");
    }, 2000);
  });
}
