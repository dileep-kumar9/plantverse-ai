import Card from "@/components/ui/Card";

export default function AITips() {
  return (
    <Card className="mt-10 bg-gradient-to-r from-green-700 to-green-500 text-white">

      <h2 className="text-2xl font-bold">
        Today&apos;s AI Advice
      </h2>

      <p className="mt-5 text-lg">
        Rain is expected tomorrow.
      </p>

      <p className="mt-2 opacity-90">
        Skip watering your tomato plants today and check the soil moisture in the morning.
      </p>

    </Card>
  );
}