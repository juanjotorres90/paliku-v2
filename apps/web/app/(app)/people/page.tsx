export default function PeoplePage() {
  const people = [
    { id: 1, name: "John Doe", role: "Software Engineer" },
    { id: 2, name: "Jane Smith", role: "Product Designer" },
    { id: 3, name: "Mike Johnson", role: "Team Lead" },
    { id: 4, name: "Sarah Williams", role: "Engineering Manager" },
    { id: 5, name: "Alex Chen", role: "Frontend Developer" },
    { id: 6, name: "Emily Brown", role: "UX Researcher" },
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">People</h1>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {people.map((person) => (
            <div
              key={person.id}
              className="group block p-6 rounded-xl border border-border transition-all duration-200 hover:border-border/60 hover:bg-muted/50"
            >
              <h2 className="text-xl font-semibold mb-2">{person.name}</h2>
              <p className="text-sm text-muted-foreground">{person.role}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
