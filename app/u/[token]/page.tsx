import Image from "next/image";
import { notFound } from "next/navigation";
import { getPublicUserByToken } from "@/app/lib/public-users";

type PublicUserPageProps = {
  params: Promise<{
    token: string;
  }>;
};

export default async function PublicUserPage({ params }: PublicUserPageProps) {
  const { token } = await params;
  const user = await getPublicUserByToken(token);

  if (!user) {
    notFound();
  }

  const linkItems = user.socialLinks.filter((item) => item.type === "link");
  const qrItems = user.socialLinks.filter((item) => item.type === "qrcode");

  return (
    <main className="min-h-screen bg-zinc-100 px-4 py-6 text-zinc-950">
      <div className="mx-auto flex w-full max-w-md flex-col gap-4">
        <section className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-zinc-500">ComiLink</p>
          <h1 className="mt-2 text-2xl font-semibold">{user.username}</h1>
        </section>

        <section className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold">Stamp</h2>
          <div className="mt-4 flex justify-center">
            {user.stampImageUrl ? (
              <Image
                alt={`${user.username} stamp`}
                className="aspect-[3/4] w-full max-w-[300px] rounded-md border border-zinc-200 bg-zinc-50 object-contain"
                height={800}
                priority
                src={user.stampImageUrl}
                width={600}
              />
            ) : (
              <div className="flex aspect-[3/4] w-full max-w-[300px] items-center justify-center rounded-md border border-dashed border-zinc-300 bg-zinc-50 text-sm text-zinc-500">
                No stamp yet
              </div>
            )}
          </div>
        </section>

        <section className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold">Social Links</h2>
          {user.socialLinks.length === 0 ? (
            <p className="mt-4 rounded-md bg-zinc-50 px-3 py-2 text-sm text-zinc-500">
              No social links yet.
            </p>
          ) : null}

          {linkItems.length > 0 ? (
            <div className="mt-4 grid gap-2">
              {linkItems.map((item) => (
                <a
                  className="flex min-h-11 items-center justify-between gap-3 rounded-md border border-zinc-200 px-3 py-2 text-sm font-medium text-zinc-900 transition hover:bg-zinc-50"
                  href={item.url || "#"}
                  key={item.id}
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  <span>{item.platformName}</span>
                  <span className="truncate text-xs text-zinc-500">
                    {item.url}
                  </span>
                </a>
              ))}
            </div>
          ) : null}

          {qrItems.length > 0 ? (
            <div className="mt-5 grid gap-4">
              {qrItems.map((item) => (
                <div
                  className="rounded-md border border-zinc-200 p-3"
                  key={item.id}
                >
                  <p className="text-sm font-medium text-zinc-900">
                    {item.platformName}
                  </p>
                  {item.imageUrl ? (
                    <div className="mt-3 flex justify-center">
                      <Image
                        alt={`${item.platformName} QR code`}
                        className="h-48 w-48 rounded-md border border-zinc-200 bg-white object-contain"
                        height={600}
                        src={item.imageUrl}
                        width={600}
                      />
                    </div>
                  ) : (
                    <p className="mt-2 text-sm text-zinc-500">
                      No QR code image.
                    </p>
                  )}
                </div>
              ))}
            </div>
          ) : null}
        </section>
      </div>
    </main>
  );
}
