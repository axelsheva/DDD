psql --host=localhost -f install.sql -U app
PGPASSWORD=marcus psql --host=localhost -d example -f structure.sql -U marcus
PGPASSWORD=marcus psql --host=localhost -d example -f data.sql -U marcus
