// Declaración mínima para Layout.jsx
// Esto elimina el error TS7016 y permite importar Layout como cualquier componente React.
declare module "../../components/Layout" {
  import * as React from "react";
  const Layout: React.ComponentType<any>;
  export default Layout;
}
