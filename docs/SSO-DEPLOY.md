# SSO login (map + mvc-web-sso)

## Flow

1. User clicks login → `https://auth.sabzevar.ir/Account/Login?returnUrl=https://map.sabzevar.ir/auth/callback`
2. After OTP/MOI success, portal redirects to `/auth/callback?token=...` (requires mvc `Frontend:AllowedCallbackUrls`).
3. Map stores JWT and calls `/api/auth/me` via same-origin `/sso-api`.

## Environment (map)

See `.env.example`: `NEXT_PUBLIC_SSO_WEB_URL`, `NEXT_PUBLIC_AUTH_CALLBACK_URL`, `NEXT_PUBLIC_SSO_API_URL=/sso-api`.

## nginx (production)

If Next.js rewrites are not used at the edge, proxy loginsso before the app:

```nginx
location /sso-api/ {
    proxy_pass https://apiweb-loginsso.sabzevar.ir/;
    proxy_set_header Host apiweb-loginsso.sabzevar.ir;
}
```

Alternatively enable CORS on loginsso for `https://map.sabzevar.ir` and set `NEXT_PUBLIC_SSO_API_URL=https://apiweb-loginsso.sabzevar.ir`.

## mvc-web-sso

Deploy with `Frontend:AllowedCallbackUrls` including `https://map.sabzevar.ir/auth/callback` before map frontend that expects `?token=` on callback.
