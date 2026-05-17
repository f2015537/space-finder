import { useState, useEffect } from "react";
import type { DataService } from "../services/DataService";
import type { SpaceEntry } from "../models/SpaceEntry";
import "./SpacesPage.css";

interface SpacesPageProps {
  dataService: DataService;
}

export default function SpacesPage({ dataService }: SpacesPageProps) {
  const [spaces, setSpaces] = useState<SpaceEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    dataService
      .getSpaces()
      .then(setSpaces)
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : "Failed to load spaces.");
      })
      .finally(() => setIsLoading(false));
  }, [dataService]);

  return (
    <main className="spaces-page">
      <h1>Spaces</h1>
      {isLoading && <p className="spaces-loading">Loading spaces…</p>}
      {error && <p className="spaces-error">{error}</p>}
      {!isLoading && !error && spaces.length === 0 && (
        <p className="spaces-empty">No spaces yet. Create one!</p>
      )}
      {spaces.length > 0 && (
        <div className="spaces-grid">
          {spaces.map((space) => (
            <div key={space.id} className="space-card">
              {space.photoUrl ? (
                <img
                  className="space-card-photo"
                  src={space.photoUrl}
                  alt={space.name}
                />
              ) : (
                <div className="space-card-photo-placeholder">No photo</div>
              )}
              <div className="space-card-body">
                <p className="space-card-name">{space.name}</p>
                <p className="space-card-location">{space.location}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
