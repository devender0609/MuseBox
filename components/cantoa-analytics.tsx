"use client";

import Script from "next/script";
import { usePathname } from "next/navigation";

const SENSITIVE_PREFIXES = ["/share/", "/contribute/", "/owner", "/checkout-success"];

export default function CantoaAnalytics() {
  const pathname = usePathname() || "/";
  const sensitive = SENSITIVE_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(prefix));
  if (sensitive) return null;

  return (
    <>
      <Script
        src="https://www.googletagmanager.com/gtag/js?id=AW-18430730512"
        strategy="afterInteractive"
      />
      <Script id="google-ads-tag" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          var cantoaPageLocation = window.location.origin + window.location.pathname;
          var cantoaPageReferrer = '';
          try { cantoaPageReferrer = document.referrer ? new URL(document.referrer).origin : ''; } catch (e) {}
          gtag('config', 'AW-18430730512', { anonymize_ip: true, page_location: cantoaPageLocation, page_referrer: cantoaPageReferrer });
        `}
      </Script>
    </>
  );
}
