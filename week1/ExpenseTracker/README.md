# FinTrack

Magyar nyelvű kiadáskövető React + TypeScript + Vite felülettel és ASP.NET Core Web API háttérrel. A tranzakciók, kategóriák és havi költségkeretek PostgreSQL-adatbázisban tárolódnak. Az alkalmazás prototípus: nincs hitelesítés vagy többfelhasználós adatelkülönítés.

## Követelmények
- Node.js és npm
- .NET 10 SDK
- Elérhető PostgreSQL-adatbázis
- Telepített `dotnet-ef` eszköz (`dotnet tool install --global dotnet-ef`)

## PostgreSQL és API indítása
PowerShellben az API projekt könyvtárában állítsd be a helyi adatbázis kapcsolati adatait. A jelszó user secretsben tárolódik, nem a forráskódban:

```powershell
cd week1/ExpenseTracker/backend/ExpenseTracker.Api
dotnet user-secrets init
dotnet user-secrets set "ConnectionStrings:Default" "Host=localhost;Port=5432;Database=fintrack;Username=postgres;Password=SAJAT_HELYI_JELSZO"
dotnet ef database update
dotnet run
```

Az API a `http://localhost:5180` címen indul. A migráció létrehozza a kategória-, tranzakció- és kerettáblákat, valamint az alapértelmezett kategóriákat és költségkereteket.

## Frontend indítása
Másik terminálban, a projekt könyvtárában:

```powershell
cd week1/ExpenseTracker
npm install
npm run dev
```

A Vite `/api` proxyja az ASP.NET szerverre továbbítja a kéréseket. A backend külön terminálban indítható `npm run dev:api` paranccsal, ha a kapcsolat és az adatbázis már be van állítva.

## API
- `GET`, `POST /api/transactions`
- `GET`, `POST /api/categories`
- `POST /api/categories/import` a régi böngészős kategóriák egyszeri, ismételhető importjához
- `GET /api/budgets`
- `PUT /api/budgets/{categoryId}` egy kategória havi keretének létrehozásához vagy módosításához
- `GET /api/health`

Az alkalmazás a régi localStorage-állományból megőrzi és egyszer importálja a kategóriákat. A korábbi localStorage-tranzakciók nem kerülnek át az adatbázisba; az új tranzakciólista a PostgreSQL-ből töltődik.

## Ellenőrzés
```powershell
dotnet build backend/ExpenseTracker.Api
npm run build
```

Publikus vagy többfelhasználós telepítés előtt hitelesítést, felhasználónkénti adatelkülönítést és HTTPS-t kell hozzáadni.