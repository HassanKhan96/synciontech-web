import { ArrowUpRight, AppWindow, Blocks, CircuitBoard, Cloud, Globe2, Smartphone } from "lucide-react";
import styles from "./services.module.css";

const services = [
  {
    title: "Web Development",
    description: "Business websites, online stores, and web applications that help customers find you, buy from you, and get things done.",
    examples: ["Business websites", "E-commerce", "Customer portals"],
    icon: Globe2,
  },
  {
    title: "Mobile App Development",
    description: "Apps for iOS and Android that put your services in your customers’ hands and give your team the tools to work on the move.",
    examples: ["iOS & Android", "Customer apps", "Field team tools"],
    icon: Smartphone,
  },
  {
    title: "Desktop Apps",
    description: "Dedicated applications for your business computers, designed around the tasks your staff handle every day.",
    examples: ["Staff workspaces", "Local workflows", "Device integration"],
    icon: AppWindow,
  },
  {
    title: "Complete Systems Development",
    description: "Bring sales, stock, staff workflows, and reporting into one system. We build the applications, databases, and integrations that connect your operation.",
    examples: ["Business management", "System integrations", "Reporting"],
    icon: Blocks,
    featured: true,
  },
  {
    title: "Embedded Systems",
    description: "Software that runs inside devices and connects hardware to your business. From reading sensors to controlling equipment and monitoring it remotely.",
    examples: ["Firmware", "Connected devices", "Monitoring & control"],
    icon: CircuitBoard,
  },
  {
    title: "Cloud Platform",
    description: "Build and run your software in the cloud. We develop cloud applications and set up hosting, deployment, and integrations so your team can access the tools they need.",
    examples: ["Cloud applications", "Hosting & deployment", "API integrations"],
    icon: Cloud,
  },
];

export function Services() {
  return (
    <section id="services" className={`${styles.section} section-space`} aria-labelledby="services-title">
      <div className="section-shell">
        <div className="section-heading">
          <div>
            <p className="eyebrow"><span /> Software development services</p>
            <h2 id="services-title">What do you need<br />to build?</h2>
          </div>
          <p>From a company website to a complete business system, we design and develop software around your customers, your team, and the work it needs to do.</p>
        </div>
        <div className={styles.grid}>
          {services.map(({ title, description, examples, icon: Icon, featured }, index) => (
            <article key={title} data-reveal className={`${styles.card} ${featured ? styles.featured : ""}`}>
              <div className={styles.cardTop}>
                <span className={styles.icon}><Icon aria-hidden="true" size={25} /></span>
                <span className={styles.number} aria-hidden="true">0{index + 1}</span>
              </div>
              <h3>{title}</h3>
              <p>{description}</p>
              <ul className={styles.examples} aria-label={`${title} examples`}>
                {examples.map((example) => <li key={example}>{example}</li>)}
              </ul>
              <a href="#contact" className={styles.link} aria-label={`Discuss ${title.toLowerCase()}`}>Let&apos;s build it <ArrowUpRight size={16} aria-hidden="true" /></a>
            </article>
          ))}
        </div>
        <p className={styles.note}>Not sure where to start? <a href="#contact">Tell us what you need the software to do. <ArrowUpRight size={14} aria-hidden="true" /></a></p>
      </div>
    </section>
  );
}
