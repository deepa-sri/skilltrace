import Image from "next/image";
import { RoleSelector } from "@/components/auth/role-selector";
import { Logo, LogoOnDark } from "@/components/shared/logo";
import { Icon } from "@/components/shared/icon";

export const metadata = { title: "Choose your role" };

const floatingIcons = [
  { name: "certificate", className: "top-[18%] left-[10%]" },
  { name: "employment", className: "top-[8%] right-[14%]" },
  { name: "analytics", className: "bottom-[16%] left-[18%]" },
  { name: "shield", className: "right-[10%] bottom-[26%]" },
];

export default async function LoginPage({ searchParams }) {
  const { role } = await searchParams;
  return (
    <div className="grid min-h-svh bg-white lg:grid-cols-[0.9fr_1.1fr]">
      <aside className="relative hidden flex-col overflow-hidden bg-gradient-to-b from-blue-800 via-blue-700 to-blue-600 p-10 text-white lg:flex">
        <LogoOnDark />
        <div className="mt-24 max-w-md">
          <h2 className="text-4xl leading-tight font-bold">
            One Platform.
            <br />
            Multiple Stakeholders.
          </h2>
          <p className="mt-4 text-blue-100">
            Empowering trainees, providers, employers and government with trusted data and real outcomes.
          </p>
        </div>
        <div className="relative mt-auto h-72">
          <Image
            src="/assets/illustrations/maharashtra_landmark_abstract.svg"
            alt=""
            fill
            className="object-contain object-bottom brightness-0 invert opacity-40"
          />
          {floatingIcons.map((icon) => (
            <span
              key={icon.name}
              className={`absolute grid size-14 place-items-center rounded-2xl border border-white/30 bg-white/15 backdrop-blur ${icon.className}`}
            >
              <Icon name={icon.name} className="size-7 text-white" />
            </span>
          ))}
        </div>
      </aside>

      <main className="flex flex-col">
        <header className="flex h-16 items-center border-b border-slate-100 px-4 lg:hidden">
          <Logo />
        </header>
        <div className="flex flex-1 items-center justify-center px-4 py-10 sm:px-8">
          <RoleSelector defaultRole={role} />
        </div>
      </main>
    </div>
  );
}
