import React, { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const AIS_API_URL = "https://stream.aisstream.io/v0/ais";

export default function SchepenInDeBuurt() {
  const [location, setLocation] = useState(null);
  const [ships, setShips] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({
          lat: pos.coords.latitude,
          lon: pos.coords.longitude,
        });
      },
      (err) => setError("Locatie kan niet worden bepaald."),
      { enableHighAccuracy: true }
    );
  }, []);

  useEffect(() => {
    if (!location) return;

    const ws = new WebSocket("wss://stream.aisstream.io/v0/ais");

    ws.onopen = () => {
      const subscriptionMessage = {
        Apikey: "tryme", // Gebruik een eigen API key voor productie
        BoundingBoxes: [
          [
            [location.lat - 0.018, location.lon - 0.028],
            [location.lat + 0.018, location.lon + 0.028],
          ],
        ],
      };
      ws.send(JSON.stringify(subscriptionMessage));
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.Messages) {
        const shipNames = data.Messages.filter(
          (msg) => msg.Meta && msg.Meta.MMSI
        )
          .map((msg) => msg.Meta.ShipName || msg.Meta.MMSI)
          .filter(Boolean);

        const uniqueShips = Array.from(new Set(shipNames)).slice(0, 10);
        setShips(uniqueShips);
      }
    };

    ws.onerror = () => setError("Fout bij het verbinden met AISStream.");
    ws.onclose = () => console.log("WebSocket verbinding gesloten.");

    return () => {
      ws.close();
    };
  }, [location]);

  return (
    <div className="p-6 max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Schepen in de buurt (2 km)</h1>
      {error && <p className="text-red-500">{error}</p>}
      {!location && !error && <p>Locatie wordt bepaald...</p>}
      {ships.length > 0 && (
        <div className="space-y-2">
          {ships.map((ship, index) => (
            <Card key={index}>
              <CardContent className="p-4">{ship}</CardContent>
            </Card>
          ))}
        </div>
      )}
      {location && ships.length === 0 && <p>Geen schepen gevonden in de buurt.</p>}
    </div>
  );
}
