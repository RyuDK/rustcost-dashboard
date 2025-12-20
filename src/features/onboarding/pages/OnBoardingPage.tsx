import { useEffect, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useI18n } from "@/app/providers/i18n/useI18n";
import { buildLanguagePrefix } from "@/constants/language";
import { useAppDispatch, useAppSelector } from "@/store/hook";
import { completeOnboarding } from "@/store/slices/systemSlice";
import { FiExternalLink, FiGithub } from "react-icons/fi";
import { ThemeToggle } from "@/shared/components/buttons/ThemeToggleButton";
import LangSelect from "@/app/layouts/components/LangSelect";

type LanguageParams = { lng?: string };

export const OnBoardingPage = () => {
  const { t, language, setLanguage } = useI18n();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const params = useParams<LanguageParams>();
  const isFirstTime = useAppSelector((state) => state.system.isFirstTime);

  const prefix = useMemo(() => buildLanguagePrefix(params.lng), [params.lng]);

  useEffect(() => {
    if (!isFirstTime) {
      navigate(`${prefix}/`, { replace: true });
    }
  }, [isFirstTime, navigate, prefix]);

  const handleAcknowledge = () => {
    dispatch(completeOnboarding());
    navigate(`${prefix}/`, { replace: true });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-(--bg) via-(--bg) to-(--bg-subtle) text-(--text)">
      <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-6 py-10">
        <header className="mb-10 flex items-center justify-between">
          <button
            type="button"
            onClick={() => navigate(`${prefix}/`, { replace: true })}
            className="flex items-center gap-3 rounded-xl px-3 py-2 transition hover:bg-(--surface)"
          >
            <img
              src="/logo-square.webp"
              alt="RustCost"
              className="h-10 w-10 rounded-xl"
            />
            <div className="text-left">
              <p className="text-xs uppercase tracking-wide text-(--text-muted)">
                RustCost
              </p>
              <p className="text-lg font-semibold text-(--text)">
                {t("common.brandName")}
              </p>
            </div>
          </button>
          <div className="flex items-center gap-3">
            <LangSelect value={language} onChange={setLanguage} />
            <ThemeToggle />
          </div>
        </header>

        <main className="flex flex-1 items-center">
          <div className="flex w-full flex-col gap-8 rounded-3xl border border-(--border) bg-(--surface) p-10 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-(--text-muted)">
                  RustCost setup
                </p>
                <div className="inline-flex items-center gap-3">
                  <span className="h-8 w-1 rounded-full bg-(--primary)" />
                  <div>
                    <h1 className="text-3xl font-bold leading-tight">
                      {t("onboarding.title")}
                    </h1>
                    <p className="mt-2 text-base text-(--text-subtle)">
                      {t("onboarding.subtitle")}
                    </p>
                  </div>
                </div>
              </div>
              <div className="rounded-xl bg-(--primary)/10 px-4 py-2 text-sm font-semibold text-(--primary)">
                {t("onboarding.badge")}
              </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
              <div className="rounded-2xl border border-(--border) bg-(--surface) p-5 shadow-sm">
                <p className="text-sm font-semibold text-(--text)">
                  {t("onboarding.cards.collect.title")}
                </p>
                <p className="mt-2 text-sm text-(--text-subtle)">
                  {t("onboarding.cards.collect.desc")}
                </p>
              </div>
              <div className="rounded-2xl border border-(--border) bg-(--surface) p-5 shadow-sm">
                <p className="text-sm font-semibold text-(--text)">
                  {t("onboarding.cards.quality.title")}
                </p>
                <p className="mt-2 text-sm text-(--text-subtle)">
                  {t("onboarding.cards.quality.desc")}
                </p>
              </div>
              <div className="rounded-2xl border border-(--border) bg-(--surface) p-5 shadow-sm">
                <p className="text-sm font-semibold text-(--text)">
                  {t("onboarding.cards.readiness.title")}
                </p>
                <p className="mt-2 text-sm text-(--text-subtle)">
                  {t("onboarding.cards.readiness.desc")}
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-dashed border-(--border) bg-(--bg) px-6 py-5 text-sm text-(--text-subtle)">
              {t("onboarding.note")}
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <a
                href="https://www.rustcost.com/en/docs"
                target="_blank"
                rel="noreferrer"
                className="group flex items-center justify-between rounded-2xl border border-(--border) bg-(--surface) px-5 py-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-(--primary) hover:shadow-lg"
              >
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-(--text)">
                    {t("onboarding.docs.title")}
                  </p>
                  <p className="text-xs text-(--text-subtle)">
                    {t("onboarding.docs.desc")}
                  </p>
                </div>
                <FiExternalLink className="text-xl text-(--text-muted) transition group-hover:text-(--primary)" />
              </a>

              <a
                href="https://github.com/rustcost"
                target="_blank"
                rel="noreferrer"
                className="group flex items-center justify-between rounded-2xl border border-(--border) bg-(--surface) px-5 py-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-(--primary) hover:shadow-lg"
              >
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-(--text)">
                    {t("onboarding.github.title")}
                  </p>
                  <p className="text-xs text-(--text-subtle)">
                    {t("onboarding.github.desc")}
                  </p>
                </div>
                <FiGithub className="text-xl text-(--text-muted) transition group-hover:text-(--primary)" />
              </a>
            </div>

            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-3 rounded-xl bg-(--surface) px-4 py-3 text-sm text-(--text-subtle)">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-(--primary)/10 text-(--primary) font-semibold">
                  1d
                </span>
                <p>{t("onboarding.footerHint")}</p>
              </div>
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleAcknowledge}
                  className="inline-flex items-center gap-2 rounded-lg bg-(--primary) px-5 py-3 text-sm font-semibold text-white dark:text-black shadow-lg shadow-(--primary)/30 transition hover:-translate-y-0.5 hover:bg-(--primary-hover)"
                >
                  {t("onboarding.cta")}
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};
