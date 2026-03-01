import { Link } from "react-router-dom";
import {
  getFooterConfig,
  SECTION_INDEX_ROUTES,
  type FooterConfig,
  type FooterSelectedItem,
} from "@/lib/footer/footerStore";

/* ── Social icon SVGs (monochrome, 16 × 16) ── */
const FacebookIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
    <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" />
  </svg>
);
const YouTubeIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
    <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
  </svg>
);
const XIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);
const LinkedInIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
  </svg>
);

/* ── Static column data ── */
const STATIC_COLUMNS = [
  {
    heading: "Platform",
    links: [
      { label: "Control Centre", href: "/control-centre" },
      { label: "Daily Flow", href: "/daily/monday" },
      { label: "Core Tools", href: "/core-tools" },
      { label: "Tools Directory", href: "/tools/directory" },
      { label: "Glossary", href: "/glossary" },
    ],
  },
  {
    heading: "Intelligence",
    links: [
      { label: "AI News Desk", href: "/control-centre" },
      { label: "Guides", href: "/learn/guides" },
      { label: "Discover Guides", href: "/learn/guides/discover" },
    ],
  },
  {
    heading: "Company",
    links: [
      { label: "How It Works", href: "/how-it-works" },
      { label: "Orientation", href: "/orientation" },
      { label: "Free vs Paid", href: "/free-vs-paid" },
      { label: "Support", href: "/support" },
    ],
  },
];

/* ── Column subcomponent ── */
const FooterColumn = ({
  heading,
  headingHref,
  items,
}: {
  heading: string;
  headingHref?: string;
  items: { label: string; href: string }[];
}) => (
  <div>
    {headingHref ? (
      <Link
        to={headingHref}
        className="text-[12px] font-bold uppercase tracking-[0.06em] text-[#D1D5DB] hover:text-white transition-colors"
      >
        {heading}
      </Link>
    ) : (
      <span className="text-[12px] font-bold uppercase tracking-[0.06em] text-[#D1D5DB]">
        {heading}
      </span>
    )}
    {items.length > 0 && (
      <ul className="mt-3 space-y-2">
        {items.map((item) => (
          <li key={item.href}>
            <Link
              to={item.href}
              className="text-[12px] text-[#9CA3AF] hover:text-white transition-colors leading-snug"
            >
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    )}
  </div>
);

/* ── Social link helper ── */
const SocialLink = ({
  href,
  label,
  icon,
}: {
  href: string;
  label: string;
  icon: React.ReactNode;
}) => (
  <a
    href={href}
    target="_blank"
    rel="noopener noreferrer"
    aria-label={label}
    className="text-[#6B7280] hover:text-white transition-colors"
  >
    {icon}
  </a>
);

/* ── Dynamic section items resolver ── */
function resolveDynamic(
  section: FooterConfig["courses"],
): FooterSelectedItem[] {
  if (section.mode === "index_only") return [];
  return section.selectedItems.length > 0 ? section.selectedItems : [];
}

/* ═══════════════════════════════════════════
   Footer Component
   ═══════════════════════════════════════════ */
export const SiteFooter = () => {
  let config: FooterConfig;
  try {
    config = getFooterConfig();
  } catch {
    config = {
      courses: { mode: "index_only", selectedItems: [] },
      publications: { mode: "index_only", selectedItems: [] },
      apps: { mode: "index_only", selectedItems: [] },
      social: {},
    };
  }

  const dynamicSections = [
    {
      heading: "Courses",
      headingHref: SECTION_INDEX_ROUTES.courses,
      items: resolveDynamic(config.courses),
    },
    {
      heading: "Publications",
      headingHref: SECTION_INDEX_ROUTES.publications,
      items: resolveDynamic(config.publications),
    },
    {
      heading: "Apps",
      headingHref: SECTION_INDEX_ROUTES.apps,
      items: resolveDynamic(config.apps),
    },
  ];

  const socialEntries: { key: string; url: string; label: string; icon: React.ReactNode }[] = [];
  if (config.social.facebook)
    socialEntries.push({ key: "fb", url: config.social.facebook, label: "Facebook", icon: <FacebookIcon /> });
  if (config.social.youtube)
    socialEntries.push({ key: "yt", url: config.social.youtube, label: "YouTube", icon: <YouTubeIcon /> });
  if (config.social.x)
    socialEntries.push({ key: "x", url: config.social.x, label: "X", icon: <XIcon /> });
  if (config.social.linkedin)
    socialEntries.push({ key: "li", url: config.social.linkedin, label: "LinkedIn", icon: <LinkedInIcon /> });

  return (
    <footer className="bg-[#1A1A1A] border-t border-[#333333] mt-12">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Column grid — 6 columns on large, 3 on medium, 2 on small */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-8">
          {/* Static columns */}
          {STATIC_COLUMNS.map((col) => (
            <FooterColumn key={col.heading} heading={col.heading} items={col.links} />
          ))}

          {/* Dynamic columns */}
          {dynamicSections.map((sec) => (
            <FooterColumn
              key={sec.heading}
              heading={sec.heading}
              headingHref={sec.headingHref}
              items={sec.items.map((i) => ({ label: i.label, href: i.href }))}
            />
          ))}
        </div>

        {/* Bottom bar — copyright + social */}
        <div className="mt-10 pt-6 border-t border-[#333333] flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="text-[11px] text-[#6B7280] tracking-wide">
            &copy; {new Date().getFullYear()} Proven AI. All rights reserved.
          </span>

          {socialEntries.length > 0 && (
            <div className="flex items-center gap-4">
              {socialEntries.map((s) => (
                <SocialLink key={s.key} href={s.url} label={s.label} icon={s.icon} />
              ))}
            </div>
          )}
        </div>
      </div>
    </footer>
  );
};
