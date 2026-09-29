import { Component, type ErrorInfo, type ReactNode } from "react";

export default class ErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("ErrorBoundary caught an error", error, info);
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div
        style={{
          minHeight: "100dvh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 24,
          background: "var(--void)",
          color: "var(--fog)",
          fontFamily: "var(--font-body)",
        }}
      >
        <div
          style={{
            maxWidth: 420,
            width: "100%",
            textAlign: "center",
            background: "var(--panel-2)",
            border: "1px dashed var(--line)",
            borderRadius: "var(--radius)",
            padding: "32px 24px",
          }}
        >
          <p
            style={{
              fontFamily: "var(--font-display)",
              fontSize: 12,
              letterSpacing: "0.22em",
              color: "var(--fog-dim)",
              marginBottom: 12,
            }}
          >
            児島ジーンズ
          </p>
          <h1
            style={{
              fontFamily: "var(--font-display)",
              fontSize: 24,
              fontWeight: 700,
              letterSpacing: "0.02em",
              marginBottom: 12,
            }}
          >
            表示できませんでした
          </h1>
          <p
            style={{
              fontSize: 14,
              lineHeight: 1.75,
              color: "var(--fog-soft)",
              marginBottom: 24,
            }}
          >
            予期しないエラーが発生しました。お手数ですが、再読み込みしてからもう一度お試しください。
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            style={{
              width: "100%",
              padding: "15px 20px",
              border: "none",
              borderRadius: "var(--radius)",
              background: "linear-gradient(180deg, #4a74c6, var(--indigo))",
              color: "#f4f7ff",
              fontSize: 15,
              fontWeight: 700,
              letterSpacing: "0.08em",
              cursor: "pointer",
            }}
          >
            再読み込み
          </button>
        </div>
      </div>
    );
  }
}
