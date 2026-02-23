export default function HomePage() {
  return (
    <main style={{ padding: '2rem', maxWidth: 720, margin: '0 auto' }}>
      <h1 style={{ marginBottom: '0.5rem' }}>Vault Share</h1>
      <p style={{ color: 'var(--muted)', marginBottom: '1.5rem' }}>
        機密情報を親しい間柄で安全に共有
      </p>
      <p>
        <a href="/login">ログイン</a> / <a href="/signup">新規登録</a>
      </p>
    </main>
  );
}
