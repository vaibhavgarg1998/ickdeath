"use client";

import { trackMetaEvent } from "@/lib/meta-pixel";

type ContactEmailLinkProps = {
  email: string;
  className?: string;
  children: React.ReactNode;
};

export function ContactEmailLink({ email, className, children }: ContactEmailLinkProps) {
  return (
    <a
      href={`mailto:${email}`}
      className={className}
      onClick={() => {
        trackMetaEvent("Contact", {
          customData: { content_name: "Contact email" },
        });
      }}
    >
      {children}
    </a>
  );
}
