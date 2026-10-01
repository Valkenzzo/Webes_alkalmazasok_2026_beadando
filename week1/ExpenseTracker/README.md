# FinTrack – React + TypeScript + Vite prototípus

Magyar nyelvű, reszponzív pénzügyi dashboard fiktív tranzakciókhoz, kategóriákhoz és havi költségkeretekhez.

## Funkciók
- Új kiadás felvétele: megnevezés, kategória, összeg, dátum
- Új kategória felvétele
- Tranzakciólista kategóriaszűrővel
- Kategóriánkénti költési összesítés
- Havi költségkeretek vizuális követése
- `localStorage` alapú perzisztencia oldalfrissítés után
- Reszponzív desktop/tablet/mobil elrendezés
- Nincs backend és nincs valódi bejelentkezés

## Forráskód felépítése
- `src/App.tsx`: alkalmazásállapot, navigáció és nézetek összekötése
- `src/components/`: navigáció, pénzügyi nézetek és adatfelviteli modálisok
- `src/data.ts`: kezdőadatok, formázás és pénzügyi összesítések
- `src/storage.ts`: ellenőrzött localStorage betöltés és mentés
- `src/types.ts`: közös domain típusok
- `src/main.tsx`: React alkalmazás indítása
- `src/styles.css`: reszponzív felület stílusai

## Indítás
```bash
npm install
npm run dev
```

Build:
```bash
npm run build
```
