import { useState, type SubmitEvent } from "react";
import type { DataService } from "../services/DataService";
import "./CreateSpacePage.css";

interface CreateSpacePageProps {
  dataService: DataService;
}

export default function CreateSpacePage({ dataService }: CreateSpacePageProps) {
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [photoPreview, setPhotoPreview] = useState<string | undefined>(undefined);
  const [photoFile, setPhotoFile] = useState<File | undefined>(undefined);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [successId, setSuccessId] = useState("");

  function handlePhotoSelected(file: File) {
    setPhotoPreview(URL.createObjectURL(file));
    setPhotoFile(file);
  }

  async function handleSubmit(e: SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);
    try {
      let photoUrl: string | undefined;
      if (photoFile) {
        photoUrl = await dataService.uploadPhoto(photoFile);
      }
      const id = await dataService.createSpace(name.trim(), location.trim(), photoUrl);
      setSuccessId(id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create space.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (successId) {
    return (
      <main className="create-space-page">
        <div className="create-space-card">
          <h1>Space Created!</h1>
          <p className="success-message">Your space was created successfully.</p>
          <p className="success-id">ID: {successId}</p>
        </div>
      </main>
    );
  }

  return (
    <main className="create-space-page">
      <div className="create-space-card">
        <h1>Create a Space</h1>
        <p className="create-space-subtitle">
          Fill in the details to list a new space.
        </p>
        <form className="create-space-form" onSubmit={handleSubmit} noValidate>
          <div className="form-field">
            <label htmlFor="cs-name">Name</label>
            <input
              id="cs-name"
              type="text"
              placeholder="Enter space name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="form-field">
            <label htmlFor="cs-location">Location</label>
            <input
              id="cs-location"
              type="text"
              placeholder="Enter space location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
          </div>
          <div className="form-field">
            <label htmlFor="cs-photo">Photo (optional)</label>
            <input
              id="cs-photo"
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handlePhotoSelected(file);
              }}
            />
          </div>
          {photoPreview && (
            <div className="photo-preview">
              <img src={photoPreview} alt="Space preview" />
            </div>
          )}
          {error && <p className="form-error">{error}</p>}
          <button
            className="btn-submit"
            type="submit"
            disabled={isSubmitting || !name.trim() || !location.trim()}
          >
            {isSubmitting ? "Creating…" : "Create Space"}
          </button>
        </form>
      </div>
    </main>
  );
}
