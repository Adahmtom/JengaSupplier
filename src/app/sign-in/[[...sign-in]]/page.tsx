import { SignIn } from '@clerk/nextjs'

export default function SignInPage() {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '32px 16px',
      background: '#ffffff',
    }}>
      <div style={{ width: '100%', maxWidth: '480px' }}>
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <p style={{ fontSize: '1rem', color: '#c9a84c', letterSpacing: '0.08em', marginBottom: '8px' }}>
            ✦ China Business Vault by Belle Jones
          </p>
          <h1 style={{ fontSize: '2rem', fontWeight: 700, color: '#1A0033', marginBottom: '8px' }}>
            Bon retour
          </h1>
          <p style={{ color: '#666', fontSize: '0.95rem' }}>
            Connectez-vous pour accéder à votre Vault
          </p>
        </div>
        <SignIn
          forceRedirectUrl="/redirect"
          signUpUrl="/sign-up?plan=monthly"
          appearance={{
            variables: {
              colorBackground: '#ffffff',
              colorPrimary: '#c9a84c',
              colorText: '#1A0033',
              colorTextSecondary: '#555555',
              colorInputBackground: '#f8f7ff',
              colorInputText: '#1A0033',
              colorNeutral: '#1A0033',
              borderRadius: '10px',
            },
          }}
        />
      </div>
    </div>
  )
}
