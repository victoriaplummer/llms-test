import { useState } from "react";
import type { WebflowPage } from "../utils/webflow-types";

interface PageConfig {
  isVisible: boolean;
  displayName?: string;
  description?: string;
  isOptional?: boolean;
}

interface PageManagerProps {
  pages: WebflowPage[];
  initialSettings?: Record<string, PageConfig>;
}

export default function PageManager({
  pages,
  initialSettings,
}: PageManagerProps) {
  const [settings, setSettings] = useState<Record<string, PageConfig>>(
    initialSettings ||
      // Default to all pages visible and not optional
      Object.fromEntries(
        pages.map((page) => [
          page.id,
          {
            isVisible: true,
            displayName: page.title,
            isOptional: false,
          },
        ])
      )
  );

  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const handleSave = async () => {
    setIsSaving(true);
    setSaveError(null);

    try {
      const response = await fetch("/api/admin/save-page-settings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(settings),
      });

      if (!response.ok) {
        throw new Error("Failed to save settings");
      }

      // Dispatch custom event for toast notification
      window.dispatchEvent(
        new CustomEvent("toast", {
          detail: { message: "Settings saved successfully", type: "success" },
        })
      );
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : "Failed to save");
      window.dispatchEvent(
        new CustomEvent("toast", {
          detail: {
            message: error instanceof Error ? error.message : "Failed to save",
            type: "error",
          },
        })
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-base-content">
          Page Settings
        </h2>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className={`btn btn-primary ${isSaving ? "loading" : ""}`}
        >
          {isSaving ? "Saving..." : "Save Changes"}
        </button>
      </div>

      <div className="space-y-2">
        {pages.map((page) => (
          <div key={page.id} className="card bg-base-100 shadow-lg">
            <div className="card-body p-4 flex-row justify-between items-center">
              <div className="flex items-center gap-4">
                <input
                  type="checkbox"
                  checked={settings[page.id]?.isVisible ?? true}
                  onChange={(e) =>
                    setSettings((prev) => ({
                      ...prev,
                      [page.id]: {
                        ...prev[page.id],
                        isVisible: e.target.checked,
                      },
                    }))
                  }
                  className="checkbox checkbox-primary"
                />
                <span className="text-base-content">{page.title}</span>
              </div>
              <div className="flex items-center gap-4">
                <label className="label cursor-pointer gap-2">
                  <input
                    type="checkbox"
                    checked={settings[page.id]?.isOptional ?? false}
                    onChange={(e) =>
                      setSettings((prev) => ({
                        ...prev,
                        [page.id]: {
                          ...prev[page.id],
                          isOptional: e.target.checked,
                        },
                      }))
                    }
                    className="checkbox checkbox-secondary checkbox-sm"
                  />
                  <span className="label-text">Optional</span>
                </label>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
