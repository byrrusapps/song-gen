// src\entry-server.tsx

import { createHandler, StartServer } from "@solidjs/start/server";
// const baseUrl = "https://solid-project.web.app";

export default createHandler(() => (
  <StartServer
    document={({ assets, children, scripts }) => (
      <html lang="en">
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="theme-color" content="" id="meta-theme" />
    <title>{import.meta.env.VITE_NAME}</title>

  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Rounded:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200" />
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200" />
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Sharp:opsz,wght,FILL,GRAD@20..48,100..700,1,-50..200" />
<link href="https://fonts.googleapis.com/css2?family=Akt&family=Google+Sans&family=Pliant&family=Sarina&family=Onest&family=Herr+Von+Muellerhoff&display=swap" rel="stylesheet" />
<link href="https://fonts.googleapis.com/icon?family=Material+Icons"
      rel="stylesheet" />
          {assets}

          {/* JSON-LD Structured Data for Google */}
<script type="application/ld+json">
</script>

        </head>
        <body>
          <div id="root">{children}</div>
          {scripts}
        </body>
      </html>
    )}
  />
));