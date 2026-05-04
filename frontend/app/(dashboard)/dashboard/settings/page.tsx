export default function SettingsPage() {
  return (
    <div>
      <h1
        className="text-[26px] font-bold text-[var(--text-heading)]"
        style={{ fontFamily: "var(--font-sora), sans-serif" }}
      >
        Settings
      </h1>
      <p className="mt-2 max-w-xl text-[14px] text-[var(--text-muted)]" style={{ fontFamily: "var(--font-dm-sans), sans-serif" }}>
        Account preferences and notifications will live here. Profile updates continue to use the complete profile
        flow when required.
      </p>
    </div>
  );
}
