import express, { Request, Response, json } from 'express';
import dbInfo from './config.js';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { getTableColumns } from 'drizzle-orm';
import { usersTable } from './schemas/db.js';
import { validatedUsers } from './schemas/user.js';

const app = express();
app.use(json())
app.disable('x-powered-by')
const PORT = process.env.SERVICE_PORT ?? 3001;
const { supabaseUrl } = dbInfo;

if (!supabaseUrl) {
  console.error('Error: supabaseUrl no está definido en la configuración.');
  process.exit(1);
}

const client = postgres(supabaseUrl, { debug: true, ssl: "require" });
const db = drizzle({ client });

// Endpoint para obtener los usuarios
app.get("/users", async (req: Request, res: Response): Promise<void> => {
  try {
    const data = await db.select({ ...getTableColumns(usersTable) }).from(usersTable);

    if (data.length === 0) {
      res.status(404).json({ message: "Sin existencias" });
      return;
    }

    res.status(200).json(data);
  } catch (error) {
    console.error("Error al obtener los usuarios:", error);
    res.status(500).json({ message: "Error interno del servidor" });
  }
});

app.post("/users", async (req: Request, res: Response) => {
  const user = validatedUsers(req.body)
  if (user.error) {
    res.json({ message: JSON.parse(user.error.message) })
    return
  }
  await db.insert(usersTable).values(user.data)
  res.json(user.data)

  // res.json({req.body})
})

// Ruta raíz para redirigir a /users
app.get("/", (req: Request, res: Response): void => {
  res.send(`<a href="http://localhost:${PORT}/users">Ver usuarios</a>`);
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`Server listening at http://localhost:${PORT}`);
});
