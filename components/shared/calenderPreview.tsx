export const CalendarPreview = () => {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6 max-w-4xl mx-auto">
        <div className="grid grid-cols-7 gap-2">
          {/* Calendar implementation would go here */}
          <div className="text-center text-gray-500">Calendar UI</div>
        </div>
        <div className="mt-6 text-center">
          <Button asChild variant="outline">
            <Link href="/calendar">View Full Calendar</Link>
          </Button>
        </div>
      </div>
    );
  };