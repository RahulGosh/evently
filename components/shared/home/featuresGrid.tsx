import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const features = [
  {
    icon: "/calendar.svg",
    title: "Easy Scheduling",
    description: "Plan your events with our intuitive scheduling tools and calendar integrations."
  },
  {
    icon: "/calendar.svg",
    title: "Smart Ticketing",
    description: "Customizable ticketing options with QR codes and secure check-in systems."
  },
  {
    icon: "/calendar.svg",
    title: "Real-time Analytics",
    description: "Track attendance, sales, and engagement metrics in real-time."
  },
  {
    icon: "/calendar.svg",
    title: "Community Building",
    description: "Connect with attendees before, during, and after your events."
  },
];

export const FeaturesGrid = () => {
  return (
    <section className="wrapper py-16">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {features.map((feature, index) => (
          <Card key={index} className="hover:shadow-lg transition-all duration-300 border-0 bg-white/50 backdrop-blur-sm">
            <CardHeader>
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-primary/10 text-primary">
                  {feature.icon}
                </div>
                <CardTitle className="text-xl">{feature.title}</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-gray-600">
                {feature.description}
              </CardDescription>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
};