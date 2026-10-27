# NexaSocial Instagram OAuth Setup & Troubleshooting Guide

## Overview

NexaSocial connects to Instagram using the **Instagram API with Instagram Login** (Business Login for Instagram). This enables users to connect their Instagram Professional (Creator or Business) accounts to schedule content, stream live via Live Producer, and track engagement analytics.

---

## 1. Selected Instagram Login Flow Architecture

| Parameter | Value |
|---|---|
| **Product Flow** | Instagram API with Instagram Login (Business Login for Instagram) |
| **Meta App ID** | `3692821807549687` |
| **Instagram Client ID (App ID)** | `990277277374737` |
| **Authorization Endpoint** | `https://www.instagram.com/oauth/authorize` |
| **Token Exchange Endpoint** | `POST https://api.instagram.com/oauth/access_token` |
| **Long-Lived Token Endpoint** | `GET https://graph.instagram.com/access_token?grant_type=ig_exchange_token` |
| **Graph API User Endpoint** | `GET https://graph.instagram.com/v22.0/me` |
| **Permissions / Scope** | `instagram_business_basic` |
| **Backend Callback Route** | `/api/social/callback/instagram` |

> [!IMPORTANT]
> **Do not confuse the two Meta flows:**
> 1. **Instagram API with Instagram Login** (used here): Uses Instagram Client ID `990277277374737`, endpoint `https://www.instagram.com/oauth/authorize`, and callback registered under **Instagram > API setup with Instagram login > Business login settings**.
> 2. **Facebook Login for Instagram**: Uses Meta App ID `3692821807549687`, endpoint `https://www.facebook.com/v.../dialog/oauth`, and settings under Facebook Login.
> Never mix the credentials, endpoints, or settings between these two flows.

---

## 2. Root Cause of "Invalid redirect_uri" Error

When you click **Connect Instagram**, the application redirects your browser to:
```
https://www.instagram.com/oauth/authorize?client_id=990277277374737&redirect_uri=<REDIRECT_URI>&scope=instagram_business_basic&response_type=code&state=<STATE>
```

Instagram returns:
```
Invalid request: Request parameters are invalid: Invalid redirect_uri
```
when the `<REDIRECT_URI>` parameter sent in the authorization request does not **character-for-character** match any URI in the **Valid OAuth Redirect URIs** list under your Instagram App in the Meta Developer Dashboard.

### Common Mismatches:
1. **Registered `http://localhost` while sending `https://<ngrok-tunnel>` (or vice versa)**:
   Meta's Instagram Business Login strictly checks the scheme (`http` vs `https`) and hostname (`localhost` vs tunnel).
2. **Dynamic Ngrok Tunnel Subdomain**:
   If ngrok restarts without a static domain, it assigns a random URL (e.g., `rubbing-grasp-subscript.ngrok-free.dev`). If this new URL is not added to the Meta Developer Dashboard, Meta immediately rejects it.
3. **Wrong Meta Settings Page**:
   Registering the URI under **Facebook Login > Settings** instead of **Instagram > API setup with Instagram login > Business login settings**.
4. **Trailing Slash Mismatch**:
   Meta treats `/api/social/callback/instagram` and `/api/social/callback/instagram/` as different URIs.

---

## 3. Required Meta Developer Dashboard Configuration

Follow these steps to register your callback URL in Meta:

1. Open [Meta for Developers](https://developers.facebook.com/apps/) and select your App (**NexaSocial**, App ID: `3692821807549687`).
2. In the left sidebar, navigate to:
   - **Instagram** (or **Use cases** -> **Instagram**)
   - Click **API setup with Instagram login**
   - Under **3. Set up Instagram business login**, click **Business login settings** (or **Settings**).
3. In the **Valid OAuth Redirect URIs** field, enter your active canonical callback URI:
   ```
   https://rubbing-grasp-subscript.ngrok-free.dev/api/social/callback/instagram
   ```
   *(If you also test with localhost and Meta permits it in your app version, you can additionally add: `http://localhost:5000/api/social/callback/instagram`)*
4. Ensure:
   - NO trailing slash at the end.
   - Scheme matches exactly (`https://` for ngrok tunnel).
   - Path is `/api/social/callback/instagram` (port 5000 backend, not port 3000 frontend).
5. Click **Save Changes** at the bottom of the page.

---

## 4. App Roles & Instagram Testers (Development Mode)

While your Meta App is in **Development Mode**:
1. Only users with a tester role can authenticate.
2. In the Meta App Dashboard, navigate to **App Roles** -> **Roles**.
3. Under **Instagram Testers**, click **Add Instagram Testers** and enter the username of the Instagram account you wish to connect.
4. On Instagram (mobile app or web):
   - Go to **Settings & Privacy** -> **Website permissions** -> **Apps and Websites** -> **Tester Invites**.
   - Accept the invite for your app.
5. The account must be an **Instagram Professional (Creator or Business) Account** to be eligible for Instagram Live Producer streaming.

---

## 5. Server Preflight Diagnostics

You can verify the active configuration at any time by calling the preflight endpoint:
```http
GET http://localhost:5000/api/social/preflight/instagram
```
This returns:
```json
{
  "flow": "Instagram API with Instagram Login (Business Login for Instagram)",
  "authHost": "https://www.instagram.com",
  "authPath": "/oauth/authorize",
  "maskedClientId": "***********4737",
  "hasClientSecret": true,
  "canonicalRedirectUri": "https://rubbing-grasp-subscript.ngrok-free.dev/api/social/callback/instagram",
  "backendCallbackRoute": "/api/social/callback/instagram",
  "tokenExchangeUri": "https://rubbing-grasp-subscript.ngrok-free.dev/api/social/callback/instagram",
  "scheme": "https",
  "hostname": "rubbing-grasp-subscript.ngrok-free.dev",
  "port": "443",
  "path": "/api/social/callback/instagram",
  "hasTrailingSlash": false,
  "isHttps": true,
  "isLocalhost": false,
  "metaDashboardLocation": "Meta Developer Dashboard > Instagram > API setup with Instagram login > Business login settings > Valid OAuth Redirect URIs",
  "isValid": true,
  "errors": [],
  "diagnosticComparison": {
    "configuredMatchesCanonical": true,
    "authMatchesTokenExchange": true,
    "routeMatchesBackendRouter": true,
    "noDoubleEncoding": true
  }
}
```
If `isValid` is false, the errors array lists the exact discrepancies.
