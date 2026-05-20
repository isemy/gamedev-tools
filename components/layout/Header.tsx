"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Gamepad2, Moon, Sun } from "lucide-react";

const NAV_LINKS = [
  { href: "/tools/color", label: "配色" },
  { href: "/tools/sfx", label: "音效" },
  { href: "/tools/random", label: "随机内容" },
  { href: "/tools/math", label: "数值" },
  { href: "/tools/gdd", label: "GDD" },
  { href: "/tools/pathfinding", label: "寻路" },
  { href: "/tools/font", label: "字体" },
  { href: "/tools/particles", label: "粒子" },
  { href: "/tools/i18n", label: "本地化" },
];

export default function Header() {
  const [open, setOpen] = useState(false);
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const isDark = stored === "dark" || (!stored && prefersDark);
    setDark(isDark);
    document.documentElement.classList.toggle("dark", isDark);
  }, []);

  function toggleTheme() {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("theme", next ? "dark" : "light");
  }

  return (
    <header className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link
          href="/"
          className="font-bold text-lg tracking-tight flex items-center gap-2 text-primary"
          onClick={() => setOpen(false)}
        >
          <Gamepad2 className="w-5 h-5" />
          GameDev Tools
        </Link>

        {/* 桌面导航 */}
        <div className="hidden sm:flex items-center gap-6">
          <nav className="flex gap-5 text-sm text-muted-foreground">
            {NAV_LINKS.map((l) => (
              <Link key={l.href} href={l.href} className="hover:text-primary transition-colors">
                {l.label}
              </Link>
            ))}
          </nav>
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
            aria-label={dark ? "切换到亮色模式" : "切换到暗色模式"}
          >
            {dark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>

        {/* 移动端按钮组 */}
        <div className="sm:hidden flex items-center gap-1">
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground"
            aria-label={dark ? "切换到亮色模式" : "切换到暗色模式"}
          >
            {dark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
          <button
            className="p-2 rounded-lg hover:bg-muted transition-colors"
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? "关闭菜单" : "打开菜单"}
            aria-expanded={open}
          >
            <span className="block w-5 h-0.5 bg-foreground mb-1 transition-transform" style={{ transform: open ? "rotate(45deg) translate(2px, 6px)" : "none" }} />
            <span className="block w-5 h-0.5 bg-foreground mb-1 transition-opacity" style={{ opacity: open ? 0 : 1 }} />
            <span className="block w-5 h-0.5 bg-foreground transition-transform" style={{ transform: open ? "rotate(-45deg) translate(2px, -6px)" : "none" }} />
          </button>
        </div>
      </div>

      {/* 移动端下拉菜单 */}
      {open && (
        <nav className="sm:hidden border-t px-4 py-3 flex flex-col gap-3 text-sm text-muted-foreground bg-background/95 backdrop-blur-sm">
          {NAV_LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="hover:text-primary transition-colors py-1"
              onClick={() => setOpen(false)}
            >
              {l.label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}
