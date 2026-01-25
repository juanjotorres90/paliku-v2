"use client";

import { Button } from "@repo/ui/components/button";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { getSafeRedirect } from "../../../lib/redirect";
import { useUser } from "../../user-context";

function WelcomePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useTranslations("auth");
  const { user, loading } = useUser();

  const finalNext = getSafeRedirect(searchParams.get("next"));

  const handleContinue = () => {
    router.replace(finalNext);
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8">
      <div className="w-full max-w-md space-y-6 text-center">
        <div className="space-y-4">
          <h1 className="text-3xl font-bold">{t("welcomeTitle")}</h1>
          {loading ? (
            <div className="h-6 w-48 mx-auto bg-muted animate-pulse rounded" />
          ) : (
            user?.profile?.displayName && (
              <p className="text-xl text-muted-foreground">
                {t("welcomeGreeting", { name: user.profile.displayName })}
              </p>
            )
          )}
          <p className="text-muted-foreground">{t("welcomeBody")}</p>
        </div>

        <div className="space-y-3">
          <Button onClick={handleContinue} className="w-full" size="lg">
            {t("continue")}
          </Button>
          <Button asChild variant="outline" className="w-full" size="lg">
            <Link href="/profile/settings">{t("completeProfile")}</Link>
          </Button>
        </div>
      </div>
    </main>
  );
}

function WelcomePageFallback() {
  const t = useTranslations("common");
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div>{t("loading")}</div>
    </div>
  );
}

export default function WelcomePage() {
  return (
    <Suspense fallback={<WelcomePageFallback />}>
      <WelcomePageContent />
    </Suspense>
  );
}
