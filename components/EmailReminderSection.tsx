import { useState } from "react";
import { timezones } from "../utils/timezones";

interface EmailReminderSectionProps {
  emailReminderTime: string;
  emailReminderEnabled: boolean;
  selectedTimezone: string;
  loading: boolean;
  onTimeChange: (time: string) => void;
  onEnabledChange: (enabled: boolean) => void;
  onTimezoneChange: (timezone: string) => void;
  onSave: () => void;
}

export default function EmailReminderSection({
  emailReminderTime,
  emailReminderEnabled,
  selectedTimezone,
  loading,
  onTimeChange,
  onEnabledChange,
  onTimezoneChange,
  onSave,
}: EmailReminderSectionProps) {
  const [showTimezoneDropdown, setShowTimezoneDropdown] = useState(false);

  const canSave =
    !emailReminderEnabled || Boolean(emailReminderTime && selectedTimezone);

  return (
    <div
      style={{
        marginBottom: "2rem",
        padding: "1rem",
        border: "1px solid #ddd",
        borderRadius: "8px",
        backgroundColor: emailReminderEnabled ? "white" : "#f5f5f5",
        opacity: emailReminderEnabled ? 1 : 0.6,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "1rem",
        }}
      >
        <label
          style={{
            fontWeight: "bold",
            color: emailReminderEnabled ? "black" : "#999",
          }}
        >
          Daily Email Reminder:
        </label>

        {/* Custom On/Off Switch */}
        <div
          onClick={() => onEnabledChange(!emailReminderEnabled)}
          style={{
            position: "relative",
            width: "60px",
            height: "30px",
            backgroundColor: emailReminderEnabled ? "#4CAF50" : "#ccc",
            borderRadius: "15px",
            cursor: "pointer",
            transition: "background-color 0.3s",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: "3px",
              left: emailReminderEnabled ? "33px" : "3px",
              width: "24px",
              height: "24px",
              backgroundColor: "white",
              borderRadius: "50%",
              transition: "left 0.3s",
              boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
            }}
          />
        </div>
      </div>

      <div style={{ marginBottom: "1rem" }}>
        <span
          style={{
            fontSize: "0.9rem",
            color: emailReminderEnabled ? "#666" : "#999",
            fontStyle: "italic",
          }}
        >
          {emailReminderEnabled
            ? `Receive daily email with your stocks information in ${selectedTimezone}`
            : "Email reminders are disabled"}
        </span>
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "0.5rem",
        }}
      >
        <div
          style={{
            display: "flex",
            gap: "0.5rem",
            alignItems: "center",
          }}
        >
          <label
            style={{
              fontSize: "0.9rem",
              color: emailReminderEnabled ? "#666" : "#999",
              minWidth: "50px",
            }}
          >
            Time:
          </label>

          <input
            type="time"
            value={emailReminderTime}
            onChange={(e) => onTimeChange(e.target.value)}
            disabled={!emailReminderEnabled}
            style={{
              padding: "0.5rem",
              border: emailReminderEnabled
                ? "1px solid #ccc"
                : "1px solid #ddd",
              borderRadius: "4px",
              fontSize: "1rem",
              backgroundColor: emailReminderEnabled ? "white" : "#f5f5f5",
              color: emailReminderEnabled ? "black" : "#999",
              cursor: emailReminderEnabled ? "text" : "not-allowed",
              flex: 1,
            }}
          />
        </div>

        {/* Select Region Button */}
        <div style={{ position: "relative" }}>
          <button
            onClick={() => setShowTimezoneDropdown(!showTimezoneDropdown)}
            disabled={!emailReminderEnabled}
            style={{
              width: "100%",
              padding: "0.5rem 1rem",
              backgroundColor: emailReminderEnabled ? "#17a2b8" : "#ccc",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: emailReminderEnabled ? "pointer" : "not-allowed",
              fontSize: "1rem",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span>
              🌍 Select Region:{" "}
              {timezones.find((tz) => tz.value === selectedTimezone)?.label ||
                selectedTimezone}
            </span>

            <span>{showTimezoneDropdown ? "▲" : "▼"}</span>
          </button>

          {/* Timezone Dropdown */}
          {showTimezoneDropdown && emailReminderEnabled && (
            <div
              style={{
                position: "absolute",
                top: "100%",
                left: 0,
                right: 0,
                backgroundColor: "white",
                border: "1px solid #ccc",
                borderRadius: "4px",
                maxHeight: "300px",
                overflowY: "auto",
                zIndex: 1000,
                boxShadow: "0 4px 8px rgba(0,0,0,0.1)",
              }}
            >
              {timezones.map((timezone) => (
                <div
                  key={timezone.value}
                  onClick={() => {
                    onTimezoneChange(timezone.value);
                    setShowTimezoneDropdown(false);
                  }}
                  style={{
                    padding: "0.75rem",
                    cursor: "pointer",
                    backgroundColor:
                      selectedTimezone === timezone.value ? "#e3f2fd" : "white",
                    borderBottom: "1px solid #eee",
                    fontSize: "0.9rem",
                  }}
                  onMouseEnter={(e) => {
                    if (selectedTimezone !== timezone.value) {
                      (e.target as HTMLElement).style.backgroundColor =
                        "#f5f5f5";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (selectedTimezone !== timezone.value) {
                      (e.target as HTMLElement).style.backgroundColor = "white";
                    }
                  }}
                >
                  {timezone.label}
                </div>
              ))}
            </div>
          )}
        </div>

        <button
          onClick={onSave}
          disabled={loading || !canSave}
          style={{
            padding: "0.5rem 1rem",
            backgroundColor: canSave ? "#007bff" : "#ccc",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: !canSave || loading ? "not-allowed" : "pointer",
            fontSize: "1rem",
            fontWeight: "bold",
          }}
        >
          {loading ? "Updating..." : "Save Settings"}
        </button>
      </div>
    </div>
  );
}
