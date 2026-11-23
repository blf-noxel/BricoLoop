import { createApp } from './app.js';

const port = Number(process.env.PORT) || 4000;
createApp()
  .listen(port, () => console.log(`BricoLoop API sur http://localhost:${port}`))
  .on('error', (error) => {
    if (error.code === 'EADDRINUSE') {
      console.error(`Le port ${port} est déjà utilisé : un autre backend tourne sans doute déjà. Arrêtez-le (Ctrl+C dans son terminal) puis relancez.`);
    } else {
      console.error(error);
    }
    process.exit(1);
  });
