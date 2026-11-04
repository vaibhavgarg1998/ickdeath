"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import Script from "next/script";
import { configureMetaPixel, isAdminPath, trackMetaPage } from "@/lib/meta-pixel";

export function MetaPixel({ pixelId }: { pixelId: string }) {
  const pathname = usePathname();
  const admin = isAdminPath(pathname);
  const id = /^\d{8,20}$/.test(pixelId) ? pixelId : "";
  configureMetaPixel(id);

  useEffect(() => {
    trackMetaPage(pathname);
  }, [pathname]);

  if (!id || admin) return null;

  return (
    <>
      <Script id="meta-pixel" strategy="afterInteractive">
        {`!function(f,b,e,v,n,t,s)
{if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};
if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];
s.parentNode.insertBefore(t,s)}(window,document,'script',
'https://connect.facebook.net/en_US/fbevents.js');
fbq('init','${id}');`}
      </Script>
      <noscript>
        <img
          height={1}
          width={1}
          style={{ display: "none" }}
          alt=""
          src={`https://www.facebook.com/tr?id=${id}&ev=PageView&noscript=1`}
        />
      </noscript>
    </>
  );
}
