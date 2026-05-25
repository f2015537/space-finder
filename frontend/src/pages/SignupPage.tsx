import { useState, type SubmitEvent } from "react";
import { Link } from "react-router-dom";
import type { AuthService } from "../services/AuthService";
import "./SignupPage.css";

interface SignupPageProps {
  authService: AuthService;
  onSignupComplete: (username: string, password: string) => Promise<void>;
}

type Step = "signup" | "confirm";

export default function SignupPage({ authService, onSignupComplete }: SignupPageProps) {
  const [step, setStep] = useState<Step>("signup");

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [code, setCode] = useState("");

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleSignup(e: SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    const errors: Record<string, string> = {};
    if (!username.trim()) errors.username = "Username is required.";
    if (!email.trim()) errors.email = "Email is required.";
    if (!password) errors.password = "Password is required.";
    if (password !== confirmPassword) errors.confirmPassword = "Passwords do not match.";
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setFormError("");
    setIsLoading(true);
    try {
      const { isSignUpComplete } = await authService.signup(
        username.trim(),
        email.trim(),
        password,
      );
      if (isSignUpComplete) {
        await onSignupComplete(username.trim(), password);
      } else {
        setStep("confirm");
      }
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Signup failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleConfirm(e: SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!code.trim()) {
      setFieldErrors({ code: "Verification code is required." });
      return;
    }

    setFieldErrors({});
    setFormError("");
    setIsLoading(true);
    try {
      await authService.confirmSignup(username.trim(), code.trim());
      await onSignupComplete(username.trim(), password);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Confirmation failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSocialLogin(provider: "Google" | "GitHub") {
    setFormError("");
    try {
      await authService.loginWithProvider(provider);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Social login failed. Please try again.");
    }
  }

  if (step === "confirm") {
    return (
      <main className="signup-page">
        <div className="signup-card">
          <h1>Check your email</h1>
          <p className="signup-subtitle">
            We sent a verification code to <strong>{email}</strong>.
          </p>
          <form className="signup-form" onSubmit={handleConfirm} noValidate>
            <div className="form-field">
              <label htmlFor="code">Verification code</label>
              <input
                id="code"
                type="text"
                placeholder="Enter code"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className={fieldErrors.code ? "input-error" : ""}
                autoComplete="one-time-code"
              />
              {fieldErrors.code && <span className="field-error">{fieldErrors.code}</span>}
            </div>
            {formError && <p className="signup-error">{formError}</p>}
            <button className="btn-submit" type="submit" disabled={isLoading}>
              {isLoading ? "Verifying…" : "Verify & sign in"}
            </button>
          </form>
        </div>
      </main>
    );
  }

  return (
    <main className="signup-page">
      <div className="signup-card">
        <h1>Create an account</h1>
        <p className="signup-subtitle">Sign up to start finding spaces.</p>

        <div className="social-auth">
          <button className="btn-social btn-google" onClick={() => handleSocialLogin("Google")} type="button">
            <svg width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            Sign in with Google
          </button>
          
          <button className="btn-social btn-github" onClick={() => handleSocialLogin("GitHub")} type="button">
            <svg width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="currentColor">
              <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/>
            </svg>
            Sign in with GitHub
          </button>
        </div>

        <div className="social-divider">or</div>

        <form className="signup-form" onSubmit={handleSignup} noValidate>
          <div className="form-field">
            <label htmlFor="su-username">Username</label>
            <input
              id="su-username"
              type="text"
              placeholder="Choose a username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className={fieldErrors.username ? "input-error" : ""}
            />
            {fieldErrors.username && <span className="field-error">{fieldErrors.username}</span>}
          </div>
          <div className="form-field">
            <label htmlFor="su-email">Email</label>
            <input
              id="su-email"
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={fieldErrors.email ? "input-error" : ""}
            />
            {fieldErrors.email && <span className="field-error">{fieldErrors.email}</span>}
          </div>
          <div className="form-field">
            <label htmlFor="su-password">Password</label>
            <input
              id="su-password"
              type="password"
              placeholder="Choose a password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={fieldErrors.password ? "input-error" : ""}
            />
            <span className="field-hint">
              Min. 8 characters with uppercase, lowercase, number, and symbol (e.g. !@#$)
            </span>
            {fieldErrors.password && <span className="field-error">{fieldErrors.password}</span>}
          </div>
          <div className="form-field">
            <label htmlFor="su-confirm">Confirm password</label>
            <input
              id="su-confirm"
              type="password"
              placeholder="Repeat your password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className={fieldErrors.confirmPassword ? "input-error" : ""}
            />
            {fieldErrors.confirmPassword && (
              <span className="field-error">{fieldErrors.confirmPassword}</span>
            )}
          </div>
          {formError && <p className="signup-error">{formError}</p>}
          <button className="btn-submit" type="submit" disabled={isLoading}>
            {isLoading ? "Creating account…" : "Create account"}
          </button>
        </form>
        <p className="signup-login-link">
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </div>
    </main>
  );
}
