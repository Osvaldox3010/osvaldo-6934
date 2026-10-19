import 'dotenv/config';
import {createApp} from "./app";

// Inicia el servidor en el puerto configurado.
const port = Number(process.env.PORT ?? 3001);

createApp().listen(port, () => {
});
