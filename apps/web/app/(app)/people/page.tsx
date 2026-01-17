export default function PeoplePage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Find Language Partners</h1>

        {/* Search and Filters */}
        <section className="rounded-xl border border-border p-6 mb-8">
          <div className="flex flex-col gap-4">
            {/* Search bar */}
            <div className="relative">
              <input
                type="text"
                placeholder="Search by name, language, or location..."
                className="w-full px-4 py-3 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
              />
            </div>

            {/* Filter row */}
            <div className="flex flex-wrap gap-3">
              {/* Language filters */}
              <select className="px-4 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20">
                <option>Native Language</option>
                <option>English</option>
                <option>Spanish</option>
                <option>Japanese</option>
                <option>French</option>
                <option>German</option>
                <option>Mandarin</option>
              </select>

              <select className="px-4 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20">
                <option>Learning Language</option>
                <option>English</option>
                <option>Spanish</option>
                <option>Japanese</option>
                <option>French</option>
                <option>German</option>
                <option>Mandarin</option>
              </select>

              <select className="px-4 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20">
                <option>Proficiency Level</option>
                <option>Beginner</option>
                <option>Intermediate</option>
                <option>Advanced</option>
                <option>Native</option>
              </select>

              <select className="px-4 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20">
                <option>Availability</option>
                <option>Available Now</option>
                <option>Weekdays</option>
                <option>Weekends</option>
                <option>Flexible</option>
              </select>
            </div>
          </div>
        </section>

        {/* Tabs: Discover / My Partners / Requests */}
        <div className="flex gap-1 mb-6 border-b border-border">
          <button className="px-4 py-2 text-sm font-medium border-b-2 border-primary text-primary">
            Discover
          </button>
          <button className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            My Partners
          </button>
          <button className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors relative">
            Requests
            <span className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center text-xs bg-primary text-primary-foreground rounded-full">
              3
            </span>
          </button>
        </div>

        {/* People Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <article
              key={i}
              className="rounded-xl border border-border p-6 hover:border-primary/50 transition-colors"
            >
              {/* Profile Header */}
              <div className="flex items-start gap-4 mb-4">
                <div className="h-16 w-16 rounded-full bg-muted flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold truncate">User Name</h3>
                  <p className="text-sm text-muted-foreground">Tokyo, Japan</p>
                  <div className="flex items-center gap-1 mt-1">
                    <span className="h-2 w-2 rounded-full bg-green-500" />
                    <span className="text-xs text-muted-foreground">
                      Online now
                    </span>
                  </div>
                </div>
              </div>

              {/* Languages */}
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Speaks
                  </span>
                  <div className="flex gap-1">
                    <span className="px-2 py-0.5 rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 text-xs">
                      Japanese (Native)
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 text-xs">
                      English (Advanced)
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Learning
                  </span>
                  <div className="flex gap-1">
                    <span className="px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200 text-xs">
                      Spanish (Beginner)
                    </span>
                  </div>
                </div>
              </div>

              {/* Bio preview */}
              <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                Hi! I&apos;m looking for language exchange partners to practice
                my Spanish while helping others with Japanese...
              </p>

              {/* Action buttons */}
              <div className="flex gap-2">
                <button className="flex-1 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors">
                  Connect
                </button>
                <button className="px-4 py-2 rounded-lg border border-border text-sm font-medium hover:bg-muted transition-colors">
                  View Profile
                </button>
              </div>
            </article>
          ))}
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-center gap-2 mt-8">
          <button className="px-4 py-2 rounded-lg border border-border text-sm hover:bg-muted transition-colors disabled:opacity-50">
            Previous
          </button>
          <span className="px-4 py-2 text-sm text-muted-foreground">
            Page 1 of 10
          </span>
          <button className="px-4 py-2 rounded-lg border border-border text-sm hover:bg-muted transition-colors">
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
