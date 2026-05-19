"use client";

import { useState } from "react";
import Link from "next/link";

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

  return (
    <header className="border-b">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/" className="font-bold text-lg tracking-tight" onClick={() => setOpen(false)}>
          🎮 GameDev Tools
        </Link>

        {/* 桌面导航 */}
        <nav className="hidden sm:flex gap-6 text-sm text-muted-foreground">
          {NAV_LINKS.map((l) => (
            <Link key={l.href} href={l.href} className="hover:text-foreground transition-colors">
              {l.label}
            </Link>
          ))}
        </nav>

        {/* 移动端汉堡按钮 */}
        <button
          className="sm:hidden p-2 rounded hover:bg-muted transition-colors"
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? "关闭菜单" : "打开菜单"}
          aria-expanded={open}
        >
          <span className="block w-5 h-0.5 bg-foreground mb-1 transition-transform" style={{ transform: open ? "rotate(45deg) translate(2px, 6px)" : "none" }} />
          <span className="block w-5 h-0.5 bg-foreground mb-1 transition-opacity" style={{ opacity: open ? 0 : 1 }} />
          <span className="block w-5 h-0.5 bg-foreground transition-transform" style={{ transform: open ? "rotate(-45deg) translate(2px, -6px)" : "none" }} />
        </button>
      </div>

      {/* 移动端下拉菜单 */}
      {open && (
        <nav className="sm:hidden border-t px-4 py-3 flex flex-col gap-3 text-sm text-muted-foreground bg-background">
          {NAV_LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="hover:text-foreground transition-colors py-1"
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
