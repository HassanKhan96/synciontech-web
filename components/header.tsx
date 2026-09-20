"use client";

import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { ChevronDown, Menu, X, ArrowUpRight } from "lucide-react";
import { useEffect, useState } from "react";
import Image from "next/image";
import { Logo } from "./logo";

const links = [
  { href: "#services", label: "Services" },
  { href: "#solutions", label: "Solutions" },
  { href: "#about", label: "About" },
  { href: "#contact", label: "Contact" },
];

export function Header() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  return (
    <header className={`site-header ${scrolled ? "is-scrolled" : ""}`}>
      <div className="nav-shell">
        <Logo />
        <nav className="desktop-nav" aria-label="Main navigation">
          <DropdownMenu.Root>
            <DropdownMenu.Trigger className="nav-link product-trigger">
              Products <ChevronDown size={14} aria-hidden="true" />
            </DropdownMenu.Trigger>
            <DropdownMenu.Portal>
              <DropdownMenu.Content className="product-menu" sideOffset={15} align="start">
                <DropdownMenu.Item asChild>
                  <a href="#sigbyte" className="product-menu-item">
                    <span className="menu-mark sigbyte-mark"><Image src="/sigbyte-icon.png" alt="" width={42} height={42} /></span>
                    <span><strong>SigByte</strong><small>Restaurant POS &amp; management.</small></span>
                    <ArrowUpRight size={16} />
                  </a>
                </DropdownMenu.Item>
                <DropdownMenu.Item asChild>
                  <a href="#em-khata" className="product-menu-item">
                    <span className="menu-mark khata-mark"><Image src="/em-khata-logo.png" alt="" width={42} height={42} /></span>
                    <span><strong>EM Khata</strong><small>Simple inventory control.</small></span>
                    <ArrowUpRight size={16} />
                  </a>
                </DropdownMenu.Item>
              </DropdownMenu.Content>
            </DropdownMenu.Portal>
          </DropdownMenu.Root>
          {links.map((link) => <a key={link.href} className="nav-link" href={link.href}>{link.label}</a>)}
        </nav>
        <a className="button button-small desktop-cta" href="#contact">Let&apos;s talk <ArrowUpRight size={15} /></a>
        <button className="menu-button" onClick={() => setOpen((value) => !value)} aria-expanded={open} aria-controls="mobile-menu" aria-label={open ? "Close menu" : "Open menu"}>
          {open ? <X /> : <Menu />}
        </button>
      </div>
      <div id="mobile-menu" className={`mobile-menu ${open ? "is-open" : ""}`} aria-hidden={!open}>
        <nav aria-label="Mobile navigation">
          <span className="mobile-label">Products</span>
          <a href="#sigbyte" onClick={() => setOpen(false)}>SigByte <ArrowUpRight /></a>
          <a href="#em-khata" onClick={() => setOpen(false)}>EM Khata <ArrowUpRight /></a>
          {links.map((link) => <a key={link.href} href={link.href} onClick={() => setOpen(false)}>{link.label}</a>)}
          <a className="button" href="#contact" onClick={() => setOpen(false)}>Let&apos;s talk <ArrowUpRight size={16} /></a>
        </nav>
      </div>
    </header>
  );
}
