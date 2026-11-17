export default function SignUpPage() {
  return (
    <main className="mx-auto max-w-md px-4 pb-12 pt-10 sm:px-0">
      <section className="card-premium p-6">
        <h1 className="text-3xl" style={{ fontFamily: "var(--font-display)" }}>Create your account</h1>
        <form className="mt-6 space-y-3">
          <input placeholder="First name" className="w-full rounded-xl border border-[#d8c8b0] bg-white px-4 py-2.5" />
          <input placeholder="Last name" className="w-full rounded-xl border border-[#d8c8b0] bg-white px-4 py-2.5" />
          <input placeholder="Email" className="w-full rounded-xl border border-[#d8c8b0] bg-white px-4 py-2.5" />
          <input placeholder="Password" type="password" className="w-full rounded-xl border border-[#d8c8b0] bg-white px-4 py-2.5" />
          <button className="w-full rounded-full bg-[#1b1b1b] py-2.5 text-white">Create account</button>
        </form>
      </section>
    </main>
  );
}
