"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginClient() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    console.log({
      email,
      password,
    });

    router.push("/dashboard");
  }

  return (
    <div className="app-container app-theme-white body-tabs-shadow">
      <div className="app-container">
        <div className="h-100">
          <div className="h-100 no-gutters row">
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
                            "url('/assets/images/originals/audit1.jpg')",
                        }}
                      />

                      <div className="slider-content">
                        <h3>Internal Audit System</h3>
                        <p>
                          Sistem digital untuk membantu pengelolaan audit
                          internal, finding, dan tindak lanjut CAPA secara lebih
                          terstruktur.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="h-100 d-flex bg-white justify-content-center align-items-center col-md-12 col-lg-8">
              <div className="mx-auto app-login-box col-sm-12 col-md-10 col-lg-9">
                <div className="login-logo mb-4" />

                <h4 className="mb-0">
                  <span className="d-block">Welcome back,</span>
                  <span>Please sign in to your account.</span>
                </h4>

                <h6 className="mt-3 text-muted">
                  Internal Audit System — authorized user only.
                </h6>

                <div className="divider row" />

                <form onSubmit={handleSubmit}>
                  <div className="form-row">
                    <div className="col-md-6">
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

                    <div className="col-md-6">
                      <div className="position-relative form-group">
                        <label htmlFor="password">Password</label>

                        <div className="input-group">
                          <input
                            name="password"
                            id="password"
                            placeholder="Password here..."
                            type={showPassword ? "text" : "password"}
                            className="form-control"
                            value={password}
                            onChange={(event) =>
                              setPassword(event.target.value)
                            }
                            required
                          />

                          <div className="input-group-append">
                            <button
                              type="button"
                              className="btn btn-outline-secondary"
                              onClick={() => setShowPassword((prev) => !prev)}
                              aria-label={
                                showPassword ? "Hide password" : "Show password"
                              }
                            >
                              <i
                                className={
                                  showPassword ? "fa fa-eye-slash" : "fa fa-eye"
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
                      onClick={() => router.push("/forgot-password")}
                    >
                      Forgot Password
                    </button>

                    <div className="ml-auto">
                      <button
                        type="submit"
                        className="btn btn-hover-shine btn btn-shadow btn-primary btn-lg"
                      >
                        Login
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
