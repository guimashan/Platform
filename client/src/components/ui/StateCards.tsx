export function LoadingCard() {
  return (
    <div className="card bg-base-100 shadow-xl" data-testid="card-loading">
      <div className="card-body items-center text-center">
        <span className="loading loading-spinner loading-lg text-primary"></span>
        <p className="text-base-content/70">載入中...</p>
      </div>
    </div>
  );
}

export function EmptyCard({ message = "目前沒有資料" }: { message?: string }) {
  return (
    <div className="card bg-base-100 shadow-xl" data-testid="card-empty">
      <div className="card-body items-center text-center">
        <svg
          className="w-16 h-16 text-base-content/30"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
          />
        </svg>
        <p className="text-base-content/70" data-testid="text-empty-message">
          {message}
        </p>
      </div>
    </div>
  );
}

export function ErrorCard({ message = "發生錯誤" }: { message?: string }) {
  return (
    <div className="card bg-error/10 shadow-xl" data-testid="card-error">
      <div className="card-body items-center text-center">
        <svg
          className="w-16 h-16 text-error"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <p className="text-error font-semibold" data-testid="text-error-message">
          {message}
        </p>
      </div>
    </div>
  );
}
