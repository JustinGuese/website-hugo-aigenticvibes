# Product Landing Page Tracking Implementation

## Overview

This document describes the tracking implementation for product landing pages on the AIgenticVibes.com website. The tracking system uses Google Tag Manager (GTM) with custom dataLayer events to track user interactions, particularly for pilot subscriptions, waitlist submissions, and Stripe purchase button clicks. Events are sent to multiple platforms: Google Analytics 4 (GA4), Facebook Pixel (browser + Conversions API), and Google Ads.

## Architecture

### Components

1. **Frontend Implementation** - HTML templates with tracking attributes and JavaScript event handlers
2. **DataLayer Events** - Custom events pushed to `window.dataLayer`
3. **Google Tag Manager** - Variables, triggers, and tags that capture and forward events to multiple platforms
4. **Analytics Platforms**:
   - **Google Analytics 4 (GA4)** - Web analytics
   - **Facebook Pixel** - Browser-side tracking + Conversions API (server-side)
   - **Google Ads** - Conversion tracking

## Frontend Implementation

### File Locations

- **Product Pages**: `themes/darkrise-hugo/layouts/product/single.html`
- **Live Product Pages**: `themes/darkrise-hugo/layouts/liveproducts/single.html`
- **GTM Configuration**: `themes/darkrise-hugo/layouts/partials/essentials/head.html` (GTM script + Meta Pixel)
- **GTM Import File**: `gtm-import.json` (contains all GTM variables, triggers, and tags)

### Tracking Implementation Pattern

Each trackable element uses a **dual-tracking approach**:

1. **Data Attributes** (`data-gtm-*`) - For GTM auto-tracking
2. **onclick/onsubmit Handlers** - Direct `dataLayer.push()` calls for immediate tracking

### Example Implementation

```html
<a href="{{ $fastlaneHref }}" 
   target="_blank" 
   rel="noopener" 
   data-gtm-click="fastlane-purchase"
   data-gtm-location="pilot-section"
   data-gtm-price="{{ default "299€" .Params.fastlane_price }}"
   onclick="if(typeof dataLayer !== 'undefined'){dataLayer.push({'event': 'fastlane_purchase_click', 'button_location': 'pilot-section', 'price': '{{ default "299€" .Params.fastlane_price }}', 'product_url': '{{ $productURL }}'});}">
  Unlock Fastlane
</a>
```

## Tracked Events

### 1. Fastlane Purchase Click (`fastlane_purchase_click`)

**Triggered by**: Stripe/Fastlane purchase button clicks

**Data Sent**:
- `button_location`: Location on page (`pilot-section`, `final-cta`)
- `price`: Price value (e.g., `"299€"`)
- `product_url`: Full URL of the product page
- `value`: Numeric price value (e.g., `299`) - NEW
- `currency`: Currency code (e.g., `"EUR"`) - NEW
- `event_id`: UUID v4 for event deduplication - NEW
- `event_time`: Unix timestamp - NEW

**Implementation Locations**:
- `product/single.html` lines ~190 (pilot section) and ~615 (final CTA)
- Uses `$fastlaneHref` variable which includes product URL as query parameter

**GTM Configuration**:
- **Trigger**: Custom Event - `fastlane_purchase_click` (triggerId: 4)
- **Tags**:
  - `GA4 - Fastlane Purchase Click` - Sends to GA4
  - `Facebook Pixel - InitiateCheckout Event` - Browser-side Facebook tracking
  - `Facebook Conversions API - InitiateCheckout Event` - Server-side Facebook tracking
  - `Google Ads - Purchase Conversion` - Google Ads conversion tracking
- **Variables Used**: Button Location, Price, Product URL, Value, Currency, Event ID, Event Time

### 2. Waitlist Submit (`waitlist_submit`)

**Triggered by**: Waitlist form submissions (Formspree)

**Data Sent**:
- `form_location`: Location on page (`pilot-section`, `final-cta`)
- `product_url`: Full URL of the product page
- `email`: User email address (for Conversions API) - NEW
- `phone`: User phone number, optional (for Conversions API) - NEW
- `event_id`: UUID v4 for event deduplication - NEW
- `event_time`: Unix timestamp - NEW

**Implementation Locations**:
- `product/single.html` lines ~162 (pilot section form) and ~632 (final CTA form)
- Forms submit to `https://formspree.io/f/xkglrelp`
- Uses `onsubmit` handler to push event before form submission

**GTM Configuration**:
- **Trigger**: Custom Event - `waitlist_submit` (triggerId: 15)
- **Tags**:
  - `GA4 - Waitlist Submit` - Sends to GA4
  - `Facebook Pixel - Lead Event` - Browser-side Facebook tracking
  - `Facebook Conversions API - Lead Event` - Server-side Facebook tracking
  - `Google Ads - Lead Conversion` - Google Ads conversion tracking
- **Variables Used**: Form Location, Product URL, Email, Phone, Event ID, Event Time

### 3. Pilot CTA Click (`pilot_cta_click`)

**Triggered by**: "Try the pilot now" button clicks (anchor link to `#pilot-access`)

**Data Sent**:
- `button_location`: Always `"banner"`
- `product_url`: Full URL of the product page

**Implementation Locations**:
- `product/single.html` lines ~83
- Only appears if `$.Params.pilot_full.enable` is true

**GTM Configuration**:
- **Trigger**: Custom Event - `pilot_cta_click`
- **Tag**: Custom HTML tag that calls `gtag('event', 'pilot_cta_click', {...})`
- **Variables Used**: Button Location, Product URL

### 4. Waitlist Toggle (`waitlist_toggle`)

**Triggered by**: Button that expands/collapses the waitlist form

**Data Sent**:
- `location`: Location where toggle occurred (`final-cta`)

**Implementation Locations**:
- `product/single.html` line ~625
- Toggles visibility of `#waitlist-form-final` element

**GTM Configuration**:
- **Trigger**: Custom Event - `waitlist_toggle`
- **Tag**: Custom HTML tag that calls `gtag('event', 'waitlist_toggle', {...})`
- **Variables Used**: Button Location

### 5. Primary CTA Click (`primary_cta_click`)

**Triggered by**: Main CTA buttons on live product pages

**Data Sent**:
- `button_location`: Location on page (`banner`, `banner-after-media`)
- `button_label`: Text content of the button
- `product_url`: Full URL of the product page

**Implementation Locations**:
- `liveproducts/single.html` lines ~72 (banner) and ~142 (after media)
- Only tracks the first button (`eq $index 0`) in the banner

**GTM Configuration**:
- **Trigger**: Custom Event - `primary_cta_click`
- **Tag**: Custom HTML tag that calls `gtag('event', 'primary_cta_click', {...})`
- **Variables Used**: Button Location, Button Label, Product URL

### 6. Custom Development Click (`custom_development_click`)

**Triggered by**: Custom development section buttons ("Build something similar", "Request Feature")

**Data Sent**:
- `action`: Type of action (`"build"` or `"features"`)
- `product_url`: Full URL of the product page

**Implementation Locations**:
- `liveproducts/single.html` lines ~640 (build) and ~657 (features)

**GTM Configuration**:
- **Trigger**: Custom Event - `custom_development_click`
- **Tag**: Custom HTML tag that calls `gtag('event', 'custom_development_click', {...})`
- **Variables Used**: Action, Product URL

## GTM Configuration

### Variables

#### Data Layer Variables

All variables read from `dataLayer` with Data Layer Version 2:

1. **Button Location** (variableId: 5) - Reads `button_location` from dataLayer
2. **Form Location** (variableId: 8) - Reads `form_location` from dataLayer
3. **Price** (variableId: 3) - Reads `price` from dataLayer
4. **Product URL** (variableId: 6) - Reads `product_url` from dataLayer
5. **Button Label** (variableId: 13) - Reads `button_label` from dataLayer
6. **Action** (variableId: 10) - Reads `action` from dataLayer
7. **Email** (variableId: 24) - Reads `email` from dataLayer - NEW
8. **Phone** (variableId: 25) - Reads `phone` from dataLayer - NEW
9. **Event ID** (variableId: 26) - Reads `event_id` from dataLayer - NEW
10. **Event Time** (variableId: 27) - Reads `event_time` from dataLayer - NEW
11. **Value** (variableId: 28) - Reads `value` from dataLayer - NEW
12. **Currency** (variableId: 29) - Reads `currency` from dataLayer - NEW

#### Constant Variables

1. **gads-id** (variableId: 21) - Google Ads Conversion ID: `AW-17789333828`
2. **Facebook Pixel ID** (variableId: 22) - Facebook Pixel ID: `1412422067210865` - NEW
3. **Facebook Conversions API Token** (variableId: 23) - Access token for Conversions API - NEW

### Triggers

All triggers are **Custom Event** triggers that fire when specific events are pushed to dataLayer:

- `Fastlane Purchase Click` - Fires on `fastlane_purchase_click`
- `Waitlist Submit` - Fires on `waitlist_submit`
- `Pilot CTA Click` - Fires on `pilot_cta_click`
- `Waitlist Toggle` - Fires on `waitlist_toggle`
- `Primary CTA Click` - Fires on `primary_cta_click`
- `Custom Development Click` - Fires on `custom_development_click`

### Tags

All tags are **Custom HTML** tags that use `gtag()` to send events to GA4. Each tag:

1. Checks if `gtag` is available
2. Calls `gtag('event', '<event_name>', {<parameters>})`
3. Uses GTM variables (e.g., `{{Button Location}}`) which are replaced at runtime

**Tag Names**:
- `GA4 - Fastlane Purchase Click` (tagId: 7)
- `GA4 - Waitlist Submit` (tagId: 18)
- `GA4 - Pilot CTA Click` (tagId: 17)
- `GA4 - Waitlist Toggle` (tagId: 20)
- `GA4 - Primary CTA Click` (tagId: 14)
- `GA4 - Custom Development Click` (tagId: 11)
- `Google Tag (Ads)` (tagId: 22) - Base Google Ads tag
- `Facebook Pixel - Lead Event` (tagId: 23) - NEW
- `Facebook Pixel - InitiateCheckout Event` (tagId: 24) - NEW
- `Facebook Conversions API - Lead Event` (tagId: 25) - NEW
- `Facebook Conversions API - InitiateCheckout Event` (tagId: 26) - NEW
- `Google Ads - Lead Conversion` (tagId: 27) - NEW
- `Google Ads - Purchase Conversion` (tagId: 28) - NEW

## Data Flow

```
User Action (Click/Submit)
    ↓
HTML Element (onclick/onsubmit handler)
    ↓
dataLayer.push({event: 'event_name', ...data})
    ↓
GTM Trigger (Custom Event) fires
    ↓
Multiple Tags Fire in Parallel:
    ├─ GA4 Tag → Google Analytics 4
    ├─ Facebook Pixel Tag → Facebook (browser)
    ├─ Facebook Conversions API Tag → Facebook (server)
    └─ Google Ads Tag → Google Ads
```

## Key Variables Used

### Hugo Template Variables

- `$productURL` - Full permalink of the current product page
- `$fastlaneHref` - Stripe checkout URL with product URL as query parameter
- `$.Params.fastlane_price` - Price from page front matter (defaults to "299€")
- `$.Params.pilot_full.*` - Pilot section configuration from front matter

### DataLayer Variables

All events push data to `window.dataLayer` with this structure:

```javascript
{
  event: '<event_name>',
  button_location: '<location>',  // Optional
  form_location: '<location>',     // Optional
  price: '<price>',                // Optional
  product_url: '<url>',            // Optional
  button_label: '<label>',         // Optional
  action: '<action>',              // Optional
  location: '<location>',          // Optional (for waitlist_toggle)
  email: '<email>',                // NEW - Optional (for Conversions API)
  phone: '<phone>',                // NEW - Optional (for Conversions API)
  event_id: '<uuid>',              // NEW - For event deduplication
  event_time: <timestamp>,         // NEW - Unix timestamp
  value: <number>,                 // NEW - Numeric price value
  currency: '<code>'               // NEW - Currency code (e.g., 'EUR')
}
```

## Adding New Tracking

### To Add a New Trackable Element

1. **Add data attributes and onclick handler** to the HTML element:
   ```html
   <button 
     data-gtm-click="my-new-action"
     data-gtm-location="my-section"
     onclick="if(typeof dataLayer !== 'undefined'){dataLayer.push({'event': 'my_new_action', 'location': 'my-section', 'product_url': '{{ $productURL }}'});}">
     Click Me
   </button>
   ```

2. **Create GTM Variable** (if needed):
   - Go to Variables → New
   - Type: Data Layer Variable
   - Data Layer Variable Name: `location` (or whatever you're tracking)
   - Save

3. **Create GTM Trigger**:
   - Go to Triggers → New
   - Type: Custom Event
   - Event name: `my_new_action`
   - Save

4. **Create GTM Tag**:
   - Go to Tags → New
   - Type: Custom HTML
   - HTML:
     ```html
     <script>
       if (typeof gtag !== 'undefined') {
         gtag('event', 'my_new_action', {
           'location': '{{Location}}',
           'product_url': '{{Product URL}}'
         });
       }
     </script>
     ```
   - Triggering: Select your new trigger
   - Save

5. **Test in Preview Mode** before publishing

## Testing

### Manual Testing

1. **GTM Preview Mode**:
   - Click Preview in GTM
   - Navigate to product page
   - Click buttons/submit forms
   - Verify triggers fire and tags fire

2. **Browser Console**:
   ```javascript
   // Check dataLayer
   dataLayer
   
   // Check if gtag is available
   typeof gtag
   ```

3. **GA4 DebugView**:
   - Go to GA4 → Admin → DebugView
   - Perform actions on site
   - Verify events appear in real-time

### Automated Testing (Future)

Consider adding:
- Unit tests for dataLayer events
- E2E tests that verify GTM tags fire
- Integration tests with GA4 Measurement Protocol

## Important Notes

### Dependencies

- **Google Tag Manager** must be loaded (via `head.html`)
- **Google Analytics 4** must be configured (either via GTM or directly)
- **gtag()** function must be available for Custom HTML tags to work

### Browser Compatibility

- Uses standard `dataLayer.push()` - compatible with all modern browsers
- Checks for `typeof dataLayer !== 'undefined'` before pushing
- Checks for `typeof gtag !== 'undefined'` in Custom HTML tags

### Performance

- Events are pushed asynchronously
- No blocking operations
- Minimal performance impact

### Privacy/Compliance

- All tracking respects user consent (if cookie consent is implemented)
- **Email/Phone Hashing**: For Facebook Conversions API, email and phone numbers are SHA-256 hashed before sending
- **Event Deduplication**: Browser and server events use the same `event_id` to prevent double-counting
- **PII Handling**: Email and phone are only used for Conversions API hashing and are not stored in plain text
- Product URLs are tracked but don't contain sensitive data
- **GDPR Considerations**: User data is hashed before transmission to Facebook Conversions API

## Troubleshooting

### Events Not Firing

1. Check browser console for JavaScript errors
2. Verify `dataLayer` exists: `typeof dataLayer !== 'undefined'`
3. Check GTM Preview mode to see if triggers fire
4. Verify GTM container is published

### Events Not Appearing in GA4

1. Verify GA4 is configured correctly
2. Check GA4 DebugView for real-time events
3. Wait a few minutes (there can be delays)
4. Verify `gtag` is available: `typeof gtag !== 'undefined'`

### Variables Not Populating

1. Check GTM Preview mode - variables should show values
2. Verify dataLayer structure matches variable names
3. Check Data Layer Version is set to 2 in variable configuration

## File Structure

```
themes/darkrise-hugo/layouts/
├── product/
│   └── single.html          # Product page template with tracking
├── liveproducts/
│   └── single.html          # Live product page template with tracking
└── partials/essentials/
    └── head.html            # GTM script initialization

gtm-import.json               # GTM container export with all tracking config
```

## Related Documentation

- [GTM Import Instructions](./GTM-IMPORT-INSTRUCTIONS.md) - How to import GTM configuration
- Google Tag Manager Documentation: https://support.google.com/tagmanager
- Google Analytics 4 Documentation: https://support.google.com/analytics/answer/10089681

## Maintenance

### When Adding New Product Pages

1. Ensure page uses `product/single.html` or `liveproducts/single.html` template
2. Add front matter parameters as needed:
   ```yaml
   pilot_full:
     enable: true
     fastlane_price: "299€"
   ```
3. Tracking will automatically work if template is used

### When Modifying Tracking

1. Update HTML templates with new tracking attributes/handlers
2. Update GTM configuration (variables, triggers, tags)
3. Export updated GTM container to `gtm-import.json`
4. Test thoroughly before publishing

## Facebook Pixel Integration

### Base Pixel Code

The Meta Pixel base code is loaded in `themes/darkrise-hugo/layouts/partials/essentials/head.html`:
- **Pixel ID**: `1412422067210865`
- Initializes `fbq` function and tracks PageView on all pages

### Browser-Side Events

Facebook Pixel browser events are fired via GTM Custom HTML tags:

1. **Lead Event** (Formspree submissions)
   - Triggered by: `waitlist_submit` event
   - Tag: `Facebook Pixel - Lead Event` (tagId: 23)
   - Includes `eventID` for deduplication

2. **InitiateCheckout Event** (Stripe clicks)
   - Triggered by: `fastlane_purchase_click` event
   - Tag: `Facebook Pixel - InitiateCheckout Event` (tagId: 24)
   - Includes `value`, `currency`, and `eventID`

### Conversions API (Server-Side)

Facebook Conversions API sends events directly from the server to improve tracking accuracy and reduce ad blockers' impact.

**Configuration**:
- **Pixel ID**: `1412422067210865`
- **Access Token**: Stored in GTM constant variable (variableId: 23)
- **API Endpoint**: `https://graph.facebook.com/v21.0/{PIXEL_ID}/events`

**Events Sent**:

1. **Lead Event** (Formspree submissions)
   - Tag: `Facebook Conversions API - Lead Event` (tagId: 25)
   - Sends hashed email and phone (SHA-256)
   - Includes `event_id` matching browser event for deduplication
   - Uses CryptoJS library for hashing (loaded via CDN)

2. **InitiateCheckout Event** (Stripe clicks)
   - Tag: `Facebook Conversions API - InitiateCheckout Event` (tagId: 26)
   - Sends `value` and `currency` in `custom_data`
   - Includes `event_id` matching browser event for deduplication

**Event Deduplication**:
- Browser and server events use the same `event_id` (UUID v4)
- Facebook automatically deduplicates events with matching `event_id` and `event_name`
- Prevents double-counting when both browser and server events fire

**User Data Hashing**:
- Email: Lowercased, trimmed, then SHA-256 hashed
- Phone: Digits only, then SHA-256 hashed
- Hashing is done client-side using CryptoJS library

## Google Ads Integration

### Configuration

- **Conversion ID**: `AW-17789333828`
- Stored in GTM constant variable `gads-id` (variableId: 21)

### Conversion Events

1. **Lead Conversion** (Formspree submissions)
   - Tag: `Google Ads - Lead Conversion` (tagId: 27)
   - Trigger: `waitlist_submit` event
   - Conversion Label: `iAevCJqj7dwbEMTizqJC` (configured)
   - Value: 0 (no monetary value for leads)

2. **Purchase Conversion** (Stripe clicks)
   - Tag: `Google Ads - Purchase Conversion` (tagId: 28)
   - Trigger: `fastlane_purchase_click` event
   - Conversion Label: `wmTeCNeW-9wbEMTizqJC` (configured)
   - Value: Extracted from price string (e.g., "299€" → 299)
   - Currency: EUR (default)

## Helper Functions

JavaScript helper functions are defined in `product/single.html`:

### `generateEventId()`
Generates a UUID v4 for event deduplication. Used for both browser and server events.

### `extractPriceValue(priceString)`
Extracts numeric value from price strings like "299€" or "299,00€". Returns 0 if parsing fails.

**Example**:
```javascript
extractPriceValue("299€") // Returns 299
extractPriceValue("299,50€") // Returns 299.5
```

## Version History

- **2025-12-08**: Initial tracking implementation
  - Added tracking for Fastlane purchases, waitlist submissions, pilot CTAs
  - Implemented GTM variables, triggers, and Custom HTML tags
  - Dual-tracking approach (data attributes + onclick handlers)

- **2026-01-05**: Facebook Pixel and Google Ads Integration
  - Added Meta Pixel base code to head.html
  - Implemented Facebook Pixel browser events (Lead, InitiateCheckout)
  - Implemented Facebook Conversions API server-side tracking
  - Added Google Ads conversion tracking tags
  - Enhanced dataLayer with email, phone, event_id, event_time, value, currency
  - Added helper functions for event ID generation and price extraction
  - Implemented event deduplication between browser and server events

