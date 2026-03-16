import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import ReCAPTCHA from "react-google-recaptcha";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { toast } from "sonner";
import { firebaseAuthService } from "@/lib/firebase-auth";
import { Loader2, Eye, EyeOff } from "lucide-react";
import logo from "@/assets/logo.png";

/* -------------------- Validation -------------------- */
const loginSchema = z.object({
  identifier: z.string().min(3, "Email or username is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

/* -------------------- Production Check -------------------- */
const PRODUCTION_DOMAINS = [
  "smsglobe.net",
  "smsglobe-test.vercel.app",
];

const isProduction = () => {
  if (typeof window === "undefined") return false;
  const hostname = window.location.hostname;
  const protocol = window.location.protocol;
  return (
    PRODUCTION_DOMAINS.includes(hostname) ||
    (hostname.endsWith(".vercel.app") && protocol === "https:")
  );
};

/* -------------------- Component -------------------- */
const Login = () => {
  const navigate = useNavigate();
  const recaptchaRef = useRef<ReCAPTCHA>(null);

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [recaptchaToken, setRecaptchaToken] = useState<string | null>(null);

  const siteKey = import.meta.env.VITE_PUBLIC_RECAPTCHA_SITE_KEY;

  /* -------------------- Auto redirect if logged in -------------------- */
  useEffect(() => {
    const user = firebaseAuthService.getCurrentUser();
    if (user) navigate("/dashboard");
  }, [navigate]);

  /* -------------------- Handle Email/Username Login -------------------- */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Require reCAPTCHA in production
    if (isProduction() && !recaptchaToken) {
      toast.error("Please complete the reCAPTCHA verification");
      return;
    }

    try {
      const validated = loginSchema.parse({ identifier, password });
      setLoading(true);

      const { user, error } = await firebaseAuthService.signIn(
        validated.identifier,
        validated.password,
        {
          recaptchaToken: isProduction() ? recaptchaToken : null,
        }
      );

      if (error) {
        toast.error(error);
        // Reset reCAPTCHA on error
        if (isProduction() && recaptchaRef.current) {
          recaptchaRef.current.reset();
          setRecaptchaToken(null);
        }
        return;
      }

      if (user) {
        toast.success("Welcome back!");
        // After login, redirect to stored path if present
        try {
          const redirect = localStorage.getItem('post_auth_redirect');
          if (redirect) {
            localStorage.removeItem('post_auth_redirect');
            navigate(redirect);
          } else {
            navigate("/dashboard");
          }
        } catch (e) {
          navigate("/dashboard");
        }
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
      } else {
        toast.error("An error occurred. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  /* -------------------- Handle Google Sign In -------------------- */
  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    try {
      const { user, error } = await firebaseAuthService.signInWithGoogle();

      if (error) {
        toast.error(error);
      } else if (user) {
        toast.success("Welcome back!");
        try {
          const redirect = localStorage.getItem('post_auth_redirect');
          if (redirect) {
            localStorage.removeItem('post_auth_redirect');
            navigate(redirect);
          } else {
            navigate("/dashboard");
          }
        } catch (e) {
          navigate("/dashboard");
        }
      }
    } catch {
      toast.error("Failed to sign in with Google");
    } finally {
      setGoogleLoading(false);
    }
  };

  /* -------------------- UI -------------------- */
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-background to-muted/30 p-4">
      <Card className="w-full max-w-md border">
        <CardHeader className="text-center">
          <Link to="/" className="flex justify-center mb-4">
            <img src={logo} alt="SMSGlobe" className="h-16" />
          </Link>
          <CardTitle className="text-2xl">Welcome Back</CardTitle>
          <CardDescription>Sign in to your SMSGlobe account</CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Google Sign In */}
          <Button
            type="button"
            variant="outline"
            className="w-full flex items-center justify-center gap-2"
            onClick={handleGoogleSignIn}
            disabled={googleLoading}
          >
            {googleLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <svg className="h-5 w-5" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
            )}
            Continue with Google
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                Or continue with
              </span>
            </div>
          </div>

          {/* Email/Username Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="identifier">Email or Username</Label>
              <Input
                id="identifier"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="you@example.com or username"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            {/* reCAPTCHA - only in production */}
            {isProduction() && siteKey && (
              <div className="flex justify-center">
                <ReCAPTCHA
                  ref={recaptchaRef}
                  sitekey={siteKey}
                  onChange={(token) => setRecaptchaToken(token)}
                  onExpired={() => setRecaptchaToken(null)}
                  onErrored={() => setRecaptchaToken(null)}
                />
              </div>
            )}

            <Button
              type="submit"
              className="w-full"
              disabled={loading || (isProduction() && !recaptchaToken)}
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Sign In
            </Button>
          </form>

          <div className="text-center text-sm text-muted-foreground">
            Don't have an account?{" "}
            <Link
              to="/signup"
              className="text-primary hover:underline font-medium"
            >
              Sign up
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;