"use client";

import Script from "next/script";

export default function PurchaseConversionTag() {
  return (
    <>
      <Script
        src="https://www.googletagmanager.com/gtag/js?id=AW-18430730512"
        strategy="afterInteractive"
      />
      <Script id="cantoa-purchase-conversion" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', 'AW-18430730512', {
            anonymize_ip: true,
            page_location: window.location.origin + '/checkout-success',
            page_referrer: ''
          });
        `}
      </Script>
    </>
  );
}