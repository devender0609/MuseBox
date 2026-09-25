"use client";

import Script from "next/script";

export default function PurchaseConversionTag({
  transactionId,
  value,
  currency,
}: {
  transactionId: string;
  value: number;
  currency: string;
}) {
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

          gtag('event', 'conversion', {
            send_to: 'AW-18430730512/RVu0CKDgqYUdEJDCutRE',
            value: ${value},
            currency: ${JSON.stringify(currency)},
            transaction_id: ${JSON.stringify(transactionId)}
          });
        `}
      </Script>
    </>
  );
}