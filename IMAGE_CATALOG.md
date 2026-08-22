# Existing image catalog

This project already contains product photography under `public/images/Buy Ethnic Summer Dresses for Men & Women Online_ KALKI Fashion India_files/`.

A catalog loader was added:
- Admin dashboard: **Load Image Catalog**
- Command line: `npm run seed:catalog`

It is idempotent: products are checked by their image path, so running it again does not duplicate the seeded products.

The loader creates/uses these categories:
- Sarees
- Women Ethnic
- Festive
- Men
- Indo Western

The product records point to the existing local images; no external image URLs are required.
