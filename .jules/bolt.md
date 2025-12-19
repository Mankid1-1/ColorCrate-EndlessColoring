## 2024-05-23 - Lazy Loading Base64 Images
**Learning:** Even though `loading="lazy"` is often associated with network requests, it is also beneficial for `data:` URIs (Base64). It defers the image decoding and rasterization process until the image is near the viewport, which reduces main thread blocking time during initial render of large lists/grids.
**Action:** Apply `loading="lazy"` and `decoding="async"` to all potentially large images, even if they are served via data URLs, to improve interaction readiness.
