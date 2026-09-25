# Lyon Technologies — arquitectura SPA + PHP/PDO

- `index.html` se conserva sin cambios respecto al SPA anterior.
- `Modelo/modelo.js` reemplaza `localStorage` por `fetch` hacia PHP.
- `api/database.php` usa PDO y conecta a `Tienda_Electrodomesticos`.
- Cada módulo tiene su endpoint PHP independiente.
- Importa `sql/schema.sql` en phpMyAdmin si necesitas crear las tablas de esta versión.
- Coloca la carpeta `proyecto` dentro de `htdocs` (XAMPP) y abre `http://localhost/proyecto/`.
- Si tu base ya existe con columnas diferentes, no ejecutes el CREATE TABLE a ciegas: ajusta el SQL a tu esquema real.
