import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Mail, ShieldCheck } from "lucide-react";
import { authApi } from "../../api/services";
import { useAuth } from "../../context/AuthContext";
import { ErrorMessage } from "../../components/common/UI";
export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState(1);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [devOtp, setDevOtp] = useState("");
  const [emailSent, setEmailSent] = useState(true);
  const { setUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      if (step === 1) {
        const data = await authApi.requestOtp({ email, ...(name && { name }) });
        setDevOtp(data.developmentOtp || "");
        setEmailSent(data.emailSent !== false);
        setStep(2);
      } else {
        const data = await authApi.verifyOtp({ email, otp });
        setUser(data.user);
        navigate(
          location.state?.from || (data.user.role === "ADMIN" ? "/admin" : "/"),
        );
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="auth-page">
      <div className="auth-copy">
        <span className="eyebrow">YOUR NEXT STORY AWAITS</span>
        <h1>
          Movies feel better
          <br />
          from the <em>perfect seat.</em>
        </h1>
        <p>
          Discover what’s playing, choose your favourite spot, and keep every
          ticket close.
        </p>
      </div>
      <form className="auth-card" onSubmit={submit}>
        <div className="icon-badge">
          {step === 1 ? <Mail /> : <ShieldCheck />}
        </div>
        <h2>
          {step === 1
            ? "Welcome to CineSeat"
            : emailSent
              ? "Check your inbox"
              : "Development preview"}
        </h2>
        <p>
          {step === 1
            ? "Sign in or create an account with your email."
            : emailSent
              ? `We sent a six-digit code to ${email}`
              : "SMTP is not configured, so no email was sent. Use the development code below."}
        </p>
        {step === 1 ? (
          <>
            <label>
              Name <span>optional</span>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
              />
            </label>
            <label>
              Email address
              <input
                required
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
              />
            </label>
          </>
        ) : (
          <label>
            Verification code
            <input
              className="otp-input"
              required
              value={otp}
              onChange={(e) =>
                setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))
              }
              placeholder="000000"
              inputMode="numeric"
            />
            {devOtp && <small>Development OTP: {devOtp}</small>}
          </label>
        )}
        <ErrorMessage message={error} />
        <button className="primary" disabled={busy}>
          {busy
            ? "Please wait…"
            : step === 1
              ? "Send verification code"
              : "Verify & continue"}
        </button>
        {step === 2 && (
          <button
            type="button"
            className="text-button"
            onClick={() => setStep(1)}
          >
            Use a different email
          </button>
        )}
      </form>
    </section>
  );
}
