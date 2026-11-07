# Branding assets

The original logo reference images were not included with the prompt package that was provided in this workspace. To preserve the supplied artwork's Arabic calligraphy exactly, place the original files here before launch:

- `wordmark-original.png` (wide black-and-white wordmark)
- `emblem-original.png` (open Qur'an on a rehal with laurel wreath)

The web app currently uses a clearly labelled placeholder monogram (`frontend/public/branding/emblem-placeholder.svg`) and text wordmark. It does **not** reproduce or invent the Arabic calligraphy. To use the real emblem, copy the supplied image to `frontend/public/branding/emblem.png` and (optionally) set `NEXT_PUBLIC_LOGO_URL=/branding/emblem.png` in `frontend/.env.local`. Keep the original monochrome file unchanged. Create any alternate variants only by safe cropping/background removal, not by redrawing or distorting the mark.

Do not use random stock photos for students, staff, or the campus. Replace demo content in the admin dashboard with verified materials.
