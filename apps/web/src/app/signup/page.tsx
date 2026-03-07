// 認証はメール/パスワードのみ。Google ログインは使用しない。許可されたメールアドレスのみ登録可。
export default function SignUpPage() {
  return (
    <main style={{ padding: '2rem', maxWidth: 400, margin: '0 auto' }}>
      <h1 style={{ marginBottom: '1rem' }}>新規登録</h1>
      <p style={{ color: 'var(--muted)', marginBottom: '1.5rem' }}>
        Identity Platform 連携は実装中です。（メール/パスワードのみ・許可メールのみ）
      </p>
      <p>
        <a href="/">トップへ</a>
      </p>
    </main>
  );
}
