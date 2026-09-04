import Link from "next/link";
import { ArrowRight, Check, Music2, Sparkles } from "lucide-react";
import type { MarketingPage } from "@/lib/marketing-pages";

export default function MarketingLanding({ page }: { page: MarketingPage }) {
  const href = `/?moment=${encodeURIComponent(page.moment)}`;
  return (
    <main className="marketing-page">
      <header className="marketing-nav">
        <Link className="marketing-brand" href="/" aria-label="Cantoa home">
          <span className="marketing-brand-mark">≈</span>
          <span><b>Cantoa</b><small>Moments → Music</small></span>
        </Link>
        <nav aria-label="Marketing navigation">
          <Link href="/birthday-song">Birthday</Link>
          <Link href="/wedding-song">Wedding</Link>
          <Link href="/reel-music">Reels</Link>
          <Link href="/business-jingle">Business</Link>
        </nav>
        <Link className="marketing-nav-cta" href={href}>Create free <ArrowRight /></Link>
      </header>

      <section className="marketing-hero">
        <div className="marketing-hero-copy">
          <p className="marketing-eyebrow"><Sparkles /> {page.eyebrow}</p>
          <h1>{page.title}</h1>
          <p className="marketing-lede">{page.description}</p>
          <div className="marketing-actions">
            <Link className="marketing-primary" href={href}>{page.cta} <ArrowRight /></Link>
            <span>First complete song free · up to 2 minutes</span>
          </div>
          <div className="marketing-proof">
            {page.proof.map((item) => <span key={item}><Check /> {item}</span>)}
          </div>
        </div>
        <div className="marketing-hero-art" aria-hidden="true">
          <div className="marketing-orb orb-one" />
          <div className="marketing-orb orb-two" />
          <div className="marketing-player-card">
            <div className="marketing-cover"><Music2 /></div>
            <small>Made from a moment</small>
            <b>{page.title.replace(/[.!?]$/, "")}</b>
            <div className="marketing-wave">{Array.from({ length: 30 }).map((_, i) => <i key={i} style={{ height: `${16 + ((i * 17) % 52)}%` }} />)}</div>
            <div className="marketing-player-line"><span>0:18</span><i /><span>2:42</span></div>
          </div>
        </div>
      </section>

      <section className="marketing-section marketing-examples">
        <div className="marketing-section-heading">
          <p>Start with a moment</p>
          <h2>You do not need to know how to write a music prompt.</h2>
          <span>Tell Cantoa what happened, who it is for and how you want it to feel.</span>
        </div>
        <div className="marketing-example-grid">
          {page.examples.map((example) => (
            <article key={example.label}>
              <small>{example.label}</small>
              <p>“{example.text}”</p>
              <Link href={`${href}&prompt=${encodeURIComponent(example.text)}`}>Try this idea <ArrowRight /></Link>
            </article>
          ))}
        </div>
      </section>

      <section className="marketing-section marketing-how">
        <div className="marketing-section-heading">
          <p>From story to song</p>
          <h2>Simple when you want it. Detailed when you need it.</h2>
        </div>
        <div className="marketing-steps">
          {page.steps.map((step, index) => (
            <article key={step.title}><span>0{index + 1}</span><h3>{step.title}</h3><p>{step.text}</p></article>
          ))}
        </div>
      </section>

      <section className="marketing-language-strip">
        <div><small>Your story. Your language. Your music.</small><h2>English, Hindi, Hinglish, Spanish, Arabic, Mandarin—and many more.</h2></div>
        <p>Choose any language, dialect or mix. Don’t see yours? Just type it. Pronunciation quality may vary by music provider.</p>
      </section>

      <section className="marketing-closing">
        <Sparkles />
        <h2>{page.closingTitle}</h2>
        <p>{page.closingText}</p>
        <Link className="marketing-primary" href={href}>{page.cta} <ArrowRight /></Link>
        <small>No credit card required for your first 2 music creations.</small>
      </section>

      <footer className="marketing-footer">
        <Link className="marketing-brand" href="/"><span className="marketing-brand-mark">≈</span><span><b>Cantoa</b><small>Turn moments into music.</small></span></Link>
        <div><Link href="/birthday-song">Birthday songs</Link><Link href="/wedding-song">Wedding songs</Link><Link href="/anniversary-song">Anniversary songs</Link><Link href="/song-for-someone">Song gifts</Link></div>
        <div><Link href="/reel-music">Reel music</Link><Link href="/business-jingle">Business jingles</Link><Link href="/hindi-song">Hindi songs</Link><Link href="/hinglish-song">Hinglish songs</Link></div>
        <p>© {new Date().getFullYear()} Cantoa · <a href="mailto:support@cantoamusic.com">support@cantoamusic.com</a></p>
      </footer>
    </main>
  );
}
