"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

type ForgotPasswordStep = "email" | "otp" | "reset";

export default function ForgotPasswordClient() {
  const router = useRouter();

  const [step, setStep] = useState<ForgotPasswordStep>("email");
  const [email, setEmail] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const dummyOtp = "123456";

  function handleSendOtp(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");

    console.log("Send OTP to:", email);
    console.log("Dummy OTP:", dummyOtp);

    setStep("otp");
  }

  function handleVerifyOtp(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");

    if (otpCode !== dummyOtp) {
      setErrorMessage("Kode verifikasi tidak sesuai.");
      return;
    }

    setStep("reset");
  }

  function handleResetPassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");

    if (newPassword.length < 8) {
      setErrorMessage("Password minimal 8 karakter.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage("Konfirmasi password tidak sama.");
      return;
    }

    console.log({
      email,
      newPassword,
    });

    router.push("/login");
  }

  return (
    <div className="app-container app-theme-white body-tabs-shadow">
      <div className="app-container">
        <div className="h-100">
          <div className="h-100 no-gutters row">
            <div className="h-100 d-flex bg-white justify-content-center align-items-center col-md-12 col-lg-8">
              <div className="mx-auto app-login-box col-sm-12 col-md-10 col-lg-9">
                <div className="login-logo mb-4" />

                <h4 className="mb-0">
                  <span className="d-block">Forgot Password,</span>
                  <span>Reset your account password.</span>
                </h4>

                <h6 className="mt-3 text-muted">
                  Internal Audit System — password recovery.
                </h6>

                <div className="divider row" />

                {errorMessage && (
                  <div className="alert alert-danger">{errorMessage}</div>
                )}

                {step === "email" && (
                  <form onSubmit={handleSendOtp}>
                    <div className="form-row">
                      <div className="col-md-12">
                        <div className="position-relative form-group">
                          <label htmlFor="email">Email</label>
                          <input
                            name="email"
                            id="email"
                            placeholder="Email here..."
                            type="email"
                            className="form-control"
                            value={email}
                            onChange={(event) => setEmail(event.target.value)}
                            required
                          />
                        </div>
                      </div>
                    </div>

                    <div className="divider row" />

                    <div className="d-flex align-items-center">
                      <button
                        type="button"
                        className="btn-lg btn btn-link"
                        onClick={() => router.push("/login")}
                      >
                        Back to Login
                      </button>

                      <div className="ml-auto">
                        <button
                          type="submit"
                          className="btn-hover-shine btn-shadow btn btn-primary btn-lg"
                        >
                          Send Code
                        </button>
                      </div>
                    </div>
                  </form>
                )}

                {step === "otp" && (
                  <form onSubmit={handleVerifyOtp}>
                    <div className="alert alert-info">
                      Verification code has been sent to:
                      <br />
                      <strong>{email}</strong>
                    </div>

                    <div className="form-row">
                      <div className="col-md-12">
                        <div className="position-relative form-group">
                          <label htmlFor="otpCode">Verification Code</label>
                          <input
                            name="otpCode"
                            id="otpCode"
                            placeholder="123456"
                            type="text"
                            inputMode="numeric"
                            maxLength={6}
                            className="form-control text-center forgot-password-otp-input"
                            value={otpCode}
                            onChange={(event) => {
                              const value = event.target.value.replace(
                                /\D/g,
                                "",
                              );

                              setOtpCode(value);
                            }}
                            required
                          />

                          <small className="form-text text-muted">
                            Testing code: <strong>123456</strong>
                          </small>
                        </div>
                      </div>
                    </div>

                    <div className="divider row" />

                    <div className="d-flex align-items-center">
                      <button
                        type="button"
                        className="btn-lg btn btn-link"
                        onClick={() => {
                          setErrorMessage("");
                          setOtpCode("");
                          setStep("email");
                        }}
                      >
                        Change Email
                      </button>

                      <div className="ml-auto">
                        <button
                          type="submit"
                          className="btn-hover-shine btn-shadow btn btn-primary btn-lg"
                          disabled={otpCode.length !== 6}
                        >
                          Verify Code
                        </button>
                      </div>
                    </div>
                  </form>
                )}

                {step === "reset" && (
                  <form onSubmit={handleResetPassword}>
                    <div className="form-row">
                      <div className="col-md-6">
                        <div className="position-relative form-group">
                          <label htmlFor="newPassword">New Password</label>

                          <div className="input-group">
                            <input
                              name="newPassword"
                              id="newPassword"
                              placeholder="Password here..."
                              type={showNewPassword ? "text" : "password"}
                              className="form-control"
                              value={newPassword}
                              onChange={(event) =>
                                setNewPassword(event.target.value)
                              }
                              required
                            />

                            <div className="input-group-append">
                              <button
                                type="button"
                                className="btn btn-outline-secondary"
                                onClick={() =>
                                  setShowNewPassword((prev) => !prev)
                                }
                                aria-label={
                                  showNewPassword
                                    ? "Hide password"
                                    : "Show password"
                                }
                              >
                                <i
                                  className={
                                    showNewPassword
                                      ? "fa fa-eye-slash"
                                      : "fa fa-eye"
                                  }
                                />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="col-md-6">
                        <div className="position-relative form-group">
                          <label htmlFor="confirmPassword">
                            Repeat Password
                          </label>

                          <div className="input-group">
                            <input
                              name="confirmPassword"
                              id="confirmPassword"
                              placeholder="Repeat password here..."
                              type={showConfirmPassword ? "text" : "password"}
                              className="form-control"
                              value={confirmPassword}
                              onChange={(event) =>
                                setConfirmPassword(event.target.value)
                              }
                              required
                            />

                            <div className="input-group-append">
                              <button
                                type="button"
                                className="btn btn-outline-secondary"
                                onClick={() =>
                                  setShowConfirmPassword((prev) => !prev)
                                }
                                aria-label={
                                  showConfirmPassword
                                    ? "Hide password"
                                    : "Show password"
                                }
                              >
                                <i
                                  className={
                                    showConfirmPassword
                                      ? "fa fa-eye-slash"
                                      : "fa fa-eye"
                                  }
                                />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="divider row" />

                    <div className="d-flex align-items-center">
                      <button
                        type="button"
                        className="btn-lg btn btn-link"
                        onClick={() => {
                          setErrorMessage("");
                          setStep("otp");
                        }}
                      >
                        Back
                      </button>

                      <div className="ml-auto">
                        <button
                          type="submit"
                          className="btn-hover-shine btn-shadow btn btn-primary btn-lg"
                        >
                          Reset Password
                        </button>
                      </div>
                    </div>
                  </form>
                )}
              </div>
            </div>

            <div className="d-none d-lg-block col-lg-4">
              <div className="slider-light">
                <div className="slick-slider">
                  <div>
                    <div
                      className="position-relative h-100 d-flex justify-content-center align-items-center bg-premium-dark"
                      tabIndex={-1}
                    >
                      <div
                        className="slide-img-bg"
                        style={{
                          backgroundImage:
                            "url('/assets/images/originals/audit2.jpg')",
                        }}
                      />

                      <div className="slider-content">
                        <h3>Secure Password Recovery</h3>
                        <p>
                          Reset password akun Internal Audit System dengan
                          verifikasi kode keamanan 6 digit.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
