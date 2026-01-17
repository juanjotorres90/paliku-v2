export default function Home() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
        {/* Main Content */}
        <div className="flex flex-col gap-8">
          {/* Welcome / Quick Actions */}
          <section className="rounded-xl border border-border p-6">
            <h2 className="text-lg font-semibold mb-4">Welcome back!</h2>
            <div className="flex flex-wrap gap-3">
              {/* Quick action buttons placeholder */}
              <div className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium">
                Find a Partner
              </div>
              <div className="px-4 py-2 rounded-lg bg-secondary text-secondary-foreground text-sm font-medium">
                Practice Now
              </div>
              <div className="px-4 py-2 rounded-lg bg-secondary text-secondary-foreground text-sm font-medium">
                Schedule Session
              </div>
            </div>
          </section>

          {/* Activity Feed */}
          <section>
            <h2 className="text-lg font-semibold mb-4">Activity Feed</h2>
            <div className="flex flex-col gap-4">
              {/* Feed Item Placeholder */}
              {[1, 2, 3, 4].map((i) => (
                <article
                  key={i}
                  className="rounded-xl border border-border p-6"
                >
                  <div className="flex items-start gap-4">
                    {/* Avatar placeholder */}
                    <div className="h-10 w-10 rounded-full bg-muted flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      {/* Author info */}
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-medium">User Name</span>
                        <span className="text-xs text-muted-foreground">
                          2h ago
                        </span>
                      </div>
                      {/* Post content placeholder */}
                      <p className="text-muted-foreground mb-4">
                        Post content goes here. This could be a language
                        learning update, a question, or a practice request...
                      </p>
                      {/* Language tags */}
                      <div className="flex gap-2 mb-4">
                        <span className="px-2 py-0.5 rounded-full bg-muted text-xs">
                          English
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-muted text-xs">
                          Spanish
                        </span>
                      </div>
                      {/* Interaction buttons */}
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <button className="hover:text-foreground transition-colors">
                          Like
                        </button>
                        <button className="hover:text-foreground transition-colors">
                          Comment
                        </button>
                        <button className="hover:text-foreground transition-colors">
                          Share
                        </button>
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>
        </div>

        {/* Sidebar */}
        <aside className="flex flex-col gap-6">
          {/* Your Stats */}
          <section className="rounded-xl border border-border p-6">
            <h3 className="font-semibold mb-4">Your Progress</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 rounded-lg bg-muted/50">
                <div className="text-2xl font-bold">3</div>
                <div className="text-xs text-muted-foreground">
                  Languages Learning
                </div>
              </div>
              <div className="text-center p-3 rounded-lg bg-muted/50">
                <div className="text-2xl font-bold">12</div>
                <div className="text-xs text-muted-foreground">Connections</div>
              </div>
              <div className="text-center p-3 rounded-lg bg-muted/50">
                <div className="text-2xl font-bold">24</div>
                <div className="text-xs text-muted-foreground">
                  Practice Hours
                </div>
              </div>
              <div className="text-center p-3 rounded-lg bg-muted/50">
                <div className="text-2xl font-bold">8</div>
                <div className="text-xs text-muted-foreground">This Week</div>
              </div>
            </div>
          </section>

          {/* Suggested Partners */}
          <section className="rounded-xl border border-border p-6">
            <h3 className="font-semibold mb-4">Suggested Partners</h3>
            <div className="flex flex-col gap-3">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                >
                  <div className="h-10 w-10 rounded-full bg-muted flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate">
                      Partner Name
                    </div>
                    <div className="text-xs text-muted-foreground truncate">
                      Speaks: English • Learning: Japanese
                    </div>
                  </div>
                </div>
              ))}
              <button className="text-sm text-primary hover:underline mt-2">
                View all suggestions →
              </button>
            </div>
          </section>

          {/* Upcoming Sessions */}
          <section className="rounded-xl border border-border p-6">
            <h3 className="font-semibold mb-4">Upcoming Sessions</h3>
            <div className="flex flex-col gap-3">
              <div className="p-3 rounded-lg bg-muted/50">
                <div className="font-medium text-sm">Spanish Practice</div>
                <div className="text-xs text-muted-foreground">
                  with Maria • Tomorrow, 3:00 PM
                </div>
              </div>
              <div className="p-3 rounded-lg bg-muted/50">
                <div className="font-medium text-sm">Japanese Conversation</div>
                <div className="text-xs text-muted-foreground">
                  with Yuki • Friday, 10:00 AM
                </div>
              </div>
              <button className="text-sm text-primary hover:underline mt-2">
                Schedule a session →
              </button>
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
