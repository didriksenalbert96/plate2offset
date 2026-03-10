import Link from "next/link";

export default function AboutPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-stone-50 to-emerald-50 px-4 py-12">
      <main className="w-full max-w-md space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-stone-900">
            Our thinking
          </h1>
        </div>

        <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-stone-200 space-y-4 text-stone-700 text-[15px] leading-relaxed">
          <p>
            Most of us eat animal products without thinking much about it.
            We're not here to guilt anyone. It's what we grew up with, it's
            tradition, and old habits run deep.
          </p>

          <p>
            But animal farming does cause a lot of suffering. So we built
            a tool: tell us what you ate, and we'll suggest a small
            donation to help farmed animals through{" "}
            <a
              href="https://www.farmkind.giving"
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-2 text-emerald-600 hover:text-emerald-700"
            >
              FarmKind
            </a>
            , a charity evaluator focused on the most effective animal welfare
            organizations.
          </p>

          <p>
            Think of it like a carbon offset, but for animals. You eat a
            chicken sandwich, you chip in a few cents to help chickens
            somewhere else. It won't undo what happened, but it tips the
            scales a little.
          </p>

          <p>
            The suggested amounts are rough estimates based on the type and
            quantity of animal products in your meal. They're not an exact
            science, but every bit helps, and the more you give, the better
            the world gets for animals.
          </p>

          <p className="text-stone-500 text-sm">
            Plate2Offset is not affiliated with FarmKind or Every.org.
            Donations go directly to FarmKind through Every.org's platform.
          </p>
        </div>

        <Link
          href="/"
          className="block w-full rounded-full border border-stone-300 px-6 py-3 text-center text-stone-700 transition-colors hover:bg-stone-100"
        >
          Back to the app
        </Link>

        <p className="text-center text-xs text-stone-400">
          Built by Albert Didriksen
        </p>
      </main>
    </div>
  );
}
