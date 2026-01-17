export default function ChatsPage() {
  const chats = [
    {
      id: 1,
      name: "Team Standup",
      lastMessage: "See you all tomorrow!",
      timestamp: "2m ago",
      unread: 3,
    },
    {
      id: 2,
      name: "Design Review",
      lastMessage: "I've updated the mockups",
      timestamp: "15m ago",
      unread: 0,
    },
    {
      id: 3,
      name: "Engineering",
      lastMessage: "Deployment complete ✅",
      timestamp: "1h ago",
      unread: 1,
    },
    {
      id: 4,
      name: "Product Planning",
      lastMessage: "Let's sync on the roadmap",
      timestamp: "2h ago",
      unread: 0,
    },
    {
      id: 5,
      name: "Random",
      lastMessage: "Anyone up for lunch?",
      timestamp: "3h ago",
      unread: 5,
    },
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Chats</h1>

        <div className="flex flex-col gap-2">
          {chats.map((chat) => (
            <div
              key={chat.id}
              className="group flex items-center justify-between p-4 rounded-lg border border-border transition-all duration-200 hover:border-border/60 hover:bg-muted/50 cursor-pointer"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-1">
                  <h2 className="text-lg font-semibold truncate">
                    {chat.name}
                  </h2>
                  {chat.unread > 0 && (
                    <span className="flex items-center justify-center min-w-[20px] h-5 px-1.5 text-xs font-medium rounded-full bg-primary text-primary-foreground">
                      {chat.unread}
                    </span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground truncate">
                  {chat.lastMessage}
                </p>
              </div>
              <span className="text-xs text-muted-foreground ml-4 flex-shrink-0">
                {chat.timestamp}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
