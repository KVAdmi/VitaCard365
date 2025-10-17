Este repositorio tenía un submódulo git llamado `VitaCard365` sin entrada en `.gitmodules`.

Se eliminó el gitlink del índice con:

    git rm --cached VitaCard365

Se agregó `VitaCard365/` a `.gitignore` para evitar re-trackear el directorio.

Esto evita errores de CI como: "fatal: No url found for submodule path 'VitaCard365' in .gitmodules".