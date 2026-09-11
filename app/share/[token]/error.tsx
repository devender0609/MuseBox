"use client";

export default function SharedSongError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="gift-page">
      <section className="gift-unopened">
        <div className="gift-envelope" aria-hidden="true">♪</div>
        <p>CANTOA</p>
        <h1>This shared song is temporarily unavailable.</h1>
        <span>The link may still be valid. Please try again in a moment.</span>
        <button type="button" onClick={() => reset()}>Try again</button>
      </section>
    </main>
  );
}
