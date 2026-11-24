import { useState } from "react";

/**
 * Front-end only: the form validates and shows a thank-you state.
 * Connect `onSubmit` to your email service (Mailchimp, Buttondown, Formspree…) to make it real.
 */
export function Newsletter() {
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);

  return (
    <section id="newsletter" className="news" data-theme="light">
      <div className="news__drop" aria-hidden="true" />
      <p className="news__label" data-reveal>(06) The next film</p>
      <h2 className="news__title" data-reveal>
        Get the next <em>drop.</em>
      </h2>
      {done ? (
        <p className="news__done" role="status">
          You're on the list. <em>See you after the next rain.</em>
        </p>
      ) : (
        <form
          className="news__form"
          data-reveal
          onSubmit={(e) => {
            e.preventDefault();
            if (/^\S+@\S+\.\S+$/.test(email)) setDone(true);
          }}
        >
          <label className="sr-only" htmlFor="news-email">Email address</label>
          <input id="news-email" type="email" required placeholder="your@email.com" value={email} onChange={(e) => setEmail(e.target.value)} />
          <button type="submit">Notify me <span aria-hidden="true">→</span></button>
        </form>
      )}
      <p className="news__fine" data-reveal>One email when a new film is out. Nothing else.</p>
    </section>
  );
}
