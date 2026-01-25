"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@repo/ui/components/button";
import { getSafeRedirect } from "../../../../lib/redirect";

function CheckEmailPageContent() {
  const searchParams = useSearchParams();
  const t = useTranslations("auth");

  const finalNext = getSafeRedirect(searchParams.get("next"));
  const postRegister = `/welcome?next=${encodeURIComponent(finalNext)}`;
  const signInHref = `/login?redirect=${encodeURIComponent(postRegister)}`;

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8">
      <div className="w-full max-w-md space-y-6 text-center">
        <div className="space-y-4">
          <h1 className="text-3xl font-bold">{t("checkEmailTitle")}</h1>
          <p className="text-muted-foreground">{t("checkEmailBody")}</p>
        </div>

        <div className="space-y-3">
          <Button asChild className="w-full" size="lg">
            <Link href={signInHref}>{t("signIn")}</Link>
          </Button>
        </div>

        <div className="pt-4 text-sm text-muted-foreground space-y-2">
          <p>{t("checkEmailTip")}</p>
          <p>
            <Link
              href={`/register?redirect=${encodeURIComponent(finalNext)}`}
              className="underline underline-offset-4"
            >
              {t("wrongEmail")}
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}

function CheckEmailPageFallback() {
  const t = useTranslations("common");
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div>{t("loading")}</div>
    </div>
  );
}

export default function CheckEmailPage() {
  return (
    <Suspense fallback={<CheckEmailPageFallback />}>
      <CheckEmailPageContent />
    </Suspense>
  );
}
