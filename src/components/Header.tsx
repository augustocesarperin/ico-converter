import { Menu } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

const Header = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState<string>("");
  const { t, i18n } = useTranslation();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const sections = ["#features", "#about"];
    const observers: IntersectionObserver[] = [];
    sections.forEach((id) => {
      const el = document.querySelector(id);
      if (!el) return;
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              setActiveSection(id);
            }
          });
        },
        { rootMargin: "-30% 0px -60% 0px", threshold: 0.01 },
      );
      observer.observe(el);
      observers.push(observer);
    });
    return () => observers.forEach((o) => o.disconnect());
  }, []);

  const navLinks = [
    { name: t("nav.features"), href: "#features" },
    { name: t("nav.about"), href: "#about" },
  ];
  const resourceLinks = [
    {
      name: t("nav.resources.png_to_ico", { defaultValue: "PNG→ICO" }),
      href: "/png-to-ico/",
    },
    {
      name: t("nav.resources.jpg_to_ico", { defaultValue: "JPG→ICO" }),
      href: "/jpg-to-ico/",
    },
    {
      name: t("nav.resources.svg_to_ico", { defaultValue: "SVG→ICO" }),
      href: "/svg-to-ico/",
    },
    {
      name: t("nav.resources.safari_pinned_tab", {
        defaultValue: "Safari pinned tab",
      }),
      href: "/safari-pinned-tab/",
    },
    {
      name: t("nav.resources.electron_macos", {
        defaultValue: "Electron/macOS",
      }),
      href: "/electron-macos-icons/",
    },
  ];

  const scrollToSection = (id: string) => {
    const section = document.querySelector(id);
    if (section) {
      section.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        isScrolled
          ? "bg-black/50 backdrop-blur-lg border-b border-white/10"
          : "bg-transparent border-b border-transparent",
      )}
    >
      <div className="container mx-auto px-4">
        <div className="flex h-20 items-center justify-between">
          <a
            href="#"
            className="flex items-center space-x-2"
            onClick={(e) => {
              e.preventDefault();
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-md border border-primary/30 bg-primary/20 shadow-sm backdrop-blur-sm">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-5 w-5 text-primary"
              >
                <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 0 2l-.15.08a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.38a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1 0-2l.15-.08a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path>
                <circle cx="12" cy="12" r="3"></circle>
              </svg>
            </div>
            <span className="text-base font-bold text-white">
              Ico<span className="text-primary">Smith</span>
            </span>
          </a>

          <nav className="hidden items-center space-x-1 md:flex">
            {navLinks.map((link) => (
              <Button
                key={link.name}
                variant="ghost"
                onClick={() => scrollToSection(link.href)}
                className={cn(
                  "font-medium text-sm hover:text-foreground focus-visible-ring hover-focus-unified",
                  activeSection === link.href
                    ? "text-foreground"
                    : "text-muted-foreground",
                )}
                aria-label={t("nav.aria_label", { name: link.name })}
              >
                {link.name}
              </Button>
            ))}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="focus-visible-ring text-sm font-medium text-muted-foreground hover:text-foreground"
                >
                  {t("nav.resources_menu", { defaultValue: "Resources" })} ▾
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="min-w-[220px]">
                <DropdownMenuLabel>{t("nav.features")}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {resourceLinks.map((link) => (
                  <DropdownMenuItem key={link.href} asChild>
                    <a href={link.href} className="w-full">
                      {link.name}
                    </a>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            <a
              href="https://github.com/augustocesarperin/ico-converter"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button
                variant="ghost"
                className="focus-visible-ring text-sm font-medium text-muted-foreground hover:text-foreground"
                aria-label={t("nav.github_aria_label")}
              >
                {t("nav.github")}
              </Button>
            </a>
          </nav>

          <div className="flex items-center md:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-foreground hover:bg-muted/50"
                >
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="border-l-0 bg-background">
                <div className="flex h-full flex-col">
                  <div className="mt-8 flex-grow">
                    <nav className="flex flex-col space-y-4">
                      {navLinks.map((link) => (
                        <SheetClose asChild key={link.name}>
                          <a
                            href={link.href}
                            onClick={(e) => {
                              e.preventDefault();
                              scrollToSection(link.href);
                            }}
                            className="text-lg font-medium text-foreground transition-colors hover:text-primary"
                          >
                            {link.name}
                          </a>
                        </SheetClose>
                      ))}
                      {resourceLinks.map((link) => (
                        <a
                          key={link.href}
                          href={link.href}
                          className="text-lg font-medium text-foreground transition-colors hover:text-primary"
                        >
                          {link.name}
                        </a>
                      ))}
                      <a
                        href="https://github.com/augustocesarperin/ico-converter"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-lg font-medium text-foreground transition-colors hover:text-primary"
                      >
                        {t("nav.github")}
                      </a>
                      <div className="flex items-center gap-2 pt-4">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            i18n.changeLanguage("pt");
                            localStorage.setItem("lang", "pt");
                          }}
                        >
                          PT
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            i18n.changeLanguage("en");
                            localStorage.setItem("lang", "en");
                          }}
                        >
                          EN
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            i18n.changeLanguage("es");
                            localStorage.setItem("lang", "es");
                          }}
                        >
                          ES
                        </Button>
                      </div>
                    </nav>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
            <div className="ml-2 hidden md:flex"></div>
          </div>
          <div className="hidden items-center gap-2 md:flex">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                i18n.changeLanguage("pt");
                localStorage.setItem("lang", "pt");
              }}
              className={cn(
                "text-sm",
                i18n.language.startsWith("pt")
                  ? "text-foreground"
                  : "text-muted-foreground",
              )}
            >
              PT
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                i18n.changeLanguage("en");
                localStorage.setItem("lang", "en");
              }}
              className={cn(
                "text-sm",
                i18n.language.startsWith("en")
                  ? "text-foreground"
                  : "text-muted-foreground",
              )}
            >
              EN
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                i18n.changeLanguage("es");
                localStorage.setItem("lang", "es");
              }}
              className={cn(
                "text-sm",
                i18n.language.startsWith("es")
                  ? "text-foreground"
                  : "text-muted-foreground",
              )}
            >
              ES
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
