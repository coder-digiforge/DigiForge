import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { BadgePercent, ShieldCheck, Wallet } from "lucide-react";
import { getSessionUser, homeForRole } from "@/lib/auth";
import { ButtonLink, Chip, Panel } from "@/components/ui";

const heroTrust = [
  { label: "Защита сделки", icon: ShieldCheck },
  { label: "Оплата через эскроу", icon: Wallet },
  { label: "Комиссия всего 10%", icon: BadgePercent },
] as const;

const categories = [
  {
    title: "Сайты и лендинги",
    hint: "Лендинг, магазин или сервис — без найма в штат и недель на поиск.",
    icon: "/landing/ico-web.png",
  },
  {
    title: "Мобильные приложения",
    hint: "Найдите исполнителя на iOS и Android: от MVP до публикации в сторах.",
    icon: "/landing/ico-mobile.png",
  },
  {
    title: "UI/UX дизайн",
    hint: "Макеты и интерфейсы с портфолио, которое можно проверить до сделки.",
    icon: "/landing/ico-design.png",
  },
  {
    title: "AI и автоматизация",
    hint: "Чат-боты, парсеры, ассистенты — под задачу, с понятным сроком и бюджетом.",
    icon: "/landing/ico-ai.png",
  },
  {
    title: "Маркетинг и рост",
    hint: "Контент, реклама и воронки — чтобы продукт находили, а не ждали.",
    icon: "/landing/ico-marketing.png",
  },
  {
    title: "Стратегия продукта",
    hint: "Приоритеты, ТЗ и этапы: что делать первым и где не сжечь бюджет.",
    icon: "/landing/ico-strategy.png",
  },
];

const steps = [
  {
    title: "Разместите заказ",
    text: "Опишите задачу, бюджет и срок. Фрилансеры откликаются сами — вы сравниваете.",
    icon: "/landing/step-order.png",
  },
  {
    title: "Выберите фрилансера",
    text: "Сравниваете рейтинг, отзывы и работы. Выбираете человека, а не «команду в общем».",
    icon: "/landing/step-choose.png",
  },
  {
    title: "Откройте эскроу-сделку",
    text: "Деньги в резерве до приёмки. Вы платите за результат. Комиссия 10%.",
    icon: "/landing/step-escrow.png",
  },
];

const freelancers = [
  {
    name: "Full-stack разработчик",
    rating: "4.9",
    reviews: "128 отзывов",
    tags: ["Python", "React", "Django"],
    avatar: "/landing/avatar-fullstack.png",
  },
  {
    name: "Data Scientist",
    rating: "4.8",
    reviews: "64 отзыва",
    tags: ["ML", "NLP"],
    avatar: "/landing/avatar-datascience.png",
  },
  {
    name: "UI/UX-дизайнер",
    rating: "5.0",
    reviews: "41 отзыв",
    tags: ["Figma", "Webflow"],
    avatar: "/landing/avatar-uiux.png",
  },
];

const stories = [
  {
    quote:
      "Эскроу в USDT закрыл вопрос доверия. Исполнитель получил оплату сразу после приёмки.",
    name: "Елена В.",
    role: "заказчик, магазин",
    photo: "/landing/photo-elena.png",
  },
  {
    quote: "Ставки без контактов до выбора — меньше спама, больше фокуса на брифе.",
    name: "Андрей К.",
    role: "fullstack",
    photo: "/landing/photo-andrey.png",
  },
  {
    quote: "Digi Prime поднял профиль в каталоге — первые проекты за неделю.",
    name: "Мария С.",
    role: "UI/UX",
    photo: "/landing/photo-maria.png",
  },
];

export default async function LandingPage() {
  const session = await getSessionUser();
  if (session) redirect(homeForRole(session.role));

  return (
    <div>
      <section className="relative isolate bg-[#120e0a]">
        {/* Glowing energy trails from banner across the header */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 z-0 overflow-hidden"
        >
          <svg
            className="absolute inset-0 h-full w-full"
            viewBox="0 0 1440 640"
            preserveAspectRatio="xMidYMid slice"
            fill="none"
          >
            <defs>
              <linearGradient id="dfTrailA" x1="1180" y1="320" x2="40" y2="180" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#f0c089" stopOpacity="0.95" />
                <stop offset="45%" stopColor="#e0a86b" stopOpacity="0.75" />
                <stop offset="100%" stopColor="#e0a86b" stopOpacity="0" />
              </linearGradient>
              <linearGradient id="dfTrailB" x1="1200" y1="380" x2="80" y2="420" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#f5d2a0" stopOpacity="0.7" />
                <stop offset="55%" stopColor="#d49a5a" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#d49a5a" stopOpacity="0" />
              </linearGradient>
              <linearGradient id="dfTrailC" x1="1100" y1="220" x2="200" y2="80" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#ffe0b0" stopOpacity="0.55" />
                <stop offset="100%" stopColor="#e0a86b" stopOpacity="0" />
              </linearGradient>
              <filter id="dfTrailGlow" x="-20%" y="-40%" width="140%" height="180%">
                <feGaussianBlur stdDeviation="6" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
              <filter id="dfTrailGlowSoft" x="-30%" y="-60%" width="160%" height="220%">
                <feGaussianBlur stdDeviation="14" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            <g className="df-trail-pulse-slow" filter="url(#dfTrailGlowSoft)" opacity="0.55">
              <path
                d="M1280 300C1080 250 920 210 720 230C480 255 280 200 60 150"
                stroke="url(#dfTrailA)"
                strokeWidth="10"
                strokeLinecap="round"
                fill="none"
              />
              <path
                d="M1260 360C1040 390 860 410 640 390C400 365 220 400 40 440"
                stroke="url(#dfTrailB)"
                strokeWidth="7"
                strokeLinecap="round"
                fill="none"
              />
            </g>

            <g className="df-trail-pulse" filter="url(#dfTrailGlow)">
              <path
                d="M1280 300C1080 250 920 210 720 230C480 255 280 200 60 150"
                stroke="url(#dfTrailA)"
                strokeWidth="2.2"
                strokeLinecap="round"
                fill="none"
              />
              <path
                d="M1260 360C1040 390 860 410 640 390C400 365 220 400 40 440"
                stroke="url(#dfTrailB)"
                strokeWidth="1.6"
                strokeLinecap="round"
                fill="none"
              />
              <path
                d="M1180 240C980 180 780 140 560 160C360 178 240 120 100 70"
                stroke="url(#dfTrailC)"
                strokeWidth="1.2"
                strokeLinecap="round"
                fill="none"
                opacity="0.7"
              />
            </g>

            <g filter="url(#dfTrailGlow)">
              <circle cx="1180" cy="268" r="3.5" fill="#ffe6c0" opacity="0.9" />
              <circle cx="1040" cy="248" r="2.2" fill="#f0c089" opacity="0.75" />
              <circle cx="920" cy="232" r="2.8" fill="#ffe6c0" opacity="0.65" />
              <circle cx="1100" cy="372" r="2.4" fill="#f5d2a0" opacity="0.7" />
              <circle cx="860" cy="398" r="1.8" fill="#e0a86b" opacity="0.55" />
            </g>
          </svg>
        </div>

        <div className="relative z-10 mx-auto grid max-w-[1440px] items-center gap-10 px-6 py-14 pb-10 md:grid-cols-2 md:gap-14 md:px-12 md:pb-12 md:pt-[72px] lg:px-20">
          <div className="space-y-6 md:max-w-[600px]">
            <div className="df-badge-shine inline-flex items-center rounded-full border border-[rgba(226,178,116,0.35)] bg-[#1c140f]/70 px-3 py-1.5 text-xs font-semibold text-accent">
              <i className="df-badge-shine-glare" aria-hidden />
              <span>Фриланс-биржа · эскроу · USDT</span>
            </div>
            <h1 className="font-[family-name:var(--font-syne)] text-[34px] font-bold leading-[1.15] text-[#f5e6c8] sm:text-[36px] lg:text-[40px]">
              Найдите своего специалиста.
              <br />
              Без долгого поиска.
            </h1>
            <p className="max-w-[520px] text-base leading-relaxed text-[#c4b8a8] md:text-[17px]">
              Разместите заказ, получите предложения от исполнителей и оплачивайте работу только
              после принятия результата.
            </p>
            <div className="flex flex-wrap gap-3">
              <ButtonLink
                href="/freelancers"
                className="!px-[22px] !py-3.5 !text-[15px] shadow-[0_0_28px_rgba(224,168,107,0.28)]"
              >
                Найти фрилансера
              </ButtonLink>
              <ButtonLink
                href="/projects"
                variant="ghost"
                className="!border-[rgba(226,178,116,0.45)] !bg-[#1c140f]/55 !px-[22px] !py-3.5 !text-[15px] text-[#f5e6c8]"
              >
                Заказы для фрилансеров
              </ButtonLink>
            </div>
          </div>

          <div className="relative w-full max-w-[640px] justify-self-center md:justify-self-end">
            <div
              aria-hidden
              className="pointer-events-none absolute -inset-3 z-0 rounded-[28px] bg-[radial-gradient(ellipse_at_center,rgba(224,168,107,0.18),transparent_70%)] blur-xl"
            />
            <div className="relative z-10 overflow-hidden rounded-[24px] border border-[rgba(226,178,116,0.35)] bg-[#1c140f] shadow-[0_0_32px_rgba(224,168,107,0.18)]">
              <Image
                src="/landing/hero-prime.png"
                alt="DigiForge — эскроу и сеть исполнителей"
                width={1536}
                height={1024}
                priority
                sizes="(max-width: 768px) 100vw, 640px"
                className="aspect-[640/420] h-auto w-full scale-[1.06] object-cover object-center"
              />
            </div>
            {/* Bottom underlight — edge-to-edge under the image */}
            <div
              aria-hidden
              className="pointer-events-none absolute -left-[2%] top-full z-0 mt-[-20px] h-[52px] w-[104%] bg-[rgba(224,168,107,0.55)] blur-[22px]"
            />
            <div
              aria-hidden
              className="pointer-events-none absolute left-0 top-full z-0 mt-[-8px] h-[22px] w-full bg-[rgba(234,186,120,0.42)] blur-[12px]"
            />
          </div>
        </div>

        {/* Trust row under banner — full screen width */}
        <div className="relative z-10 w-full pb-12 pt-6 md:pb-14">
          <ul className="mx-auto grid w-full max-w-[1100px] grid-cols-1 gap-5 px-6 text-[15px] text-[#e0a86b] sm:grid-cols-3 sm:gap-8 md:px-8">
            {heroTrust.map((item) => {
              const Icon = item.icon;
              return (
                <li
                  key={item.label}
                  className="inline-flex items-center justify-center gap-3"
                >
                  <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[rgba(226,178,116,0.45)] text-accent">
                    <Icon size={16} strokeWidth={1.75} />
                  </span>
                  {item.label}
                </li>
              );
            })}
          </ul>
        </div>
      </section>

      <section className="mx-auto max-w-[1440px] px-6 py-16 md:px-12 lg:px-20">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="font-[family-name:var(--font-syne)] text-3xl font-bold">
            Какие услуги заказывают на бирже
          </h2>
          <p className="mt-3 text-muted">
            От сайта и приложения до AI и роста — под задачу, с понятным бюджетом в USDT.
          </p>
        </div>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((c) => (
            <Panel
              key={c.title}
              className="flex flex-col items-center p-6 text-center transition hover:border-accent/60 hover:shadow-[0_0_24px_rgba(224,168,107,0.12)]"
            >
              <Image
                src={c.icon}
                alt=""
                width={168}
                height={168}
                className="mb-4 h-14 w-14 rounded-[16px] object-contain"
              />
              <h3 className="font-[family-name:var(--font-syne)] text-lg font-semibold">
                {c.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">{c.hint}</p>
            </Panel>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-[1440px] px-6 py-16 md:px-12 lg:px-20">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="font-[family-name:var(--font-syne)] text-3xl font-bold">
            Как работает фриланс-биржа
          </h2>
          <p className="mt-3 text-muted">
            Три шага от брифа до оплаты: без найма в штат и без риска предоплаты.
          </p>
        </div>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {steps.map((s) => (
            <Panel
              key={s.title}
              className="flex flex-col items-center p-6 text-center transition hover:border-accent/60 hover:shadow-[0_0_24px_rgba(224,168,107,0.12)]"
            >
              <Image
                src={s.icon}
                alt=""
                width={168}
                height={168}
                className="mb-4 h-14 w-14 rounded-[16px] object-contain"
              />
              <h3 className="font-[family-name:var(--font-syne)] text-xl font-semibold">
                {s.title}
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-muted">{s.text}</p>
            </Panel>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-[1440px] px-6 py-16 md:px-12 lg:px-20">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="font-[family-name:var(--font-syne)] text-3xl font-bold">
            Каталог фрилансеров с рейтингом и отзывами
          </h2>
          <p className="mt-3 text-muted">Проверенные профили — смотрите работы до сделки.</p>
          <Link href="/freelancers" className="mt-3 inline-block text-sm text-accent hover:underline">
            Смотреть всех
          </Link>
        </div>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {freelancers.map((f) => (
            <Link key={f.name} href="/freelancers">
              <Panel className="h-full p-6 transition hover:border-accent/60 hover:shadow-[0_0_24px_rgba(224,168,107,0.12)]">
                <div className="flex items-center gap-3">
                  <Image
                    src={f.avatar}
                    alt={f.name}
                    width={56}
                    height={56}
                    className="h-14 w-14 rounded-full object-cover ring-1 ring-border"
                  />
                  <div>
                    <div className="font-semibold">{f.name}</div>
                    <div className="mt-1 text-sm text-accent">
                      ★ {f.rating} · {f.reviews}
                    </div>
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  {f.tags.map((t) => (
                    <Chip key={t}>{t}</Chip>
                  ))}
                </div>
              </Panel>
            </Link>
          ))}
        </div>
      </section>

      <section className="bg-[#1c140f]">
        <div className="mx-auto max-w-[1440px] px-6 py-16 md:px-12 lg:px-20">
          <h2 className="text-center font-[family-name:var(--font-syne)] text-3xl font-bold text-[#f5e6c8]">
            Истории первых сделок
          </h2>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {stories.map((s) => (
              <Panel key={s.name} className="border-border/80 bg-[#18120e] p-6">
                <div className="font-[family-name:var(--font-syne)] text-3xl leading-none text-accent">
                  “
                </div>
                <p className="mt-2 text-sm leading-relaxed text-muted-2">{s.quote}</p>
                <div className="mt-5 flex items-center gap-3">
                  <Image
                    src={s.photo}
                    alt={s.name}
                    width={40}
                    height={40}
                    className="h-10 w-10 rounded-full object-cover"
                  />
                  <div>
                    <div className="text-sm font-semibold text-accent">{s.name}</div>
                    <div className="text-xs text-muted">{s.role}</div>
                  </div>
                </div>
              </Panel>
            ))}
          </div>
          <div className="mt-8 flex justify-center">
            <ButtonLink href="/freelancers" variant="ghost">
              Каталог фрилансеров
            </ButtonLink>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1440px] px-6 py-16 md:px-12 lg:px-20">
        <Panel className="grid gap-8 p-8 md:grid-cols-2 md:p-12">
          <div>
            <h2 className="font-[family-name:var(--font-syne)] text-3xl font-bold">
              Зарегистрируйтесь бесплатно — и разместите заказ
            </h2>
            <ul className="mt-6 space-y-3 text-sm text-muted-2">
              <li>• Для заказчиков — бесплатно</li>
              <li>• Лента проектов для фрилансеров сразу после регистрации</li>
              <li>• Оплата в крипте только после приёмки через эскроу</li>
            </ul>
          </div>
          <div className="rounded-[var(--radius)] border border-border bg-bg-deep/70 p-6">
            <div className="text-sm text-muted">Быстрый старт</div>
            <div className="mt-4 flex gap-2">
              <ButtonLink href="/register?role=client" className="flex-1">
                Я заказчик
              </ButtonLink>
              <ButtonLink href="/register?role=freelancer" variant="ghost" className="flex-1">
                Я фрилансер
              </ButtonLink>
            </div>
            <p className="mt-4 text-xs text-muted">
              Демо: anna@client.io / demo1234 · sergey@freelancer.io / demo1234
            </p>
          </div>
        </Panel>
      </section>
    </div>
  );
}
