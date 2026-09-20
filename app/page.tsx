import { ArrowRight, ArrowUpRight, Boxes, Check, ChevronRight, ClipboardCheck, Gauge, Layers3, PackageCheck, Sparkles, UsersRound, UtensilsCrossed, Workflow } from "lucide-react";
import { Header } from "@/components/header";
import { EcosystemVisual } from "@/components/ecosystem-visual";
import { ContactForm } from "@/components/contact-form";
import { Logo } from "@/components/logo";
import { SectionMotion } from "@/components/section-motion";
import { Services } from "@/components/services";

const flow = [
  { label: "Customer", sub: "Chooses & orders", icon: UsersRound },
  { label: "Ordering", sub: "Every channel", icon: ClipboardCheck },
  { label: "POS", sub: "One live view", icon: Gauge },
  { label: "Kitchen", sub: "Clear workflow", icon: UtensilsCrossed },
  { label: "Management", sub: "Decisions in context", icon: Layers3 },
];

const khataFeatures = [
  ["01", "Manage inventory", "Know what is in stock, what is moving, and what needs attention."],
  ["02", "Track business activity", "Keep everyday movements visible without adding everyday admin."],
  ["03", "Stay organised", "Bring products and records into one dependable place."],
  ["04", "Make better decisions", "Use a clearer view of the business to choose what happens next."],
];

const people = [
  ["Customer", "A simple experience from the first tap."],
  ["Staff", "Less friction in the middle of a busy day."],
  ["Kitchen", "The right information at the right time."],
  ["Managers", "A live view of what needs attention."],
  ["Owners", "Clarity across the whole operation."],
];

export default function Home() {
  return (
    <main id="top">
      <SectionMotion />
      <Header />

      <section className="hero section-shell" aria-labelledby="hero-title">
        <div className="hero-copy">
          <p className="eyebrow"><span /> Syncion Tech · Software development</p>
          <h1 id="hero-title">Websites, Apps &amp; <em>Business Software.</em></h1>
          <p className="hero-intro">We build websites, mobile and desktop apps, cloud platforms, business systems, and software for connected devices. Built around what your customers and your team need to do.</p>
          <div className="hero-actions">
            <a className="button" href="#contact">Discuss your project <ArrowRight size={17} /></a>
            <a className="text-button" href="#services">Explore services <ArrowUpRight size={16} /></a>
          </div>
          <div className="hero-product-links"><span>Our products</span><a href="#sigbyte">SigByte <small>Restaurant POS</small></a><a href="#em-khata">EM Khata <small>Inventory management</small></a></div>
        </div>
        <EcosystemVisual />
      </section>

      <section className="principle-strip" aria-label="What Syncion builds">
        <div className="section-shell principle-inner">
          <p>Web &amp; mobile apps</p><span />
          <p>Business systems</p><span />
          <p>Connected devices</p>
        </div>
      </section>

      <Services />

      <section id="products" className="products section-space">
        <div className="section-shell">
          <div className="section-heading">
            <div><p className="eyebrow"><span /> Our products</p><h2>Restaurant operations.<br />Inventory management.</h2></div>
            <p>Meet SigByte, our restaurant POS and management platform, and EM Khata, our inventory management software.</p>
          </div>

          <article id="sigbyte" className="sigbyte-panel">
            <div className="product-copy">
              <div className="product-id sigbyte-id"><span><img src="/sigbyte-icon.png" alt="" width="35" height="35" /></span> SigByte</div>
              <p className="product-kicker">Restaurant POS &amp; management software</p>
              <h3>Manage restaurant orders,<br />POS, and kitchen together.</h3>
              <p>SigByte connects customer orders to your POS, kitchen, and management team. Staff can follow each order, the kitchen knows what to prepare, and managers can see what is happening.</p>
              <ul className="capability-list">
                <li><Check /> Orders and POS in one flow</li>
                <li><Check /> Clear kitchen communication</li>
                <li><Check /> Live operational visibility</li>
              </ul>
              <a className="button button-light" href="#contact">Explore SigByte <ArrowUpRight size={16} /></a>
            </div>
            <div className="restaurant-flow" aria-label="SigByte restaurant ecosystem from customer to management">
              {flow.map(({ label, sub, icon: Icon }, index) => (
                <div className="flow-node" key={label}>
                  <div className="flow-top"><span>{String(index + 1).padStart(2, "0")}</span><Icon /></div>
                  <strong>{label}</strong><small>{sub}</small>
                  {index < flow.length - 1 && <ChevronRight className="flow-arrow" />}
                </div>
              ))}
            </div>
          </article>

          <article id="em-khata" className="khata-panel">
            <div className="khata-intro">
              <div className="product-id khata-id"><span><img src="/em-khata-logo.png" alt="" width="35" height="35" /></span> EM Khata</div>
              <p className="product-kicker">Inventory management software</p>
              <h3>Simple inventory.<br /><em>Better control.</em></h3>
              <p>EM Khata keeps your product records, stock levels, and business activity organised in one place. See what you have, track what changes, and know what needs attention.</p>
              <a className="text-button green-link" href="#contact">Discover EM Khata <ArrowRight size={16} /></a>
            </div>
            <div className="khata-features">
              {khataFeatures.map(([number, title, description]) => (
                <div className="khata-feature" key={number}>
                  <span>{number}</span><div><h4>{title}</h4><p>{description}</p></div>
                </div>
              ))}
            </div>
            <div className="stock-signal" aria-hidden="true">
              <div className="stock-card"><PackageCheck /><span><small>Stock status</small><strong>Everything in view</strong></span></div>
              <div className="stock-track"><i /><i /><i /><i /><i /></div>
              <div className="stock-tags"><span>Items</span><span>Activity</span><span>Decisions</span></div>
            </div>
          </article>
        </div>
      </section>

      <section className="connected section-space">
        <div className="section-shell connected-grid">
          <div className="connected-copy">
            <p className="eyebrow eyebrow-light"><span /> Inside SigByte</p>
            <h2>From the customer&apos;s order<br /><em>to the owner&apos;s overview.</em></h2>
            <p>Connect the people running your restaurant. Orders reach staff and the kitchen, while managers and owners get a shared view of daily operations.</p>
            <a className="text-button on-dark" href="#contact">Talk to us about SigByte <ArrowRight size={16} /></a>
          </div>
          <div className="people-system">
            {people.map(([title, description], index) => (
              <div className="person-row" key={title}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <div><h3>{title}</h3><p>{description}</p></div>
                <i className="person-node" />
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="solutions" className="solutions section-space">
        <div className="section-shell">
          <div className="solutions-top">
            <p className="eyebrow"><span /> Business solutions</p>
            <h2>Less manual work.<br />More control over your business.</h2>
            <p>Still moving information between spreadsheets, messages, and separate tools? We build software that brings those tasks together.</p>
          </div>
          <div className="outcomes-grid">
            <article><span><Workflow /></span><p className="number">01</p><h3>Remove the handoffs</h3><p>Connect tools and processes so work moves without repeated entry, chasing, or guesswork.</p></article>
            <article><span><Boxes /></span><p className="number">02</p><h3>Make complexity usable</h3><p>Turn complicated operations into focused software that teams can understand and adopt.</p></article>
            <article><span><Sparkles /></span><p className="number">03</p><h3>Build room to grow</h3><p>Create dependable foundations that can evolve as your operation, customers, and ambitions do.</p></article>
          </div>
          <a className="button solution-cta" href="#contact">Discuss a project <ArrowUpRight size={16} /></a>
        </div>
      </section>

      <section id="about" className="about section-space">
        <div className="section-shell about-grid">
          <div className="about-mark" aria-hidden="true"><img src="/Syncion Logo-selection.png" alt="" width="240" height="148" /><p>Thoughtfully connected.</p></div>
          <div className="about-copy">
            <p className="eyebrow"><span /> About Syncion</p>
            <h2>A software team focused<br />on your everyday work.</h2>
            <p className="about-lead">Syncion Tech builds custom software for businesses and develops its own products: SigByte for restaurants and EM Khata for inventory management.</p>
            <div className="about-columns">
              <p>That means listening closely, understanding the work behind the requirement, and building only what genuinely helps.</p>
              <p>Our products are practical by nature and ambitious in purpose: fewer gaps, clearer decisions, and systems people can rely on.</p>
            </div>
          </div>
        </div>
      </section>

      <section id="contact" className="contact section-space">
        <div className="section-shell contact-grid">
          <div className="contact-copy">
            <p className="eyebrow"><span /> Start a conversation</p>
            <h2>Have something<br />in mind? Let&apos;s talk.</h2>
            <p>Tell us about the website, app, business system, or connected device you want to build. Interested in SigByte or EM Khata? We can help you explore those too.</p>
            <div className="contact-details">
              <a href="mailto:info@synciontech.com" className="email-link">info@synciontech.com <ArrowUpRight aria-hidden="true" /></a>
              <a href="tel:+923232606986" className="email-link">+92 323 2606986 <ArrowUpRight aria-hidden="true" /></a>
            </div>
          </div>
          <ContactForm />
        </div>
      </section>

      <footer>
        <div className="section-shell footer-main">
          <div><Logo light /><p>Websites, apps, and software for your business.</p><div className="footer-contact"><a href="mailto:info@synciontech.com">info@synciontech.com</a><a href="tel:+923232606986">+92 323 2606986</a></div></div>
          <div className="footer-links"><div><small>Explore</small><a href="#services">Services</a><a href="#products">Products</a><a href="#solutions">Solutions</a><a href="#about">About</a></div><div><small>Products</small><a href="#sigbyte">SigByte</a><a href="#em-khata">EM Khata</a><a href="#contact">Contact</a></div></div>
        </div>
        <div className="section-shell footer-bottom"><p>© {new Date().getFullYear()} Syncion Tech. All rights reserved.</p><p>Made with clarity and care.</p></div>
      </footer>
    </main>
  );
}
