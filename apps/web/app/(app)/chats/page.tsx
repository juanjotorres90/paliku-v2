import { getTranslations } from "next-intl/server";

export default async function ChatsPage() {
  const [t, tLanguages] = await Promise.all([
    getTranslations("pages.chats"),
    getTranslations("languages"),
  ]);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <div className="grid gap-6 lg:grid-cols-[320px_1fr] h-[calc(100vh-12rem)]">
          {/* Conversations Sidebar */}
          <aside className="flex flex-col rounded-xl border border-border overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b border-border">
              <div className="flex items-center justify-between mb-4">
                <h1 className="text-xl font-bold">{t("messages")}</h1>
                <button className="p-2 rounded-lg hover:bg-muted transition-colors">
                  {/* New message icon placeholder */}
                  <span className="text-lg">+</span>
                </button>
              </div>

              {/* Search */}
              <input
                type="text"
                placeholder={t("searchConversations")}
                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
              />
            </div>

            {/* Filter tabs */}
            <div className="flex border-b border-border">
              <button className="flex-1 px-4 py-2 text-sm font-medium border-b-2 border-primary text-primary">
                {t("all")}
              </button>
              <button className="flex-1 px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                {t("unread")}
              </button>
              <button className="flex-1 px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                {t("groups")}
              </button>
            </div>

            {/* Conversations List */}
            <div className="flex-1 overflow-y-auto">
              {[1, 2, 3, 4, 5, 6, 7].map((i) => (
                <div
                  key={i}
                  className={`flex items-center gap-3 p-4 cursor-pointer hover:bg-muted/50 transition-colors border-b border-border ${i === 1 ? "bg-muted/50" : ""}`}
                >
                  {/* Avatar */}
                  <div className="relative flex-shrink-0">
                    <div className="h-12 w-12 rounded-full bg-muted" />
                    {/* Online indicator */}
                    {i <= 2 && (
                      <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 border-2 border-background" />
                    )}
                  </div>

                  {/* Conversation info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium truncate">
                        {t("partnerName")}
                      </span>
                      <span className="text-xs text-muted-foreground flex-shrink-0">
                        {i === 1 ? t("now") : t("hoursAgo", { hours: i })}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm text-muted-foreground truncate flex-1">
                        {i === 1
                          ? t("sampleGreetingShort")
                          : t("lastMessagePreview")}
                      </p>
                      {/* Unread badge */}
                      {i <= 2 && (
                        <span className="flex-shrink-0 h-5 min-w-[20px] px-1.5 flex items-center justify-center text-xs font-medium bg-primary text-primary-foreground rounded-full">
                          {i}
                        </span>
                      )}
                    </div>
                    {/* Language tag */}
                    <div className="mt-1">
                      <span className="px-1.5 py-0.5 rounded text-xs bg-muted text-muted-foreground">
                        {i % 2 === 0
                          ? tLanguages("spanish")
                          : tLanguages("japanese")}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </aside>

          {/* Chat Area */}
          <div className="flex flex-col rounded-xl border border-border overflow-hidden">
            {/* Chat Header */}
            <div className="flex items-center justify-between p-4 border-b border-border">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-muted" />
                <div>
                  <h2 className="font-semibold">{t("samplePartnerName")}</h2>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span className="h-2 w-2 rounded-full bg-green-500" />
                    <span>{t("online")}</span>
                    <span>•</span>
                    <span>
                      {t("languageExchange", {
                        lang1: tLanguages("spanish"),
                        lang2: tLanguages("english"),
                      })}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button className="p-2 rounded-lg hover:bg-muted transition-colors">
                  📞
                </button>
                <button className="p-2 rounded-lg hover:bg-muted transition-colors">
                  📹
                </button>
                <button className="p-2 rounded-lg hover:bg-muted transition-colors">
                  ⋯
                </button>
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {/* Date separator */}
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <div className="flex-1 h-px bg-border" />
                <span>{t("today")}</span>
                <div className="flex-1 h-px bg-border" />
              </div>

              {/* Received message */}
              <div className="flex gap-3 max-w-[80%]">
                <div className="h-8 w-8 rounded-full bg-muted flex-shrink-0" />
                <div>
                  <div className="rounded-2xl rounded-tl-sm bg-muted p-3">
                    <p className="text-sm">{t("sampleGreeting")}</p>
                  </div>
                  <span className="text-xs text-muted-foreground mt-1 block">
                    10:30 AM
                  </span>
                </div>
              </div>

              {/* Sent message */}
              <div className="flex gap-3 max-w-[80%] ml-auto flex-row-reverse">
                <div className="h-8 w-8 rounded-full bg-primary/20 flex-shrink-0" />
                <div>
                  <div className="rounded-2xl rounded-tr-sm bg-primary text-primary-foreground p-3">
                    <p className="text-sm">{t("sampleReply")}</p>
                  </div>
                  <span className="text-xs text-muted-foreground mt-1 block text-right">
                    10:32 AM • {t("seen")}
                  </span>
                </div>
              </div>

              {/* Received message with correction */}
              <div className="flex gap-3 max-w-[80%]">
                <div className="h-8 w-8 rounded-full bg-muted flex-shrink-0" />
                <div>
                  <div className="rounded-2xl rounded-tl-sm bg-muted p-3">
                    <p className="text-sm">{t("sampleCorrection")}</p>
                  </div>
                  {/* Correction suggestion */}
                  <div className="mt-2 p-2 rounded-lg bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800">
                    <p className="text-xs text-yellow-800 dark:text-yellow-200">
                      💡 {t("tip", { suggestion: t("sampleSuggestion") })}
                    </p>
                  </div>
                  <span className="text-xs text-muted-foreground mt-1 block">
                    10:33 AM
                  </span>
                </div>
              </div>

              {/* Typing indicator */}
              <div className="flex gap-3 max-w-[80%]">
                <div className="h-8 w-8 rounded-full bg-muted flex-shrink-0" />
                <div className="rounded-2xl rounded-tl-sm bg-muted p-3">
                  <div className="flex gap-1">
                    <span className="h-2 w-2 rounded-full bg-muted-foreground/50 animate-bounce" />
                    <span className="h-2 w-2 rounded-full bg-muted-foreground/50 animate-bounce [animation-delay:0.1s]" />
                    <span className="h-2 w-2 rounded-full bg-muted-foreground/50 animate-bounce [animation-delay:0.2s]" />
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Tools Bar */}
            <div className="px-4 py-2 border-t border-border flex items-center gap-2">
              <button className="px-3 py-1 rounded-full bg-muted text-xs hover:bg-muted/80 transition-colors">
                📝 {t("requestCorrection")}
              </button>
              <button className="px-3 py-1 rounded-full bg-muted text-xs hover:bg-muted/80 transition-colors">
                🔊 {t("voiceMessage")}
              </button>
              <button className="px-3 py-1 rounded-full bg-muted text-xs hover:bg-muted/80 transition-colors">
                📚 {t("shareResource")}
              </button>
              <button className="px-3 py-1 rounded-full bg-muted text-xs hover:bg-muted/80 transition-colors">
                📅 {t("scheduleSession")}
              </button>
            </div>

            {/* Message Input */}
            <div className="p-4 border-t border-border">
              <div className="flex items-end gap-3">
                <button className="p-2 rounded-lg hover:bg-muted transition-colors">
                  +
                </button>
                <div className="flex-1 relative">
                  <textarea
                    placeholder={t("typeMessage", {
                      language: tLanguages("spanish"),
                    })}
                    rows={1}
                    className="w-full px-4 py-3 rounded-xl border border-border bg-background text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                  />
                </div>
                <button className="p-3 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">
                  {t("send")}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
